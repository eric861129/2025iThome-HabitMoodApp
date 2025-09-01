# app/api/moods.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import MoodLog, User
from datetime import datetime

moods_bp = Blueprint('moods_bp', __name__, url_prefix='/api/v1/moods')

@moods_bp.route('', methods=['GET'])
@jwt_required()
def list_moods():
    """取得所有心情紀錄"""
    user_id = get_jwt_identity()
    moods = MoodLog.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": mood.id,
            "mood_score": mood.rating,
            "notes": mood.notes,
            "log_date": mood.log_date.isoformat() if mood.log_date else None,
        } for mood in moods
    ]), 200

@moods_bp.route('', methods=['POST'])
@jwt_required()
def create_mood():
    """建立新心情紀錄"""
    user_id = get_jwt_identity()
    data = request.get_json()
    mood_score = data.get('mood_score')
    notes = data.get('notes')
    log_date_str = data.get('log_date')

    if mood_score is None or not log_date_str:
        return jsonify({"message": "Missing mood_score or log_date"}), 400

    if not (1 <= mood_score <= 5):
        return jsonify({"message": "Mood score must be between 1 and 5"}), 400

    try:
        log_date = datetime.fromisoformat(log_date_str)
    except ValueError:
        return jsonify({"message": "Invalid log_date format. Use YYYY-MM-DD"}), 400

    new_mood = MoodLog(
        user_id=user_id,
        rating=mood_score,
        notes=notes,
        log_date=log_date
    )
    db.session.add(new_mood)
    db.session.commit()

    return jsonify({
        "id": new_mood.id,
        "mood_score": new_mood.rating,
        "notes": new_mood.notes,
        "log_date": new_mood.log_date.isoformat() if new_mood.log_date else None,
    }), 201

@moods_bp.route('/<int:mood_id>', methods=['GET'])
@jwt_required()
def get_mood(mood_id):
    """取得特定心情紀錄"""
    user_id = get_jwt_identity()
    mood = MoodLog.query.filter_by(id=mood_id, user_id=user_id).first()

    if not mood:
        return jsonify({"message": "Mood entry not found"}), 404

    return jsonify({
        "id": mood.id,
        "mood_score": mood.rating,
        "notes": mood.notes,
        "log_date": mood.log_date.isoformat() if mood.log_date else None,
    }), 200

@moods_bp.route('/<int:mood_id>', methods=['PUT'])
@jwt_required()
def update_mood(mood_id):
    """更新特定心情紀錄"""
    user_id = get_jwt_identity()
    mood = MoodLog.query.filter_by(id=mood_id, user_id=user_id).first()

    if not mood:
        return jsonify({"message": "Mood entry not found"}), 404

    data = request.get_json()
    
    if 'mood_score' in data:
        mood_score = data['mood_score']
        if not (1 <= mood_score <= 5):
            return jsonify({"message": "Mood score must be between 1 and 5"}), 400
        mood.rating = mood_score

    if 'notes' in data: mood.notes = data['notes']
    
    if 'log_date' in data:
        try:
            mood.log_date = datetime.fromisoformat(data['log_date'])
        except ValueError:
            return jsonify({"message": "Invalid log_date format. Use YYYY-MM-DD"}), 400

    db.session.commit()

    return jsonify({
        "id": mood.id,
        "mood_score": mood.rating,
        "notes": mood.notes,
        "log_date": mood.log_date.isoformat() if mood.log_date else None,
    }), 200

@moods_bp.route('/<int:mood_id>', methods=['DELETE'])
@jwt_required()
def delete_mood(mood_id):
    """刪除特定心情紀錄"""
    user_id = get_jwt_identity()
    mood = MoodLog.query.filter_by(id=mood_id, user_id=user_id).first()

    if not mood:
        return jsonify({"message": "Mood entry not found"}), 404

    db.session.delete(mood)
    db.session.commit()

    return '', 204
