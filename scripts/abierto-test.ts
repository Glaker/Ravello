// Casos del estado "abierto hoy". Uso: npx tsx --tsconfig tsconfig.scripts.json scripts/abierto-test.ts
import { estadoHoy } from '../src/lib/abierto';
const casos: [string, string][] = [
  ['2026-11-02T14:00:00-03:00', 'Abrimos hoy a las 15'], // lunes 14 h
  ['2026-11-02T15:00:00-03:00', 'Hoy abierto de 15 a 20'], // lunes 15 h
  ['2026-11-02T20:00:00-03:00', 'Ya cerramos por hoy · mañana abrimos a las 12'], // lunes 20 h
  ['2026-11-03T11:59:00-03:00', 'Abrimos hoy a las 12'], // martes
  ['2026-11-06T23:30:00-03:00', 'Hoy abierto de 12 a 00'], // viernes 23:30
  ['2026-11-07T00:30:00-03:00', 'Abrimos hoy a las 12'], // sábado 00:30 (el viernes ya cerró)
  ['2026-11-08T00:10:00-03:00', 'Abrimos hoy a las 15'], // domingo 00:10
  ['2026-11-08T21:00:00-03:00', 'Ya cerramos por hoy · mañana abrimos a las 15'], // domingo 21 → lunes 15
  ['2026-11-07T02:00:00Z', 'Hoy abierto de 12 a 00'], // = viernes 23:00 AR aunque en UTC sea sábado
];
let ok = 0;
for (const [iso, want] of casos) {
  const got = estadoHoy(new Date(iso)).texto;
  console.log(got === want ? 'ok ' : 'MAL', iso, '→', got);
  if (got === want) ok++;
}
console.log(`${ok}/${casos.length}`);
process.exit(ok === casos.length ? 0 : 1);
