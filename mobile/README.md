# FinTrack.id — Aplikasi Mobile (Expo)

Versi mobile FinanKu dengan React Native + Expo (SDK 58) dan Expo Router. Memakai backend Flask yang sama (`../backend`), tampilan retro yang sama dengan versi web.

## Menjalankan di HP (Expo Go)

HP dan komputer harus terhubung ke **Wi-Fi yang sama**.

**1. Jalankan backend agar bisa diakses dari jaringan lokal** (dari folder `backend/`, setelah setup di README utama):

```powershell
$env:FLASK_HOST = '0.0.0.0'
..\.venv\Scripts\python run.py
```

Saat pertama kali, Windows Firewall akan bertanya apakah Python boleh menerima koneksi — izinkan untuk **jaringan privat**.

**2. Jalankan aplikasi** (dari folder `mobile/`):

```powershell
npm install
npx expo start
```

**3.** Install **Expo Go** dari Play Store / App Store, lalu scan QR code yang muncul di terminal (Android: dari Expo Go; iPhone: dari aplikasi Kamera).

Aplikasi otomatis memakai IP komputer yang menjalankan `expo start` untuk menghubungi API di port 5000. Alamat yang dipakai terlihat di bagian bawah halaman login.

### Jika HP tidak bisa terhubung ke server

- Pastikan backend jalan dengan `FLASK_HOST=0.0.0.0` dan firewall mengizinkannya.
- Coba buka `http://<IP-komputer>:5000/api/state` di browser HP — harus muncul `{"error": "Silakan login terlebih dahulu."}`.
- Tentukan alamat API secara manual dengan membuat `mobile/.env.local`:

  ```
  EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
  ```

  lalu jalankan ulang `npx expo start`.

## Login & keamanan

- Akun sama dengan versi web (login dari web atau HP memakai data yang sama).
- Access token (15 menit) hanya disimpan di memori; refresh token (7 hari) disimpan di **SecureStore** (Keychain iOS / Keystore Android) dan diperpanjang otomatis.
- "Keluar" di tab **Lainnya** mencabut refresh token di server.

## Fitur

Sama dengan versi web: dashboard, transaksi (tambah/edit/hapus, transfer, pencarian & filter), anggaran bulanan, analitik (grafik donat & tren), dompet, target tabungan, kategori, pengaturan (bagikan/impor backup JSON, data contoh, hapus semua). Tarik layar ke bawah untuk memuat ulang data dari server.

## Struktur

```
src/app/                  rute Expo Router
  _layout.tsx             font, splash screen, guard login (Stack.Protected)
  login.tsx               masuk / daftar
  (app)/_layout.tsx       data keuangan + ticker + semua sheet formulir
  (app)/(tabs)/           Beranda, Transaksi, Anggaran, Lainnya (+ tombol catat di tengah)
  (app)/analytics|wallets|goals|categories|settings.tsx
src/context/              AuthContext, FinanceContext
src/components/           komponen retro (ui, forms, chrome, ticker, finance-ui, modals)
src/lib/                  API client, penyimpanan token, format, perhitungan keuangan
```

## Pemeriksaan

```powershell
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx expo-doctor      # cek kecocokan dependensi SDK
```

Versi browser (`npx expo start --web`) bisa dipakai untuk mencoba cepat; jalankan backend dengan `$env:CORS_ORIGINS = 'http://localhost:8081'` agar browser diizinkan memanggil API.
