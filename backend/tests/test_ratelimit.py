from datetime import datetime, timedelta

import pytest

from app import ratelimit

PASSWORD = 'rahasia123'


class Clock:
    def __init__(self):
        self.now = datetime(2026, 10, 18, 10, 0, 0)

    def __call__(self):
        return self.now

    def advance(self, **kwargs):
        self.now += timedelta(**kwargs)


@pytest.fixture
def clock(monkeypatch):
    c = Clock()
    monkeypatch.setattr(ratelimit, 'utcnow', c)
    return c


def login(client, username, password, ip='10.0.0.1'):
    return client.post('/api/auth/login', json={'username': username, 'password': password},
                       environ_overrides={'REMOTE_ADDR': ip})


def register(client, username, ip='10.0.0.1'):
    return client.post('/api/auth/register', json={'username': username, 'password': PASSWORD},
                       environ_overrides={'REMOTE_ADDR': ip})


def test_account_locks_after_five_failures_even_for_correct_password(client, clock):
    assert register(client, 'korban').status_code == 201
    for _ in range(5):
        assert login(client, 'korban', 'salah-salah').status_code == 401
    res = login(client, 'korban', PASSWORD)
    assert res.status_code == 429
    assert res.get_json()['error'] == 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
    assert int(res.headers['Retry-After']) == 15 * 60


def test_lock_lifts_when_oldest_failure_leaves_the_window(client, clock):
    register(client, 'korban')
    for _ in range(5):
        login(client, 'korban', 'salah-salah')
        clock.advance(minutes=1)
    # Oldest failure was at 10:00; at 10:05 the account is still locked for 10 more minutes
    res = login(client, 'korban', PASSWORD)
    assert res.status_code == 429
    assert int(res.headers['Retry-After']) == 10 * 60
    clock.advance(minutes=10, seconds=1)
    assert login(client, 'korban', PASSWORD).status_code == 200


def test_success_resets_the_account_counter(client, clock):
    register(client, 'korban')
    for _ in range(4):
        login(client, 'korban', 'salah-salah')
    assert login(client, 'korban', PASSWORD).status_code == 200
    for _ in range(4):
        assert login(client, 'korban', 'salah-salah').status_code == 401
    assert login(client, 'korban', PASSWORD).status_code == 200


def test_lock_is_case_insensitive_and_same_for_unknown_accounts(client, clock):
    register(client, 'korban')
    for name in ['KORBAN', 'Korban', 'korban', 'KoRbAn', 'korban']:
        login(client, name, 'salah-salah')
    assert login(client, 'korban', PASSWORD).status_code == 429

    # A username that doesn't exist gets the very same treatment (no account enumeration)
    for _ in range(5):
        assert login(client, 'tidakada', 'apapun123').get_json()['error'] == 'Nama pengguna atau kata sandi salah.'
    assert login(client, 'tidakada', 'apapun123').status_code == 429


def test_one_ip_spraying_many_accounts_is_blocked(client, clock):
    register(client, 'korban', ip='10.0.0.99')
    for i in range(20):
        assert login(client, f'tebak{i}', 'salah-salah', ip='6.6.6.6').status_code == 401
    # The attacker's IP is now blocked for every account, even one it never tried
    assert login(client, 'korban', PASSWORD, ip='6.6.6.6').status_code == 429
    # Other users are unaffected
    assert login(client, 'korban', PASSWORD, ip='10.0.0.2').status_code == 200


def test_locked_account_is_not_locked_from_other_ips_forever(client, clock):
    # Per-account lock applies from any IP (that's the point), but only for the window
    register(client, 'korban')
    for _ in range(5):
        login(client, 'korban', 'salah-salah', ip='6.6.6.6')
    assert login(client, 'korban', PASSWORD, ip='10.0.0.2').status_code == 429
    clock.advance(minutes=15, seconds=1)
    assert login(client, 'korban', PASSWORD, ip='10.0.0.2').status_code == 200


def test_register_limited_per_ip(client, clock):
    for i in range(10):
        assert register(client, f'akun{i}', ip='7.7.7.7').status_code == 201
    res = register(client, 'akun10', ip='7.7.7.7')
    assert res.status_code == 429
    assert res.get_json()['error'] == 'Terlalu banyak percobaan pendaftaran. Coba lagi dalam 60 menit.'
    assert register(client, 'akunlain', ip='8.8.8.8').status_code == 201
    clock.advance(hours=1, seconds=1)
    assert register(client, 'akun10', ip='7.7.7.7').status_code == 201


def test_old_attempts_are_cleaned_up(app, client, clock):
    from app.extensions import db
    from app.models import AuthAttempt
    for i in range(3):
        login(client, f'x{i}', 'salah-salah')
    clock.advance(hours=2)
    login(client, 'y', 'salah-salah')
    with app.app_context():
        keys = db.session.scalars(db.select(AuthAttempt.key)).all()
    assert sorted(keys) == ['login-ip:10.0.0.1', 'login-user:y']
