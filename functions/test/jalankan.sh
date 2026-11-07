#!/bin/sh
# Tes backend di Firebase Emulator (project demo-*, tanpa kredensial & tanpa
# menyentuh data sungguhan). Dipanggil lewat `npm run uji` dari functions/.
set -e
cd "$(dirname "$0")/.."
# Rahasia & parameter khusus emulator (gitignored). Email tidak dikirim di emulator.
[ -f .secret.local ] || printf 'MAYAR_WEBHOOK_TOKEN=token-uji\nGMAIL_APP_PASSWORD=dummy\n' > .secret.local
[ -f .env.local ] || printf 'EMAIL_PENGIRIM=uji@example.com\nURL_SITUS=https://contoh.test\n' > .env.local
cd ..
${FIREBASE:-npx --yes firebase-tools@14} emulators:exec --project demo-soalskd --only auth,functions,firestore,storage \
  "node functions/test/uji.mjs"
