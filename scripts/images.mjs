// Genera WebP optimizadas en 3 anchos a partir de las fotos originales de /assets.
// Uso: npm run images
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'assets';
const OUT = 'public/img';
const WIDTHS = [480, 960, 1440];

// nombre final → { archivo original, recorte opcional (px sobre 1440×1920) }
const PHOTOS = {
  'patio-faroles': { file: 'igexport-DR2_7sIEcAc.jpg' },
  'jardin-noche': { file: 'igexport-DVtTlhRjjZ_.jpg' },
  'sendero-noche': { file: 'igexport-DVtTlhRjjZ_-2.jpg' },
  // a la izquierda hay un cartel de salida: se recorta el borde
  galeria: { file: 'igexport-DVtTlhRjjZ_-3.jpg', crop: { left: 170, top: 0, width: 1270, height: 1693 } },
  // abajo a la izquierda hay un objeto blanco desenfocado: se recorta el pie
  ficus: { file: 'igexport-DWUAXwSDi8u-3.jpg', crop: { left: 0, top: 0, width: 1440, height: 1760 } },
};

await mkdir(OUT, { recursive: true });
for (const [name, { file, crop }] of Object.entries(PHOTOS)) {
  for (const w of WIDTHS) {
    let img = sharp(`${SRC}/${file}`).rotate();
    if (crop) img = img.extract(crop);
    const info = await img.resize({ width: w }).webp({ quality: w > 960 ? 72 : 76 }).toFile(`${OUT}/${name}-${w}.webp`);
    console.log(`${name}-${w}.webp`, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}kB`);
  }
}
