import { horarioSemanal } from '../theme/tokens';

const TZ = 'America/Argentina/Buenos_Aires';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Día de la semana y hora decimal en Argentina, sin importar la zona del dispositivo. */
export function ahoraArgentina(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { dia, hora: Number(get('hour')) + Number(get('minute')) / 60 };
}

/** 12 → "12", 24 → "00", 12.5 → "12:30" */
export function fmtHora(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h % 1) * 60);
  return mm ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : String(hh).padStart(hh === 0 ? 2 : 1, '0');
}

export type EstadoHoy = { abierto: boolean; texto: string };

/** "Hoy abierto de 12 a 20" / "Abrimos hoy a las 15" / "Ya cerramos · mañana abrimos a las 12" / "Hoy cerrado". */
export function estadoHoy(d = new Date()): EstadoHoy {
  const { dia, hora } = ahoraArgentina(d);
  const hoy = horarioSemanal[dia];
  if (!hoy) return { abierto: false, texto: 'Hoy cerrado' };
  if (hora < hoy.open) return { abierto: false, texto: `Abrimos hoy a las ${fmtHora(hoy.open)}` };
  if (hora < hoy.close) return { abierto: true, texto: `Hoy abierto de ${fmtHora(hoy.open)} a ${fmtHora(hoy.close)}` };
  // ya cerró: buscar el próximo día con horario
  for (let i = 1; i <= 7; i++) {
    const next = horarioSemanal[(dia + i) % 7];
    if (next) return { abierto: false, texto: `Ya cerramos por hoy · ${i === 1 ? 'mañana' : 'el ' + DIAS[(dia + i) % 7]} abrimos a las ${fmtHora(next.open)}` };
  }
  return { abierto: false, texto: 'Hoy cerrado' };
}
