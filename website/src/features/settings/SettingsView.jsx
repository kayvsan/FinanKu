import { Settings, Download, Upload } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import WindowBox from '../../shared/components/WindowBox';
import { todayISO } from '../../shared/utils/formatters';

export default function SettingsView() {
  const { state, importData, seedDemoData, clearAllData, isBusy } = useFinance();
  // Seed, import and clear all replace the whole dataset; lock them together
  const dataBusy = isBusy('seed') || isBusy('import') || isBusy('clear');

  const exportDataJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `fintrack_backup_${todayISO()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const importDataJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.wallets && imported.transactions) {
          importData(imported).then(ok => {
            if (ok) setTimeout(() => window.alert('Data berhasil dipulihkan!'), 0);
          });
        } else {
          window.alert('Format file JSON tidak valid.');
        }
      } catch {
        window.alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const cardStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };

  return (
    <WindowBox className="mb-4" color="mint" icon={Settings} title="KONFIGURASI_SISTEM.INI">
      <p className="text-xs mb-4" style={{ color: 'rgba(27,27,58,0.6)', fontFamily: 'var(--font-mono)' }}>
        Seluruh data disimpan secara aman di server dan terhubung ke akun Anda. Cadangkan atau pulihkan data kapan saja.
      </p>
      <div className="grid-3">
        <div className="card-flat settings-card" style={cardStyle}>
          <div>
            <h4>Ekspor Data (Backup JSON)</h4>
            <p>Unduh seluruh riwayat transaksi, dompet, dan anggaran.</p>
          </div>
          <button className="btn btn-primary mt-3" onClick={exportDataJSON} style={{ width: '100%', justifyContent: 'center' }}>
            <Download style={{ width: 16, height: 16 }} /> Unduh Backup (.json)
          </button>
        </div>
        <div className="card-flat settings-card" style={cardStyle}>
          <div>
            <h4>Impor Data JSON</h4>
            <p>Pulihkan data dari file JSON hasil backup sebelumnya.</p>
          </div>
          <label className={`btn btn-secondary mt-3${dataBusy ? ' is-busy' : ''}`} style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
            <Upload style={{ width: 16, height: 16 }} /> {isBusy('import') ? 'Mengimpor...' : 'Pilih File JSON'}
            <input type="file" accept=".json" onChange={importDataJSON} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="card-flat settings-card" style={{ ...cardStyle, borderColor: 'var(--error)', background: '#fef2f2' }}>
          <div>
            <h4 style={{ color: 'var(--error)' }}>Reset & Muat Data Contoh</h4>
            <p>Hapus semua data atau kembalikan ke data simulasi awal.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-warn" onClick={seedDemoData} disabled={dataBusy} style={{ flex: 1, justifyContent: 'center' }}>{isBusy('seed') ? 'Memuat...' : 'Isi Data Contoh'}</button>
            <button className="btn btn-danger" onClick={clearAllData} disabled={dataBusy} style={{ flex: 1, justifyContent: 'center' }}>{isBusy('clear') ? 'Menghapus...' : 'Hapus Semua'}</button>
          </div>
        </div>
      </div>
    </WindowBox>
  );
}
