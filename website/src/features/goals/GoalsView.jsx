import { Target, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import { formatIDR, parseRupiahInput } from '../../shared/utils/formatters';
import { getMonthlySummary } from '../../shared/utils/finance';

export default function GoalsView() {
  const { state, selectedMonth, openGoalModal, adjustGoalFund, deleteGoal, isBusy } = useFinance();
  const cur = getMonthlySummary(state, selectedMonth);
  const monthlySavingAvg = Math.max(cur.net, 1000000);

  const handleAdjust = (g, sign) => {
    const raw = window.prompt(`${sign > 0 ? 'Tambah dana ke' : 'Tarik dana dari'} "${g.name}" (Masukkan nominal Rupiah):`, '500000');
    if (!raw) return;
    const amt = parseRupiahInput(raw);
    if (amt <= 0) return;
    adjustGoalFund(g.id, sign * amt);
  };

  return (
    <WindowBox
      className="mb-4"
      color="peach"
      icon={Target}
      title="TARGET_TABUNGAN.OBJ"
      actions={<button className="win-badge-btn" onClick={openGoalModal}>+ BUAT TARGET</button>}
    >
      <p className="text-xs mb-3" style={{ color: 'rgba(27,27,58,0.6)', fontFamily: 'var(--font-mono)' }}>
        Alokasikan dana ke target impian dan pantau estimasi tercapainya.
      </p>
      <div id="goals-grid" className="grid-3">
        {state.goals.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>Belum ada target tabungan. Buat target pertama untuk mulai menabung.</div>
        )}
        {state.goals.map(g => {
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          const remaining = Math.max(0, g.target - g.saved);
          const adjusting = isBusy(`goal-adjust-${g.id}`);
          const estMonths = remaining > 0 ? Math.ceil(remaining / monthlySavingAvg) : 0;
          return (
            <div key={g.id} className={`card goal-card${isBusy(`goal-del-${g.id}`) ? ' is-busy' : ''}`}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`chip ${pct >= 100 ? 'chip-mint' : 'chip-lavender'}`}>
                    {pct >= 100 ? '✓ Tercapai!' : `Progres ${pct}%`}
                  </span>
                  <button onClick={() => deleteGoal(g.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(27,27,58,0.35)' }}>
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
                <h4 style={{ fontSize: '0.95rem', marginTop: 8 }}>{g.name}</h4>
                <p className="text-xs font-mono" style={{ color: 'rgba(27,27,58,0.45)' }}>{g.deadline ? `Target: ${g.deadline}` : 'Tanpa tenggat'}</p>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-display)' }}>{formatIDR(g.saved)}</span>
                    <span style={{ color: 'rgba(27,27,58,0.4)' }}>dari {formatIDR(g.target)}</span>
                  </div>
                  <div className="goal-progress-track"><div className="goal-progress-fill" style={{ width: `${pct}%` }}></div></div>
                </div>
                <p style={{ fontSize: '0.68rem', color: 'rgba(27,27,58,0.4)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  {remaining === 0 ? 'Target tabungan telah terpenuhi!' : `Estimasi: ~${estMonths} bulan lagi`}
                </p>
              </div>
              <div className="goal-actions">
                <button className="btn btn-primary" onClick={() => handleAdjust(g, 1)} disabled={adjusting} style={{ flex: 1, justifyContent: 'center', background: 'var(--success)' }}>{adjusting ? 'Menyimpan...' : '+ Tambah Dana'}</button>
                <button className="btn btn-secondary" onClick={() => handleAdjust(g, -1)} disabled={adjusting} style={{ padding: '8px 12px' }}>- Tarik</button>
              </div>
            </div>
          );
        })}
      </div>
    </WindowBox>
  );
}
