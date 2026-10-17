import { Loader } from 'lucide-react';
import TopTickerBar from '../../layout/TopTickerBar';
import { WinButtons } from './WindowBox';

export default function LoadingScreen({ message = 'Memuat data...', error, onRetry }) {
  return (
    <>
      <TopTickerBar />
      <div className="login-page">
        <div className="window-box login-window animate-fade">
          <div className="window-header sky">
            <div className="win-title">
              <Loader style={{ width: 14, height: 14 }} />
              <span>MEMUAT_SISTEM.EXE</span>
            </div>
            <div className="win-controls">
              <WinButtons />
            </div>
          </div>
          <div className="window-body" style={{ textAlign: 'center' }}>
            {error ? (
              <>
                <div className="form-error visible" style={{ display: 'block', marginTop: 0 }}>{error}</div>
                {onRetry && (
                  <button className="btn btn-primary login-submit" onClick={onRetry}>COBA LAGI</button>
                )}
              </>
            ) : (
              <p className="login-note" style={{ marginTop: 0, fontSize: '0.75rem' }}>✦ {message}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
