const ars = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** 13500 → "$ 13.500" (como en la carta impresa) */
export function precio(n: number): string {
  return `$ ${ars.format(n)}`;
}

/** Comparación sin tildes ni mayúsculas, para el buscador */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function minutosDesde(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}
