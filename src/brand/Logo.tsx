import type { CSSProperties } from 'react';
import { LOGO_VARIANT } from '../theme/tokens';
import * as g from './logoGeometry';

type Variant = 'pdf' | 'jpg';
interface Props {
  /** completo (isotipo + RAVELLO + jardín) o solo isotipo */
  full?: boolean;
  /** false = isotipo + RAVELLO, sin "jardín" (para tamaños chicos) */
  jardin?: boolean;
  variant?: Variant;
  /** ancho en px o cualquier unidad CSS */
  width?: number | string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

function Mark({ variant, compact }: { variant: Variant; compact: boolean }) {
  if (variant === 'jpg') {
    const half = compact ? 400 : g.jpg.lineHalf;
    return (
      <g fill="none" stroke="currentColor" strokeWidth={g.jpg.stroke} strokeLinejoin="round" strokeLinecap="round">
        <path d={`M ${-half} 0 H ${half}`} strokeLinecap="butt" />
        <path d={g.jpg.roof} />
        {g.jpg.struts.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    );
  }
  const half = compact ? 400 : g.pdf.lineHalf;
  return (
    <g>
      <path d={`M ${-half} 0 H ${half}`} stroke="currentColor" strokeWidth={compact ? 10 : g.pdf.lineWidth} />
      <path d={g.pdf.roof} fill="none" stroke="currentColor" strokeWidth={compact ? 9 : g.pdf.roofWidth} strokeLinejoin="round" />
      <g fill="currentColor" stroke="currentColor" strokeWidth={g.pdf.shapeRound} strokeLinejoin="round">
        {g.pdf.shapes.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  );
}

/** Logo de Ravello Jardín en vector. Usa currentColor: se tiñe con `color` del contenedor. */
export function Logo({ full = true, jardin = true, variant = LOGO_VARIANT, width = 200, className, style, title = 'Ravello Jardín' }: Props) {
  const half = variant === 'jpg' ? g.jpg.lineHalf + 10 : g.pdf.lineHalf;
  // sin "jardín" se recorta el viewBox justo debajo de RAVELLO y la línea se acorta al ancho del texto
  const viewBox = full ? (jardin ? `${-half} -245 ${half * 2} 512` : '-372 -238 744 428') : '-410 -250 820 270';
  return (
    <svg viewBox={viewBox} width={width} className={className} style={{ display: 'block', overflow: 'visible', ...style }} role="img" aria-label={title}>
      <title>{title}</title>
      <Mark variant={variant} compact={!full || !jardin} />
      {full && (
        <g fill="none" stroke="currentColor" strokeLinecap="butt" strokeLinejoin="miter">
          <path d={g.ravello} strokeWidth={jardin ? g.ravelloStroke : 9} />
          {jardin && (
            <>
              <path d={g.jardin} strokeWidth={g.jardinStroke} strokeLinecap="round" />
              <circle {...g.jardinDot} fill="currentColor" stroke="none" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

/** Solo el isotipo (favicon, header compacto, centro del QR). */
export function Isotipo(props: Omit<Props, 'full'>) {
  return <Logo {...props} full={false} />;
}
