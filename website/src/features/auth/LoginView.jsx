import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Wallet, LogIn, UserPlus, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopTickerBar from '../../layout/TopTickerBar';
import { WinButtons } from '../../shared/components/WindowBox';

// Rendered at /login and /register; after success GuestOnly (App.jsx) redirects to the page the user wanted
export default function LoginView({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const changeMode = (next) => {
    // Keep location.state so the "return to" page survives switching tabs
    if (next !== mode) navigate(`/${next}`, { replace: true, state: location.state });
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = username.trim();
    if (name.length < 3) {
      setError('Nama pengguna minimal 3 karakter.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) await register(name, password);
      else await login(name, password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopTickerBar />

      <div className="login-page">
        <div className="window-box login-window animate-fade">
          <div className={`window-header${isRegister ? ' lavender' : ''}`}>
            <div className="win-title">
              <Lock style={{ width: 14, height: 14 }} />
              <span>{isRegister ? 'DAFTAR_AKUN.EXE' : 'LOGIN_SISTEM.EXE'}</span>
            </div>
            <div className="win-controls">
              <WinButtons />
            </div>
          </div>

          <div className="window-body">
            <div className="login-brand">
              <div className="login-logo-icon">
                <Wallet />
              </div>
              <div>
                <h1>FinTrack<span style={{ color: 'var(--bubblegum)' }}>.id</span></h1>
                <div className="login-brand-sub">PERSONAL FINANCE OS</div>
              </div>
            </div>

            <span className="retro-tag-pill">✦ {isRegister ? 'AKUN BARU' : 'SELAMAT DATANG'}</span>
            <h2 className="login-title">{isRegister ? 'Buat Akun Baru' : 'Masuk ke Akun Anda'}</h2>
            <p className="login-sub">
              {isRegister
                ? 'Daftarkan nama pengguna dan kata sandi untuk mulai mencatat keuangan.'
                : 'Masukkan nama pengguna dan kata sandi untuk melanjutkan.'}
            </p>

            <div className="tx-tabs login-tabs">
              <button type="button" className={`tx-tab${!isRegister ? ' active' : ''}`} onClick={() => changeMode('login')}>Masuk</button>
              <button type="button" className={`tx-tab${isRegister ? ' active' : ''}`} onClick={() => changeMode('register')}>Daftar</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="login-username">Nama Pengguna *</label>
                <input
                  type="text"
                  id="login-username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mis: kams"
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Kata Sandi *</label>
                <div className="login-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="form-group">
                  <label htmlFor="login-confirm">Konfirmasi Kata Sandi *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-confirm"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                  />
                </div>
              )}

              <div className={`form-error${error ? ' visible' : ''}`} style={{ display: error ? 'block' : 'none' }}>{error}</div>

              <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
                {isRegister ? <UserPlus style={{ width: 16, height: 16 }} /> : <LogIn style={{ width: 16, height: 16 }} />}
                {submitting ? 'MEMPROSES...' : isRegister ? 'DAFTAR & MASUK' : 'MASUK'}
              </button>
            </form>

            <p className="login-note">🔒 Akun & data tersimpan aman di server.</p>
          </div>
        </div>
      </div>
    </>
  );
}
