// Tes unit web tanpa server: skor, timer, format, katalog, dan gerbang bank berbayar.
// Jalankan dari web/: npm run uji:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hitungHasil } from '@/lib/nilai';
import { ambangTimerMenit } from '@/config/skd';
import { ambilFormatSkd, durasiPaket } from '@/lib/format-skd';
import { ambilJudulPaket, ambilSoalPembahasan, ambilSoalUjian, daftarPaket } from '@/lib/soal';
import { cekAksesPaket } from '@/lib/akses-server';
import { PENJUALAN_DIBUKA, tautanBeli } from '@/config/landing';
import { DEV_BUKA_SEMUA, paketTerbuka } from '@/config/akses';

const format = await ambilFormatSkd();

const soal = (id: string, kategori: 'TWK' | 'TIU' | 'TKP', kunci: string, bobot: Record<string, number> | null = null) => ({
  id, kategori, subtopik: 'x', pertanyaan: 'p', opsi: ['A', 'B', 'C', 'D', 'E'].map((h) => ({ huruf: h, teks: h })),
  gambar: [], kunci, bobot, pembahasan: { inti: '', opsi: {}, konsep: null }, tips: '', rujukan: [],
});

test('skor: TWK/TIU benar, salah, kosong, jawaban asing', () => {
  const s = [soal('a', 'TWK', 'A'), soal('b', 'TWK', 'B'), soal('c', 'TIU', 'C'), soal('d', 'TIU', 'D')];
  const h = hitungHasil(s, 'Uji', format, { a: 'A', b: 'C', d: 'Z' });
  assert.deepEqual(h.items.map((i) => i.status), ['benar', 'salah', 'kosong', 'kosong']);
  assert.equal(h.items[0].poin, format.subtes.TWK.nilaiBenar);
  assert.equal(h.items[1].poin, format.subtes.TWK.nilaiSalah);
  assert.equal(h.total, format.subtes.TWK.nilaiBenar + format.subtes.TWK.nilaiSalah);
});

test('skor: TKP memakai bobot, "benar" hanya untuk bobot tertinggi', () => {
  const s = [soal('t1', 'TKP', 'A', { A: 5, B: 4, C: 3, D: 2, E: 1 }), soal('t2', 'TKP', 'A', { A: 5, B: 4, C: 3, D: 2, E: 1 })];
  const h = hitungHasil(s, 'Uji', format, { t1: 'B' });
  assert.equal(h.items[0].poin, 4);
  assert.equal(h.items[0].status, 'salah');
  assert.equal(h.items[1].status, 'kosong');
  assert.equal(h.perSubtes[0].maks, 10);
});

test('skor: paket mini tidak dibandingkan ambang batas', () => {
  const h = hitungHasil([soal('a', 'TWK', 'A')], 'Uji', format, { a: 'A' });
  assert.equal(h.paketLengkap, false);
  assert.equal(h.lulusSemua, null);
});

test('timer: durasi paket lengkap dari config, paket mini 1 menit per soal, ambang peringatan', () => {
  const lengkap = Object.values(format.subtes).reduce((n, s) => n + s.jumlahSoal, 0);
  assert.equal(durasiPaket(format, 20), 20);
  assert.ok(durasiPaket(format, lengkap) > 0);
  const a = ambangTimerMenit(100);
  assert.ok(a.peringatanMenit > a.kritisMenit && a.kritisMenit > 0);
});

test('katalog: daftar paket dan judul tanpa membaca soal berbayar', async () => {
  const d = await daftarPaket();
  assert.deepEqual(d.map((p) => p.id), ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07']);
  assert.equal(d.find((p) => p.id === 'p02')?.jumlahSoal, 110);
  assert.equal(await ambilJudulPaket('p05'), 'Paket 05');
});

test('soal gratis untuk ujian tidak membawa kunci/bobot/pembahasan', async () => {
  const s = await ambilSoalUjian('p01');
  assert.ok(s && s.length === 20);
  for (const x of s) {
    assert.deepEqual(Object.keys(x).sort(), ['gambar', 'id', 'kategori', 'opsi', 'pertanyaan']);
  }
  const p = await ambilSoalPembahasan('p01');
  assert.ok(p?.every((x) => typeof x.kunci === 'string' && x.kunci.length === 1));
});

test('gerbang: paket berbayar tertutup tanpa Firebase (gagal aman)', async () => {
  assert.deepEqual(await cekAksesPaket('p02', null), { ok: false, alasan: 'belum-dibuka' });
  assert.deepEqual(await cekAksesPaket('p01', null), { ok: true });
});

test('saklar: DEV_BUKA_SEMUA mati, paket berbayar tidak terbuka, penjualan belum dibuka', () => {
  assert.equal(DEV_BUKA_SEMUA, false);
  assert.equal(paketTerbuka('p02'), false);
  assert.equal(PENJUALAN_DIBUKA['bundel-3to'], false);
  assert.equal(tautanBeli('bundel-3to'), null);
});
