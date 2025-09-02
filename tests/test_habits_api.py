import pytest
from app import create_app
from app.extensions import db
from app.models import Habit, User
from datetime import datetime
from werkzeug.security import generate_password_hash
from unittest.mock import patch
import json

@pytest.fixture(scope='module')
def app():
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        JWT_SECRET_KEY = "super-secret"

    app = create_app(config_object=TestConfig)
    return app

@pytest.fixture(scope='module')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def clean_db(app):
    with app.app_context():
        db.create_all() # Create tables for this test function
        yield db # Yield the db object
        db.session.remove() # Clean up session
        db.drop_all() # Drop tables after test

# --- GET /habits Tests ---

def test_get_all_habits_returns_empty_list_when_no_habits(client, clean_db, monkeypatch):
    # Arrange: Mock jwt_required and get_jwt_identity
    monkeypatch.setattr('flask_jwt_extended.jwt_required', lambda f: f)
    monkeypatch.setattr('flask_jwt_extended.get_jwt_identity', lambda: 1)

    # Arrange: No habits in the database
    # Act
    response = client.get('/api/v1/habits')

    # Assert
    assert response.status_code == 200
    assert response.json == []

def test_get_all_habits_returns_list_of_habits(client, clean_db, monkeypatch):
    # Arrange: Mock jwt_required and get_jwt_identity
    monkeypatch.setattr('flask_jwt_extended.jwt_required', lambda f: f)
    monkeypatch.setattr('flask_jwt_extended.get_jwt_identity', lambda: 1)

    # Arrange: Add habits to the database for the authenticated user (user_id=1)
    with client.application.app_context():
        user = User(id=1, username="testuser", email="test@example.com", password_hash=generate_password_hash("testpassword"))
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
        assert 'user_id' in habit_data
        assert 'name' in habit_data
        assert 'created_at' in habit_data
        assert isinstance(habit_data['id'], int)
        assert isinstance(habit_data['user_id'], int)
        assert isinstance(habit_data['name'], str)
        assert isinstance(habit_data['created_at'], str) # ISO format string

# --- POST /habits Tests ---

def test_create_habit_successfully(client, clean_db, monkeypatch):
    # Arrange: Mock jwt_required and get_jwt_identity
    monkeypatch.setattr('flask_jwt_extended.jwt_required', lambda f: f)
    monkeypatch.setattr('flask_jwt_extended.get_jwt_identity', lambda: 1)

    # Arrange: Ensure user exists for user_id=1
    with client.application.app_context():
        user = User(id=1, username="testuser", email="test@example.com", password_hash=generate_password_hash("testpassword"))
        db.session.add(user)
        db.session.commit()

    habit_data = {"name": "Learn Flask"}

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 201
    assert 'id' in response.json
    assert 'name' in response.json
    assert response.json['name'] == habit_data['name']
    assert 'user_id' in response.json
    assert 'created_at' in response.json

    # Verify habit is in the database
    with client.application.app_context():
        created_habit = Habit.query.filter_by(user_id=1, name="Learn Flask").first()
        assert created_habit is not None
        assert created_habit.name == habit_data['name']
        assert created_habit.user_id == 1

def test_create_habit_with_missing_name_returns_400(client, clean_db, monkeypatch):
    # Arrange: Mock jwt_required and get_jwt_identity
    monkeypatch.setattr('flask_jwt_extended.jwt_required', lambda f: f)
    monkeypatch.setattr('flask_jwt_extended.get_jwt_identity', lambda: 1)

    # Arrange
    habit_data = {} # Missing 'name'

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 400
    assert 'message' in response.json
    assert 'code' in response.json # Based on ValidationError schema

def test_create_habit_with_invalid_name_type_returns_400(client, clean_db, monkeypatch):
    # Arrange: Mock jwt_required and get_jwt_identity
    monkeypatch.setattr('flask_jwt_extended.jwt_required', lambda f: f)
    monkeypatch.setattr('flask_jwt_extended.get_jwt_identity', lambda: 1)

    # Arrange
    habit_data = {"name": 123} # Name as int, not string

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 400
    assert 'message' in response.json
    assert 'code' in response.json # Based on ValidationError schema

def test_create_habit_without_auth_returns_401(client, clean_db):
    # Arrange
    habit_data = {"name": "Unauthorized Habit"}

    # Act
    response = client.post('/api/v1/habits', json=habit_data)

    # Assert
    assert response.status_code == 401
    assert 'message' in response.json
    assert response.json['message'] == 'Missing or invalid token'

def test_get_habits_without_auth_returns_401(client, clean_db):
    # Arrange
    # No auth headers provided

    # Act
    response = client.get('/api/v1/habits')

    # Assert
    assert response.status_code == 401
    assert 'message' in response.json
    assert response.json['message'] == 'Missing or invalid token'
