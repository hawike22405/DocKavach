from flask import Blueprint, request, g
from db import get_db
from utils.response import ok, fail
from middleware.auth_required import auth_required
import datetime

history_bp = Blueprint("history", __name__, url_prefix="/api/history")


def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc


@history_bp.route("", methods=["GET"])
@auth_required
def list_history():
    db = get_db()

    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(1, int(request.args.get("limit", 20))))
    recommendation = request.args.get("recommendation")  # optional filter: APPROVE/REVIEW/REJECT
    mine_only = request.args.get("mine") == "true"

    query = {}
    if recommendation:
        query["recommendation"] = recommendation
    if mine_only:
        query["officerId"] = g.user_id

    cursor = (
        db.screenings.find(query)
        .sort("timestamp", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    records = [_serialize(d) for d in cursor]
    total = db.screenings.count_documents(query)

    return ok({"records": records, "page": page, "limit": limit, "total": total})


@history_bp.route("/<transaction_id>", methods=["GET"])
@auth_required
def get_record(transaction_id):
    db = get_db()
    record = db.screenings.find_one({"transactionId": transaction_id})
    if not record:
        return fail("Transaction not found", 404)
    return ok(_serialize(record))


@history_bp.route("/<transaction_id>/decision", methods=["POST"])
@auth_required
def set_decision(transaction_id):
    body = request.get_json(silent=True) or {}
    decision = body.get("decision")
    if decision not in ("APPROVE", "FLAG", "REJECT"):
        return fail("decision must be APPROVE, FLAG, or REJECT", 422)

    db = get_db()
    result = db.screenings.update_one(
        {"transactionId": transaction_id},
        {"$set": {
            "officerDecision": decision,
            "decidedBy": g.user_id,
            "decisionTimestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }},
    )
    if result.matched_count == 0:
        return fail("Transaction not found", 404)
    return ok(None, "Decision recorded")
