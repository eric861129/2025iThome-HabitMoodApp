# app/schemas.py

from .extensions import ma
from .models import User, Habit, HabitLog, MoodLog
from marshmallow import fields


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        # 排除 password_hash，確保它永遠不會被序列化返回
        exclude = ("password_hash",)


class HabitSchema(ma.SQLAlchemyAutoSchema):
    user_id = fields.Integer(load_only=True)

    class Meta:
        model = Habit
        load_instance = True
        include_fk = True  # 包含 user_id


class HabitLogSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = HabitLog
        load_instance = True
        include_fk = True  # 包含 habit_id


class MoodLogSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = MoodLog
        load_instance = True
        include_fk = True  # 包含 user_id
