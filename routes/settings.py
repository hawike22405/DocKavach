from flask import Blueprint, request, g
from db import get_db
from utils.response import ok, fail
from middleware.auth_required import auth_required

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

DEFAULT_SETTINGS = {
    "stationName": "",
    "checkpointId": "",
    "autoFlagThreshold": 60,
}


@settings_bp.route("", methods=["GET"])
@auth_required
def get_settings():
    db = get_db()
    doc = db.settings.find_one({"officerId": g.user_id})
    if not doc:
        return ok({**DEFAULT_SETTINGS})
    doc.pop("_id", None)
    doc.pop("officerId", None)
    return ok(doc)


@settings_bp.route("", methods=["PUT"])
@auth_required
def update_settings():
    body = request.get_json(silent=True) or {}
    allowed = {"stationName", "checkpointId", "autoFlagThreshold"}
    update = {k: v for k, v in body.items() if k in allowed}
    if not update:
        return fail("No valid settings fields provided", 422)

    db = get_db()
    db.settings.update_one(
        {"officerId": g.user_id}, {"$set": update, "$setOnInsert": {"officerId": g.user_id}}, upsert=True
    )
    return ok(None, "Settings updated")
