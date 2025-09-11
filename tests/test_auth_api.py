import pytest  # noqa: F401
from app.models import User
from werkzeug.security import check_password_hash


def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 201
    assert "id" in response.json
    assert response.json["username"] == "testuser"
    assert response.json["email"] == "test@example.com"

    user = User.query.filter_by(email="test@example.com").first()
    assert user is not None
    assert user.username == "testuser"
    assert check_password_hash(user.password_hash, "password123")


def test_register_existing_email(client):
    # Register a user first
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "existinguser",
            "email": "existing@example.com",
            "password": "password123"
        }
    )

    # Try to register with the same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "anotheruser",
            "email": "existing@example.com",
            "password": "anotherpassword"
        }
    )
    assert response.status_code == 409
    assert "message" in response.json
    assert "Email already exists" in response.json["message"]


def test_register_invalid_data(client):
    # Missing email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert "email" in response.json
    assert "Missing data for required field." in response.json["email"][0]

    # Missing password
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com"
        }
    )
    assert response.status_code == 400
    assert "password" in response.json
    assert "Missing data for required field." in response.json["password"][0]

    # Missing username
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert "username" in response.json
    assert "Missing data for required field." in response.json["username"][0]


def test_login_user(client):
    # Register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "loginpassword"
        }
    )

    # Login with correct credentials
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "loginpassword"
        }
    )
    assert response.status_code == 200
    assert "token" in response.json
    assert "user" in response.json
    assert response.json["user"]["email"] == "login@example.com"


def test_login_invalid_credentials(client):
    # Register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "invaliduser",
            "email": "invalid@example.com",
            "password": "invalidpassword"
        }
    )

    # Login with incorrect password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "message" in response.json
    assert response.json["message"] == "Invalid credentials"

    # Login with non-existent email
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        }
    )
    assert response.status_code == 401
    assert "message" in response.json
    assert response.json["message"] == "Invalid credentials"


def test_login_missing_data(client):
    # Missing email
    response = client.post(
        "/api/v1/auth/login",
        json={
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert "message" in response.json
    assert response.json["message"] == "Missing email or password"

    # Missing password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com"
        }
    )
    assert response.status_code == 400
    assert "message" in response.json
    assert response.json["message"] == "Missing email or password"
