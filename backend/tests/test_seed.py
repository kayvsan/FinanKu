from datetime import date

from conftest import CURRENT_MONTH

from app.extensions import db
from app.models import User
from app.seed import seed_demo
from app.serializers import full_state


def _seeded_state(app, today):
    with app.app_context():
        user = User(username='seed', username_lower='seed', password_hash='x')
        db.session.add(user)
        db.session.flush()
        seed_demo(user.id, today=today)
        db.session.commit()
        return full_state(user.id)


def test_demo_data_is_dated_around_today(app):
    state = _seeded_state(app, date(2026, 10, 18))
    months = sorted({t['date'][:7] for t in state['transactions']})
    assert months == ['2026-07', '2026-08', '2026-09', '2026-10']
    assert list(state['budgets']) == ['2026-10']
    notes = {t['note'] for t in state['transactions']}
    assert 'Gaji Oktober 2026' in notes and 'Pengeluaran Juli' in notes
    assert sorted(g['deadline'] for g in state['goals']) == ['2027-03-15', '2027-06-01']


def test_demo_data_crosses_year_boundary(app):
    state = _seeded_state(app, date(2027, 1, 5))
    months = sorted({t['date'][:7] for t in state['transactions']})
    assert months == ['2026-10', '2026-11', '2026-12', '2027-01']
    assert list(state['budgets']) == ['2027-01']
    notes = {t['note'] for t in state['transactions']}
    assert 'Gaji Januari 2027' in notes and 'Gaji Desember' in notes


def test_new_account_opens_on_current_month(user):
    state = user.state()
    assert list(state['budgets']) == [CURRENT_MONTH]
    assert any(t['date'].startswith(CURRENT_MONTH) for t in state['transactions'])
