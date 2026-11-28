# Pola & komponen

Daftar pendek komponen yang sudah ada. Satu baris per item. Claude membaca file ini sebelum membuat komponen baru, supaya tidak membangun ulang hal yang sudah ada.

Format: `path` · fungsi · catatan pakai (props penting, varian)

## Layout

- `web/src/components/landing/layar-landing.tsx` · landing `/` gaya promo: header (`Logo` kotak biru + nama, tautan bagian ≥768px, Masuk + CTA), hero bercahaya + `PratinjauUjian tanpaBingkai` di bingkai HP + `Kilau` (tombol kedua ke paket gratis), strip angka (dari `bank/`), kartu harga per bundel (`PENAWARAN` di `web/src/config/landing.ts`, kosong = disembunyikan) + `FITUR_BUNDEL` sekali di bawahnya, kartu masalah → solusi, 4 kartu keunggulan berikon berwarna, garis langkah cara kerja, "Apa itu SKD", testimoni (hanya jika diisi), banner CTA biru dengan harga per bundel, lalu FAQ + JSON-LD · angka dari `bank/` dan `config/skd.json`
- `web/src/components/beranda/layar-beranda.tsx` · beranda: kartu lanjutkan ujian (sesi berjalan), daftar paket dengan aksi sesuai state (Mulai / Lanjutkan / Lihat hasil + Ulangi), riwayat skor · props `paket` dari `daftarPaket()` + `durasiPaket()`
- `web/src/components/akun/ui.tsx` `LayarAkun` · kerangka layar akun satu kolom (max-w-md): tautan kembali, judul, isi · dipakai /aktivasi, gerbang ujian (/masuk & /daftar pakai `KerangkaMasuk`)
- `web/src/components/legal/layar-legal.tsx` `LayarLegal` · halaman teks panjang (server component, tanpa Firebase): `max-w-prose`, `body-5`, daftar isi anchor dari judul `##`, tabel bergulir di dalam kartu, tautan internal lewat `Link` (basePath) · isi dari `web/src/konten/<nama>.md` lewat `muatHalamanLegal()` (`web/src/lib/legal.ts`), penanda `{{...}}` diganti dari `web/src/config/legal.ts`; dipakai /privasi, /syarat
- `web/src/components/ujian/layar-ujian.tsx` · layar ujian: topbar sticky (keluar + dialog konfirmasi, subtes, nomor, timer), soal, action bar bawah, grid (sheet di HP, panel kanan ≥1024px) · props `paket`, `soal`, `durasiMenit`, `peringatanMenit`, `kritisMenit`

## Komponen

