import pytest  # noqa: F401
from app.models import MoodLog
from datetime import date, timedelta


@pytest.fixture
def auth_client(client):
    # Register and login a user to get an authenticated client
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "moodtestuser",
            "email": "mood@example.com",
            "password": "moodpassword"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "mood@example.com",
            "password": "moodpassword"
        }
    )
    token = response.json["token"]
    return client, token


def test_create_mood_log(auth_client):
    client, token = auth_client
    today = date.today().isoformat()
    response = client.post(
        "/api/v1/moods",
        json={
            "rating": 4,
            "notes": "Feeling good today!",
            "log_date": today
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 201
    assert "id" in response.json
    assert response.json["rating"] == 4
    assert response.json["notes"] == "Feeling good today!"

    mood_log_id = response.json["id"]
    mood_log = MoodLog.query.get(mood_log_id)
    assert mood_log is not None
    assert mood_log.rating == 4
    assert mood_log.notes == "Feeling good today!"


def test_create_mood_log_invalid_rating(auth_client):
    client, token = auth_client
    today = date.today().isoformat()
    response = client.post(
        "/api/v1/moods",
        json={
            "rating": 6,
            "notes": "Invalid rating",
            "log_date": today
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    assert "rating" in response.json
    assert ("Must be greater than or equal to 1 and less than or equal to 5." 
            in response.json["rating"])

    response = client.post(
        "/api/v1/moods",
        json={
            "rating": 0,
            "notes": "Invalid rating",
            "log_date": today
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    assert "rating" in response.json
    assert ("Must be greater than or equal to 1 and less than or equal to 5." 
            in response.json["rating"])


def test_create_mood_log_missing_data(auth_client):
    client, token = auth_client
    today = date.today().isoformat()
    response = client.post(
        "/api/v1/moods",
        json={
            "notes": "Missing rating",
            "log_date": today
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    assert "rating" in response.json
    assert "Missing data for required field." in response.json["rating"]

    response = client.post(
        "/api/v1/moods",
        json={
            "rating": 3,
            "notes": "Missing date"
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    assert "log_date" in response.json
    assert "Missing data for required field." in response.json["log_date"]


def test_update_mood_log(auth_client):
    client, token = auth_client
    today = date.today().isoformat()
    # Create an initial mood log
    create_response = client.post(
        "/api/v1/moods",
        json={
            "rating": 3,
            "notes": "Initial notes",
            "log_date": today
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    mood_log_id = create_response.json["id"]

    # Update the mood log
    response = client.put(
        f"/api/v1/moods/{mood_log_id}",
        json={
            "rating": 5,
            "notes": "Updated notes"
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    assert response.json["id"] == mood_log_id
    assert response.json["rating"] == 5
    assert response.json["notes"] == "Updated notes"

    mood_log = MoodLog.query.get(mood_log_id)
    assert mood_log is not None
    assert mood_log.rating == 5
    assert mood_log.notes == "Updated notes"


def test_update_mood_log_not_found(auth_client):
    client, token = auth_client
    # Use a non-existent mood_id
    non_existent_mood_id = 99999
    response = client.put(
        f"/api/v1/moods/{non_existent_mood_id}",
        json={
            "rating": 3,
            "notes": "Notes"
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 404
    assert "message" in response.json
    assert response.json["message"] == "Mood entry not found"


def test_get_mood_logs(auth_client):
    client, token = auth_client
    # Create some mood logs
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    client.post(
        "/api/v1/moods",
        json={
            "rating": 4,
            "notes": "Good",
            "log_date": today
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    client.post(
        "/api/v1/moods",
        json={
            "rating": 3,
            "notes": "Okay",
            "log_date": yesterday
        },
        headers={'Authorization': f'Bearer {token}'}
    )

    response = client.get(
        "/api/v1/moods",
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) >= 2  # May have other mood logs from other tests

    # Check if the created mood logs are in the response
    today_log = next((log for log in response.json if log["log_date"] == today), None)
    yesterday_log = next((log for log in response.json if log["log_date"] == yesterday), None)

    assert today_log is not None
    assert today_log["rating"] == 4
    assert today_log["notes"] == "Good"

    assert yesterday_log is not None
    assert yesterday_log["rating"] == 3
    assert yesterday_log["notes"] == "Okay"


def test_unauthorized_access_moods(client):
    today = date.today().isoformat()
    # Attempt to create mood log without authentication
    response = client.post(
        "/api/v1/moods",
        json={
            "rating": 4,
            "notes": "Unauthorized",
            "log_date": today
        }
    )
    assert response.status_code == 401

    # Attempt to update mood log without authentication
    response = client.put(
        f"/api/v1/moods/1",  # Use a dummy ID as it should fail before reaching ID check
        json={
            "rating": 2,
            "notes": "Unauthorized update"
        }
    )
    assert response.status_code == 401

    # Attempt to get mood logs without authentication
    response = client.get(
        "/api/v1/moods",
    )
    assert response.status_code == 401
