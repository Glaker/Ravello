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
    f = instantiateVariableFont(TTFont(io.BytesIO(raw[src])), {"wght": wght})
    f.flavor = None
    f.save(dest / f"{name}.ttf")
    f.flavor = "woff2"
    f.save(dest / f"{name}.woff2")
    print("ok", name)
(dest / "OFL.txt").write_bytes(urllib.request.urlopen(BASE + "OFL.txt").read())
