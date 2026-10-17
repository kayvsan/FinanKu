# FinTrack.id (FinanKu)

Aplikasi pencatatan keuangan pribadi. Frontend React + Vite, backend Flask + SQLite dengan login JWT.

```
website/    frontend web React + Vite (tampilan 1:1 dengan website/index.original.html)
backend/    REST API Flask + SQLite
mobile/     aplikasi mobile React Native + Expo (lihat mobile/README.md)
```

## Menjalankan (development)

**1. Backend** (sekali saja untuk setup):

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r backend\requirements.txt
copy backend\.env.example backend\.env
# isi JWT_SECRET_KEY di backend\.env, mis. dari:
.\.venv\Scripts\python -c "import secrets; print(secrets.token_hex(32))"
```

Jalankan API (http://127.0.0.1:5000, database dibuat otomatis di `backend/instance/finanku.db`):

```powershell
cd backend
..\.venv\Scripts\python run.py
```

**2. Website** (terminal lain):

```powershell
cd website
npm install
npm run dev
```

Vite mem-proxy `/api` ke Flask, jadi buka saja alamat Vite. Akun baru otomatis berisi data contoh.

## Rute website (React Router)

| URL | Halaman |
|---|---|
| `/login`, `/register` | masuk / daftar (jika sudah login → dialihkan ke halaman tujuan) |
| `/` | Dashboard |
| `/transactions`, `/wallets`, `/budgets`, `/analytics`, `/goals`, `/categories`, `/settings` | halaman aplikasi (perlu login) |

Membuka halaman aplikasi tanpa login akan diarahkan ke `/login`, lalu kembali ke halaman semula setelah masuk. URL lain diarahkan ke `/`.

Selama request ke server berjalan, muncul garis loading di atas layar dan tombol yang sedang diproses dinonaktifkan dengan label seperti "Menyimpan...".

## Tes & lint

```powershell
cd backend; ..\.venv\Scripts\python -m pytest
cd ..\website; npm run lint
```

## Autentikasi

- **Access token** JWT (15 menit, atur lewat `JWT_ACCESS_SECONDS`) dikirim sebagai `Authorization: Bearer`, disimpan di memori frontend saja.
- **Refresh token** JWT (7 hari) disimpan di cookie httpOnly `SameSite=Strict` dengan path `/api/auth`, dilindungi CSRF (header `X-CSRF-TOKEN`).
- Saat access token kedaluwarsa, frontend otomatis memanggil `/api/auth/refresh` lalu mengulang request.
- Logout mencabut refresh token (blocklist di database).
- Kata sandi di-hash dengan Werkzeug (scrypt).

## Endpoint API (`/api`)

| Method | Path | Keterangan |
|---|---|---|
| POST | `/auth/register` | `{username, password}` → akun baru + data contoh |
| POST | `/auth/login` | `{username, password}` |
| POST | `/auth/refresh` | cookie refresh → access token baru |
| POST | `/auth/logout` | cabut refresh token |
| GET | `/auth/me` | user saat ini |
| GET | `/state` | semua data user: wallets, categories, transactions, budgets, goals |
| POST · PUT · DELETE | `/wallets[/<id>]` | hapus dompet ikut menghapus transaksinya; minimal 1 dompet |
| POST · PUT · DELETE | `/categories[/<id>]` | `DELETE ?replaceWith=<id>` jika kategori dipakai transaksi |
| POST · PUT · DELETE | `/transactions[/<id>]` | income / expense / transfer |
| PUT | `/budgets/<YYYY-MM>/<categoryId>` | `{amount}`; amount ≤ 0 menghapus |
| POST · DELETE | `/goals[/<id>]` | |
| PATCH | `/goals/<id>/adjust` | `{amount}` positif = tambah, negatif = tarik |
| POST | `/data/seed` | ganti semua data dengan data contoh |
| POST | `/data/import` | pulihkan dari file backup JSON |
| DELETE | `/data` | hapus dompet, transaksi, anggaran, target |

Semua error dikembalikan sebagai `{"error": "<pesan>"}`.

## Produksi

`run.py` memakai server development Flask. Untuk produksi gunakan WSGI server (mis. waitress/gunicorn), sajikan hasil `npm run build` (folder `website/dist`) dan `/api` dari origin yang sama lewat HTTPS, lalu set `JWT_COOKIE_SECURE=1`. Karena memakai React Router (history API), server harus mengembalikan `index.html` untuk semua path non-`/api` (SPA fallback) agar reload di mis. `/budgets` tidak 404.
