// Mobile counterpart of website/src/context/FinanceContext.jsx: server state, the selected month,
// transaction filters, which modal is open, and every mutation (one at a time, tracked as "busy").
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import LoadingScreen from '@/components/LoadingScreen';
import { apiFetch } from '@/lib/api';
import { confirmAsync, showAlert } from '@/lib/dialogs';
import { getBudgetStatuses } from '@/lib/finance';
import { currentMonth, shiftMonth } from '@/lib/formatters';
import type { Category, FinanceState, Goal, Transaction, TxType, Wallet, WalletType, CategoryType } from '@/lib/types';

export interface TxFilters {
  search: string;
  type: 'all' | TxType;
  category: string;
  wallet: string;
  start: string;
  end: string;
}

export const DEFAULT_TX_FILTERS: TxFilters = { search: '', type: 'all', category: 'all', wallet: 'all', start: '', end: '' };

export type TxPayload = Omit<Transaction, 'id'> & { id?: string };

interface ModalsState {
  tx: { open: boolean; type: TxType; editTx: Transaction | null };
  wallet: { open: boolean; editWallet: Wallet | null };
  category: { open: boolean; editCategory: Category | null };
  categoryReplace: { open: boolean; categoryId: string | null };
  goal: { open: boolean };
  goalAdjust: { open: boolean; goal: Goal | null; sign: 1 | -1 };
}

const CLOSED_MODALS: ModalsState = {
  tx: { open: false, type: 'expense', editTx: null },
  wallet: { open: false, editWallet: null },
  category: { open: false, editCategory: null },
  categoryReplace: { open: false, categoryId: null },
  goal: { open: false },
  goalAdjust: { open: false, goal: null, sign: 1 },
};

