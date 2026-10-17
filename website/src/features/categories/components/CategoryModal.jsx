import { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import Modal from '../../../shared/components/Modal';

export default function CategoryModal() {
  const { categoryModal, closeCategoryModal, saveCategory } = useFinance();
  const editCategory = categoryModal.editCategory;
  const [name, setName] = useState(editCategory?.name || '');
  const [type, setType] = useState(editCategory?.type || 'expense');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (await saveCategory({ id: editCategory?.id, name: name.trim(), type })) closeCategoryModal();
    else setSaving(false);
  };

  return (
    <Modal onClose={closeCategoryModal} boxStyle={{ maxWidth: 380 }}>
      <h3 id="cat-modal-title">{editCategory ? 'Ubah Kategori' : 'Tambah Kategori'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nama Kategori *</label>
          <input type="text" id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kopi & Camilan" />
        </div>
        <div className="form-group">
          <label>Tipe *</label>
          <select id="cat-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={closeCategoryModal}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  );
}
