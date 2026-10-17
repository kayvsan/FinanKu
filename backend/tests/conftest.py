import os
import sys
from datetime import date

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app  # noqa: E402
from app.config import TestConfig  # noqa: E402


# Demo data and legacy imports are dated relative to today
CURRENT_MONTH = date.today().strftime('%Y-%m')


@pytest.fixture
def app():
    return create_app(TestConfig)


@pytest.fixture
def client(app):
    return app.test_client()


class Api:
    """Small helper around the test client that remembers the access token."""

    def __init__(self, client):
        self.client = client
        self.token = None

    def _headers(self, extra=None):
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        headers.update(extra or {})
        return headers

    def register(self, username='tester', password='rahasia123'):
        res = self.client.post('/api/auth/register', json={'username': username, 'password': password})
        if res.status_code == 201:
            self.token = res.get_json()['accessToken']
        return res

    def login(self, username='tester', password='rahasia123'):
        res = self.client.post('/api/auth/login', json={'username': username, 'password': password})
        if res.status_code == 200:
            self.token = res.get_json()['accessToken']
        return res

    def csrf(self):
        cookie = self.client.get_cookie('csrf_refresh_token')
        return {'X-CSRF-TOKEN': cookie.value} if cookie else {}

    def get(self, path):
        return self.client.get(path, headers=self._headers())

    def post(self, path, json=None, headers=None):
        return self.client.post(path, json=json, headers=self._headers(headers))

    def put(self, path, json=None):
        return self.client.put(path, json=json, headers=self._headers())

    def patch(self, path, json=None):
        return self.client.patch(path, json=json, headers=self._headers())

    def delete(self, path):
        return self.client.delete(path, headers=self._headers())

    def state(self):
        return self.get('/api/state').get_json()


@pytest.fixture
def api(client):
    return Api(client)


@pytest.fixture
def user(api):
    assert api.register().status_code == 201
    return api
