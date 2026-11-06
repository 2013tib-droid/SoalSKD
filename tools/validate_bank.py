#!/usr/bin/env python3
"""Validasi file bank soal (bank/*.json) terhadap bank/schema/bank-soal.schema.json.

Pemakaian:
    python3 tools/validate_bank.py bank/                # semua *.json di folder
    python3 tools/validate_bank.py bank/sample-15.json  # satu file

Selain skema, diperiksa juga:
- `id` tidak ganda dalam satu file
- TKP: tepat satu opsi berbobot 5, dan `kunci` menunjuk opsi itu

Memakai paket `jsonschema` kalau terpasang; kalau tidak, aturan skema diperiksa
dengan pemeriksa stdlib di bawah (aturannya harus ikut diubah bila skema berubah).
Keluar dengan kode 1 kalau ada error.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "bank" / "schema" / "bank-soal.schema.json"
HURUF = ("A", "B", "C", "D", "E")
KATEGORI = ("TWK", "TIU", "TKP")
TINGKAT = ("mudah", "sedang", "sulit")
FIELD_SOAL = {"id", "kategori", "subtopik", "pertanyaan", "opsi", "kunci", "bobot", "pembahasan", "tingkat"}
WAJIB_SOAL = FIELD_SOAL - {"bobot"}
FIELD_META = ("paket", "sumber", "format", "dibuat")
POLA_ID = re.compile(r"^(TWK|TIU|TKP)-\d{3}$")


def label(data: object, path: list) -> str:
    """Ubah path error menjadi label yang menyebut id soal bila ada."""
    if len(path) >= 2 and path[0] == "soal" and isinstance(path[1], int):
        try:
            sid = data["soal"][path[1]].get("id")  # type: ignore[index]
        except (TypeError, KeyError, IndexError, AttributeError):
            sid = None
        rest = ".".join(str(p) for p in path[2:])
        nama = sid if isinstance(sid, str) else f"soal[{path[1]}]"
        return f"{nama}{' · ' + rest if rest else ''}"
    return ".".join(str(p) for p in path) or "(akar)"


def cek_skema_jsonschema(data: object, schema: dict) -> list[str]:
    import jsonschema

    cls = jsonschema.validators.validator_for(schema)
    v = cls(schema, format_checker=cls.FORMAT_CHECKER)
    out = []
    for e in sorted(v.iter_errors(data), key=lambda e: list(map(str, e.absolute_path))):
        msg = e.message
        if e.validator == "not":  # cabang TWK/TIU: not {required: [bobot]}
            msg = "hanya soal TKP yang boleh punya 'bobot'"
        elif e.validator == "pattern" and e.validator_value in ("^TWK-", "^TIU-", "^TKP-"):
            msg = f"awalan id harus sama dengan kategori ({e.validator_value[1:-1]})"
        out.append(f"{label(data, list(e.absolute_path))}: {msg}")
    return out


def teks_ok(x: object) -> bool:
    return isinstance(x, str) and x.strip() != ""


def cek_huruf_map(obj: object, nama: str, cek_nilai, jelas: str) -> list[str]:
    if not isinstance(obj, dict):
        return [f"{nama} harus objek"]
    errs = []
    if set(obj) != set(HURUF):
        errs.append(f"{nama} harus berisi tepat kunci A-E (ada: {', '.join(sorted(map(str, obj)))})")
    for k in HURUF:
        if k in obj and not cek_nilai(obj[k]):
            errs.append(f"{nama}.{k} harus {jelas}")
    return errs


def cek_skema_stdlib(data: object) -> list[str]:
    if not isinstance(data, dict):
        return ["(akar): harus objek dengan kunci meta dan soal"]
    errs = []
    for k in set(data) - {"meta", "soal"}:
        errs.append(f"(akar): properti tambahan '{k}' tidak diizinkan")
    meta = data.get("meta")
    if not isinstance(meta, dict):
        errs.append("meta: wajib ada dan berupa objek")
    else:
        for k in set(meta) - set(FIELD_META):
            errs.append(f"meta: properti tambahan '{k}' tidak diizinkan")
        for k in FIELD_META:
            if not teks_ok(meta.get(k)):
                errs.append(f"meta.{k}: wajib, string tidak kosong")
        if isinstance(meta.get("paket"), str) and not re.fullmatch(r"[a-z0-9-]+", meta["paket"]):
            errs.append("meta.paket: hanya huruf kecil, angka, dan '-'")
        if isinstance(meta.get("dibuat"), str) and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", meta["dibuat"]):
            errs.append("meta.dibuat: format tanggal YYYY-MM-DD")
    soal = data.get("soal")
    if not isinstance(soal, list) or not soal:
        errs.append("soal: wajib berupa array yang tidak kosong")
        return errs
    for i, s in enumerate(soal):
        nama = label(data, ["soal", i])
        if not isinstance(s, dict):
            errs.append(f"{nama}: harus objek")
            continue
        for k in sorted(set(s) - FIELD_SOAL):
            errs.append(f"{nama}: properti tambahan '{k}' tidak diizinkan")
        for k in sorted(WAJIB_SOAL - set(s)):
            errs.append(f"{nama}: field '{k}' wajib ada")
        sid, kat = s.get("id"), s.get("kategori")
        if "id" in s and not (isinstance(sid, str) and POLA_ID.match(sid)):
            errs.append(f"{nama} · id: harus cocok ^(TWK|TIU|TKP)-\\d{{3}}$")
        if "kategori" in s and kat not in KATEGORI:
            errs.append(f"{nama} · kategori: harus salah satu dari {', '.join(KATEGORI)}")
        if kat in KATEGORI and isinstance(sid, str) and POLA_ID.match(sid) and not sid.startswith(kat + "-"):
            errs.append(f"{nama} · id: awalan harus sama dengan kategori '{kat}'")
        for k in ("subtopik", "pertanyaan", "pembahasan"):
            if k in s and not teks_ok(s[k]):
                errs.append(f"{nama} · {k}: harus string tidak kosong")
        if "opsi" in s:
            errs += [f"{nama} · {e}" for e in cek_huruf_map(s["opsi"], "opsi", teks_ok, "string tidak kosong")]
        if "kunci" in s and s["kunci"] not in HURUF:
            errs.append(f"{nama} · kunci: harus salah satu dari A-E")
        if "tingkat" in s and s["tingkat"] not in TINGKAT:
            errs.append(f"{nama} · tingkat: harus salah satu dari {', '.join(TINGKAT)}")
        if kat == "TKP":
            if "bobot" not in s:
                errs.append(f"{nama}: soal TKP wajib punya 'bobot'")
            else:
                skor_ok = lambda x: isinstance(x, int) and not isinstance(x, bool) and 1 <= x <= 5
                errs += [f"{nama} · {e}" for e in cek_huruf_map(s["bobot"], "bobot", skor_ok, "bilangan bulat 1-5")]
        elif kat in ("TWK", "TIU") and "bobot" in s:
            errs.append(f"{nama}: soal {kat} tidak boleh punya 'bobot'")
    return errs


def cek_tambahan(data: object) -> list[str]:
    soal = data.get("soal") if isinstance(data, dict) else None
    if not isinstance(soal, list):
        return []
    errs, dilihat = [], {}
    for i, s in enumerate(soal):
        if not isinstance(s, dict):
            continue
        sid = s.get("id")
        nama = label(data, ["soal", i])
        if isinstance(sid, str):
            if sid in dilihat:
                errs.append(f"{sid}: id ganda (soal ke-{dilihat[sid] + 1} dan ke-{i + 1})")
            else:
                dilihat[sid] = i
        bobot = s.get("bobot")
        if s.get("kategori") == "TKP" and isinstance(bobot, dict):
            lima = sorted(k for k, v in bobot.items() if v == 5)
            if len(lima) != 1:
                errs.append(f"{nama} · bobot: harus tepat satu opsi berbobot 5 (ada: {', '.join(lima) or 'tidak ada'})")
            elif s.get("kunci") != lima[0]:
                errs.append(f"{nama} · kunci: '{s.get('kunci')}' tidak sama dengan opsi berbobot 5 ('{lima[0]}')")
    return errs


def validasi_file(path: Path, schema: dict | None) -> list[str]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        return [f"tidak bisa dibaca sebagai JSON: {e}"]
    errs = cek_skema_jsonschema(data, schema) if schema is not None else cek_skema_stdlib(data)
    errs += cek_tambahan(data)
    meta = data.get("meta") if isinstance(data, dict) else None
    if isinstance(meta, dict) and isinstance(meta.get("paket"), str) and meta["paket"] != path.stem:
        errs.append(f"meta.paket: '{meta['paket']}' tidak sama dengan nama file '{path.stem}'")
    return errs


def kumpulkan(args: list[str]) -> list[Path]:
    files: list[Path] = []
    for a in args:
        p = Path(a)
        if p.is_dir():
            files += sorted(p.glob("*.json"))  # tidak rekursif: bank/schema/ dilewati
        elif p.is_file():
            files.append(p)
        else:
            print(f"{a}: tidak ditemukan", file=sys.stderr)
            files.append(p)
    return files


def main(argv: list[str]) -> int:
    if not argv:
        print("pakai: validate_bank.py <file.json|folder> ...", file=sys.stderr)
        return 2
    try:
        import jsonschema  # noqa: F401

        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        mesin = "jsonschema"
    except ImportError:
        schema, mesin = None, "stdlib"
    files = kumpulkan(argv)
    if not files:
        print("tidak ada file *.json", file=sys.stderr)
        return 1
    gagal = 0
    for f in files:
        errs = validasi_file(f, schema) if f.exists() else ["file tidak ada"]
        if errs:
            gagal += 1
            print(f"✗ {f} ({len(errs)} error)")
            for e in errs:
                print(f"  - {e}")
        else:
            print(f"✓ {f}")
    print(f"\n{len(files) - gagal}/{len(files)} file lolos (validator: {mesin})")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
