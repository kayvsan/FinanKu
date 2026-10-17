import os
from datetime import timedelta

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, 'instance', 'finanku.db')


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{DEFAULT_DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_SECONDS') or 15 * 60))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # Access token travels in the Authorization header (kept in memory by the SPA);
    # the refresh token lives in an httpOnly cookie scoped to the auth routes.
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_REFRESH_COOKIE_PATH = '/api/auth'
    JWT_REFRESH_CSRF_COOKIE_PATH = '/'
    JWT_COOKIE_SAMESITE = 'Strict'
    JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE') == '1'
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_SESSION_COOKIE = False

    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '')


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-secret-key-that-is-long-enough-for-hs256'
