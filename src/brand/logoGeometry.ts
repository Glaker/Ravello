/**
 * Geometría del logo de Ravello redibujado en vector.
 * Sistema de coordenadas: x=0 en el eje de simetría, y=0 sobre la línea horizontal.
 * Medido sobre la carta impresa (variante 'pdf') y sobre ravello-logo.jpg (variante 'jpg').
 */

/* ---------- Variante PDF: techo fino + triángulo / pentágono / triángulo rellenos ---------- */
export const pdf = {
  lineHalf: 560, // la línea atraviesa todo el ancho
  lineWidth: 5,
  roof: 'M -352 0 L -14 -215 Q 0 -224 14 -215 L 352 0',
  roofWidth: 4.5,
  // formas rellenas; se redondean con un trazo del mismo color (linejoin round)
  shapes: [
    'M -263 -7 L -158 -90 L -101 -7 Z',
    'M 0 -192 L -116 -116 L -44 -7 L 44 -7 L 116 -116 Z',
    'M 263 -7 L 158 -90 L 101 -7 Z',
  ],
  shapeRound: 9,
};

/* ---------- Variante JPG: contorno grueso con dos puntales ---------- */
export const jpg = {
  lineHalf: 636,
  lineWidth: 17,
  roof: 'M -352 0 L -18 -220 Q 0 -232 18 -220 L 352 0',
  struts: ['M -150 -128 L -78 0', 'M 150 -128 L 78 0'],
  stroke: 17,
};

/* ---------- Texto dibujado como trazos (no depende de fuentes cargadas) ---------- */
const CAP_TOP = 100;
const CAP_BOT = 182;
const MID = 141;

function R(x: number) {
  return `M ${x} ${CAP_BOT} V ${CAP_TOP} H ${x + 30} A 20.5 20.5 0 0 1 ${x + 30} ${MID + 1} H ${x} M ${x + 26} ${MID + 1} L ${x + 52} ${CAP_BOT}`;
}
function A(x: number) {
  return `M ${x} ${CAP_BOT} L ${x + 33} ${CAP_TOP} L ${x + 66} ${CAP_BOT} M ${x + 13} 151 H ${x + 53}`;
}
function V(x: number) {
  return `M ${x} ${CAP_TOP} L ${x + 33} ${CAP_BOT} L ${x + 66} ${CAP_TOP}`;
}
function E(x: number) {
  return `M ${x + 46} ${CAP_TOP} H ${x} V ${CAP_BOT} H ${x + 46} M ${x} ${MID} H ${x + 40}`;
}
function L(x: number) {
  return `M ${x} ${CAP_TOP} V ${CAP_BOT} H ${x + 44}`;
}
function O(x: number) {
  return `M ${x} ${MID} A 41 41 0 1 0 ${x + 82} ${MID} A 41 41 0 1 0 ${x} ${MID}`;
}

// tracking amplio, centrado (ancho total ≈ 545)
export const ravello = [R(-272), A(-196), V(-106), E(-16), L(54), L(122), O(190)].join(' ');
export const ravelloStroke = 4.6;

// "jardín" minúscula geométrica, chica y centrada
export const jardin = [
  'M -79 214 V 249 Q -79 257 -87 257', // j
  'M -39 214 V 240 M -39 227 A 13 13 0 1 0 -65 227 A 13 13 0 1 0 -39 227', // a
  'M -25 240 V 214 M -25 223 Q -22 214 -11 214', // r
  'M 29 200 V 240 M 29 227 A 13 13 0 1 0 3 227 A 13 13 0 1 0 29 227', // d
  'M 43 214 V 240 M 41 207 L 48 199', // í
  'M 57 240 V 214 M 57 226 Q 57 214 68 214 Q 79 214 79 226 V 240', // n
].join(' ');
export const jardinDot = { cx: -79, cy: 204, r: 2.6 };
export const jardinStroke = 3.2;
