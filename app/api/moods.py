# app/api/moods.py

from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import MoodLog
from app.schemas import MoodLogSchema
from marshmallow import ValidationError


moods_bp = Blueprint('moods_bp', __name__, url_prefix='/api/v1/moods')
mood_log_schema = MoodLogSchema()
mood_logs_schema = MoodLogSchema(many=True)


@moods_bp.route('', methods=['GET'])
def list_moods():
    """取得所有心情紀錄"""
    user_id = 1  # noqa: F841
    moods = MoodLog.query.filter_by(user_id=user_id).all()
    return jsonify(mood_logs_schema.dump(moods)), 200


@moods_bp.route('', methods=['POST'])
def create_mood():
    """建立新心情紀錄"""
    user_id = 1  # noqa: F841
    json_data = request.get_json()

    try:
        new_mood = mood_log_schema.load(json_data)
        new_mood.user_id = user_id
    except ValidationError as err:
        return jsonify(err.messages), 400

    # 檢查是否已存在相同日期的紀錄
    existing_log = MoodLog.query.filter_by(
        user_id=user_id, log_date=new_mood.log_date
    ).first()
    if existing_log:
        return jsonify({
            "message": "A mood log for this date already exists."
        }), 409

    db.session.add(new_mood)
    db.session.commit()

    return jsonify(mood_log_schema.dump(new_mood)), 201


@moods_bp.route('/<int:mood_id>', methods=['GET'])
def get_mood(mood_id):
    """取得特定心情紀錄"""
    user_id = 1  # noqa: F841
    mood = MoodLog.query.filter_by(id=mood_id, user_id=user_id).first()

    if not mood:
        return jsonify({"message": "Mood entry not found"}), 404

    return jsonify(mood_log_schema.dump(mood)), 200


@moods_bp.route('/<int:mood_id>', methods=['PUT'])
def update_mood(mood_id):
    """更新特定心情紀錄"""
    user_id = 1  # noqa: F841
    mood = MoodLog.query.filter_by(id=mood_id, user_id=user_id).first()

    if not mood:
        return jsonify({"message": "Mood entry not found"}), 404

    json_data = request.get_json()

    try:
        updated_data = mood_log_schema.load(json_data, partial=True)
    except ValidationError as err:
        return jsonify(err.messages), 400

    for key, value in updated_data.items():
        setattr(mood, key, value)

    db.session.commit()

    return jsonify(mood_log_schema.dump(mood)), 200


@moods_bp.route('/<int:mood_id>', methods=['DELETE'])
def delete_mood(mood_id):
    """刪除特定心情紀錄"""
    user_id = 1  # noqa: F841
    mood = MoodLog.query.filter_by(id=mood_id, user_id=user_id).first()

    if not mood:
        return jsonify({"message": "Mood entry not found"}), 404

    db.session.delete(mood)
    db.session.commit()

    return '', 204
