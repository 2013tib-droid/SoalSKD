#!/bin/sh
# Membuat ebook satu edisi lalu mengunggahnya ke Storage PRIVAT (dibaca Cloud
# Function `unduhEbook`). PDF tidak pernah masuk repo, web/public, atau out/.
# Langkah lengkap: docs/firebase.md (langkah 10, dan langkah Bundel 2).
#
#   sh tools/unggah-ebook.sh <bucket> [edisi-1|edisi-2]   # bawaan edisi-1
#   sh tools/unggah-ebook.sh --cuma-buat [edisi-1|edisi-2] # buat PDF saja, tanpa unggah
#
#   edisi-1 = Bundel 1 (p02–p04) → gs://<bucket>/ebook/edisi-1.pdf
#   edisi-2 = Bundel 2 (p05–p07) → gs://<bucket>/ebook/edisi-2.pdf
#   (sama dengan EBOOK di functions/src/produk.ts)
#
# Butuh gsutil yang sudah login (`gcloud auth login`) ke akun pemilik proyek.
set -eu
cd "$(dirname "$0")/.."

TUJUAN="${1:-}"
EDISI="${2:-edisi-1}"
[ -n "$TUJUAN" ] || { echo "Pakai: sh tools/unggah-ebook.sh <bucket> | --cuma-buat [edisi-1|edisi-2]" >&2; exit 1; }

case "$EDISI" in
  edisi-1) ID="p02 p03 p04"; JUDUL="Edisi 1" ;;
  edisi-2) ID="p05 p06 p07"; JUDUL="Edisi 2" ;;
  *) echo "Edisi tidak dikenal: $EDISI (pakai edisi-1 atau edisi-2)" >&2; exit 1 ;;
esac
# Paket berbayar ada di repo privat SoalSKD-bank (BANK_PRIVAT_DIR atau ../SoalSKD-bank).
# shellcheck disable=SC2086
PAKET="$(python3 -c 'import sys; sys.path.insert(0, "tools"); from lokasi_bank import file_paket
f = [file_paket(i) for i in sys.argv[1:]]
if None in f: sys.exit("paket tidak ditemukan: " + " ".join(i for i, x in zip(sys.argv[1:], f) if x is None) + " (pasang repo privat SoalSKD-bank, lihat docs/firebase.md)")
print(" ".join(str(x) for x in f))' $ID)"

PDF="ebook/dist/$EDISI.pdf"
[ -d ebook/node_modules ] || (cd ebook && npm ci)
# Gagal validasi bank = PDF tidak dibuat dan skrip berhenti (set -e).
# shellcheck disable=SC2086
node ebook/buat-ebook.mjs $PAKET --judul "$JUDUL" --keluar "$PDF"

if [ "$TUJUAN" = "--cuma-buat" ]; then
  echo "PDF siap di $PDF (belum diunggah)."
  exit 0
fi

BUCKET="${TUJUAN#gs://}"
gsutil -h "Content-Type:application/pdf" -h "Cache-Control:private, max-age=0" \
  cp "$PDF" "gs://$BUCKET/ebook/$EDISI.pdf"
echo "Terunggah ke gs://$BUCKET/ebook/$EDISI.pdf"
