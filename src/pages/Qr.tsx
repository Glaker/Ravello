import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { renderToStaticMarkup } from 'react-dom/server';
import { Isotipo, Logo } from '../brand/Logo';
import { color, site } from '../theme/tokens';
import s from './Qr.module.css';

const BASE = ((import.meta.env.VITE_PUBLIC_URL as string | undefined) || window.location.origin).replace(/\/$/, '');
const URL_CARTA = `${BASE}/carta`;

/** QR con corrección alta (H) para poder poner el isotipo al centro sin perder lectura. */
function useQrSvg(text: string) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'H', margin: 0, color: { dark: color.bordo, light: '#00000000' } }).then((raw) => {
      const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(raw);
      const n = vb ? Number(vb[1]) : 33;
      const box = n * 0.26; // ~7% del área: seguro con nivel H
      const x = (n - box) / 2;
      const iso = renderToStaticMarkup(<Isotipo width="100%" />)
        .replace(/<svg[^>]*viewBox="([^"]+)"[^>]*>/, `<svg x="${x + box * 0.1}" y="${x + box * 0.22}" width="${box * 0.8}" height="${box * 0.56}" viewBox="$1" color="${color.bordo}" style="color:${color.bordo}">`);
      const center = `<rect x="${x}" y="${x}" width="${box}" height="${box}" fill="${color.crema}"/>${iso}`;
      setSvg(raw.replace('</svg>', `${center}</svg>`).replace('<svg ', '<svg shape-rendering="crispEdges" '));
    });
  }, [text]);
  return svg;
}

export default function Qr() {
  const svg = useQrSvg(URL_CARTA);
  useEffect(() => {
    document.title = 'QR de la carta · Ravello Jardín';
  }, []);
  return (
    <div className={s.page}>
      <div className={s.tools}>
        <span>Hoja A4 lista para imprimir · apunta a <b>{URL_CARTA}</b></span>
        <button onClick={() => window.print()}>Imprimir</button>
      </div>
      <article className={s.sheet}>
        <Logo width={170} />
        <h1 className="r-title">
          La carta
          <span className={s.filete} />
        </h1>
        <p className={s.lead}>Escaneá con la cámara del celu: la carta, siempre con los precios del día.</p>
        <div className={s.qr} dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label={`Código QR a ${URL_CARTA}`} />
        <p className={s.url}>{URL_CARTA.replace(/^https?:\/\//, '')}</p>
        <footer className={s.foot}>
          <span className={s.lema}>{site.lema}</span>
          <span>{site.instagramHandle}</span>
        </footer>
      </article>
    </div>
  );
}
