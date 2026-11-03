import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Category, Product } from '../lib/types';

export type ConnState = 'connecting' | 'live' | 'offline';

/**
 * Carta completa desde Supabase + cambios en vivo de `products`.
 * Vuelve a pedir todo al reconectar o al volver a la pestaña (los celulares
 * cortan el websocket cuando la pantalla se apaga).
 */
export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conn, setConn] = useState<ConnState>('connecting');
  /** ids de productos cuyo precio cambió hace instantes (para el destello) */
  const [changed, setChanged] = useState<Record<number, number>>({});
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('sort'),
      supabase.from('products').select('*').order('sort'),
    ]);
    if (c.error || p.error) {
      setError((c.error ?? p.error)!.message);
    } else {
      setCategories(c.data as Category[]);
      setProducts(p.data as Product[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('menu-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload: RealtimePostgresChangesPayload<Product>) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as Partial<Product>).id;
          setProducts((ps) => ps.filter((p) => p.id !== id));
          return;
        }
        const row = payload.new as Product;
        const prev = productsRef.current.find((p) => p.id === row.id);
        if (prev && (prev.price !== row.price || prev.available !== row.available)) {
          setChanged((c) => ({ ...c, [row.id]: Date.now() }));
        }
        setProducts((ps) => {
          const i = ps.findIndex((p) => p.id === row.id);
          if (i === -1) return [...ps, row].sort((a, b) => a.sort - b.sort || a.id - b.id);
          const next = ps.slice();
          next[i] = row;
          return next;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConn((prev) => {
            if (prev !== 'connecting') load(); // reconexión: puede haberse perdido algo
            return 'live';
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConn('offline');
        }
      });

    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { categories, products, setProducts, loading, error, conn, changed, reload: load };
}
