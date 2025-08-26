# app/api/habits.py

from flask import Blueprint, jsonify, request

habits_bp = Blueprint('habits_bp', __name__, url_prefix='/api/v1/habits')

@habits_bp.route('', methods=['GET'])
def list_habits():
    return jsonify(message="List habits endpoint OK"), 200

@habits_bp.route('', methods=['POST'])
def create_habit():
    return jsonify(message="Create habit endpoint OK"), 201

@habits_bp.route('/<int:habit_id>', methods=['GET'])
def get_habit(habit_id):
    return jsonify(message=f"Get habit {habit_id} endpoint OK"), 200

@habits_bp.route('/<int:habit_id>', methods=['PUT'])
def update_habit(habit_id):
    return jsonify(message=f"Update habit {habit_id} endpoint OK"), 200

@habits_bp.route('/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    return jsonify(message=f"Delete habit {habit_id} endpoint OK"), 204

@habits_bp.route('/<int:habit_id>/logs', methods=['POST'])
def create_habit_log(habit_id):
    return jsonify(message=f"Create log for habit {habit_id} endpoint OK"), 201
