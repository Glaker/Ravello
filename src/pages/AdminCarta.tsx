import { useEffect, useState, type FormEvent } from 'react';
import { Button, Group, Modal, Switch, Text, TextInput } from '@mantine/core';
import { AdminBar } from '../components/AdminBar';
import { AjustePrecios } from '../components/AjustePrecios';
import { usePriceUpdated } from '../hooks/usePriceUpdated';
import { PinGate } from '../components/PinGate';
import { useMenu } from '../hooks/useMenu';
import { diaMes, hora, precio } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { Category, PriceChange, Product } from '../lib/types';
import s from './AdminCarta.module.css';

type Patch = Partial<Pick<Product, 'name' | 'description' | 'price' | 'available' | 'sin_tacc'>>;

function parsePrice(v: string): number | null {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}
const fmt = (n: number) => new Intl.NumberFormat('es-AR').format(n);

function ProductRow({ p, onSave }: { p: Product; onSave: (id: number, patch: Patch) => Promise<boolean> }) {
  const [name, setName] = useState(p.name);
  const [desc, setDesc] = useState(p.description ?? '');
  const [price, setPrice] = useState(fmt(p.price));
  const [saved, setSaved] = useState(false);

  // si cambia desde otro dispositivo, reflejarlo (salvo que se esté editando)
  useEffect(() => setName(p.name), [p.name]);
  useEffect(() => setDesc(p.description ?? ''), [p.description]);
  useEffect(() => setPrice(fmt(p.price)), [p.price]);

  const commitPrice = async () => {
    const n = parsePrice(price);
    if (n === null || n === p.price) return setPrice(fmt(p.price));
    setPrice(fmt(n));
    if (await onSave(p.id, { price: n })) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    }
  };

  return (
    <div className={s.row} data-off={!p.available}>
      <div className={s.fields}>
        <input
          className={`${s.inline} ${s.nameIn}`}
          value={name}
          aria-label="Nombre"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== p.name ? onSave(p.id, { name: name.trim() }) : setName(p.name)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <input
          className={`${s.inline} ${s.descIn}`}
          value={desc}
          placeholder="Agregar descripción"
          aria-label="Descripción"
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => desc !== (p.description ?? '') && onSave(p.id, { description: desc.trim() || null })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {p.variants && <Text size="xs" c="tinta.5" fs="italic">Variantes: {p.variants.map((v) => v.name).join(', ')}</Text>}
      </div>
      <label className={s.price} data-saved={saved}>
        <span>$</span>
        <input
          inputMode="numeric"
          value={price}
          aria-label={`Precio de ${p.name}`}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setPrice(fmt(p.price));
              setTimeout(() => (e.target as HTMLInputElement).blur());
            }
          }}
        />
      </label>
      <label className={s.check}>
        <input type="checkbox" checked={p.sin_tacc} onChange={(e) => onSave(p.id, { sin_tacc: e.target.checked })} />
        Sin TACC
      </label>
      <Switch
        checked={p.available}
        onChange={(e) => onSave(p.id, { available: e.currentTarget.checked })}
        label={p.available ? 'Hay' : 'No hay'}
        size="md"
        styles={{ label: { fontWeight: 700, color: p.available ? 'var(--verde)' : 'var(--terracota-texto)', paddingLeft: 8 } }}
        aria-label="Disponible"
      />
    </div>
  );
}

function AddProduct({ cat, nextSort, onDone }: { cat: Category; nextSort: number; onDone: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = parsePrice(price);
    if (!name.trim() || n === null) return;
    setBusy(true);
    const { error } = await supabase.from('products').insert({ category_id: cat.id, name: name.trim(), description: desc.trim() || null, price: n, sort: nextSort });
    setBusy(false);
    if (error) return onDone('No se pudo agregar: ' + error.message);
    onDone(`Agregado: ${name.trim()} · ${precio(n)}`);
    setName('');
    setDesc('');
    setPrice('');
    setOpen(false);
  };

  if (!open)
    return (
      <div className={s.add}>
        <Button variant="subtle" size="compact-sm" onClick={() => setOpen(true)} px={0}>
          + Agregar a {cat.name}
        </Button>
      </div>
    );
  return (
    <form className={`${s.add} ${s.addForm}`} onSubmit={submit}>
      <TextInput label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <TextInput label="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Opcional" />
      <TextInput label="Precio" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" leftSection={<b style={{ color: 'var(--bordo)' }}>$</b>} required />
      <Button type="submit" loading={busy}>Agregar</Button>
      <Button variant="subtle" onClick={() => setOpen(false)}>Cancelar</Button>
    </form>
  );
}

