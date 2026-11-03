import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { MenuRow, SinTacc } from '../components/MenuRow';
import { useMenu } from '../hooks/useMenu';
import { normalizar } from '../lib/format';
import type { Product } from '../lib/types';
import { site } from '../theme/tokens';
import s from './Carta.module.css';

const FLASH_MS = 2000;
const ALL_SIN_TACC = new Set(['Sanguche de chipá', 'Sin TACC']);

function slug(name: string) {
  return normalizar(name).replace(/[^a-z0-9]+/g, '-');
}

export default function Carta() {
  const { categories, products, loading, error, conn, changed } = useMenu();
  const [q, setQ] = useState('');
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [active, setActive] = useState<string>('');
  const navRef = useRef<HTMLDivElement>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    document.title = 'Carta · Ravello Jardín';
  }, []);

  // re-render para apagar destellos
  useEffect(() => {
    const ids = Object.values(changed);
    if (!ids.length) return;
    const t = setTimeout(() => tick((n) => n + 1), FLASH_MS);
    return () => clearTimeout(t);
  }, [changed]);

  const sections = useMemo(() => {
    const nq = normalizar(q.trim());
    return categories
      .map((c) => {
        const items = products.filter((p) => {
          if (p.category_id !== c.id) return false;
          if (hideSoldOut && !p.available) return false;
          if (!nq) return true;
          const hay = normalizar([p.name, p.description ?? '', c.name, p.sin_tacc ? 'sin tacc celiaco' : '', ...(p.variants ?? []).flatMap((v) => [v.name, v.description ?? ''])].join(' '));
          return nq.split(/\s+/).every((w) => hay.includes(w));
        });
        return { cat: c, items };
      })
      .filter((x) => x.items.length > 0);
  }, [categories, products, q, hideSoldOut]);

  // scroll-spy
  useEffect(() => {
    const els = sections.map((x) => document.getElementById(slug(x.cat.name))).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-64px 0px -65% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const now = Date.now();
  const isFlash = (p: Product) => (changed[p.id] ?? 0) > now - FLASH_MS;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.wrap}>
          <Link to="/" aria-label="Ir al inicio">
            <Logo width={150} />
          </Link>
          <p className={s.lema}>{site.lema}</p>
        </div>
      </header>

      <div className={s.sticky}>
        <nav className={s.nav} ref={navRef} aria-label="Categorías">
          {sections.map(({ cat }) => {
            const id = slug(cat.name);
            return (
              <button
                key={cat.id}
                data-id={id}
                data-active={active === id}
                className={s.navItem}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              >
                {cat.name}
              </button>
            );
          })}
        </nav>
      </div>

      <main className={s.wrap}>
        <label className={s.search}>
          <span className="r-kicker" style={{ color: 'var(--bordo)' }}>Buscar</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="medialuna, sin tacc, wrap…" aria-label="Buscar en la carta" enterKeyHint="search" />
          {q && (
            <button type="button" onClick={() => setQ('')}>
              Borrar
            </button>
          )}
        </label>

        {loading && <p className={s.empty}>Cargando la carta…</p>}
        {error && <p className={s.empty}>No pudimos cargar la carta. Probá de nuevo en un ratito.</p>}
        {!loading && !error && sections.length === 0 && <p className={s.empty}>No encontramos “{q}” en la carta.</p>}

        {sections.map(({ cat, items }) => {
          const especial = cat.name === 'Especiales';
          const allTacc = ALL_SIN_TACC.has(cat.name);
          return (
            <section key={cat.id} id={slug(cat.name)} className={s.section}>
              <div className={s.sectionHead}>
                <h2 className={`r-title ${s.sectionTitle}`}>
                  {cat.name}
                </h2>
                <div className={s.filete} />
                {allTacc && (
                  <div className={s.allTacc}>
                    <SinTacc size="md" /> <span>todo apto celíacos</span>
                  </div>
                )}
              </div>
              <div className={s.items}>
                {items.map((p) => (
                  <div key={p.id} className={s.item}>
                    <MenuRow
                      bold={especial}
                      struck={!p.available}
                      flash={isFlash(p)}
                      price={p.price}
                      name={
                        <>
                          {p.name}
                          {!p.available && <span className={s.soldout}>No hay</span>}
                          {p.sin_tacc && !allTacc && (
                            <span className={s.badgeInline}>
                              <SinTacc />
                            </span>
                          )}
                        </>
                      }
                    />
                    {p.description && <div className={`${s.desc} ${especial ? '' : s.descItalic}`}>{p.description}</div>}
                    {p.variants && p.variants.length > 0 && (
                      <ul className={s.variants}>
                        {p.variants.map((v) => (
                          <li key={v.name}>
                            — <b>{v.name}</b>
                            {v.description && <i> · {v.description}</i>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {!loading && !error && (
          <footer className={s.foot}>
            <div>
              <h3>Horarios</h3>
              {site.horarios.map((h) => (
                <p key={h.dias}>
                  {h.dias}: <span style={{ whiteSpace: 'nowrap' }}>{h.horas} h</span>
                </p>
              ))}
            </div>
            <div>
              <h3>Dónde</h3>
              <p>
                <a href={site.maps} target="_blank" rel="noreferrer">
                  {site.direccion}
                </a>
                <br />
                {site.ciudad}
              </p>
              <p style={{ marginTop: 8 }}>
                <a href={site.instagram} target="_blank" rel="noreferrer">
                  {site.instagramHandle}
                </a>
              </p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="button" className={s.toggle} onClick={() => setHideSoldOut((v) => !v)}>
                {hideSoldOut ? 'Mostrar también lo que no hay hoy' : 'Ocultar lo que no hay hoy'}
              </button>
            </div>
          </footer>
        )}
      </main>

      {conn === 'offline' && <div className={s.offline}>Sin conexión. Te mostramos la última carta que cargó.</div>}
    </div>
  );
}
