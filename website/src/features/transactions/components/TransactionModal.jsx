import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import Modal from '../../../shared/components/Modal';
import RupiahInput from '../../../shared/components/RupiahInput';
import { formatIDR, formatRupiahString, parseRupiahInput, todayISO } from '../../../shared/utils/formatters';
import { calculateWalletBalance } from '../../../shared/utils/finance';

// Mirrors setTxType(): switching tab rebuilds the selects, so selections reset to their defaults
function defaultsForType(state, type) {
  const wallets = state.wallets;
  const firstCat = state.categories.find(c => c.type === type);
  return {
    walletId: wallets[0]?.id || '',
    toWalletId: (type === 'transfer' && wallets.length > 1 ? wallets[1] : wallets[0])?.id || '',
    categoryId: firstCat?.id || ''
  };
}

export default function TransactionModal() {
  const { state, txModal, closeTransactionModal, saveTransaction } = useFinance();
  const editTx = txModal.editTx;
  const amountRef = useRef(null);

  const [txType, setTxType] = useState(txModal.type);
  const [form, setForm] = useState(() => {
    if (editTx) {
      return {
        amount: formatRupiahString(editTx.amount),
        walletId: editTx.walletId,
        toWalletId: editTx.type === 'transfer' ? editTx.toWalletId : defaultsForType(state, editTx.type).toWalletId,
        categoryId: editTx.type === 'transfer' ? defaultsForType(state, 'expense').categoryId : editTx.categoryId,
        date: editTx.date,
        tag: editTx.tag || '',
        note: editTx.note || ''
      };
    }
    return {
      amount: '',
      ...defaultsForType(state, txModal.type),
      date: todayISO(),
      tag: '',
      note: ''
    };
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const changeType = (type) => {
    setTxType(type);
    setForm(f => ({ ...f, ...defaultsForType(state, type) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseRupiahInput(form.amount);
    if (!amount || amount <= 0) {
      setError('Nominal harus lebih dari Rp 0 dan tidak boleh kosong.');
      return;
    }
    if (txType === 'transfer' && form.walletId === form.toWalletId) {
      setError('Dompet asal dan tujuan transfer tidak boleh sama.');
      return;
    }
    setSaving(true);
    try {
      const ok = await saveTransaction({
        id: editTx?.id,
        type: txType,
        amount,
        date: form.date,
        walletId: form.walletId,
        toWalletId: txType === 'transfer' ? form.toWalletId : '',
        categoryId: txType === 'transfer' ? '' : form.categoryId,
        note: form.note.trim(),
        tag: form.tag.trim()
      });
      if (ok) closeTransactionModal();
      else setSaving(false);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const walletOptions = state.wallets.map(w => (
    <option key={w.id} value={w.id}>{w.name} ({formatIDR(calculateWalletBalance(state, w.id))})</option>
  ));
  const cats = state.categories.filter(c => c.type === txType);

  return (
    <Modal onClose={closeTransactionModal}>
      <div className="modal-header">
        <h3 id="tx-modal-title">{editTx ? 'Edit Transaksi' : 'Catat Transaksi Baru'}</h3>
        <button className="modal-close" onClick={closeTransactionModal}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <form id="form-transaction" onSubmit={handleSubmit}>
        <div className="tx-tabs">
          {[['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer']].map(([t, label]) => (
            <button key={t} type="button" onClick={() => changeType(t)} id={`tab-tx-${t}`} className={`tx-tab${txType === t ? ' active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>Nominal (Rp) *</label>
          <div className="amount-wrap">
            <span className="rp-prefix">Rp</span>
            <RupiahInput ref={amountRef} id="tx-amount" required value={form.amount} onChange={(v) => setForm(f => ({ ...f, amount: v }))} placeholder="0" />
          </div>
        </div>

        <div className="form-row form-group">
          <div>
            <label id="label-tx-wallet">{txType === 'transfer' ? 'Dari Dompet Asal *' : 'Dompet *'}</label>
            <select id="tx-wallet" required value={form.walletId} onChange={set('walletId')}>{walletOptions}</select>
          </div>
          <div id="wrap-tx-category" className={txType === 'transfer' ? 'hidden' : ''}>
            <label>Kategori *</label>
            <select id="tx-category" value={form.categoryId} onChange={set('categoryId')}>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div id="wrap-tx-to-wallet" className={txType === 'transfer' ? '' : 'hidden'}>
            <label>Ke Dompet Tujuan *</label>
            <select id="tx-to-wallet" value={form.toWalletId} onChange={set('toWalletId')}>{walletOptions}</select>
          </div>
        </div>

        <div className="form-row form-group">
          <div>
            <label>Tanggal *</label>
            <input type="date" id="tx-date" required value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label>Tag (Opsional)</label>
            <input type="text" id="tx-tag" value={form.tag} onChange={set('tag')} placeholder="mis: #kantor, #liburan" />
          </div>
        </div>

        <div className="form-group">
          <label>Catatan (Opsional)</label>
          <input type="text" id="tx-note" value={form.note} onChange={set('note')} placeholder="Makan siang nasi padang..." />
        </div>

        <div id="tx-error" className={`form-error${error ? ' visible' : ''}`} style={{ display: error ? 'block' : 'none' }}>{error}</div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={closeTransactionModal}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Transaksi'}</button>
        </div>
      </form>
    </Modal>
  );
}
