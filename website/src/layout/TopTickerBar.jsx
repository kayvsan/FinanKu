
const TICKER_TEXT = '✦ FINTRACK OS v1.0 • PENGELUARAN BULAN INI TERKENDALI • SALDO DOMPET AMAN • ANGGARAN AKTIF • SHORTCUT [N] UNTUK CATAT CEPAT • TARGET TABUNGAN ON TRACK • SELALU CADANGKAN DATA ANDA • KEUANGAN PRIBADI CERDAS ✦';

export default function TopTickerBar() {
  return (
    <div className="top-ticker-bar">
      <div className="ticker-track">
        <span>{TICKER_TEXT}</span>
        <span>{TICKER_TEXT}</span>
      </div>
    </div>
  );
}
