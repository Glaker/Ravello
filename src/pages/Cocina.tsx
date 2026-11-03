import { useEffect, useMemo, useState } from 'react';
import { Isotipo } from '../brand/Logo';
import { useMenu } from '../hooks/useMenu';
import { useOrders, type FullOrder } from '../hooks/useOrders';
import { useWakeLock } from '../hooks/useWakeLock';
import { chime, unlockAudio } from '../lib/chime';
import { hora, minutosDesde } from '../lib/format';
import type { OrderStatus, Station } from '../lib/types';
import s from './Cocina.module.css';

type Filter = 'todo' | Station;
const COLS: { status: OrderStatus; title: string; action: string; empty: string }[] = [
  { status: 'new', title: 'Nuevas', action: 'Tocar para empezar', empty: 'Sin comandas nuevas' },
  { status: 'preparing', title: 'En preparación', action: 'Tocar cuando esté lista', empty: 'Nada en preparación' },
  { status: 'ready', title: 'Listas', action: 'Tocar al entregar', empty: 'Nada para entregar' },
];
const FRESH_MS = 9000;
const FILTER_KEY = 'ravello-kds-filter';

function readFilter(): Filter {
  try {
    const v = localStorage.getItem(FILTER_KEY);
    return v === 'cocina' || v === 'barra' ? v : 'todo';
  } catch {
    return 'todo';
  }
}

export default function Cocina() {
  const embedded = new URLSearchParams(location.search).has('embed');
  const [started, setStarted] = useState(false);
  const [filter, setFilter] = useState<Filter>(readFilter);
  const [now, setNow] = useState(Date.now());
  const [fresh, setFresh] = useState<Record<number, number>>({});
  const { categories, products } = useMenu();
  const { orders, conn, advance } = useOrders((o) => {
    setFresh((f) => ({ ...f, [o.id]: Date.now() }));
    chime();
  });
  const wake = useWakeLock(started);

  useEffect(() => {
    document.title = 'Cocina · Ravello Jardín';
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, filter);
    } catch {
      /* noop */
    }
  }, [filter]);

  const stationOf = useMemo(() => {
    const catStation = new Map(categories.map((c) => [c.id, c.station]));
    const m = new Map<number, Station>();
    products.forEach((p) => m.set(p.id, catStation.get(p.category_id) ?? 'cocina'));
    return (productId: number | null): Station => (productId != null ? m.get(productId) : undefined) ?? 'cocina';
  }, [categories, products]);

  const view = useMemo(
    () =>
      orders
        .map((o) => {
          const items = filter === 'todo' ? o.order_items : o.order_items.filter((i) => stationOf(i.product_id) === filter);
          return { o, items, hidden: o.order_items.length - items.length };
        })
        .filter((x) => x.items.length > 0),
    [orders, filter, stationOf],
  );

  const start = () => {
    unlockAudio();
    setStarted(true);
  };

  const ticket = ({ o, items, hidden }: { o: FullOrder; items: FullOrder['order_items']; hidden: number }, action: string) => {
    const min = minutosDesde(o.created_at, now);
    const age = o.status === 'ready' ? 'ok' : min > 20 ? 'late' : min > 10 ? 'warn' : 'ok';
    const isFresh = (fresh[o.id] ?? 0) > Date.now() - FRESH_MS;
    return (
      <button key={o.id} className={s.ticket} data-age={age} data-status={o.status} data-fresh={isFresh} onClick={() => advance(o)}>
        <div className={s.tHead}>
          <span className={s.tMesa}>{o.table_label}</span>
          <span className={s.tTime}>{hora(o.created_at)}</span>
          <span className={s.tAge}>{min}′</span>
        </div>
        <ul className={s.items}>
          {items.map((i) => (
            <li key={i.id}>
              <b>{i.qty}×</b>
              <span>{i.name_snapshot}</span>
              {filter === 'todo' && stationOf(i.product_id) === 'barra' && <span className={s.station}>Barra</span>}
              {i.note && <span className={s.note}>{i.note}</span>}
            </li>
          ))}
        </ul>
        {hidden > 0 && <div className={s.other}>+ {hidden} ítem{hidden > 1 ? 's' : ''} de {filter === 'cocina' ? 'barra' : 'cocina'}</div>}
        <div className={s.tFoot}>
          <span>#{o.id}</span>
          <span>{action}</span>
        </div>
      </button>
    );
  };

  return (
    <div className={s.page}>
      <div className={s.top}>
        <Isotipo width={46} />
        <h1>{filter === 'barra' ? 'Barra' : 'Cocina'}</h1>
        <div className={s.seg} role="group" aria-label="Estación">
          {(['todo', 'cocina', 'barra'] as Filter[]).map((f) => (
            <button key={f} data-on={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <span className={s.status} data-bad={conn === 'offline'}>
          {conn === 'offline' ? 'Sin conexión' : conn === 'live' ? 'Conectado' : 'Conectando…'}
          {wake.supported && started && !embedded ? (wake.active ? ' · pantalla fija' : '') : ''}
        </span>
        <span className={s.clock}>{hora(new Date(now).toISOString())}</span>
      </div>

      <div className={s.cols}>
        {COLS.map((c) => {
          const list = view.filter((x) => x.o.status === c.status);
          return (
            <section key={c.status} className={s.col}>
              <div className={s.colHead}>
                <h2>{c.title}</h2>
                <span>{list.length}</span>
              </div>
              <div className={s.list}>
                {list.length === 0 && <div className={s.empty}>{c.empty}</div>}
                {list.map((x) => ticket(x, c.action))}
              </div>
            </section>
          );
        })}
      </div>

      {!started && (
        <div className={s.gate}>
          <Isotipo width={120} />
          <p>Tocá para empezar: activa el sonido de comandas nuevas y mantiene la pantalla encendida.</p>
          <button onClick={start}>Empezar turno</button>
        </div>
      )}
    </div>
  );
}
