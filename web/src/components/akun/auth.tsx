"use client";

import type { User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ambilFirebase, LOGIN_AKTIF } from "@/lib/firebase/klien";
import { aturUidSinkron, hapusDataLokal, kirimAntrean, sinkronkanAkun } from "@/lib/sinkron";

/**
 * mati    : build statis / env Firebase kosong. Tombol Masuk tidak tampil, paket berbayar tertutup.
 * memuat  : status login belum diketahui.
 * keluar  : belum login.
 * masuk   : login; `paket` = paket yang dimiliki (null selama dibaca).
 */
export type StatusAkun = "mati" | "memuat" | "keluar" | "masuk";

export type InfoPengguna = {
  uid: string;
  email: string | null;
  /** Akun email + sandi yang belum klik tautan verifikasi. Google selalu terverifikasi. */
  perluVerifikasi: boolean;
};

type NilaiAkun = {
  status: StatusAkun;
  pengguna: InfoPengguna | null;
  paket: string[] | null;
  /** Muat Firebase sekarang (halaman yang butuh status login pasti). */
  aktifkan: () => void;
  masuk: (email: string, sandi: string) => Promise<void>;
  daftar: (email: string, sandi: string) => Promise<void>;
  /** Pop-up Google; kalau pop-up diblokir, pindah halaman ke Google (halaman ini ditinggalkan). */
  masukGoogle: () => Promise<void>;
  keluar: () => Promise<void>;
  lupaSandi: (email: string) => Promise<void>;
  kirimVerifikasi: () => Promise<void>;
  /** Tanya ulang server apakah email sudah diverifikasi. */
  cekVerifikasi: () => Promise<boolean>;
  ambilToken: () => Promise<string | null>;
  tukarKode: (kode: string) => Promise<{ paket: string[]; sudah: boolean }>;
  /** Galat dari alur pindah-halaman Google, ditampilkan di /masuk. */
  galatGoogle: string | null;
};

/** Penanda "perangkat ini pernah login": tanpa ini SDK Firebase tidak dimuat di landing. */
const KUNCI_PERNAH_MASUK = "soalskd:pernah-masuk";
const KUNCI_GOOGLE_REDIRECT = "soalskd:google-redirect";

function baca(k: string, s: Storage | undefined) {
  try {
    return s?.getItem(k) ?? null;
  } catch {
    return null;
  }
}
function tulis(k: string, v: string | null, s: Storage | undefined) {
  try {
    if (v === null) s?.removeItem(k);
    else s?.setItem(k, v);
  } catch {}
}

const Konteks = createContext<NilaiAkun | null>(null);

const infoDari = (u: User): InfoPengguna => ({
  uid: u.uid,
  email: u.email,
  perluVerifikasi: !u.emailVerified && u.providerData.some((p) => p.providerId === "password"),
});

