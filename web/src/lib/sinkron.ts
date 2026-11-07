/**
 * Sinkron data ujian ke akun (Firestore). localStorage tetap tempat kerja utama:
 * layar ujian tidak pernah menunggu jaringan, dan kegagalan jaringan tidak sampai
 * ke layar. Saat login, data di Firestore menjadi cadangan dan jembatan antarperangkat.
 *
 *   users/{uid}/sesi/{paket}        = isi `soalskd:ujian:<paket>` (Rekaman)
 *   users/{uid}/riwayat/{paket-n}   = satu entri `soalskd:riwayat`
 *
 * Aturan gabung: per paket ambil rekaman yang lebih baru (`disimpanPada`), kecuali
 * salah satunya kosong (belum ada jawaban); riwayat = gabungan keduanya. Data lokal
 * sebelum login ikut dipindah ke akun pada login pertama.
 */
import { bacaRekaman, kunciPenyimpanan, type Rekaman } from "@/components/ujian/use-ujian";
import { ambilFirebase } from "@/lib/firebase/klien";
import { bacaRiwayat, tulisRiwayat, KUNCI_RIWAYAT, type EntriRiwayat } from "@/lib/riwayat";

/** Dikirim ke window setelah data lokal diperbarui dari akun; layar membaca ulang. */
export const EVENT_SINKRON = "soalskd:sinkron";

const PREFIX_UJIAN = kunciPenyimpanan("");
const JEDA_KIRIM_MS = 1500;

let uidAktif: string | null = null;
const antrean = new Map<string, Rekaman>();
let pewaktu: ReturnType<typeof setTimeout> | null = null;
let gagalTerakhir = false;

export function aturUidSinkron(uid: string | null) {
  if (uid !== uidAktif) antrean.clear();
  uidAktif = uid;
}

export const adaAkunSinkron = () => uidAktif !== null;

/** Antrekan rekaman untuk dikirim ke akun (dikumpulkan 1,5 detik). Tanpa login: tidak apa-apa. */
export function kirimRekaman(paket: string, r: Rekaman) {
  if (!uidAktif) return;
  antrean.set(paket, r);
  if (pewaktu) clearTimeout(pewaktu);
  pewaktu = setTimeout(() => void kirimAntrean(), JEDA_KIRIM_MS);
}

/** Kirim semua yang mengantre. true = semua terkirim (atau tidak ada yang perlu dikirim). */
export async function kirimAntrean(): Promise<boolean> {
  if (pewaktu) clearTimeout(pewaktu);
  pewaktu = null;
  const uid = uidAktif;
  if (!uid || antrean.size === 0) return !gagalTerakhir;
  const isi = [...antrean.entries()];
  antrean.clear();
  try {
    const [{ db }, { doc, setDoc }] = await Promise.all([ambilFirebase(), import("firebase/firestore/lite")]);
    await Promise.all(isi.map(([paket, r]) => setDoc(doc(db, "users", uid, "sesi", paket), bentukRekaman(r))));
    gagalTerakhir = false;
    return true;
  } catch {
    // Kembalikan ke antrean (kecuali sudah ada yang lebih baru), coba lagi nanti.
    for (const [paket, r] of isi) if (!antrean.has(paket)) antrean.set(paket, r);
    gagalTerakhir = true;
    pewaktu = setTimeout(() => void kirimAntrean(), 15_000);
    return false;
  }
}

/** "Ulangi": sesi lama juga dihapus dari akun, supaya tidak dipulihkan lagi saat sinkron. */
export function hapusRekamanAkun(paket: string) {
  antrean.delete(paket);
  const uid = uidAktif;
  if (!uid) return;
  void (async () => {
    try {
      const [{ db }, { deleteDoc, doc }] = await Promise.all([ambilFirebase(), import("firebase/firestore/lite")]);
      await deleteDoc(doc(db, "users", uid, "sesi", paket));
    } catch {}
  })();
}

export function kirimRiwayat(entri: EntriRiwayat) {
  const uid = uidAktif;
  if (!uid) return;
  void (async () => {
    try {
      const [{ db }, { doc, setDoc }] = await Promise.all([ambilFirebase(), import("firebase/firestore/lite")]);
      await setDoc(doc(db, "users", uid, "riwayat", idRiwayat(entri)), bentukRiwayat(entri));
    } catch {
      // Tercatat lokal; ikut terkirim saat sinkron berikutnya.
    }
  })();
}

