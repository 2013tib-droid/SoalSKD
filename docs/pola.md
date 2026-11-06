# Pola & komponen

Daftar pendek komponen yang sudah ada. Satu baris per item. Claude membaca file ini sebelum membuat komponen baru, supaya tidak membangun ulang hal yang sudah ada.

Format: `path` · fungsi · catatan pakai (props penting, varian)

## Layout

- `web/src/components/ujian/layar-ujian.tsx` · layar ujian: topbar sticky (subtes, nomor, timer), soal, action bar bawah, grid (sheet di HP, panel kanan ≥1024px) · props `paket`, `soal`, `durasiMenit`, `peringatanMenit`, `kritisMenit`

## Komponen

- `web/src/components/hasil/kartu-skor.tsx` · kartu KPI skor (nilai/maks, bar, status ambang ikon + teks) · `utama` untuk kartu total selebar grid
- `web/src/components/hasil/item-pembahasan.tsx` · `<details>` per soal: ringkas (status, subtopik, poin, ragu) lalu opsi + kunci/bobot TKP + pembahasan
- `web/src/components/ujian/kartu-soal.tsx` · teks soal + pilihan A–E (radiogroup) · `terpilih`, `onPilih`, `terkunci`
- `web/src/components/ujian/grid-nomor.tsx` · grid nomor per subtes + legenda jumlah · status belum / dijawab / ragu (ragu juga diberi titik)
- `web/src/components/ujian/timer.tsx` · timer `jj:mm:dd`, status normal / peringatan / kritis lewat `statusTimer()` · ambang dari config
- `web/src/components/ujian/dialog.tsx` · `<dialog>` native, varian `sheet` / `tengah`, Esc + klik backdrop menutup
- `web/src/components/ujian/indikator-simpan.tsx` · status simpan otomatis (tersimpan / gagal)

## Data & state (fetch, tabel, filter, form)

- `schema/paket.schema.json` · bentuk data paket soal; TWK/TIU pakai `kunci`, TKP pakai `bobot`, `pembahasan` berupa objek `{inti, opsi, konsep}` · penjelasan di `docs/skema-soal.md`; jawaban pengguna disimpan per `soal.id`
- `config/skd.json` · format SKD resmi (jumlah soal per subtes, nilai, durasi, ambang batas) untuk app dan ebook · `null` = belum ada sumber resmi
- `web/src/app/ujian/[paket]/hasil/actions.ts` · server action `nilaiUjian(paket, jawaban)`: TWK/TIU pakai `nilaiPilihanTunggal` dari config, TKP pakai bobot opsi, kosong 0
- Filter hasil di URL: `?filter=salah|kosong|ragu&subtes=TWK|TIU|TKP`
- `web/src/lib/soal.ts` · `ambilSoalUjian(paket)` baca `bank/<paket>.json` di server, buang kunci/bobot/pembahasan
- `web/src/config/skd.ts` · format per paket (durasi, ambang timer, passing grade `null` sampai ada sumber resmi)
- `web/src/components/ujian/use-ujian.ts` · state ujian + simpan otomatis ke localStorage (`soalskd:ujian:<paket>`), jam selesai disimpan jadi refresh tidak mengulang timer

## Pola UX (empty / loading / error state, konfirmasi, toast)

- Konfirmasi kumpulkan: sebut jumlah belum + ragu, aksi "Periksa lagi" / "Kumpulkan"
- Toast satu kali saat timer masuk ambang peringatan dan kritis (tidak muncul saat sesi dipulihkan)
- Setelah kumpul (manual atau waktu habis) layar ujian pindah ke `/ujian/<paket>/hasil`; buka ujian yang sudah selesai juga diarahkan ke hasil. "Ulangi" menghapus rekaman.
- Empty state hasil: belum ada jawaban / belum dikumpulkan / filter tanpa hasil (tombol hapus filter)
- Pintasan ujian: A–E / 1–5 pilih, ← → pindah, R ragu-ragu
