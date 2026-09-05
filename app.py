from flask import Flask
from flask_cors import CORS
from config import Config
from db import test_connection
from routes.auth import auth_bp
from routes.screening import screening_bp
from routes.history import history_bp
from routes.settings import settings_bp


def create_app():
    app = Flask(__name__)

    # Allow all origins for hackathon speed. Tighten to the deployed frontend
    # origin before the final demo if a judge asks about security.
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(screening_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(settings_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"success": True, "message": "DocKavach backend alive"}

    @app.errorhandler(413)
    def too_large(e):
        return {"success": False, "message": "Image payload too large"}, 413

    return app


if __name__ == "__main__":
    test_connection()
    app = create_app()
    # base64 document + selfie images can be a few MB — raise the default limit
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
    app.run(host="0.0.0.0", port=Config.PORT, debug=True)
