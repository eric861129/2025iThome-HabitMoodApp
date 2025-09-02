# app/models.py

from .extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(
        db.String(120), unique=True, nullable=False, index=True
    )
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    habits = db.relationship(
        'Habit', backref='user', lazy=True, cascade="all, delete-orphan"
    )
    mood_logs = db.relationship(
        'MoodLog', backref='user', lazy=True, cascade="all, delete-orphan"
    )


class Habit(db.Model):
    __tablename__ = 'habits'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('users.id'), nullable=False
    )
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    frequency = db.Column(
        db.String(50), nullable=False
    )  # e.g., "daily", "weekly"
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    logs = db.relationship(
        'HabitLog', backref='habit', lazy=True, cascade="all, delete-orphan"
    )


class HabitLog(db.Model):
    __tablename__ = 'habit_logs'
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(
        db.Integer, db.ForeignKey('habits.id'), nullable=False
    )
    log_date = db.Column(db.Date, nullable=False)
    value = db.Column(
        db.Integer, nullable=False, default=1
    )  # 1 for done
    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            'habit_id', 'log_date', name='_habit_log_date_uc'
        ),
    )


class MoodLog(db.Model):
    __tablename__ = 'mood_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('users.id'), nullable=False
    )
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    notes = db.Column(db.Text, nullable=True)
    log_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint('user_id', 'log_date', name='_user_log_date_uc'),
    )
