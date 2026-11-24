// Server produksi tanpa Storage/BANK_PRIVAT_DIR: paket berbayar "belum tersedia",
// TIDAK dibaca dari bank/ di repo. Jalankan: NODE_ENV=production node --import ./test/loader.mjs --test test/bank-produksi.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ambilSoalUjian } from '@/lib/soal';

test('produksi tanpa sumber privat: soal berbayar tidak dibaca dari repo', async () => {
  assert.equal(process.env.NODE_ENV, 'production');
  assert.equal(await ambilSoalUjian('p02'), null);
  assert.equal((await ambilSoalUjian('p01'))?.length, 20);
});
