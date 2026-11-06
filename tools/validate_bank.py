#!/usr/bin/env python3
"""Validasi paket soal (bank/*.json) terhadap schema/paket.schema.json.

Pemakaian:
    python3 tools/validate_bank.py bank/            # semua *.json di folder
    python3 tools/validate_bank.py bank/p01.json    # satu file

Selain skema, diperiksa aturan yang tidak bisa ditulis di JSON Schema
(lihat docs/skema-soal.md):
- nama file = meta.id, dan setiap soal.id berawalan "<meta.id>-"
- soal.id unik di seluruh file yang diperiksa
- nomor unik dan berurutan 1..n sesuai urutan array
- urutan kategori TWK -> TIU -> TKP
- TKP: bobot 1-5 masing-masing dipakai tepat sekali
- TWK/TIU: pembahasan.opsi ada untuk setiap opsi selain kunci
Peringatan (tidak menggagalkan): topik yang berulang di seluruh bank.

Memakai paket `jsonschema` kalau terpasang; kalau tidak, memakai interpreter
stdlib untuk subset JSON Schema yang dipakai skema ini.
Keluar dengan kode 1 kalau ada error.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schema" / "paket.schema.json"
HURUF = ("A", "B", "C", "D", "E")
URUTAN = {"TWK": 0, "TIU": 1, "TKP": 2}


# ---------- skema ----------

def label(data: object, path: list) -> str:
    """Path error -> label yang menyebut id soal bila ada."""
    if len(path) >= 2 and path[0] == "soal" and isinstance(path[1], int):
        try:
            sid = data["soal"][path[1]].get("id")  # type: ignore[index]
        except (TypeError, KeyError, IndexError, AttributeError):
            sid = None
        nama = sid if isinstance(sid, str) else f"soal[{path[1]}]"
        rest = ".".join(map(str, path[2:]))
        return nama + (f" · {rest}" if rest else "")
    return ".".join(map(str, path)) or "(akar)"


def cek_jsonschema(data: object, schema: dict) -> list[tuple[list, str]]:
    import jsonschema

    cls = jsonschema.validators.validator_for(schema)
    v = cls(schema, format_checker=cls.FORMAT_CHECKER)
    out = []
    for e in v.iter_errors(data):
        msg = e.message
        if e.validator == "not":
            msg = f"field terlarang ada: {e.validator_value.get('required')}"
        out.append((list(e.absolute_path), msg))
    return out


TIPE = {
    "object": lambda x: isinstance(x, dict),
    "array": lambda x: isinstance(x, list),
    "string": lambda x: isinstance(x, str),
    "integer": lambda x: isinstance(x, int) and not isinstance(x, bool),
    "number": lambda x: isinstance(x, (int, float)) and not isinstance(x, bool),
    "boolean": lambda x: isinstance(x, bool),
    "null": lambda x: x is None,
}


def tanggal_ok(s: str) -> bool:
    try:
        date.fromisoformat(s)
        return bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", s))
    except ValueError:
        return False


def cek_stdlib(x: object, s: dict, root: dict, path: list) -> list[tuple[list, str]]:
    """Subset JSON Schema 2020-12 yang dipakai schema/paket.schema.json."""
    if "$ref" in s:
        node = root
        for part in s["$ref"].lstrip("#/").split("/"):
            node = node[part]
        errs = cek_stdlib(x, node, root, path)
        s = {k: v for k, v in s.items() if k != "$ref"}
    else:
        errs = []
    if "type" in s and not TIPE[s["type"]](x):
        return errs + [(path, f"harus bertipe {s['type']}")]
    if "const" in s and x != s["const"]:
        errs.append((path, f"harus {s['const']!r}"))
    if "enum" in s and x not in s["enum"]:
        errs.append((path, f"{x!r} bukan salah satu dari {s['enum']}"))
    if isinstance(x, str):
        if len(x) < s.get("minLength", 0):
            errs.append((path, "tidak boleh kosong"))
        if "pattern" in s and not re.search(s["pattern"], x):
            errs.append((path, f"{x!r} tidak cocok pola {s['pattern']}"))
        if s.get("format") == "date" and not tanggal_ok(x):
            errs.append((path, f"{x!r} bukan tanggal YYYY-MM-DD"))
    if TIPE["number"](x):
        if "minimum" in s and x < s["minimum"]:
            errs.append((path, f"{x} < minimum {s['minimum']}"))
        if "maximum" in s and x > s["maximum"]:
            errs.append((path, f"{x} > maksimum {s['maximum']}"))
    if isinstance(x, list):
        if len(x) < s.get("minItems", 0):
            errs.append((path, f"minimal {s['minItems']} item"))
        if "maxItems" in s and len(x) > s["maxItems"]:
            errs.append((path, f"maksimal {s['maxItems']} item"))
        if s.get("uniqueItems") and len({json.dumps(i, sort_keys=True) for i in x}) != len(x):
            errs.append((path, "item tidak boleh ganda"))
        if "items" in s:
            for i, item in enumerate(x):
                errs += cek_stdlib(item, s["items"], root, path + [i])
    if isinstance(x, dict):
        for k in s.get("required", []):
            if k not in x:
                errs.append((path, f"field '{k}' wajib ada"))
        props = s.get("properties", {})
        for k, v in x.items():
            if k in props:
                errs += cek_stdlib(v, props[k], root, path + [k])
            elif s.get("additionalProperties") is False:
                errs.append((path, f"field tambahan '{k}' tidak diizinkan"))
    for sub in s.get("allOf", []):
        errs += cek_stdlib(x, sub, root, path)
    if "if" in s:
        cabang = "then" if not cek_stdlib(x, s["if"], root, path) else "else"
        if cabang in s:
            errs += cek_stdlib(x, s[cabang], root, path)
    if "not" in s and not cek_stdlib(x, s["not"], root, path):
        errs.append((path, f"field terlarang ada: {s['not'].get('required', s['not'])}"))
    return errs


# ---------- aturan lintas soal ----------

def cek_paket(data: dict, path: Path, id_bank: dict, topik_bank: dict) -> list[str]:
    errs = []
    meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
    pid = meta.get("id")
    if isinstance(pid, str) and pid != path.stem:
        errs.append(f"meta.id: '{pid}' tidak sama dengan nama file '{path.stem}'")
    soal = data.get("soal") if isinstance(data.get("soal"), list) else []
    kat_sebelum = -1
    for i, s in enumerate(soal):
        if not isinstance(s, dict):
            continue
        nama = label(data, ["soal", i])
        sid, kat = s.get("id"), s.get("kategori")
        if isinstance(sid, str):
            if isinstance(pid, str) and not sid.startswith(pid + "-"):
                errs.append(f"{nama} · id: harus berawalan '{pid}-'")
            if sid in id_bank:
                errs.append(f"{nama} · id: ganda, sudah dipakai di {id_bank[sid]}")
            else:
                id_bank[sid] = f"{path.name} soal ke-{i + 1}"
        if s.get("nomor") != i + 1:
            errs.append(f"{nama} · nomor: {s.get('nomor')!r}, seharusnya {i + 1} (urut sesuai array)")
        if kat in URUTAN:
            if URUTAN[kat] < kat_sebelum:
                errs.append(f"{nama} · kategori: {kat} muncul setelah soal sebelumnya yang kategorinya lebih akhir (urutan TWK -> TIU -> TKP)")
            kat_sebelum = URUTAN[kat]
        bobot = s.get("bobot")
        if kat == "TKP" and isinstance(bobot, dict) and set(bobot) == set(HURUF):
            if sorted(bobot.values()) != [1, 2, 3, 4, 5]:
                errs.append(f"{nama} · bobot: nilai 1-5 harus dipakai tepat sekali (ada {sorted(bobot.values())})")
        pemb = s.get("pembahasan")
        if kat in ("TWK", "TIU") and s.get("kunci") in HURUF and isinstance(pemb, dict) and isinstance(pemb.get("opsi"), dict):
            kurang = [h for h in HURUF if h != s["kunci"] and h not in pemb["opsi"]]
            if kurang:
                errs.append(f"{nama} · pembahasan.opsi: belum ada penjelasan untuk {', '.join(kurang)}")
        topik = s.get("topik")
        if isinstance(topik, str) and isinstance(sid, str):
            topik_bank.setdefault(topik.strip().lower(), []).append(sid)
    return errs


# ---------- main ----------

def kumpulkan(args: list[str]) -> list[Path]:
    files: list[Path] = []
    for a in args:
        p = Path(a)
        files += sorted(p.glob("*.json")) if p.is_dir() else [p]
    return files


def main(argv: list[str]) -> int:
    if not argv:
        print("pakai: validate_bank.py <file.json|folder> ...", file=sys.stderr)
        return 2
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    try:
        import jsonschema  # noqa: F401
        mesin = "jsonschema"
    except ImportError:
        mesin = "stdlib"
    files = kumpulkan(argv)
    if not files:
        print("tidak ada file *.json", file=sys.stderr)
        return 1
    id_bank: dict[str, str] = {}
    topik_bank: dict[str, list[str]] = {}
    gagal = 0
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            errs = [f"tidak bisa dibaca sebagai JSON: {e}"]
        else:
            raw = cek_jsonschema(data, schema) if mesin == "jsonschema" else cek_stdlib(data, schema, schema, [])
            raw.sort(key=lambda e: [str(p).zfill(4) for p in e[0]])
            errs = [f"{label(data, p)}: {m if len(m) <= 160 else m[:157] + '...'}" for p, m in raw]
            if isinstance(data, dict):
                errs += cek_paket(data, f, id_bank, topik_bank)
        if errs:
            gagal += 1
            print(f"✗ {f} ({len(errs)} error)")
            for e in errs:
                print(f"  - {e}")
        else:
            print(f"✓ {f}")
    for topik, ids in topik_bank.items():
        if len(ids) > 1:
            print(f"! peringatan: topik '{topik}' dipakai {len(ids)} kali: {', '.join(ids)}")
    print(f"\n{len(files) - gagal}/{len(files)} file lolos (validator: {mesin})")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
