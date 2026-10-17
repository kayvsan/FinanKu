from datetime import datetime, timezone

from .extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), nullable=False)
    username_lower = db.Column(db.String(40), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class Wallet(db.Model):
    __tablename__ = 'wallets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(60), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    initial_balance = db.Column(db.BigInteger, nullable=False, default=0)


class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(60), nullable=False)
    type = db.Column(db.String(10), nullable=False)


class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.BigInteger, nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD, matches the frontend's string comparisons
    wallet_id = db.Column(db.Integer, db.ForeignKey('wallets.id'), nullable=False)
    to_wallet_id = db.Column(db.Integer, db.ForeignKey('wallets.id'), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    note = db.Column(db.String(200), nullable=False, default='')
    tag = db.Column(db.String(100), nullable=False, default='')
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class Budget(db.Model):
    __tablename__ = 'budgets'
    __table_args__ = (db.UniqueConstraint('user_id', 'month', 'category_id', name='uq_budget_user_month_category'),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    month = db.Column(db.String(7), nullable=False)  # YYYY-MM
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    amount = db.Column(db.BigInteger, nullable=False)


class Goal(db.Model):
    __tablename__ = 'goals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(80), nullable=False)
    target = db.Column(db.BigInteger, nullable=False)
    saved = db.Column(db.BigInteger, nullable=False, default=0)
    deadline = db.Column(db.String(10), nullable=True)


class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(64), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
