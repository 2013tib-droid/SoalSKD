import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { BUILD_STATIK } from "@/config/build";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/** Server bisa memeriksa token dan hak paket. Mati di build statis dan tanpa env Firebase. */
export const ADMIN_AKTIF = !BUILD_STATIK && Boolean(projectId);

function app(): App {
  const ada = getApps()[0];
  if (ada) return ada;
  // App Hosting / Cloud Run: kredensial otomatis (ADC). Hosting lain: isi
  // FIREBASE_SERVICE_ACCOUNT dengan JSON service account (secret, jangan di repo).
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  return initializeApp(sa ? { credential: cert(JSON.parse(sa)), projectId } : { projectId });
}

/** uid dari ID token Firebase, atau null kalau token kosong/tidak sah/kedaluwarsa. */
export async function uidDariToken(idToken: string | null | undefined): Promise<string | null> {
  if (!ADMIN_AKTIF || typeof idToken !== "string" || !idToken) return null;
  try {
    return (await getAuth(app()).verifyIdToken(idToken)).uid;
  } catch {
    return null;
  }
}

/** Paket yang dimiliki akun (`users/{uid}.paket`, ditulis Cloud Function). */
export async function paketMilik(uid: string): Promise<string[]> {
  const data = (await getFirestore(app()).doc(`users/${uid}`).get()).data();
  return Array.isArray(data?.paket) ? data.paket.filter((p): p is string => typeof p === "string") : [];
}
