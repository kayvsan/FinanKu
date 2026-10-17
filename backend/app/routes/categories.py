from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Budget, Category, Transaction
from ..serializers import category_to_dict, full_state
from ..utils import ApiError, current_user_id, get_json, get_owned, parse_text

bp = Blueprint('categories', __name__)

CATEGORY_TYPES = {'expense', 'income'}
NOT_FOUND = 'Kategori tidak ditemukan.'


def _apply(cat, data):
    cat.name = parse_text(data.get('name'), 'Nama kategori', 60)
    type_ = data.get('type')
    if type_ not in CATEGORY_TYPES:
        raise ApiError('Tipe kategori tidak valid.')
    cat.type = type_


@bp.post('')
@jwt_required()
def create_category():
    cat = Category(user_id=current_user_id())
    _apply(cat, get_json())
    db.session.add(cat)
    db.session.commit()
    return jsonify(category_to_dict(cat)), 201


@bp.put('/<cat_id>')
@jwt_required()
def update_category(cat_id):
    cat = get_owned(Category, cat_id, NOT_FOUND)
    _apply(cat, get_json())
    db.session.commit()
    return jsonify(category_to_dict(cat))


@bp.delete('/<cat_id>')
@jwt_required()
def delete_category(cat_id):
    user_id = current_user_id()
    cat = get_owned(Category, cat_id, NOT_FOUND)

    same_type = db.session.scalar(
        db.select(db.func.count(Category.id)).where(Category.user_id == user_id, Category.type == cat.type, Category.id != cat.id)
    )
    if same_type == 0:
        raise ApiError('Tidak dapat menghapus satu-satunya kategori pada tipe ini.', 409)

    used = db.session.scalar(
        db.select(db.func.count(Transaction.id)).where(Transaction.user_id == user_id, Transaction.category_id == cat.id)
    )
    if used > 0:
        replace_with = request.args.get('replaceWith')
        if not replace_with:
            raise ApiError(f'Kategori "{cat.name}" sedang digunakan oleh {used} transaksi. Pilih kategori pengganti.', 409)
        replacement = get_owned(Category, replace_with, 'Kategori pengganti tidak ditemukan.')
        if replacement.id == cat.id or replacement.type != cat.type:
            raise ApiError('Kategori pengganti harus berbeda dan bertipe sama.')
        db.session.execute(
            db.update(Transaction)
            .where(Transaction.user_id == user_id, Transaction.category_id == cat.id)
            .values(category_id=replacement.id)
        )

    db.session.execute(db.delete(Budget).where(Budget.user_id == user_id, Budget.category_id == cat.id))
    db.session.delete(cat)
    db.session.commit()
    return jsonify(full_state(user_id))
