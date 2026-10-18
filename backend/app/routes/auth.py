import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    jwt_required,
    set_refresh_cookies,
    unset_jwt_cookies,
    verify_jwt_in_request,
)
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from .. import ratelimit
from ..extensions import db
from ..models import TokenBlocklist, User
from ..seed import seed_demo
from ..serializers import user_to_dict
from ..utils import ApiError, current_user_id, get_json

bp = Blueprint('auth', __name__)

USERNAME_RE = re.compile(r'^[A-Za-z0-9_.-]{3,40}$')
INVALID_LOGIN = 'Nama pengguna atau kata sandi salah.'
USERNAME_TAKEN = 'Nama pengguna sudah terdaftar. Silakan masuk.'


def _is_mobile_client():
    # The Expo app has no browser cookie jar it can protect, so it asks for the refresh token in the body
    return request.headers.get('X-Client') == 'mobile'


def _session_response(user, status=200):
    """Body carries the short-lived access token. The refresh token goes into an httpOnly cookie for the
    web app, or into the body for the mobile app (which keeps it in the device's secure storage)."""
    body = {'user': user_to_dict(user), 'accessToken': _access_token(user)}
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims={'ucr': user.token_stamp()})
    if _is_mobile_client():
        body['refreshToken'] = refresh_token
        return jsonify(body), status
    resp = jsonify(body)
    set_refresh_cookies(resp, refresh_token)
    return resp, status


def _access_token(user):
    return create_access_token(identity=str(user.id), additional_claims={'ucr': user.token_stamp()})


def _credentials():
    data = get_json()
    username = data.get('username')
    password = data.get('password')
    if not isinstance(username, str) or not isinstance(password, str):
        raise ApiError('Nama pengguna dan kata sandi wajib diisi.')
    return username.strip(), password


@bp.post('/register')
def register():
    username, password = _credentials()
    if not USERNAME_RE.match(username):
        raise ApiError('Nama pengguna 3–40 karakter (huruf, angka, _ . -).')
    if not 6 <= len(password) <= 128:
        raise ApiError('Kata sandi minimal 6 karakter.')
    ratelimit.check_register_allowed()
    if _username_taken(username):
        raise ApiError(USERNAME_TAKEN, 409)

    user = User(username=username, username_lower=username.lower(), password_hash=generate_password_hash(password))
    try:
        db.session.add(user)
        db.session.flush()
        # First run gets the demo dataset, like loadState() -> seedDemoData() in the original
        seed_demo(user.id)
        db.session.commit()
    except IntegrityError:
        # Two sign-ups with the same name at the same moment both pass the check above;
        # the unique index rejects the second one
        db.session.rollback()
        raise ApiError(USERNAME_TAKEN, 409)
    ratelimit.record_register()
    return _session_response(user, 201)


def _username_taken(username):
    return db.session.scalar(db.select(User.id).filter_by(username_lower=username.lower())) is not None


@bp.post('/login')
def login():
    username, password = _credentials()
    # Checked before the password so a locked account can't keep being guessed. Unknown usernames are
    # counted and locked the same way, so the response never reveals which accounts exist.
    ratelimit.check_login_allowed(username)
    user = db.session.scalar(db.select(User).filter_by(username_lower=username.lower()))
    if user is None or not check_password_hash(user.password_hash, password):
        ratelimit.record_login_failure(username)
        raise ApiError(INVALID_LOGIN, 401)
    ratelimit.record_login_success(username)
    return _session_response(user)


@bp.post('/refresh')
# Web: refresh cookie (+ CSRF header). Mobile: `Authorization: Bearer <refreshToken>`.
@jwt_required(refresh=True, locations=['cookies', 'headers'])
def refresh():
    user = db.session.get(User, current_user_id())
    if user is None:
        raise ApiError('Akun tidak ditemukan.', 401)
    return jsonify(user=user_to_dict(user), accessToken=_access_token(user))


@bp.post('/logout')
def logout():
    # Always clear the cookies, even when the refresh token is already expired or missing
    try:
        verify_jwt_in_request(refresh=True, locations=['cookies', 'headers'])
        db.session.add(TokenBlocklist(jti=get_jwt()['jti']))
        db.session.commit()
    except Exception:
        db.session.rollback()
    resp = jsonify(ok=True)
    unset_jwt_cookies(resp)
    return resp


@bp.get('/me')
@jwt_required()
def me():
    user = db.session.get(User, current_user_id())
    if user is None:
        raise ApiError('Akun tidak ditemukan.', 401)
    return jsonify(user=user_to_dict(user))
