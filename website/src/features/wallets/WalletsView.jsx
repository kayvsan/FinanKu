import { Wallet, Repeat, Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import { formatIDR } from '../../shared/utils/formatters';
import { calculateWalletBalance } from '../../shared/utils/finance';

const BADGE_COLORS = { 'Bank': 'badge-bank', 'E-Wallet': 'badge-ewallet', 'Tunai': 'badge-cash' };

export default function WalletsView() {
  const { state, openTransactionModal, openWalletModal, deleteWallet, isBusy } = useFinance();

  return (
    <WindowBox
      className="mb-4"
      icon={Wallet}
      title="MANAJEMEN_DOMPET.DAT"
      actions={
        <>
          <button className="win-badge-btn" onClick={() => openTransactionModal('transfer')}>
            <Repeat style={{ width: 13, height: 13 }} /> TRANSFER
          </button>
          <button className="win-badge-btn" onClick={() => openWalletModal()} style={{ background: 'var(--butter)' }}>
            <Plus style={{ width: 13, height: 13 }} /> TAMBAH DOMPET
          </button>
        </>
      }
    >
      <p className="text-xs mb-3" style={{ color: 'rgba(27,27,58,0.6)', fontFamily: 'var(--font-mono)' }}>
        Saldo dihitung otomatis dari saldo awal, seluruh pemasukan, pengeluaran, dan mutasi transfer antar rekening.
      </p>
      <div id="wallets-grid" className="grid-3">
        {state.wallets.map(w => {
          const txCount = state.transactions.filter(t => t.walletId === w.id || t.toWalletId === w.id).length;
          return (
            <div key={w.id} className={`card wallet-card-lg${isBusy(`wallet-del-${w.id}`) ? ' is-busy' : ''}`}>
              <div>
                <div className="wallet-header">
                  <span className={`wallet-type-badge ${BADGE_COLORS[w.type] || 'badge-bank'}`}>{w.type}</span>
                  <div className="tx-actions">
                    <button onClick={() => openWalletModal(w)} title="Edit"><Pencil style={{ width: 16, height: 16 }} /></button>
                    <button className="del" onClick={() => deleteWallet(w.id)} title="Hapus"><Trash2 style={{ width: 16, height: 16 }} /></button>
                  </div>
                </div>
                <h4>{w.name}</h4>
                <div className="wallet-balance">{formatIDR(calculateWalletBalance(state, w.id))}</div>
              </div>
              <div className="wallet-footer">
                <span>Saldo Awal: {formatIDR(w.initialBalance)}</span>
                <span>{txCount} Transaksi</span>
              </div>
            </div>
          );
        })}
      </div>
    </WindowBox>
  );
}
