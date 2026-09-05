"""
POST /api/screen

This is the real implementation of the pipeline that frontend/src/lib/mockApi.ts
currently simulates. Request/response shapes match frontend/src/lib/types.ts
exactly (ScreeningRequest / ScreeningResponse) so the frontend can swap
mockApi.screenDocument() for a fetch to this endpoint with no other changes.
"""
import time
import datetime
from flask import Blueprint, request, g
from db import get_db
from utils.response import ok, fail
from utils.image_utils import decode_base64_image, ImageDecodeError
from middleware.auth_required import auth_required
from services.ocr_service import run_ocr
from services.validation_service import validate_fields
from services.tampering_service import analyze_tampering
from services.facematch_service import match_faces
from services.risk_service import compute_risk

screening_bp = Blueprint("screening", __name__, url_prefix="/api")

VALID_DOC_TYPES = {"PASSPORT", "VISA", "NATIONAL_ID"}


@screening_bp.route("/screen", methods=["POST"])
@auth_required
def screen_document():
    body = request.get_json(silent=True) or {}
    doc_b64 = body.get("documentImageBase64")
    document_type = body.get("documentType")
    live_b64 = body.get("liveFaceBase64")

    if not doc_b64:
        return fail("documentImageBase64 is required", 422)
    if document_type not in VALID_DOC_TYPES:
        return fail(f"documentType must be one of {sorted(VALID_DOC_TYPES)}", 422)

    try:
        doc_img = decode_base64_image(doc_b64)
    except ImageDecodeError as e:
        return fail(str(e), 422)

    live_img = None
    if live_b64:
        try:
            live_img = decode_base64_image(live_b64)
        except ImageDecodeError as e:
            return fail(f"liveFaceBase64: {e}", 422)

    # ---- Module 1: OCR ----
    fields, ocr_errors = run_ocr(doc_img, document_type)

    # ---- Module 4: face match (run before tampering so we can cross-reference the face box) ----
    face_match, face_box, face_note = match_faces(doc_img, live_img)

    # ---- Module 3: tampering ----
    tampering = analyze_tampering(doc_img, face_box_norm=face_box)

    # ---- Module 2: validation ----
    validation = validate_fields(fields, ocr_errors)
    if face_note:
        validation["errors"].append(face_note)
        validation["isValid"] = False

    # ---- risk + recommendation ----
    overall_risk_score, recommendation = compute_risk(
        validation, tampering, face_match, had_live_capture=live_img is not None
    )

    transaction_id = f"TXN-{int(time.time() * 1000):x}".upper()
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    response_payload = {
        "transactionId": transaction_id,
        "timestamp": timestamp,
        "overallRiskScore": overall_risk_score,
        "recommendation": recommendation,
        "module1_OCR": fields,
        "module2_Validation": validation,
        "module3_Tampering": tampering,
        "module4_FaceMatch": face_match,
    }

    # persist for the history/audit log
    db = get_db()
    db.screenings.insert_one({
        **response_payload,
        "documentType": document_type,
        "officerId": g.user_id,
        "officerDecision": None,
        "decisionTimestamp": None,
    })

    return ok(response_payload, "Screening complete")