const idRiwayat = (e: EntriRiwayat) => `${e.paket}-${Math.round(e.percobaan)}`;

// Hanya field yang diizinkan firestore.rules.
const bentukRekaman = (r: Rekaman): Rekaman => ({
  jawaban: r.jawaban,
  ragu: r.ragu,
  indeks: Math.round(r.indeks),
  berakhirPada: r.berakhirPada,
  selesai: r.selesai,
  disimpanPada: r.disimpanPada,
});
const bentukRiwayat = (e: EntriRiwayat): EntriRiwayat => ({
  paket: e.paket,
  judul: e.judul,
  total: e.total,
  totalMaks: e.totalMaks,
  perSubtes: e.perSubtes.map(({ subtes, skor, maks }) => ({ subtes, skor, maks })),
  percobaan: e.percobaan,
  dicatatPada: e.dicatatPada,
});

const kosong = (r: Rekaman) => !r.selesai && Object.values(r.jawaban).every((j) => !j);

/** Rekaman yang dipakai saat lokal dan akun berbeda. */
export function pilihRekaman(lokal: Rekaman | null, akun: Rekaman | null): Rekaman | null {
  if (!lokal || !akun) return lokal ?? akun;
  if (kosong(lokal) !== kosong(akun)) return kosong(lokal) ? akun : lokal;
  return lokal.disimpanPada >= akun.disimpanPada ? lokal : akun;
}

function paketLokal(): string[] {
  const hasil: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX_UJIAN)) hasil.push(k.slice(PREFIX_UJIAN.length));
    }
  } catch {}
  return hasil;
}

/**
 * Gabungkan data perangkat dan akun, sekali per login. Lokal yang menang dikirim ke akun
 * (memindahkan data sebelum login), akun yang menang ditulis ke lokal (ganti perangkat).
 */
export async function sinkronkanAkun(uid: string): Promise<void> {
  const [{ db }, { collection, doc, getDocs, setDoc }] = await Promise.all([
    ambilFirebase(),
    import("firebase/firestore/lite"),
  ]);
  const [snapSesi, snapRiwayat] = await Promise.all([
    getDocs(collection(db, "users", uid, "sesi")),
    getDocs(collection(db, "users", uid, "riwayat")),
  ]);
  if (uidAktif !== uid) return; // keburu keluar

  const akunSesi = new Map(snapSesi.docs.map((d) => [d.id, d.data() as Rekaman]));
  const kirim: Promise<unknown>[] = [];
  let berubah = false;
  for (const paket of new Set([...paketLokal(), ...akunSesi.keys()])) {
    const lokal = bacaRekaman(paket);
    const akun = akunSesi.get(paket) ?? null;
    const menang = pilihRekaman(lokal, akun);
    if (!menang) continue;
    if (menang !== lokal) {
      try {
        localStorage.setItem(kunciPenyimpanan(paket), JSON.stringify(menang));
        berubah = true;
      } catch {}
    }
    if (menang !== akun && /^[a-z0-9-]{1,40}$/.test(paket)) {
      kirim.push(setDoc(doc(db, "users", uid, "sesi", paket), bentukRekaman(menang)));
    }
  }

  const lokalRiwayat = bacaRiwayat();
  const idLokal = new Set(lokalRiwayat.map(idRiwayat));
  const akunRiwayat = snapRiwayat.docs.map((d) => d.data() as EntriRiwayat);
  const idAkun = new Set(snapRiwayat.docs.map((d) => d.id));
  const baruDariAkun = akunRiwayat.filter((e) => !idLokal.has(idRiwayat(e)));
  if (baruDariAkun.length > 0) {
    tulisRiwayat([...lokalRiwayat, ...baruDariAkun]);
    berubah = true;
  }
  for (const e of lokalRiwayat) {
    if (!idAkun.has(idRiwayat(e))) kirim.push(setDoc(doc(db, "users", uid, "riwayat", idRiwayat(e)), bentukRiwayat(e)));
  }

  await Promise.allSettled(kirim);
  if (berubah) window.dispatchEvent(new Event(EVENT_SINKRON));
}

/** Setelah keluar: hapus jawaban dan riwayat dari perangkat (sudah ada di akun). */
export function hapusDataLokal() {
  try {
    for (const paket of paketLokal()) localStorage.removeItem(kunciPenyimpanan(paket));
    localStorage.removeItem(KUNCI_RIWAYAT);
  } catch {}
  window.dispatchEvent(new Event(EVENT_SINKRON));
}
