"""Uji tools/validasi.py dengan salinan bank/p01.json yang sengaja dirusak.

Pakai: python3 tools/test_validasi.py
"""
import copy, json, os, subprocess, sys, tempfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
uji = Path(tempfile.mkdtemp())
# Folder uji dipakai sebagai "folder privat" (tools/lokasi_bank.py) supaya gambar uji ditemukan
# tanpa bergantung pada bank berbayar (yang ada di repo privat SoalSKD-bank).
(uji/"gambar").mkdir()
for n in ("uji-a.svg", "uji-b.svg"):
    (uji/"gambar"/n).write_text(f'<svg xmlns="http://www.w3.org/2000/svg"><title>{n}</title></svg>')
ENV = {**os.environ, "BANK_PRIVAT_DIR": str(uji)}
gagal = []
asli = json.loads((root/"bank/p01.json").read_text())

def jalan(nama, ubah, harap_kode, harap_teks, file=None):
    p = copy.deepcopy(asli); ubah(p)
    f = uji/(file or f"{p['meta']['id']}.json"); f.write_text(json.dumps(p, ensure_ascii=False))
    r = subprocess.run([sys.executable, str(root/"tools/validasi.py"), str(f)], capture_output=True, text=True, env=ENV)
    ok = r.returncode == harap_kode and harap_teks in r.stdout
    print("LULUS" if ok else "GAGAL", nama)
    if not ok:
        gagal.append(nama)
        print(r.stdout)
    f.unlink()

def s(p, n): return p["soal"][n-1]
def ganti_id(p, x="p99"):
    p["meta"]["id"] = x
    for q in p["soal"]: q["id"] = q["id"].replace("p01", x)
def ganti_topik(p):
    ganti_id(p)
    for q in p["soal"]: q["topik"] += " versi baru"; q["pertanyaan"] += " (varian)"

jalan("salinan unik lolos", ganti_topik, 0, "0 galat")
jalan("topik berulang dengan p01", ganti_id, 1, "topik TWK berulang")
jalan("pertanyaan sama persis", lambda p: (ganti_id(p), [q.update(topik=q["topik"]+"x") for q in p["soal"]]), 1, "pertanyaan sama persis")
def tanya_sama_gambar(beda):
    def ubah(p):
        ganti_topik(p)
        gambar = sorted((uji/"gambar").glob("*.svg"))[:2]
        for q, g in zip((s(p,8), s(p,9)), gambar if beda else gambar[:1]*2):
            q.update(pertanyaan="Gambar yang tepat adalah ....", gambar=[{"file": f"gambar/{g.name}", "alt": "x"}])
    return ubah
jalan("pertanyaan sama, gambar beda", tanya_sama_gambar(True), 0, "0 galat")
jalan("pertanyaan dan gambar sama", tanya_sama_gambar(False), 1, "pertanyaan sama persis")
jalan("id sama dengan p01", lambda p: (ganti_topik(p), s(p,1).update(id="p01-001")), 1, "id p01-001")
jalan("galat skema", lambda p: (ganti_topik(p), s(p,14).update(kunci="C")), 1, "GALAT")
jalan("bobot TKP ganda", lambda p: (ganti_topik(p), s(p,14)["bobot"].update(A=5)), 1, "bobot TKP harus")
jalan("opsi tak dijelaskan", lambda p: (ganti_topik(p), s(p,1)["pembahasan"]["opsi"].pop("A")), 1, "belum menjelaskan opsi A")
jalan("pembahasan pendek", lambda p: (ganti_topik(p), s(p,1)["pembahasan"].update(inti="Pendek.", opsi={h:"x" for h in "ABCE"}), s(p,1)["pembahasan"].pop("konsep")), 1, "minimal 150")
jalan("opsi beda simbol tidak kembar", lambda p: (ganti_topik(p), s(p,7)["opsi"].update(A="x > y", B="x < y")), 0, "0 galat")
def panjangkan_terbaik(p):
    ganti_topik(p)
    for q in p["soal"]:
        if q["kategori"] == "TIU":
            terbaik = q.get("kunci")
            q["opsi"][terbaik] = q["opsi"][terbaik] + " " + "x" * 300
jalan("jawaban selalu opsi terpanjang", panjangkan_terbaik, 0, "opsi terpanjang di 7 dari 7")
def bobot4_terpanjang(p):
    # Pola yang lolos cek "terpanjang": opsi bobot 4 dibuat terpanjang dan bobot 5 terpanjang ke-2.
    # Cek ini butuh minimal 10 soal per subtes, jadi soal TKP p01 digandakan dulu.
    ganti_topik(p)
    tkp = [q for q in p["soal"] if q["kategori"] == "TKP"]
    for i, q in enumerate(tkp[:4]):
        b = copy.deepcopy(q); b["nomor"] = len(p["soal"]) + 1; b["id"] = f"p99-{b['nomor']:03d}"
        b["topik"] += f" salinan {i}"; b["pertanyaan"] += f" (salinan {i})"; p["soal"].append(b)
    for q in p["soal"]:
        if q["kategori"] == "TKP":
            h4 = next(h for h, v in q["bobot"].items() if v == 4)
            h5 = next(h for h, v in q["bobot"].items() if v == 5)
            q["opsi"][h4] += " " + "y" * 400
            q["opsi"][h5] += " " + "y" * 300
