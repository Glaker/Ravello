import { createTheme, type MantineColorsTuple } from '@mantine/core';
import { color, font } from './tokens';

const bordo: MantineColorsTuple = ['#F6ECEB', '#E8D2D1', '#D2A8A7', '#BA7E7D', '#A25E5E', '#8A4648', '#73373A', '#602B2E', '#4C2124', '#3F1C1E'];
const verde: MantineColorsTuple = ['#EEF2EC', '#D8E1D4', '#B4C6AD', '#8FA986', '#708F66', '#5A7A51', '#4B6A44', '#3E5B3A', '#33492F', '#273825'];
const terracota: MantineColorsTuple = ['#FAEDE9', '#F0D2C8', '#E3AB99', '#D6846A', '#CB6548', '#C05637', '#B5492F', '#963B26', '#782F1E', '#5B2317'];
const tinta: MantineColorsTuple = ['#F4EFE4', '#E4D9C4', '#C9BBAA', '#A8968B', '#8A756E', '#6A5450', '#55403C', '#46302D', '#3A2422', '#2A1918'];

/** Theme de Mantine sin cara de Mantine: esquinas casi rectas, sin sombras, mayúsculas pesadas. */
export const theme = createTheme({
  fontFamily: font.stack,
  fontFamilyMonospace: font.stack,
  headings: { fontFamily: font.stack, fontWeight: '900' },
  primaryColor: 'bordo',
  primaryShade: 7,
  colors: { bordo, verde, terracota, tinta },
  black: color.tinta,
  white: color.papel,
  defaultRadius: 2,
  radius: { xs: '1px', sm: '2px', md: '2px', lg: '3px', xl: '4px' },
  shadows: { xs: 'none', sm: 'none', md: 'none', lg: 'none', xl: 'none' },
  focusRing: 'never',
  cursorType: 'pointer',
  fontSmoothing: true,
  components: {
    Button: {
      defaultProps: { radius: 2 },
      styles: {
        root: { textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 900, transition: 'background 120ms, color 120ms' },
      },
    },
    TextInput: { defaultProps: { radius: 2 } },
    NumberInput: { defaultProps: { radius: 2 } },
    Textarea: { defaultProps: { radius: 2 } },
    Input: {
      styles: {
        input: { background: color.papel, borderColor: 'rgba(58,36,34,0.28)', color: color.tinta, fontWeight: 500 },
      },
    },
    Switch: { defaultProps: { color: 'verde', radius: 2 } },
    Modal: { defaultProps: { radius: 2, overlayProps: { backgroundOpacity: 0.45, color: color.bordoProfundo } } },
    Paper: { defaultProps: { radius: 2, shadow: 'none' } },
    Notification: { defaultProps: { radius: 2 } },
  },
});
