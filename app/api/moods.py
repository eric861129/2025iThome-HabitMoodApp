# app/api/moods.py

from flask import Blueprint, jsonify, request

moods_bp = Blueprint('moods_bp', __name__, url_prefix='/api/v1/moods')

@moods_bp.route('', methods=['POST'])
def create_or_update_mood_log():
    return jsonify(message="Create or update mood log endpoint OK"), 201

@moods_bp.route('', methods=['GET'])
def list_mood_logs():
    return jsonify(message="List mood logs endpoint OK"), 200
