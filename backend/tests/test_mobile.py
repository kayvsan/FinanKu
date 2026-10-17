from app import create_app
from app.config import TestConfig

MOBILE = {'X-Client': 'mobile'}


def _register_mobile(client, username='hpuser'):
    res = client.post('/api/auth/register', json={'username': username, 'password': 'rahasia123'}, headers=MOBILE)
    assert res.status_code == 201
    return res


def test_mobile_login_returns_refresh_token_in_body_without_cookie(client):
    body = _register_mobile(client).get_json()
    assert body['accessToken'] and body['refreshToken']
    assert client.get_cookie('refresh_token_cookie', path='/api/auth') is None

    res = client.post('/api/auth/login', json={'username': 'hpuser', 'password': 'rahasia123'}, headers=MOBILE)
    assert res.status_code == 200
    assert res.get_json()['refreshToken']


def test_web_login_still_uses_cookie(client):
    body = client.post('/api/auth/register', json={'username': 'webuser', 'password': 'rahasia123'}).get_json()
    assert 'refreshToken' not in body
    assert client.get_cookie('refresh_token_cookie', path='/api/auth') is not None


def test_mobile_refresh_with_bearer_refresh_token(client):
    tokens = _register_mobile(client).get_json()
    res = client.post('/api/auth/refresh', headers={'Authorization': f"Bearer {tokens['refreshToken']}"})
    assert res.status_code == 200
    access = res.get_json()['accessToken']
    assert client.get('/api/state', headers={'Authorization': f'Bearer {access}'}).status_code == 200

    # An access token is not accepted by /refresh
    res = client.post('/api/auth/refresh', headers={'Authorization': f"Bearer {tokens['accessToken']}"})
    assert res.status_code == 401


def test_mobile_logout_revokes_refresh_token(client):
    tokens = _register_mobile(client).get_json()
    auth = {'Authorization': f"Bearer {tokens['refreshToken']}"}
    assert client.post('/api/auth/logout', headers=auth).status_code == 200
    assert client.post('/api/auth/refresh', headers=auth).status_code == 401


def test_cors_only_for_configured_origins():
    class CorsConfig(TestConfig):
        CORS_ORIGINS = 'http://localhost:8081'

    client = create_app(CorsConfig).test_client()
    allowed = client.options('/api/auth/login', headers={
        'Origin': 'http://localhost:8081', 'Access-Control-Request-Method': 'POST',
    })
    assert allowed.headers.get('Access-Control-Allow-Origin') == 'http://localhost:8081'
    assert 'X-Client' in allowed.headers.get('Access-Control-Allow-Headers', '')

    other = client.options('/api/auth/login', headers={'Origin': 'http://evil.example', 'Access-Control-Request-Method': 'POST'})
    assert 'Access-Control-Allow-Origin' not in other.headers


def test_cors_disabled_by_default(client):
    res = client.options('/api/auth/login', headers={'Origin': 'http://localhost:8081', 'Access-Control-Request-Method': 'POST'})
    assert 'Access-Control-Allow-Origin' not in res.headers
