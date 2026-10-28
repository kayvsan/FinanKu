import { AlertCircle, Check, Eye, EyeOff, Lock, LogIn, UserPlus, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Field, FormError, Segmented, TextField } from '@/components/forms';
import { NetworkProgress } from '@/components/ticker';
import { HardShadow, RetroButton, TagPill, Txt, WinButtons } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import { colors } from '@/lib/theme';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === 'register';

  const passwordsMatch = isRegister && confirm.length > 0 && password === confirm;
  const passwordsMismatch = isRegister && confirm.length > 0 && password !== confirm;

  const changeMode = (next: Mode) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirm('');
  };

  const submit = async () => {
    const name = username.trim();
    if (name.length < 3) return setError('Nama pengguna minimal 3 karakter.');
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.');
    if (isRegister && password !== confirm) return setError('Konfirmasi kata sandi tidak sama dengan kata sandi di atas.');
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(name, password);
      else await login(name, password);
      // the root Stack.Protected guard switches to the app on success
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <NetworkProgress />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          <HardShadow style={{ width: '100%', maxWidth: 420 }} contentStyle={{ overflow: 'hidden' }}>
            <View style={[st.winHeader, { backgroundColor: isRegister ? colors.lavender : colors.lime }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color={colors.navy} />
                <Txt variant="monoBold" style={{ fontSize: 11 }}>{isRegister ? 'PENDAFTARAN AKUN' : 'MASUK AKUN FINANKU'}</Txt>
              </View>
              <WinButtons />
            </View>

            <View style={{ padding: 20 }}>
              <View style={st.brand}>
                <View style={st.logo}><Wallet size={20} color={colors.navy} strokeWidth={2.3} /></View>
                <View>
                  <Txt variant="display" style={{ fontSize: 20 }}>
                    FinanKu
                  </Txt>
                  <Txt variant="monoBold" style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.6 }}>PERSONAL FINANCE &amp; BENTO OS</Txt>
                </View>
              </View>

              <TagPill label={isRegister ? 'Akun Baru' : 'Selamat Datang'} />
              <Txt variant="display" style={{ fontSize: 22, marginTop: 10 }}>{isRegister ? 'Buat Akun Baru' : 'Masuk ke Akun Anda'}</Txt>
              <Txt style={{ fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 16 }}>
                {isRegister
                  ? 'Daftarkan nama pengguna dan kata sandi untuk mulai mencatat keuangan.'
                  : 'Masukkan nama pengguna dan kata sandi untuk melanjutkan.'}
              </Txt>

              <Segmented<Mode> value={mode} onChange={changeMode} options={[{ value: 'login', label: 'Masuk' }, { value: 'register', label: 'Daftar' }]} />

              <Field label="Nama Pengguna *">
                <TextField
                  value={username}
                  onChangeText={t => { setUsername(t); if (error) setError(''); }}
                  placeholder="Masukkan nama pengguna..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                />
              </Field>
              <Field label="Kata Sandi *">
                <View style={{ justifyContent: 'center' }}>
                  <TextField
                    value={password}
                    onChangeText={t => { setPassword(t); if (error) setError(''); }}
                    placeholder="Minimal 6 karakter"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    textContentType={isRegister ? 'newPassword' : 'password'}
                    style={{ paddingRight: 44 }}
                    onSubmitEditing={isRegister ? undefined : submit}
                  />
                  <Pressable
                    onPress={() => setShowPassword(v => !v)}
                    style={st.eye}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    hitSlop={8}
                  >
                    {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
                  </Pressable>
                </View>
              </Field>
              {isRegister && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Txt variant="monoBold" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Konfirmasi Kata Sandi *
                    </Txt>
                    {passwordsMatch && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Check size={13} color={colors.success} strokeWidth={2.6} />
                        <Txt variant="monoBold" style={{ fontSize: 10, color: colors.success }}>Cocok</Txt>
                      </View>
                    )}
                    {passwordsMismatch && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <AlertCircle size={13} color={colors.error} strokeWidth={2.4} />
                        <Txt variant="monoBold" style={{ fontSize: 10, color: colors.error }}>Belum sama</Txt>
                      </View>
                    )}
                  </View>
                  <View style={{ justifyContent: 'center' }}>
                    <TextField
                      value={confirm}
                      onChangeText={t => { setConfirm(t); if (error) setError(''); }}
                      placeholder="Ulangi kata sandi"
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      textContentType="newPassword"
                      style={[
                        { paddingRight: 44 },
                        passwordsMismatch && { borderColor: colors.error, backgroundColor: '#fef2f2' },
                        passwordsMatch && { borderColor: colors.success, backgroundColor: '#ecfdf5' },
                      ]}
                      onSubmitEditing={submit}
                    />
                    <Pressable
                      onPress={() => setShowConfirm(v => !v)}
                      style={st.eye}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirm ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                      hitSlop={8}
                    >
                      {showConfirm ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
                    </Pressable>
                  </View>
                  {passwordsMismatch && (
                    <Txt style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                      Kata sandi konfirmasi belum sesuai dengan kata sandi di atas.
                    </Txt>
                  )}
                </View>
              )}

              <FormError message={error} />
              <RetroButton
                label={submitting ? 'MEMPROSES...' : isRegister ? 'DAFTAR & MASUK' : 'MASUK SEKARANG'}
                icon={isRegister ? UserPlus : LogIn}
                onPress={submit}
                loading={submitting}
              />
              <Txt variant="mono" style={st.note}>Data keuangan tersimpan di akun Anda.</Txt>
              <Txt variant="mono" style={[st.note, { marginTop: 4, fontSize: 9 }]} numberOfLines={1}>API: {getApiBaseUrl()}</Txt>
            </View>
          </HardShadow>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  winHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.hairline,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: { position: 'absolute', right: 10, padding: 4 },
  note: { textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: 14 },
});

