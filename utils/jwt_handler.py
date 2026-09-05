import jwt
import datetime
from config import Config

def create_token(user_id: str, extra_claims: dict = None) -> str:
    payload = {
        "sub": str(user_id),
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXP_HOURS),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

def decode_token(token: str):
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
