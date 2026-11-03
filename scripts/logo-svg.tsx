// Exporta el logo a SVG estáticos en public/brand (+ favicon). Uso: npx tsx scripts/logo-svg.tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Logo } from '../src/brand/Logo';

mkdirSync('public/brand', { recursive: true });
for (const variant of ['pdf', 'jpg'] as const) {
  for (const full of [true, false]) {
    const svg = renderToStaticMarkup(<Logo variant={variant} full={full} width="100%" />)
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(/ style="[^"]*"/, '');
    const name = `ravello-${full ? 'logo' : 'isotipo'}-${variant}.svg`;
    writeFileSync(`public/brand/${name}`, svg);
    console.log(name);
  }
}
// favicon: isotipo bordó sobre crema
const iso = renderToStaticMarkup(<Logo full={false} width="100%" />).replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<title>.*?<\/title>/, '');
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="6" fill="#EDE5D5"/><g transform="translate(32 42) scale(0.068)" color="#602B2E">${iso}</g></svg>`,
);
console.log('favicon.svg');
