from conftest import CURRENT_MONTH, Api


def _by_name(items, name):
    return next(i for i in items if i['name'] == name)


def _total_balance(state):
    total = sum(w['initialBalance'] for w in state['wallets'])
    for tx in state['transactions']:
        if tx['type'] == 'income':
            total += tx['amount']
        elif tx['type'] == 'expense':
            total -= tx['amount']
    return total


def test_demo_total_matches_original(user):
    assert _total_balance(user.state()) == 41105000


def test_user_isolation(user):
    wallet_id = user.state()['wallets'][0]['id']
    other = Api(user.client.application.test_client())
    other.register('lainnya')
    assert other.put(f'/api/wallets/{wallet_id}', json={'name': 'Hack', 'type': 'Bank', 'initialBalance': 0}).status_code == 404
    assert other.delete(f'/api/wallets/{wallet_id}').status_code == 404
    assert all(w['id'] != wallet_id for w in other.state()['wallets'])


def test_transaction_crud_and_validation(user):
    state = user.state()
    bca = _by_name(state['wallets'], 'BCA Utama')['id']
    gopay = _by_name(state['wallets'], 'GoPay')['id']
    makan = _by_name(state['categories'], 'Makan & Minum')['id']
    gaji = _by_name(state['categories'], 'Gaji')['id']

    base = {'type': 'expense', 'amount': 50000, 'date': '2026-10-20', 'walletId': bca, 'categoryId': makan, 'note': ' Bakso ', 'tag': '#makan'}
    res = user.post('/api/transactions', json=base)
    assert res.status_code == 201
    tx = res.get_json()
    assert tx['note'] == 'Bakso' and tx['toWalletId'] == ''

    assert user.post('/api/transactions', json={**base, 'amount': 0}).get_json()['error'].startswith('Nominal')
    assert user.post('/api/transactions', json={**base, 'categoryId': gaji}).status_code == 400  # income category on expense
    assert user.post('/api/transactions', json={**base, 'date': '2026-13-01'}).status_code == 400
    same = {'type': 'transfer', 'amount': 1000, 'date': '2026-10-20', 'walletId': bca, 'toWalletId': bca}
    assert user.post('/api/transactions', json=same).get_json()['error'] == 'Dompet asal dan tujuan transfer tidak boleh sama.'

    transfer = user.post('/api/transactions', json={**same, 'toWalletId': gopay}).get_json()
    assert transfer['categoryId'] == ''

    res = user.put(f"/api/transactions/{tx['id']}", json={**base, 'amount': 75000})
    assert res.get_json()['amount'] == 75000
    assert user.delete(f"/api/transactions/{tx['id']}").status_code == 200
    assert user.delete(f"/api/transactions/{tx['id']}").status_code == 404


def test_wallet_rules(user):
    state = user.state()
    gopay = _by_name(state['wallets'], 'GoPay')['id']
    gopay_txs = [t for t in state['transactions'] if gopay in (t['walletId'], t['toWalletId'])]
    assert gopay_txs

    assert user.post('/api/wallets', json={'name': '', 'type': 'Bank'}).status_code == 400
    assert user.post('/api/wallets', json={'name': 'X', 'type': 'Kripto'}).status_code == 400

    new_state = user.delete(f'/api/wallets/{gopay}').get_json()
    assert all(w['id'] != gopay for w in new_state['wallets'])
    assert all(gopay not in (t['walletId'], t['toWalletId']) for t in new_state['transactions'])

    for w in new_state['wallets'][1:]:
        user.delete(f"/api/wallets/{w['id']}")
    res = user.delete(f"/api/wallets/{new_state['wallets'][0]['id']}")
    assert res.status_code == 409


