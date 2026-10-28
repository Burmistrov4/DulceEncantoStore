# 🍰 Dulce Encanto — Tienda online + embudo de ventas por WhatsApp

Aplicación web de alta conversión para un negocio de **postres artesanales en Valencia, Carabobo** (yogur griego, quesillo tradicional, torta de pan y combos), con checkout directo por **WhatsApp**, precios **bimonetarios (USD / Bs al BCV del día)** y panel administrativo privado.

## ⚡ Arranque rápido

```bash
npm install          # solo la primera vez
npm run dev          # tienda en http://localhost:3000
```

La base de datos libSQL (`db/dulces.db` local; Turso en producción) se crea y se siembra sola con 11 productos de ejemplo la primera vez que arranca. Las imágenes mock se generan con `npm run placeholders` (ya incluidas en `public/products/`).

## 🔑 Accesos y configuración inicial

| Qué | Dónde | Valor por defecto |
|-----|-------|-------------------|
| Panel admin | `/admin` | **Las credenciales se definen SOLO en `.env.local`** (`ADMIN_USER`, `ADMIN_PASSWORD`, `AUTH_SECRET`). El código no trae ninguna: sin variables configuradas, el login permanece cerrado |
| Número de WhatsApp | `/admin/ajustes` (o `.env.local`) | `584141234567` — **cámbialo por el real** |
| Tasa BCV | `/admin/ajustes` (botón automático o manual) | 43,80 de ejemplo |
| Zonas de delivery y tarifas | `/admin/ajustes` | Flor Amarillo, La Isabelica, El Viñedo, San José, Centro |

## 🧭 Mapa de la aplicación

- `/` — Landing rediseñada de alto impacto: barra de urgencia editable, hero cinematográfico, cinta marquee infinita, **carrusel "Disponible hoy"** con auto-avance y zoom, diferenciales, catálogo por pestañas, encargos para eventos, iluminación cálida que sigue al cursor y tilt 3D en las fotos, prueba social con **reseñas de clientes**, FAQ y checkout por WhatsApp.
- `/producto/[slug]` — Ficha de producto con zoom en foto, OG dinámico (al compartir el enlace se ve la foto y el precio) y pedido directo.
- `/bio` — Bio link ultrarrápido para la descripción de Instagram (cero JS).
- `/mis-pedidos` — El cliente rastrea sus pedidos por código (sin cuentas: guardados en su navegador).
- `/admin` — Dashboard con métricas, pedidos en curso e interruptor "Disponible hoy".
- `/admin/pedidos` — Pipeline de pedidos (nuevo → confirmado → preparando → entregado) con contacto directo por WhatsApp al cliente.
- `/admin/productos` — CRUD completo con subida de fotos (drag & drop → recorte → `.webp` 1200×900), variantes (200g/500g/1L), stock, orden e interruptor **⭐ Destacado** (aparece en el carrusel).
- `/admin/contenido` — **Editor visual de toda la landing**: textos de cada sección (urgencia, hero, marquee, pasos, carrusel, catálogo, testimonios, FAQ, CTA final, pie), listas editables, las **fotos del hero** con recorte automático, los **segundos de auto-avance del carrusel** (`0` = desactivado) y el acordeón **"✨ Efectos visuales"** (spotlight + tilt). Los cambios se reflejan al instante.
- `/admin/ajustes` — Tasa BCV (manual o automática desde ve.dolarapi.com/pydolarve.org), WhatsApp, Instagram, zonas de delivery.
- `/admin/metricas` — Visitas, carritos y clics a WhatsApp por día + ranking de productos más solicitados.
- `/admin/resenas` — Moderación de reseñas de clientes: aprueba (se publican al instante en la landing), rechaza (quedan ocultas) o elimina.

### ¿Cómo funciona el carrusel "Disponible hoy"?

1. El carrusel muestra hasta **12 productos**: primero los **⭐ Destacados** y luego completa con los disponibles del día (foto, nombre, precio $/Bs, botón "Agregar").
2. Con `showOnlyAvailable` (editable en `/admin/contenido`) decides si se incluyen agotados.
3. **Auto-avance configurable**: en `/admin/contenido` defines cada cuántos segundos avanza a la siguiente tarjeta (`autoAdvanceSeconds`; `0` = desactivado). Se pausa si la pestaña no está visible o el carrusel sale de pantalla.

