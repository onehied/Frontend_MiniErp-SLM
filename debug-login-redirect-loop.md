# Debug Session: login-redirect-loop [OPEN]

## Ringkasan Masalah
- Gejala: saat membuka `http://localhost:3001` sebelum login, browser tiba-tiba pindah ke `/dashboard` lalu balik ke `/login` terus menerus.
- Dampak: user tidak bisa login karena terjadi redirect loop.
- Status: investigasi awal.

## Langkah Reproduksi
1. Jalankan frontend pada `http://localhost:3001`.
2. Buka root `/` atau `/login` dalam kondisi belum login.
3. Amati perpindahan route berulang antara `/dashboard` dan `/login`.

## Hipotesis Awal
1. `hasHydrated` aktif sebelum state persist auth stabil.
2. Ada dua atau lebih efek redirect auth yang bertabrakan.
3. Data auth lama di storage menyebabkan kondisi token tidak konsisten.
4. Wrapper hydration merender route terlalu cepat.
5. Redirect dari `/` dan `/login` saling memicu loop.

## Bukti yang Dibutuhkan
- Nilai `token`, `hasHydrated`, pathname, dan waktu render pada halaman root, login, dan dashboard.
- Isi `localStorage` auth saat loop terjadi.
- Urutan redirect aktual di browser/network.

## Perubahan
- Instrumentasi ditambahkan pada `HydrationWrapper`, `/login`, `/dashboard`, dan `AuthLanding`.
- Fix 1: sinkronkan pembacaan token pada interceptor API dengan key persist Zustand `auth-storage`.
- Fix 2: pada `401`, hapus `auth-storage` dan jalankan `logout()` store.
- Fix 3: validasi token lewat `/auth/me` di `AuthLanding` sebelum redirect ke `/dashboard`.
- Fix 4: perbaiki alur `/login` agar redirect ke root validator, bukan langsung ke dashboard.
- Fix 5: rapikan urutan hooks di `AuthLanding` agar tidak ada hook setelah conditional return.

## Bukti Utama
- Log pre-fix menunjukkan `/login` membaca `tokenPresent: true` berulang walau user belum bisa masuk.
- Log pre-fix menunjukkan `/dashboard` juga menerima `tokenPresent: true`, lalu browser tetap kembali ke login.
- Kode pre-fix di interceptor API membaca `localStorage.getItem('token')`, bukan `auth-storage`.
- Kode pre-fix pada handler `401` hanya menghapus `token` dan `user`, bukan `auth-storage`.
- Verifikasi browser setelah fix menunjukkan root `http://localhost:3001/` stabil dan form login tampil normal tanpa redirect loop.

## Status Saat Ini
- Redirect loop tidak lagi teramati pada verifikasi terakhir.
- Login form kembali tampil normal.
- Status debug tetap `[OPEN]` sampai user mengonfirmasi hasil di browser mereka.