- `web/src/components/tombol.ts` · kelas tombol satu sumber: `tombolUtama`, `tombolSekunder`, `tombolNonaktif` (aksi belum bisa dipakai, mis. "Pembelian segera dibuka"), `tombolDasar`, `tombolBesar(kelas)` untuk landing (teks 16px) · modul biasa, bisa dipakai server component; `akun/ui.tsx` menambah `w-full`
- `web/src/components/landing/gerak.tsx` · `Muncul` (pembungkus section landing, isi selalu terlihat, tanpa animasi masuk) dan `TaglineBertahap` (kata menyala satu per satu saat lewat garis 60% layar, belum dipakai, mati di `prefers-reduced-motion`)
- `web/src/components/panduan/panduan-ujian.tsx` · `PratinjauUjian` (layar ujian statis dari soal bank, opsi `beranotasi`/`tanpaBingkai`), `CaraBaca` (keterangan bernomor), `PanduanUjian` (`<details>` "Cara membaca layar ujian" di /try-out, dirender server lalu jadi slot `panduan` di `LayarBeranda`), `PratinjauHasil` (contoh halaman hasil di landing, angka dari rasio ilustrasi × nilai maks config, selalu berlabel "Contoh hasil try out · angka ilustrasi"), `BAGIAN_SKD`
- `web/src/components/gambar-soal.tsx` · `GambarSoal` gambar TIU figural (SVG bank sebagai data URI, ikut gerbang paket) di bawah teks soal, di layar ujian dan pembahasan · SVG dibuat `tools/buat_figural.py`
- `web/src/components/teks-md.tsx` · render Markdown GFM soal/pembahasan (tanpa HTML, italic jadi medium, satu baris baru = `<br>` seperti ebook) · `inline` untuk di dalam tombol
- `web/src/components/hasil/kartu-skor.tsx` · kartu KPI skor (nilai/maks, bar, status ambang ikon + teks) · `utama` untuk kartu total selebar grid
- `web/src/components/hasil/item-pembahasan.tsx` · `<details>` per soal: ringkas (status, subtopik, poin, ragu) lalu tiap opsi + alasannya (`pembahasan.opsi`), bobot TKP, inti, konsep, tips, rujukan
- `web/src/components/ujian/kartu-soal.tsx` · teks soal + pilihan A–E (radiogroup) · `terpilih`, `onPilih`, `terkunci`
- `web/src/components/ujian/grid-nomor.tsx` · grid nomor per subtes + legenda jumlah · status belum / dijawab / ragu (ragu juga diberi titik)
- `web/src/components/ujian/timer.tsx` · timer `jj:mm:dd`, status normal / peringatan / kritis lewat `statusTimer()` · ambang dari config
- `web/src/components/ujian/dialog.tsx` · `<dialog>` native, varian `sheet` / `tengah`, Esc + klik backdrop menutup, id judul unik (`useId`) karena beberapa dialog ada di DOM sekaligus
- `web/src/components/ujian/indikator-simpan.tsx` · status simpan otomatis (tersimpan / gagal)

- `web/src/components/akun/ui.tsx` · `Kolom` (input 48px, teks 16px, label di atas), `KolomSandi` (tombol lihat 44px), `Pesan` (galat/sukses/info, ikon + teks), `TombolGoogle`, `Pemisah`, `Kerangka`, `tombolUtama`/`tombolSekunder`/`tautanTeks`, `tujuanAman(lanjut)`
- `web/src/components/akun/kerangka-masuk.tsx` · `KerangkaMasuk` layar /masuk & /daftar: merek, sakelar segmen (bawa `?lanjut=`), manfaat, pratinjau grid ujian; dua kolom di desktop · props `mode`, `judul`, `keterangan`, `qLanjut`, `sakelar`
- `web/src/components/akun/menu-akun.tsx` · `MenuAkun`: "Masuk" (belum login) atau ikon akun → menu email, Aktivasi kode, Keluar; tidak tampil saat login mati · dipakai nav landing dan header /try-out
- `web/src/components/beranda/kartu-ebook.tsx` · `KartuEbook` di daftar paket /try-out: satu kartu per edisi yang dimiliki (`edisiMilik(akun.paket)`, `EBOOK_EDISI` di `web/src/config/akses.ts`), tombol sekunder `DownloadSimple` → `akun.unduhEbook(edisi)` (signed URL dari function `unduhEbook`, hak edisi dicek server), state memuat / galat / info per kartu; build statis dibuang dari bundel lewat `process.env.STATIK !== "1"` di pemanggil
- `web/src/components/ujian/gerbang-ujian.tsx` · `GerbangUjian` paket berbayar: minta soal ke server setelah login; status memuat / perlu masuk / belum punya / gagal; login mati = terkunci + tombol penawaran dan paket gratis

## Data & state (fetch, tabel, filter, form)