function Admin() {
  const { categories, products, setProducts, loading, error } = useMenu();
  const [toast, setToast] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'reset' | null>(null);
  const [ajuste, setAjuste] = useState<{ open: boolean; cat: number | null }>({ open: false, cat: null });
  const [historial, setHistorial] = useState<PriceChange[] | null>(null);
  const updated = usePriceUpdated();

  const openHistorial = async () => {
    const { data } = await supabase.from('price_changes').select('*').order('created_at', { ascending: false }).limit(60);
    setHistorial((data as PriceChange[]) ?? []);
  };
  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? '—';

  useEffect(() => {
    document.title = 'Admin · Ravello Jardín';
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const save = async (id: number, patch: Patch) => {
    const before = products;
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))); // optimista
    const { error } = await supabase.from('products').update(patch).eq('id', id);
    if (error) {
      setProducts(before);
      setToast('No se pudo guardar: ' + error.message);
      return false;
    }
    if (patch.price !== undefined) setToast(`Precio actualizado: ${precio(patch.price)}`);
    else if (patch.available !== undefined) setToast(patch.available ? 'Disponible otra vez' : 'Marcado como “no hay”');
    else setToast('Guardado');
    return true;
  };

  const downloadPdf = async () => {
    setBusy('pdf');
    try {
      const { downloadCartaPdf } = await import('../pdf/download');
      await downloadCartaPdf(categories, products, updated);
    } catch (e) {
      setToast('No se pudo generar el PDF');
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    setBusy('reset');
    const { error } = await supabase.rpc('reset_demo');
    setBusy(null);
    setResetOpen(false);
    setToast(error ? 'No se pudo resetear: ' + error.message : 'Listo: comandas borradas');
  };

  return (
    <div className={s.page}>
      <AdminBar>
        <Button onClick={() => setAjuste({ open: true, cat: null })} disabled={loading || !products.length} color="tinta.0" c="bordo.7" size="sm">
          Ajustar precios
        </Button>
        <Button onClick={downloadPdf} loading={busy === 'pdf'} disabled={loading || !products.length} variant="outline" color="tinta.0" size="sm">
          Descargar carta PDF
        </Button>
        <Button component="a" href="/carta" target="_blank" variant="subtle" color="tinta.0" size="sm">
          Ver carta
        </Button>
        <Button variant="subtle" color="tinta.0" size="sm" onClick={() => setResetOpen(true)}>
          Resetear demo
        </Button>
      </AdminBar>

      <main className={s.main}>
        <div className={s.intro}>
          <h1 className="r-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
            La carta, en vivo
            <span className="r-filete" />
          </h1>
          <div className={s.introSide}>
            <p>Cambiá un precio y apretá Enter: se actualiza al instante en el celu de quien esté mirando la carta. El PDF sale siempre con los precios de acá.</p>
            <p className={s.updated}>
              Precios actualizados al <b>{diaMes(updated)}</b> ·{' '}
              <button type="button" onClick={openHistorial}>ver historial</button>
            </p>
          </div>
        </div>

        {loading && <p>Cargando…</p>}
        {error && <p style={{ color: 'var(--terracota-texto)' }}>Error: {error}</p>}

        {categories.map((cat) => {
          const items = products.filter((p) => p.category_id === cat.id);
          return (
            <section key={cat.id} className={s.cat}>
              <div className={s.catHead}>
                <h2 className="r-title">{cat.name}</h2>
                <span className={s.station}>
                  {cat.station === 'barra' ? 'Sale por barra' : 'Sale por cocina'} · {items.length}
                  <button type="button" className={s.catAdjust} onClick={() => setAjuste({ open: true, cat: cat.id })}>
                    Ajustar %
                  </button>
                </span>
              </div>
              <div className={s.row} style={{ borderBottom: 0, paddingBottom: 0 }}>
                <span className={s.colHead}>Producto</span>
                <span className={s.colHead}>Precio</span>
                <span className={s.colHead} />
                <span className={s.colHead}>Disponible</span>
              </div>
              {items.map((p) => (
                <ProductRow key={p.id} p={p} onSave={save} />
              ))}
              <AddProduct cat={cat} nextSort={Math.max(0, ...items.map((p) => p.sort)) + 1} onDone={setToast} />
            </section>
          );
        })}
      </main>

      <Modal opened={resetOpen} onClose={() => setResetOpen(false)} title={<span className="r-title" style={{ fontSize: 22 }}>Resetear demo</span>} centered>
        <Text mb="lg">Se borran todas las comandas de mozo y cocina. La carta y los precios no se tocan.</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setResetOpen(false)}>Cancelar</Button>
          <Button color="terracota" onClick={reset} loading={busy === 'reset'}>Borrar comandas</Button>
        </Group>
      </Modal>

      <AjustePrecios
        opened={ajuste.open}
        initialCategory={ajuste.cat}
        onClose={() => setAjuste((a) => ({ ...a, open: false }))}
        categories={categories}
        products={products}
        onDone={setToast}
      />

      <Modal opened={historial !== null} onClose={() => setHistorial(null)} size="lg" centered title={<span className="r-title" style={{ fontSize: 22 }}>Historial de precios</span>}>
        {historial?.length === 0 && <Text>Todavía no hubo cambios desde la carta impresa.</Text>}
        <div className={s.hist}>
          {historial?.map((h) => (
            <div key={h.id} className={s.histRow}>
              <span className={s.histDate}>{diaMes(h.created_at)} {hora(h.created_at)}</span>
              <span>{productName(h.product_id)}</span>
              <span className={s.histOld}>{precio(h.old)}</span>
              <span className={s.histNew}>{precio(h.new)}</span>
            </div>
          ))}
        </div>
      </Modal>

      {toast && <div className={s.toast} role="status">{toast}</div>}
    </div>
  );
}

export default function AdminCarta() {
  return (
    <PinGate>
      <Admin />
    </PinGate>
  );
}
