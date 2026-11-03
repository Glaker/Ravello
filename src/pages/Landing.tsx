import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { MenuRow } from '../components/MenuRow';
import { Direccion } from '../components/Direccion';
import { Photo, PhotoPlaceholder } from '../components/Photo';
import { useMenu } from '../hooks/useMenu';
import { site } from '../theme/tokens';
import s from './Landing.module.css';

const PROXIMO = {
  dia: 'Jueves',
  fecha: '19/11',
  hora: '17:30',
  titulo: 'Encuentro de lectura',
  texto: 'No hace falta experiencia previa. El material de lectura lo ponemos nosotros.',
};
const PASADOS = [
  { titulo: 'La última copa', texto: 'Cata de vino, cena y música en vivo, con Bodega Palo Alto.', extra: '$ 50.000', fecha: '[FECHA]' },
  { titulo: 'Viernes de pizzas de cáñamo', texto: '2x1 en vermú hasta las 21.', extra: null, fecha: '[FECHA]' },
];

export default function Landing() {
  const { categories, products } = useMenu();
  useEffect(() => {
    document.title = 'Ravello Jardín · ¡Sacate la ciudad!';
  }, []);
  const especiales = useMemo(() => {
    const cat = categories.find((c) => c.name === 'Especiales');
    return cat ? products.filter((p) => p.category_id === cat.id && p.available) : [];
  }, [categories, products]);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link to="/" className={s.brand} aria-label="Ravello Jardín, inicio">
          <Logo width={118} />
        </Link>
        <nav className={s.nav} aria-label="Secciones">
          <a href="#dia">De día</a>
          <a href="#noche">De noche</a>
          <a href="#horarios">Horarios</a>
        </nav>
        <Link to="/carta" className={s.cta}>
          Ver la carta
        </Link>
      </header>

      {/* ---------- HERO ---------- */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={s.kicker}>Vivero · café · noches — La Plata</p>
          <h1 className={s.heroTitle}>
            <span>¡Sacate</span>
            <span>la</span>
            <span>ciudad!</span>
          </h1>
          <p className={s.heroLead}>
            Un jardín en calle 9. De día, café y plantas. De noche, se prenden los faroles.
          </p>
          <div className={s.heroActions}>
            <Link to="/carta" className={s.btn}>
              Ver la carta
            </Link>
            <a href={site.maps} target="_blank" rel="noreferrer" className={s.link}>
              <Direccion />
            </a>
          </div>
        </div>
        <div className={s.heroMain}>
          <Photo name="jardin-noche" alt="El jardín de Ravello de noche, con plantas iluminadas" sizes="(max-width: 760px) 100vw, 55vw" position="50% 40%" priority />
        </div>
        <div className={s.heroInset}>
          <Photo name="sendero-noche" alt="Sendero entre plantas y faroles" sizes="(max-width: 760px) 45vw, 22vw" position="40% 60%" priority />
        </div>
      </section>

      {/* ---------- DE DÍA: CAFÉ ---------- */}
      <section id="dia" className={s.cafe}>
        <div className={s.cafePhoto}>
          <Photo name="galeria" alt="La galería techada, con mesas y paredes de ladrillo" sizes="(max-width: 760px) 100vw, 46vw" position="40% 55%" />
        </div>
        <div className={s.cafeText}>
          <p className={s.num}>01</p>
          <h2 className="r-title">
            De día,
            <br />
            café
            <span className="r-filete" />
          </h2>
          <p>
            Café, medialunas, chipá y algo dulce, entre plantas. Desayunos, meriendas y almuerzos livianos: wraps y pizzetas de harina de cáñamo.
          </p>
          <p className={s.note}>Hay opciones sin TACC, marcadas en la carta.</p>
        </div>
      </section>

      {/* ---------- VIVERO ---------- */}
      <section className={s.vivero}>
        <div className={s.viveroText}>
          <p className={s.num}>02</p>
          <h2 className="r-title">
            Vivero
            <span className="r-filete" />
          </h2>
          <p>Las plantas del jardín no son de adorno nomás: te las podés llevar.</p>
          <p className={s.placeholder}>[ASÍ: qué plantas tienen, si asesoran o hacen envíos]</p>
        </div>
        <figure className={s.viveroPhoto}>
          <Photo name="ficus" alt="Un ficus lyrata en maceta, apoyado sobre la corteza del jardín" sizes="(max-width: 760px) 80vw, 30vw" position="60% 40%" />
        </figure>
        <PhotoPlaceholder className={s.viveroPh}>plantas en venta, de día</PhotoPlaceholder>
      </section>

      {/* ---------- ESPECIALES ---------- */}
      <section className={s.especiales}>
        <div className={s.espHead}>
          <h2 className="r-title">
            Especiales
            <span className="r-filete" />
          </h2>
          <p>Los combos de la casa. Precios del día, los mismos que en la carta.</p>
        </div>
        <div className={s.espList}>
          {especiales.map((p) => (
            <div key={p.id}>
              <MenuRow name={p.name} price={p.price} bold />
              <p className={s.espDesc}>{p.description}</p>
            </div>
          ))}
          {!especiales.length && <p className={s.espDesc}>Cargando…</p>}
        </div>
        <Link to="/carta" className={s.btn}>
          La carta completa
        </Link>
      </section>

      {/* ---------- NOCHE / EVENTOS ---------- */}
      <section id="noche" className={s.noche}>
        <div className={s.nochePhoto}>
          <Photo name="patio-faroles" alt="El patio de adoquines al atardecer, con los faroles prendidos" sizes="(max-width: 760px) 100vw, 42vw" position="45% 70%" />
        </div>
        <div className={s.nocheBody}>
          <p className={s.num}>03</p>
          <h2 className="r-title">
            De noche
            <span className="r-filete" />
          </h2>
          <p className={s.nocheLead}>Cuando baja el sol se prenden los faroles: catas, lecturas, música en vivo.</p>

          <article className={s.next}>
            <div className={s.date}>
              <span>{PROXIMO.dia}</span>
              <b>{PROXIMO.fecha}</b>
              <span>{PROXIMO.hora} h</span>
            </div>
            <div className={s.nextText}>
              <p className={s.nextKicker}>Próximo</p>
              <h3>{PROXIMO.titulo}</h3>
              <p>{PROXIMO.texto}</p>
              <a href={site.instagram} target="_blank" rel="noreferrer" className={s.linkLight}>
                Anotate por Instagram [ASÍ: cupo y precio]
              </a>
            </div>
          </article>

          <h3 className={s.pastTitle}>Ya pasó por acá</h3>
          <ul className={s.past}>
            {PASADOS.map((e) => (
              <li key={e.titulo}>
                <span className={s.pastDate}>{e.fecha}</span>
                <div>
                  <b>{e.titulo}</b>
                  <span>
                    {e.texto}
                    {e.extra && <em> {e.extra}</em>}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- HORARIOS / DÓNDE ---------- */}
      <section id="horarios" className={s.info}>
        <div className={s.horarios}>
          <h2 className="r-title">
            Horarios
            <span className="r-filete" />
          </h2>
          <div className={s.hours}>
            {site.horarios.map((h) => (
              <div key={h.dias} className="r-row">
                <span className="r-row__name">{h.dias}</span>
                <span className="r-row__price">{h.horas} h</span>
              </div>
            ))}
          </div>
        </div>
        <div className={s.donde}>
          <h2 className="r-title">
            Dónde
            <span className="r-filete" />
          </h2>
          <p className={s.address}>
            Calle 9 entre 56 y 57,
            <br />
            <Direccion text="nº 1161 · La Plata" />
          </p>
          <div className={s.links}>
            <a href={site.maps} target="_blank" rel="noreferrer" className={s.btn}>
              Abrir en Google Maps
            </a>
            <a href={site.instagram} target="_blank" rel="noreferrer" className={s.link}>
              {site.instagramHandle}
            </a>
          </div>
        </div>
        <PhotoPlaceholder className={s.fachada}>la entrada por calle 9, para reconocerla</PhotoPlaceholder>
      </section>

      <footer className={s.footer}>
        <Logo width={150} />
        <p className={s.footLema}>{site.lema}</p>
        <nav className={s.footNav}>
          <Link to="/carta">Carta</Link>
          <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>
          <a href={site.maps} target="_blank" rel="noreferrer">Cómo llegar</a>
        </nav>
      </footer>
    </div>
  );
}
