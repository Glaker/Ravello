import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@mantine/core';
import { Isotipo } from '../brand/Logo';
import { useMenu } from '../hooks/useMenu';
import { SinTacc } from '../components/MenuRow';
import { minutosDesde, normalizar, precio } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { Order, Product } from '../lib/types';
import s from './Mozo.module.css';

const MESAS = Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`);
const QUICK_NOTES = ['sin TACC', 'sin cebolla', 'sin hielo', 'para compartir'];
/** Si todavía no hay ventas, se muestran estos (por nombre). */
const DEFAULT_TOP = ['Café con leche', 'Capuchino', 'Medialuna dulce', 'Desayuno Ravello', 'Limonada', 'Wraps'];
type OpenOrder = Pick<Order, 'id' | 'table_label' | 'status' | 'created_at' | 'ready_at'>;

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

  useEffect(() => {
    document.title = 'Mozo · Ravello Jardín';
  }, []);
  useEffect(() => {
    if (catId === null && categories.length) setCatId(categories[0].id);
  }, [categories, catId]);

  // comandas abiertas: para marcar mesas y avisar cuando cocina las pone "lista"
  const [open, setOpen] = useState<OpenOrder[]>([]);
  const [alerts, setAlerts] = useState<OpenOrder[]>([]);
  const prevStatus = useRef<Map<number, string>>(new Map());
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('orders').select('id, table_label, status, created_at, ready_at').in('status', ['new', 'preparing', 'ready']).order('created_at');
      const rows = (data ?? []) as OpenOrder[];
      rows.forEach((o) => prevStatus.current.set(o.id, o.status));
      setOpen(rows);
    };
    load();
    const ch = supabase
      .channel('mozo-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
        if (p.eventType === 'DELETE') {
          const id = (p.old as Partial<Order>).id;
          setOpen((os) => os.filter((o) => o.id !== id));
          setAlerts((as) => as.filter((o) => o.id !== id));
          return;
        }
        const row = p.new as OpenOrder;
        const before = prevStatus.current.get(row.id);
        prevStatus.current.set(row.id, row.status);
        setOpen((os) => {
          const rest = os.filter((o) => o.id !== row.id);
          return row.status === 'delivered' ? rest : [...rest, row].sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
        if (row.status === 'ready' && before !== 'ready') {
          setAlerts((as) => [...as.filter((o) => o.id !== row.id), row]);
          try {
            navigator.vibrate?.([180, 90, 180]);
          } catch {
            /* sin vibración */
          }
        }
        if (row.status === 'delivered') setAlerts((as) => as.filter((o) => o.id !== row.id));
      })
      .subscribe();
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      supabase.removeChannel(ch);
    };
  }, []);

  const deliver = async (id: number) => {
    setAlerts((as) => as.filter((o) => o.id !== id));
    setOpen((os) => os.filter((o) => o.id !== id));
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
  };
  const tableState = (label: string) => {
    const mine = open.filter((o) => o.table_label === label);
    if (mine.some((o) => o.status === 'ready')) return 'ready';
    return mine.length ? 'busy' : null;
  };
  const readyOrders = open.filter((o) => o.status === 'ready');

  // más pedidos
  const [topIds, setTopIds] = useState<number[]>([]);
  useEffect(() => {
    supabase.rpc('top_products', { lim: 6 }).then(({ data }) => setTopIds(((data ?? []) as { product_id: number }[]).map((r) => r.product_id)));
  }, [sent]);
  const top = useMemo(() => {
    const byId = topIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
    const fill = DEFAULT_TOP.map((n) => products.find((p) => p.name === n)).filter((p): p is Product => !!p && !byId.includes(p));
    return [...byId, ...fill].slice(0, 6);
  }, [topIds, products]);

  const [q, setQ] = useState('');
  const visible = useMemo(() => {
    const nq = normalizar(q.trim());
    if (!nq) return products.filter((p) => p.category_id === catId);
    return products.filter((p) => {
      const cat = categories.find((c) => c.id === p.category_id)?.name ?? '';
      const hay = normalizar([p.name, cat, p.description ?? '', p.sin_tacc ? 'sin tacc' : '', ...(p.variants ?? []).map((v) => v.name)].join(' '));
      return nq.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [products, categories, catId, q]);
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

  const toasts = alerts.length > 0 && (
    <div className={s.toasts} role="status" aria-live="assertive">
      {alerts.map((o) => (
        <div key={o.id} className={s.toast}>
          <div>
            <b>{o.table_label} · lista</b>
            <span>Comanda #{o.id}, pasala a buscar</span>
          </div>
          <button onClick={() => deliver(o.id)}>Entregada</button>
          <button className={s.toastClose} onClick={() => setAlerts((as) => as.filter((x) => x.id !== o.id))} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      ))}
    </div>
  );

  if (!mesa) {
    return (
      <div className={s.page}>
        <div className={s.top}>
          <Isotipo width={46} />
          <h1>Mozo</h1>
        </div>
        <div className={s.tables}>
          {readyOrders.length > 0 && (
            <section className={s.readyBox}>
              <h2 className={s.readyTitle}>Para llevar a la mesa</h2>
              {readyOrders.map((o) => (
                <div key={o.id} className={s.readyRow}>
                  <b>{o.table_label}</b>
                  <span>#{o.id} · lista hace {minutosDesde(o.ready_at ?? o.created_at)}′</span>
                  <button onClick={() => deliver(o.id)}>Entregada</button>
                </div>
              ))}
            </section>
          )}
          <h2 className="r-title">
            ¿Qué mesa?
            <span className="r-filete" />
          </h2>
          <div className={s.grid}>
            {MESAS.map((m) => (
              <button key={m} className={s.table} onClick={() => setMesa(m)}>
                <small>Mesa</small>
                {m.replace('Mesa ', '')}
                {tableState(m) && <span className={s.busy} data-ready={tableState(m) === 'ready'}>{tableState(m) === 'ready' ? 'LISTA' : 'EN CURSO'}</span>}
              </button>
            ))}
            {['Barra', 'Para llevar'].map((m) => (
              <button key={m} className={`${s.table} ${s.wide}`} onClick={() => setMesa(m)}>
                {m}
                {tableState(m) && <span className={s.busy} data-ready={tableState(m) === 'ready'}>{tableState(m) === 'ready' ? 'LISTA' : 'EN CURSO'}</span>}
              </button>
            ))}
          </div>
        </div>
        {sent && (
          <div className={s.sent} role="status">
            <b>Enviada</b>
            <span>Comanda de {sent} en cocina</span>
          </div>
        )}
        {toasts}
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
          {open.some((o) => o.table_label === mesa && o.status === 'ready') && (
            <div className={s.banner}>
              <span>Hay una comanda de {mesa} lista en cocina.</span>
              {open
                .filter((o) => o.table_label === mesa && o.status === 'ready')
                .map((o) => (
                  <button key={o.id} onClick={() => deliver(o.id)}>Entregada #{o.id}</button>
                ))}
            </div>
          )}
          <label className={s.search}>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en toda la carta" aria-label="Buscar producto" enterKeyHint="search" />
            {q && <button type="button" onClick={() => setQ('')}>Borrar</button>}
          </label>
          {!q && (
            <div className={s.topRow}>
              <span className={s.topLabel}>Más pedidos</span>
              {top.map((p) => (
                <button key={p.id} className={s.topBtn} onClick={() => tap(p)} disabled={!p.available}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <div className={s.cats}>
            {categories.map((c) => (
              <button key={c.id} className={s.cat} data-active={!q && c.id === catId} onClick={() => { setQ(''); setCatId(c.id); }}>
                {c.name}
              </button>
            ))}
          </div>
          <div className={s.products}>
            {q && visible.length === 0 && <p className={s.emptyCart}>Nada con “{q}”.</p>}
            {visible.map((p) => {
              const n = countFor(p.id);
              return (
                <button key={p.id} className={s.product} onClick={() => tap(p)} disabled={!p.available}>
                  <span className={s.pName}>
                    {q && <small className={s.pCat}>{categories.find((c) => c.id === p.category_id)?.name}</small>}
                    {p.name}
                  </span>
                  <span className={s.pMeta}>
                    <span className={s.pPrice}>{precio(p.price)}</span>
                    {!p.available && <span className={s.noHay}>No hay</span>}
                    {p.sin_tacc && <SinTacc />}
                  </span>
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
      {toasts}
    </div>
  );
}
