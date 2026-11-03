/**
 * Tokens de marca de Ravello Jardín. Todo lo visual sale de acá.
 */

/** Logo oficial: 'pdf' = techo fino con 3 formas rellenas (carta impresa).
 *  'jpg' = contorno grueso con puntales (ravello-logo.jpg). A confirmar con el cliente. */
export const LOGO_VARIANT: 'pdf' | 'jpg' = 'pdf';

export const color = {
  crema: '#EDE5D5',
  cremaOscuro: '#E4D9C4',
  papel: '#F4EFE4', // un punto más claro, para inputs y superficies elevadas
  bordo: '#602B2E', // color del logo, bordó principal
  bordoProfundo: '#3F1C1E',
  tinta: '#3A2422',
  tintaSuave: '#6A5450', // texto secundario (AA sobre crema: 5.6:1)
  terracota: '#B5492F',
  verde: '#3E5B3A',
  ambar: '#B7791F',
  rojo: '#A8321F',
  linea: 'rgba(58, 36, 34, 0.18)',
} as const;

/**
 * Tipografía. La carta usa Azo Sans (comercial). Reemplazo libre: Urbanist (OFL),
 * la más parecida en geometría (panzas redondas, "a" de dos pisos, "y" de cola recta)
 * y con el mismo rango de pesos. Para cambiarla: reemplazar los archivos en
 * /public/fonts y este nombre.
 */
export const font = {
  family: 'Urbanist',
  stack: "'Urbanist', 'Helvetica Neue', Arial, sans-serif",
  weight: { light: 300, regular: 400, medium: 500, bold: 700, black: 900 },
  /** archivos estáticos (los usa @font-face y el PDF) */
  files: {
    light: '/fonts/Urbanist-Light',
    lightItalic: '/fonts/Urbanist-LightItalic',
    regular: '/fonts/Urbanist-Regular',
    medium: '/fonts/Urbanist-Medium',
    bold: '/fonts/Urbanist-Bold',
    black: '/fonts/Urbanist-Black',
  },
} as const;

export const site = {
  name: 'Ravello Jardín',
  lema: '¡Sacate la ciudad!',
  direccion: '9 e/ 56 y 57 nº 1161',
  ciudad: 'La Plata',
  maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Calle 9 1161, La Plata, Buenos Aires'),
  instagram: 'https://www.instagram.com/ravello.jardin/',
  instagramHandle: '@ravello.jardin',
  horarios: [
    { dias: 'Lunes y domingo', horas: '15 a 20' },
    { dias: 'Martes a jueves', horas: '12 a 20' },
    { dias: 'Viernes y sábado', horas: '12 a 00' },
  ],
} as const;
