import { Filter, List, Search } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import TxItem from '../../shared/components/TxItem';
import { getCategoryById } from '../../shared/utils/finance';

export default function TransactionsView() {
  const { state, txFilters, setTxFilters, txDisplayLimit, resetTransactionFilters, loadMoreTransactions } = useFinance();
  const { search, type, category, wallet, start, end } = txFilters;
  const setFilter = (key) => (e) => setTxFilters(f => ({ ...f, [key]: e.target.value }));

  const q = search.toLowerCase();
  const filtered = state.transactions.filter(tx => {
    if (type !== 'all' && tx.type !== type) return false;
    if (category !== 'all' && tx.categoryId !== category) return false;
    if (wallet !== 'all' && tx.walletId !== wallet && tx.toWalletId !== wallet) return false;
    if (start && tx.date < start) return false;
    if (end && tx.date > end) return false;
    if (q) {
      const noteMatch = (tx.note || '').toLowerCase().includes(q);
      const tagMatch = (tx.tag || '').toLowerCase().includes(q);
      const catName = getCategoryById(state, tx.categoryId).name.toLowerCase().includes(q);
      if (!noteMatch && !tagMatch && !catName) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const slice = filtered.slice(0, txDisplayLimit);

  return (
    <>
      <WindowBox className="mb-3" icon={Filter} title="FILTER_DAN_PENCARIAN.EXE" bodyStyle={{ padding: 16 }}>
        <div className="filter-bar mb-3">
          <div className="search-wrap">
            <Search />
            <input type="text" id="filter-search" value={search} onChange={setFilter('search')} placeholder="Cari catatan atau #tag..." />
          </div>
          <select id="filter-type" value={type} onChange={setFilter('type')}>
            <option value="all">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer Dompet</option>
          </select>
          <select id="filter-category" value={category} onChange={setFilter('category')}>
            <option value="all">Semua Kategori</option>
            {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select id="filter-wallet" value={wallet} onChange={setFilter('wallet')}>
            <option value="all">Semua Dompet</option>
            {state.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={resetTransactionFilters}>Reset</button>
        </div>

        <div className="date-filter-row" style={{ marginBottom: 0 }}>
          <div className="date-inputs">
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>RENTANG:</span>
            <input type="date" id="filter-date-start" value={start} onChange={setFilter('start')} style={{ width: 140 }} />
            <span style={{ fontSize: '0.78rem' }}>s/d</span>
            <input type="date" id="filter-date-end" value={end} onChange={setFilter('end')} style={{ width: 140 }} />
          </div>
          <div className="count" id="tx-Showing-count">
            Menampilkan {Math.min(filtered.length, txDisplayLimit)} dari {filtered.length} transaksi
          </div>
        </div>
      </WindowBox>

      <WindowBox color="sky" icon={List} title="TABEL_RIWAYAT_TRANSAKSI.LOG" bodyStyle={{ padding: '10px 16px' }}>
        <div className="data-table">
          <div className="table-body" id="tx-list-container">
            {slice.length
              ? slice.map(tx => <TxItem key={tx.id} tx={tx} />)
              : <div className="empty-state">Tidak ada transaksi yang cocok dengan filter. Coba ubah kata kunci atau rentang tanggal.</div>}
          </div>
          <div id="tx-pagination" className={`pagination${filtered.length > txDisplayLimit ? '' : ' hidden'}`}>
            <button className="btn btn-secondary" onClick={loadMoreTransactions}>Muat Lebih Banyak</button>
          </div>
        </div>
      </WindowBox>
    </>
  );
}
