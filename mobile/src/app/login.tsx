import { Eye, EyeOff, Lock, LogIn, UserPlus, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Field, FormError, Segmented, TextField } from '@/components/forms';
import { TickerBar } from '@/components/ticker';
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === 'register';

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
    if (isRegister && password !== confirm) return setError('Konfirmasi kata sandi tidak sama.');
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
      <TickerBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          <HardShadow style={{ width: '100%', maxWidth: 420 }} contentStyle={{ overflow: 'hidden' }}>
            <View style={[st.winHeader, { backgroundColor: isRegister ? colors.lavender : colors.butter }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color={colors.navy} />
                <Txt variant="monoBold" style={{ fontSize: 11 }}>{isRegister ? 'DAFTAR_AKUN.EXE' : 'LOGIN_SISTEM.EXE'}</Txt>
              </View>
              <WinButtons />
            </View>

            <View style={{ padding: 18 }}>
              <View style={st.brand}>
                <View style={st.logo}><Wallet size={22} color={colors.navy} strokeWidth={2.2} /></View>
                <View>
                  <Txt variant="display" style={{ fontSize: 20 }}>
                    FinTrack<Txt variant="display" style={{ fontSize: 20, color: colors.bubblegum }}>.id</Txt>
                  </Txt>
                  <Txt variant="monoBold" style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.8 }}>PERSONAL FINANCE OS</Txt>
                </View>
              </View>

              <TagPill label={`✦ ${isRegister ? 'AKUN BARU' : 'SELAMAT DATANG'}`} />
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
                  onChangeText={setUsername}
                  placeholder="mis: kams"
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
                    onChangeText={setPassword}
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
                <Field label="Konfirmasi Kata Sandi *">
                  <TextField
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Ulangi kata sandi"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                    onSubmitEditing={submit}
                  />
                </Field>
              )}

              <FormError message={error} />
              <RetroButton
                label={submitting ? 'MEMPROSES...' : isRegister ? 'DAFTAR & MASUK' : 'MASUK'}
                icon={isRegister ? UserPlus : LogIn}
                onPress={submit}
                loading={submitting}
              />
              <Txt variant="mono" style={st.note}>🔒 Akun & data tersimpan aman di server.</Txt>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.butter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: { position: 'absolute', right: 10, padding: 4 },
  note: { textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: 14 },
});
