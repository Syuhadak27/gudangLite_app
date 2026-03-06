
# 📦 GudangLite - Offline Inventory System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Stable-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/Tech-IndexedDB-orange" alt="IndexedDB">
  <img src="https://img.shields.io/badge/Frontend-VanillaJS-yellow" alt="JS">
  <img src="https://img.shields.io/badge/UI-TailwindCSS-blue" alt="Tailwind">
</p>

**GudangLite** adalah sistem manajemen gudang berbasis web yang dirancang untuk performa tinggi dalam mode **100% Offline**. Aplikasi ini memanfaatkan **IndexedDB** sebagai mesin penyimpanan lokal, memungkinkan Anda menangani hingga **10.000+ baris data** tanpa ketergantungan pada server atau internet.

---

## 🚀 Fitur Utama

- **Offline-First Engine:** Semua data tersimpan aman di browser user menggunakan IndexedDB.
- **High Performance (10k+ Data):** Optimasi *in-memory caching* untuk pencarian dan filter instan tanpa *lag*.
- **Smart Inventory:** - Penambahan barang baru dengan validasi ID unik (Nama + Supplier).
  - Sistem filter multi-supplier yang rapi.
  - Perhitungan stok otomatis (Masuk/Keluar).
- **Import/Export:** Integrasi data JSON dengan progress bar visual yang informatif.
- **Modern UI:** Antarmuka responsif dengan sidebar yang dapat disembunyikan dan sistem modal yang elegan.

---

## 🛠️ Arsitektur Data

Kami menggunakan IndexedDB untuk memastikan integritas data tetap terjaga meskipun aplikasi dijalankan di perangkat dengan sumber daya terbatas.



---

## ⚙️ Handling 10,000+ Baris Data

Untuk memastikan performa tetap ringan meski data berukuran besar, GudangLite menerapkan strategi berikut:

| Teknik | Penjelasan |
| :--- | :--- |
| **IndexedDB Storage** | Menyimpan data mentah di penyimpanan lokal browser untuk kecepatan baca/tulis. |
| **In-Memory Caching** | Memuat data ke `Array` JS saat startup untuk pencarian/filter secepat kilat. |
| **Virtual Rendering** | Membatasi jumlah DOM yang dirender secara bersamaan untuk mencegah *browser freeze*. |
| **Atomic Transactions** | Memastikan sinkronisasi stok dan transaksi selalu konsisten (All-or-Nothing). |



---

## 🚀 Cara Instalasi

**Buka di Browser:**
Karena aplikasi ini menggunakan `IndexedDB` dan modul browser, pastikan Anda menjalankannya melalui *Local Server* (seperti Live Server di VS Code) agar fitur *file import/export* berjalan dengan izin yang benar.

---

## 🔐 Keamanan & Reset

Aplikasi dilengkapi dengan fitur proteksi **Admin Password** untuk tindakan sensitif seperti menghapus seluruh database (`Reset All`).

---



<p align="center">Built with ❤️ for High-Performance Offline Management</p>

```

-----
