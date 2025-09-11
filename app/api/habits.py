# app/api/habits.py

from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import Habit, HabitLog
from app.schemas import HabitSchema, HabitLogSchema
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity


habits_bp = Blueprint('habits_bp', __name__, url_prefix='/api/v1/habits')
habit_schema = HabitSchema()
habits_schema = HabitSchema(many=True)
habit_log_schema = HabitLogSchema()


@habits_bp.route('', methods=['GET'])
@jwt_required()
def list_habits():
    """取得所有習慣"""
    user_id = get_jwt_identity()
    habits = Habit.query.filter_by(user_id=user_id).all()
    return jsonify(habits_schema.dump(habits)), 200


@habits_bp.route('', methods=['POST'])
@jwt_required()
def create_habit():
    """建立新習慣"""
    user_id = get_jwt_identity()
    json_data = request.get_json()

    try:
        # 驗證和反序列化
        new_habit = habit_schema.load(json_data)
        new_habit.user_id = user_id  # 設置 user_id
    except ValidationError as err:
        return jsonify(err.messages), 422

    db.session.add(new_habit)
    db.session.commit()

    return jsonify(habit_schema.dump(new_habit)), 201


@habits_bp.route('/<int:habit_id>', methods=['GET'])
@jwt_required()
def get_habit(habit_id):
    """取得特定習慣"""
    user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()

    if not habit:
        return jsonify({"message": "Habit not found"}), 404

    return jsonify(habit_schema.dump(habit)), 200


@habits_bp.route('/<int:habit_id>', methods=['PUT'])
@jwt_required()
def update_habit(habit_id):
    """更新特定習慣"""
    user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()

    if not habit:
        return jsonify({"message": "Habit not found"}), 404

    json_data = request.get_json()

    try:
        # 驗證和反序列化，partial=True 允許部分更新
        updated_data = habit_schema.load(json_data, partial=True)
    except ValidationError as err:
        return jsonify(err.messages), 422

    # 更新 habit 物件
    for key, value in updated_data.items():
        setattr(habit, key, value)

    db.session.commit()

    return jsonify(habit_schema.dump(habit)), 200


@habits_bp.route('/<int:habit_id>', methods=['DELETE'])
@jwt_required()
def delete_habit(habit_id):
    """刪除特定習慣"""
    user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()

    if not habit:
        return jsonify({"message": "Habit not found"}), 404

    db.session.delete(habit)
    db.session.commit()

    return '', 204


@habits_bp.route('/<int:habit_id>/track', methods=['POST'])
@jwt_required()
def track_habit(habit_id):
    """追蹤習慣"""
    # 雖然這個函式沒有直接用到 user_id，但加上 JWT 保護可以確保只有登入的使用者才能追蹤
    # user_id = get_jwt_identity()
    json_data = request.get_json()
    try:
        new_log = habit_log_schema.load(json_data)
        new_log.habit_id = habit_id
    except ValidationError as err:
        return jsonify(err.messages), 422

    # 檢查是否已存在相同日期的紀錄
    existing_log = HabitLog.query.filter_by(
        habit_id=habit_id, log_date=new_log.log_date
    ).first()
    if existing_log:
        return jsonify({
            "message": "A log for this habit on this date already exists."
        }), 409

    db.session.add(new_log)
    db.session.commit()

    return jsonify(habit_log_schema.dump(new_log)), 201
