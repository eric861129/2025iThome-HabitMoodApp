# app/api/auth.py

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import ValidationError  # 導入 ValidationError
from app.extensions import db
from app.models import User
from app.schemas import UserSchema

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/v1/auth')
user_schema = UserSchema()


@auth_bp.route('/register', methods=['POST'])
def register_user():
    """使用者註冊"""
    json_data = request.get_json()
    if not json_data:
        return jsonify({"message": "No input data provided"}), 400

    try:
        # 驗證傳入的資料
        # 注意：這裡的 partial=("username", "email") 可能需要根據實際需求調整
        # 如果 username 和 email 是必填，則不需要 partial
        data = user_schema.load(json_data)
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
    """使用者登入"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        # 移除 JWT 相關的 token 生成
        return jsonify(user_schema.dump(user)), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401
