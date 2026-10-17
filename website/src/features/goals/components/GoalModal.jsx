import { useState } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import Modal from '../../../shared/components/Modal';
import RupiahInput from '../../../shared/components/RupiahInput';
import { parseRupiahInput } from '../../../shared/utils/formatters';

export default function GoalModal() {
  const { closeGoalModal, saveGoal } = useFinance();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetNum = parseRupiahInput(target);
    if (targetNum <= 0) return;
    setSaving(true);
    if (await saveGoal({ name: name.trim(), target: targetNum, deadline })) closeGoalModal();
    else setSaving(false);
  };

  return (
    <Modal onClose={closeGoalModal}>
      <h3>Buat Target Tabungan</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nama Target *</label>
          <input type="text" id="goal-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Dana Darurat, Liburan Jepang" />
        </div>
        <div className="form-group">
          <label>Nominal Target (Rp) *</label>
          <RupiahInput id="goal-target" required value={target} onChange={setTarget} placeholder="10.000.000" />
        </div>
        <div className="form-group">
          <label>Tanggal Target Tercapai (Opsional)</label>
          <input type="date" id="goal-deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={closeGoalModal}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Buat Target'}</button>
        </div>
      </form>
    </Modal>
  );
}
