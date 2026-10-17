import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { apiFetch } from '../shared/api/client';
import { getBudgetStatuses } from '../shared/utils/finance';
import LoadingScreen from '../shared/components/LoadingScreen';
import { PAGE_PATHS, pageFromPath } from '../routes';
import { currentMonth } from '../shared/utils/formatters';

const FinanceContext = createContext(null);

const DEFAULT_TX_FILTERS = { search: '', type: 'all', category: 'all', wallet: 'all', start: '', end: '' };

export function FinanceProvider({ children }) {
  // null until GET /api/state resolves; same shape as before: { wallets, categories, transactions, budgets, goals }
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState('');

  // Key of the mutation currently waiting on the server (e.g. 'tx-del-12'); one at a time
  const [busyKey, setBusyKey] = useState(null);
  const busyRef = useRef(null);

  // The page comes from the URL; switchPage() navigates
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = pageFromPath(location.pathname);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [txFilters, setTxFilters] = useState(DEFAULT_TX_FILTERS);
  const [txDisplayLimit, setTxDisplayLimit] = useState(15);

  // Modals
  const [txModal, setTxModal] = useState({ open: false, type: 'expense', editTx: null });
  const [walletModal, setWalletModal] = useState({ open: false, editWallet: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, editCategory: null });
  const [categoryReplace, setCategoryReplace] = useState({ open: false, categoryId: null });
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const fetchState = useCallback(() => {
    apiFetch('/state')
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

  // ─── NAV ───
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const switchPage = useCallback((page) => {
    const path = PAGE_PATHS[page] || '/';
    if (path !== location.pathname) navigate(path);
    if (window.innerWidth <= 768) setMobileSidebarOpen(false);
  }, [navigate, location.pathname]);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) setMobileSidebarOpen(v => !v);
    else setSidebarCollapsed(v => !v);
  }, []);

  const changeGlobalMonth = useCallback((delta) => {
    setSelectedMonth(prev => {
      let [y, m] = prev.split('-').map(Number);
      m += delta;
      if (m > 12) { m = 1; y += 1; }
      if (m < 1) { m = 12; y -= 1; }
      return `${y}-${String(m).padStart(2, '0')}`;
    });
  }, []);

  const handleGlobalSearch = useCallback((q) => {
    if (!q || !q.trim()) return;
    switchPage('transactions');
    setTxFilters(f => ({ ...f, search: q }));
  }, [switchPage]);

  const filterTransactionsByCategory = useCallback((catId) => {
    switchPage('transactions');
    setTxFilters(f => ({ ...f, category: catId }));
  }, [switchPage]);

  const resetTransactionFilters = useCallback(() => setTxFilters(DEFAULT_TX_FILTERS), []);
  const loadMoreTransactions = useCallback(() => setTxDisplayLimit(n => n + 15), []);

  // ─── MODALS ───
  const openTransactionModal = useCallback((defaultType = 'expense') => {
    setTxModal({ open: true, type: defaultType, editTx: null });
  }, []);
  const openEditTransaction = useCallback((tx) => {
    setTxModal({ open: true, type: tx.type, editTx: tx });
  }, []);
  const closeTransactionModal = useCallback(() => setTxModal(m => ({ ...m, open: false })), []);

  const openWalletModal = useCallback((editWallet = null) => setWalletModal({ open: true, editWallet }), []);
  const closeWalletModal = useCallback(() => setWalletModal(m => ({ ...m, open: false })), []);

  const openCategoryModal = useCallback((editCategory = null) => setCategoryModal({ open: true, editCategory }), []);
  const closeCategoryModal = useCallback(() => setCategoryModal(m => ({ ...m, open: false })), []);
  const closeCategoryReplace = useCallback(() => setCategoryReplace({ open: false, categoryId: null }), []);

  const openGoalModal = useCallback(() => setGoalModalOpen(true), []);
  const closeGoalModal = useCallback(() => setGoalModalOpen(false), []);

  const closeAllModals = useCallback(() => {
    closeTransactionModal();
    closeWalletModal();
    closeCategoryModal();
    closeCategoryReplace();
    closeGoalModal();
  }, [closeTransactionModal, closeWalletModal, closeCategoryModal, closeCategoryReplace, closeGoalModal]);

  const budgetAlertCount = useMemo(
    () => (state ? getBudgetStatuses(state, selectedMonth).filter(b => b.pct >= 80).length : 0),
    [state, selectedMonth]
  );

  if (!state) {
    return <LoadingScreen message="Memuat data keuangan..." error={loadError} onRetry={retryLoad} />;
  }

  // Run one mutation against the API under `key` so the UI can show it as busy.
  // A second mutation started while one is in flight is ignored (stops double clicks).
  // Errors are shown with alert() like the original, unless `throwErrors` is set.
  const run = async (key, fn, { throwErrors = false } = {}) => {
    if (busyRef.current) return false;
    busyRef.current = key;
    setBusyKey(key);
    try {
      await fn();
      return true;
    } catch (err) {
      if (throwErrors) throw err;
      window.alert(err.message);
      return false;
    } finally {
      busyRef.current = null;
      setBusyKey(null);
    }
  };
  const isBusy = (key) => busyKey === key;

  // ─── TRANSACTIONS ───
  // Throws on failure so TransactionModal can show the message in its own #tx-error box
  const saveTransaction = ({ id, ...payload }) => run('tx-save', async () => {
    const saved = await apiFetch(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', body: payload });
    setState(prev => ({
      ...prev,
      transactions: id ? prev.transactions.map(t => (t.id === id ? saved : t)) : [saved, ...prev.transactions]
    }));
    setSelectedMonth(saved.date.slice(0, 7));
  }, { throwErrors: true });

  const deleteTransaction = async (id) => {
    if (!window.confirm('Hapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) return;
    await run(`tx-del-${id}`, async () => {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    });
  };

  // ─── WALLETS ───
  const saveWallet = ({ id, name, type, initialBalance }) => run('wallet-save', async () => {
    const saved = await apiFetch(id ? `/wallets/${id}` : '/wallets', { method: id ? 'PUT' : 'POST', body: { name, type, initialBalance } });
    setState(prev => ({
      ...prev,
      wallets: id ? prev.wallets.map(w => (w.id === id ? saved : w)) : [...prev.wallets, saved]
    }));
  });

  const deleteWallet = async (id) => {
    if (state.wallets.length <= 1) {
      window.alert('Anda harus memiliki minimal 1 dompet aktif.');
      return;
    }
    const used = state.transactions.some(t => t.walletId === id || t.toWalletId === id);
    if (used && !window.confirm('Dompet ini memiliki riwayat transaksi. Menghapus dompet juga akan menghapus transaksi terkait. Lanjutkan?')) return;
    await run(`wallet-del-${id}`, async () => setState(await apiFetch(`/wallets/${id}`, { method: 'DELETE' })));
  };

  // ─── BUDGETS ───
  const saveCategoryBudget = (catId, val) => run(`budget-${catId}`, async () => {
    const month = selectedMonth;
    await apiFetch(`/budgets/${month}/${catId}`, { method: 'PUT', body: { amount: val } });
    setState(prev => {
      const monthBudgets = { ...(prev.budgets[month] || {}) };
      if (val <= 0) delete monthBudgets[catId];
      else monthBudgets[catId] = val;
      return { ...prev, budgets: { ...prev.budgets, [month]: monthBudgets } };
    });
  });

  // ─── GOALS ───
  const saveGoal = ({ name, target, deadline }) => run('goal-save', async () => {
    const saved = await apiFetch('/goals', { method: 'POST', body: { name, target, deadline } });
    setState(prev => ({ ...prev, goals: [...prev.goals, saved] }));
  });

  const adjustGoalFund = (id, amount) => run(`goal-adjust-${id}`, async () => {
    const saved = await apiFetch(`/goals/${id}/adjust`, { method: 'PATCH', body: { amount } });
    setState(prev => ({ ...prev, goals: prev.goals.map(g => (g.id === id ? saved : g)) }));
  });

  const deleteGoal = async (id) => {
    if (!window.confirm('Hapus target tabungan ini?')) return;
    await run(`goal-del-${id}`, async () => {
      await apiFetch(`/goals/${id}`, { method: 'DELETE' });
      setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
    });
  };

  // ─── CATEGORIES ───
  const saveCategory = ({ id, name, type }) => run('cat-save', async () => {
    const saved = await apiFetch(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body: { name, type } });
    setState(prev => ({
      ...prev,
      categories: id ? prev.categories.map(c => (c.id === id ? saved : c)) : [...prev.categories, saved]
    }));
  });

  const tryDeleteCategory = async (id) => {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;
    const sameTypeCats = state.categories.filter(c => c.type === cat.type && c.id !== id);
    if (sameTypeCats.length === 0) {
      window.alert('Tidak dapat menghapus satu-satunya kategori pada tipe ini.');
      return;
    }
    const usedCount = state.transactions.filter(t => t.categoryId === id).length;
    if (usedCount > 0) {
      setCategoryReplace({ open: true, categoryId: id });
    } else {
      if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;
      await run(`cat-del-${id}`, async () => setState(await apiFetch(`/categories/${id}`, { method: 'DELETE' })));
    }
  };

  const replaceAndDeleteCategory = (oldId, newId) => run(`cat-del-${oldId}`, async () => {
    setState(await apiFetch(`/categories/${oldId}?replaceWith=${encodeURIComponent(newId)}`, { method: 'DELETE' }));
  });

  // ─── SETTINGS ───
  const seedDemoData = async () => {
    const ok = await run('seed', async () => setState(await apiFetch('/data/seed', { method: 'POST' })));
    if (ok) setTimeout(() => window.alert('Data contoh berhasil dimuat!'), 0);
  };

  const importData = (imported) => run('import', async () => {
    setState(await apiFetch('/data/import', { method: 'POST', body: imported }));
  });

  const clearAllData = async () => {
    if (!window.confirm('Yakin ingin menghapus seluruh data transaksi dan dompet? Tindakan ini tidak dapat dibatalkan.')) return;
    await run('clear', async () => setState(await apiFetch('/data', { method: 'DELETE' })));
  };

  const value = {
    state,
    currentPage,
    switchPage,
    busyKey,
    isBusy,
    selectedMonth,
    changeGlobalMonth,
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebar,
    closeMobileSidebar,
    handleGlobalSearch,
    txFilters,
    setTxFilters,
    txDisplayLimit,
    resetTransactionFilters,
    loadMoreTransactions,
    filterTransactionsByCategory,
    budgetAlertCount,

    txModal,
    openTransactionModal,
    openEditTransaction,
    closeTransactionModal,
    walletModal,
    openWalletModal,
    closeWalletModal,
    categoryModal,
    openCategoryModal,
    closeCategoryModal,
    categoryReplace,
    closeCategoryReplace,
    goalModalOpen,
    openGoalModal,
    closeGoalModal,
    closeAllModals,

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
    clearAllData
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}
