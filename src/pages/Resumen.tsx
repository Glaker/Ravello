import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminBar } from '../components/AdminBar';
import { PinGate } from '../components/PinGate';
import { precio } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem } from '../lib/types';
import s from './Resumen.module.css';

type Full = Order & { order_items: OrderItem[] };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
const fmtMin = (m: number) => (m < 1 ? '< 1' : m.toFixed(m < 10 ? 1 : 0).replace('.', ','));

function Barras({ data }: { data: { h: number; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.n));
  const W = 720, H = 200, padB = 26, padT = 18;
  const bw = W / data.length;
  const peak = data.reduce((a, d) => (d.n > a.n ? d : a), data[0]);
  return (
    <figure className={s.chart}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Comandas por hora" onMouseLeave={() => setHover(null)}>
        <line x1={0} x2={W} y1={H - padB} y2={H - padB} stroke="var(--tinta)" strokeOpacity={0.35} />
        {data.map((d, i) => {
          const h = (d.n / max) * (H - padB - padT);
          const x = i * bw;
          return (
            <g key={d.h} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
              <rect x={x} y={0} width={bw} height={H - padB} fill="transparent" />
              {d.n > 0 && <rect x={x + 2} y={H - padB - h} width={bw - 4} height={h} rx={1.5} fill="var(--bordo)" opacity={hover === null || hover === i ? 1 : 0.45} />}
              {(d.h % 3 === 0 || hover === i) && (
                <text x={x + bw / 2} y={H - 8} textAnchor="middle" className={s.axis} fontWeight={hover === i ? 900 : 500}>
                  {d.h}
                </text>
              )}
              {((peak.n > 0 && d === peak && hover === null) || (hover === i && d.n > 0)) && (
                <text x={x + bw / 2} y={H - padB - h - 6} textAnchor="middle" className={s.val}>
                  {d.n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className={s.caption}>
        {hover !== null ? `${data[hover].h}:00 a ${data[hover].h + 1}:00 · ${data[hover].n} comanda${data[hover].n === 1 ? '' : 's'}` : 'Comandas por hora de entrada · pasá el dedo por las barras'}
      </figcaption>
      <table className="sr-only">
        <caption>Comandas por hora</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.h}>
              <th>{d.h}:00</th>
              <td>{d.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function ResumenDia() {
  const [orders, setOrders] = useState<Full[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').gte('created_at', startOfToday().toISOString()).order('created_at');
    setOrders((data as Full[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'Resumen del día · Ravello Jardín';
    load();
    const ch = supabase.channel('resumen').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const m = useMemo(() => {
    const total = orders.reduce((a, o) => a + o.order_items.reduce((b, i) => b + i.price_snapshot * i.qty, 0), 0);
    const items = orders.reduce((a, o) => a + o.order_items.reduce((b, i) => b + i.qty, 0), 0);
    const byName = new Map<string, { qty: number; total: number }>();
    orders.forEach((o) =>
      o.order_items.forEach((i) => {
        const k = byName.get(i.name_snapshot) ?? { qty: 0, total: 0 };
        k.qty += i.qty;
        k.total += i.qty * i.price_snapshot;
        byName.set(i.name_snapshot, k);
      }),
    );
    const top = [...byName.entries()].sort((a, b) => b[1].qty - a[1].qty || b[1].total - a[1].total).slice(0, 5);
    const prep = orders.filter((o) => o.ready_at).map((o) => (new Date(o.ready_at!).getTime() - new Date(o.created_at).getTime()) / 60000);
    const prepAvg = prep.length ? prep.reduce((a, b) => a + b, 0) / prep.length : null;
    const hours = orders.map((o) => new Date(o.created_at).getHours());
    const from = Math.min(12, ...hours);
    const to = Math.max(23, ...hours);
    const porHora = Array.from({ length: to - from + 1 }, (_, i) => ({ h: from + i, n: hours.filter((h) => h === from + i).length }));
    const abiertas = orders.filter((o) => o.status !== 'delivered').length;
    return { total, items, top, prepAvg, prepN: prep.length, porHora, abiertas, ticket: orders.length ? total / orders.length : 0 };
  }, [orders]);

  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={s.page}>
      <AdminBar />
      <main className={s.main}>
        <header className={s.head}>
          <p className="r-kicker" style={{ color: 'var(--tinta-suave)' }}>{hoy}</p>
          <h1 className="r-title">
            Resumen del día
            <span className="r-filete" />
          </h1>
        </header>

        {loading ? (
          <p>Cargando…</p>
        ) : (
          <>
            <section className={s.hero}>
              <div className={s.big}>
                <span className={s.label}>Vendido hoy</span>
                <span className={s.money}>{precio(m.total)}</span>
                <span className={s.sub}>
                  {orders.length} comanda{orders.length === 1 ? '' : 's'} · {m.items} ítems{m.abiertas ? ` · ${m.abiertas} sin entregar` : ''}
                </span>
              </div>
              <dl className={s.facts}>
                <div>
                  <dt>Ticket promedio</dt>
                  <dd>{orders.length ? precio(Math.round(m.ticket)) : '—'}</dd>
                </div>
                <div>
                  <dt>Preparación promedio</dt>
                  <dd>
                    {m.prepAvg === null ? '—' : <>{fmtMin(m.prepAvg)} <small>min</small></>}
                  </dd>
                  <span className={s.note}>{m.prepAvg === null ? 'Ninguna comanda llegó a “lista” todavía' : `de entrada a lista · ${m.prepN} comanda${m.prepN === 1 ? '' : 's'}`}</span>
                </div>
              </dl>
            </section>

            <div className={s.grid}>
              <section>
                <h2 className={s.h2}>Lo más pedido</h2>
                {m.top.length === 0 && <p className={s.empty}>Todavía no salió nada hoy.</p>}
                <ol className={s.top}>
                  {m.top.map(([name, v], i) => (
                    <li key={name}>
                      <span className={s.rank}>{i + 1}</span>
                      <div className="r-row" style={{ flex: 1 }}>
                        <span className="r-row__name">
                          {name} <b className={s.qty}>× {v.qty}</b>
                        </span>
                        <span className="r-row__price">{precio(v.total)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h2 className={s.h2}>Comandas por hora</h2>
                {orders.length === 0 ? <p className={s.empty}>Sin comandas hoy.</p> : <Barras data={m.porHora} />}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function Resumen() {
  return (
    <PinGate>
      <ResumenDia />
    </PinGate>
  );
}
