# Ravello Jardín · prototipo

Vivero + café de día, eventos de noche. 9 e/ 56 y 57 nº 1161, La Plata.
Prototipo de venta: carta digital en vivo, admin de precios, comandas mozo → cocina.

**Stack:** Vite + React + TypeScript · Mantine v7 (theme propio) · Supabase (Postgres + Realtime) · Vercel.

| Ruta | Qué es |
| --- | --- |
| `/` | Landing |
| `/carta` | Carta digital mobile-first, la que abre el QR. Se actualiza en vivo |
| `/admin/carta` | Precios inline, ajuste masivo por %, disponibilidad, alta de productos, historial, PDF, resetear demo (PIN) |
| `/admin/resumen` | Resumen del día: vendido, ticket promedio, top 5, comandas por hora, tiempo de preparación (PIN) |
| `/mozo` | Toma de pedidos por mesa (celu / tablet), buscador, más pedidos, aviso de comanda lista |
| `/cocina` | KDS: Nuevas / En preparación / Listas, filtro cocina/barra, sonido, pantalla siempre encendida |
| `/qr` | Hoja A4 imprimible con el QR a `/carta` |
| `/demo` | Mozo y cocina lado a lado (iframes), para presentar desde una pantalla |

## Correr local

```bash
npm install
cp .env.example .env.local   # completar valores
npm run dev                  # http://localhost:5173 (también expuesto en la red local)
```

## Supabase paso a paso

1. Crear un proyecto en <https://supabase.com/dashboard> (región `sa-east-1`).
2. Copiar a `.env.local`:
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings → API; la publishable key).
   - `SUPABASE_PROJECT_REF` (el ref del proyecto) y `SUPABASE_DB_PASSWORD` (la de la base).
3. Vincular y subir schema + datos (el CLI viene como devDependency):

   ```bash
   set -a; . ./.env.local; set +a        # en fish: export (cat .env.local | grep -v '^#')
   npx supabase login                     # una vez
   npx supabase link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"
   npx supabase db push --remote --include-seed -p "$SUPABASE_DB_PASSWORD"
   ```

   > Si el CLI dice `Missing required permission(s): project_admin_read` o no ve el proyecto,
   > probablemente haya un `SUPABASE_ACCESS_TOKEN` de otra cuenta en el entorno: `unset SUPABASE_ACCESS_TOKEN`.

4. **Volver a cargar la carta original** (pisa precios y borra comandas): `supabase/seed.sql` es idempotente.
   El CLI re-ejecuta el seed solo si el archivo cambió; para forzarlo, pegar el contenido de `supabase/seed.sql`
   en el SQL Editor del dashboard y ejecutarlo.

Qué crean las migraciones (`supabase/migrations/`):

- Tablas `categories` (con `station` cocina/barra), `products`, `orders`, `order_items`, `price_changes`.
- RPC `create_order(table_label, items jsonb)`: inserta comanda + ítems en una sola transacción
  (cocina nunca recibe una comanda vacía). Nombre y precio se toman del servidor.
- RPC `apply_prices(changes jsonb)`: ajuste masivo en una transacción, con los precios exactos de la vista previa.
- Trigger que registra **todo** cambio de precio en `price_changes` (de ahí sale “Precios actualizados al DD/MM”;
  sin cambios registrados se muestra la fecha de la carta impresa, 08/09).
- Trigger que guarda `preparing_at` / `ready_at` / `delivered_at` (para el tiempo de preparación).
- RPC `top_products(lim)` (fila “más pedidos” del mozo) y `reset_demo()` (borra comandas, conserva el historial de precios).
- Realtime en `products`, `orders`, `order_items`, `price_changes`.

## Deploy en Vercel

```bash
npx vercel link
# variables (solo las VITE_*, nunca la password de la base)
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel env add VITE_ADMIN_PIN production
npx vercel env add VITE_PUBLIC_URL production   # la URL final del deploy: es a donde apunta el QR
npx vercel --prod
```

`vercel.json` reescribe todas las rutas a `index.html` (SPA).

## Antes de producción (cosas que son así SOLO por ser demo)

- **RLS abierto:** cualquiera con la publishable key puede leer y escribir todas las tablas
  (está comentado en la migración). Hace falta auth para staff y políticas por rol.
- **PIN del admin en el bundle:** `VITE_ADMIN_PIN` se compila dentro del JS y se puede leer.
  Reemplazar por Supabase Auth (o similar) y validar del lado del servidor.
- Sin pagos, sin facturación, sin historial de ventas.

## Marca

- **Tipografía:** la carta usa Azo Sans (comercial). Reemplazo libre: **Urbanist** (OFL), la más cercana
  comparada contra el PDF. Está centralizada en `src/theme/tokens.ts` y `public/fonts`
  (`scripts/fonts.py` genera las instancias estáticas web + PDF).
- **Logo:** dos variantes vectoriales en `src/brand/` (y exportadas en `public/brand/`):
  `pdf` (techo fino con tres formas rellenas, como la carta) y `jpg` (contorno grueso con puntales).
  Se elige con `LOGO_VARIANT` en `src/theme/tokens.ts`. `npx tsx --tsconfig tsconfig.scripts.json scripts/logo-svg.tsx` regenera los SVG.
- **Fotos:** solo fotos reales del Instagram del local (`assets/`). `npm run images` genera WebP en 3 tamaños en `public/img`
  (recorta un objeto desenfocado en el ficus y un cartel de salida en la galería). Donde falta foto hay un `[FOTO: …]`
  y donde falta un dato, un `[ASÍ: …]` o `[FECHA]`.
- **PDF:** `src/pdf/CartaPdf.tsx` (@react-pdf/renderer). Para revisarlo sin navegador:
  `npx tsx --tsconfig tsconfig.scripts.json scripts/pdf-test.tsx carta.pdf` (con las VITE_* en el entorno).

## Guion de demo (3 minutos)

1. **La carta en el celu del cliente.** Escanear el QR (o abrir `/carta`). Mostrar categorías, buscador
   (“sin tacc”), las variantes de los wraps.
2. **Cambiar un precio.** En la notebook, `/admin/carta` → PIN → cambiar el Capuchino y apretar Enter.
   En el celu del cliente el precio cambia solo en menos de un segundo, con un destello. Apagar “Hay” en
   un producto: aparece tachado.
3. **El PDF nuevo.** “Descargar carta PDF”: sale la carta con el mismo armado que la impresa
   (3 páginas, dos columnas en café/desayunos) y los precios nuevos. Si sobra tiempo: “Ajustar precios”
   → Pastelería +7 % redondeado a $500 → vista previa → aplicar, y mostrar el historial.
4. **Mozo → cocina.** Tablet 1 en `/mozo`: Mesa 7 → Wrap Veggie (sin cebolla) + 2 limonadas → Enviar.
   Tablet 2 en `/cocina` (tocar “Empezar turno”): entra la comanda con sonido. Tocarla para pasarla a
   preparación y a lista. Filtro “barra”: solo las limonadas.
   En el celu del mozo, cuando cocina la marca “lista”, aparece el aviso (vibra en Android) y se marca “Entregada”.
   Para presentar desde una sola pantalla: `/demo`.
5. Cierre: `/admin/resumen` muestra lo vendido en la demo. Al terminar: admin → **Resetear demo**.
