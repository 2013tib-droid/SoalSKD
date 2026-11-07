# Pola & komponen

Daftar pendek komponen yang sudah ada. Satu baris per item. Claude membaca file ini sebelum membuat komponen baru, supaya tidak membangun ulang hal yang sudah ada.

Format: `path` · fungsi · catatan pakai (props penting, varian)

## Layout

- `web/src/components/landing/layar-landing.tsx` · landing `/`: nav melayang, hero + pratinjau layar ujian, "Apa itu SKD" (TWK/TIU/TKP bahasa awam dari `BAGIAN_SKD` + catatan passing grade), keunggulan, tagline, cara kerja, "Cara membaca layar ujian" (`PratinjauUjian beranotasi` bernomor 1–6 + `CaraBaca` keterangan & legenda warna grid), contoh soal + pratinjau hasil (dengan cara membaca nilai), kartu harga (tombol beli `TAUTAN_BELI`, nonaktif bila null; tombol coba gratis `PAKET_GRATIS`) dan testimoni (hanya jika diisi di `web/src/config/landing.ts`), FAQ + JSON-LD, CTA penutup · angka dari `bank/` dan `config/skd.json`
- `web/src/components/beranda/layar-beranda.tsx` · beranda: kartu lanjutkan ujian (sesi berjalan), daftar paket dengan aksi sesuai state (Mulai / Lanjutkan / Lihat hasil + Ulangi), riwayat skor · props `paket` dari `daftarPaket()` + `durasiPaket()`
- `web/src/components/akun/ui.tsx` `LayarAkun` · kerangka layar akun satu kolom (max-w-md): tautan kembali, judul, isi · dipakai /aktivasi, gerbang ujian (/masuk & /daftar pakai `KerangkaMasuk`)
- `web/src/components/ujian/layar-ujian.tsx` · layar ujian: topbar sticky (keluar + dialog konfirmasi, subtes, nomor, timer), soal, action bar bawah, grid (sheet di HP, panel kanan ≥1024px) · props `paket`, `soal`, `durasiMenit`, `peringatanMenit`, `kritisMenit`

## Komponen

- `web/src/components/landing/gerak.tsx` · `Muncul` (section naik 32px sekali saat masuk layar) dan `TaglineBertahap` (kata menyala satu per satu saat lewat garis 60% layar) · keduanya mati di `prefers-reduced-motion`
- `web/src/components/landing/contoh-soal.tsx` · `ContohSoal` (satu soal interaktif + pembahasan, pakai `KartuSoal`) dan `PratinjauHasil` (kartu skor ilustrasi)
- `web/src/components/teks-md.tsx` · render Markdown GFM soal/pembahasan (tanpa HTML, italic jadi medium) · `inline` untuk di dalam tombol
- `web/src/components/hasil/kartu-skor.tsx` · kartu KPI skor (nilai/maks, bar, status ambang ikon + teks) · `utama` untuk kartu total selebar grid
- `web/src/components/hasil/item-pembahasan.tsx` · `<details>` per soal: ringkas (status, subtopik, poin, ragu) lalu tiap opsi + alasannya (`pembahasan.opsi`), bobot TKP, inti, konsep, tips, rujukan
- `web/src/components/ujian/kartu-soal.tsx` · teks soal + pilihan A–E (radiogroup) · `terpilih`, `onPilih`, `terkunci`
- `web/src/components/ujian/grid-nomor.tsx` · grid nomor per subtes + legenda jumlah · status belum / dijawab / ragu (ragu juga diberi titik)
- `web/src/components/ujian/timer.tsx` · timer `jj:mm:dd`, status normal / peringatan / kritis lewat `statusTimer()` · ambang dari config
- `web/src/components/ujian/dialog.tsx` · `<dialog>` native, varian `sheet` / `tengah`, Esc + klik backdrop menutup
- `web/src/components/ujian/indikator-simpan.tsx` · status simpan otomatis (tersimpan / gagal)

- `web/src/components/akun/ui.tsx` · `Kolom` (input 48px, teks 16px, label di atas), `KolomSandi` (tombol lihat 44px), `Pesan` (galat/sukses/info, ikon + teks), `TombolGoogle`, `Pemisah`, `Kerangka`, `tombolUtama`/`tombolSekunder`/`tautanTeks`, `tujuanAman(lanjut)`
- `web/src/components/akun/kerangka-masuk.tsx` · `KerangkaMasuk` layar /masuk & /daftar: merek, sakelar segmen (bawa `?lanjut=`), manfaat, pratinjau grid ujian; dua kolom di desktop · props `mode`, `judul`, `keterangan`, `qLanjut`, `sakelar`
- `web/src/components/akun/menu-akun.tsx` · `MenuAkun`: "Masuk" (belum login) atau ikon akun → menu email, Aktivasi kode, Keluar; tidak tampil saat login mati · dipakai nav landing dan header /try-out
- `web/src/components/ujian/gerbang-ujian.tsx` · `GerbangUjian` paket berbayar: minta soal ke server setelah login; status memuat / perlu masuk / belum punya / gagal; login mati = terkunci + tombol penawaran dan paket gratis

