import { useMemo, useState } from 'react';
import { Button, Group, Modal, SegmentedControl, Select, Text } from '@mantine/core';
import { precio, redondear } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { Category, Product } from '../lib/types';
import s from './AjustePrecios.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  initialCategory?: number | null;
  onDone: (msg: string) => void;
}

const PASOS = ['50', '100', '500'];

export function AjustePrecios({ opened, onClose, categories, products, initialCategory = null, onDone }: Props) {
  const [scope, setScope] = useState<string>(initialCategory ? String(initialCategory) : 'todo');
  const [pctText, setPctText] = useState('10');
  const [paso, setPaso] = useState('100');
  const [busy, setBusy] = useState(false);
  const [lastInit, setLastInit] = useState(initialCategory);
  if (initialCategory !== lastInit) {
    setLastInit(initialCategory);
    setScope(initialCategory ? String(initialCategory) : 'todo');
  }

  const pct = Number(pctText.replace(',', '.'));
  const valid = Number.isFinite(pct) && pct !== 0 && pct > -90 && pct < 300;

  const preview = useMemo(() => {
    if (!valid) return [];
    const sel = scope === 'todo' ? products : products.filter((p) => p.category_id === Number(scope));
    const order = new Map(categories.map((c, i) => [c.id, i]));
    return sel
      .slice()
      .sort((a, b) => (order.get(a.category_id)! - order.get(b.category_id)!) || a.sort - b.sort)
      .map((p) => ({ p, next: redondear(p.price * (1 + pct / 100), Number(paso)) }));
  }, [valid, scope, products, categories, pct, paso]);

  const changes = preview.filter((x) => x.next !== x.p.price);
  const totalAntes = preview.reduce((a, x) => a + x.p.price, 0);
  const totalDesp = preview.reduce((a, x) => a + x.next, 0);
  const real = totalAntes ? ((totalDesp - totalAntes) / totalAntes) * 100 : 0;

  const apply = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('apply_prices', { changes: changes.map((x) => ({ id: x.p.id, price: x.next })) });
    setBusy(false);
    if (error) return onDone('No se pudo aplicar: ' + error.message);
    onDone(`${data} precios actualizados (${pct > 0 ? '+' : ''}${pct}%)`);
    onClose();
  };

  const catName = (id: number) => categories.find((c) => c.id === id)?.name ?? '';

  return (
    <Modal opened={opened} onClose={onClose} size="lg" centered title={<span className="r-title" style={{ fontSize: 24 }}>Ajustar precios</span>}>
      <div className={s.controls}>
        <Select
          label="Qué"
          value={scope}
          onChange={(v) => v && setScope(v)}
          data={[{ value: 'todo', label: 'Toda la carta' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
          allowDeselect={false}
          comboboxProps={{ shadow: 'none' }}
        />
        <label className={s.pct}>
          <span>Porcentaje</span>
          <div>
            <input inputMode="decimal" value={pctText} onChange={(e) => setPctText(e.target.value.replace(/[^\d,.-]/g, ''))} aria-label="Porcentaje" />
            <b>%</b>
          </div>
          <small>Negativo para bajar (ej. −5)</small>
        </label>
        <div>
          <Text component="span" size="sm" fw={500} display="block" mb={4}>Redondear a</Text>
          <SegmentedControl value={paso} onChange={setPaso} data={PASOS.map((v) => ({ value: v, label: `$${v}` }))} fullWidth />
        </div>
      </div>

      <div className={s.summary}>
        {valid ? (
          <>
            <b>{changes.length}</b> de {preview.length} productos cambian · variación real {real > 0 ? '+' : ''}
            {real.toFixed(1).replace('.', ',')}% (por el redondeo)
          </>
        ) : (
          'Poné un porcentaje distinto de 0.'
        )}
      </div>

      <div className={s.table} role="table" aria-label="Vista previa">
        <div className={s.head} role="row">
          <span>Producto</span>
          <span>Antes</span>
          <span>Después</span>
        </div>
        {preview.map(({ p, next }, i) => {
          const showCat = scope === 'todo' && (i === 0 || preview[i - 1].p.category_id !== p.category_id);
          return (
            <div key={p.id}>
              {showCat && <div className={s.cat}>{catName(p.category_id)}</div>}
              <div className={s.row} role="row" data-same={next === p.price}>
                <span>{p.name}</span>
                <span className={s.before}>{precio(p.price)}</span>
                <span className={s.after}>{precio(next)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Group justify="space-between" mt="md">
        <Text size="sm" c="tinta.5">Queda registrado en el historial de precios.</Text>
        <Group gap="xs">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button onClick={apply} disabled={!valid || !changes.length} loading={busy}>
            Aplicar {changes.length || ''} cambios
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
