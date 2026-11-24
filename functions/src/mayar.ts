/**
 * Klien kecil Mayar Headless API V2 (docs.mayar.id/api-reference-v2), hanya dua
 * endpoint yang dipakai:
 *   POST /payments/create      Single Payment Request (checkout dinamis per pesanan)
 *   GET  /transactions/{id}    Detail transaksi (sumber kebenaran status bayar)
 *
 * API key (Bearer) hanya ada di Secret Manager dan hanya dipakai di sini, di server.
 * Batas Mayar: 50 permintaan/menit per API key (docs: API Rate Limit).
 */

export class GalatMayar extends Error {
  constructor(
    readonly status: number,
    readonly pesanServer: string,
    /** Layak dicoba lagi (jaringan, 429, 5xx). */
    readonly sementara: boolean,
  ) {
    super(`Mayar ${status}: ${pesanServer}`);
  }
}

const BATAS_WAKTU_MS = 10_000;

async function panggil(base: string, kunci: string, jalur: string, init: RequestInit = {}): Promise<unknown> {
  let r: Response;
  try {
    r = await fetch(`${base.replace(/\/+$/, '')}${jalur}`, {
      ...init,
      headers: { authorization: `Bearer ${kunci}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });
  } catch (e) {
    throw new GalatMayar(0, (e as Error).name || 'jaringan', true);
  }
  let json: unknown = null;
  try {
    json = await r.json();
  } catch {
    // Respons bukan JSON: ditangani lewat status HTTP di bawah.
  }
  const env = (json && typeof json === 'object' ? json : {}) as { statusCode?: unknown; messages?: unknown; message?: unknown; data?: unknown };
  const kode = typeof env.statusCode === 'number' ? env.statusCode : r.status;
  const pesan = String(env.messages ?? env.message ?? r.statusText ?? '').slice(0, 200);
  if (!r.ok || kode >= 400) throw new GalatMayar(kode, pesan, kode === 429 || kode >= 500 || kode === 0);
  return env.data;
}

export type PermintaanBayar = {
  name: string;
  amount: number;
  email?: string;
  description?: string;
  redirectUrl?: string;
  expiredAt?: string;
  extraData?: Record<string, string>;
};

export type HasilPermintaan = { id: string; transactionId: string; link: string };

const PESAN_REDIRECT_DITOLAK = /redirectUrl is not supported/i;

/**
 * Membuat Single Payment Request. Docs: bila `redirectUrl` tidak bisa disimpan,
 * Mayar menolak dengan 400 "redirectUrl is not supported…". Saat itu terjadi,
 * permintaan diulang sekali tanpa `redirectUrl` (pembeli kembali sendiri ke situs).
 */
export async function buatPermintaanBayar(base: string, kunci: string, body: PermintaanBayar): Promise<HasilPermintaan> {
  let data: unknown;
  try {
    data = await panggil(base, kunci, '/payments/create', { method: 'POST', body: JSON.stringify(body) });
  } catch (e) {
    if (!(e instanceof GalatMayar) || e.status !== 400 || !body.redirectUrl || !PESAN_REDIRECT_DITOLAK.test(e.pesanServer)) throw e;
    const { redirectUrl: _abaikan, ...tanpaRedirect } = body;
    data = await panggil(base, kunci, '/payments/create', { method: 'POST', body: JSON.stringify(tanpaRedirect) });
  }
  const d = (data ?? {}) as Record<string, unknown>;
  const id = typeof d.id === 'string' ? d.id : '';
  const transactionId = typeof d.transactionId === 'string' ? d.transactionId : '';
  const link = typeof d.link === 'string' ? d.link : '';
  if (!id || !transactionId || !/^https:\/\//.test(link)) throw new GalatMayar(502, 'respons-buat-tidak-lengkap', false);
  return { id, transactionId, link };
}

/** Detail transaksi; null bila Mayar menjawab 404 (transaksi tidak ada). */
export async function ambilTransaksi(base: string, kunci: string, id: string): Promise<unknown | null> {
  try {
    return await panggil(base, kunci, `/transactions/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof GalatMayar && e.status === 404) return null;
    throw e;
  }
}

/** Detail Single Payment Request (`GET /payments/{id}`); null bila 404. Field `status` mis. "unpaid". */
export async function ambilPermintaanBayar(base: string, kunci: string, id: string): Promise<unknown | null> {
  try {
    return await panggil(base, kunci, `/payments/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof GalatMayar && e.status === 404) return null;
    throw e;
  }
}
