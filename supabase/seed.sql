-- Seed de la carta real de Ravello Jardín (carta impresa sept. 2026, corregida).
-- Idempotente: vacía todo y vuelve a cargar. También borra comandas.
truncate public.order_items, public.orders, public.products, public.categories restart identity cascade;

insert into public.categories (name, sort, station) values
  ('Especiales',                   10, 'cocina'),
  ('Café y bebidas sin alcohol',   20, 'barra'),
  ('Desayunos y meriendas',        30, 'cocina'),
  ('Brunch y tostadas',            40, 'cocina'),
  ('Sanguche de chipá',            50, 'cocina'),
  ('Pastelería',                   60, 'cocina'),
  ('Sin TACC',                     70, 'cocina'),
  ('Almuerzos',                    80, 'cocina'),
  ('Bebidas con alcohol',          90, 'barra');

insert into public.products (category_id, name, description, price, sin_tacc, variants, sort)
select c.id, v.name, v.description, v.price, v.sin_tacc, v.variants::jsonb, v.sort
from (values
  -- ESPECIALES
  ('Especiales', 'Desayuno Ravello',  'Café con leche + 2 medialunas',                         9500, false, null, 1),
  ('Especiales', 'Desayuno Jardín',   'Yogur con granola y frutos rojos + americano',         13500, false, null, 2),
  ('Especiales', 'Desayuno Vivero',   'Tostón con palta, tomates cherry y huevo + limonada',  16900, false, null, 3),
  ('Especiales', 'Merienda Jardín',   'Café con leche + tostado',                             15300, false, null, 4),
  ('Especiales', 'Merienda Ravello',  'Capuchino + rogel',                                    18000, false, null, 5),
  ('Especiales', 'Almuerzo Ravello',  'Wrap + limonada',                                      22000, false, null, 6),
  -- CAFÉ Y BEBIDAS SIN ALCOHOL
  ('Café y bebidas sin alcohol', 'Ristretto',               null, 3000, false, null, 1),
  ('Café y bebidas sin alcohol', 'Espresso / cortado',      null, 3700, false, null, 2),
  ('Café y bebidas sin alcohol', 'Espresso con crema',      null, 4900, false, null, 3),
  ('Café y bebidas sin alcohol', 'Americano / cortado',     null, 4000, false, null, 4),
  ('Café y bebidas sin alcohol', 'Americano con crema',     null, 5100, false, null, 5),
  ('Café y bebidas sin alcohol', 'Capuchino',               null, 5500, false, null, 6),
  ('Café y bebidas sin alcohol', 'Café doble',              null, 5500, false, null, 7),
  ('Café y bebidas sin alcohol', 'Café con leche',          null, 5500, false, null, 8),
  ('Café y bebidas sin alcohol', 'Submarino',               null, 5300, false, null, 9),
  ('Café y bebidas sin alcohol', 'Jugo de naranja',         null, 5500, false, null, 10),
  ('Café y bebidas sin alcohol', 'Limonada',                null, 5500, false, null, 11),
  ('Café y bebidas sin alcohol', 'Limonada de frutillas',   null, 6000, false, null, 12),
  ('Café y bebidas sin alcohol', 'Licuado',                 'Banana o frutilla, con agua o leche', 5500, false, null, 13),
  ('Café y bebidas sin alcohol', 'Agua con/sin gas',        null, 3900, false, null, 14),
  ('Café y bebidas sin alcohol', 'Gaseosa latita 354 ml',   null, 6500, false, null, 15),
  ('Café y bebidas sin alcohol', 'Té',                      null, 3000, false, null, 16),
  ('Café y bebidas sin alcohol', 'Café frío / Frappé',      null, 4500, false, null, 17),
  -- DESAYUNOS Y MERIENDAS
  ('Desayunos y meriendas', 'Medialuna dulce',                   null,  3000, false, null, 1),
  ('Desayunos y meriendas', 'Medialuna salada',                  null,  3000, false, null, 2),
  ('Desayunos y meriendas', 'Medialuna con jamón y queso',       null,  5700, false, null, 3),
  ('Desayunos y meriendas', 'Croissant',                         null,  5900, false, null, 4),
  ('Desayunos y meriendas', 'Croissant con jamón y queso',       null,  9900, false, null, 5),
  ('Desayunos y meriendas', 'Fosforito',                         null,  5000, false, null, 6),
  ('Desayunos y meriendas', 'Fosforito con jamón y queso',       null,  9500, false, null, 7),
  ('Desayunos y meriendas', 'Chipá (x2)',                        null,  2700, true,  null, 8),
  ('Desayunos y meriendas', 'Chipá (1/4 kg)',                    null, 10000, true,  null, 9),
  ('Desayunos y meriendas', 'Yogur con granola y frutos rojos',  null, 11500, false, null, 10),
  ('Desayunos y meriendas', 'Tostado de jamón y queso',          null, 12000, false, null, 11),
  -- BRUNCH Y TOSTADAS
  ('Brunch y tostadas', 'Tostadas de masa madre con queso crema y mermelada', null,  6000, false, null, 1),
  ('Brunch y tostadas', 'Tostón con palta, huevo, tomates cherry y semillas', null, 13000, false, null, 2),
  -- SANGUCHE DE CHIPÁ (todos sin TACC)
  ('Sanguche de chipá', 'Jamón y queso',                     null, 11500, true, null, 1),
  ('Sanguche de chipá', 'Lomito y cheddar',                  null, 11500, true, null, 2),
  ('Sanguche de chipá', 'Queso tybo, roquefort y muzzarella', null, 11500, true, null, 3),
  -- PASTELERÍA
  ('Pastelería', 'Rogel',                                           null, 13000, false, null, 1),
  ('Pastelería', 'Crumble de frutos rojos',                         null, 13000, false, null, 2),
  ('Pastelería', 'Brownie con dulce de leche y merengue',           null, 13000, false, null, 3),
  ('Pastelería', 'Cookie red velvet',                               null,  7000, false, null, 4),
  ('Pastelería', 'Cookie de pistacho, chocolate blanco y frambuesa', null,  9800, false, null, 5),
  ('Pastelería', 'Alfajor de nuez',                                 null,  4500, false, null, 6),
  ('Pastelería', 'Alfajor Ferrero',                                 null,  5700, false, null, 7),
  ('Pastelería', 'Muffin de arándanos y limón',                     null,  5700, false, null, 8),
  -- SIN TACC
  ('Sin TACC', 'Scon de arándanos y limón',                   null, 6700, true, null, 1),
  ('Sin TACC', 'Scon de banana y nuez',                       null, 6700, true, null, 2),
  ('Sin TACC', 'Cookies de zanahoria, canela, pasas y nueces', null, 7400, true, null, 3),
  ('Sin TACC', 'Alfajorcito marroc bañado en chocolate',      null, 7000, true, null, 4),
  ('Sin TACC', 'Alfajorcito de dulce de cajú',                null, 7000, true, null, 5),
  -- ALMUERZOS
  ('Almuerzos', 'Pizzeta muzzarella',        'Masa de harina de cáñamo', 15000, false, null, 1),
  ('Almuerzos', 'Pizzeta especial',          'Masa de harina de cáñamo', 16500, false, null, 2),
  ('Almuerzos', 'Pizzeta cherry y albahaca', 'Masa de harina de cáñamo', 16000, false, null, 3),
  ('Almuerzos', 'Wraps', null, 18500, false,
     '[{"name":"Pollo","description":"pechuga, cebolla, morrón amarillo, zanahoria, jengibre, queso crema, curry"},
       {"name":"Carne","description":"roast beef, morrón, morrón amarillo, zanahoria, cebolla, muzzarella, pimentón ahumado"},
       {"name":"Veggie","description":"berenjena, zucchini, morrón, cebolla, zanahoria, portobellos, palta, queso crema y limón"}]', 4),
  -- BEBIDAS CON ALCOHOL
  ('Bebidas con alcohol', 'Porrón Stella Artois',              null,  6500, false, null, 1),
  ('Bebidas con alcohol', 'Porrón Stella Artois sin alcohol',  null,  5500, false, null, 2),
  ('Bebidas con alcohol', 'Corona 710 ml',                     null, 12000, false, null, 3),
  ('Bebidas con alcohol', 'Cerveza Michelob',                  null,  5100, true,  null, 4),
  ('Bebidas con alcohol', 'Gin tonic',                         null,  8000, false, null, 5),
  ('Bebidas con alcohol', 'Vermú Cinzano',                     null,  7000, false, null, 6),
  ('Bebidas con alcohol', 'Fernet',                            null,  8000, false, null, 7),
  ('Bebidas con alcohol', 'Cynar',                             'Con jugo de pomelo y soda', 7000, false, null, 8),
  ('Bebidas con alcohol', 'Tinto de verano',                   null,  7000, false, null, 9),
  ('Bebidas con alcohol', 'Vino (botella)',                    null, 18000, false, null, 10),
  ('Bebidas con alcohol', 'Copa de vino',                      null,  8000, false, null, 11)
) as v(cat, name, description, price, sin_tacc, variants, sort)
join public.categories c on c.name = v.cat;
