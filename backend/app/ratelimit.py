"""Sliding-window limits for login and sign-up, stored in the database so they survive restarts and
are shared by every worker process."""
import math
from datetime import datetime, timedelta, timezone

from flask import current_app, request

from .extensions import db
from .models import AuthAttempt
from .utils import ApiError


def utcnow():
    # naive UTC, matching AuthAttempt.created_at; tests monkeypatch this to move the clock
    return datetime.now(timezone.utc).replace(tzinfo=None)


def client_ip():
    # Behind a reverse proxy, enable TRUSTED_PROXY_COUNT so ProxyFix sets remote_addr from X-Forwarded-For
    return request.remote_addr or 'unknown'


def _window_start(window_seconds):
    return utcnow() - timedelta(seconds=window_seconds)


def seconds_until_allowed(key, limit, window_seconds):
    """0 if `key` may try again, else how long until its oldest counted attempt leaves the window."""
    recent = db.session.scalars(
        db.select(AuthAttempt.created_at)
        .where(AuthAttempt.key == key, AuthAttempt.created_at > _window_start(window_seconds))
        .order_by(AuthAttempt.created_at.desc())
        .limit(limit)
    ).all()
    if len(recent) < limit:
        return 0
    oldest_counted = recent[-1]
    remaining = (oldest_counted + timedelta(seconds=window_seconds) - utcnow()).total_seconds()
    return max(1, math.ceil(remaining))


def record(*keys):
    now = utcnow()
    for key in keys:
        db.session.add(AuthAttempt(key=key, created_at=now))
    # Keep the table small: nothing older than the longest window is ever counted
    longest = max(current_app.config['LOGIN_WINDOW_SECONDS'], current_app.config['REGISTER_WINDOW_SECONDS'])
    db.session.execute(db.delete(AuthAttempt).where(AuthAttempt.created_at <= now - timedelta(seconds=longest)))
    db.session.commit()


def clear(key):
    db.session.execute(db.delete(AuthAttempt).where(AuthAttempt.key == key))
    db.session.commit()


def too_many(retry_after, what):
    minutes = max(1, math.ceil(retry_after / 60))
    err = ApiError(f'Terlalu banyak percobaan {what}. Coba lagi dalam {minutes} menit.', 429)
    err.headers = {'Retry-After': str(retry_after)}
    return err


# ─── LOGIN ───
def login_keys(username):
    return f'login-user:{username.lower()}', f'login-ip:{client_ip()}'


def check_login_allowed(username):
    cfg = current_app.config
    user_key, ip_key = login_keys(username)
    wait = max(
        seconds_until_allowed(user_key, cfg['LOGIN_MAX_FAILURES_PER_USER'], cfg['LOGIN_WINDOW_SECONDS']),
        seconds_until_allowed(ip_key, cfg['LOGIN_MAX_FAILURES_PER_IP'], cfg['LOGIN_WINDOW_SECONDS']),
    )
    if wait:
        raise too_many(wait, 'login')


def record_login_failure(username):
    record(*login_keys(username))


def record_login_success(username):
    # A correct password resets the account's counter; the per-IP counter keeps running
    clear(login_keys(username)[0])


# ─── SIGN-UP ───
def check_register_allowed():
    cfg = current_app.config
    wait = seconds_until_allowed(f'register-ip:{client_ip()}', cfg['REGISTER_MAX_PER_IP'], cfg['REGISTER_WINDOW_SECONDS'])
    if wait:
        raise too_many(wait, 'pendaftaran')


def record_register():
    record(f'register-ip:{client_ip()}')
