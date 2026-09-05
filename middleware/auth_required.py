from functools import wraps
from flask import request, g
from utils.jwt_handler import decode_token
from utils.response import fail

def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return fail("Missing or malformed Authorization header", 401)

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload is None:
            return fail("Invalid or expired token", 401)

        g.user_id = payload.get("sub")
        g.token_payload = payload
        return f(*args, **kwargs)
    return wrapper
