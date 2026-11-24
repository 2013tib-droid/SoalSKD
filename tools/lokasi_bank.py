"""Lokasi bank soal: `bank/` di repo publik (paket gratis + katalog) dan folder PRIVAT
untuk paket berbayar (repo privat `SoalSKD-bank`, isi: `p02.json` … dan `gambar/`).

Folder privat dicari dari env `BANK_PRIVAT_DIR`, atau otomatis di sebelah repo ini
(`../SoalSKD-bank`). Dipakai validator, katalog, figural, unggah bank, dan ebook.
"""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT / "bank"


def dir_privat() -> Path | None:
    env = os.environ.get("BANK_PRIVAT_DIR")
    if env:
        p = Path(env).expanduser().resolve()
        if not p.is_dir():
            raise SystemExit(f"BANK_PRIVAT_DIR tidak ditemukan: {p}")
        return p
    tebak = ROOT.parent / "SoalSKD-bank"
    return tebak.resolve() if tebak.is_dir() else None


def semua_dir() -> list[Path]:
    """Folder paket: bank/ lalu folder privat (kalau ada)."""
    p = dir_privat()
    return [BANK] + ([p] if p and p != BANK.resolve() else [])


def file_paket(pid: str) -> Path | None:
    for d in semua_dir():
        f = d / f"{pid}.json"
        if f.is_file():
            return f
    return None


def file_gambar(relatif: str) -> Path | None:
    """`gambar/xxx.svg` dicari di setiap folder bank; tidak boleh keluar dari folder itu."""
    for d in semua_dir():
        f = (d / relatif).resolve()
        if d.resolve() in f.parents and f.is_file():
            return f
    return None
