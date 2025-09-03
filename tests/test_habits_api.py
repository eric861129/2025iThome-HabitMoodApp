import pytest
from app import create_app
from app.extensions import db
from app.models import Habit, User
from werkzeug.security import generate_password_hash
from functools import wraps
from unittest.mock import patch


@pytest.fixture(scope='module')
def app():
    """Module-level fixture to create a Flask app instance for testing."""
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        # JWT_SECRET_KEY = "super-secret" # 移除這行

    app = create_app(config_object=TestConfig)
    return app


@pytest.fixture(scope='module')
def client(app):
    """Module-level fixture to create a test client for the app."""
    return app.test_client()


@pytest.fixture(scope='function')
def clean_db(app):
    """Function-level fixture to ensure a clean database for each test."""
    with app.app_context():
        db.create_all()  # Create tables for this test function
        yield db  # Yield the db object
        db.session.remove()  # Clean up session
        db.drop_all()  # Drop tables after test


# --- GET /habits Tests ---


def test_get_all_habits_returns_empty_list_when_no_habits(client, clean_db, mock_jwt_auth):
    """Test that GET /habits returns an empty list when no habits exist."""
    # Arrange: No habits in the database
    # Act
    response = client.get('/api/v1/habits')

    # Assert
    assert response.status_code == 200
    assert response.json == []


def test_get_all_habits_returns_list_of_habits(client, clean_db, mock_jwt_auth):
    """Test that GET /habits returns a list of habits for the user."""
    # Arrange: Add habits to the database
    # for the authenticated user (user_id=1)
    with client.application.app_context():
        hashed_password = generate_password_hash("testpassword")
        user = User(
            id=1, username="testuser", email="test@example.com",
            password_hash=hashed_password
        )
        db.session.add(user)
        db.session.commit()

        habit1 = Habit(user_id=1, name='Read a book', frequency='daily')
        habit2 = Habit(user_id=1, name='Exercise', frequency='weekly')
        db.session.add_all([habit1, habit2])
        db.session.commit()
        # Refresh to get generated IDs and created_at
        db.session.refresh(habit1)
        db.session.refresh(habit2)

    # Act
    response = client.get('/api/v1/habits')

    # Assert
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 2

    # Check the structure and content of returned habits
    for habit_data in response.json:
        assert 'id' in habit_data
        assert 'name' in habit_data
        assert isinstance(habit_data['id'], int)
        assert isinstance(habit_data['name'], str)


# --- POST /habits Tests ---


def test_create_habit_successfully(client, clean_db, mock_jwt_auth):
    """Test that POST /habits creates a new habit successfully."""
    # Arrange: Ensure user exists for user_id=1
    with client.application.app_context():
        hashed_password = generate_password_hash("testpassword")
        user = User(
            id=1, username="testuser", email="test@example.com",
            password_hash=hashed_password
        )
        db.session.add(user)
        db.session.commit()

    habit_data = {
        "name": "Learn Flask",
        "frequency": "daily"
    }

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 201
    assert 'id' in response.json
    assert response.json['name'] == habit_data['name']

    # Verify habit is in the database
    with client.application.app_context():
        created_habit = Habit.query.filter_by(
            user_id=1, name="Learn Flask"
        ).first()
        assert created_habit is not None
        assert created_habit.name == habit_data['name']
        assert created_habit.user_id == 1


def test_create_habit_with_missing_name_returns_400(client, clean_db, mock_jwt_auth):
    """Test POST /habits with missing 'name' field results in a 400 error."""
    # Arrange
    habit_data = {"frequency": "daily"}  # Missing 'name'

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 400
    assert 'name' in response.json
    assert 'Missing data for required field.' in response.json['name']



def test_create_habit_with_invalid_data_returns_400(client, clean_db, mock_jwt_auth):
    """
    Test that POST /habits with invalid data (e.g., name is not a string)
    returns a 400 Bad Request error.
    """
    # Arrange
    habit_data = {
        "name": 12345,  # Invalid type for name
        "frequency": "daily"
    }

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 400
    # Marshmallow's error messages are usually detailed
    assert 'name' in response.json
    assert 'Not a valid string.' in response.json['name']


@pytest.fixture()
def mock_jwt_auth(monkeypatch):
    """
    Fixture to mock jwt_required and get_jwt_identity for tests that need it.
    """
    # 由於 JWT 已被移除，這個 fixture 現在只是一個空操作，
    # 但保留它以避免測試函數簽名錯誤。
    pass