def test_category_delete_with_replacement(user):
    state = user.state()
    makan = _by_name(state['categories'], 'Makan & Minum')['id']
    hiburan = _by_name(state['categories'], 'Hiburan')['id']
    gaji = _by_name(state['categories'], 'Gaji')['id']

    assert user.delete(f'/api/categories/{makan}').status_code == 409  # in use, no replacement
    assert user.delete(f'/api/categories/{makan}?replaceWith={gaji}').status_code == 400  # wrong type
    new_state = user.delete(f'/api/categories/{makan}?replaceWith={hiburan}').get_json()
    assert all(c['id'] != makan for c in new_state['categories'])
    assert not any(t['categoryId'] == makan for t in new_state['transactions'])
    assert makan not in new_state['budgets'][CURRENT_MONTH]

    # Last income categories cannot all be removed
    incomes = [c for c in new_state['categories'] if c['type'] == 'income']
    for c in incomes[:-1]:
        r = user.delete(f"/api/categories/{c['id']}?replaceWith={incomes[-1]['id']}")
        assert r.status_code == 200
    assert user.delete(f"/api/categories/{incomes[-1]['id']}").status_code == 409


def test_budget_upsert_and_delete(user):
    hiburan = _by_name(user.state()['categories'], 'Hiburan')['id']
    gaji = _by_name(user.state()['categories'], 'Gaji')['id']
    assert user.put(f'/api/budgets/2026-11/{hiburan}', json={'amount': 300000}).status_code == 200
    assert user.state()['budgets']['2026-11'][hiburan] == 300000
    user.put(f'/api/budgets/2026-11/{hiburan}', json={'amount': 450000})
    assert user.state()['budgets']['2026-11'][hiburan] == 450000
    user.put(f'/api/budgets/2026-11/{hiburan}', json={'amount': 0})
    assert hiburan not in user.state()['budgets'].get('2026-11', {})
    assert user.put(f'/api/budgets/2026-13/{hiburan}', json={'amount': 1}).status_code == 400
    assert user.put(f'/api/budgets/2026-11/{gaji}', json={'amount': 1}).status_code == 400


def test_goals(user):
    goal = user.post('/api/goals', json={'name': 'Laptop', 'target': 10000000, 'deadline': ''}).get_json()
    assert goal['saved'] == 0 and goal['deadline'] == ''
    assert user.patch(f"/api/goals/{goal['id']}/adjust", json={'amount': 500000}).get_json()['saved'] == 500000
    assert user.patch(f"/api/goals/{goal['id']}/adjust", json={'amount': -900000}).get_json()['saved'] == 0
    assert user.post('/api/goals', json={'name': 'X', 'target': 0}).status_code == 400
    assert user.delete(f"/api/goals/{goal['id']}").status_code == 200


def test_clear_seed_and_import_roundtrip(user):
    backup = user.state()

    cleared = user.delete('/api/data').get_json()
    assert cleared['wallets'] == [] and cleared['transactions'] == [] and cleared['goals'] == []
    assert len(cleared['categories']) == 11

    restored = user.post('/api/data/import', json=backup).get_json()
    assert len(restored['wallets']) == 3
    assert len(restored['transactions']) == 13
    assert _total_balance(restored) == 41105000
    assert sorted(restored['budgets'][CURRENT_MONTH].values()) == sorted(backup['budgets'][CURRENT_MONTH].values())

    assert user.post('/api/data/import', json={'foo': 1}).status_code == 400

    seeded = user.post('/api/data/seed').get_json()
    assert _total_balance(seeded) == 41105000


def test_import_legacy_shape(user):
    legacy = {
        'wallets': [{'id': 'w1', 'name': 'Bank', 'type': 'Bank', 'initialBalance': 1000}],
        'categories': [{'id': 'c1', 'name': 'Makan', 'type': 'expense'}],
        'transactions': [{'id': 't1', 'type': 'expense', 'amount': 100, 'date': '2026-10-01', 'walletId': 'w1', 'categoryId': 'c1'}],
        'budgets': {'c1': 500},
        'goals': [{'id': 'g1', 'title': 'Lama', 'target': 1000, 'current': 200}],
    }
    state = user.post('/api/data/import', json=legacy).get_json()
    assert list(state['budgets'][CURRENT_MONTH].values()) == [500]
    assert state['goals'][0]['name'] == 'Lama' and state['goals'][0]['saved'] == 200
