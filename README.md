# SisaBaik API

REST API SisaBaik untuk praktikum Pengembangan Web Chapter 7. Backend menggunakan Express dan PostgreSQL untuk mengelola penawaran serta membuat pesanan dengan pengurangan stok dan penyimpanan harga saat pemesanan.

Versi aplikasi pada pengujian: **1.2.0**. Database latihan: **`sisabaik_dev`**.

## Prasyarat

- Node.js 22 atau lebih baru dan npm.
- PostgreSQL lokal berjalan. Pengujian menggunakan PostgreSQL 18.
- Database Chapter 6 sudah tersedia, beserta tabel `pengguna`, `penyedia`, `penawaran`, `pesanan`, `detail_pesanan`, dan `pengambilan`.
- VS Code dan browser untuk menjalankan halaman penguji.
- Git untuk mencatat perubahan proyek.

Gunakan database Chapter 6 yang sudah dipakai dalam pengujian. Script `01_schema.sql` dapat menghapus data jika dijalankan ulang; instalasi Chapter 7 tidak memerlukan reset schema atau seed.

## Konfigurasi lokal

Jalankan perintah dari root proyek, yaitu folder yang berisi `package.json` dan `server.js`.

```bash
npm install
```

Pertahankan `.env` yang sudah digunakan saat pengujian. Variabel yang diperlukan:

```dotenv
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=sisabaik_dev
PGUSER=postgres
PGPASSWORD=GANTI_DENGAN_PASSWORD_LOKAL
```

Nilai `PGPASSWORD` di atas adalah penanda contoh. Isi password yang sebenarnya hanya dalam `.env` lokal. `.env.example` berisi nama variabel dan nilai contoh tanpa rahasia. Bila `.env` belum tersedia, buat dari `.env.example`, kemudian sesuaikan konfigurasi koneksinya.

Pastikan `.gitignore` memuat:

```gitignore
node_modules/
.env
*.log
```

Periksa koneksi database dan status file konfigurasi:

```bash
npm run db:check -- 0
git check-ignore .env
git ls-files .env
```

`git check-ignore .env` seharusnya menampilkan `.env`, sedangkan `git ls-files .env` tidak menampilkan file apa pun. Jangan memasukkan password atau `.env` ke laporan maupun commit.

## Menjalankan aplikasi

Mode pengembangan:

```bash
npm run dev
```

Menjalankan server tanpa mode watch:

```bash
npm start
```

Kedua script memuat `.env` melalui opsi `--env-file`. Server mendengarkan alamat lokal `127.0.0.1`, dengan port default `3000`.

- Halaman penguji: `http://127.0.0.1:3000/`
- Health check: `http://127.0.0.1:3000/api/health`

Buka halaman melalui server Express tersebut. Frontend dan API menggunakan origin yang sama. Hentikan server dengan `Ctrl+C` sebelum menjalankan proses lain pada port yang sama.

## Script yang digunakan

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server dan memantau perubahan file. |
| `npm start` | Menjalankan server tanpa mode watch. |
| `npm run db:check -- 0` | Menjalankan pemeriksaan koneksi dari Chapter 6. |
| `npm run db:order` | Menjalankan latihan transaksi dari Chapter 6; gunakan jika memang diperlukan karena dapat mengubah data. |
| `npm run api:test -- http://127.0.0.1:3000` | Menguji API pada server lokal yang sedang berjalan. |
| `node scripts/uji-konkurensi.js` | Menguji dua request bersamaan pada penawaran dengan stok satu. |

## Pengujian API

Biarkan server berjalan pada terminal pertama. Buka terminal kedua di root proyek:

```bash
npm run api:test -- http://127.0.0.1:3000
node scripts/uji-konkurensi.js
```

Script pengujian membuat data fiktif dan mengubah database latihan. Penawaran yang sudah dipesan dipertahankan sebagai bukti riwayat. Jalankan pengujian pada database lokal, dengan pembeli latihan aktif `siti.pembeli@example.test` dan penyedia latihan yang sesuai. Fixture modul memakai penyedia ID `1` dan `2`; cocokkan dengan data Chapter 6.

Pada pengujian tanggal 10 Oktober 2026, script `api:test` mencatat 30 keluaran `PASS` dan menyimpan pesanan ID `8` serta penawaran ID `16`. Uji konkurensi terpisah menggunakan penawaran ID `14` dan menghasilkan satu pesanan ID `7`. ID tersebut merupakan hasil satu pelaksanaan pengujian, bukan ID yang akan selalu sama ketika script diulang.

Pemeriksaan manual melengkapi bukti JSON rusak, Content-Type salah, payload terlalu besar, kolom asing, batas ID, snapshot harga, rollback, dan pembacaan pesanan setelah restart. Laporan pengujian Word disimpan di folder `docs`.

Status 4xx pada kasus negatif dapat merupakan hasil yang diharapkan. Contohnya, pesanan melebihi stok harus ditolak dengan `409`, sedangkan penawaran tanpa riwayat yang berhasil dihapus mengembalikan `204` tanpa body.

