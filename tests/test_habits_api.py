import pytest
from app import create_app
from app.extensions import db
from app.models import Habit, User
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token


@pytest.fixture(scope='module')
def app():
    """Module-level fixture to create a Flask app instance for testing."""
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        JWT_SECRET_KEY = "test-jwt-secret-key"

    app = create_app(config_object=TestConfig)
    app.config["JWT_SECRET_KEY"] = "test-jwt-secret-key"
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


@pytest.fixture(scope='function')
def auth_headers(client, clean_db):
    """
    Fixture to provide authorization headers with a valid JWT.
    Creates a new user for each test to ensure unique identity.
    """
    with client.application.app_context():
        hashed_password = generate_password_hash("testpassword")
        user = User(
            username="testuser_auth", email="test_auth@example.com",
            password_hash=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user) # Get the auto-generated ID

        print(f"DEBUG: User ID for token: {user.id}, type: {type(user.id)}")
        access_token = create_access_token(identity=str(user.id))
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        return headers


# --- GET /habits Tests ---


def test_get_all_habits_returns_empty_list_when_no_habits(client, clean_db,
                                                          auth_headers):
    """Test that GET /habits returns an empty list when no habits exist."""
    # Arrange: No habits in the database
    # Act
    response = client.get('/api/v1/habits', headers=auth_headers)

    # Assert
    assert response.status_code == 200
    assert response.json == []


def test_get_all_habits_returns_list_of_habits(client, clean_db,
                                               auth_headers):
    """Test that GET /habits returns a list of habits for the user."""
    # Arrange: Habits will be added for the authenticated user (user_id=1)
    #          User is created by auth_headers fixture.
    with client.application.app_context():
        habit1 = Habit(user_id=1, name='Read a book', frequency='daily')
        habit2 = Habit(user_id=1, name='Exercise', frequency='weekly')
        db.session.add_all([habit1, habit2])
        db.session.commit()
        # Refresh to get generated IDs and created_at
        db.session.refresh(habit1)
        db.session.refresh(habit2)

    # Act
    response = client.get('/api/v1/habits', headers=auth_headers)

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


def test_create_habit_successfully(client, clean_db, auth_headers):
    """Test that POST /habits creates a new habit successfully."""
    # Arrange: User is created by auth_headers fixture.
    habit_data = {
        "name": "Learn Flask",
        "frequency": "daily"
    }

    # Act
    response = client.post('/api/v1/habits', json=habit_data, headers=auth_headers)

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


def test_create_habit_with_missing_name_returns_400(client, clean_db,
                                                    auth_headers):
    """Test POST /habits with missing 'name' field results in a 400 error."""
    # Arrange
    habit_data = {"frequency": "daily"}  # Missing 'name'

    # Act
    response = client.post('/api/v1/habits', json=habit_data, headers=auth_headers)

    # Assert
    assert response.status_code == 422
    assert 'name' in response.json
    assert 'Missing data for required field.' in response.json['name']


def test_create_habit_with_invalid_data_returns_400(client, clean_db,
                                                    auth_headers):
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
    response = client.post('/api/v1/habits', json=habit_data, headers=auth_headers)

    # Assert
    assert response.status_code == 422
    # Marshmallow's error messages are usually detailed
    assert 'name' in response.json
    assert 'Not a valid string.' in response.json['name']