export function PenyediaAkun({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusAkun>(LOGIN_AKTIF ? "memuat" : "mati");
  const [pengguna, setPengguna] = useState<InfoPengguna | null>(null);
  const [paket, setPaket] = useState<string[] | null>(null);
  const [perlu, setPerlu] = useState(false);
  const [galatGoogle, setGalatGoogle] = useState<string | null>(null);
  const sudahSinkron = useRef<string | null>(null);

  const muatPaket = useCallback(async (uid: string) => {
    const [{ db }, { doc, getDoc }] = await Promise.all([ambilFirebase(), import("firebase/firestore/lite")]);
    const data = (await getDoc(doc(db, "users", uid))).data();
    const milik = Array.isArray(data?.paket) ? (data.paket as unknown[]).filter((p): p is string => typeof p === "string") : [];
    setPaket(milik);
    return milik;
  }, []);

  useEffect(() => {
    if (!LOGIN_AKTIF) return;
    const pernah = baca(KUNCI_PERNAH_MASUK, globalThis.localStorage) === "1";
    const kembaliDariGoogle = baca(KUNCI_GOOGLE_REDIRECT, globalThis.sessionStorage) === "1";
    if (!pernah && !kembaliDariGoogle && !perlu) {
      setStatus("keluar");
      return;
    }
    let batal = false;
    let lepas: (() => void) | undefined;
    void (async () => {
      try {
        const [{ auth }, mod] = await Promise.all([ambilFirebase(), import("firebase/auth")]);
        if (kembaliDariGoogle) {
          tulis(KUNCI_GOOGLE_REDIRECT, null, globalThis.sessionStorage);
          await mod.getRedirectResult(auth).catch((e) => setGalatGoogle(pesanGalat(e)));
        }
        if (batal) return;
        lepas = mod.onAuthStateChanged(auth, (u) => {
          aturUidSinkron(u?.uid ?? null);
          if (!u) {
            tulis(KUNCI_PERNAH_MASUK, null, globalThis.localStorage);
            setPengguna(null);
            setPaket(null);
            setStatus("keluar");
            return;
          }
          tulis(KUNCI_PERNAH_MASUK, "1", globalThis.localStorage);
          setPengguna(infoDari(u));
          setPaket(null);
          setStatus("masuk");
          muatPaket(u.uid).catch(() => setPaket([]));
          if (sudahSinkron.current !== u.uid) {
            sudahSinkron.current = u.uid;
            sinkronkanAkun(u.uid).catch(() => {
              sudahSinkron.current = null; // coba lagi di pemuatan berikutnya
            });
          }
        });
      } catch {
        if (!batal) setStatus("keluar");
      }
    })();
    return () => {
      batal = true;
      lepas?.();
    };
  }, [perlu, muatPaket]);

  const nilai = useMemo<NilaiAkun>(
    () => ({
      status,
      pengguna,
      paket,
      galatGoogle,
      aktifkan: () => {
        if (LOGIN_AKTIF) setPerlu(true);
      },
      async masuk(email, sandi) {
        const [{ auth }, { signInWithEmailAndPassword }] = await Promise.all([ambilFirebase(), import("firebase/auth")]);
        setPerlu(true);
        await signInWithEmailAndPassword(auth, email.trim(), sandi);
      },
      async daftar(email, sandi) {
        const [{ auth }, { createUserWithEmailAndPassword, sendEmailVerification }] = await Promise.all([
          ambilFirebase(),
          import("firebase/auth"),
        ]);
        setPerlu(true);
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), sandi);
        await kirimTautanVerifikasi(cred.user, sendEmailVerification).catch(() => undefined);
      },
      async masukGoogle() {
        const [{ auth }, mod] = await Promise.all([ambilFirebase(), import("firebase/auth")]);
        setPerlu(true);
        setGalatGoogle(null);
        const provider = new mod.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        try {
          await mod.signInWithPopup(auth, provider);
        } catch (e) {
          const kode = (e as { code?: string }).code ?? "";
          if (!["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(kode)) throw e;
          tulis(KUNCI_GOOGLE_REDIRECT, "1", globalThis.sessionStorage);
          await mod.signInWithRedirect(auth, provider);
        }
      },
      async keluar() {
        const [{ auth }, { signOut }] = await Promise.all([ambilFirebase(), import("firebase/auth")]);
        // Kirim jawaban yang masih mengantre dulu. Kalau gagal (offline), data lokal dibiarkan.
        const terkirim = await kirimAntrean();
        await signOut(auth);
        sudahSinkron.current = null;
        if (terkirim) hapusDataLokal();
      },
      async lupaSandi(email) {
        const [{ auth }, { sendPasswordResetEmail }] = await Promise.all([ambilFirebase(), import("firebase/auth")]);
        await sendPasswordResetEmail(auth, email.trim());
      },
      async kirimVerifikasi() {
        const [{ auth }, { sendEmailVerification }] = await Promise.all([ambilFirebase(), import("firebase/auth")]);
        if (auth.currentUser) await kirimTautanVerifikasi(auth.currentUser, sendEmailVerification);
      },
      async cekVerifikasi() {
        const { auth } = await ambilFirebase();
        const u = auth.currentUser;
        if (!u) return false;
        await u.reload();
        // Token baru supaya klaim email_verified ikut terbaca Cloud Function.
        if (u.emailVerified) await u.getIdToken(true);
        setPengguna(infoDari(u));
        return u.emailVerified;
      },
      async ambilToken() {
        if (!LOGIN_AKTIF) return null;
        const { auth } = await ambilFirebase();
        return (await auth.currentUser?.getIdToken()) ?? null;
      },
      async tukarKode(kode) {
        const [{ auth, functions }, { httpsCallable }] = await Promise.all([ambilFirebase(), import("firebase/functions")]);
        const tukar = httpsCallable<{ kode: string }, { paket: string[]; sudah: boolean }>(functions, "redeemActivationCode");
        const { data } = await tukar({ kode });
        if (auth.currentUser) await muatPaket(auth.currentUser.uid).catch(() => undefined);
        return data;
      },
    }),
    [status, pengguna, paket, galatGoogle, muatPaket],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

async function kirimTautanVerifikasi(
  u: User,
  kirim: (u: User, pengaturan?: { url: string }) => Promise<void>,
) {
  try {
    // Setelah klik tautan, pengguna kembali ke /aktivasi.
    await kirim(u, { url: `${location.origin}/aktivasi` });
  } catch (e) {
    // Domain belum diizinkan di Firebase: kirim tanpa tautan kembali.
    if ((e as { code?: string }).code === "auth/unauthorized-continue-uri") await kirim(u);
    else throw e;
  }
}

/** `wajib`: halaman ini butuh status login pasti, jadi Firebase langsung dimuat. */
export function useAkun({ wajib = false }: { wajib?: boolean } = {}): NilaiAkun {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error("useAkun di luar PenyediaAkun");
  const { aktifkan } = nilai;
  useEffect(() => {
    if (wajib) aktifkan();
  }, [wajib, aktifkan]);
  return nilai;
}

/** Login dibatalkan sendiri (pop-up ditutup): bukan galat. */
export function dibatalkan(e: unknown) {
  const kode = (e as { code?: string } | null)?.code;
  return kode === "auth/popup-closed-by-user" || kode === "auth/cancelled-popup-request" || kode === "auth/user-cancelled";
}

/** Pesan galat Firebase Auth / Functions dalam bahasa Indonesia, ringkas. */
export function pesanGalat(e: unknown): string {
  const kode = (e as { code?: string } | null)?.code ?? "";
  const pesan = (e as { message?: string } | null)?.message ?? "";
  switch (kode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Email atau kata sandi salah.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Masuk saja dengan email ini.";
    case "auth/weak-password":
      return "Kata sandi minimal 6 karakter.";
    case "auth/invalid-email":
    case "auth/missing-email":
      return "Format email belum benar.";
    case "auth/missing-password":
      return "Isi kata sandi dulu.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
    case "auth/network-request-failed":
    case "functions/unavailable":
      return "Tidak ada koneksi. Periksa internet lalu coba lagi.";
    case "auth/account-exists-with-different-credential":
      return "Email ini terdaftar dengan kata sandi. Masuk dengan email dan kata sandi.";
    case "auth/popup-blocked":
      return "Pop-up diblokir browser. Izinkan pop-up lalu coba lagi.";
    case "auth/unauthorized-domain":
      return "Domain ini belum diizinkan untuk login. Hubungi admin.";
    // Pesan dari Cloud Function sudah berbahasa Indonesia.
    case "functions/not-found":
    case "functions/invalid-argument":
    case "functions/resource-exhausted":
    case "functions/failed-precondition":
    case "functions/internal":
      // "INTERNAL" = function gagal tanpa pesan sendiri.
      return pesan && pesan !== "INTERNAL" ? pesan : "Kode belum bisa diproses. Coba lagi sebentar lagi.";
    case "functions/unauthenticated":
      return "Sesi login habis. Masuk lagi lalu coba lagi.";
    default:
      return "Ada gangguan. Coba lagi sebentar lagi.";
  }
}
