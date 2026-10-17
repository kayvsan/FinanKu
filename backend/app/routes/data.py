from datetime import date

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Budget, Category, Goal, Transaction, Wallet
from ..seed import clear_user_data, create_default_categories, seed_demo
from ..serializers import full_state
from ..utils import MONTH_RE, ApiError, current_user_id, get_json, parse_date, parse_int, parse_text

bp = Blueprint('data', __name__)

INVALID_FILE = 'Format file JSON tidak valid.'


@bp.post('/seed')
@jwt_required()
def seed():
    user_id = current_user_id()
    seed_demo(user_id)
    db.session.commit()
    return jsonify(full_state(user_id))


@bp.delete('')
@jwt_required()
def clear():
    """clearAllData(): wipe wallets, transactions, budgets and goals; categories stay."""
    user_id = current_user_id()
    clear_user_data(user_id, keep_categories=True)
    db.session.commit()
    return jsonify(full_state(user_id))


def _rows(data, key):
    value = data.get(key, [])
    if not isinstance(value, list):
        raise ApiError(INVALID_FILE)
    return [row for row in value if isinstance(row, dict)]


@bp.post('/import')
@jwt_required()
def import_data():
    """Replace all of the user's data with a backup file (the JSON produced by "Unduh Backup").

    Ids in the file are the old ones; every row gets a new id and references are remapped.
    Rows that are malformed or point at unknown wallets/categories are skipped.
    """
    user_id = current_user_id()
    data = get_json()
    if not isinstance(data.get('wallets'), list) or not isinstance(data.get('transactions'), list):
        raise ApiError(INVALID_FILE)

    clear_user_data(user_id, keep_categories=False)

    cat_map = {}
    for row in _rows(data, 'categories'):
        try:
            if row.get('type') not in ('expense', 'income'):
                continue
            cat = Category(user_id=user_id, name=parse_text(row.get('name'), 'Nama kategori', 60), type=row['type'])
        except ApiError:
            continue
        db.session.add(cat)
        db.session.flush()
        cat_map[str(row.get('id'))] = cat
    if not cat_map:
        create_default_categories(user_id)

    wallet_map = {}
    for row in _rows(data, 'wallets'):
        try:
            if row.get('type') not in ('Bank', 'E-Wallet', 'Tunai'):
                continue
            wallet = Wallet(
                user_id=user_id,
                name=parse_text(row.get('name'), 'Nama dompet', 60),
                type=row['type'],
                initial_balance=max(0, parse_int(row.get('initialBalance', 0), 'Saldo awal')),
            )
        except ApiError:
            continue
        db.session.add(wallet)
        db.session.flush()
        wallet_map[str(row.get('id'))] = wallet

    for row in reversed(_rows(data, 'transactions')):  # file lists newest first
        try:
            type_ = row.get('type')
            amount = parse_int(row.get('amount'), 'Nominal')
            # Older exports stored the transfer source as fromWalletId
            wallet = wallet_map.get(str(row.get('walletId') or row.get('fromWalletId')))
            if type_ not in ('income', 'expense', 'transfer') or amount <= 0 or wallet is None:
                continue
            tx = Transaction(
                user_id=user_id, type=type_, amount=amount, wallet_id=wallet.id,
                date=parse_date(row.get('date')),
                note=parse_text(row.get('note'), 'Catatan', 200, required=False),
                tag=parse_text(row.get('tag'), 'Tag', 100, required=False),
            )
            if type_ == 'transfer':
                to_wallet = wallet_map.get(str(row.get('toWalletId')))
                if to_wallet is None or to_wallet.id == wallet.id:
                    continue
                tx.to_wallet_id = to_wallet.id
            else:
                cat = cat_map.get(str(row.get('categoryId')))
                tx.category_id = cat.id if cat is not None and cat.type == type_ else None
        except ApiError:
            continue
        db.session.add(tx)

    budgets = data.get('budgets') or {}
    if isinstance(budgets, dict):
        # Older exports kept one flat {categoryId: amount} map
        if budgets and all(isinstance(v, (int, float)) for v in budgets.values()):
            budgets = {date.today().strftime('%Y-%m'): budgets}
        for month, limits in budgets.items():
            if not isinstance(month, str) or not MONTH_RE.match(month) or not isinstance(limits, dict):
                continue
            for old_cat_id, amount in limits.items():
                cat = cat_map.get(str(old_cat_id))
                try:
                    amount = parse_int(amount, 'Anggaran')
                except ApiError:
                    continue
                if cat is not None and cat.type == 'expense' and amount > 0:
                    db.session.add(Budget(user_id=user_id, month=month, category_id=cat.id, amount=amount))

    for row in _rows(data, 'goals'):
        try:
            target = parse_int(row.get('target'), 'Target')
            if target <= 0:
                continue
            db.session.add(Goal(
                user_id=user_id,
                name=parse_text(row.get('name') or row.get('title'), 'Nama target', 80),
                target=target,
                saved=max(0, parse_int(row.get('saved', row.get('current', 0)) or 0, 'Terkumpul')),
                deadline=parse_date(row.get('deadline'), required=False),
            ))
        except ApiError:
            continue

    db.session.commit()
    return jsonify(full_state(user_id))
