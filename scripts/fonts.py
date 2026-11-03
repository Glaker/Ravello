"""Genera instancias estáticas de Urbanist (OFL) para web (woff2) y para @react-pdf (ttf).

@react-pdf no soporta fuentes variables, por eso se generan pesos fijos.
Uso:  python -m venv .venv && .venv/bin/pip install "fonttools[woff]"
      .venv/bin/python scripts/fonts.py
Los archivos generados se commitean en public/fonts, así el build no depende de esto.
"""
import io, pathlib, urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

BASE = "https://github.com/google/fonts/raw/main/ofl/urbanist/"
SRC = {"roman": "Urbanist%5Bwght%5D.ttf", "italic": "Urbanist-Italic%5Bwght%5D.ttf"}
# (archivo de salida, fuente, peso)
OUT = [
    ("Urbanist-Light", "roman", 300),
    ("Urbanist-LightItalic", "italic", 300),
    ("Urbanist-Regular", "roman", 400),
    ("Urbanist-Medium", "roman", 500),
    ("Urbanist-Bold", "roman", 700),
    ("Urbanist-Black", "roman", 900),
]
dest = pathlib.Path(__file__).resolve().parent.parent / "public" / "fonts"
dest.mkdir(parents=True, exist_ok=True)
raw = {k: urllib.request.urlopen(BASE + v).read() for k, v in SRC.items()}
for name, src, wght in OUT:
    f = instantiateVariableFont(TTFont(io.BytesIO(raw[src])), {"wght": wght}, updateFontNames=False)
    style = name.split("-")[1].replace("Italic", " Italic").strip()
    nt = f["name"]
    for rec in list(nt.names):
        if rec.nameID in (1, 2, 4, 6, 16, 17):
            nt.removeNames(nameID=rec.nameID)
    nt.setName("Urbanist " + style if style not in ("Regular", "Italic", "Bold", "Bold Italic") else "Urbanist", 1, 3, 1, 0x409)
    nt.setName("Regular" if style not in ("Regular", "Italic", "Bold", "Bold Italic") else style, 2, 3, 1, 0x409)
    nt.setName("Urbanist", 16, 3, 1, 0x409)
    nt.setName(style, 17, 3, 1, 0x409)
    nt.setName("Urbanist " + style, 4, 3, 1, 0x409)
    nt.setName(name, 6, 3, 1, 0x409)
    f.flavor = None
    f.save(dest / f"{name}.ttf")
    f.flavor = "woff2"
    f.save(dest / f"{name}.woff2")
    print("ok", name)
(dest / "OFL.txt").write_bytes(urllib.request.urlopen(BASE + "OFL.txt").read())