function useFinanceValue() {
  const [state, setState] = useState<FinanceState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [txFilters, setTxFilters] = useState<TxFilters>(DEFAULT_TX_FILTERS);
  const [txDisplayLimit, setTxDisplayLimit] = useState(15);
  const [modals, setModals] = useState<ModalsState>(CLOSED_MODALS);

  const fetchState = useCallback(() => {
    apiFetch<FinanceState>('/state')
      .then(setState)
      .catch(err => setLoadError(err.message));
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const retryLoad = () => {
    setLoadError('');
    fetchState();
  };

  // Pull-to-refresh: reload everything from the server without the full-screen loader
  const [refreshing, setRefreshing] = useState(false);
  const reload = async () => {
    setRefreshing(true);
    try {
      setState(await apiFetch<FinanceState>('/state'));
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const changeGlobalMonth = (delta: number) => setSelectedMonth(m => shiftMonth(m, delta));

  // ─── MODALS ───
  const openModal = <K extends keyof ModalsState>(key: K, value: ModalsState[K]) =>
    setModals(m => ({ ...m, [key]: value }));
  const closeModal = (key: keyof ModalsState) => setModals(m => ({ ...m, [key]: CLOSED_MODALS[key] }));

  const openTransactionModal = (type: TxType = 'expense') => openModal('tx', { open: true, type, editTx: null });
  const openEditTransaction = (tx: Transaction) => openModal('tx', { open: true, type: tx.type, editTx: tx });
  const openWalletModal = (editWallet: Wallet | null = null) => openModal('wallet', { open: true, editWallet });
  const openCategoryModal = (editCategory: Category | null = null) => openModal('category', { open: true, editCategory });
  const openGoalModal = () => openModal('goal', { open: true });
  const openGoalAdjust = (goal: Goal, sign: 1 | -1) => openModal('goalAdjust', { open: true, goal, sign });

  const budgetAlertCount = useMemo(
    () => (state ? getBudgetStatuses(state, selectedMonth).filter(b => b.pct >= 80).length : 0),
    [state, selectedMonth],
  );

  /**
   * Run one mutation under `key` so the UI can show it as busy. A second mutation started while one is in
   * flight is ignored (stops double taps). Errors are shown as an alert unless `throwErrors` is set.
   */
  const run = async (key: string, fn: () => Promise<void>, { throwErrors = false } = {}) => {
    if (busyRef.current) return false;
    busyRef.current = key;
    setBusyKey(key);
    try {
      await fn();
      return true;
    } catch (err: any) {
      if (throwErrors) throw err;
      showAlert(err.message);
      return false;
    } finally {
      busyRef.current = null;
      setBusyKey(null);
    }
  };
  const isBusy = (key: string) => busyKey === key;

  const patch = (fn: (s: FinanceState) => FinanceState) => setState(prev => (prev ? fn(prev) : prev));

  // ─── TRANSACTIONS ───
  // Throws on failure so the transaction sheet can show the message inline
  const saveTransaction = ({ id, ...payload }: TxPayload) => run('tx-save', async () => {
    const saved = await apiFetch<Transaction>(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', body: payload });
    patch(s => ({
      ...s,
      transactions: id ? s.transactions.map(t => (t.id === id ? saved : t)) : [saved, ...s.transactions],
    }));
    setSelectedMonth(saved.date.slice(0, 7));
  }, { throwErrors: true });

  const deleteTransaction = async (id: string) => {
    if (!(await confirmAsync('Hapus transaksi ini? Saldo dompet akan disesuaikan otomatis.', { confirmText: 'Hapus' }))) return;
    await run(`tx-del-${id}`, async () => {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      patch(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) }));
    });
  };

  // ─── WALLETS ───
  const saveWallet = (w: { id?: string; name: string; type: WalletType; initialBalance: number }) => run('wallet-save', async () => {
    const { id, ...body } = w;
    const saved = await apiFetch<Wallet>(id ? `/wallets/${id}` : '/wallets', { method: id ? 'PUT' : 'POST', body });
    patch(s => ({ ...s, wallets: id ? s.wallets.map(x => (x.id === id ? saved : x)) : [...s.wallets, saved] }));
  });

  const deleteWallet = async (id: string) => {
    if (!state) return;
    if (state.wallets.length <= 1) {
      showAlert('Anda harus memiliki minimal 1 dompet aktif.');
      return;
    }
    const used = state.transactions.some(t => t.walletId === id || t.toWalletId === id);
    const message = used
      ? 'Dompet ini memiliki riwayat transaksi. Menghapus dompet juga akan menghapus transaksi terkait. Lanjutkan?'
      : 'Hapus dompet ini?';
    if (!(await confirmAsync(message, { confirmText: 'Hapus' }))) return;
    await run(`wallet-del-${id}`, async () => setState(await apiFetch<FinanceState>(`/wallets/${id}`, { method: 'DELETE' })));
  };

  // ─── BUDGETS ───
  const saveCategoryBudget = (catId: string, val: number) => run(`budget-${catId}`, async () => {
    const month = selectedMonth;
    await apiFetch(`/budgets/${month}/${catId}`, { method: 'PUT', body: { amount: val } });
    patch(s => {
      const monthBudgets = { ...(s.budgets[month] || {}) };
      if (val <= 0) delete monthBudgets[catId];
      else monthBudgets[catId] = val;
      return { ...s, budgets: { ...s.budgets, [month]: monthBudgets } };
    });
  });

  // ─── GOALS ───
  const saveGoal = (g: { name: string; target: number; deadline: string }) => run('goal-save', async () => {
    const saved = await apiFetch<Goal>('/goals', { method: 'POST', body: g });
    patch(s => ({ ...s, goals: [...s.goals, saved] }));
  });

  const adjustGoalFund = (id: string, amount: number) => run(`goal-adjust-${id}`, async () => {
    const saved = await apiFetch<Goal>(`/goals/${id}/adjust`, { method: 'PATCH', body: { amount } });
    patch(s => ({ ...s, goals: s.goals.map(g => (g.id === id ? saved : g)) }));
  });

  const deleteGoal = async (id: string) => {
    if (!(await confirmAsync('Hapus target tabungan ini?', { confirmText: 'Hapus' }))) return;
    await run(`goal-del-${id}`, async () => {
      await apiFetch(`/goals/${id}`, { method: 'DELETE' });
      patch(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }));
    });
  };

  // ─── CATEGORIES ───
  const saveCategory = (c: { id?: string; name: string; type: CategoryType }) => run('cat-save', async () => {
    const { id, ...body } = c;
    const saved = await apiFetch<Category>(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body });
    patch(s => ({ ...s, categories: id ? s.categories.map(x => (x.id === id ? saved : x)) : [...s.categories, saved] }));
  });

  const tryDeleteCategory = async (id: string) => {
    if (!state) return;
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;
    if (!state.categories.some(c => c.type === cat.type && c.id !== id)) {
      showAlert('Tidak dapat menghapus satu-satunya kategori pada tipe ini.');
      return;
    }
    if (state.transactions.some(t => t.categoryId === id)) {
      openModal('categoryReplace', { open: true, categoryId: id });
      return;
    }
    if (!(await confirmAsync(`Hapus kategori "${cat.name}"?`, { confirmText: 'Hapus' }))) return;
    await run(`cat-del-${id}`, async () => setState(await apiFetch<FinanceState>(`/categories/${id}`, { method: 'DELETE' })));
  };

  const replaceAndDeleteCategory = (oldId: string, newId: string) => run(`cat-del-${oldId}`, async () => {
    setState(await apiFetch<FinanceState>(`/categories/${oldId}?replaceWith=${encodeURIComponent(newId)}`, { method: 'DELETE' }));
  });

  // ─── SETTINGS ───
  const seedDemoData = async () => {
    if (!(await confirmAsync('Ganti semua data dengan data contoh?', { confirmText: 'Isi Data' }))) return;
    const ok = await run('seed', async () => setState(await apiFetch<FinanceState>('/data/seed', { method: 'POST' })));
    if (ok) showAlert('Data contoh berhasil dimuat!');
  };

  const importData = (imported: unknown) => run('import', async () => {
    setState(await apiFetch<FinanceState>('/data/import', { method: 'POST', body: imported }));
  });

  const clearAllData = async () => {
    if (!(await confirmAsync('Yakin ingin menghapus seluruh data transaksi dan dompet? Tindakan ini tidak dapat dibatalkan.', { confirmText: 'Hapus Semua' }))) return;
    await run('clear', async () => setState(await apiFetch<FinanceState>('/data', { method: 'DELETE' })));
  };

  return {
    state,
    loadError,
    retryLoad,
    reload,
    refreshing,
    selectedMonth,
    changeGlobalMonth,
    txFilters,
    setTxFilters,
    resetTransactionFilters: () => setTxFilters(DEFAULT_TX_FILTERS),
    txDisplayLimit,
    loadMoreTransactions: () => setTxDisplayLimit(n => n + 15),
    budgetAlertCount,
    busyKey,
    isBusy,

    modals,
    closeModal,
    openTransactionModal,
    openEditTransaction,
    openWalletModal,
    openCategoryModal,
    openGoalModal,
    openGoalAdjust,

    saveTransaction,
    deleteTransaction,
    saveWallet,
    deleteWallet,
    saveCategoryBudget,
    saveGoal,
    adjustGoalFund,
    deleteGoal,
    saveCategory,
    tryDeleteCategory,
    replaceAndDeleteCategory,
    seedDemoData,
    importData,
    clearAllData,
  };
}

type FinanceValue = ReturnType<typeof useFinanceValue> & { state: FinanceState };

const FinanceContext = createContext<FinanceValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const value = useFinanceValue();
  if (!value.state) {
    return <LoadingScreen message="Memuat data keuangan..." error={value.loadError} onRetry={value.retryLoad} />;
  }
  return <FinanceContext.Provider value={value as FinanceValue}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
