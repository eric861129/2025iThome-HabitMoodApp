# app/__init__.py

from flask import Flask, send_from_directory
from .extensions import db, migrate, cors, ma, jwt
from flask_swagger_ui import get_swaggerui_blueprint
import os
import click

# Define the path to your OpenAPI spec file
SWAGGER_URL = '/api/docs'


def create_app(config_object=None):
    """Application factory function."""
    app = Flask(__name__, instance_relative_config=True)

    if config_object:
        app.config.from_object(config_object)
    else:
        app.config.from_object('instance.config.Config')

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        from .api.auth import auth_bp
        from .api.habits import habits_bp
        from .api.moods import moods_bp

        app.register_blueprint(auth_bp)
        app.register_blueprint(habits_bp)
        app.register_blueprint(moods_bp)

        db.create_all()

        @app.route('/openapi.yml')
        def serve_openapi_spec():
            return send_from_directory(
                os.path.join(app.root_path, '..', 'static'), 'API_SPEC.yml'
            )

        swaggerui_blueprint = get_swaggerui_blueprint(
            SWAGGER_URL,
            '/openapi.yml',
            config={'app_name': "HabitMoodApp API"}
        )
        app.register_blueprint(swaggerui_blueprint)

    from .models import User

    @app.cli.command("show-users")
    def show_users():
        """顯示資料庫中的所有使用者。"""
        users = User.query.all()
        if not users:
            click.echo("資料庫中沒有任何使用者。")
            return

        click.echo("--- 資料庫中的使用者 ---")
        for user in users:
            click.echo(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")  # noqa: E501
            click.echo(f"  Password Hash: {user.password_hash}")
        click.echo("------------------------")

    @app.cli.command("clear-users")
    def clear_users():
        """刪除 users 表格中的所有資料。"""
        try:
            num_rows_deleted = db.session.query(User).delete()
            db.session.commit()
            click.echo(f"成功刪除了 {num_rows_deleted} 位使用者。")
        except Exception as e:
            db.session.rollback()
            click.echo(f"刪除時發生錯誤: {e}")

    return app
