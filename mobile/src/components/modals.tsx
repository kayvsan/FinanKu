// Every form sheet of the app, rendered once by <ModalHost /> in the (app) layout
import { useState } from 'react';
import { View } from 'react-native';

import { useFinance } from '@/context/FinanceContext';
import { calculateWalletBalance } from '@/lib/finance';
import { formatIDR, formatRupiahString, parseRupiahInput, todayISO } from '@/lib/formatters';
import { colors } from '@/lib/theme';
import type { CategoryType, FinanceState, TxType, WalletType } from '@/lib/types';
import { DateField, Field, FormError, RupiahField, Segmented, SelectField, Sheet, TextField } from './forms';
import { RetroButton, Txt } from './ui';

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: 'Bank', label: 'Rekening Bank' },
  { value: 'E-Wallet', label: 'E-Wallet (GoPay, OVO, Dana, ShopeePay)' },
  { value: 'Tunai', label: 'Uang Tunai (Cash)' },
];

export function ModalHost() {
  const { state, modals } = useFinance();
  // Like the original: with no wallets the user must create one first
  const onboarding = state.wallets.length === 0;
  return (
    <>
      {modals.tx.open && !onboarding && <TransactionSheet />}
      {(modals.wallet.open || onboarding) && <WalletSheet onboarding={onboarding} />}
      {modals.category.open && <CategorySheet />}
      {modals.categoryReplace.open && <CategoryReplaceSheet />}
      {modals.goal.open && <GoalSheet />}
      {modals.goalAdjust.open && <GoalAdjustSheet />}
    </>
  );
}

function FormActions({ onCancel, submitLabel, saving, onSubmit }: { onCancel?: () => void; submitLabel: string; saving: boolean; onSubmit: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
      {onCancel && <RetroButton label="Batal" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />}
      <RetroButton label={saving ? 'Menyimpan...' : submitLabel} onPress={onSubmit} loading={saving} style={{ flex: 1 }} />
    </View>
  );
}

// ─── TRANSACTION ───
function defaultsForType(state: FinanceState, type: TxType) {
  const w = state.wallets;
  return {
    walletId: w[0]?.id || '',
    toWalletId: (type === 'transfer' && w.length > 1 ? w[1] : w[0])?.id || '',
    categoryId: state.categories.find(c => c.type === type)?.id || '',
  };
}

