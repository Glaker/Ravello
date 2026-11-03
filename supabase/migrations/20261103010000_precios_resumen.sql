-- =====================================================================
-- Historial de precios, timestamps de estado de comandas, ranking.
-- ⚠️ DEMO: igual que en el schema inicial, RLS abierto para anon.
-- =====================================================================

-- ---------- Historial de precios ----------
create table public.price_changes (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  old        int not null,
  new        int not null,
  created_at timestamptz not null default now()
);
create index price_changes_created_idx on public.price_changes(created_at desc);

-- Todo cambio de precio queda registrado (edición inline o ajuste masivo).
create or replace function public.log_price_change()
returns trigger language plpgsql as $$
begin
  if new.price is distinct from old.price then
    insert into public.price_changes (product_id, old, new) values (new.id, old.price, new.price);
  end if;
  return new;
end;
$$;
create trigger products_price_log after update of price on public.products
for each row execute function public.log_price_change();

-- Ajuste masivo en UNA transacción: recibe exactamente los precios de la vista previa.
-- changes: [{ "id": 12, "price": 5800 }]
create or replace function public.apply_prices(changes jsonb)
returns int language sql as $$
  with c as (
    select (x->>'id')::bigint as id, (x->>'price')::int as price
    from jsonb_array_elements(changes) x
  ), u as (
    update public.products p set price = c.price
    from c where p.id = c.id and p.price <> c.price and c.price >= 0
    returning p.id
  )
  select count(*)::int from u;
$$;

-- ---------- Tiempos de comandas ----------
alter table public.orders
  add column preparing_at timestamptz,
  add column ready_at     timestamptz,
  add column delivered_at timestamptz;

create or replace function public.stamp_order_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'preparing' and new.preparing_at is null then new.preparing_at := now(); end if;
    if new.status = 'ready'     and new.ready_at     is null then new.ready_at     := now(); end if;
    if new.status = 'delivered' and new.delivered_at is null then new.delivered_at := now(); end if;
  end if;
  return new;
end;
$$;
create trigger orders_stamp before update of status on public.orders
for each row execute function public.stamp_order_status();

-- ---------- Más pedidos (para el mozo) ----------
create or replace function public.top_products(lim int default 6)
returns table (product_id bigint, qty bigint)
language sql stable as $$
  select oi.product_id, sum(oi.qty)::bigint
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.product_id is not null
  group by oi.product_id
  order by 2 desc
  limit lim;
$$;

-- reset_demo: comandas fuera; el historial de precios se conserva.

-- ---------- RLS / permisos (DEMO abierto) ----------
alter table public.price_changes enable row level security;
create policy "DEMO abierto" on public.price_changes for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.price_changes to anon, authenticated;
grant execute on function public.apply_prices(jsonb), public.top_products(int) to anon, authenticated;

alter publication supabase_realtime add table public.price_changes;