## Kontrak API

Kontrak lengkap ada di [docs/API.md](docs/API.md), mencakup endpoint, field wajib, query, contoh request dan response, serta kode error.

Perubahan penting dari Chapter 5:

- Request pesanan menggunakan `emailPembeli`, menggantikan `namaPemesan` bebas. Field `namaPemesan` pada response dibaca dari akun pembeli yang tersimpan.
- ID penawaran, pesanan, pembeli, dan penyedia pada response berbentuk **string digit**, untuk mempertahankan ketelitian ID BIGINT.
- Harga dan nilai transaksi berupa integer rupiah, sesuai kapasitas `NUMERIC(12,0)`.
- PUT penawaran memerlukan seluruh field yang dapat diedit. Penyedia pemilik, ID, dan waktu pembuatan tetap dipertahankan.
- Satu pesanan hanya dapat berisi penawaran dari satu penyedia.
- Harga pada detail pesanan disimpan saat pemesanan dan tidak mengikuti perubahan harga penawaran berikutnya.
- Penawaran yang sudah dirujuk detail pesanan tidak dapat dihapus.

## Struktur bagian backend

| Lokasi | Tanggung jawab |
| --- | --- |
| `server.js` | Menjalankan server dan menangani shutdown. |
| `src/app.js` | Merakit middleware, file statis, health check, dan router. |
| `src/routes/` | Menentukan method dan path endpoint. |
| `src/controllers/` | Memvalidasi input HTTP dan membentuk response. |
| `src/repositories/penawaran.js` | CRUD, pencarian, filter, dan pemetaan data penawaran. |
| `src/services/pesanan.js` | Pembuatan pesanan, stok, snapshot harga, dan total transaksi. |
| `src/db/` | Pool koneksi dan helper transaksi. |
| `src/lib/api.js` | Validasi input, HttpError, dan metadata paginasi. |
| `src/middleware/` | Logger, route tidak ditemukan, dan penanganan error. |
| `public/` | Halaman penguji yang dilayani Express. |
| `database/` | SQL Chapter 6 yang dipertahankan. |
| `scripts/` | Pemeriksaan koneksi dan script pengujian. |
| `docs/` | Kontrak API dan laporan hasil pengujian. |

Route penawaran dan pesanan memakai PostgreSQL sebagai sumber data. `src/data/store.js` dari chapter sebelumnya tidak digunakan oleh route Chapter 7.

## Batas aplikasi

Aplikasi ini digunakan secara lokal dengan data fiktif. Login, autentikasi, otorisasi, pembayaran, pembatalan pesanan, endpoint pengambilan, dan PATCH belum tersedia. `emailPembeli` memilih akun latihan yang sudah ada; field tersebut bukan bukti login.

`nilaiStokTerselamatkan` menunjukkan nilai normal stok yang dipesan. Nilai ini belum membuktikan pembayaran, pengambilan makanan, atau pengurangan limbah pangan di dunia nyata.

## Dokumentasi perubahan

Simpan laporan hasil uji dalam `docs`, lalu catat commit yang diuji dan nama database. Hash commit dapat diperiksa dengan:

```bash
git rev-parse HEAD
```

Periksa `git diff --staged` sebelum setiap commit dan ikuti kelompok perubahan pada Langkah 18 modul. Berkas `.env`, `node_modules`, dan data pribadi tidak dimasukkan ke commit. `package-lock.json`, `.env.example`, script uji, README, dan kontrak API termasuk berkas proyek yang perlu dicatat.

## Acuan

Modul Pengembangan Web Chapter 7 Membangun REST API SisaBaik, khususnya kontrak resource, kode lengkap tutorial, dan Langkah 18. Prasyarat database mengikuti Chapter 6.

## Frontend Vue (Chapter 9)

Frontend berada di folder `frontend/` dan memakai Vue 3 + Vite.
Pada tahap ini data masih berupa fixture di memori browser.
Browser tidak memanggil API. Backend Modul 8 tetap tersedia
(pendaftaran mandiri, verifikasi penyedia, autentikasi, otorisasi)
dan akan diintegrasikan pada pertemuan 11.

### Persyaratan
- Node.js 22.18.0 atau lebih baru pada seri 22, atau 24.12.0+
- npm

### Menjalankan
Semua perintah dijalankan dari folder `frontend`:

    cd frontend
    npm install        # atau npm ci bila package-lock.json sudah ada
    npm run dev        # http://127.0.0.1:5173/
    npm run build      # menghasilkan frontend/dist
    npm run preview    # http://127.0.0.1:4173/

### Aset SVG lokal (frontend/src/assets)
- brand-mark.svg (logo)
- food-bread.svg (ilustrasi roti)
- food-bowl.svg (ilustrasi makanan siap saji)
- food-produce.svg (ilustrasi bahan segar)

### Catatan
- Data berasal dari fixture di `src/data/penawaran-latihan.js`
  dan hilang saat halaman di-refresh (bukan PostgreSQL).
- Pemilih "Tampilan" hanya demonstrasi state lokal,
  bukan login atau otorisasi.