## Data & state (fetch, tabel, filter, form)

- `web/src/components/akun/auth.tsx` · `PenyediaAkun` + `useAkun({ wajib })`: status `mati|memuat|keluar|masuk`, `paket` milik, aksi masuk/daftar/Google/keluar/verifikasi/tukarKode, `pesanGalat()` Indonesia · `wajib` = muat Firebase sekarang
- `web/src/config/akses.ts` `paketTerbuka(id)` · paket tanpa login (p01, juga di build statis: paket berbayar terkunci dan soal/kuncinya tidak ditanam). `web/src/lib/akses-server.ts` `cekAksesPaket(paket, idToken)` = satu-satunya keputusan akses di server
- `web/src/lib/sinkron.ts` · localStorage ↔ `users/{uid}/sesi|riwayat`: `kirimRekaman` (jeda 1,5 dtk), `sinkronkanAkun` sekali per login, event `soalskd:sinkron` agar layar membaca ulang
- `functions/src/index.ts` · `redeemActivationCode`, `mayarWebhook`; produk → paket di `PRODUK` · tes: `cd functions && npm run uji`

- `web/src/lib/soal.ts` `daftarPaket()` · ringkasan semua paket skema 1 di `bank/` (judul, status, jumlah per subtes)
- `web/src/lib/riwayat.ts` · riwayat skor di localStorage (`soalskd:riwayat`, maks 50), dicatat sekali per percobaan (`percobaan` = jam selesai sesi) saat halaman hasil dibuka
- `schema/paket.schema.json` · bentuk data paket soal; TWK/TIU pakai `kunci`, TKP pakai `bobot`, `pembahasan` berupa objek `{inti, opsi, konsep}` · penjelasan di `docs/skema-soal.md`; jawaban pengguna disimpan per `soal.id`
- `config/skd.json` · format SKD resmi (jumlah soal per subtes, nilai, durasi, ambang batas) untuk app dan ebook · `null` = belum ada sumber resmi
- `web/src/app/ujian/[paket]/hasil/actions.ts` · server action `nilaiUjian(paket, jawaban)`: TWK/TIU pakai nilai dari `config/skd.json`; ambang batas hanya dibandingkan kalau paket lengkap, TKP pakai bobot opsi, kosong 0
- Filter hasil di URL: `?filter=salah|kosong|ragu&subtes=TWK|TIU|TKP`
- `web/src/lib/soal.ts` · baca `bank/<paket>.json` skema 1 di server; `ambilSoalUjian` tanpa kunci/bobot/pembahasan, `ambilSoalPembahasan` lengkap (kunci TKP = opsi berbobot tertinggi). File tanpa `skema: 1` tidak dimuat
- `web/src/lib/format-skd.ts` · baca `config/skd.json`; `durasiPaket()` skalakan durasi resmi ke jumlah soal paket, atau 1 menit/soal selama `durasi_menit` null
- `web/src/config/skd.ts` · hanya pengaturan app (durasi latihan per soal, ambang timer 10% / 5%). Format SKD ada di `config/skd.json`
- `web/src/components/ujian/use-ujian.ts` · state ujian + simpan otomatis ke localStorage (`soalskd:ujian:<paket>`), jam selesai disimpan jadi refresh tidak mengulang timer
- `ebook/buat-ebook.mjs` · ebook PDF A4 dari satu paket (sampul, daftar isi, soal, kunci, pembahasan); menolak paket yang gagal `tools/validasi.py` · gaya cetak di `ebook/gaya.css`

## Pola UX (empty / loading / error state, konfirmasi, toast)

- Konfirmasi kumpulkan: sebut jumlah belum + ragu, aksi "Periksa lagi" / "Kumpulkan"
- Toast satu kali saat timer masuk ambang peringatan dan kritis (tidak muncul saat sesi dipulihkan)
- Setelah kumpul (manual atau waktu habis) layar ujian pindah ke `/ujian/<paket>/hasil`; buka ujian yang sudah selesai juga diarahkan ke hasil. "Ulangi" menghapus rekaman.
- Empty state hasil: belum ada jawaban / belum dikumpulkan / filter tanpa hasil (tombol hapus filter)
- Pintasan ujian: A–E / 1–5 pilih, ← → pindah, R ragu-ragu
- Paket berbayar terkunci di /try-out digabung jadi satu kartu bundel (nama + harga dari `PENAWARAN`, daftar paket, badge "Berbayar") + tombol sekunder ber-ikon gembok ke /masuk atau /aktivasi (`?lanjut=` kembali); paket yang sudah dimiliki keluar dari bundel jadi kartu biasa
- Galat login/kode: `Pesan jenis="galat"` di atas tombol kirim; login Google dibatalkan = info, bukan galat; "tidak ada" dan "sudah dipakai" satu pesan
- Tautan kembali di header: `caption-4 -ml-2 flex h-11 items-center gap-1 rounded-lg px-2` + `ArrowLeft` 16 · `/try-out` → `/` ("Halaman utama"), hasil → `/try-out` ("Beranda")
