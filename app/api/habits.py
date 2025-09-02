# app/api/habits.py

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Habit, HabitLog
from datetime import datetime
from functools import wraps
import os

# Conditional JWT bypass for testing
if os.environ.get('FLASK_ENV') == 'testing' or current_app.config.get('TESTING'):
    def jwt_required_conditional(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            return fn(*args, **kwargs)
        return wrapper
    def get_jwt_identity_conditional():
        return 1 # Fixed user ID for testing
else:
    jwt_required_conditional = jwt_required
    get_jwt_identity_conditional = get_jwt_identity

habits_bp = Blueprint('habits_bp', __name__, url_prefix='/api/v1/habits')


@habits_bp.route('', methods=['GET'])
@jwt_required()
def list_habits():
    """取得所有習慣"""
    user_id = get_jwt_identity()
    habits = Habit.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": habit.id,
            "name": habit.name,
            "description": habit.description,
            "frequency": habit.frequency,
            "start_date": habit.start_date.isoformat()
            if habit.start_date else None,
            "end_date": habit.end_date.isoformat() if habit.end_date else None,
        } for habit in habits
    ]), 200


@habits_bp.route('', methods=['POST'])
@jwt_required()
def create_habit():
    """建立新習慣"""
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    frequency = data.get('frequency')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not name or not frequency:
        return jsonify({"message": "Missing name or frequency"}), 400

    try:
        start_date = datetime.fromisoformat(start_date_str) \
            if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) \
            if end_date_str else None
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    new_habit = Habit(
        user_id=user_id,
        name=name,
        description=description,
        frequency=frequency,
        start_date=start_date,
        end_date=end_date
    )
    db.session.add(new_habit)
    db.session.commit()

    return jsonify({
        "id": new_habit.id,
        "name": new_habit.name,
        "description": new_habit.description,
        "frequency": new_habit.frequency,
        "start_date": new_habit.start_date.isoformat()
        if new_habit.start_date else None,
        "end_date": new_habit.end_date.isoformat()
        if new_habit.end_date else None,
    }), 201


@habits_bp.route('/<int:habit_id>', methods=['GET'])
@jwt_required()
def get_habit(habit_id):
    """取得特定習慣"""
    user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()

    if not habit:
        return jsonify({"message": "Habit not found"}), 404

    return jsonify({
        "id": habit.id,
        "name": habit.name,
        "description": habit.description,
        "frequency": habit.frequency,
        "start_date": habit.start_date.isoformat()
        if habit.start_date else None,
        "end_date": habit.end_date.isoformat() if habit.end_date else None,
    }), 200


@habits_bp.route('/<int:habit_id>', methods=['PUT'])
@jwt_required()
def update_habit(habit_id):
    """更新特定習慣"""
    user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()

    if not habit:
        return jsonify({"message": "Habit not found"}), 404

    data = request.get_json()

    if 'name' in data:
        habit.name = data['name']
    if 'description' in data:
        habit.description = data['description']
    if 'frequency' in data:
        habit.frequency = data['frequency']

    if 'start_date' in data:
        try:
            habit.start_date = datetime.fromisoformat(data['start_date']) \
                if data['start_date'] else None
        except ValueError:
            return jsonify({
                "message": "Invalid start_date format. Use YYYY-MM-DD"
            }), 400

    if 'end_date' in data:
        try:
            habit.end_date = datetime.fromisoformat(data['end_date']) \
                if data['end_date'] else None
        except ValueError:
            return jsonify({
                "message": "Invalid end_date format. Use YYYY-MM-DD"
            }), 400

    db.session.commit()

    return jsonify({
        "id": habit.id,
        "name": habit.name,
        "description": habit.description,
        "frequency": habit.frequency,
        "start_date": habit.start_date.isoformat()
        if habit.start_date else None,
        "end_date": habit.end_date.isoformat() if habit.end_date else None,
    }), 200


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
    user_id = get_jwt_identity()
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()

    if not habit:
        return jsonify({"message": "Habit not found"}), 404

    data = request.get_json()
    log_date_str = data.get('log_date')
    value = data.get('value')

    if not log_date_str or value is None:
        return jsonify({"message": "Missing log_date or value"}), 400

    try:
        log_date = datetime.fromisoformat(log_date_str)
    except ValueError:
        return jsonify({
            "message": "Invalid log_date format. Use YYYY-MM-DD"
        }), 400

    new_log = HabitLog(
        habit_id=habit.id,
        log_date=log_date,
        value=value
    )
    db.session.add(new_log)
    db.session.commit()

    return jsonify({"message": "Habit logged successfully"}), 201
