import pytest
from app import create_app
from app.extensions import db
from app.models import Habit, User
from werkzeug.security import generate_password_hash
from functools import wraps
from unittest.mock import patch
from flask_jwt_extended import jwt_required


@pytest.fixture(scope='module')
def app():
    """Module-level fixture to create a Flask app instance for testing."""
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        JWT_SECRET_KEY = "super-secret"

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


def test_get_all_habits_returns_empty_list_when_no_habits(client, clean_db):
    """Test that GET /habits returns an empty list when no habits exist."""
    # Arrange: No habits in the database
    # Act
    response = client.get('/api/v1/habits')

    # Assert
    assert response.status_code == 200
    assert response.json == []


def test_get_all_habits_returns_list_of_habits(client, clean_db):
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
    returned_habit_names = {h['name'] for h in response.json}
    assert 'Read a book' in returned_habit_names
    assert 'Exercise' in returned_habit_names

    # Verify each habit object structure matches API spec
    for habit_data in response.json:
        assert 'id' in habit_data
        assert 'name' in habit_data
        assert isinstance(habit_data['id'], int)
        assert isinstance(habit_data['name'], str)


# --- POST /habits Tests ---


def test_create_habit_successfully(client, clean_db):
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


def test_create_habit_with_missing_name_returns_400(client, clean_db):
    """Test POST /habits with missing 'name' field results in a 400 error."""
    # Arrange
    habit_data = {"frequency": "daily"}  # Missing 'name'

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 400
    assert 'message' in response.json


def test_create_habit_without_auth_returns_401(client, clean_db):
    """Test that POST /habits without authentication returns a 401 error."""
    # Arrange
    habit_data = {"name": "Unauthorized Habit"}

    # Act
    # We remove the mock, so jwt_required is active
    with patch('app.api.habits.jwt_required_conditional', new=jwt_required):
        response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 401
    assert 'message' in response.json
    assert response.json['message'] == 'Missing or invalid token'


def test_get_habits_without_auth_returns_401(client, clean_db):
    """Test that GET /habits without authentication returns a 401 error."""
    # Arrange
    # No auth headers provided, and we patch the conditional decorator
    # to enforce authentication for this specific test.
    with patch('app.api.habits.jwt_required_conditional', new=jwt_required):
        # Act
        response = client.get('/api/v1/habits')

    # Assert
    assert response.status_code == 401
    assert 'message' in response.json
    assert response.json['message'] == 'Missing or invalid token'


@pytest.fixture(autouse=True)
def mock_jwt_auth(monkeypatch):
    """
    Auto-used fixture to mock jwt_required and get_jwt_identity.
    This allows API endpoints to be tested without a valid JWT by default.
    """
    def mock_jwt_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            return fn(*args, **kwargs)
        return wrapper

    def mock_get_jwt_identity():
        return 1  # Return a fixed user ID for all tests

    # Apply the mock to all relevant blueprints
    monkeypatch.setattr(
        'app.api.habits.jwt_required_conditional', mock_jwt_required
    )
    monkeypatch.setattr(
        'app.api.habits.get_jwt_identity_conditional', mock_get_jwt_identity
    )
    monkeypatch.setattr(
        'app.api.moods.jwt_required_conditional', mock_jwt_required
    )
    monkeypatch.setattr(
        'app.api.moods.get_jwt_identity_conditional', mock_get_jwt_identity
    )
