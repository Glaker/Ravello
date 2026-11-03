import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@mantine/core';
import { Isotipo } from '../brand/Logo';
import { useMenu } from '../hooks/useMenu';
import { precio } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/types';
import s from './Mozo.module.css';

const MESAS = Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`);
const QUICK_NOTES = ['sin TACC', 'sin cebolla', 'sin hielo', 'para compartir'];

interface Line {
  key: string;
  product: Product;
  variant?: string;
  qty: number;
  note: string;
}

export default function Mozo() {
  const { categories, products } = useMenu();
  const [mesa, setMesa] = useState<string | null>(null);
  const [catId, setCatId] = useState<number | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [variantFor, setVariantFor] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [openTables, setOpenTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'Mozo · Ravello Jardín';
  }, []);
  useEffect(() => {
    if (catId === null && categories.length) setCatId(categories[0].id);
  }, [categories, catId]);

  // mesas con comandas abiertas (para marcarlas en la grilla)
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('orders').select('table_label').in('status', ['new', 'preparing', 'ready']);
      setOpenTables(new Set((data ?? []).map((o) => o.table_label as string)));
    };
    load();
    const ch = supabase
      .channel('mozo-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const visible = useMemo(() => products.filter((p) => p.category_id === catId), [products, catId]);
  const total = lines.reduce((acc, l) => acc + l.product.price * l.qty, 0);
  const count = lines.reduce((acc, l) => acc + l.qty, 0);
  const countFor = (id: number) => lines.filter((l) => l.product.id === id).reduce((a, l) => a + l.qty, 0);

  const add = (product: Product, variant?: string) => {
    const key = `${product.id}:${variant ?? ''}:${Date.now()}`;
    setLines((ls) => {
      // sumar a una línea igual sin nota
      const i = ls.findIndex((l) => l.product.id === product.id && l.variant === variant && !l.note);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { key, product, variant, qty: 1, note: '' }];
    });
  };
  const tap = (p: Product) => (p.variants?.length ? setVariantFor(p) : add(p));
  const setQty = (key: string, d: number) => setLines((ls) => ls.flatMap((l) => (l.key !== key ? [l] : l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }])));
  const setNote = (key: string, note: string) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, note } : l)));
  const toggleChip = (l: Line, chip: string) => {
    const parts = l.note.split(',').map((x) => x.trim()).filter(Boolean);
    const next = parts.includes(chip) ? parts.filter((x) => x !== chip) : [...parts, chip];
    setNote(l.key, next.join(', '));
  };

  const send = async () => {
    if (!mesa || !lines.length) return;
    setSending(true);
    setErr(null);
    const items = lines.map((l) => ({ product_id: l.product.id, qty: l.qty, note: l.note.trim() || null, variant: l.variant ?? null }));
    const { error } = await supabase.rpc('create_order', { table_label: mesa, items });
    setSending(false);
    if (error) return setErr('No se pudo enviar. Revisá la conexión y probá de nuevo.');
    setSent(mesa);
    setLines([]);
    setCartOpen(false);
    setTimeout(() => {
      setSent(null);
      setMesa(null);
    }, 1600);
  };

  if (!mesa) {
    return (
      <div className={s.page}>
        <div className={s.top}>
          <Isotipo width={46} />
          <h1>Mozo</h1>
        </div>
        <div className={s.tables}>
          <h2 className="r-title">
            ¿Qué mesa?
            <span className="r-filete" />
          </h2>
          <div className={s.grid}>
            {MESAS.map((m) => (
              <button key={m} className={s.table} onClick={() => setMesa(m)}>
                <small>Mesa</small>
                {m.replace('Mesa ', '')}
                {openTables.has(m) && <span className={s.busy}>EN CURSO</span>}
              </button>
            ))}
            <button className={`${s.table} ${s.wide}`} onClick={() => setMesa('Barra')}>
              Barra
            </button>
            <button className={`${s.table} ${s.wide}`} onClick={() => setMesa('Para llevar')}>
              Para llevar
            </button>
          </div>
        </div>
        {sent && (
          <div className={s.sent} role="status">
            <b>Enviada</b>
            <span>Comanda de {sent} en cocina</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.top}>
        <Isotipo width={46} />
        <button className={s.mesaBtn} onClick={() => setMesa(null)} aria-label="Cambiar mesa">
          {mesa}
        </button>
        <span style={{ marginLeft: 'auto', fontWeight: 700, opacity: 0.85 }}>{count ? `${count} ítem${count > 1 ? 's' : ''}` : ''}</span>
      </div>

      <div className={s.body}>
        <div className={s.picker}>
          <div className={s.cats}>
            {categories.map((c) => (
              <button key={c.id} className={s.cat} data-active={c.id === catId} onClick={() => setCatId(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className={s.products}>
            {visible.map((p) => {
              const n = countFor(p.id);
              return (
                <button key={p.id} className={s.product} onClick={() => tap(p)} disabled={!p.available}>
                  <span className={s.pName}>{p.name}</span>
                  <span className={s.pPrice}>{p.available ? precio(p.price) : 'No hay'}</span>
                  {n > 0 && <span className={s.pCount}>{n}</span>}
                </button>
              );
            })}
          </div>
          <div className={s.mobileBar}>
            <button className={s.send} onClick={() => setCartOpen(true)} disabled={!lines.length}>
              Ver pedido · {precio(total)}
            </button>
          </div>
        </div>

        <aside className={s.cart} data-open={cartOpen}>
          <div className={s.cartHead}>
            <h2 className="r-title">{mesa}</h2>
            <button className={s.chip} onClick={() => setCartOpen(false)} style={{ display: cartOpen ? undefined : 'none' }}>
              Seguir cargando
            </button>
          </div>
          <div className={s.lines}>
            {!lines.length && <p className={s.emptyCart}>Tocá un producto para sumarlo a la comanda.</p>}
            {lines.map((l) => (
              <div key={l.key} className={s.line}>
                <div className={s.lineTop}>
                  <div className={s.lineName}>
                    {l.product.name}
                    {l.variant ? ` · ${l.variant}` : ''}
                    <small>{precio(l.product.price * l.qty)}</small>
                  </div>
                  <div className={s.qty}>
                    <button onClick={() => setQty(l.key, -1)} aria-label="Uno menos">−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => setQty(l.key, +1)} aria-label="Uno más">+</button>
                  </div>
                </div>
                <div className={s.chips}>
                  {QUICK_NOTES.map((c) => (
                    <button key={c} className={s.chip} data-on={l.note.split(',').map((x) => x.trim()).includes(c)} onClick={() => toggleChip(l, c)}>
                      {c}
                    </button>
                  ))}
                </div>
                <input className={s.note} value={l.note} onChange={(e) => setNote(l.key, e.target.value)} placeholder="Nota para cocina" />
              </div>
            ))}
          </div>
          <div className={s.foot}>
            {err && <span className={s.err}>{err}</span>}
            <div className={s.total}>
              <span>Total</span>
              <span>{precio(total)}</span>
            </div>
            <button className={s.send} onClick={send} disabled={!lines.length || sending}>
              {sending ? 'Enviando…' : 'Enviar a cocina'}
            </button>
          </div>
        </aside>
      </div>

      <Modal opened={!!variantFor} onClose={() => setVariantFor(null)} title={<span className="r-title" style={{ fontSize: 22 }}>{variantFor?.name}</span>} centered>
        <div className={s.variantGrid}>
          {variantFor?.variants?.map((v) => (
            <button
              key={v.name}
              className={s.variantBtn}
              onClick={() => {
                add(variantFor, v.name);
                setVariantFor(null);
              }}
            >
              <b>{v.name}</b>
              <i>{v.description}</i>
            </button>
          ))}
        </div>
      </Modal>

      {sent && (
        <div className={s.sent} role="status">
          <b>Enviada</b>
          <span>Comanda de {sent} en cocina</span>
        </div>
      )}
    </div>
  );
}
