#!/usr/bin/env python3
"""Alat bantu membuat paket soal per batch.

Pakai:
    python3 tools/bangun_paket.py urutan --seed 303
        Cetak urutan kunci TWK+TIU (65 huruf, 13 per huruf) dan posisi bobot 5 TKP
        (45 huruf, 9 per huruf), tanpa huruf yang sama berdampingan antarblok.

    python3 tools/bangun_paket.py gabung p03 <folder-batch> [--tanggal 2026-11-07]
        Gabungkan <folder-batch>/batch-*.json (urut nama file) menjadi bank/p03.json,
        isi id dan nomor otomatis, cetak ringkasan sebaran, lalu jalankan validator.

Setiap batch adalah JSON array berisi soal tanpa field id dan nomor.
Alur lengkapnya ada di docs/cara-membuat-paket.md.
"""
import argparse
import datetime
import json
import random
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def urutan(blok, seed, sebelum=""):
    acak = random.Random(seed)
    hasil = ""
    for _ in range(blok):
        while True:
            b = "".join(acak.sample("ABCDE", 5))
            if (hasil[-1:] or sebelum[-1:]) != b[0]:
                break
        hasil += b
    return hasil


def cmd_urutan(a):
    kunci = urutan(13, a.seed)
    print("Kunci TWK (soal 1-30): ", kunci[:30])
    print("Kunci TIU (soal 31-65):", kunci[30:])
    print("Bobot 5 TKP (soal 66-110):", urutan(9, a.seed + 1))


def cmd_gabung(a):
    folder = Path(a.folder)
    soal = []
    for f in sorted(folder.glob("batch-*.json")):
        soal += json.loads(f.read_text(encoding="utf-8"))
    if not soal:
        sys.exit(f"Tidak ada batch-*.json di {folder}")
    for i, s in enumerate(soal, 1):
        isi = {k: v for k, v in s.items() if k not in ("id", "nomor")}
        s.clear()
        s.update({"id": f"{a.paket}-{i:03d}", "nomor": i, **isi})
    paket = {"skema": 1, "meta": {"id": a.paket, "judul": f"Paket {a.paket[1:]}", "versi": 1,
             "dibuat": a.tanggal, "status": "draf"}, "soal": soal}
    out = ROOT / "bank" / f"{a.paket}.json"
    out.write_text(json.dumps(paket, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("kunci:", "".join(s.get("kunci", "") for s in soal),
          dict(Counter(s["kunci"] for s in soal if "kunci" in s)))
    print("bobot 5:", dict(Counter(next(h for h, v in s["bobot"].items() if v == 5)
                                   for s in soal if "bobot" in s)))
    for k in ("TWK", "TIU", "TKP"):
        c = Counter(s["tingkat"] for s in soal if s["kategori"] == k)
        if c:
            print(f"{k} {sum(c.values())} soal:", dict(c))
    sys.exit(subprocess.call([sys.executable, str(ROOT / "tools" / "validasi.py"), str(out)]))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    u = sub.add_parser("urutan")
    u.add_argument("--seed", type=int, required=True)
    u.set_defaults(f=cmd_urutan)
    g = sub.add_parser("gabung")
    g.add_argument("paket")
    g.add_argument("folder")
    g.add_argument("--tanggal", default=datetime.date.today().isoformat())
    g.set_defaults(f=cmd_gabung)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
