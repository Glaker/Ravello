import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, OrderStatus } from '../lib/types';

export type FullOrder = Order & { order_items: OrderItem[] };
const OPEN: OrderStatus[] = ['new', 'preparing', 'ready'];
const SELECT = '*, order_items(*)';

/**
 * Comandas abiertas en vivo. Escucha INSERT/UPDATE de `orders` y recién ahí
 * pide la comanda completa (la RPC create_order garantiza que ya tiene ítems).
 */
export function useOrders(onNew?: (o: FullOrder) => void) {
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [conn, setConn] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const loadAll = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select(SELECT).in('status', OPEN).order('created_at');
    if (!error) setOrders(data as FullOrder[]);
  }, []);

  const upsert = (o: FullOrder) =>
    setOrders((os) => {
      if (!OPEN.includes(o.status)) return os.filter((x) => x.id !== o.id);
      const i = os.findIndex((x) => x.id === o.id);
      if (i === -1) return [...os, o].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const next = os.slice();
      next[i] = o;
      return next;
    });

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel('kds-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (p) => {
        const { data } = await supabase.from('orders').select(SELECT).eq('id', (p.new as Order).id).single();
        if (data) {
          upsert(data as FullOrder);
          onNewRef.current?.(data as FullOrder);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, async (p) => {
        const row = p.new as Order;
        if (!OPEN.includes(row.status)) return setOrders((os) => os.filter((x) => x.id !== row.id));
        const { data } = await supabase.from('orders').select(SELECT).eq('id', row.id).single();
        if (data) upsert(data as FullOrder);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (p) => {
        const id = (p.old as Partial<Order>).id;
        setOrders((os) => os.filter((x) => x.id !== id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConn((prev) => {
            if (prev !== 'connecting') loadAll();
            return 'live';
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setConn('offline');
      });
    const onVis = () => document.visibilityState === 'visible' && loadAll();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      supabase.removeChannel(ch);
    };
  }, [loadAll]);

  const advance = async (o: FullOrder) => {
    const next: Record<OrderStatus, OrderStatus> = { new: 'preparing', preparing: 'ready', ready: 'delivered', delivered: 'delivered' };
    const status = next[o.status];
    upsert({ ...o, status }); // optimista
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id);
    if (error) loadAll();
  };

  return { orders, conn, advance };
}
