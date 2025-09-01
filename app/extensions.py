# app/extensions.py

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# 建立擴充套件實例
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
