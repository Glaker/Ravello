import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Isotipo } from '../brand/Logo';
import s from './AdminBar.module.css';

export function AdminBar({ children }: { children?: ReactNode }) {
  return (
    <div className={s.bar}>
      <div className={s.in}>
        <Isotipo width={44} />
        <nav className={s.nav}>
          <NavLink to="/admin/carta" className={({ isActive }) => (isActive ? s.active : '')}>Carta</NavLink>
          <NavLink to="/admin/resumen" className={({ isActive }) => (isActive ? s.active : '')}>Resumen del día</NavLink>
        </nav>
        <div className={s.actions}>{children}</div>
      </div>
    </div>
  );
}
