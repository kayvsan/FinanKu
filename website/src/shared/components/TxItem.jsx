import { Pencil, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../utils/formatters';
import { getCategoryById, getWalletById } from '../utils/finance';

export default function TxItem({ tx }) {
  const { state, openEditTransaction, deleteTransaction, isBusy } = useFinance();
  const deleting = isBusy(`tx-del-${tx.id}`);
  const wallet = getWalletById(state, tx.walletId);
  let title, badge, amountStr, colorClass;

  if (tx.type === 'transfer') {
    const toW = getWalletById(state, tx.toWalletId);
    title = `Transfer: ${wallet.name} → ${toW.name}`;
    badge = 'Transfer';
    amountStr = formatIDR(tx.amount);
    colorClass = 'transfer';
  } else {
    title = getCategoryById(state, tx.categoryId).name;
    badge = wallet.name;
    amountStr = (tx.type === 'income' ? '+' : '-') + formatIDR(tx.amount);
    colorClass = tx.type === 'income' ? 'income' : 'expense';
  }

  return (
    <div className={`tx-item${deleting ? ' is-busy' : ''}`}>
      <div className="tx-info">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <span className="tx-title">{title}</span>
          <span className="tx-badge">{badge}</span>
          {tx.tag ? <span className="tx-tag">{tx.tag}</span> : null}
        </div>
        <div className="tx-meta">{tx.date}{tx.note ? ` · ${tx.note}` : ''}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`tx-amount ${colorClass}`}>{amountStr}</span>
        <div className="tx-actions">
          <button onClick={() => openEditTransaction(tx)} title="Edit"><Pencil style={{ width: 14, height: 14 }} /></button>
          <button className="del" onClick={() => deleteTransaction(tx.id)} title="Hapus"><Trash2 style={{ width: 14, height: 14 }} /></button>
        </div>
      </div>
    </div>
  );
}
