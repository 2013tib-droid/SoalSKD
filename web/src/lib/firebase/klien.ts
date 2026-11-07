// Firebase untuk browser. SDK dimuat lambat (dynamic import) supaya tidak ikut
// bundel awal landing; pengunjung yang belum pernah masuk tidak mengunduhnya.
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore/lite";
import type { Functions } from "firebase/functions";
import { BUILD_STATIK } from "@/config/build";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Login menyala hanya di build server dengan env Firebase terisi. Build statis = mati. */
export const LOGIN_AKTIF = !BUILD_STATIK && Boolean(config.apiKey && config.projectId && config.appId);

/** HARUS sama dengan `setGlobalOptions` di functions/src/index.ts, kalau tidak callable 404. */
export const FUNCTIONS_REGION = "asia-southeast2";

export type LayananFirebase = { app: FirebaseApp; auth: Auth; db: Firestore; functions: Functions };

let janji: Promise<LayananFirebase> | null = null;

export function ambilFirebase(): Promise<LayananFirebase> {
  if (!LOGIN_AKTIF) return Promise.reject(Object.assign(new Error("Login belum dikonfigurasi."), { code: "akun/mati" }));
  janji ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }, { getFunctions }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      // Lite: satu permintaan HTTPS per operasi, tanpa koneksi streaming (pelajaran game edukasi:
      // SDK lengkap bisa tertahan 10 detik di jaringan HP yang tersendat).
      import("firebase/firestore/lite"),
      import("firebase/functions"),
    ]);
    const app = initializeApp(config);
    const layanan = { app, auth: getAuth(app), db: getFirestore(app), functions: getFunctions(app, FUNCTIONS_REGION) };
    if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1") {
      const [{ connectAuthEmulator }, { connectFirestoreEmulator }, { connectFunctionsEmulator }] = await Promise.all([
        import("firebase/auth"),
        import("firebase/firestore/lite"),
        import("firebase/functions"),
      ]);
      connectAuthEmulator(layanan.auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(layanan.db, "127.0.0.1", 8080);
      connectFunctionsEmulator(layanan.functions, "127.0.0.1", 5001);
    }
    return layanan;
  })();
  return janji;
}
