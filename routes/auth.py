import re
from flask import Blueprint, request, g
from db import get_db
from utils.hash import hash_password, verify_password
from utils.jwt_handler import create_token
from utils.response import ok, fail
from middleware.auth_required import auth_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MAX_NAME_LENGTH = 120
MAX_BADGE_LENGTH = 64
MIN_PASSWORD_LENGTH = 12


def _text(value, max_length):
    return value.strip() if isinstance(value, str) and len(value.strip()) <= max_length else None


@auth_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower() if isinstance(body.get("email", ""), str) else ""
    password = body.get("password", "") if isinstance(body.get("password", ""), str) else ""
    name = _text(body.get("name", ""), MAX_NAME_LENGTH)
    badge_id = _text(body.get("badgeId", ""), MAX_BADGE_LENGTH) or ""

    if not email or not EMAIL_RE.fullmatch(email) or len(email) > 254:
        return fail("A valid email address is required", 422)
    if not name:
        return fail("A valid name is required", 422)
    if len(password) < MIN_PASSWORD_LENGTH or len(password) > 128:
        return fail(f"Password must be {MIN_PASSWORD_LENGTH}-128 characters", 422)

    db = get_db()
    if db.officers.find_one({"email": email}):
        return fail("Officer already registered", 409)

    officer_doc = {
        "name": name,
        "email": email,
        "password": hash_password(password),
        "badgeId": badge_id,
    }
    result = db.officers.insert_one(officer_doc)

    token = create_token(str(result.inserted_id), {"email": email})
    return ok(
        {"token": token, "officer": {"id": str(result.inserted_id), "name": name, "email": email, "badgeId": badge_id}},
        "Registered successfully", 201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower() if isinstance(body.get("email", ""), str) else ""
    password = body.get("password", "") if isinstance(body.get("password", ""), str) else ""

    if not email or not password:
        return fail("email and password are required", 422)
    if len(email) > 254 or not EMAIL_RE.fullmatch(email):
        return fail("Invalid credentials", 401)

    db = get_db()
    officer = db.officers.find_one({"email": email})
    if not officer or not verify_password(password, officer["password"]):
        return fail("Invalid credentials", 401)

    token = create_token(str(officer["_id"]), {"email": email})
    return ok(
        {"token": token, "officer": {"id": str(officer["_id"]), "name": officer["name"], "email": email,
                                      "badgeId": officer.get("badgeId", "")}},
        "Login successful",
    )


@auth_bp.route("/me", methods=["GET"])
@auth_required
def me():
    from bson import ObjectId, errors
    try:
        officer_id = ObjectId(g.user_id)
    except (errors.InvalidId, TypeError):
        return fail("Invalid authentication subject", 401)

    db = get_db()
    officer = db.officers.find_one({"_id": officer_id}, {"password": 0})
    if not officer:
        return fail("Officer not found", 404)
    officer["_id"] = str(officer["_id"])
    return ok(officer)
