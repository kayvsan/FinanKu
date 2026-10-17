from conftest import CURRENT_MONTH, Api


def test_register_seeds_demo_data_and_returns_token(api):
    res = api.register('Kams')
    assert res.status_code == 201
    body = res.get_json()
    assert body['user']['username'] == 'Kams'
    assert body['accessToken']
    state = api.state()
    assert len(state['wallets']) == 3
    assert len(state['transactions']) == 13
    assert len(state['categories']) == 11
    assert len(state['goals']) == 2
    assert len(state['budgets'][CURRENT_MONTH]) == 4


def test_register_validation_and_duplicate(api):
    assert api.register('ab').status_code == 400
    assert api.register('valid', 'short').status_code == 400
    assert api.register('kams').status_code == 201
    dup = Api(api.client).register('KAMS')
    assert dup.status_code == 409


def test_login(user):
    assert user.login('tester', 'salah-sandi').status_code == 401
    assert user.login('nobody', 'rahasia123').status_code == 401
    res = user.login('TESTER', 'rahasia123')
    assert res.status_code == 200
    assert res.get_json()['user']['username'] == 'tester'


def test_protected_routes_require_access_token(api):
    res = api.get('/api/state')
    assert res.status_code == 401
    assert 'error' in res.get_json()
    api.token = 'not-a-jwt'
    assert api.get('/api/state').status_code == 401


def test_refresh_uses_cookie_and_csrf(user):
    assert user.client.post('/api/auth/refresh').status_code == 401  # cookie present but CSRF header missing
    res = user.client.post('/api/auth/refresh', headers=user.csrf())
    assert res.status_code == 200
    body = res.get_json()
    assert body['user']['username'] == 'tester'
    user.token = body['accessToken']
    assert user.get('/api/auth/me').status_code == 200


def test_access_token_cannot_be_used_as_refresh(user):
    res = user.client.post('/api/auth/refresh', headers={'Authorization': f'Bearer {user.token}'})
    assert res.status_code == 401


def test_logout_revokes_refresh_token(user):
    csrf = user.csrf()
    old_refresh = user.client.get_cookie('refresh_token_cookie', path='/api/auth').value
    assert user.client.post('/api/auth/logout', headers=csrf).status_code == 200
    assert user.client.get_cookie('refresh_token_cookie', path='/api/auth') is None
    # Replaying the old refresh token is rejected
    user.client.set_cookie('refresh_token_cookie', old_refresh, path='/api/auth')
    assert user.client.post('/api/auth/refresh', headers=csrf).status_code == 401


def test_logout_without_session_still_ok(client):
    assert client.post('/api/auth/logout').status_code == 200


def test_concurrent_duplicate_registration_returns_409(api, monkeypatch):
    # Simulate the race: the second request's "already taken?" check runs before the first one committed
    assert api.register('balapan').status_code == 201
    from app.routes import auth
    monkeypatch.setattr(auth, '_username_taken', lambda username: False)
    res = Api(api.client).register('BALAPAN')
    assert res.status_code == 409
    assert res.get_json()['error'] == 'Nama pengguna sudah terdaftar. Silakan masuk.'
