import pytest
from app import create_app
from app.extensions import db
from instance.config import Config


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    # Disable CSRF protection in tests if you are using Flask-WTF/CSRFProtect
    WTF_CSRF_ENABLED = False


@pytest.fixture(scope='function')
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()
