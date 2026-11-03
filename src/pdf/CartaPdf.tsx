/**
 * Carta imprimible, replicando la carta original (Illustrator, 3 págs. de 1350×1500 pt):
 * fondo crema, títulos Black en mayúsculas con filete, nombre Light · guiones · precio Bold.
 */
import { Circle, Document, Font, G, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import * as g from '../brand/logoGeometry';
import { diaMes, precio } from '../lib/format';
import type { Category, Product } from '../lib/types';
import { LOGO_VARIANT, color, font } from '../theme/tokens';

let registered = false;
/** base: origen web (navegador) o carpeta /public (Node, para pruebas). */
export function registerFonts(base = typeof window !== 'undefined' ? window.location.origin : '') {
  if (registered) return;
  Font.register({
    family: font.family,
    fonts: [
      { src: base + font.files.light + '.ttf', fontWeight: 300 },
      { src: base + font.files.lightItalic + '.ttf', fontWeight: 300, fontStyle: 'italic' },
      { src: base + font.files.regular + '.ttf', fontWeight: 400 },
      { src: base + font.files.bold + '.ttf', fontWeight: 700 },
      { src: base + font.files.black + '.ttf', fontWeight: 900 },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
  registered = true;
}

const W = 1350;
const H = 1500;
const C = color.bordo;
const s = StyleSheet.create({
  page: { backgroundColor: color.crema, color: C, fontFamily: font.family, fontWeight: 300, paddingTop: 36, paddingBottom: 64, paddingHorizontal: 64, fontSize: 33, lineHeight: 1.06 },
  logo: { alignItems: 'center', marginBottom: 6 },
  titleWrap: { alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontWeight: 900, fontSize: 50, lineHeight: 1, letterSpacing: -0.8, textTransform: 'uppercase', color: C },
  filete: { height: 3, backgroundColor: C, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  name: { flexShrink: 1, flexGrow: 0, maxWidth: '80%' },
  leader: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 40, height: 2, marginLeft: 8, marginRight: 10, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  dashes: { position: 'absolute', left: 0, top: 0, width: 1300, flexDirection: 'row' },
  dash: { width: 10, height: 1.6, marginRight: 7, backgroundColor: C, opacity: 0.85 },
  price: { fontWeight: 700, fontSize: 33 },
  desc: { fontWeight: 300, marginTop: 0, marginBottom: 4 },
  italic: { fontStyle: 'italic' },
  cols: { flexDirection: 'row', gap: 64 },
  col: { flex: 1 },
  badge: { borderWidth: 2, borderColor: color.verde, paddingTop: 5, paddingBottom: 3, paddingHorizontal: 7 },
  badgeText: { color: color.verde, fontWeight: 900, fontSize: 16, lineHeight: 1, letterSpacing: 0.6 },
  foot: { position: 'absolute', bottom: 22, left: 0, right: 0, alignItems: 'center' },
  footLine: { width: 330, height: 1.2, backgroundColor: C, marginBottom: 10 },
  footText: { fontSize: 17, fontStyle: 'italic', color: color.tintaSuave },
  variant: { marginLeft: 0, marginBottom: 4 },
});

function Logo() {
  const v = LOGO_VARIANT;
  const half = v === 'jpg' ? g.jpg.lineHalf + 10 : g.pdf.lineHalf;
  return (
    <Svg viewBox={`${-half} -245 ${half * 2} 512`} width={190} height={(190 * 512) / (half * 2)}>
      {v === 'jpg' ? (
        <G>
          <Path d={`M ${-g.jpg.lineHalf} 0 H ${g.jpg.lineHalf}`} stroke={C} strokeWidth={g.jpg.stroke} />
          <Path d={g.jpg.roof} stroke={C} strokeWidth={g.jpg.stroke} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {g.jpg.struts.map((d) => (
            <Path key={d} d={d} stroke={C} strokeWidth={g.jpg.stroke} strokeLinecap="round" />
          ))}
        </G>
      ) : (
        <G>
          <Path d={`M ${-g.pdf.lineHalf} 0 H ${g.pdf.lineHalf}`} stroke={C} strokeWidth={g.pdf.lineWidth} />
          <Path d={g.pdf.roof} stroke={C} strokeWidth={g.pdf.roofWidth} fill="none" strokeLinejoin="round" />
          {g.pdf.shapes.map((d) => (
            <Path key={d} d={d} fill={C} stroke={C} strokeWidth={g.pdf.shapeRound} strokeLinejoin="round" />
          ))}
        </G>
      )}
      <Path d={g.ravello} stroke={C} strokeWidth={g.ravelloStroke} fill="none" />
      <Path d={g.jardin} stroke={C} strokeWidth={g.jardinStroke} fill="none" strokeLinecap="round" />
      <Circle cx={g.jardinDot.cx} cy={g.jardinDot.cy} r={g.jardinDot.r} fill={C} />
    </Svg>
  );
}

function Title({ children, sinTacc, small }: { children: string; sinTacc?: boolean; small?: boolean }) {
  // ancho del filete proporcional al título, como en el original
  const fil = Math.min(260, Math.max(120, children.length * 13));
  return (
    <View style={s.titleWrap} wrap={false}>
      <View style={s.titleRow}>
        {sinTacc && (
          <View style={[s.badge, { marginRight: 14 }]}>
            <Text style={s.badgeText}>SIN TACC</Text>
          </View>
        )}
        <Text style={[s.title, small ? { fontSize: 40 } : {}]}>{children}</Text>
      </View>
      <View style={[s.filete, { width: fil }]} />
    </View>
  );
}

function Row({ name, price, bold, children }: { name: React.ReactNode; price: number; bold?: boolean; children?: React.ReactNode }) {
  return (
    <View style={s.row} wrap={false}>
      <Text style={[s.name, bold ? { fontWeight: 700 } : {}]}>
        {name}
        {children}
      </Text>
      <View style={s.leader}>
        <View style={s.dashes}>
          {DASHES.map((i) => (
            <View key={i} style={s.dash} />
          ))}
        </View>
      </View>
      <Text style={s.price}>{precio(price)}</Text>
    </View>
  );
}

const DASHES = Array.from({ length: 78 }, (_, i) => i);
const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Productos consecutivos con la misma descripción y la misma primera palabra
 *  (ej. "Pizzeta …" + "Masa de harina de cáñamo") se agrupan como en la carta original. */
function groupItems(items: Product[]) {
  const out: ({ kind: 'single'; p: Product } | { kind: 'group'; head: string; items: Product[] })[] = [];
  for (let i = 0; i < items.length; i++) {
    const p = items[i];
    const w = p.name.split(' ')[0];
    const run = [p];
    while (i + 1 < items.length && p.description && items[i + 1].description === p.description && items[i + 1].name.split(' ')[0] === w) run.push(items[++i]);
    if (run.length > 1) out.push({ kind: 'group', head: `${w}s ${p.description!.replace(/^masa\s+/i, '')}`, items: run });
    else out.push({ kind: 'single', p });
  }
  return out;
}

function Items({ items, especial, allTacc }: { items: Product[]; especial?: boolean; allTacc?: boolean }) {
  return (
    <View>
      {groupItems(items).map((x) =>
        x.kind === 'group' ? (
          <View key={x.head}>
            <Text style={{ marginBottom: 6 }}>{x.head}</Text>
            {x.items.map((p) => (
              <Row key={p.id} price={p.price} name={<Text style={s.italic}>- {capital(p.name.split(' ').slice(1).join(' '))}</Text>} />
            ))}
          </View>
        ) : especial ? (
          <View key={x.p.id} wrap={false}>
            <Row name={x.p.name} price={x.p.price} bold />
            {x.p.description && <Text style={s.desc}>{x.p.description}</Text>}
          </View>
        ) : (
          <View key={x.p.id} wrap={false}>
            <Row name={x.p.name} price={x.p.price}>
              {x.p.description ? <Text style={s.italic}> {x.p.description.charAt(0).toLowerCase() + x.p.description.slice(1)}</Text> : null}
              {x.p.sin_tacc && !allTacc ? <Text style={{ color: color.verde, fontWeight: 900, fontSize: 17 }}>  SIN TACC</Text> : null}
            </Row>
            {x.p.variants?.map((v) => (
              <Text key={v.name} style={[s.variant, { paddingLeft: 18 }]}>
                - {v.name}
                {v.description ? <Text style={s.italic}> - {v.description}</Text> : null}
              </Text>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

const PAGES: string[][] = [
  ['Especiales', '|Café y bebidas sin alcohol', '|Desayunos y meriendas'],
  ['Brunch y tostadas', 'Sanguche de chipá', 'Pastelería', 'Sin TACC'],
  ['Almuerzos', 'Bebidas con alcohol'],
];
const ALL_TACC = new Set(['Sanguche de chipá', 'Sin TACC']);

export function CartaPdf({ categories, products, updated }: { categories: Category[]; products: Product[]; updated: string }) {
  registerFonts();
  const byName = new Map(categories.map((c) => [c.name, c]));
  const itemsOf = (c: Category) => products.filter((p) => p.category_id === c.id).sort((a, b) => a.sort - b.sort);
  const placed = new Set(PAGES.flat().map((n) => n.replace('|', '')));
  const extra = categories.filter((c) => !placed.has(c.name)).map((c) => c.name);
  const pages = PAGES.map((p, i) => (i === PAGES.length - 1 ? [...p, ...extra] : p));

  const section = (name: string, small = false, gap = 30) => {
    const c = byName.get(name);
    if (!c) return null;
    const items = itemsOf(c);
    if (!items.length) return null;
    return (
      <View key={name} style={small ? {} : { marginBottom: gap }}>
        <Title sinTacc={ALL_TACC.has(name)} small={small}>{name}</Title>
        <Items items={items} especial={name === 'Especiales'} allTacc={ALL_TACC.has(name)} />
      </View>
    );
  };

  return (
    <Document title="Carta Ravello Jardín" author="Ravello Jardín" creator="Ravello Jardín · carta digital">
      {pages.map((names, i) => {
        const cols = names.filter((n) => n.startsWith('|')).map((n) => n.slice(1));
        const single = names.filter((n) => !n.startsWith('|'));
        return (
          <Page key={i} size={{ width: W, height: H }} style={s.page}>
            <View style={s.logo} fixed>
              <Logo />
            </View>
            {single.map((n) => section(n, false, cols.length ? 30 : 58))}
            {cols.length > 0 && (
              <View style={s.cols}>
                {cols.map((n) => (
                  <View key={n} style={s.col}>
                    {section(n, true)}
                  </View>
                ))}
              </View>
            )}
            <View style={s.foot} fixed>
              <View style={s.footLine} />
              <Text style={s.footText}>Precios actualizados al {diaMes(updated)} · ¡Sacate la ciudad!</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
