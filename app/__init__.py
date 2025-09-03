# app/__init__.py

from flask import Flask, send_from_directory
from .extensions import db, migrate, cors, ma
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

    # 初始化擴充套件
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)  # 初始化 CORS
    ma.init_app(app)  # 初始化 Marshmallow

    # 移除 JWT 相關的測試模擬程式碼
    # if app.config.get('TESTING'):
    #     from functools import wraps
    #
    #     # 模擬 jwt_required 裝飾器工廠
    #     def mock_jwt_required_factory(*args, **kwargs):
    #         def mock_decorator(fn):
    #             @wraps(fn)
    #             def wrapper(*_args, **_kwargs):
    #                 # 在測試模式下，模擬 JWT 驗證失敗
    #                 from flask import abort
    #                 abort(401)
    #             return wrapper
    #         return mock_decorator
    #
    #     def mock_get_jwt_identity():
    #         return 1  # 固定使用者 ID
    #
    #     # 替換 JWT 相關函數
    #     import flask_jwt_extended
    #     flask_jwt_extended.jwt_required = mock_jwt_required_factory
    #     flask_jwt_extended.get_jwt_identity = mock_get_jwt_identity

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