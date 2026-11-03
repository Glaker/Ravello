import { useEffect } from 'react';
import { Isotipo } from '../brand/Logo';
import s from './Demo.module.css';

/** Vista para presentar desde una sola pantalla: mozo a la izquierda, cocina a la derecha. */
export default function Demo() {
  useEffect(() => {
    document.title = 'Demo · Ravello Jardín';
  }, []);
  return (
    <div className={s.page}>
      <header className={s.head}>
        <Isotipo width={44} />
        <b>Ravello · demo en vivo</b>
        <span>Cargá una comanda a la izquierda: entra sola en la cocina.</span>
        <a href="/carta" target="_blank" rel="noreferrer">Carta</a>
        <a href="/admin/carta" target="_blank" rel="noreferrer">Admin</a>
      </header>
      <div className={s.split}>
        <section className={s.left}>
          <h2>Mozo · celu</h2>
          <div className={s.phone}>
            <iframe src="/mozo" title="Mozo" />
          </div>
        </section>
        <section className={s.right}>
          <h2>Cocina · tablet</h2>
          <div className={s.tablet}>
            <iframe src="/cocina?embed" title="Cocina" allow="screen-wake-lock; autoplay" />
          </div>
        </section>
      </div>
    </div>
  );
}
