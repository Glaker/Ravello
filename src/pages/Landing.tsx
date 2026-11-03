// Provisoria hasta el paso 7 (landing editorial). Sirve de índice para la prueba.
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { site } from '../theme/tokens';

const LINKS = [
  ['/carta', 'Carta digital', 'La que abre el cliente con el QR'],
  ['/admin/carta', 'Admin de la carta', 'Precios y disponibilidad (PIN)'],
  ['/mozo', 'Mozo', 'Tomar pedidos por mesa'],
  ['/cocina', 'Cocina', 'Comandas en vivo'],
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--crema)', color: 'var(--bordo)', padding: '48px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Logo width={180} />
        <h1 className="r-title" style={{ fontSize: 'clamp(2.4rem, 10vw, 4rem)', marginTop: 40 }}>
          {site.lema}
          <span className="r-filete" />
        </h1>
        <nav style={{ marginTop: 32 }}>
          {LINKS.map(([to, title, sub]) => (
            <Link key={to} to={to} style={{ display: 'block', textDecoration: 'none', padding: '16px 0', borderBottom: '1px solid var(--linea)' }}>
              <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 20 }}>{title}</span>
              <span style={{ display: 'block', color: 'var(--tinta-suave)', fontWeight: 400 }}>{sub}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
