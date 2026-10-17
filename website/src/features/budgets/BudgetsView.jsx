import { useState } from 'react';
import { PieChart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import RupiahInput from '../../shared/components/RupiahInput';
import { formatIDR, formatRupiahString, parseRupiahInput } from '../../shared/utils/formatters';
import { getMonthlySummary } from '../../shared/utils/finance';

function BudgetCard({ cat, limit, spent, onSave, saving }) {
  const [input, setInput] = useState(limit > 0 ? formatRupiahString(limit) : '');
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

  let status = <span className="text-xs" style={{ color: 'rgba(27,27,58,0.4)' }}>Belum Diatur</span>;
  let fillClass = 'safe';
  if (limit > 0) {
    if (pct >= 100) {
      status = <span className="chip chip-bubblegum"><span className="status-over" style={{ fontSize: '0.65rem' }}>Terlampaui ({pct}%)</span></span>;
      fillClass = 'over';
    } else if (pct >= 80) {
      status = <span className="chip chip-butter"><span className="status-warn" style={{ fontSize: '0.65rem' }}>Hampir Habis ({pct}%)</span></span>;
      fillClass = 'warn';
    } else {
      status = <span className="chip chip-mint"><span className="status-safe" style={{ fontSize: '0.65rem' }}>Aman ({pct}%)</span></span>;
    }
  }

  return (
    <div className="card budget-card">
      <div className="budget-header">
        <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{cat.name}</h4>
        {status}
      </div>
      <div className="budget-bar-track"><div className={`budget-bar-fill ${fillClass}`} style={{ width: `${limit > 0 ? Math.min(pct, 100) : 0}%` }}></div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(27,27,58,0.5)' }}>
        <span>Realisasi: <b style={{ color: 'var(--navy)' }}>{formatIDR(spent)}</b></span>
        <span>Sisa: <b>{limit > 0 ? formatIDR(Math.max(limit - spent, 0)) : '-'}</b></span>
      </div>
      <div className="budget-input-row">
        <RupiahInput id={`budget-input-${cat.id}`} value={input} onChange={setInput} placeholder="Atur batas anggaran (Rp)..." />
        <button className="btn btn-primary" onClick={() => onSave(parseRupiahInput(input))} disabled={saving} style={{ padding: '6px 12px' }}>{saving ? '...' : 'Simpan'}</button>
      </div>
    </div>
  );
}

export default function BudgetsView() {
  const { state, selectedMonth, saveCategoryBudget, isBusy } = useFinance();
  const cur = getMonthlySummary(state, selectedMonth);
  const monthBudgets = state.budgets[selectedMonth] || {};

  const rows = state.categories.filter(c => c.type === 'expense').map(cat => ({
    cat,
    limit: Number(monthBudgets[cat.id]) || 0,
    spent: cur.byCategory[cat.id] || 0
  }));
  const budgeted = rows.filter(r => r.limit > 0);
  const totalBudget = budgeted.reduce((acc, r) => acc + r.limit, 0);
  const totalSpentInBudgeted = budgeted.reduce((acc, r) => acc + r.spent, 0);

  return (
    <WindowBox className="mb-4" icon={PieChart} title="BATAS_ANGGARAN_BULANAN.CFG">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1.5px solid rgba(27,27,58,0.1)' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem' }}>Pantauan Batas Pengeluaran per Kategori</h3>
          <p className="text-xs" style={{ color: 'rgba(27,27,58,0.6)', marginTop: 2 }}>
            Status:{' '}
            <span className="status-safe" style={{ fontSize: '0.68rem' }}>Aman (&lt;80%)</span>{' '}
            <span className="status-warn" style={{ fontSize: '0.68rem' }}>Hampir Habis (80-100%)</span>{' '}
            <span className="status-over" style={{ fontSize: '0.68rem' }}>Terlampaui (&gt;100%)</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs" style={{ color: 'rgba(27,27,58,0.5)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TOTAL ANGGARAN VS REALISASI</span>
          <div id="budget-summary-total" style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
            {formatIDR(totalSpentInBudgeted)} / {formatIDR(totalBudget)}
          </div>
        </div>
      </div>
      <div id="budgets-list" className="grid-2">
        {rows.map(({ cat, limit, spent }) => (
          <BudgetCard
            key={`${selectedMonth}-${cat.id}-${limit}`}
            cat={cat}
            limit={limit}
            spent={spent}
            onSave={(val) => saveCategoryBudget(cat.id, val)}
            saving={isBusy(`budget-${cat.id}`)}
          />
        ))}
      </div>
    </WindowBox>
  );
}
