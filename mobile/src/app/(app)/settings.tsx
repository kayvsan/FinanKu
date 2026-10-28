import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Download, Settings, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/chrome';
import { HardShadow, RetroButton, Txt, WindowBox } from '@/components/ui';
import { useFinance } from '@/context/FinanceContext';
import { getApiBaseUrl } from '@/lib/api';
import { showAlert } from '@/lib/dialogs';
import { todayISO } from '@/lib/formatters';
import { colors } from '@/lib/theme';

export default function SettingsScreen() {
  const { state, importData, seedDemoData, clearAllData, isBusy } = useFinance();
  const [exporting, setExporting] = useState(false);
  // Seed, import and clear all replace the whole dataset; lock them together
  const dataBusy = isBusy('seed') || isBusy('import') || isBusy('clear');

  const exportJSON = async () => {
    const json = JSON.stringify(state, null, 2);
    const name = `fintrack_backup_${todayISO()}.json`;
    setExporting(true);
    try {
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const file = new File(Paths.cache, name);
      file.create({ overwrite: true });
      await file.write(json);
      if (!(await Sharing.isAvailableAsync())) {
        showAlert('Fitur berbagi tidak tersedia di perangkat ini.');
        return;
      }
      // Share sheet: save to Files / Drive, send via WhatsApp, e-mail, ...
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Simpan backup FinTrack' });
    } catch (err: any) {
      showAlert(`Gagal mengekspor data: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const importJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
      let imported: any;
      try {
        imported = JSON.parse(text);
      } catch {
        showAlert('Gagal membaca file JSON.');
        return;
      }
      if (!imported?.wallets || !imported?.transactions) {
        showAlert('Format file JSON tidak valid.');
        return;
      }
      if (await importData(imported)) showAlert('Data berhasil dipulihkan!');
    } catch (err: any) {
      showAlert(`Gagal membuka file: ${err.message}`);
    }
  };

  return (
    <Screen back>
      <WindowBox title="PENGATURAN & CADANGAN" icon={Settings} color="mint">
        <Txt variant="mono" style={{ fontSize: 11, color: colors.muted }}>
          Seluruh data disimpan secara aman di server dan terhubung ke akun Anda. Cadangkan atau pulihkan data kapan saja.
        </Txt>
      </WindowBox>

      <HardShadow style={st.card} contentStyle={st.cardBody}>
        <Txt variant="display" style={st.cardTitle}>Ekspor Data (Backup JSON)</Txt>
        <Txt style={st.cardText}>Simpan atau kirim seluruh riwayat transaksi, dompet, dan anggaran sebagai file .json.</Txt>
        <RetroButton label={exporting ? 'Menyiapkan...' : 'Bagikan Backup (.json)'} icon={Download} loading={exporting} onPress={exportJSON} />
      </HardShadow>

      <HardShadow style={st.card} contentStyle={st.cardBody}>
        <Txt variant="display" style={st.cardTitle}>Impor Data JSON</Txt>
        <Txt style={st.cardText}>Pulihkan data dari file JSON hasil backup sebelumnya (web atau aplikasi ini).</Txt>
        <RetroButton label={isBusy('import') ? 'Mengimpor...' : 'Pilih File JSON'} icon={Upload} variant="secondary" loading={isBusy('import')} disabled={dataBusy} onPress={importJSON} />
      </HardShadow>

      <HardShadow style={st.card} contentStyle={[st.cardBody, { backgroundColor: colors.errorBg }]}>
        <Txt variant="display" style={[st.cardTitle, { color: colors.error }]}>Reset & Muat Data Contoh</Txt>
        <Txt style={st.cardText}>Hapus semua data atau kembalikan ke data simulasi awal.</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <RetroButton label={isBusy('seed') ? 'Memuat...' : 'Isi Data Contoh'} variant="warn" small loading={isBusy('seed')} disabled={dataBusy} onPress={seedDemoData} style={{ flex: 1 }} />
          <RetroButton label={isBusy('clear') ? 'Menghapus...' : 'Hapus Semua'} variant="danger" small loading={isBusy('clear')} disabled={dataBusy} onPress={clearAllData} style={{ flex: 1 }} />
        </View>
      </HardShadow>

      <Txt variant="mono" style={{ fontSize: 10, color: colors.faint, textAlign: 'center', marginTop: 6 }}>Server API: {getApiBaseUrl()}</Txt>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { marginBottom: 16 },
  cardBody: { padding: 14, gap: 8 },
  cardTitle: { fontSize: 16 },
  cardText: { fontSize: 13, color: colors.muted, marginBottom: 4 },
});
