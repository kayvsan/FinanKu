import { useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import Modal from '../../../shared/components/Modal';
import RupiahInput from '../../../shared/components/RupiahInput';
import { formatRupiahString, parseRupiahInput } from '../../../shared/utils/formatters';

export default function WalletModal({ onboarding }) {
  const { walletModal, closeWalletModal, saveWallet } = useFinance();
  const editWallet = onboarding ? null : walletModal.editWallet;

  const [name, setName] = useState(editWallet?.name || '');
  const [type, setType] = useState(editWallet?.type || 'Bank');
  const [initial, setInitial] = useState(editWallet ? formatRupiahString(editWallet.initialBalance) : '');

  const title = editWallet ? 'Edit Dompet' : onboarding ? 'Buat Dompet Pertama Anda' : 'Tambah Dompet / Rekening';

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (await saveWallet({ id: editWallet?.id, name: name.trim(), type, initialBalance: parseRupiahInput(initial) })) closeWalletModal();
    else setSaving(false);
  };

  return (
    <Modal onClose={closeWalletModal}>
      <div className="modal-header">
        <h3 id="wallet-modal-title">{title}</h3>
        <button id="wallet-modal-close" className={`modal-close${onboarding ? ' hidden' : ''}`} onClick={closeWalletModal}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div id="wallet-onboarding-note" className={`onboarding-note${onboarding ? '' : ' hidden'}`}>
        Untuk memulai, buat minimal satu dompet dan masukkan saldo awal Anda.
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nama Dompet / Rekening *</label>
          <input type="text" id="wallet-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai" />
        </div>
        <div className="form-group">
          <label>Jenis Dompet *</label>
          <select id="wallet-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Bank">Rekening Bank</option>
            <option value="E-Wallet">E-Wallet (GoPay, OVO, Dana, ShopeePay)</option>
            <option value="Tunai">Uang Tunai (Cash)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Saldo Awal (Rp) *</label>
          <RupiahInput id="wallet-initial" required value={initial} onChange={setInitial} placeholder="0" />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>{saving ? 'Menyimpan...' : 'Simpan Dompet'}</button>
        </div>
      </form>
    </Modal>
  );
}
