import { Tags, ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';

export default function CategoriesView() {
  const { state, openCategoryModal, tryDeleteCategory, isBusy } = useFinance();

  const renderItem = (c) => {
    const count = state.transactions.filter(t => t.categoryId === c.id).length;
    return (
      <div key={c.id} className={`cat-item${isBusy(`cat-del-${c.id}`) ? ' is-busy' : ''}`}>
        <div>
          <span style={{ fontWeight: 600 }}>{c.name}</span>{' '}
          <span className="cat-count">({count} transaksi)</span>
        </div>
        <div className="tx-actions">
          <button onClick={() => openCategoryModal(c)} title="Edit"><Pencil style={{ width: 14, height: 14 }} /></button>
          <button className="del" onClick={() => tryDeleteCategory(c.id)} title="Hapus"><Trash2 style={{ width: 14, height: 14 }} /></button>
        </div>
      </div>
    );
  };

  const headingStyle = { fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 };

  return (
    <WindowBox
      className="mb-4"
      color="lavender"
      icon={Tags}
      title="KLASIFIKASI_KATEGORI.SYS"
      actions={<button className="win-badge-btn" onClick={() => openCategoryModal()}>+ TAMBAH KATEGORI</button>}
    >
      <div className="grid-2">
        <div className="card">
          <h4 style={{ ...headingStyle, color: 'var(--error)' }}><ArrowUpRight style={{ width: 16, height: 16 }} /> Kategori Pengeluaran</h4>
          <div id="cat-expense-list">{state.categories.filter(c => c.type === 'expense').map(renderItem)}</div>
        </div>
        <div className="card">
          <h4 style={{ ...headingStyle, color: 'var(--success)' }}><ArrowDownLeft style={{ width: 16, height: 16 }} /> Kategori Pemasukan</h4>
          <div id="cat-income-list">{state.categories.filter(c => c.type === 'income').map(renderItem)}</div>
        </div>
      </div>
    </WindowBox>
  );
}
