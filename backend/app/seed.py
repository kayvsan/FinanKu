"""Default categories and demo data, ported from seedDemoData() in website/index.original.html."""
from datetime import date

from .extensions import db
from .models import Budget, Category, Goal, Transaction, Wallet

# (key, name, type) — keys are only used to wire the demo rows together
DEFAULT_CATEGORIES = [
    ('c_makan', 'Makan & Minum', 'expense'),
    ('c_trans', 'Transportasi', 'expense'),
    ('c_belanja', 'Belanja', 'expense'),
    ('c_tagihan', 'Tagihan', 'expense'),
    ('c_hiburan', 'Hiburan', 'expense'),
    ('c_sehat', 'Kesehatan', 'expense'),
    ('c_didik', 'Pendidikan', 'expense'),
    ('c_lain_out', 'Lainnya (Pengeluaran)', 'expense'),
    ('c_gaji', 'Gaji', 'income'),
    ('c_bonus', 'Bonus', 'income'),
    ('c_lain_in', 'Lainnya (Pemasukan)', 'income'),
]

DEMO_WALLETS = [
    ('w_bca', 'BCA Utama', 'Bank', 8500000),
    ('w_gopay', 'GoPay', 'E-Wallet', 650000),
    ('w_tunai', 'Dompet Tunai', 'Tunai', 400000),
]

MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

# The original pinned the demo to Jul–Oct 2026. Here the same rows are placed relative to the current
# month (0 = this month, -1 = last month, ...) so a new account always opens on a filled-in month.
# (type, amount, month offset, day, category, wallet, to_wallet, note, tag) — {bulan}/{tahun} fill the note
DEMO_TRANSACTIONS = [
    ('income', 12500000, 0, 1, 'c_gaji', 'w_bca', None, 'Gaji {bulan} {tahun}', '#gaji'),
    ('expense', 1450000, 0, 3, 'c_tagihan', 'w_bca', None, 'Listrik PLN, Internet & Air', '#rutin'),
    ('expense', 85000, 0, 5, 'c_makan', 'w_gopay', None, 'Kopi & Sarapan Pagi', '#ngopi'),
    ('expense', 420000, 0, 8, 'c_belanja', 'w_bca', None, 'Belanja bulanan supermarket', '#rumah'),
    ('expense', 210000, 0, 11, 'c_trans', 'w_gopay', None, 'Isi bensin & GoRide', '#kantor'),
    ('expense', 980000, 0, 14, 'c_makan', 'w_bca', None, 'Makan malam keluarga akhir pekan', '#keluarga'),
    ('transfer', 500000, 0, 15, None, 'w_bca', 'w_gopay', 'Top up GoPay dari BCA', '#topup'),
    ('income', 12500000, -1, 1, 'c_gaji', 'w_bca', None, 'Gaji {bulan}', '#gaji'),
    ('expense', 4800000, -1, 18, 'c_makan', 'w_bca', None, 'Pengeluaran {bulan}', ''),
    ('income', 12000000, -2, 1, 'c_gaji', 'w_bca', None, 'Gaji {bulan}', '#gaji'),
    ('expense', 5300000, -2, 20, 'c_belanja', 'w_bca', None, 'Pengeluaran {bulan}', ''),
    ('income', 12000000, -3, 1, 'c_gaji', 'w_bca', None, 'Gaji {bulan}', '#gaji'),
    ('expense', 4200000, -3, 19, 'c_tagihan', 'w_bca', None, 'Pengeluaran {bulan}', ''),
]

# Limits for the current month
DEMO_BUDGETS = {'c_makan': 1200000, 'c_tagihan': 1500000, 'c_belanja': 1000000, 'c_trans': 600000}

# (name, target, saved, deadline as months from now, day)
DEMO_GOALS = [
    ('Dana Darurat 6x', 30000000, 12500000, 8, 1),
    ('Liburan ke Kyoto', 15000000, 4500000, 5, 15),
]


def shift_month(today, offset):
    """(year, month) `offset` months away from `today`."""
    index = today.year * 12 + (today.month - 1) + offset
    return index // 12, index % 12 + 1


def _iso(year, month, day):
    return f'{year:04d}-{month:02d}-{day:02d}'


def clear_user_data(user_id, keep_categories=True):
    models = [Transaction, Budget, Goal, Wallet]
    if not keep_categories:
        models.append(Category)
    for model in models:
        db.session.execute(db.delete(model).where(model.user_id == user_id))


def create_default_categories(user_id):
    cats = {}
    for key, name, type_ in DEFAULT_CATEGORIES:
        cat = Category(user_id=user_id, name=name, type=type_)
        db.session.add(cat)
        cats[key] = cat
    db.session.flush()
    return cats


def seed_demo(user_id, today=None):
    """Replace every row of the user with the demo dataset, dated around `today`. Caller commits."""
    today = today or date.today()
    clear_user_data(user_id, keep_categories=False)
    cats = create_default_categories(user_id)

    wallets = {}
    for key, name, type_, initial in DEMO_WALLETS:
        w = Wallet(user_id=user_id, name=name, type=type_, initial_balance=initial)
        db.session.add(w)
        wallets[key] = w
    db.session.flush()

    for type_, amount, offset, day, cat, wallet, to_wallet, note, tag in DEMO_TRANSACTIONS:
        year, month = shift_month(today, offset)
        db.session.add(Transaction(
            user_id=user_id, type=type_, amount=amount, date=_iso(year, month, day),
            category_id=cats[cat].id if cat else None,
            wallet_id=wallets[wallet].id,
            to_wallet_id=wallets[to_wallet].id if to_wallet else None,
            note=note.format(bulan=MONTH_NAMES_ID[month - 1], tahun=year), tag=tag,
        ))

    this_month = _iso(today.year, today.month, 1)[:7]
    for cat, amount in DEMO_BUDGETS.items():
        db.session.add(Budget(user_id=user_id, month=this_month, category_id=cats[cat].id, amount=amount))

    for name, target, saved, months_ahead, day in DEMO_GOALS:
        year, month = shift_month(today, months_ahead)
        db.session.add(Goal(user_id=user_id, name=name, target=target, saved=saved, deadline=_iso(year, month, day)))
