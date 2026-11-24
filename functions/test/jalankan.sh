#!/bin/sh
# Tes backend di Firebase Emulator (project demo-*, tanpa kredensial & tanpa
# menyentuh data sungguhan). Dipanggil lewat `npm run uji` dari functions/.
# API Mayar diganti server tiruan di test/uji.mjs (127.0.0.1:9911); tidak ada
# panggilan ke Mayar sungguhan. Setelah itu gerbang paket web (web/test/akses-emulator.test.ts)
# diuji di emulator yang sama; butuh `npm ci` di web/.
set -e
cd "$(dirname "$0")/.."
# Rahasia & parameter khusus emulator (gitignored), ditulis ulang setiap kali.
printf 'MAYAR_WEBHOOK_TOKEN=token-uji\nMAYAR_API_KEY=kunci-api-uji\n' > .secret.local
printf 'URL_SITUS=https://contoh.test\nMAYAR_API_BASE=http://127.0.0.1:9911/hl/v2\n' > .env.local
cd ..
${FIREBASE:-npx --yes firebase-tools@14} emulators:exec --project demo-soalskd --only auth,functions,firestore,storage \
  "node functions/test/uji.mjs && cd web && NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-soalskd BANK_BUCKET=demo-soalskd.appspot.com NODE_ENV=production node --import ./test/loader.mjs --test test/akses-emulator.test.ts"
