// Build statis (STATIK=1): soal berbayar tidak pernah dibaca, walau berkasnya ada di disk.
// Jalankan dari web/: STATIK=1 node --import ./test/loader.mjs --test test/bank-statik.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ambilSoalPembahasan, ambilSoalUjian } from '@/lib/soal';

test('STATIK=1: paket berbayar tidak dimuat; paket gratis tetap', async () => {
  assert.equal(process.env.STATIK, '1');
  for (const p of ['p02', 'p03', 'p04', 'p05', 'p06', 'p07']) {
    assert.equal(await ambilSoalUjian(p), null, p);
    assert.equal(await ambilSoalPembahasan(p), null, p);
  }
  assert.equal((await ambilSoalUjian('p01'))?.length, 20);
});
