import re
from datetime import date

from flask import request
from flask_jwt_extended import get_jwt_identity

from .extensions import db

MONTH_RE = re.compile(r'^\d{4}-(0[1-9]|1[0-2])$')


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def current_user_id():
    return int(get_jwt_identity())


def get_json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError('Body request harus berupa JSON object.')
    return data


def get_owned(model, obj_id, not_found='Data tidak ditemukan.'):
    """Fetch a row by id that belongs to the current user, or 404. Ids arrive as strings from the SPA."""
    try:
        pk = int(obj_id)
    except (TypeError, ValueError):
        raise ApiError(not_found, 404)
    obj = db.session.scalar(db.select(model).filter_by(id=pk, user_id=current_user_id()))
    if obj is None:
        raise ApiError(not_found, 404)
    return obj


def parse_int(value, message):
    # bool is a subclass of int; reject it explicitly
    if isinstance(value, bool):
        raise ApiError(message)
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str) and re.fullmatch(r'-?\d+', value.strip()):
        return int(value.strip())
    raise ApiError(message)


def parse_text(value, field, max_len, required=True):
    text = (value or '').strip() if isinstance(value, str) or value is None else None
    if text is None:
        raise ApiError(f'{field} harus berupa teks.')
    if required and not text:
        raise ApiError(f'{field} wajib diisi.')
    if len(text) > max_len:
        raise ApiError(f'{field} maksimal {max_len} karakter.')
    return text


def parse_date(value, message='Tanggal tidak valid (format YYYY-MM-DD).', required=True):
    if not value:
        if required:
            raise ApiError(message)
        return None
    try:
        return date.fromisoformat(str(value)).isoformat()
    except ValueError:
        raise ApiError(message)


def parse_month(value):
    if not isinstance(value, str) or not MONTH_RE.match(value):
        raise ApiError('Bulan tidak valid (format YYYY-MM).')
    return value
