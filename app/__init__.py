# app/__init__.py

from flask import Flask
from .extensions import db, migrate, cors

def create_app():
    """Application factory function."""
    app = Flask(__name__, instance_relative_config=True)
    
    # 從 instance/config.py 載入設定
    app.config.from_object('instance.config.Config')

    # 初始化擴充套件
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app) # 初始化 CORS

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
        # 在第一次執行 flask run 之前，你應該在終端機執行 `flask db init`, `flask db migrate`, `flask db upgrade`
        db.create_all()

    return app
