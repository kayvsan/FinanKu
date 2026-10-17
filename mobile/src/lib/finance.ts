// Ported from website/src/shared/utils/finance.js
import type { Category, FinanceState, Wallet } from './types';

export function calculateWalletBalance(state: FinanceState, walletId: string) {
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

export function calculateTotalBalance(state: FinanceState) {
  return state.wallets.reduce((acc, w) => acc + calculateWalletBalance(state, w.id), 0);
}

export function getMonthlySummary(state: FinanceState, yyyyMm: string) {
  let income = 0;
  let expense = 0;
  const byCategory: Record<string, number> = {};
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

export function getCategoryById(state: FinanceState, id: string): Category {
  return state.categories.find(c => c.id === id) || { id: 'unknown', name: 'Tanpa Kategori', type: 'expense' };
}

export function getWalletById(state: FinanceState, id: string): Pick<Wallet, 'id' | 'name'> {
  return state.wallets.find(w => w.id === id) || { id: 'unknown', name: 'Dompet Terhapus' };
}

export interface BudgetStatus {
  cat: Category;
  limit: number;
  spent: number;
  pct: number;
}

// Expense categories that have a limit in the given month
export function getBudgetStatuses(state: FinanceState, yyyyMm: string): BudgetStatus[] {
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

export type BudgetLevel = 'safe' | 'warn' | 'over';

export function budgetLevel(pct: number): BudgetLevel {
  if (pct >= 100) return 'over';
  if (pct >= 80) return 'warn';
  return 'safe';
}
