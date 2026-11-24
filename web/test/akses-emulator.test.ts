// Gerbang paket berbayar di server Next.js, melawan Firebase Emulator (Auth, Firestore, Storage).
// Dijalankan oleh functions/test/jalankan.sh (di dalam emulators:exec), dari folder web/:
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-soalskd BANK_BUCKET=demo-soalskd.appspot.com NODE_ENV=production \
//   node --import ./test/loader.mjs --test test/akses-emulator.test.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { muatUjianBerbayar } from '@/app/ujian/[paket]/actions';
import { nilaiUjian } from '@/app/ujian/[paket]/hasil/actions';

const PROJECT = 'demo-soalskd';
const BUCKET = process.env.BANK_BUCKET!;
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const ST = `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${BUCKET}/o`;
assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST, 'harus di emulators:exec');
assert.equal(process.env.NODE_ENV, 'production');

const app = getApps()[0] ?? initializeApp({ projectId: PROJECT });
const db = getFirestore(app);

async function daftar(email: string) {
  const r = await fetch(`${AUTH}/accounts:signUp?key=demo`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'rahasia123', returnSecureToken: true }),
  }).then((x) => x.json());
  await getAuth(app).updateUser(r.localId, { emailVerified: true });
  return { uid: r.localId as string, token: r.idToken as string };
}

// Bank berbayar asli ada di repo privat (tidak tersedia di CI), jadi dibuat paket tiruan
// "p02" dari p01 + satu gambar SVG, lalu disiapkan seperti tools/unggah-bank.sh (SVG ditanam).
const tiruan = mkdtempSync(path.join(tmpdir(), 'bank-tiruan-'));
const p01 = JSON.parse(readFileSync(path.resolve('../bank/p01.json'), 'utf8'));
const p02 = {
  ...p01,
  meta: { ...p01.meta, id: 'p02', judul: 'Paket 02' },
  soal: p01.soal.map((s: { id: string }, i: number) => ({
    ...s,
    id: s.id.replace('p01', 'p02'),
    ...(i === 0 ? { gambar: [{ file: 'gambar/p02-uji.svg', alt: 'gambar uji' }] } : {}),
  })),
};
mkdirSync(path.join(tiruan, 'gambar'));
writeFileSync(path.join(tiruan, 'gambar/p02-uji.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
writeFileSync(path.join(tiruan, 'p02.json'), JSON.stringify(p02));
const JUMLAH = p02.soal.length;
const keluar = mkdtempSync(path.join(tmpdir(), 'bank-privat-'));
execFileSync('python3', ['tools/bank_privat.py', 'siapkan', keluar, tiruan], { cwd: path.resolve('..') });
await getStorage(app).bucket(BUCKET).file('bank/p02.json').save(readFileSync(path.join(keluar, 'p02.json')), { contentType: 'application/json' });

const pemilik = await daftar('pemilik-web@contoh.test');
const bukan = await daftar('bukan-pemilik-web@contoh.test');
await db.doc(`users/${pemilik.uid}`).set({ paket: ['p02', 'p03', 'p04'] });

test('tanpa login → perlu-masuk', async () => {
  assert.deepEqual(await muatUjianBerbayar('p02', null), { status: 'perlu-masuk' });
  assert.deepEqual(await nilaiUjian('p02', {}, null), { status: 'perlu-masuk' });
});

test('token palsu → perlu-masuk', async () => {
  assert.deepEqual(await muatUjianBerbayar('p02', 'bukan.token.sah'), { status: 'perlu-masuk' });
});

test('akun tanpa paket mencoba membuka paket berbayar → belum-punya, tanpa soal', async () => {
  const r = await muatUjianBerbayar('p02', bukan.token);
  assert.deepEqual(r, { status: 'belum-punya' });
  assert.deepEqual(await nilaiUjian('p02', { 'p02-001': 'A' }, bukan.token), { status: 'belum-punya' });
});

test('pemilik Bundel 1 tidak bisa membuka paket Bundel 2', async () => {
  assert.deepEqual(await muatUjianBerbayar('p05', pemilik.token), { status: 'belum-punya' });
});

test('pemilik → soal dari Storage privat, tanpa kunci/pembahasan; gambar figural ikut', async () => {
  const r = await muatUjianBerbayar('p02', pemilik.token);
  assert.equal(r.status, 'ok');
  if (r.status !== 'ok') return;
  assert.equal(r.soal.length, JUMLAH);
  for (const s of r.soal) assert.deepEqual(Object.keys(s).sort(), ['gambar', 'id', 'kategori', 'opsi', 'pertanyaan']);
  assert.ok(r.soal.some((s) => s.gambar.some((g) => g.src.startsWith('data:image/svg+xml;base64,'))));
  assert.equal(r.durasiMenit, JUMLAH);
});

test('pemilik → penilaian di server dengan kunci', async () => {
  const r = await nilaiUjian('p02', {}, pemilik.token);
  assert.equal(r.status, 'ok');
  if (r.status === 'ok') assert.equal(r.hasil.items.length, JUMLAH);
});

test('pemilik paket yang belum diunggah ke Storage → tidak-ada (tidak membaca repo)', async () => {
  assert.deepEqual(await muatUjianBerbayar('p03', pemilik.token), { status: 'tidak-ada' });
});

test('client tidak bisa membaca bank privat di Storage', async () => {
  const r = await fetch(`${ST}/${encodeURIComponent('bank/p02.json')}?alt=media`, { headers: { authorization: `Firebase ${pemilik.token}` } });
  assert.equal(r.status, 403);
  const tanpa = await fetch(`${ST}/${encodeURIComponent('bank/p02.json')}?alt=media`);
  assert.equal(tanpa.status, 403);
});