- `web/src/components/akun/auth.tsx` · `PenyediaAkun` + `useAkun({ wajib })`: status `mati|memuat|keluar|masuk`, `paket` milik, aksi masuk/daftar/Google/keluar/verifikasi/tukarKode, `pesanGalat()` Indonesia · `wajib` = muat Firebase sekarang
- `web/src/config/akses.ts` `paketTerbuka(id)` · paket tanpa login (p01, juga di build statis: paket berbayar terkunci dan soal/kuncinya tidak ditanam). `web/src/lib/akses-server.ts` `cekAksesPaket(paket, idToken)` = satu-satunya keputusan akses di server
- `web/src/lib/sinkron.ts` · localStorage ↔ `users/{uid}/sesi|riwayat`: `kirimRekaman` (jeda 1,5 dtk), `sinkronkanAkun` sekali per login, event `soalskd:sinkron` agar layar membaca ulang
- `functions/src/index.ts` · `redeemActivationCode`, `mayarWebhook`, `unduhEbook({ edisi })` (file berbayar: Storage privat + signed URL berumur pendek, hak dari `users/{uid}.paket`) · produk, paket, edisi ebook, dan `produkDariNama` di `functions/src/produk.ts` (modul murni) · tes: `cd functions && npm run uji` (unit `test/produk.mjs` + emulator)
- `web/src/config/produk.ts` `PRODUK` · cermin produk functions (nama bundel, paket, label paket, edisi) untuk tampilan; `produkDariPaket(id)`. Ubah bersamaan dengan `functions/src/produk.ts`

- `web/src/lib/soal.ts` `daftarPaket()` · ringkasan semua paket dari `bank/katalog.json` (judul, status, jumlah per subtes; dibuat `tools/bank_privat.py katalog`), tanpa membaca soal
- `web/src/lib/riwayat.ts` · riwayat skor di localStorage (`soalskd:riwayat`, maks 50), dicatat sekali per percobaan (`percobaan` = jam selesai sesi) saat halaman hasil dibuka
- `schema/paket.schema.json` · bentuk data paket soal; TWK/TIU pakai `kunci`, TKP pakai `bobot`, `pembahasan` berupa objek `{inti, opsi, konsep}` · penjelasan di `docs/skema-soal.md`; jawaban pengguna disimpan per `soal.id`
- `config/skd.json` · format SKD resmi (jumlah soal per subtes, nilai, durasi, ambang batas) untuk app dan ebook · `null` = belum ada sumber resmi
- `web/src/app/ujian/[paket]/hasil/actions.ts` · server action `nilaiUjian(paket, jawaban)`: TWK/TIU pakai nilai dari `config/skd.json`; ambang batas hanya dibandingkan kalau paket lengkap, TKP pakai bobot opsi, kosong 0
- Filter hasil di URL: `?filter=salah|kosong|ragu&subtes=TWK|TIU|TKP`
- `web/src/lib/soal.ts` · paket gratis dari `bank/<paket>.json`, paket berbayar dari `lib/bank-privat.ts` (BANK_PRIVAT_DIR → Storage privat `bank/<id>.json` → dev: repo), tidak pernah di build statis; `ambilSoalUjian` tanpa kunci/bobot/pembahasan, `ambilSoalPembahasan` lengkap (kunci TKP = opsi berbobot tertinggi). File tanpa `skema: 1` tidak dimuat
- `web/src/lib/format-skd.ts` · baca `config/skd.json`; `durasiPaket()` skalakan durasi resmi ke jumlah soal paket, atau 1 menit/soal selama `durasi_menit` null
- `web/src/config/skd.ts` · hanya pengaturan app (durasi latihan per soal, ambang timer 10% / 5%). Format SKD ada di `config/skd.json`
- `web/src/components/ujian/use-ujian.ts` · state ujian + simpan otomatis ke localStorage (`soalskd:ujian:<paket>`), jam selesai disimpan jadi refresh tidak mengulang timer
- `ebook/buat-ebook.mjs` · ebook PDF A4 dari satu paket (sampul, daftar isi, soal, kunci, pembahasan); menolak paket yang gagal `tools/validasi.py` · gaya cetak di `ebook/gaya.css`

## Pola UX (empty / loading / error state, konfirmasi, toast)

