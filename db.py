from pymongo import MongoClient, ASCENDING, DESCENDING
from config import Config

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(Config.MONGO_URI)
        _db = _client[Config.DB_NAME]
        _ensure_indexes(_db)
    return _db

def _ensure_indexes(db):
    db.officers.create_index([("email", ASCENDING)], unique=True)
    db.screenings.create_index([("transactionId", ASCENDING)], unique=True)
    db.screenings.create_index([("timestamp", DESCENDING)])
    db.screenings.create_index([("officerId", ASCENDING)])
    db.settings.create_index([("officerId", ASCENDING)], unique=True)

def test_connection():
    try:
        db = get_db()
        db.command("ping")
        print(f"[OK] Connected to MongoDB -> {db.name}")
        return True
    except Exception as e:
        print(f"[FAIL] MongoDB connection error: {e}")
        return False

if __name__ == "__main__":
    test_connection()