### ⭐ Reseñas de clientes

1. El visitante toca **"⭐ Dejar mi reseña"** en la sección de testimonios de la landing y llena el formulario (estrellas, nombre, zona y texto, con honeypot anti-spam).
2. La reseña llega como **pendiente** a `/admin/resenas`, donde el dueño la **aprueba** (se publica al instante en la landing), la **rechaza** (queda oculta) o la **elimina**.
3. APIs: `POST /api/reviews` (público) y `GET/PATCH/DELETE /api/admin/reviews` (moderación).

## 🛠️ Scripts

```bash
npm run dev           # desarrollo
npm run build         # build de producción
npm run start         # servidor de producción (tras build)
npm run db:seed       # resetea la BD y re-siembra el catálogo mock
npm run placeholders  # regenera imágenes demo en public/products
npm run rate:update   # actualiza la tasa BCV (útil como tarea diaria)
npm run ig -- copy --producto "Quesillo 1kg" --precio "$9" --tipo urgencia
                      # genera copy para Instagram (ver docs/GUIA_INSTAGRAM.md)
node scripts/capture-mobile.mjs [url] [out.png]
                      # captura la vista móvil real (390px, emulación de dispositivo) vía CDP
node scripts/diagnose-overflow.mjs [url] [ancho]
                      # lista los elementos que sobresalen del viewport (QA responsivo)
node scripts/diagnose-carousel.mjs [url]
                      # prueba el auto-avance del carrusel (pasa de tarjeta en tarjeta)
```

## 🏗️ Arquitectura

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**
- **libSQL + Drizzle ORM** — local: `db/dulces.db` (cero configuración). Producción: base Turso remota con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. Las tablas se crean automáticamente al arrancar.
- **Imágenes locales** en `public/products` (mock) y `public/uploads` (fotos reales subidas desde el admin, comprimidas a `.webp` en el navegador).
- **SEO**: SSR/ISR (revalidación ≤15 s), Schema.org `Bakery` + `Product` con precio USD y VES, OpenGraph dinámico por producto, `sitemap.xml` y `robots.txt`.
- **Auth del admin**: cookie firmada con HMAC-SHA256, protegida por middleware edge (`/admin` y `/api/admin`).

### Estructura

```
app/            → rutas (landing, /bio, /producto/[slug], /admin, /api)
components/     → landing (embudo), store (carrito/WhatsApp), admin
db/             → esquema Drizzle, seed y datos mock
lib/            → capa de datos, formato bimonetario, WhatsApp, auth, tasa BCV
scripts/        → placeholders, actualización de tasa, automatización IG (Python)
docs/           → GUIA_INSTAGRAM.md (ManyChat, copys, calendario)
```

## 🚀 Despliegue

SQLite vive en disco: despliega en un servidor con almacenamiento persistente (VPS con `npm run build && npm run start` detrás de Nginx, Railway, Render…). **No uses Vercel/serverless** para producción (no persiste archivos y `@libsql/client (libSQL/Turso)` requiere Node). Si más adelante necesitas multi-instancia, migra a Supabase cambiando la capa `db/` (el esquema Drizzle es portable a Postgres).

Recuerda en producción:
1. `NEXT_PUBLIC_SITE_URL` con tu dominio real (OG, sitemap y JSON-LD lo usan).
2. Cambiar `ADMIN_PASSWORD` y `AUTH_SECRET` en `.env.local`.
3. Programar `npm run rate:update` diariamente (o hacerlo a mano en `/admin/ajustes`).

## ✅ Checklist para salir al aire

- [ ] Cambiar número de WhatsApp real en `/admin/ajustes`
- [ ] Subir fotos reales de cada producto en `/admin/productos`
- [ ] Ajustar precios, tamaños y stock
- [ ] Actualizar tasa BCV (botón automático)
- [ ] Cambiar credenciales del admin en `.env.local`
- [ ] Poner el link `/bio` en la bio de Instagram
- [ ] Configurar ManyChat con las plantillas de `docs/GUIA_INSTAGRAM.md`
