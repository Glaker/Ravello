import type { ReactNode } from 'react';
import { precio } from '../lib/format';

interface Props {
  name: ReactNode;
  price: number;
  bold?: boolean;
  struck?: boolean;
  flash?: boolean;
  className?: string;
}

/** Renglón de carta: nombre - - - - - $ precio */
export function MenuRow({ name, price, bold, struck, flash, className }: Props) {
  return (
    <div className={`r-row ${className ?? ''}`} style={struck ? { opacity: 0.5 } : undefined}>
      <span className="r-row__name" style={{ fontWeight: bold ? 700 : 300, color: 'var(--bordo)', textDecoration: struck ? 'line-through' : undefined }}>
        {name}
      </span>
      <span className={`r-row__price ${flash ? 'r-flash' : ''}`} style={struck ? { textDecoration: 'line-through' } : undefined}>
        {precio(price)}
      </span>
    </div>
  );
}

export function SinTacc({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      title="Sin TACC"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        border: '1.5px solid var(--verde)',
        color: 'var(--verde)',
        fontWeight: 900,
        fontSize: size === 'sm' ? 10 : 12,
        letterSpacing: '0.08em',
        lineHeight: 1,
        padding: size === 'sm' ? '3px 4px 2px' : '4px 6px 3px',
        whiteSpace: 'nowrap',
        fontStyle: 'normal',
        textDecoration: 'none',
      }}
    >
      SIN TACC
    </span>
  );
}
