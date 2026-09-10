"""
Records who did what and when — logins, registrations, screenings,
decisions — into a single 'activity_logs' collection so an admin/team-lead
can see everything happening across the app in one feed (GET /api/logs).
"""
import datetime
from flask import request
from db import get_db


def log_activity(action: str, officer_id: str = None, email: str = None, name: str = None, extra: dict = None):
    db = get_db()
    entry = {
        "action": action,  # LOGIN, LOGIN_FAILED, REGISTER, SCREENING, DECISION
        "officerId": officer_id,
        "email": email,
        "name": name,
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr) if request else None,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
    if extra:
        entry.update(extra)
    db.activity_logs.insert_one(entry)
