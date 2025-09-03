# app/extensions.py

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow

# 建立擴充套件實例
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
ma = Marshmallow()
