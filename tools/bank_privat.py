#!/usr/bin/env python3
"""Bank soal berbayar: katalog publik + berkas privat untuk server.

Soal berbayar (teks, kunci, bobot, pembahasan, gambar) TIDAK boleh ikut build
statis, bundel browser, atau situs publik. Web hanya butuh dua hal:

1. `bank/katalog.json` (publik, ikut repo): judul, status, jumlah soal per
   subtes setiap paket skema 1. Tanpa teks soal, kunci, atau pembahasan.
   Dipakai daftar paket, halaman /try-out, dan angka di landing.
2. Berkas paket berbayar yang berdiri sendiri (SVG gambar ditanam sebagai
   base64) untuk diunggah ke Storage PRIVAT `bank/<id>.json`; dibaca server
   Next.js lewat Admin SDK setelah hak paket dicek.

Pemakaian (dari root repo):
  python3 tools/bank_privat.py katalog [DIR ...]          # tulis bank/katalog.json
  python3 tools/bank_privat.py cek-katalog [DIR ...]      # gagal bila katalog usang
  python3 tools/bank_privat.py siapkan KELUAR [DIR ...]   # paket berbayar → KELUAR/<id>.json

DIR = folder berisi p*.json (+ gambar/). Bawaan: bank/ + folder privat
(`BANK_PRIVAT_DIR` atau `../SoalSKD-bank`, lihat tools/lokasi_bank.py).
`cek-katalog` hanya memeriksa paket yang ada di disk (repo publik tanpa paket
berbayar tetap lolos).
Paket gratis dibaca dari PAKET_TERBUKA di web/src/config/akses.ts.
"""
from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lokasi_bank import semua_dir  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
KATALOG = ROOT / "bank" / "katalog.json"
URUTAN = ["TWK", "TIU", "TKP"]


def paket_gratis() -> list[str]:
    teks = (ROOT / "web/src/config/akses.ts").read_text(encoding="utf-8")
    m = re.search(r"PAKET_TERBUKA\s*=\s*\[([^\]]*)\]", teks)
    if not m:
        sys.exit("PAKET_TERBUKA tidak ditemukan di web/src/config/akses.ts")
    return re.findall(r"\"([a-z0-9-]+)\"", m.group(1))


def baca_semua(dirs: list[Path]) -> dict[str, tuple[Path, dict]]:
    hasil: dict[str, tuple[Path, dict]] = {}
    for d in dirs:
        for f in sorted(d.glob("*.json")):
            if f.name == "katalog.json":
                continue
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                sys.exit(f"{f}: JSON rusak ({e})")
            if data.get("skema") != 1 or not isinstance(data.get("soal"), list):
                continue  # format lama (mis. sample-15) tidak dipakai app
            pid = data["meta"]["id"]
            if pid in hasil:
                sys.exit(f"paket {pid} ada di dua tempat: {hasil[pid][0]} dan {f}")
            hasil[pid] = (f, data)
    return hasil


def buat_katalog(paket: dict[str, tuple[Path, dict]]) -> dict:
    isi = []
    for pid in sorted(paket):
        data = paket[pid][1]
        hitung = {s: sum(1 for q in data["soal"] if q.get("kategori") == s) for s in URUTAN}
        isi.append({
            "id": pid,
            "judul": data["meta"]["judul"],
            "status": data["meta"].get("status", ""),
            "jumlahSoal": len(data["soal"]),
            "perSubtes": {s: n for s, n in hitung.items() if n > 0},
        })
    return {
        "_catatan": "Dibuat tools/bank_privat.py. Hanya metadata; jangan tambahkan soal, kunci, atau pembahasan.",
        "paket": isi,
    }


def teks_katalog(k: dict) -> str:
    return json.dumps(k, ensure_ascii=False, indent=2) + "\n"


def siapkan(keluar: Path, paket: dict[str, tuple[Path, dict]]) -> list[Path]:
    gratis = set(paket_gratis())
    keluar.mkdir(parents=True, exist_ok=True)
    tulis = []
    for pid, (f, data) in sorted(paket.items()):
        if pid in gratis:
            continue
        data = json.loads(json.dumps(data))  # salinan
        dir_bank = f.parent.resolve()
        for q in data["soal"]:
            for g in q.get("gambar", []) or []:
                path = (dir_bank / g["file"]).resolve()
                if dir_bank not in path.parents or path.suffix != ".svg":
                    sys.exit(f"{pid}: path gambar tidak sah: {g['file']}")
                g["svg"] = base64.b64encode(path.read_bytes()).decode("ascii")
        out = keluar / f"{pid}.json"
        out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        tulis.append(out)
    return tulis


def main(argv: list[str]) -> None:
    if not argv or argv[0] not in {"katalog", "cek-katalog", "siapkan"}:
        sys.exit(__doc__)
    perintah, sisa = argv[0], argv[1:]
    keluar = None
    if perintah == "siapkan":
        if not sisa:
            sys.exit("siapkan butuh folder KELUAR")
        keluar, sisa = Path(sisa[0]), sisa[1:]
    dirs = [Path(d) for d in sisa] or semua_dir()
    paket = baca_semua(dirs)

    lama = json.loads(KATALOG.read_text(encoding="utf-8")) if KATALOG.exists() else {"paket": []}
    if perintah == "katalog":
        # Paket yang tidak ada di disk (mis. folder privat tidak terpasang) dipertahankan apa adanya.
        baru = {p["id"]: p for p in buat_katalog(paket)["paket"]}
        for p in lama.get("paket", []):
            baru.setdefault(p["id"], p)
        hasil = {**buat_katalog({}), "paket": [baru[k] for k in sorted(baru)]}
        KATALOG.write_text(teks_katalog(hasil), encoding="utf-8")
        hilang = sorted(set(baru) - set(paket))
        print(f"{KATALOG.relative_to(ROOT)}: {len(baru)} paket" + (f" ({', '.join(hilang)} tidak di disk, dipertahankan)" if hilang else ""))
    elif perintah == "cek-katalog":
        tercatat = {p["id"]: p for p in lama.get("paket", [])}
        usang = [p["id"] for p in buat_katalog(paket)["paket"] if tercatat.get(p["id"]) != p]
        if usang:
            sys.exit(f"bank/katalog.json usang untuk {', '.join(usang)}. Jalankan: python3 tools/bank_privat.py katalog")
        print(f"bank/katalog.json sesuai {len(paket)} paket di disk ({len(tercatat)} tercatat)")
    else:
        for p in siapkan(keluar, paket):
            print(p)


if __name__ == "__main__":
    main(sys.argv[1:])
