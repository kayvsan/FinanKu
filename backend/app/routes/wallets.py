from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Transaction, Wallet
from ..serializers import full_state, wallet_to_dict
from ..utils import ApiError, current_user_id, get_json, get_owned, parse_int, parse_text

bp = Blueprint('wallets', __name__)

WALLET_TYPES = {'Bank', 'E-Wallet', 'Tunai'}
NOT_FOUND = 'Dompet tidak ditemukan.'


def _apply(wallet, data):
    wallet.name = parse_text(data.get('name'), 'Nama dompet', 60)
    type_ = data.get('type')
    if type_ not in WALLET_TYPES:
        raise ApiError('Jenis dompet tidak valid.')
    wallet.type = type_
    initial = parse_int(data.get('initialBalance', 0), 'Saldo awal harus berupa angka.')
    if initial < 0:
        raise ApiError('Saldo awal tidak boleh negatif.')
    wallet.initial_balance = initial


@bp.post('')
@jwt_required()
def create_wallet():
    wallet = Wallet(user_id=current_user_id())
    _apply(wallet, get_json())
    db.session.add(wallet)
    db.session.commit()
    return jsonify(wallet_to_dict(wallet)), 201


@bp.put('/<wallet_id>')
@jwt_required()
def update_wallet(wallet_id):
    wallet = get_owned(Wallet, wallet_id, NOT_FOUND)
    _apply(wallet, get_json())
    db.session.commit()
    return jsonify(wallet_to_dict(wallet))


@bp.delete('/<wallet_id>')
@jwt_required()
def delete_wallet(wallet_id):
    user_id = current_user_id()
    wallet = get_owned(Wallet, wallet_id, NOT_FOUND)
    count = db.session.scalar(db.select(db.func.count(Wallet.id)).filter_by(user_id=user_id))
    if count <= 1:
        raise ApiError('Anda harus memiliki minimal 1 dompet aktif.', 409)
    # Same rule as the original: deleting a wallet removes its transactions (both directions of transfers)
    db.session.execute(db.delete(Transaction).where(
        Transaction.user_id == user_id,
        (Transaction.wallet_id == wallet.id) | (Transaction.to_wallet_id == wallet.id),
    ))
    db.session.delete(wallet)
    db.session.commit()
    return jsonify(full_state(user_id))
