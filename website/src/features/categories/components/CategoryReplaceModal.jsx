import { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import Modal from '../../../shared/components/Modal';

export default function CategoryReplaceModal() {
  const { state, categoryReplace, closeCategoryReplace, replaceAndDeleteCategory, isBusy } = useFinance();
  const cat = state.categories.find(c => c.id === categoryReplace.categoryId);
  const sameTypeCats = cat ? state.categories.filter(c => c.type === cat.type && c.id !== cat.id) : [];
  const usedCount = cat ? state.transactions.filter(t => t.categoryId === cat.id).length : 0;
  const [replacementId, setReplacementId] = useState(sameTypeCats[0]?.id || '');

  const busy = cat ? isBusy(`cat-del-${cat.id}`) : false;

  const confirm = async () => {
    if (cat && replacementId && !(await replaceAndDeleteCategory(cat.id, replacementId))) return;
    closeCategoryReplace();
  };

  return (
    <Modal onClose={closeCategoryReplace}>
      <h3 style={{ color: 'var(--error)' }}>Kategori Sedang Digunakan</h3>
      <p id="cat-replace-desc" className="text-xs" style={{ color: 'rgba(27,27,58,0.5)', marginBottom: 14 }}>
        {cat && `Kategori "${cat.name}" sedang digunakan oleh ${usedCount} transaksi. Pilih kategori pengganti sebelum menghapus:`}
      </p>
      <div className="form-group">
        <label>Pilih Kategori Pengganti *</label>
        <select id="cat-replacement-select" value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
          {sameTypeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={closeCategoryReplace}>Batal</button>
        <button className="btn btn-danger" onClick={confirm} disabled={busy}>{busy ? 'Memindahkan...' : 'Pindahkan & Hapus'}</button>
      </div>
    </Modal>
  );
}
