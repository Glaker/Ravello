import type { CSSProperties } from 'react';

const WIDTHS = [480, 960, 1440];

interface Props {
  name: 'patio-faroles' | 'jardin-noche' | 'sendero-noche' | 'galeria' | 'ficus';
  alt: string;
  /** atributo sizes del <img> */
  sizes: string;
  /** encuadre: qué parte de la foto no se puede cortar */
  position?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Foto real del local (WebP en 3 tamaños, lazy por defecto). */
export function Photo({ name, alt, sizes, position = '50% 50%', priority, className, style }: Props) {
  return (
    <img
      src={`/img/${name}-960.webp`}
      srcSet={WIDTHS.map((w) => `/img/${name}-${w}.webp ${w}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // @ts-expect-error fetchpriority todavía no está en los tipos de React 18
      fetchpriority={priority ? 'high' : undefined}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, ...style }}
    />
  );
}

/** Lugar reservado para una foto que todavía no existe. */
export function PhotoPlaceholder({ children, className, style }: { children: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`r-placeholder ${className ?? ''}`} style={style}>
      [FOTO: {children}]
    </div>
  );
}
