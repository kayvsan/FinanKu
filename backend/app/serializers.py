"""Model -> dict in the exact shape the React FinanceContext keeps in `state`."""
from .extensions import db
from .models import Budget, Category, Goal, Transaction, Wallet


def _id(value):
    return str(value) if value is not None else ''


def user_to_dict(user):
    return {'id': _id(user.id), 'username': user.username}


def wallet_to_dict(w):
    return {'id': _id(w.id), 'name': w.name, 'type': w.type, 'initialBalance': w.initial_balance}


def category_to_dict(c):
    return {'id': _id(c.id), 'name': c.name, 'type': c.type}


def transaction_to_dict(t):
    return {
        'id': _id(t.id),
        'type': t.type,
        'amount': t.amount,
        'date': t.date,
        'walletId': _id(t.wallet_id),
        'toWalletId': _id(t.to_wallet_id),
        'categoryId': _id(t.category_id),
        'note': t.note,
        'tag': t.tag,
    }


def goal_to_dict(g):
    return {'id': _id(g.id), 'name': g.name, 'target': g.target, 'saved': g.saved, 'deadline': g.deadline or ''}


def full_state(user_id):
    def rows(model, *order):
        return db.session.scalars(db.select(model).filter_by(user_id=user_id).order_by(*order)).all()

    budgets = {}
    for b in rows(Budget, Budget.id):
        budgets.setdefault(b.month, {})[_id(b.category_id)] = b.amount

    return {
        'wallets': [wallet_to_dict(w) for w in rows(Wallet, Wallet.id)],
        'categories': [category_to_dict(c) for c in rows(Category, Category.id)],
        # Newest first, like the original's unshift() on create
        'transactions': [transaction_to_dict(t) for t in rows(Transaction, Transaction.date.desc(), Transaction.id.desc())],
        'budgets': budgets,
        'goals': [goal_to_dict(g) for g in rows(Goal, Goal.id)],
    }
