# Laporan Hasil Pengujian Antarmuka Vue 3 — Chapter 9

## 1. Identitas Penguji & Lingkungan
* **Nama:** WANDI AKBAR ZEIN
* **NIM:** 23367053
* **Program Studi:** Bisnis Digital
* **Mata Kuliah:** Pengembangan Web (DGT1.62.7009)
* **Semester:** Ganjil 2026/2027
* **Tanggal Pengujian:** 1 November 2026
* **Branch Git:** `feature/vue-components`
* **Commit Target:** `feat: build SisaBaik Vue components`
* **Versi Node.js:** v22.18.0
* **Versi npm:** v10.8.2
* **Port Server:** Development (5173), Preview (4173)

---

## 2. Tabel Skenario Pengujian Aktual (Langkah 12)

| Skenario Pengujian | Ekspektasi Modul | Hasil Aktual | Status |
| :--- | :--- | :--- | :---: |
| **Halaman baru (Mode Pembeli)** | 3 kartu tampil; 15 unit tersedia; 2 penyedia aktif. | 3 kartu tampil (Roti Sore, Nasi Padang, Sayur Layak Olah), total 15 unit, 2 penyedia terhitung. | LULUS |
| **Pencarian `LAPAU`** | Menampilkan 2 kartu milik Lapau Uni Rina (case-insensitive). | Hanya menampilkan 2 kartu penawaran Lapau Uni Rina. | LULUS |
| **Pencarian `egerhe` / `tidak-ada`** | Katalog kosong dan pesan *empty state* tampil. | Tampil pesan "Belum ada makanan yang cocok" dan tombol "Tampilkan semua". | LULUS |
| **Reset filter & pilih kategori `roti`** | Menampilkan 1 kartu (Paket Roti Sore). | 1 kartu Paket Roti Sore ditampilkan secara presisi. | LULUS |
| **Klik "Pilih makanan" Paket Roti Sore** | Ringkasan "Pilihan Anda" mendapat fokus; stok tetap 6. | Panel pilihan tampil di bawah, fokus berpindah via `await nextTick()`, stok tidak berkurang. | LULUS |
| **Beralih ke mode Penyedia Rina** | 3 kartu Rina (termasuk draft); 2 tersedia; 9 unit tersedia. | Menampilkan 3 kartu milik Rina (termasuk Draft Paket Besok), 2 status tersedia, total 9 unit. | LULUS |
| **Submit form kosong** | Pesan error tampil, fokus ke ringkasan error, daftar tetap 3. | Form menolak submit, ringkasan error merah "Periksa isian yang ditandai" mendapat fokus. | LULUS |
| **Submit form invalid (Harga normal 20.000, Penawaran 30.000)** | Tampil kesalahan harga penawaran melebihi harga normal. | Pesan error "Harga penawaran tidak boleh melebihi harga normal" muncul, data tidak ter-emit. | LULUS |
| **Submit form valid (Harga penawaran Rp0 / Gratis)** | Penawaran bertambah ke daftar Rina; form reset kosong; ringkasan 4/3/14. | Data bertambah di awal daftar, harga Rp0 berlabel "Gratis", ringkasan diperbarui (4 penawaran, 3 tersedia, 14 unit). | LULUS |
| **Beralih ke Pembeli & reset filter** | Katalog pembeli bertambah menjadi 4 kartu, 17 unit, 2 penyedia. | 4 kartu aktif tampil di pembeli dengan total 17 unit. | LULUS |
| **Beralih lagi ke Penyedia** | Form kosong, penawaran baru yang ditambahkan tetap ada. | Form tetap bersih (state lokal reset), daftar Rina memuat item baru. | LULUS |
| **Refresh browser** | Data kembali ke 3 kartu awal, 15 unit. | Data reset ke fixture awal di memori (`penawaran-latihan.js`). | LULUS |
| **Uji visual & badge gratis** | Badge "Gratis" tampil pada harga 0; potensi hemat dihitung benar. | Makanan harga Rp0 ber-badge Gratis; potensi hemat dihitung presisi `hargaNormal - hargaPenawaran`. | LULUS |
| **Responsif (375px, 768px, 1280px) & Keyboard** | Tidak ada horizontal scroll; navigasi Tab & Lewati ke konten bekerja. | Layout menyesuaikan grid 1 kolom di mobile tanpa overflow horizontal, fokus keyboard terlihat jelas. | LULUS |
| **Batas waktu (Timer 1 detik)** | Penawaran lewat waktu otomatis hilang dari status tersedia. | Timer `setInterval` 1000ms memperbarui `waktuSekarang` dan memicu status kedaluwarsa. | LULUS |

