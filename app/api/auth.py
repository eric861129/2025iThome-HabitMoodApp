# app/api/auth.py

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import ValidationError
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from app.extensions import db
from app.models import User
from app.schemas import UserSchema


auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/v1')
user_schema = UserSchema()


@auth_bp.route('/auth/register', methods=['POST'])
def register_user():
    """使用者註冊"""
    json_data = request.get_json()
    if not json_data:
        return jsonify({"message": "No input data provided"}), 400

    try:
        data = user_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "Username already exists"}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already exists"}), 409

    password = data.get('password')
    hashed_password = generate_password_hash(password)
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify(user_schema.dump(new_user)), 201


@auth_bp.route('/auth/login', methods=['POST'])
def login_user():
    """使用者登入並返回 JWT"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        return jsonify(user=user_schema.dump(user), token=access_token), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401


@auth_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """獲取當前登入使用者的資訊"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(user_schema.dump(user)), 200
