import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME", "dockavach_db")
    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_EXP_HOURS = int(os.getenv("JWT_EXP_HOURS", 24))
    PORT = int(os.getenv("PORT", 5000))

if not Config.MONGO_URI:
    raise RuntimeError("MONGO_URI missing in .env")
if not Config.JWT_SECRET:
    raise RuntimeError("JWT_SECRET missing in .env")