jalan("bobot 4 TKP selalu terpanjang", bobot4_terpanjang, 0, "opsi bobot 4 adalah opsi terpanjang ke-1 di 11 dari 11")
jalan("bobot 5 TKP selalu terpanjang ke-2", bobot4_terpanjang, 0, "jawaban terbaik adalah opsi terpanjang ke-2 di 11 dari 11")
jalan("opsi kembar", lambda p: (ganti_topik(p), s(p,1)["opsi"].update(B=s(p,1)["opsi"]["A"])), 1, "teks opsi yang sama")
jalan("nomor loncat", lambda p: (ganti_topik(p), s(p,20).update(nomor=21)), 1, "berurutan")
jalan("urutan subtes", lambda p: (ganti_topik(p), p["soal"].insert(0, p["soal"].pop(13)), [q.update(nomor=i+1) for i,q in enumerate(p["soal"])]), 1, "urutan soal")
jalan("nama file != meta.id", ganti_topik, 1, "nama file harus", file="p98.json")
jalan("prefix id salah", lambda p: (ganti_topik(p), s(p,3).update(id="p77-003")), 1, "soal nomor 3)")
jalan("final + catatan_review", lambda p: (ganti_topik(p), p["meta"].update(status="final"), s(p,2).update(catatan_review="cek lagi")), 1, "catatan_review")
jalan("gambar hilang", lambda p: (ganti_topik(p), s(p,7).update(gambar=[{"file":"gambar/tidak-ada.svg","alt":"x"}])), 1, "tidak ditemukan")
jalan("** tak berpasangan", lambda p: (ganti_topik(p), s(p,1).update(tips="Ini **tebal")), 0, "tidak berpasangan")
jalan("LaTeX", lambda p: (ganti_topik(p), s(p,12)["pembahasan"].update(konsep="$\\frac{1}{2}$")), 0, "LaTeX")
jalan("kunci beruntun", lambda p: (ganti_topik(p), [s(p,n).update(kunci="A") for n in (1,2,3,4)], [s(p,n)["pembahasan"]["opsi"].update({h:"Penjelasan opsi ini cukup panjang untuk lolos." for h in "BCDE"}) for n in (1,2,3,4)]), 0, "berturut-turut")

# Argumen berupa folder (python3 tools/validasi.py bank/).
def jalan_folder(nama, isi, harap_kode, harap_teks):
    d = Path(tempfile.mkdtemp())
    for f, data in isi.items():
        (d/f).write_text(data if isinstance(data, str) else json.dumps(data, ensure_ascii=False))
    r = subprocess.run([sys.executable, str(root/"tools/validasi.py"), str(d)], capture_output=True, text=True)
    ok = r.returncode == harap_kode and harap_teks in r.stdout
    print("LULUS" if ok else "GAGAL", nama)
    if not ok:
        gagal.append(nama)
        print(r.stdout, r.stderr)

def paket(ubah):
    p = copy.deepcopy(asli); ubah(p); return p

r = subprocess.run([sys.executable, str(root/"tools/validasi.py"), str(root/"bank")], capture_output=True, text=True)
ok = r.returncode == 0 and "p01.json" in r.stdout and "Traceback" not in r.stderr
print("LULUS" if ok else "GAGAL", "folder bank/ asli")
if not ok: gagal.append("folder bank/ asli"); print(r.stdout, r.stderr)
jalan_folder("folder: paket unik lolos", {"p99.json": paket(ganti_topik)}, 0, "1 paket diperiksa (p99.json)")
jalan_folder("folder: file lama tanpa skema dilewati",
             {"p99.json": paket(ganti_topik), "lama.json": {"meta": {}, "soal": []}}, 0, "1 paket diperiksa (p99.json)")
jalan_folder("folder: paket rusak ikut diperiksa",
             {"p99.json": paket(lambda p: (ganti_topik(p), s(p,14).update(kunci="C")))}, 1, "GALAT")
jalan_folder("folder: JSON rusak", {"p99.json": "{bukan json"}, 1, "JSON rusak")
jalan_folder("folder kosong", {}, 1, "tidak berisi file .json")

print(f"\n{len(gagal)} kasus gagal")
sys.exit(1 if gagal else 0)
