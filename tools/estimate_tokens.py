#!/usr/bin/env python3
"""Estimasi token bank soal (teks Indonesia) tanpa perlu koneksi internet.

Pakai: python3 tools/estimate_tokens.py bank/*.json

Metode: rata-rata dua pendekatan yang saling mengoreksi
  m1 = jumlah karakter / 3.5   (rasio khas tokenizer Claude/GPT untuk bahasa Indonesia)
  m2 = jumlah kata * 1.55 + tanda baca + 0.5*digit
Selisih kedua metode biasanya <10%; akurasi total sekitar +/-15% terhadap
tokenizer asli. Untuk angka eksak gunakan endpoint /v1/messages/count_tokens.
"""
import json, re, sys, glob
from collections import defaultdict


def estimate(text: str) -> float:
    words = len(re.findall(r"[A-Za-zÀ-ɏ]+", text))
    punct = len(re.findall(r"[^\w\s]", text))
    digits = len(re.findall(r"\d", text))
    m1 = len(text) / 3.5
    m2 = words * 1.55 + punct + digits * 0.5
    return (m1 + m2) / 2


def report(path: str) -> None:
    raw = open(path, encoding="utf-8").read()
    data = json.loads(raw)
    soal = data["soal"]
    per_cat = defaultdict(list)
    for s in soal:
        per_cat[s["kategori"]].append(estimate(json.dumps(s, ensure_ascii=False)))

    total = estimate(raw)
    print(f"\n{path}: {len(soal)} soal, ~{total:,.0f} token ({total/len(soal):.0f} token/soal)")
    for cat in sorted(per_cat):
        v = per_cat[cat]
        print(f"  {cat}: {sum(v)/len(v):>5.0f} token/soal  x{len(v):<3} = {sum(v):>7,.0f} token")


if __name__ == "__main__":
    args = sys.argv[1:] or ["bank/*.json"]
    files = [f for a in args for f in glob.glob(a)]
    if not files:
        sys.exit("tidak ada file yang cocok")
    for f in files:
        report(f)
