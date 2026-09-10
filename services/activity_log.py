"""
Records who did what and when — logins, registrations, screenings,
decisions — into a single 'activity_logs' collection so an admin/team-lead
can see everything happening across the app in one feed (GET /api/logs).
"""
import datetime
from flask import request as flask_request
from db import get_db


def log_activity(action: str, officer_id: str = None, email: str = None, name: str = None, extra: dict = None):
    db = get_db()
    ip = None
    if flask_request is not None:
        ip = flask_request.headers.get("X-Forwarded-For", flask_request.remote_addr)

    entry = {
        "action": action,
        "officerId": officer_id,
        "email": email,
        "name": name,
        "ip": ip,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
    if extra:
        entry.update(extra)
    db.activity_logs.insert_one(entry)
