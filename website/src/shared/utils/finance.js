export function calculateWalletBalance(state, walletId) {
  const w = state.wallets.find(x => x.id === walletId);
  if (!w) return 0;
  let bal = Number(w.initialBalance) || 0;
  for (const tx of state.transactions) {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income' && tx.walletId === walletId) bal += amt;
    else if (tx.type === 'expense' && tx.walletId === walletId) bal -= amt;
    else if (tx.type === 'transfer') {
      if (tx.walletId === walletId) bal -= amt;
      if (tx.toWalletId === walletId) bal += amt;
    }
  }
  return bal;
}

export function calculateTotalBalance(state) {
  return state.wallets.reduce((acc, w) => acc + calculateWalletBalance(state, w.id), 0);
}

export function getMonthlySummary(state, yyyyMm) {
  let income = 0, expense = 0;
  const byCategory = {};
  for (const tx of state.transactions) {
    if (!tx.date || !tx.date.startsWith(yyyyMm)) continue;
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') income += amt;
    else if (tx.type === 'expense') {
      expense += amt;
      byCategory[tx.categoryId] = (byCategory[tx.categoryId] || 0) + amt;
    }
  }
  return { income, expense, net: income - expense, byCategory };
}

export function getCategoryById(state, id) {
  return state.categories.find(c => c.id === id) || { id: 'unknown', name: 'Tanpa Kategori', type: 'expense' };
}

export function getWalletById(state, id) {
  return state.wallets.find(w => w.id === id) || { id: 'unknown', name: 'Dompet Terhapus' };
}

// Budget status per expense category for a month (used by dashboard alerts & header bell)
export function getBudgetStatuses(state, yyyyMm) {
  const monthBudgets = state.budgets[yyyyMm] || {};
  const { byCategory } = getMonthlySummary(state, yyyyMm);
  return state.categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const limit = Number(monthBudgets[cat.id]) || 0;
      const spent = byCategory[cat.id] || 0;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { cat, limit, spent, pct };
    })
    .filter(b => b.limit > 0);
}
