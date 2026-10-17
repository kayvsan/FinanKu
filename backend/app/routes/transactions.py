from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Category, Transaction, Wallet
from ..serializers import transaction_to_dict
from ..utils import ApiError, current_user_id, get_json, get_owned, parse_date, parse_int, parse_text

bp = Blueprint('transactions', __name__)

TX_TYPES = {'income', 'expense', 'transfer'}
NOT_FOUND = 'Transaksi tidak ditemukan.'


def _apply(tx, data):
    type_ = data.get('type')
    if type_ not in TX_TYPES:
        raise ApiError('Tipe transaksi tidak valid.')
    amount = parse_int(data.get('amount'), 'Nominal harus lebih dari Rp 0 dan tidak boleh kosong.')
    if amount <= 0:
        raise ApiError('Nominal harus lebih dari Rp 0 dan tidak boleh kosong.')

    wallet = get_owned(Wallet, data.get('walletId'), 'Dompet tidak ditemukan.')
    if type_ == 'transfer':
        to_wallet = get_owned(Wallet, data.get('toWalletId'), 'Dompet tujuan tidak ditemukan.')
        if to_wallet.id == wallet.id:
            raise ApiError('Dompet asal dan tujuan transfer tidak boleh sama.')
        tx.to_wallet_id = to_wallet.id
        tx.category_id = None
    else:
        category = get_owned(Category, data.get('categoryId'), 'Kategori tidak ditemukan.')
        if category.type != type_:
            raise ApiError('Kategori tidak sesuai dengan tipe transaksi.')
        tx.to_wallet_id = None
        tx.category_id = category.id

    tx.type = type_
    tx.amount = amount
    tx.wallet_id = wallet.id
    tx.date = parse_date(data.get('date'))
    tx.note = parse_text(data.get('note'), 'Catatan', 200, required=False)
    tx.tag = parse_text(data.get('tag'), 'Tag', 100, required=False)


@bp.post('')
@jwt_required()
def create_transaction():
    tx = Transaction(user_id=current_user_id())
    _apply(tx, get_json())
    db.session.add(tx)
    db.session.commit()
    return jsonify(transaction_to_dict(tx)), 201


@bp.put('/<tx_id>')
@jwt_required()
def update_transaction(tx_id):
    tx = get_owned(Transaction, tx_id, NOT_FOUND)
    _apply(tx, get_json())
    db.session.commit()
    return jsonify(transaction_to_dict(tx))


@bp.delete('/<tx_id>')
@jwt_required()
def delete_transaction(tx_id):
    tx = get_owned(Transaction, tx_id, NOT_FOUND)
    db.session.delete(tx)
    db.session.commit()
    return jsonify(ok=True)
