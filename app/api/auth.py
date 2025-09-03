# app/api/auth.py

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt
)
from marshmallow import ValidationError
from app.extensions import db
from app.models import User
from app.schemas import UserSchema

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/v1/auth')
user_schema = UserSchema()

# 儲存已登出的 JWT，用於黑名單機制
# 實際應用中應使用更持久的儲存方式，例如 Redis
JWT_BLOCKLIST = set()


@auth_bp.route('/register', methods=['POST'])
def register_user():
    """使用者註冊"""
    json_data = request.get_json()
    if not json_data:
        return jsonify({"message": "No input data provided"}), 400

    try:
        # 驗證傳入的資料
        data = user_schema.load(json_data, partial=("username", "email"))
    except ValidationError as err:
        return jsonify(err.messages), 400

    # 檢查使用者名稱和 Email 是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "Username already exists"}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already exists"}), 409

    # 建立新使用者
    password = json_data.get('password')
    if not password:
        return jsonify({"message": "Password is required"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    # 使用 schema 序列化回傳的 user data
    return jsonify(user_schema.dump(new_user)), 201


@auth_bp.route('/login', methods=['POST'])
def login_user():
    """使用者登入並取得 JWT"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify(
            access_token=access_token, refresh_token=refresh_token
        ), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout_user():
    """使用者登出並將 JWT 加入黑名單"""
    jti = get_jwt()["jti"]
    JWT_BLOCKLIST.add(jti)
    return jsonify({"message": "Successfully logged out"}), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """使用刷新 Token 取得新的存取 Token"""
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    return jsonify(access_token=new_access_token), 200