function TransactionSheet() {
  const { state, modals, closeModal, saveTransaction } = useFinance();
  const { editTx } = modals.tx;
  const [txType, setTxType] = useState<TxType>(modals.tx.type);
  const [form, setForm] = useState(() =>
    editTx
      ? {
          amount: formatRupiahString(editTx.amount),
          walletId: editTx.walletId,
          toWalletId: editTx.type === 'transfer' ? editTx.toWalletId : defaultsForType(state, editTx.type).toWalletId,
          categoryId: editTx.type === 'transfer' ? defaultsForType(state, 'expense').categoryId : editTx.categoryId,
          date: editTx.date,
          tag: editTx.tag || '',
          note: editTx.note || '',
        }
      : { amount: '', ...defaultsForType(state, modals.tx.type), date: todayISO(), tag: '', note: '' },
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));
  const close = () => closeModal('tx');

  const changeType = (type: TxType) => {
    setTxType(type);
    setForm(f => ({ ...f, ...defaultsForType(state, type) }));
  };

  const submit = async () => {
    const amount = parseRupiahInput(form.amount);
    if (!amount || amount <= 0) return setError('Nominal harus lebih dari Rp 0 dan tidak boleh kosong.');
    if (txType === 'transfer' && form.walletId === form.toWalletId) return setError('Dompet asal dan tujuan transfer tidak boleh sama.');
    setError('');
    setSaving(true);
    try {
      const ok = await saveTransaction({
        id: editTx?.id,
        type: txType,
        amount,
        date: form.date,
        walletId: form.walletId,
        toWalletId: txType === 'transfer' ? form.toWalletId : '',
        categoryId: txType === 'transfer' ? '' : form.categoryId,
        note: form.note.trim(),
        tag: form.tag.trim(),
      });
      if (ok) close();
      else setSaving(false);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const walletOptions = state.wallets.map(w => ({ value: w.id, label: w.name, hint: formatIDR(calculateWalletBalance(state, w.id)) }));
  const catOptions = state.categories.filter(c => c.type === txType).map(c => ({ value: c.id, label: c.name }));

  return (
    <Sheet visible title={editTx ? 'EDIT_TRANSAKSI.EXE' : 'CATAT_TRANSAKSI.EXE'} onClose={close}>
      <Txt variant="display" style={{ fontSize: 20, marginBottom: 12 }}>{editTx ? 'Edit Transaksi' : 'Catat Transaksi Baru'}</Txt>
      <Segmented<TxType>
        value={txType}
        onChange={changeType}
        options={[{ value: 'expense', label: 'Pengeluaran' }, { value: 'income', label: 'Pemasukan' }, { value: 'transfer', label: 'Transfer' }]}
      />
      <Field label="Nominal (Rp) *">
        <RupiahField value={form.amount} onChange={set('amount')} placeholder="0" autoFocus={!editTx} />
      </Field>
      <Field label={txType === 'transfer' ? 'Dari Dompet Asal *' : 'Dompet *'}>
        <SelectField value={form.walletId} options={walletOptions} onChange={set('walletId')} title="PILIH_DOMPET.EXE" />
      </Field>
      {txType === 'transfer' ? (
        <Field label="Ke Dompet Tujuan *">
          <SelectField value={form.toWalletId} options={walletOptions} onChange={set('toWalletId')} title="DOMPET_TUJUAN.EXE" />
        </Field>
      ) : (
        <Field label="Kategori *">
          <SelectField value={form.categoryId} options={catOptions} onChange={set('categoryId')} title="PILIH_KATEGORI.EXE" />
        </Field>
      )}
      <Field label="Tanggal *">
        <DateField value={form.date} onChange={set('date')} />
      </Field>
      <Field label="Tag (Opsional)">
        <TextField value={form.tag} onChangeText={set('tag')} placeholder="mis: #kantor, #liburan" autoCapitalize="none" />
      </Field>
      <Field label="Catatan (Opsional)">
        <TextField value={form.note} onChangeText={set('note')} placeholder="Makan siang nasi padang..." />
      </Field>
      <FormError message={error} />
      <FormActions onCancel={close} submitLabel="Simpan Transaksi" saving={saving} onSubmit={submit} />
    </Sheet>
  );
}

// ─── WALLET ───
function WalletSheet({ onboarding }: { onboarding: boolean }) {
  const { modals, closeModal, saveWallet } = useFinance();
  const editWallet = onboarding ? null : modals.wallet.editWallet;
  const [name, setName] = useState(editWallet?.name || '');
  const [type, setType] = useState<WalletType>(editWallet?.type || 'Bank');
  const [initial, setInitial] = useState(editWallet ? formatRupiahString(editWallet.initialBalance) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => closeModal('wallet');

  const submit = async () => {
    if (!name.trim()) return setError('Nama dompet wajib diisi.');
    setError('');
    setSaving(true);
    if (await saveWallet({ id: editWallet?.id, name: name.trim(), type, initialBalance: parseRupiahInput(initial) })) close();
    else setSaving(false);
  };

  const title = editWallet ? 'Edit Dompet' : onboarding ? 'Buat Dompet Pertama Anda' : 'Tambah Dompet / Rekening';
  return (
    <Sheet visible title="DOMPET.EXE" color="sky" onClose={close} dismissable={!onboarding}>
      <Txt variant="display" style={{ fontSize: 20, marginBottom: 12 }}>{title}</Txt>
      {onboarding && (
        <View style={{ padding: 10, borderWidth: 1.5, borderColor: colors.navy, borderRadius: 6, backgroundColor: colors.sky, marginBottom: 12 }}>
          <Txt variant="bodySemi" style={{ fontSize: 13 }}>Untuk memulai, buat minimal satu dompet dan masukkan saldo awal Anda.</Txt>
        </View>
      )}
      <Field label="Nama Dompet / Rekening *">
        <TextField value={name} onChangeText={setName} placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai" />
      </Field>
      <Field label="Jenis Dompet *">
        <SelectField value={type} options={WALLET_TYPES} onChange={v => setType(v as WalletType)} title="JENIS_DOMPET.EXE" />
      </Field>
      <Field label="Saldo Awal (Rp) *">
        <RupiahField value={initial} onChange={setInitial} placeholder="0" />
      </Field>
      <FormError message={error} />
      <FormActions onCancel={onboarding ? undefined : close} submitLabel="Simpan Dompet" saving={saving} onSubmit={submit} />
    </Sheet>
  );
}

// ─── CATEGORY ───
function CategorySheet() {
  const { modals, closeModal, saveCategory } = useFinance();
  const { editCategory } = modals.category;
  const [name, setName] = useState(editCategory?.name || '');
  const [type, setType] = useState<CategoryType>(editCategory?.type || 'expense');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => closeModal('category');

  const submit = async () => {
    if (!name.trim()) return setError('Nama kategori wajib diisi.');
    setError('');
    setSaving(true);
    if (await saveCategory({ id: editCategory?.id, name: name.trim(), type })) close();
    else setSaving(false);
  };

  return (
    <Sheet visible title="KATEGORI.EXE" color="lavender" onClose={close}>
      <Txt variant="display" style={{ fontSize: 20, marginBottom: 12 }}>{editCategory ? 'Ubah Kategori' : 'Tambah Kategori'}</Txt>
      <Field label="Nama Kategori *">
        <TextField value={name} onChangeText={setName} placeholder="Contoh: Kopi & Camilan" />
      </Field>
      <Field label="Tipe *">
        <Segmented<CategoryType>
          value={type}
          onChange={setType}
          options={[{ value: 'expense', label: 'Pengeluaran' }, { value: 'income', label: 'Pemasukan' }]}
        />
      </Field>
      <FormError message={error} />
      <FormActions onCancel={close} submitLabel="Simpan" saving={saving} onSubmit={submit} />
    </Sheet>
  );
}

function CategoryReplaceSheet() {
  const { state, modals, closeModal, replaceAndDeleteCategory, isBusy } = useFinance();
  const cat = state.categories.find(c => c.id === modals.categoryReplace.categoryId);
  const sameType = cat ? state.categories.filter(c => c.type === cat.type && c.id !== cat.id) : [];
  const usedCount = cat ? state.transactions.filter(t => t.categoryId === cat.id).length : 0;
  const [replacementId, setReplacementId] = useState(sameType[0]?.id || '');
  const close = () => closeModal('categoryReplace');
  const busy = cat ? isBusy(`cat-del-${cat.id}`) : false;

  const confirm = async () => {
    if (cat && replacementId && !(await replaceAndDeleteCategory(cat.id, replacementId))) return;
    close();
  };

  return (
    <Sheet visible title="KATEGORI_DIPAKAI.EXE" color="bubblegum" onClose={close}>
      <Txt variant="display" style={{ fontSize: 20, marginBottom: 6, color: colors.error }}>Kategori Sedang Digunakan</Txt>
      <Txt style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>
        {cat ? `Kategori "${cat.name}" sedang digunakan oleh ${usedCount} transaksi. Pilih kategori pengganti sebelum menghapus:` : ''}
      </Txt>
      <Field label="Pilih Kategori Pengganti *">
        <SelectField value={replacementId} options={sameType.map(c => ({ value: c.id, label: c.name }))} onChange={setReplacementId} title="KATEGORI_PENGGANTI.EXE" />
      </Field>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        <RetroButton label="Batal" variant="secondary" onPress={close} style={{ flex: 1 }} />
        <RetroButton label={busy ? 'Memindahkan...' : 'Pindahkan & Hapus'} variant="danger" onPress={confirm} loading={busy} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

// ─── GOALS ───
function GoalSheet() {
  const { closeModal, saveGoal } = useFinance();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => closeModal('goal');

  const submit = async () => {
    const targetNum = parseRupiahInput(target);
    if (!name.trim()) return setError('Nama target wajib diisi.');
    if (targetNum <= 0) return setError('Nominal target harus lebih dari Rp 0.');
    setError('');
    setSaving(true);
    if (await saveGoal({ name: name.trim(), target: targetNum, deadline })) close();
    else setSaving(false);
  };

  return (
    <Sheet visible title="TARGET_TABUNGAN.OBJ" color="peach" onClose={close}>
      <Txt variant="display" style={{ fontSize: 20, marginBottom: 12 }}>Buat Target Tabungan</Txt>
      <Field label="Nama Target *">
        <TextField value={name} onChangeText={setName} placeholder="Contoh: Dana Darurat, Liburan Jepang" />
      </Field>
      <Field label="Nominal Target (Rp) *">
        <RupiahField value={target} onChange={setTarget} placeholder="10.000.000" />
      </Field>
      <Field label="Tanggal Target Tercapai (Opsional)">
        <DateField value={deadline} onChange={setDeadline} optional placeholder="Tanpa tenggat" />
      </Field>
      <FormError message={error} />
      <FormActions onCancel={close} submitLabel="Buat Target" saving={saving} onSubmit={submit} />
    </Sheet>
  );
}

// Replaces the original's window.prompt() for "+ Tambah Dana" / "- Tarik"
function GoalAdjustSheet() {
  const { modals, closeModal, adjustGoalFund } = useFinance();
  const { goal, sign } = modals.goalAdjust;
  const [amount, setAmount] = useState('500.000');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => closeModal('goalAdjust');
  if (!goal) return null;

  const submit = async () => {
    const amt = parseRupiahInput(amount);
    if (amt <= 0) return setError('Nominal harus lebih dari Rp 0.');
    setError('');
    setSaving(true);
    if (await adjustGoalFund(goal.id, sign * amt)) close();
    else setSaving(false);
  };

  return (
    <Sheet visible title={sign > 0 ? 'TAMBAH_DANA.EXE' : 'TARIK_DANA.EXE'} color={sign > 0 ? 'mint' : 'peach'} onClose={close}>
      <Txt variant="display" style={{ fontSize: 20, marginBottom: 4 }}>{`${sign > 0 ? 'Tambah dana ke' : 'Tarik dana dari'} "${goal.name}"`}</Txt>
      <Txt variant="mono" style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
        Terkumpul {formatIDR(goal.saved)} dari {formatIDR(goal.target)}
      </Txt>
      <Field label="Nominal (Rp) *">
        <RupiahField value={amount} onChange={setAmount} autoFocus selectTextOnFocus />
      </Field>
      <FormError message={error} />
      <FormActions onCancel={close} submitLabel={sign > 0 ? '+ Tambah Dana' : '- Tarik Dana'} saving={saving} onSubmit={submit} />
    </Sheet>
  );
}
