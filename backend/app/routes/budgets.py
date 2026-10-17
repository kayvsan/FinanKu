from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Budget, Category
from ..utils import ApiError, current_user_id, get_json, get_owned, parse_int, parse_month

bp = Blueprint('budgets', __name__)


@bp.put('/<month>/<cat_id>')
@jwt_required()
def set_budget(month, cat_id):
    """Upsert the limit for one category in one month; an amount <= 0 removes it (saveCategoryBudget)."""
    user_id = current_user_id()
    month = parse_month(month)
    category = get_owned(Category, cat_id, 'Kategori tidak ditemukan.')
    if category.type != 'expense':
        raise ApiError('Anggaran hanya untuk kategori pengeluaran.')
    amount = parse_int(get_json().get('amount'), 'Batas anggaran harus berupa angka.')

    budget = db.session.scalar(db.select(Budget).filter_by(user_id=user_id, month=month, category_id=category.id))
    if amount <= 0:
        if budget is not None:
            db.session.delete(budget)
    elif budget is None:
        db.session.add(Budget(user_id=user_id, month=month, category_id=category.id, amount=amount))
    else:
        budget.amount = amount
    db.session.commit()
    return jsonify(month=month, categoryId=str(category.id), amount=max(amount, 0))
