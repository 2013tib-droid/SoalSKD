#!/bin/sh
# Membuat ebook Edisi 1 (p02–p04) lalu mengunggahnya ke Storage PRIVAT, path
# ebook/edisi-1.pdf (dibaca Cloud Function `unduhEbook`). PDF tidak pernah masuk
# repo, web/public, atau out/. Langkah lengkap: docs/firebase.md (langkah 10).
#
#   sh tools/unggah-ebook.sh <bucket>        # mis. soalskd-xxxx.firebasestorage.app
#   sh tools/unggah-ebook.sh --cuma-buat     # buat PDF saja, tanpa unggah
#
# Butuh gsutil yang sudah login (`gcloud auth login`) ke akun pemilik proyek.
set -eu
cd "$(dirname "$0")/.."

TUJUAN="${1:-}"
[ -n "$TUJUAN" ] || { echo "Pakai: sh tools/unggah-ebook.sh <bucket> | --cuma-buat" >&2; exit 1; }

PDF=ebook/dist/edisi-1.pdf
[ -d ebook/node_modules ] || (cd ebook && npm ci)
# Gagal validasi bank = PDF tidak dibuat dan skrip berhenti (set -e).
node ebook/buat-ebook.mjs bank/p02.json bank/p03.json bank/p04.json --judul "Edisi 1" --keluar "$PDF"

if [ "$TUJUAN" = "--cuma-buat" ]; then
  echo "PDF siap di $PDF (belum diunggah)."
  exit 0
fi

BUCKET="${TUJUAN#gs://}"
gsutil -h "Content-Type:application/pdf" -h "Cache-Control:private, max-age=0" \
  cp "$PDF" "gs://$BUCKET/ebook/edisi-1.pdf"
echo "Terunggah ke gs://$BUCKET/ebook/edisi-1.pdf"
