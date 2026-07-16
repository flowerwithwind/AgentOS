"""
Flask 应用工厂

供 app.py（开发）和 wsgi.py（生产）共同使用。
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS

# ====== Blueprint 注册 ======
from app.controllers.api_auth_bp import auth_bp
from app.controllers.oauth_bp import oauth_bp
from app.controllers.api_dashboard_bp import dashboard_bp
from app.controllers.api_models_bp import models_bp
from app.controllers.api_lookout_bp import lookout_bp
from app.controllers.api_skills_bp import skills_bp
from app.controllers.api_digital_employees_bp import digital_employees_bp
from app.controllers.api_system_bp import system_bp
from app.controllers.chat_bp import chat_bp


def create_app():
    """Flask 应用工厂"""
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "demo-flask-secret-change-me"
    )
    app.config["SESSION_COOKIE_NAME"] = "xhaos_session"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    # Behind nginx on public frontend origin; keep cookie host-only for same-site Lax
    app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "").lower() in (
        "1",
        "true",
        "yes",
    )

    # CORS —— 允许 React 前端跨域请求
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    public_base = os.environ.get("OAUTH_BASE_URL", "").rstrip("/")
    cors_origins = [
        frontend_url,
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://1.14.106.17:18082",
    ]
    if public_base:
        cors_origins.append(public_base)
    CORS(
        app,
        supports_credentials=True,
        origins=list(dict.fromkeys([o for o in cors_origins if o])),
    )

    # Ensure core tables exist (production wsgi only called create_app, never init_db)
    try:
        from app.models.db import init_db
        from app.services.oauth_service import ensure_oauth_tables

        init_db()
        ensure_oauth_tables()
    except Exception as e:
        # Log but do not prevent app boot; routes that need DB will surface clearer errors
        import logging

        logging.getLogger(__name__).error(f"DB bootstrap failed: {e}")

    # 健康检查
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # 注册 Blueprint（优先于 catch-all 路由）
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(oauth_bp, url_prefix="/api/auth/oauth")
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(models_bp, url_prefix="/api/models")
    app.register_blueprint(lookout_bp, url_prefix="/api/lookout")
    app.register_blueprint(skills_bp, url_prefix="/api/skills")
    app.register_blueprint(digital_employees_bp, url_prefix="/api/digital-employees")
    app.register_blueprint(system_bp)
    app.register_blueprint(chat_bp, url_prefix="/user/chat")

    # 生产环境：托管 React 前端构建产物（放在 Blueprint 之后，避免抢断 API 路由）
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
    if os.path.isdir(frontend_dist):
        from flask import send_from_directory

        @app.route("/")
        def index():
            return send_from_directory(frontend_dist, "index.html")

        @app.route("/<path:path>")
        def static_proxy(path):
            file_path = os.path.join(frontend_dist, path)
            if os.path.isfile(file_path):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    return app
