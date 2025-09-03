# app/__init__.py

from flask import Flask, jsonify, send_from_directory
from .extensions import db, migrate, cors, jwt, ma
from datetime import timedelta
from flask_swagger_ui import get_swaggerui_blueprint
import os

# Define the path to your OpenAPI spec file
SWAGGER_URL = '/api/docs'


def create_app(config_object=None):
    """Application factory function."""
    app = Flask(__name__, instance_relative_config=True)

    if config_object:
        app.config.from_object(config_object)
    else:
        # 從 instance/config.py 載入設定
        app.config.from_object('instance.config.Config')

    # JWT 配置
    # 從環境變數讀取 JWT_SECRET_KEY，確保生產環境安全
    app.config["JWT_SECRET_KEY"] = os.environ.get(
        "JWT_SECRET_KEY", "super-secret-dev-key"
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

    # 初始化擴充套件
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)  # 初始化 CORS
    jwt.init_app(app)  # 初始化 JWT
    ma.init_app(app)  # 初始化 Marshmallow

    # JWT 黑名單設定
    from .api.auth import JWT_BLOCKLIST

    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        return jti in JWT_BLOCKLIST

    # JWT 錯誤處理
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"message": "Missing or invalid token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"message": "Signature verification failed"}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({"message": "Token has expired"}), 401

    @jwt.revoked_token_loader
    def revoked_token_response(jwt_header, jwt_payload):
        return jsonify({"message": "Token has been revoked"}), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_response(jwt_header, jwt_payload):
        return jsonify({"message": "Fresh token required"}), 401

    with app.app_context():
        # 導入 Blueprints
        from .api.auth import auth_bp
        from .api.habits import habits_bp
        from .api.moods import moods_bp

        # 註冊 Blueprints
        app.register_blueprint(auth_bp)
        app.register_blueprint(habits_bp)
        app.register_blueprint(moods_bp)

        # 建立資料庫表格 (如果它們還不存在)
        # 在第一次執行 flask run 之前，你應該在終端機執行 `flask db init`,
        # `flask db migrate`, `flask db upgrade`
        db.create_all()

        # Route to serve the OpenAPI spec file
        @app.route('/openapi.yml')
        def serve_openapi_spec():
            # Correct path: go up one level from app.root_path
            # to project root, then into static
            return send_from_directory(
                os.path.join(app.root_path, '..', 'static'), 'API_SPEC.yml'
            )

        # Configure Swagger UI
        swaggerui_blueprint = get_swaggerui_blueprint(
            SWAGGER_URL,  # Swagger UI static files will be served here
            '/openapi.yml',  # Point to the new route serving the spec
            config={
                'app_name': "HabitMoodApp API"
            }
        )
        app.register_blueprint(swaggerui_blueprint)

    return app
