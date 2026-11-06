#!/usr/bin/env python3
"""Validasi paket soal di bank/.

Pakai:
    python3 tools/validasi.py                # semua bank/*.json yang punya field "skema"
    python3 tools/validasi.py bank/p01.json  # file tertentu

GALAT membuat skrip keluar dengan kode 1 (paket tidak boleh terbit).
PERINGATAN hanya dilaporkan, dan untuk paket penuh sebaiknya dibereskan juga.
Aturan lengkap: docs/skema-soal.md.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT / "bank"
SKEMA = ROOT / "schema" / "paket.schema.json"
CONFIG = ROOT / "config" / "skd.json"

HURUF = "ABCDE"
MIN_KATA_PEMBAHASAN = 150
URUTAN = ["TWK", "TIU", "TKP"]

try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:
    sys.exit("Butuh paket jsonschema: pip install jsonschema")


class Laporan:
    def __init__(self):
        self.galat, self.peringatan = [], []

    def g(self, lokasi, pesan):
        self.galat.append(f"{lokasi}: {pesan}")

    def p(self, lokasi, pesan):
        self.peringatan.append(f"{lokasi}: {pesan}")


def normal(teks):
    return re.sub(r"[^a-z0-9]+", " ", teks.lower()).strip()


def jumlah_kata(pb):
    return len(" ".join([pb["inti"], *pb["opsi"].values(), pb.get("konsep", "")]).split())


def teks_soal(s):
    pb = s["pembahasan"]
    return [s["pertanyaan"], *s["opsi"].values(), pb["inti"], *pb["opsi"].values(),
            pb.get("konsep", ""), s["tips"]]


def cek_soal(s, lok, lap):
    kat = s["kategori"]

    if kat == "TKP":
        if sorted(s["bobot"].values()) != [1, 2, 3, 4, 5]:
            lap.g(lok, f"bobot TKP harus memakai 1–5 masing-masing sekali, sekarang {s['bobot']}")
    else:
        kurang = [h for h in HURUF if h != s["kunci"] and h not in s["pembahasan"]["opsi"]]
        if kurang:
            lap.g(lok, f"pembahasan.opsi belum menjelaskan opsi {', '.join(kurang)}")

    n = jumlah_kata(s["pembahasan"])
    if n < MIN_KATA_PEMBAHASAN:
        lap.g(lok, f"pembahasan {n} kata, minimal {MIN_KATA_PEMBAHASAN}")

    ganda = [t for t, c in Counter(normal(v) for v in s["opsi"].values()).items() if c > 1]
    if ganda:
        lap.g(lok, "ada teks opsi yang sama persis")

    for t in teks_soal(s):
        if t.count("**") % 2:
            lap.p(lok, f"penanda tebal ** tidak berpasangan: \"{t[:50]}…\"")
            break
    for t in teks_soal(s):
        if re.search(r"</?[a-zA-Z][^>]*>", t):
            lap.p(lok, "ada tag HTML; pakai Markdown saja")
            break
        if re.search(r"\\(frac|sqrt|times)|\$[^$\s][^$]*\$", t):
            lap.p(lok, "ada notasi LaTeX; tulis rumus dengan Unicode")
            break

    for g in s.get("gambar", []):
        if not (BANK / g["file"]).is_file():
            lap.g(lok, f"file gambar tidak ditemukan: bank/{g['file']}")


def cek_sebaran(nama, hitung, total, target, lap, lok, toleransi):
    """Bandingkan sebaran aktual dengan target proporsi; toleransi dalam jumlah soal."""
    for k, prop in target.items():
        harap = prop * total
        if abs(hitung.get(k, 0) - harap) > toleransi:
            lap.p(lok, f"sebaran {nama}: {k} {hitung.get(k, 0)}, target sekitar {harap:.0f}")


def cek_paket(path, paket, config, validator, lap):
    lok = path.name
    galat_skema = sorted(validator.iter_errors(paket), key=lambda e: list(e.path))
    for e in galat_skema:
        lap.g(f"{lok} {'/'.join(map(str, e.path)) or '(akar)'}", e.message)
    if galat_skema:
        return  # cek berikutnya mengandalkan bentuk yang benar

    meta, soal = paket["meta"], paket["soal"]
    if path.stem != meta["id"]:
        lap.g(lok, f"nama file harus {meta['id']}.json sesuai meta.id")

    nomor = [s["nomor"] for s in soal]
    if nomor != list(range(1, len(soal) + 1)):
        lap.g(lok, "nomor soal harus berurutan mulai 1 tanpa loncat")

    salah_id = [str(s["nomor"]) for s in soal if not s["id"].startswith(meta["id"] + "-")]
    if salah_id:
        lap.g(lok, f"id soal harus diawali {meta['id']}- (soal nomor {', '.join(salah_id)})")

    urut = [URUTAN.index(s["kategori"]) for s in soal]
    if urut != sorted(urut):
        lap.g(lok, "urutan soal harus TWK, lalu TIU, lalu TKP")

    for s in soal:
        cek_soal(s, f"{lok} #{s['nomor']} ({s['id']})", lap)

    if meta["status"] == "final":
        for s in soal:
            if s.get("catatan_review"):
                lap.g(f"{lok} #{s['nomor']}", "status final tetapi catatan_review belum dibereskan")

    # Komposisi dan sebaran
    per_kat = Counter(s["kategori"] for s in soal)
    target_kat = {x["kode"]: x["jumlah_soal"] for x in config["subtes"]}
    penuh = len(soal) == sum(target_kat.values())
    if penuh:
        for k, n in target_kat.items():
            if per_kat[k] != n:
                lap.g(lok, f"paket penuh harus berisi {k} {n} soal, sekarang {per_kat[k]}")
    else:
        lap.p(lok, f"paket belum penuh: {len(soal)} dari {sum(target_kat.values())} soal "
                   f"({', '.join(f'{k} {per_kat[k]}/{n}' for k, n in target_kat.items())})")

    tol = max(1, round(len(soal) * 0.03))
    cek_sebaran("tingkat", Counter(s["tingkat"] for s in soal), len(soal),
                config["sebaran_tingkat"], lap, lok, tol)

    kunci = [s["kunci"] for s in soal if "kunci" in s]
    if kunci:
        rata = {h: 1 / 5 for h in HURUF}
        cek_sebaran("kunci TWK/TIU", Counter(kunci), len(kunci), rata, lap, lok, max(1, len(kunci) * 0.06))
        beruntun = max(len(m.group()) for m in re.finditer(r"(.)\1*", "".join(kunci)))
        if beruntun >= 4:
            lap.p(lok, f"kunci yang sama muncul {beruntun} kali berturut-turut")

    tkp = [s for s in soal if s["kategori"] == "TKP"]
    if tkp:
        lima = Counter(next(h for h, v in s["bobot"].items() if v == 5) for s in tkp)
        cek_sebaran("posisi bobot 5 TKP", lima, len(tkp), {h: 1 / 5 for h in HURUF},
                    lap, lok, max(1, len(tkp) * 0.06))
        if penuh:
            aspek = validator.schema["$defs"]["soal"]["allOf"][0]["then"]["properties"]["subtopik"]["enum"]
            ada = Counter(s["subtopik"] for s in tkp)
            for a in aspek:
                if not ada[a]:
                    lap.p(lok, f"aspek TKP \"{a}\" tidak muncul")


def cek_lintas_paket(daftar, lap):
    """Topik dan pertanyaan tidak boleh berulang di seluruh bank."""
    id_ke = defaultdict(list)
    topik_ke = defaultdict(list)
    tanya_ke = defaultdict(list)
    for path, paket in daftar:
        for s in paket["soal"]:
            asal = f"{path.name} #{s['nomor']}"
            id_ke[s["id"]].append(asal)
            topik_ke[(s["kategori"], normal(s["topik"]))].append(asal)
            tanya_ke[normal(s["pertanyaan"])].append(asal)
    for x, asal in id_ke.items():
        if len(asal) > 1:
            lap.g(", ".join(asal), f"id {x} dipakai lebih dari sekali")
    for (kat, topik), asal in topik_ke.items():
        if len(asal) > 1:
            lap.g(", ".join(asal), f"topik {kat} berulang: \"{topik}\"")
    for _, asal in tanya_ke.items():
        if len(asal) > 1:
            lap.g(", ".join(asal), "pertanyaan sama persis")


def main(argv):
    skema = json.loads(SKEMA.read_text(encoding="utf-8"))
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    validator = Draft202012Validator(skema, format_checker=FormatChecker())
    lap = Laporan()

    def muat(path, wajib):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            lap.g(str(path), "file tidak ditemukan")
            return None
        except json.JSONDecodeError as e:
            lap.g(path.name, f"JSON rusak: {e}")
            return None
        if "skema" not in data:  # file lama (mis. sample-15.json)
            if wajib:
                lap.g(path.name, "bukan paket berformat skema (field \"skema\" tidak ada)")
            return None
        return data

    # Seluruh bank dimuat untuk pengecekan lintas paket.
    semua = {}
    for path in sorted(BANK.glob("*.json")):
        data = muat(path, wajib=False)
        if data is not None:
            semua[path.resolve()] = (path, data)

    if argv:
        dipilih = []
        for a in argv:
            arg = Path(a)
            if arg.is_dir():
                # Folder: periksa semua *.json di dalamnya. File lama tanpa "skema" dilewati,
                # sama seperti saat tanpa argumen.
                isi = sorted(arg.glob("*.json"))
                if not isi:
                    lap.g(str(arg), "folder tidak berisi file .json")
                target = [(p, False) for p in isi]
            else:
                target = [(arg, True)]
            for p, wajib in target:
                path = p.resolve()
                data = semua[path][1] if path in semua else muat(path, wajib=wajib)
                if data is not None and all(path != x for x, _ in dipilih):
                    semua[path] = (path, data)
                    dipilih.append((path, data))
    else:
        dipilih = list(semua.values())
    semua = list(semua.values())

    for path, paket in dipilih:
        cek_paket(path, paket, config, validator, lap)
    # Pengecekan lintas paket selalu memakai seluruh bank, supaya paket baru dibandingkan dengan yang lama.
    valid = [(p, d) for p, d in semua if not list(validator.iter_errors(d))]
    cek_lintas_paket(valid, lap)

    for x in lap.galat:
        print(f"GALAT       {x}")
    for x in lap.peringatan:
        print(f"PERINGATAN  {x}")
    nama = ", ".join(p.name for p, _ in dipilih) or "-"
    print(f"\n{len(dipilih)} paket diperiksa ({nama}): "
          f"{len(lap.galat)} galat, {len(lap.peringatan)} peringatan")
    return 1 if lap.galat else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
