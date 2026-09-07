from flask import Flask, request
from flask_cors import CORS
from config import Config
from db import test_connection
from routes.auth import auth_bp
from routes.screening import screening_bp
from routes.history import history_bp
from routes.settings import settings_bp


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

    # Allow only the configured frontend origin. Set FRONTEND_ORIGIN to the
    # deployed frontend URL; localhost remains the development default.
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.FRONTEND_ORIGIN}},
        methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(screening_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(settings_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"success": True, "message": "DocKavach backend alive"}

    @app.errorhandler(413)
    def too_large(e):
        return {"success": False, "message": "Request payload too large"}, 413

    @app.errorhandler(400)
    def bad_request(e):
        return {"success": False, "message": "Malformed request"}, 400

    @app.errorhandler(Exception)
    def unhandled_error(e):
        app.logger.exception("Unhandled API error")
        return {"success": False, "message": "Internal server error"}, 500

    return app


if __name__ == "__main__":
    test_connection()
    app = create_app()
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
