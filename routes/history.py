from flask import Blueprint, request, g
from db import get_db
from utils.response import ok, fail
from middleware.auth_required import auth_required
import datetime

history_bp = Blueprint("history", __name__, url_prefix="/api/history")
VALID_RECOMMENDATIONS = {"APPROVE", "REVIEW", "REJECT"}
VALID_DECISIONS = {"APPROVE", "FLAG", "REJECT"}


def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc


def _positive_int_arg(name: str, default: int, minimum: int, maximum: int):
    raw = request.args.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be an integer")
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")
    return value


@history_bp.route("", methods=["GET"])
@auth_required
def list_history():
    try:
        page = _positive_int_arg("page", 1, 1, 100000)
        limit = _positive_int_arg("limit", 20, 1, 100)
    except ValueError as exc:
        return fail(str(exc), 422)

    recommendation = request.args.get("recommendation")
    if recommendation and recommendation not in VALID_RECOMMENDATIONS:
        return fail("recommendation must be APPROVE, REVIEW, or REJECT", 422)

    # History is officer-scoped by default. The previous implementation
    # exposed all screening records to any authenticated officer.
    query = {"officerId": g.user_id}
    if recommendation:
        query["recommendation"] = recommendation

    db = get_db()
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
    record = db.screenings.find_one({"transactionId": transaction_id, "officerId": g.user_id})
    if not record:
        return fail("Transaction not found", 404)
    return ok(_serialize(record))


@history_bp.route("/<transaction_id>/decision", methods=["POST"])
@auth_required
def set_decision(transaction_id):
    body = request.get_json(silent=True) or {}
    decision = body.get("decision")
    if decision not in VALID_DECISIONS:
        return fail("decision must be APPROVE, FLAG, or REJECT", 422)

    db = get_db()
    result = db.screenings.update_one(
        {"transactionId": transaction_id, "officerId": g.user_id},
        {"$set": {
            "officerDecision": decision,
            "decidedBy": g.user_id,
            "decisionTimestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }},
    )
    if result.matched_count == 0:
        return fail("Transaction not found", 404)
    return ok(None, "Decision recorded")
