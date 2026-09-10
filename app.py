from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from db import test_connection
from routes.auth import auth_bp
from routes.screening import screening_bp
from routes.history import history_bp
from routes.settings import settings_bp
from routes.logs import logs_bp
import pytesseract
import sys

# Windows installs often don't add Tesseract to PATH even after install.
# Rather than fighting Windows PATH edits, allow an explicit override —
# set TESSERACT_CMD in .env to the full path of tesseract.exe.
if Config.TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = Config.TESSERACT_CMD


def check_tesseract():
    try:
        pytesseract.get_tesseract_version()
    except EnvironmentError as e:
        print(
            f"WARNING: Tesseract OCR not found ({e}). "
            "The server will still start, but POST /api/screen will fail "
            "until Tesseract is installed. Every other route works normally.",
            file=sys.stderr,
        )


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

    CORS(
        app,
        resources={r"/api/*": {"origins": [Config.FRONTEND_ORIGIN]}},
        methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    limiter = Limiter(key_func=get_remote_address, default_limits=["120 per minute"], storage_uri="memory://")
    limiter.init_app(app)
    app.extensions["limiter"] = limiter

    app.register_blueprint(auth_bp)
    app.register_blueprint(screening_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(logs_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"success": True, "message": "DocKavach backend alive"}

    @app.route("/", methods=["GET"])
    def root():
        return {"success": True, "message": "DocKavach API — see /api/health for status"}

    @app.errorhandler(400)
    def bad_request(e):
        return {"success": False, "message": "Malformed request"}, 400

    @app.errorhandler(404)
    def not_found(e):
        return {"success": False, "message": "Route not found"}, 404

    @app.errorhandler(413)
    def too_large(e):
        return {"success": False, "message": "Request payload too large"}, 413

    @app.errorhandler(429)
    def rate_limited(e):
        return {"success": False, "message": "Too many requests, slow down"}, 429

    @app.errorhandler(Exception)
    def unhandled_error(e):
        app.logger.exception("Unhandled API error")
        return {"success": False, "message": "Internal server error"}, 500

    return app


if __name__ == "__main__":
    check_tesseract()
    if not test_connection():
        print("ERROR: Couldn't connect to database", file=sys.stderr)
        sys.exit(1)
    app = create_app()
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)