---

## 3. Penjelasan Aliran Props & Emits

1. **Aliran Data Turun (Props):**
   * **`KartuPenawaran.vue`**: Menerima prop `penawaran` (Object), `waktuSekarang` (Number), dan `bolehPilih` (Boolean). Komponen bersifat *read-only* terhadap props dan menggunakan `computed` untuk nilai turunan (seperti potensi hemat, persentase diskon, visual kategori, dan ketersediaan).
   * **`FilterPenawaran.vue`**: Menerima prop `pencarian` (String), `kategori` (String), dan `daftarKategori` (Array) dari induk (`App.vue`).

2. **Aliran Event Naik (Emits):**
   * **`FilterPenawaran.vue`**: Memancarkan event `@ubah-pencarian` dan `@ubah-kategori` beserta payload string ketikan/pilihan pengguna ke `App.vue`. Event `@reset` dikirim tanpa payload untuk mengosongkan state filter induk.
   * **`KartuPenawaran.vue`**: Memancarkan event `@pilih` membawa payload `penawaran.id` saat tombol "Pilih makanan" diklik. Induk (`App.vue`) menangani pembaruan state `pilihanId` dan memindahkan fokus keyboard.
   * **`FormPenawaran.vue`**: Mengelola state isian lokalnya sendiri menggunakan `ref(formKosong())`. Setelah lulus validasi `validasiForm()`, komponen memancar event `@simpan` membawa payload object data penawaran yang valid ke `App.vue`, lalu mengosongkan form lokalnya.

---

## 4. Perhitungan Ringkasan Pembeli & Penyedia

* **Ringkasan Pembeli:**
  Dihitung menggunakan `computed` berbasis seluruh penawaran yang memenuhi fungsi ketersediaan `tersedia()` (status `aktif`, stok > 0, dan belum kedaluwarsa):
  ```javascript
  const penawaranTersedia = computed(() =>
    penawaran.value.filter((p) => tersedia(p, waktuSekarang.value))
  );
  const jumlahUnit = computed(() =>
    penawaranTersedia.value.reduce((jumlah, p) => jumlah + p.stok, 0)
  );
  const jumlahPenyedia = computed(() =>
    new Set(penawaranTersedia.value.map((p) => p.penyediaId)).size
  );
  ```

* **Ringkasan Penyedia (Rina):**
  Dihitung khusus dari penawaran milik Rina (`penyediaId === '1'`):
  ```javascript
  const milikRina = computed(() =>
    penawaran.value.filter((p) => p.penyediaId === penyediaLatihan.id)
  );
  const milikTersedia = computed(() =>
    milikRina.value.filter((p) => tersedia(p, waktuSekarang.value))
  );
  const jumlahUnitMilik = computed(() =>
    milikTersedia.value.reduce((jumlah, p) => jumlah + p.stok, 0)
  );
  ```

---

## 5. Bukti Tangkapan Layar (Screenshots)

### 1. Katalog Pembeli Utama
![Katalog Pembeli](./screenshots/katalog.png)

### 2. Pencarian Kosong (Empty State)
![Empty State](./screenshots/empty-state.png)

### 3. Form Validasi Gagal (Form Invalid)
![Form Invalid](./screenshots/form-invalid.png)

### 4. Form Penambahan Valid (Form Valid)
![Form Valid](./screenshots/form-valid.png)

### 5. Tampilan Seluler / Mobile (375px / 768px)
![Tampilan Mobile](./screenshots/tampilan-mobile.png)

### 6. Hasil Build Terminal (`npm run build`)
![Terminal Build](./screenshots/terminal-build.png)

---

## 6. Pernyataan Batas Keamanan & Data
* Pengujian ini berjalan penuh di browser menggunakan fixture memori (`penawaran-latihan.js`).
* Laporan ini **tidak memuat** variabel lingkungan `.env`, kata sandi akun, hash password, token JWT, `JWT_SECRET`, atau data pribadi nyata.
