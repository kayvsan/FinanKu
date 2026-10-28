import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Wallet, LogIn, UserPlus, Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const passwordsMatch = isRegister && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = isRegister && confirmPassword.length > 0 && password !== confirmPassword;

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
      setError('Konfirmasi kata sandi tidak sama dengan kata sandi di atas.');
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
    <div className="min-h-screen bg-[#F8F7F2] text-[#11221B] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white border-2 border-[#11221B] rounded-2xl shadow-[4px_4px_0px_0px_#11221B] overflow-hidden animate-fade">
        <div className={`${isRegister ? 'bg-[#D8B4FE]' : 'bg-[#CCF32F]'} border-b-2 border-[#11221B] px-5 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2 font-mono text-xs font-extrabold uppercase tracking-wider text-[#11221B]">
            <Lock style={{ width: 14, height: 14 }} />
            <span>{isRegister ? 'PENDAFTARAN AKUN' : 'MASUK AKUN FINANKU'}</span>
          </div>
          <WinButtons />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#11221B]/15">
            <div className="w-11 h-11 rounded-xl bg-[#CCF32F] border-2 border-[#11221B] shadow-[2px_2px_0px_0px_#11221B] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#11221B]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#11221B]">
                FinanKu
              </h1>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#11221B]/60">
                PERSONAL FINANCE &amp; BENTO OS
              </div>
            </div>
          </div>

          <span className="inline-block px-3 py-0.5 bg-[#F8F7F2] border border-[#11221B] rounded-full font-mono text-[11px] font-bold text-[#11221B]">
            {isRegister ? 'Akun Baru' : 'Selamat Datang'}
          </span>
          <h2 className="text-2xl font-extrabold text-[#11221B] mt-2">
            {isRegister ? 'Buat Akun Baru' : 'Masuk ke Akun Anda'}
          </h2>
          <p className="text-xs text-[#11221B]/70 mt-1 mb-4">
            {isRegister
              ? 'Daftarkan nama pengguna dan kata sandi untuk mulai mencatat keuangan.'
              : 'Masukkan nama pengguna dan kata sandi untuk melanjutkan.'}
          </p>

          {/* Segmented Toggle: Masuk vs Daftar */}
          <div
            role="tablist"
            className="w-full p-1 mb-5 rounded-full border-2 border-[#11221B] bg-[#F8F7F2] shadow-[3px_3px_0px_0px_#11221B] grid grid-cols-2 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => changeMode('login')}
              className={`py-2 px-4 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isRegister
                  ? 'bg-[#11221B] text-white shadow-[2px_2px_0px_0px_#CCF32F]'
                  : 'text-[#11221B]/70 hover:text-[#11221B]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => changeMode('register')}
              className={`py-2 px-4 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isRegister
                  ? 'bg-[#11221B] text-white shadow-[2px_2px_0px_0px_#CCF32F]'
                  : 'text-[#11221B]/70 hover:text-[#11221B]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Masukkan nama pengguna..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Kata Sandi *</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Minimal 6 karakter"
                  className="!w-full !pr-11"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F8F7F2] text-[#11221B]/60 hover:text-[#11221B] cursor-pointer"
                  onClick={() => setShowPassword(v => !v)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-confirm" className="!mb-0">Konfirmasi Kata Sandi *</label>
                  {passwordsMatch && (
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#0F7A5A]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Cocok
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#BA1A1A]">
                      <AlertCircle className="w-3.5 h-3.5" /> Belum sama
                    </span>
                  )}
                </div>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="login-confirm"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ulangi kata sandi"
                    className={`!w-full !pr-11 transition-colors ${
                      passwordsMismatch ? '!border-[#BA1A1A] !bg-red-50/40 focus:!border-[#BA1A1A]' : ''
                    } ${
                      passwordsMatch ? '!border-[#0F7A5A] !bg-emerald-50/40 focus:!border-[#0F7A5A]' : ''
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F8F7F2] text-[#11221B]/60 hover:text-[#11221B] cursor-pointer"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    title={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="mt-1 text-[11px] font-medium text-[#BA1A1A]">
                    Kata sandi konfirmasi belum sesuai dengan kata sandi di atas.
                  </p>
                )}
              </div>
            )}

            <div className={`form-error${error ? ' visible' : ''}`} style={{ display: error ? 'block' : 'none' }}>{error}</div>

            <button
              type="submit"
              className="w-full mt-4 py-3 px-5 rounded-full bg-[#CCF32F] border-2 border-[#11221B] shadow-[3px_3px_0px_0px_#11221B] hover:-translate-y-0.5 active:translate-y-0 transition-transform font-extrabold text-xs text-[#11221B] flex items-center justify-center gap-2 cursor-pointer"
              disabled={submitting}
            >
              {isRegister ? <UserPlus style={{ width: 16, height: 16 }} /> : <LogIn style={{ width: 16, height: 16 }} />}
              {submitting ? 'MEMPROSES...' : isRegister ? 'DAFTAR & MASUK' : 'MASUK SEKARANG'}
            </button>
          </form>

          <p className="mt-4 text-center font-mono text-[11px] text-[#11221B]/60">
            Data keuangan tersimpan di akun Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
