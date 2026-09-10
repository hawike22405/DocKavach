"""
GET /api/logs

Feed of everything happening in the app: logins, failed logins,
registrations, screenings run, and officer decisions made. This is what
gives you visibility into "who did what and when" across the whole team.
"""
from flask import Blueprint, request
from db import get_db
from utils.response import ok
from middleware.auth_required import auth_required

logs_bp = Blueprint("logs", __name__, url_prefix="/api/logs")


def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc


@logs_bp.route("", methods=["GET"])
@auth_required
def list_logs():
    db = get_db()

    page = max(1, int(request.args.get("page", 1)))
    limit = min(200, max(1, int(request.args.get("limit", 50))))
    action = request.args.get("action")  # optional filter: LOGIN/REGISTER/SCREENING/DECISION/LOGIN_FAILED

    query = {}
    if action:
        query["action"] = action

    cursor = (
        db.activity_logs.find(query)
        .sort("timestamp", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    records = [_serialize(d) for d in cursor]
    total = db.activity_logs.count_documents(query)

    return ok({"records": records, "page": page, "limit": limit, "total": total})