- Konfirmasi kumpulkan: sebut jumlah belum + ragu, aksi "Periksa lagi" / "Kumpulkan"
- Toast satu kali saat timer masuk ambang peringatan dan kritis (tidak muncul saat sesi dipulihkan)
- Setelah kumpul (manual atau waktu habis) layar ujian pindah ke `/ujian/<paket>/hasil`; buka ujian yang sudah selesai juga diarahkan ke hasil. "Ulangi" menghapus rekaman.
- Empty state hasil: belum ada jawaban / belum dikumpulkan / filter tanpa hasil (tombol hapus filter)
- Urutan halaman hasil: skor total → per subtes → catatan ambang → `Ringkasan` (benar/salah/kosong/ragu + subtes berpersentase terendah dengan tombol yang memasang `?subtes=&filter=salah|kosong`) → pembahasan → "Langkah berikutnya" (paket lain / simulasi lengkap + Ulangi)
- Chip status kartu paket di /try-out (`caption-4 rounded-full`): jenis `Gratis` (biru muda) + `Paket mini` / `Simulasi lengkap`, lalu `Sudah dimiliki` / `Sedang dikerjakan` (ikon jam) / `Selesai` (ikon centang); kartu bundel `Terkunci` (ikon gembok). Status bank (`draf`/`review`) tidak pernah tampil ke pengguna
- Pintasan ujian: A–E / 1–5 pilih, ← → pindah, R ragu-ragu
- Paket berbayar terkunci di /try-out dikelompokkan per bundel (`produkDariPaket`): satu kartu per bundel (nama dari `PRODUK`, harga dari `penawaranUntuk()`, daftar paket, chip "Terkunci") + tombol beli (`tautanBeli(bundel)` → `/beli?produk=`, `PENJUALAN_DIBUKA` false = nonaktif "Pembelian segera dibuka") dan tombol sekunder ber-ikon gembok ke /masuk atau /akun ("Sudah bayar? Cek status"); paket yang sudah dimiliki keluar dari kartu bundel jadi kartu biasa
- Galat login/kode: `Pesan jenis="galat"` di atas tombol kirim; login Google dibatalkan = info, bukan galat; "tidak ada" dan "sudah dipakai" satu pesan
- Tautan kembali di header: `caption-4 -ml-2 flex h-11 items-center gap-1 rounded-lg px-2` + `ArrowLeft` 16 · `/try-out` → `/` ("Halaman utama"), hasil dan gerbang ujian → `/try-out` ("Daftar try out")
- `web/src/components/akun/status-pembelian.tsx` · `KartuPembelian` (status pesanan + "Lanjutkan pembayaran" + "Cek Status Pembayaran" berjeda 5 detik, `otomatis` = cek sekali saat kembali dari Mayar) dan `ChipStatus` (menunggu / sedang diverifikasi / aktif / kedaluwarsa / gagal / dicabut); status hanya dari jawaban server
- Checkout: `/beli?produk=` → belum login: ringkasan + Google diutamakan + "Masuk dengan email"; email belum terverifikasi: kartu verifikasi; sudah punya: "sudah aktif"; siap: `LangkahBayar` + tombol "Bayar Rp…" (ulang otomatis bila server menjawab `aborted`)
- `/akun` · urutan: Status pembayaran (`?pesanan=`) → Paket saya → Lanjutkan try out (sesi lokal belum selesai) → Ebook → Riwayat pembelian → Bantuan pembelian (`<details>`) → Keluar
- `functions/src/pembayaran.ts` · keputusan bayar murni: `nilaiTransaksi` (lunas hanya bila status "paid" + id/nominal/produk/orderId cocok), `statusBerikut` (monoton: aktif/dicabut/gagal tidak berubah otomatis)
- `functions/scripts/admin.mjs` · alat admin pemilik: `kode`, `cari`, `cabut-pesanan`, `cabut-kode` (tanpa endpoint publik)
- `web/scripts/cek-bocor.mjs` · gagal bila id/teks/pembahasan/SVG paket berbayar ada di `out/` atau `.next/static`
