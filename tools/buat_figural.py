#!/usr/bin/env python3
"""Gambar TIU figural (serial, analogi, penalaran matriks) untuk bank/gambar/.

Kisi-kisi TIU figural mengikuti KepmenPANRB 674/2026: serial, analogi, dan penalaran matriks.
Ketidaksamaan gambar tidak lagi tercantum, jadi tidak dipakai lagi.

Setiap soal figural didefinisikan sebagai *keadaan* (state) per gambar, lalu:
1. aturannya diterapkan secara terprogram untuk mencari jawaban, dan dicek bahwa tepat satu opsi
   benar (serial/analogi/matriks) atau tepat satu gambar melanggar aturan (ketidaksamaan, jenis lama);
2. kunci di bank/<paket>.json harus sama dengan hasil itu;
3. SVG digambar ulang dari state yang sama ke bank/gambar/<id>-soal.svg (dan -opsi.svg).

Teks soal dan pembahasan tetap di bank/*.json (sumber utama). Skrip ini hanya menjaga gambar dan
kuncinya tetap cocok.

Aturan visual: hitam/putih/garis saja (tidak bergantung warna), latar putih sendiri (terbaca di tema
gelap), garis 3 satuan per sel 100 satuan supaya tetap tebal di layar HP (sel ±60 px).

Pakai:  python3 tools/buat_figural.py          # cek + tulis SVG
        python3 tools/buat_figural.py --cek    # cek saja, tanpa menulis
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lokasi_bank import file_paket  # noqa: E402

BANK = ROOT / "bank"  # bawaan; paket berbayar ada di folder privat (tools/lokasi_bank.py)
DIR_GAMBAR = BANK / "gambar"

TINTA = "#111827"
KERTAS = "#FFFFFF"
BINGKAI = "#6B7280"
HURUF = "ABCDE"

# ---------------------------------------------------------------- primitif (koordinat sel 0..100)


def f(x: float) -> str:
    return f"{x:.1f}".rstrip("0").rstrip(".")


def titik_poligon(n, cx=50, cy=50, r=36, rot=0.0):
    return [(cx + r * math.cos(math.radians(-90 + rot + 360 * i / n)),
             cy + r * math.sin(math.radians(-90 + rot + 360 * i / n))) for i in range(n)]


def poligon(pts, isi="putih", tebal=3):
    warna = TINTA if isi == "hitam" else KERTAS
    p = " ".join(f"{f(x)},{f(y)}" for x, y in pts)
    return f'<polygon points="{p}" fill="{warna}" stroke="{TINTA}" stroke-width="{tebal}" stroke-linejoin="round"/>'


def bentuk(n, cx=50, cy=50, r=36, isi="putih", rot=0.0, tebal=3):
    """n = jumlah sisi; 0 = lingkaran."""
    if n == 0:
        warna = TINTA if isi == "hitam" else KERTAS
        return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{warna}" stroke="{TINTA}" stroke-width="{tebal}"/>'
    return poligon(titik_poligon(n, cx, cy, r, rot), isi, tebal)


TATA_LETAK = {  # posisi satuan untuk 1..9 benda kecil
    1: [(0, 0)],
    2: [(-1, 0), (1, 0)],
    3: [(-1, 0.8), (1, 0.8), (0, -0.9)],
    4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
    5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)],
    6: [(-1, -0.7), (0, -0.7), (1, -0.7), (-1, 0.7), (0, 0.7), (1, 0.7)],
    7: [(-1, -1), (0, -1), (1, -1), (0, 0), (-1, 1), (0, 1), (1, 1)],
    8: [(x, y) for y in (-1, 0, 1) for x in (-1, 0, 1) if (x, y) != (0, 0)],
    9: [(x, y) for y in (-1, 0, 1) for x in (-1, 0, 1)],
}


def titik_titik(k, cx=50, cy=50, jarak=11, r=4.5, warna=TINTA):
    return "".join(f'<circle cx="{f(cx + x * jarak)}" cy="{f(cy + y * jarak)}" r="{r}" fill="{warna}"/>'
                   for x, y in TATA_LETAK[k])


def benda_kecil(jenis, k, jarak=26, skala=1.0):
    """k benda kecil (lingkaran/persegi/segitiga) dalam tata letak 3×3."""
    out = []
    for x, y in TATA_LETAK[k]:
        cx, cy = 50 + x * jarak, 50 + y * jarak
        if jenis == "lingkaran":
            out.append(bentuk(0, cx, cy, 9 * skala, "hitam", tebal=2))
        elif jenis == "persegi":
            out.append(bentuk(4, cx, cy, 12 * skala, "putih", rot=45, tebal=2.5))
        else:
            out.append(bentuk(3, cx, cy + 2, 12 * skala, "hitam", tebal=2))
    return "".join(out)


def transformasi(pts, putar=0, cermin=False, balik=False):
    """putar = kelipatan 90° searah jarum jam; cermin = kiri-kanan; balik = atas-bawah. Pusat (50,50)."""
    out = []
    for x, y in pts:
        if cermin:
            x = 100 - x
        if balik:
            y = 100 - y
        for _ in range(putar % 4):
            x, y = 100 - y, x
        out.append((x, y))
    return out


def panah(sudut, cx=50, cy=50, s=1.0):
    base = [(0, -34), (22, -8), (8, -8), (8, 32), (-8, 32), (-8, -8), (-22, -8)]
    a = math.radians(sudut)
    pts = [(cx + s * (x * math.cos(a) - y * math.sin(a)), cy + s * (x * math.sin(a) + y * math.cos(a))) for x, y in base]
    return poligon(pts, "hitam")


# ---------------------------------------------------------------- tata letak SVG

SEL = 100


def sel(isi, x, y, label=None, tanya=False):
    garis = f'stroke-dasharray="6 5"' if tanya else ""
    out = [f'<g transform="translate({x},{y})">',
           f'<rect x="1" y="1" width="{SEL - 2}" height="{SEL - 2}" rx="8" fill="{KERTAS}" stroke="{BINGKAI}" stroke-width="1.5" {garis}/>']
    if tanya:
        out.append(f'<text x="50" y="66" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" '
                   f'font-size="44" font-weight="700" fill="{TINTA}">?</text>')
    else:
        out.append(isi)
    out.append("</g>")
    if label:
        out.append(f'<text x="{x + SEL / 2}" y="{y + SEL + 21}" text-anchor="middle" '
                   f'font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="{TINTA}">{label}</text>')
    return "".join(out)


def svg(lebar, tinggi, isi, judul):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lebar} {tinggi}" role="img">'
            f"<title>{judul}</title>"
            f'<rect width="{lebar}" height="{tinggi}" fill="{KERTAS}"/>{isi}</svg>\n')


def svg_deret(frames, judul):
    """Serial: gambar 1..n lalu sel tanda tanya."""
    jarak, tepi = 12, 10
    n = len(frames) + 1
    isi = "".join(sel(fr, tepi + i * (SEL + jarak), tepi) for i, fr in enumerate(frames))
    isi += sel("", tepi + len(frames) * (SEL + jarak), tepi, tanya=True)
    return svg(2 * tepi + n * SEL + (n - 1) * jarak, SEL + 2 * tepi, isi, judul)


def svg_analogi(a, b, c, judul):
    sim, tepi = 30, 10
    isi, x = [], tepi
    for i, fr in enumerate([a, b, c, None]):
        isi.append(sel(fr or "", x, tepi, tanya=fr is None))
        x += SEL
        if i < 3:
            tanda = "=" if i == 1 else ":"
            isi.append(f'<text x="{x + sim / 2}" y="{tepi + 62}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" '
                       f'font-size="34" font-weight="700" fill="{TINTA}">{tanda}</text>')
            x += sim
    return svg(x + tepi, SEL + 2 * tepi, "".join(isi), judul)


def svg_matriks(frames, judul):
    """Penalaran matriks: kisi 3 × 3, sel kanan bawah bertanda tanya (frames berisi 8 gambar)."""
    jarak, tepi = 12, 10
    isi = []
    for i in range(9):
        r, k = divmod(i, 3)
        x, y = tepi + k * (SEL + jarak), tepi + r * (SEL + jarak)
        isi.append(sel("", x, y, tanya=True) if i == 8 else sel(frames[i], x, y))
    sisi = 2 * tepi + 3 * SEL + 2 * jarak
    return svg(sisi, sisi, "".join(isi), judul)


def svg_pilihan(frames, judul):
    """Lima gambar berlabel A–E: 3 di baris atas, 2 di baris bawah (tetap besar di layar HP)."""
    jarak, tepi, baris = 16, 10, SEL + 30
    isi = []
    for i, fr in enumerate(frames):
        r, k = divmod(i, 3)
        x0 = tepi + (SEL + jarak) / 2 if r == 1 else tepi
        isi.append(sel(fr, x0 + k * (SEL + jarak), tepi + r * baris, label=HURUF[i]))
    return svg(2 * tepi + 3 * SEL + 2 * jarak, 2 * tepi + 2 * baris - 4, "".join(isi), judul)


# ---------------------------------------------------------------- penggambar per jenis state


def gb_panah(s):  # s = sudut
    return panah(s)


def gb_luar_dalam(s):  # (sisi luar, sisi dalam); 0 = lingkaran
    luar, dalam = s
    rot = lambda n: 45 if n == 4 else 0  # noqa: E731  persegi tegak, bukan belah ketupat
    return bentuk(luar, r=40, rot=rot(luar)) + bentuk(dalam, r=15, isi="hitam", rot=rot(dalam))


def gb_titik_dalam_bentuk(s):  # (sisi, jumlah titik, isi)
    n, k, isi = s
    warna_titik = KERTAS if isi == "hitam" else TINTA
    return bentuk(n, r=40, isi=isi, rot=45 if n == 4 else 0, cy=52 if n == 3 else 50) + \
        titik_titik(k, cy=56 if n == 3 else 50, jarak=10, warna=warna_titik)


POLIOMINO = {
    "L": [(0, 0), (0, 1), (0, 2), (1, 2)],
    "P": [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2)],
    "F": [(1, 0), (2, 0), (0, 1), (1, 1), (1, 2)],
}


def sel_poliomino(nama, putar=0, cermin=False):
    sel_ = POLIOMINO[nama]
    if cermin:
        sel_ = [(-x, y) for x, y in sel_]
    for _ in range(putar % 4):
        sel_ = [(-y, x) for x, y in sel_]
    mx, my = min(x for x, _ in sel_), min(y for _, y in sel_)
    return frozenset((x - mx, y - my) for x, y in sel_)


def gb_poliomino(s):  # (nama, putar, cermin, isi)
    nama, putar, cermin, isi = s
    sel_ = sel_poliomino(nama, putar, cermin)
    u = 20
    w = (max(x for x, _ in sel_) + 1) * u
    h = (max(y for _, y in sel_) + 1) * u
    ox, oy = 50 - w / 2, 50 - h / 2
    warna = TINTA if isi == "hitam" else KERTAS
    return "".join(f'<rect x="{f(ox + x * u)}" y="{f(oy + y * u)}" width="{u}" height="{u}" fill="{warna}" '
                   f'stroke="{TINTA}" stroke-width="2.5"/>' for x, y in sorted(sel_))


def gb_sisi_isi(s):  # (sisi, isi)
    n, isi = s
    return bentuk(n, r=40, isi=isi, cy=53 if n == 3 else 50)


def gb_bangun_tegak(s):  # (sisi, isi); persegi digambar tegak, bukan belah ketupat
    n, isi = s
    return bentuk(n, r=40, isi=isi, rot=45 if n == 4 else 0, cy=53 if n == 3 else 50)


SUDUT4 = {"KA": (11, 11), "KN": (89, 11), "BN": (89, 89), "BA": (11, 89)}  # kiri-atas, kanan-atas, ...
URUT_SUDUT = ["KA", "KN", "BN", "BA"]


def gb_sudut_garis(s):  # (sudut titik, jumlah garis)
    sudut, n = s
    out = [f'<rect x="24" y="24" width="52" height="52" fill="{KERTAS}" stroke="{TINTA}" stroke-width="3"/>']
    for i in range(1, n + 1):
        x = 24 + 52 * i / (n + 1)
        out.append(f'<line x1="{f(x)}" y1="24" x2="{f(x)}" y2="76" stroke="{TINTA}" stroke-width="3"/>')
    cx, cy = SUDUT4[sudut]
    out.append(f'<circle cx="{cx}" cy="{cy}" r="7" fill="{TINTA}"/>')
    return "".join(out)


def kotak_grid(i):  # sel 1..9, urutan baca
    r, c = divmod(i - 1, 3)
    return 14 + c * 24, 14 + r * 24


def gb_grid(s):  # (sel hitam, sel silang) atau (frozenset hitam, None)
    hitam, silang = s
    hitam = {hitam} if isinstance(hitam, int) else set(hitam)
    out = []
    for i in range(1, 10):
        x, y = kotak_grid(i)
        out.append(f'<rect x="{x}" y="{y}" width="24" height="24" fill="{TINTA if i in hitam else KERTAS}" '
                   f'stroke="{TINTA}" stroke-width="2"/>')
    if silang:
        x, y = kotak_grid(silang)
        out.append(f'<path d="M{x + 5} {y + 5}L{x + 19} {y + 19}M{x + 19} {y + 5}L{x + 5} {y + 19}" '
                   f'stroke="{TINTA}" stroke-width="3.5" stroke-linecap="round"/>')
    return "".join(out)


def gb_bendera(s):  # (bentuk, putar, cermin, balik)
    nama, putar, cermin, balik = s
    if nama == "bendera":
        tiang = transformasi([(34, 14), (34, 86)], putar, cermin, balik)
        kain = transformasi([(34, 16), (74, 32), (34, 48)], putar, cermin, balik)
        (x1, y1), (x2, y2) = tiang
        return (f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{TINTA}" stroke-width="5" '
                f'stroke-linecap="round"/>' + poligon(kain, "hitam"))
    sepatu = [(30, 16), (52, 16), (52, 62), (78, 62), (78, 84), (30, 84)]
    return poligon(transformasi(sepatu, putar, cermin, balik), "hitam")


BENTUK_SIMETRI = {
    "rumah": [(50, 14), (84, 42), (84, 86), (16, 86), (16, 42)],
    "panah": [(86, 50), (56, 20), (56, 38), (14, 38), (14, 62), (56, 62), (56, 80)],
    "trapesium": [(32, 14), (68, 30), (68, 70), (32, 86)],
    "plus": [(38, 14), (62, 14), (62, 38), (86, 38), (86, 62), (62, 62), (62, 86), (38, 86), (38, 62),
             (14, 62), (14, 38), (38, 38)],
    "takik": [(22, 16), (78, 16), (78, 48), (58, 48), (58, 84), (22, 84)],
}


def punya_sumbu_simetri(pts):
    """Cerminkan titik sudut terhadap sumbu tegak, mendatar, dan dua diagonal melalui pusat kotak batas."""
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    asal = {(round(x, 3), round(y, 3)) for x, y in pts}
    cermin = [lambda x, y: (2 * cx - x, y), lambda x, y: (x, 2 * cy - y),
              lambda x, y: (cx + (y - cy), cy + (x - cx)), lambda x, y: (cx - (y - cy), cy - (x - cx))]
    return any({(round(a, 3), round(b, 3)) for a, b in (g(x, y) for x, y in pts)} == asal for g in cermin)


def gb_simetri(s):
    return poligon(BENTUK_SIMETRI[s], "putih")


def gb_kelompok(s):  # (jenis, jumlah, besar)
    jenis, k, besar = s
    return benda_kecil(jenis, k, skala=1.45 if besar else 1.0)


def potong(pts, bagian):
    """Potong poligon dengan garis tengah (x=50 atau y=50), sisakan bagian kiri/kanan/atas/bawah."""
    sumbu, simpan = {"kiri": (0, lambda v: v <= 50), "kanan": (0, lambda v: v >= 50),
                     "atas": (1, lambda v: v <= 50), "bawah": (1, lambda v: v >= 50)}[bagian]
    out = []
    for i, a in enumerate(pts):
        b = pts[(i + 1) % len(pts)]
        if simpan(a[sumbu]):
            out.append(a)
        if simpan(a[sumbu]) != simpan(b[sumbu]):
            k = (50 - a[sumbu]) / (b[sumbu] - a[sumbu])
            out.append((a[0] + k * (b[0] - a[0]), a[1] + k * (b[1] - a[1])))
    return out


RUMAH = [(50, 14), (86, 44), (86, 86), (14, 86), (14, 44)]


def gb_belah(s):  # (bentuk, bagian): bagian yang tersisa digambar hitam, garis putus-putus = bentuk utuh
    nama, bagian = s
    if nama == "lingkaran":
        utuh = f'<circle cx="50" cy="50" r="36" fill="none" stroke="{BINGKAI}" stroke-width="2" stroke-dasharray="5 4"/>'
        if bagian == "utuh":
            return bentuk(0, r=36, isi="hitam")
        busur = {"kiri": "M50 14A36 36 0 0 0 50 86Z", "kanan": "M50 14A36 36 0 0 1 50 86Z"}[bagian]
        return utuh + f'<path d="{busur}" fill="{TINTA}" stroke="{TINTA}" stroke-width="3" stroke-linejoin="round"/>'
    garis = " ".join(f"{f(x)},{f(y)}" for x, y in RUMAH)
    utuh = f'<polygon points="{garis}" fill="none" stroke="{BINGKAI}" stroke-width="2" stroke-dasharray="5 4"/>'
    if bagian == "utuh":
        return poligon(RUMAH, "hitam")
    return utuh + poligon(potong(RUMAH, bagian), "hitam")


POS8 = [(16, 16), (50, 16), (84, 16), (84, 50), (84, 84), (50, 84), (16, 84), (16, 50)]  # searah jarum jam dari kiri-atas


def gb_dua_benda(s):  # (posisi lingkaran, posisi segitiga) pada 8 titik keliling
    lc, sg = s
    out = [f'<rect x="16" y="16" width="68" height="68" fill="none" stroke="{BINGKAI}" stroke-width="1.5" stroke-dasharray="4 4"/>']
    x, y = POS8[lc]
    out.append(bentuk(0, x, y, 10, "putih"))
    x, y = POS8[sg]
    out.append(bentuk(3, x, y + 2, 13, "hitam", tebal=2))
    return "".join(out)


def gb_pecahan(s):  # (jumlah juring, juring berarsir sebagai indeks)
    n, arsir = s
    out = []
    for i in range(n):
        a0, a1 = math.radians(-90 + 360 * i / n), math.radians(-90 + 360 * (i + 1) / n)
        x0, y0 = 50 + 38 * math.cos(a0), 50 + 38 * math.sin(a0)
        x1, y1 = 50 + 38 * math.cos(a1), 50 + 38 * math.sin(a1)
        warna = TINTA if i in arsir else KERTAS
        out.append(f'<path d="M50 50L{f(x0)} {f(y0)}A38 38 0 0 1 {f(x1)} {f(y1)}Z" fill="{warna}" '
                   f'stroke="{TINTA}" stroke-width="2.5" stroke-linejoin="round"/>')
    return "".join(out)


def gb_panah_titik(s):  # (sudut panah, sudut titik)
    sudut, pojok = s
    cx, cy = SUDUT4[pojok]
    return panah(sudut, s=0.85) + f'<circle cx="{cx + (6 if cx < 50 else -6)}" cy="{cy + (6 if cy < 50 else -6)}" r="8" fill="{TINTA}"/>'


# lingkaran + segitiga yang bertumpang tindih, plus satu titik
def di_lingkaran(p, c, r):
    return math.dist(p, c) < r


def di_segitiga(p, t):
    def sisi(a, b):
        return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    d = [sisi(t[i], t[(i + 1) % 3]) for i in range(3)]
    return all(x > 0 for x in d) or all(x < 0 for x in d)


def jarak_ke_ruas(p, a, b):
    ax, ay = a
    bx, by = b
    t = max(0, min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
    return math.dist(p, (ax + t * (bx - ax), ay + t * (by - ay)))


def daerah(p, c, r, t):
    return (di_lingkaran(p, c, r), di_segitiga(p, t))


def ruang(p, c, r, t):
    return min(abs(math.dist(p, c) - r), *(jarak_ke_ruas(p, t[i], t[(i + 1) % 3]) for i in range(3)))


def cari_titik(c, r, t, target):
    """Titik di daerah target dengan jarak terbesar ke semua garis (supaya jelas di layar kecil)."""
    terbaik = None
    for x in range(10, 91):
        for y in range(10, 91):
            p = (x, y)
            if daerah(p, c, r, t) == target:
                g = ruang(p, c, r, t)
                if terbaik is None or g > terbaik[0]:
                    terbaik = (g, p)
    return terbaik[1]


def gb_tumpang(s):  # (pusat, jari, segitiga, titik)
    c, r, t, p = s
    return (bentuk(0, c[0], c[1], r, "putih", tebal=3).replace(f'fill="{KERTAS}"', 'fill="none"')
            + poligon(t, "putih").replace(f'fill="{KERTAS}"', 'fill="none"')
            + f'<circle cx="{f(p[0])}" cy="{f(p[1])}" r="5.5" fill="{TINTA}"/>')


# ---------------------------------------------------------------- definisi soal

SOAL: list[dict] = []


def serial(id_, gambar, stem, opsi, aturan, alt_soal, alt_opsi):
    harap = aturan(stem)
    cocok = [HURUF[i] for i, o in enumerate(opsi) if o == harap]
    SOAL.append(dict(id=id_, jenis="serial", gambar=gambar, stem=stem, opsi=opsi, cocok=cocok,
                     alt_soal=alt_soal, alt_opsi=alt_opsi))


def analogi(id_, gambar, a, b, c, opsi, aturan, alt_soal, alt_opsi, salah=(), tandingan=()):
    assert aturan(a) == b, f"{id_}: aturan tidak memetakan A ke B"
    for nama, g in salah:  # tafsiran lain yang masuk akal tidak boleh juga memetakan A ke B
        assert g(a) != b, f"{id_}: tafsiran '{nama}' juga cocok untuk A→B"
    harap = aturan(c)
    for nama, g in tandingan:  # tafsiran yang juga cocok untuk A→B: hasilnya tidak boleh ada di pilihan
        assert g(a) == b and (g(c) == harap or g(c) not in opsi), f"{id_}: tafsiran '{nama}' menghasilkan pilihan lain"
    cocok = [HURUF[i] for i, o in enumerate(opsi) if o == harap]
    SOAL.append(dict(id=id_, jenis="analogi", gambar=gambar, stem=[a, b, c], opsi=opsi, cocok=cocok,
                     alt_soal=alt_soal, alt_opsi=alt_opsi))


def matriks(id_, gambar, aturan, opsi, alt_soal, alt_opsi, salah=(), tandingan=()):
    """aturan(baris, kolom) -> state untuk kisi 3 × 3; sel (2, 2) adalah yang ditanyakan.

    salah: tafsiran lain yang masuk akal tetapi tidak boleh cocok dengan delapan sel yang terlihat.
    tandingan: tafsiran lain yang cocok dengan delapan sel; hasilnya harus sama atau tidak ada di pilihan.
    """
    sel9 = [(r, k) for r in range(3) for k in range(3)]
    tampak = sel9[:8]
    stem = [aturan(r, k) for r, k in tampak]
    harap = aturan(2, 2)
    for nama, g in salah:
        assert any(g(r, k) != aturan(r, k) for r, k in tampak), f"{id_}: tafsiran '{nama}' juga cocok"
    for nama, g in tandingan:
        assert all(g(r, k) == aturan(r, k) for r, k in tampak), f"{id_}: tandingan '{nama}' tidak cocok"
        assert g(2, 2) == harap or g(2, 2) not in opsi, f"{id_}: tafsiran '{nama}' menghasilkan pilihan lain"
    cocok = [HURUF[i] for i, o in enumerate(opsi) if o == harap]
    SOAL.append(dict(id=id_, jenis="matriks", gambar=gambar, stem=stem, opsi=opsi, cocok=cocok,
                     alt_soal=alt_soal, alt_opsi=alt_opsi))


def beda(id_, gambar, fig, predikat, alt_soal):
    cocok = [HURUF[i] for i, s in enumerate(fig) if not predikat(s)]
    SOAL.append(dict(id=id_, jenis="beda", gambar=gambar, stem=fig, opsi=None, cocok=cocok,
                     alt_soal=alt_soal, alt_opsi=None))


ARAH = {0: "atas", 45: "kanan atas", 90: "kanan", 135: "kanan bawah", 180: "bawah", 225: "kiri bawah",
        270: "kiri", 315: "kiri atas"}

# --- p02 ---------------------------------------------------------------
serial("p02-065", gb_panah, [0, 45, 90, 135], [225, 90, 180, 0, 270], lambda s: (s[-1] + 45) % 360,
       "Empat gambar berurutan berisi satu panah hitam: gambar 1 menunjuk ke atas, gambar 2 ke kanan atas, "
       "gambar 3 ke kanan, gambar 4 ke kanan bawah, lalu sel kelima bertanda tanya.",
       "Pilihan: A panah ke kiri bawah, B panah ke kanan, C panah ke bawah, D panah ke atas, E panah ke kiri.")

analogi("p02-062", gb_luar_dalam, (4, 0), (0, 4), (3, 6),
        [(6, 3), (3, 6), (6, 0), (3, 3), (0, 4)], lambda s: (s[1], s[0]),
        "Analogi: gambar pertama persegi besar berisi lingkaran kecil hitam; gambar kedua lingkaran besar "
        "berisi persegi kecil hitam; gambar ketiga segitiga besar berisi segi enam kecil hitam; gambar keempat "
        "bertanda tanya.",
        "Pilihan: A segi enam besar berisi segitiga kecil hitam; B segitiga besar berisi segi enam kecil hitam; "
        "C segi enam besar berisi lingkaran kecil hitam; D segitiga besar berisi segitiga kecil hitam; "
        "E lingkaran besar berisi persegi kecil hitam.",
        salah=[("bentuk luar tetap", lambda s: (s[0], s[1]))],
        tandingan=[("luar selalu lingkaran, luar lama menjadi isi", lambda s: (0, s[0]))])

matriks("p02-064", gb_panah, lambda r, k: (90 * k + 45 * r) % 360,
        [315, 180, 225, 270, 0],
        "Kisi 3 × 3 berisi panah hitam, sel kanan bawah bertanda tanya. Baris 1: panah ke atas, ke kanan, "
        "ke bawah. Baris 2: panah ke kanan atas, ke kanan bawah, ke kiri bawah. Baris 3: panah ke kanan, "
        "ke bawah, lalu tanda tanya.",
        "Pilihan: A panah ke kiri atas, B panah ke bawah, C panah ke kiri bawah, D panah ke kiri, E panah ke atas.",
        salah=[("setiap baris sama", lambda r, k: 90 * k % 360),
               ("putar 45° per kolom", lambda r, k: (45 * k + 45 * r) % 360)],
        tandingan=[("ke bawah: putar 45° per baris", lambda r, k: (45 * r + 90 * k) % 360)])

# --- p03 ---------------------------------------------------------------
putar_cw_balik = lambda s: (s[0], (s[1] + 1) % 4, s[2], "putih" if s[3] == "hitam" else "hitam")  # noqa: E731


def sama_poliomino(a, b):
    return (a[0], a[3]) == (b[0], b[3]) and sel_poliomino(a[0], a[1], a[2]) == sel_poliomino(b[0], b[1], b[2])


def aturan_p03_062(s):
    return putar_cw_balik(s)


analogi("p03-062", gb_poliomino, ("L", 0, False, "hitam"), ("L", 1, False, "putih"), ("P", 1, False, "putih"),
        [("P", 2, False, "hitam"), ("P", 2, False, "putih"), ("P", 0, False, "hitam"), ("P", 2, True, "hitam"),
         ("P", 1, False, "hitam")],
        aturan_p03_062,
        "Analogi dengan bangun dari persegi-persegi kecil. Gambar pertama: bangun hitam dari empat persegi, tiga "
        "tersusun tegak dan satu menempel di kanan persegi paling bawah. Gambar kedua: bangun yang sama berwarna "
        "putih, tiga persegi mendatar di atas dan satu menempel di bawah persegi paling kiri. Gambar ketiga: "
        "bangun putih dari lima persegi, blok 2 × 2 di kanan dan satu persegi di kiri baris atas. Gambar keempat "
        "bertanda tanya.",
        "Pilihan bangun dari lima persegi: A hitam, blok 2 × 2 di bawah dan satu persegi di kanan atas; B putih, "
        "blok 2 × 2 di bawah dan satu persegi di kanan atas; C hitam, blok 2 × 2 di atas dan satu persegi di kiri "
        "bawah; D hitam, blok 2 × 2 di bawah dan satu persegi di kiri atas; E hitam, blok 2 × 2 di kanan dan satu "
        "persegi di kiri baris atas.",
        salah=[("putar berlawanan jarum jam", lambda s: (s[0], (s[1] - 1) % 4, s[2], "putih")),
               ("cermin", lambda s: (s[0], s[1], not s[2], "putih")),
               ("putar 180°", lambda s: (s[0], (s[1] + 2) % 4, s[2], "putih"))])

_m = {(0, 0): {1, 2, 5}, (0, 1): {2, 3, 9}, (1, 0): {4, 5, 7}, (1, 1): {5, 6, 7}, (2, 0): {1, 6, 8},
      (2, 1): {3, 6, 9}}


def _xor(r, k):
    if k < 2:
        return (frozenset(_m[(r, k)]), None)
    return (frozenset(_m[(r, 0)] ^ _m[(r, 1)]), None)


matriks("p03-063", gb_grid, _xor,
        [(frozenset({1, 3, 6, 8, 9}), None), (frozenset({6}), None), (frozenset({1, 8}), None),
         (frozenset({1, 3, 8, 9}), None), (frozenset({1, 3, 8}), None)],
        "Kisi besar 3 × 3. Setiap sel berisi kisi kecil 3 × 3 (petak dinomori 1–9 dari kiri atas, baris demi "
        "baris) dengan beberapa petak hitam. Baris 1: petak 1, 2, 5 | petak 2, 3, 9 | petak 1, 3, 5, 9. "
        "Baris 2: petak 4, 5, 7 | petak 5, 6, 7 | petak 4, 6. Baris 3: petak 1, 6, 8 | petak 3, 6, 9 | "
        "tanda tanya.",
        "Pilihan kisi kecil dengan petak hitam: A petak 1, 3, 6, 8, 9; B petak 6; C petak 1, 8; "
        "D petak 1, 3, 8, 9; E petak 1, 3, 8.",
        salah=[("gabungan", lambda r, k: (frozenset(_m[(r, 0)] | _m[(r, 1)]), None) if k == 2 else _xor(r, k)),
               ("irisan", lambda r, k: (frozenset(_m[(r, 0)] & _m[(r, 1)]), None) if k == 2 else _xor(r, k)),
               ("kiri dikurangi tengah", lambda r, k: (frozenset(_m[(r, 0)] - _m[(r, 1)]), None) if k == 2
                else _xor(r, k))])

serial("p03-065", gb_sisi_isi, [(3, "putih"), (4, "hitam"), (5, "putih"), (6, "hitam")],
       [(7, "hitam"), (6, "putih"), (7, "putih"), (8, "putih"), (5, "hitam")],
       lambda s: (s[-1][0] + 1, "putih" if s[-1][1] == "hitam" else "hitam"),
       "Empat gambar berurutan: segitiga putih, persegi hitam, segi lima putih, segi enam hitam, lalu sel "
       "kelima bertanda tanya.",
       "Pilihan: A segi tujuh hitam, B segi enam putih, C segi tujuh putih, D segi delapan putih, E segi lima hitam.")

# --- p04 ---------------------------------------------------------------
serial("p04-058", gb_sudut_garis, [("KA", 1), ("KN", 2), ("BN", 3), ("BA", 4)],
       [("KA", 4), ("KA", 5), ("KN", 5), ("BA", 5), ("KA", 6)],
       lambda s: (URUT_SUDUT[(URUT_SUDUT.index(s[-1][0]) + 1) % 4], s[-1][1] + 1),
       "Empat gambar berurutan, masing-masing persegi bergaris tegak dengan satu titik hitam di salah satu "
       "pojok sel. Gambar 1: titik kiri atas, 1 garis. Gambar 2: titik kanan atas, 2 garis. Gambar 3: titik "
       "kanan bawah, 3 garis. Gambar 4: titik kiri bawah, 4 garis. Sel kelima bertanda tanya.",
       "Pilihan: A titik kiri atas, 4 garis; B titik kiri atas, 5 garis; C titik kanan atas, 5 garis; "
       "D titik kiri bawah, 5 garis; E titik kiri atas, 6 garis.")

_jml = {(0, 0): 1, (0, 1): 2, (1, 0): 3, (1, 1): 1, (2, 0): 2, (2, 1): 3}


def _jumlah(r, k):
    return ("lingkaran", _jml[(r, k)] if k < 2 else _jml[(r, 0)] + _jml[(r, 1)], False)


matriks("p04-060", gb_kelompok, _jumlah,
        [("lingkaran", 6, False), ("lingkaran", 4, False), ("persegi", 5, False), ("lingkaran", 1, False),
         ("lingkaran", 5, False)],
        "Kisi 3 × 3 berisi lingkaran hitam kecil, sel kanan bawah bertanda tanya. Baris 1: 1, 2, 3 lingkaran. "
        "Baris 2: 3, 1, 4 lingkaran. Baris 3: 2, 3 lingkaran, lalu tanda tanya.",
        "Pilihan: A 6 lingkaran hitam kecil; B 4 lingkaran hitam kecil; C 5 persegi putih kecil; "
        "D 1 lingkaran hitam kecil; E 5 lingkaran hitam kecil.",
        salah=[("kolom ketiga hasil kali", lambda r, k: ("lingkaran", _jml[(r, 0)] * _jml[(r, 1)], False)
                if k == 2 else _jumlah(r, k)),
               ("kolom ketiga selisih", lambda r, k: ("lingkaran", abs(_jml[(r, 0)] - _jml[(r, 1)]), False)
                if k == 2 else _jumlah(r, k))],
        tandingan=[("kolom ketiga bertambah satu ke bawah", lambda r, k: ("lingkaran", 3 + r, False)
                    if k == 2 else _jumlah(r, k))])

analogi("p04-061", gb_bendera, ("bendera", 0, False, False), ("bendera", 0, True, False),
        ("sepatu", 0, False, False),
        [("sepatu", 0, True, False), ("sepatu", 0, False, True), ("sepatu", 2, False, False),
         ("sepatu", 0, False, False), ("sepatu", 1, False, False)],
        lambda s: (s[0], s[1], not s[2], s[3]),
        "Analogi: gambar pertama bendera dengan tiang di kiri dan kain segitiga hitam menunjuk ke kanan di "
        "bagian atas; gambar kedua bendera dengan tiang di kanan dan kain menunjuk ke kiri di bagian atas; "
        "gambar ketiga bangun hitam berbentuk huruf L (batang tegak di kiri, kaki menjulur ke kanan di bawah); "
        "gambar keempat bertanda tanya.",
        "Pilihan: A bangun L dengan batang di kanan dan kaki ke kiri di bawah; B batang di kiri dan kaki ke kanan "
        "di atas; C batang di kanan dan kaki ke kiri di atas; D sama dengan gambar ketiga; E bangun rebah dengan "
        "batang mendatar di atas dan kaki menurun di kiri.",
        salah=[("putar 180°", lambda s: (s[0], (s[1] + 2) % 4, s[2], s[3])),
               ("balik atas-bawah", lambda s: (s[0], s[1], s[2], not s[3]))])

# --- p05 ---------------------------------------------------------------
analogi("p05-053", gb_panah_titik, (0, "KA"), (90, "KA"), (270, "BN"),
        [(0, "BA"), (180, "BN"), (90, "BN"), (0, "BN"), (0, "KA")],
        lambda s: ((s[0] + 90) % 360, s[1]),
        "Analogi: gambar pertama panah hitam ke atas dengan titik hitam di pojok kiri atas; gambar kedua panah "
        "ke kanan dengan titik di pojok kiri atas; gambar ketiga panah ke kiri dengan titik di pojok kanan "
        "bawah; gambar keempat bertanda tanya.",
        "Pilihan: A panah ke atas, titik kiri bawah; B panah ke bawah, titik kanan bawah; C panah ke kanan, "
        "titik kanan bawah; D panah ke atas, titik kanan bawah; E panah ke atas, titik kiri atas.",
        salah=[("seluruh gambar diputar 90° searah jarum jam", lambda s: ((s[0] + 90) % 360,
                                                                            URUT_SUDUT[(URUT_SUDUT.index(s[1]) + 1) % 4]))])

serial("p05-054", gb_grid, [(1, 9), (3, 8), (5, 7), (7, 6)], [(9, 5), (9, 4), (8, 5), (1, 5), (9, 6)],
       lambda s: ((s[-1][0] + 2 - 1) % 9 + 1, (s[-1][1] - 1 - 1) % 9 + 1),
       "Empat gambar berurutan berupa kisi 3 × 3 (petak dinomori 1–9 dari kiri atas, baris demi baris) dengan "
       "satu petak hitam dan satu tanda silang. Gambar 1: hitam di petak 1, silang di petak 9. Gambar 2: hitam "
       "3, silang 8. Gambar 3: hitam 5, silang 7. Gambar 4: hitam 7, silang 6. Sel kelima bertanda tanya.",
       "Pilihan: A hitam 9, silang 5; B hitam 9, silang 4; C hitam 8, silang 5; D hitam 1, silang 5; "
       "E hitam 9, silang 6.")

_latin = [[3, 4, 0], [0, 3, 4], [4, 0, 3]]
matriks("p05-060", gb_bangun_tegak, lambda r, k: (_latin[r][k], "putih"),
        [(4, "putih"), (0, "putih"), (5, "putih"), (3, "hitam"), (3, "putih")],
        "Kisi 3 × 3 berisi bangun putih bergaris tepi hitam, sel kanan bawah bertanda tanya. Baris 1: "
        "segitiga, persegi, lingkaran. Baris 2: lingkaran, segitiga, persegi. Baris 3: persegi, lingkaran, "
        "lalu tanda tanya.",
        "Pilihan: A persegi putih, B lingkaran putih, C segi lima putih, D segitiga hitam, E segitiga putih.",
        salah=[("setiap kolom sama", lambda r, k: (_latin[0][k], "putih"))],
        tandingan=[("diagonal utama sama", lambda r, k: (_latin[r][k], "putih"))])

# --- p06 ---------------------------------------------------------------
analogi("p06-054", gb_belah, ("lingkaran", "utuh"), ("lingkaran", "kiri"), ("rumah", "utuh"),
        [("rumah", "kanan"), ("rumah", "kiri"), ("rumah", "atas"), ("rumah", "bawah"), ("rumah", "utuh")],
        lambda s: (s[0], "kiri"),
        "Analogi: gambar pertama lingkaran hitam utuh; gambar kedua hanya setengah kiri lingkaran yang hitam, "
        "setengah kanan tinggal garis putus-putus; gambar ketiga bangun rumah hitam utuh (atap segitiga di atas "
        "badan persegi); gambar keempat bertanda tanya.",
        "Pilihan, semuanya dengan garis putus-putus bentuk rumah utuh: A hanya setengah kanan yang hitam; B hanya "
        "setengah kiri yang hitam; C hanya setengah atas yang hitam; D hanya setengah bawah yang hitam; E rumah "
        "hitam utuh.",
        salah=[("sisakan setengah kanan", lambda s: (s[0], "kanan")),
               ("sisakan setengah atas", lambda s: (s[0], "atas"))])

def _bentuk_titik(r, k):
    n = 3 + r
    return (n, n - k, "hitam" if (r + k) % 2 else "putih")


matriks("p06-056", gb_titik_dalam_bentuk, _bentuk_titik,
        [(5, 3, "hitam"), (5, 4, "putih"), (6, 3, "putih"), (5, 2, "putih"), (5, 3, "putih")],
        "Kisi 3 × 3 berisi bangun bertitik, sel kanan bawah bertanda tanya. Baris 1: segitiga putih 3 titik, "
        "segitiga hitam 2 titik putih, segitiga putih 1 titik. Baris 2: persegi hitam 4 titik putih, persegi "
        "putih 3 titik, persegi hitam 2 titik putih. Baris 3: segi lima putih 5 titik, segi lima hitam 4 titik "
        "putih, lalu tanda tanya.",
        "Pilihan: A segi lima hitam berisi 3 titik putih; B segi lima putih berisi 4 titik; C segi enam putih "
        "berisi 3 titik; D segi lima putih berisi 2 titik; E segi lima putih berisi 3 titik.",
        salah=[("hanya kolom tengah hitam", lambda r, k: (3 + r, 3 + r - k, "hitam" if k == 1 else "putih")),
               ("titik sama dalam satu kolom", lambda r, k: (3 + r, 3 - k, "hitam" if (r + k) % 2 else "putih"))],
        tandingan=[("titik kolom ketiga bertambah satu ke bawah",
                    lambda r, k: (3 + r, (1 + r) if k == 2 else 3 + r - k, "hitam" if (r + k) % 2 else "putih"))])

serial("p06-058", gb_dua_benda, [(0, 5), (1, 3), (2, 1), (3, 7)],
       [(3, 5), (4, 3), (5, 4), (4, 5), (4, 7)],
       lambda s: ((s[-1][0] + 1) % 8, (s[-1][1] - 2) % 8),
       "Empat gambar berurutan. Setiap gambar memiliki bingkai persegi putus-putus dengan delapan titik letak: "
       "empat pojok dan empat tengah sisi. Ada satu lingkaran putih dan satu segitiga hitam. Gambar 1: lingkaran "
       "di pojok kiri atas, segitiga di tengah sisi bawah. Gambar 2: lingkaran di tengah sisi atas, segitiga di "
       "tengah sisi kanan. Gambar 3: lingkaran di pojok kanan atas, segitiga di tengah sisi atas. Gambar 4: "
       "lingkaran di tengah sisi kanan, segitiga di tengah sisi kiri. Sel kelima bertanda tanya.",
       "Pilihan: A lingkaran di tengah sisi kanan, segitiga di tengah sisi bawah; B lingkaran di pojok kanan "
       "bawah, segitiga di tengah sisi kanan; C lingkaran di tengah sisi bawah, segitiga di pojok kanan bawah; "
       "D lingkaran di pojok kanan bawah, segitiga di tengah sisi bawah; E lingkaran di pojok kanan bawah, "
       "segitiga di tengah sisi kiri.")

# --- p07 ---------------------------------------------------------------
analogi("p07-055", gb_pecahan, (2, frozenset({0})), (4, frozenset({0, 1})), (3, frozenset({0})),
        [(6, frozenset({0, 1, 2})), (3, frozenset({1})), (6, frozenset({0})), (6, frozenset({0, 1})),
         (4, frozenset({0, 1}))],
        lambda s: (s[0] * 2, frozenset(j for i in s[1] for j in (2 * i, 2 * i + 1))),
        "Analogi dengan lingkaran yang dibagi menjadi juring sama besar. Gambar pertama: lingkaran dibagi 2, "
        "setengah kanan hitam. Gambar kedua: lingkaran dibagi 4, dua juring kanan hitam. Gambar ketiga: "
        "lingkaran dibagi 3, satu juring hitam mulai dari arah atas searah jarum jam. Gambar keempat bertanda "
        "tanya.",
        "Pilihan: A dibagi 6, tiga juring hitam; B dibagi 3, satu juring hitam di posisi lain; C dibagi 6, satu "
        "juring hitam; D dibagi 6, dua juring hitam bersebelahan mulai dari atas; E dibagi 4, dua juring hitam.",
        salah=[("jumlah juring ditambah 2", lambda s: (s[0] + 2, s[1]))])

serial("p07-058", gb_kelompok, [("lingkaran", 1, False), ("persegi", 3, False), ("lingkaran", 5, False),
                                ("persegi", 7, False)],
       [("lingkaran", 9, False), ("persegi", 9, False), ("lingkaran", 8, False), ("lingkaran", 7, False),
        ("segitiga", 9, False)],
       lambda s: ("lingkaran" if s[-1][0] == "persegi" else "persegi", s[-1][1] + 2, False),
       "Empat gambar berurutan: 1 lingkaran hitam kecil, 3 persegi putih kecil, 5 lingkaran hitam kecil, "
       "7 persegi putih kecil, lalu sel kelima bertanda tanya.",
       "Pilihan: A 9 lingkaran hitam kecil; B 9 persegi putih kecil; C 8 lingkaran hitam kecil; D 7 lingkaran "
       "hitam kecil; E 9 segitiga hitam kecil.")

matriks("p07-065", gb_dua_benda, lambda r, k: ((k + 2 * r) % 8, (4 - 2 * k + 2 * r) % 8),
        [(5, 4), (6, 4), (4, 6), (7, 4), (6, 0)],
        "Kisi 3 × 3. Setiap sel memiliki bingkai persegi putus-putus dengan delapan titik letak (empat pojok "
        "dan empat tengah sisi), satu lingkaran putih, dan satu segitiga hitam. Sel kanan bawah bertanda tanya. "
        "Baris 1: lingkaran kiri atas, segitiga kanan bawah | lingkaran tengah atas, segitiga kanan atas | "
        "lingkaran kanan atas, segitiga kiri atas. Baris 2: lingkaran kanan atas, segitiga kiri bawah | "
        "lingkaran tengah kanan, segitiga kanan bawah | lingkaran kanan bawah, segitiga kanan atas. Baris 3: "
        "lingkaran kanan bawah, segitiga kiri atas | lingkaran tengah bawah, segitiga kiri bawah | tanda tanya.",
        "Pilihan: A lingkaran tengah bawah, segitiga kanan bawah; B lingkaran kiri bawah, segitiga kanan bawah; "
        "C lingkaran kanan bawah, segitiga kiri bawah; D lingkaran tengah kiri, segitiga kanan bawah; "
        "E lingkaran kiri bawah, segitiga kiri atas.",
        salah=[("segitiga searah jarum jam", lambda r, k: ((k + 2 * r) % 8, (4 + 2 * k + 2 * r) % 8)),
               ("lingkaran dua langkah per kolom", lambda r, k: ((2 * k + 2 * r) % 8, (4 - 2 * k + 2 * r) % 8))])

# ---------------------------------------------------------------- cek + tulis


def cek_unik(s):
    """Semua gambar pilihan harus berbeda satu sama lain (termasuk bangun yang sama setelah diputar)."""
    if s["jenis"] == "beda":
        return
    gambar = [s["gambar"](o) for o in s["opsi"]]
    assert len(set(gambar)) == 5, f"{s['id']}: ada gambar pilihan yang kembar"


def main():
    tulis = "--cek" not in sys.argv
    galat = []
    bank = {}
    folder = {}
    for s in SOAL:
        pid = s["id"].split("-")[0]
        if pid not in bank:
            f = file_paket(pid)
            if f is None:
                galat.append(f"{s['id']}: {pid}.json tidak ditemukan (bank/ atau folder privat, tools/lokasi_bank.py)")
                bank[pid], folder[pid] = {}, None
            else:
                bank[pid] = {x["id"]: x for x in json.loads(f.read_text())["soal"]}
                folder[pid] = f.parent
        if folder[pid] is None:
            continue
        if len(s["cocok"]) != 1:
            galat.append(f"{s['id']}: jawaban tidak tunggal ({s['cocok'] or 'tidak ada'})")
            continue
        cek_unik(s)
        if s["jenis"] == "beda":
            # Bangun kembar setelah diputar tidak masalah untuk ketidaksamaan, tetapi dua gambar persis sama
            # akan membingungkan.
            assert len({s["gambar"](x) for x in s["stem"]}) == 5, f"{s['id']}: ada dua gambar persis sama"
        sb = bank[pid].get(s["id"])
        file_soal = f"gambar/{s['id']}-soal.svg"
        file_opsi = f"gambar/{s['id']}-opsi.svg"
        if sb is None:
            galat.append(f"{s['id']}: tidak ada di bank/{pid}.json")
        else:
            if sb.get("kunci") != s["cocok"][0]:
                galat.append(f"{s['id']}: kunci bank {sb.get('kunci')} ≠ hasil aturan {s['cocok'][0]}")
            harap = [file_soal] + ([] if s["jenis"] == "beda" else [file_opsi])
            if [g["file"] for g in sb.get("gambar", [])] != harap:
                galat.append(f"{s['id']}: field gambar harus {harap}")
            elif [g["alt"] for g in sb["gambar"]] != [s["alt_soal"]] + ([] if s["jenis"] == "beda" else [s["alt_opsi"]]):
                galat.append(f"{s['id']}: teks alt di bank berbeda dari definisi gambar")
        if tulis:
            dasar = folder[pid]  # SVG ditulis di sebelah paketnya (bank/ atau folder privat)
            (dasar / "gambar").mkdir(exist_ok=True)
            frames = [s["gambar"](x) for x in s["stem"]]
            if s["jenis"] == "serial":
                isi = svg_deret(frames, s["alt_soal"])
            elif s["jenis"] == "analogi":
                isi = svg_analogi(*frames, s["alt_soal"])
            elif s["jenis"] == "matriks":
                isi = svg_matriks(frames, s["alt_soal"])
            else:
                isi = svg_pilihan(frames, s["alt_soal"])
            (dasar / file_soal).write_text(isi)
            if s["jenis"] != "beda":
                (dasar / file_opsi).write_text(svg_pilihan([s["gambar"](o) for o in s["opsi"]], s["alt_opsi"]))
    for g in galat:
        print("GALAT ", g)
    print(f"{len(SOAL)} soal figural diperiksa: {len(galat)} galat" + ("" if not tulis else "; SVG di folder gambar/ masing-masing paket"))
    for s in SOAL:
        print(f"  {s['id']:8} {s['jenis']:8} jawaban {''.join(s['cocok'])}")
    return 1 if galat else 0


if __name__ == "__main__":
    sys.exit(main())
