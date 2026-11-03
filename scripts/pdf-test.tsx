// Genera la carta PDF desde Node (para revisar sin navegador). Uso: npx tsx --tsconfig tsconfig.scripts.json scripts/pdf-test.tsx salida.pdf
import { renderToFile } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import { CartaPdf, registerFonts } from '../src/pdf/CartaPdf';
import { CARTA_IMPRESA_FECHA } from '../src/theme/tokens';

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
const [c, p] = await Promise.all([sb.from('categories').select('*').order('sort'), sb.from('products').select('*').order('sort')]);
registerFonts(process.cwd() + '/public');
await renderToFile(<CartaPdf categories={c.data!} products={p.data!} updated={CARTA_IMPRESA_FECHA} />, process.argv[2] ?? 'carta.pdf');
console.log('ok');
