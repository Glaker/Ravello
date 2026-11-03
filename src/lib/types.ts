export type Station = 'cocina' | 'barra';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'delivered';

export interface Category {
  id: number;
  name: string;
  sort: number;
  station: Station;
}

export interface Variant {
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  sin_tacc: boolean;
  variants: Variant[] | null;
  sort: number;
}

export interface Order {
  id: number;
  table_label: string;
  status: OrderStatus;
  created_at: string;
  preparing_at?: string | null;
  ready_at?: string | null;
  delivered_at?: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  name_snapshot: string;
  price_snapshot: number;
  qty: number;
  note: string | null;
}

export interface PriceChange {
  id: number;
  product_id: number;
  old: number;
  new: number;
  created_at: string;
}
