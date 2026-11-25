#!/bin/sh
# Mengunggah bank soal BERBAYAR ke Storage PRIVAT (`gs://<bucket>/bank/<id>.json`),
# tempat server Next.js (App Hosting) membacanya setelah hak paket dicek.
# storage.rules menolak semua client, jadi berkas ini tidak bisa diunduh dari browser.
#
#   sh tools/unggah-bank.sh <bucket> [DIR ...]
#
# DIR = folder sumber paket (bawaan: bank/ + repo privat SoalSKD-bank, lihat
# tools/lokasi_bank.py). Berkas disiapkan dulu oleh
# tools/bank_privat.py (SVG gambar ditanam), divalidasi, lalu diunggah. Paket gratis
# (PAKET_TERBUKA) tidak diunggah. Butuh gsutil yang login ke akun pemilik proyek.
set -eu
cd "$(dirname "$0")/.."

BUCKET="${1:-}"
[ -n "$BUCKET" ] || { echo "Pakai: sh tools/unggah-bank.sh <bucket> [DIR ...]" >&2; exit 1; }
BUCKET="${BUCKET#gs://}"
shift

# Gagal validasi = tidak ada yang diunggah.
if [ $# -gt 0 ]; then for d in "$@"; do python3 tools/validasi.py "$d"; done; else python3 tools/validasi.py; fi
KELUAR="$(mktemp -d)"
trap 'rm -rf "$KELUAR"' EXIT
python3 tools/bank_privat.py siapkan "$KELUAR" "$@"
gsutil -m -h "Content-Type:application/json" -h "Cache-Control:private, max-age=0" \
  cp "$KELUAR"/*.json "gs://$BUCKET/bank/"
echo "Selesai. Server membaca versi baru paling lambat 10 menit lagi (cache)."
