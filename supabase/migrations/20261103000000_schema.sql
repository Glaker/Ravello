-- =====================================================================
-- RAVELLO JARDÍN · schema del prototipo
--
-- ⚠️  AVISO DEMO  ⚠️
-- Las políticas RLS de este archivo están ABIERTAS para el rol `anon`
-- (cualquiera con la publishable key puede leer y escribir todo).
-- Es así SOLO porque esto es un prototipo de venta sin autenticación.
-- Antes de producción: agregar auth (mozos/admin), restringir escritura
-- de products/categories a admin y de orders a usuarios del staff.
-- =====================================================================

create table public.categories (
  id      bigint generated always as identity primary key,
  name    text not null,
  sort    int  not null default 0,
  station text not null default 'cocina' check (station in ('cocina', 'barra'))
);

create table public.products (
  id          bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id) on delete cascade,
  name        text not null,
  description text,
  price       int  not null check (price >= 0),          -- pesos, sin decimales
  available   boolean not null default true,
  sin_tacc    boolean not null default false,
  variants    jsonb,                                       -- [{ "name": "Pollo", "description": "..." }]
  sort        int  not null default 0
);
create index products_category_idx on public.products(category_id, sort);

create table public.orders (
  id          bigint generated always as identity primary key,
  table_label text not null,
  status      text not null default 'new'
              check (status in ('new', 'preparing', 'ready', 'delivered')),
  created_at  timestamptz not null default now()
);
create index orders_status_idx on public.orders(status, created_at);

create table public.order_items (
  id             bigint generated always as identity primary key,
  order_id       bigint not null references public.orders(id) on delete cascade,
  product_id     bigint references public.products(id) on delete set null,
  name_snapshot  text not null,
  price_snapshot int  not null,
  qty            int  not null default 1 check (qty > 0),
  note           text
);
create index order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- create_order: inserta la comanda y sus ítems en UNA transacción, así
-- cocina nunca recibe por realtime una orden sin ítems.
-- items: [{ "product_id": 12, "qty": 2, "note": "sin cebolla", "variant": "Pollo" }]
-- Nombre y precio se toman de products (snapshot del servidor).
-- ---------------------------------------------------------------------
create or replace function public.create_order(table_label text, items jsonb)
returns public.orders
language plpgsql
as $$
declare
  o public.orders;
begin
  if items is null or jsonb_array_length(items) = 0 then
    raise exception 'La comanda no tiene ítems';
  end if;

  insert into public.orders (table_label) values (create_order.table_label)
  returning * into o;

  insert into public.order_items (order_id, product_id, name_snapshot, price_snapshot, qty, note)
  select o.id,
         p.id,
         p.name || coalesce(' · ' || nullif(i->>'variant', ''), ''),
         p.price,
         greatest(coalesce((i->>'qty')::int, 1), 1),
         nullif(trim(i->>'note'), '')
  from jsonb_array_elements(items) as i
  join public.products p on p.id = (i->>'product_id')::bigint;

  if not found then
    raise exception 'Ningún producto válido en la comanda';
  end if;

  return o;
end;
$$;

-- Borra todas las comandas (botón "Resetear demo" del admin).
create or replace function public.reset_demo()
returns void
language sql
as $$
  delete from public.orders where true;
$$;

-- ---------------------------------------------------------------------
-- RLS ABIERTO — SOLO DEMO (ver aviso arriba)
-- ---------------------------------------------------------------------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "DEMO abierto" on public.categories  for all to anon, authenticated using (true) with check (true);
create policy "DEMO abierto" on public.products    for all to anon, authenticated using (true) with check (true);
create policy "DEMO abierto" on public.orders      for all to anon, authenticated using (true) with check (true);
create policy "DEMO abierto" on public.order_items for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.categories, public.products, public.orders, public.order_items to anon, authenticated;
grant execute on function public.create_order(text, jsonb), public.reset_demo() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.products, public.orders, public.order_items;
