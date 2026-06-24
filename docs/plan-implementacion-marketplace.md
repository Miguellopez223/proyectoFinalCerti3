# Plan de implementación — Reestructuración a Marketplace "Klikea"

> Plan basado en `docs/marketplace-rediseno.md` (requerimientos vista por vista) y
> `docs/footer-soporte-contenido-fuente.md` (contenido del footer a adaptar).
> Foco: **estructura + funcionalidad** (la estética la pulirá un colaborador).
> **El panel admin por tienda se mantiene intacto.**

## Principios y decisiones base
- Marca: **Klikea**. Contacto: WhatsApp **75359849** (wa.me/59175359849), correo **miguel762005@gmail.com**.
- Marketplace = el comprador ve productos de **todas las tiendas**.
- Categorías **por-tienda, planas** (sin entidad global, sin subcategorías). Agregación por
  **nombre normalizado** (minúsculas + sin tildes + "contiene").
- Buscador = match normalizado sobre **producto.nombre + categoria.nombre + tienda.nombre**.
- Una sola imagen por producto. Solo filtro por **comercio (tienda)**.
- **Descuentos** editables por el admin. **Carrito multi-tienda**; checkout divide en un pedido
  por tienda; cobro a cuenta única + conciliación posterior (comisión).

---

## FASE 0 — Marca y preparación  ✅ HECHA
- Renombrar "EcommerceUPB" → **"Klikea"** en el storefront (no en el admin si no aplica):
  `TiendaLayout`, `CatalogoPage` (const BRAND), títulos, footer.
- Config: `app.tienda-nombre` y textos relacionados en `application.properties`.

## FASE 1 — Modelo de datos + DTOs + Admin (descuentos y descripción)  ✅ HECHA
> Implementado: `Producto.precioOferta/ofertaInicio/ofertaFin`; `Tienda.descripcion/bannerUrl`;
> DTOs (Producto: +tiendaNombre +oferta +derivados enOferta/precioEfectivo/descuentoPorcentaje;
> Tienda: +descripcion/bannerUrl); servicios actualizados; admin: campos de oferta en
> `ProductoFormModal` + nueva página **`MiTiendaPage`** (`/admin/mi-tienda`). Backend compila,
> frontend typecheck ok.
**Backend (domain):**
- `Producto`: agregar `precioOferta` (BigDecimal, nullable), `ofertaInicio`/`ofertaFin`
  (LocalDateTime, nullable, para flash sales). Todos nullable → `ddl-auto=update` los crea solo.
- `Tienda`: agregar `descripcion` (String/TEXT, nullable) y `bannerUrl` (TEXT, nullable, opcional).

**DTOs (core):**
- `ProductoResponse`: agregar `tiendaNombre` (las tarjetas muestran la tienda), `precioOferta`,
  y derivados: `precioEfectivo`, `descuentoPorcentaje`, `enOferta` (bool).
- `ProductoRequest`: agregar `precioOferta`, `ofertaInicio`, `ofertaFin`.
- `TiendaResponse`/`TiendaRequest`: agregar `descripcion`, `bannerUrl`.

**Servicios:**
- `ProductoService.crear/actualizar`: persistir oferta. Mantener evicción de caché `catalogo`.
- `TiendaService.crear/actualizar`: persistir descripción/banner.

**Admin (frontend), sin romper lo existente:**
- `ProductoFormModal`: campos de **precio de oferta** (+ fechas opcionales). Poner descuento =
  setear `precioOferta`; quitar = vaciar.
- Form de tienda del admin: campo **descripción** (y banner opcional).
- Tipos TS (`types/index.ts`) y `api/productos.ts`, `api/tiendas.ts` actualizados.

## FASE 2 — Backend: endpoints de marketplace  ✅ HECHA
> Implementado: función SQL `kilikea_norm()` (normaliza sin tildes/mayúsculas, vía `translate()`,
> sin extensión) creada al arranque por `MarketplaceDbInitializer` (+ respaldo `script/marketplace.sql`).
> `ProductoRepository`: `buscarCoincidencias`, `categoriasPopulares`, `findOfertasVigentes`,
> `findRecientes`, `findDestacados`, `recomendadosPorCategoria`. `TiendaRepository.findByEstadoTrue`.
> DTOs: `BusquedaResponse`, `FacetaTienda`, `CategoriaPopularResponse`, `HomeResponse`.
> `MarketplaceService` (búsqueda+facetas+orden+paginación en memoria, sugerencias, populares,
> home, recomendados). `MarketplaceController` (`/api/marketplace/buscar|sugerencias|
> categorias-populares|home|recomendados/{id}`), todo público en `SecurityConfig`. Backend compila.
**Búsqueda normalizada (cross-store):**
- Habilitar extensión Postgres: `CREATE EXTENSION IF NOT EXISTS unaccent;`
  (script `script/marketplace.sql` + runner de arranque best-effort; fallback: normalizar en Java).
- `ProductoRepository`: queries nativas con `unaccent(lower(x)) LIKE unaccent(lower(:q))` sobre
  producto.nombre / categoria.nombre / tienda.nombre. Con filtro opcional por tiendaId(s),
  orden y paginación. Más query de **facetas**: conteo de productos por tienda para el término.
- Orden soportado: **Más relevante · Más reciente (id DESC) · Mayor precio · Menor precio ·
  Mayor descuento**.

**Nuevo `MarketplaceController` (público, `/api/marketplace/**`):**
- `GET /buscar?q=&tiendaId=&orden=&page=&size=` → `{ productos: Page<ProductoResponse>, facetasTiendas: [{tiendaId,nombre,count}], total }`.
- `GET /sugerencias?q=` → productos top-N (typeahead). (Por defecto solo "Productos", sin "Sugerencias" de texto.)
- `GET /categorias-populares?limit=` → nombres de categoría (normalizados, distintos) por cantidad de productos.
- `GET /home` → secciones: `masBuscados` (proxy: más vendidos o por id), `ofertas`/`flashSales`
  (con `precioOferta` vigente), `destacados`, `tiendas` (logos: tiendas activas con logoUrl).
- `GET /recomendados/{productoId}` → misma categoría (normalizada), excluyendo el actual.
- `GET /tienda/{slug}` → datos de la tienda (incl. descripción) + sus categorías + productos
  (o reusar `/api/catalogo/{slug}` enriquecido).
- **SecurityConfig:** `GET /api/marketplace/**` → permitAll.

## FASE 3 — Frontend: layout marketplace + routing + carrito drawer  ✅ HECHA
> Implementado (estructura mínima, sin adornos):
> - Backend: `GET /api/carrito/usuario/{usuarioId}` (carritos activos del usuario, multi-tienda).
> - Frontend: `api/marketplace.ts`, `api/carrito.listarActivos`, tipos del marketplace.
> - `CartContext` multi-tienda (carritos[] + itemCount total + estado del drawer), compat con
>   `cart`/`setCart`/`refresh`. `useAddToCart` (usa la tienda del producto, abre el drawer).
> - `MarketplaceLayout` (navbar: logo Klikea, menú Categorías [populares], buscador global con
>   sugerencias, cuenta, carrito) + `CartDrawer` (agrupado por tienda) + footer mínimo.
> - Páginas: `HomePage` (secciones home + bento de categorías [grupos fijos `lib/categoriaGrupos`]
>   + tiendas), `SearchResultsPage` (filtro por comercio + orden + paginación). `ProductoCard` plano.
> - Ruteo: bajo `/tienda` (índice=Home, `/tienda/buscar`); admin intacto. Typecheck + compile OK.
>
> **Desviaciones de scope (a propósito, para no romper nada):**
> - El comprador sigue bajo `/tienda` (no `/`) para no romper logout/login/emails que apuntan ahí.
> - `StorePage` dedicada (`/tienda/comercio/:slug`) y la **restructura del detalle de producto**
>   (+ "Comprar ahora" + recomendados + endpoint público de producto) pasan a **FASE 4**. Por ahora:
>   click en tienda/categoría = búsqueda por su nombre; el detalle usa la página existente.
> - `TiendaLayout`/`CatalogoPage` viejos quedan como archivos huérfanos (sirven de referencia de
>   estilo para el colaborador); ya no se rutean.
> - El carrito guarda `precioUnitario = precio` (no la oferta); ajustar en FASE 5 (checkout/pricing).
**Routing (`App.tsx`) reestructurado (admin intacto):**
- `/` → **Home marketplace** (reemplaza el `CatalogoPage` mono-tienda actual).
- `/buscar?q=...` → resultados de búsqueda (también lo usa el click en categoría).
- `/producto/:productoId` → detalle.
- `/tienda/:slug` → página de una tienda.
- `/carrito`, `/checkout`, `/mis-pedidos` → protegidos (CLIENTE).
- `/ayuda/*` y `/vendedores/*` → páginas del footer (públicas).
- Se conservan `/login`, `/registro`, `/admin/**`. `/catalogo/:slug` redirige a `/tienda/:slug`.

**`MarketplaceLayout`** (extiende/reemplaza `TiendaLayout`):
- Navbar: logo Kilikea · menú **Categorías** (populares) · **buscador global** con **dropdown**
  typeahead · Cuenta/Iniciar sesión · **carrito con drawer**.
- Footer de soporte (Fase 6).

**Carrito multi-tienda:**
- Backend `CarritoController/Service`: endpoint para **listar carritos activos del usuario**
  (todas las tiendas). Verificar que `agregarItem` permita `tiendaId` ≠ tienda del usuario.
- `CartContext`: agrupa ítems por tienda; `CartDrawer` (slide-over) con stepper, subtotal,
  "Comprar ahora", "Ver mi carrito".
- Al agregar, usar `producto.tiendaId` (no el de la sesión).

## FASE 4 — Frontend: páginas  ✅ HECHA
> Implementado: endpoint público `GET /api/marketplace/producto/{id}` + `tiendaSlug` en
> `ProductoResponse`. `StorePage` (`/tienda/comercio/:slug`, reusa `/api/catalogo/{slug}`):
> cabecera (logo/nombre/descripción/banner) + tiles de categoría + orden (cliente). Reescrito
> `ProductoDetallePage`: imagen única, link a la tienda, precio con oferta, features estáticas,
> detalles + atributos (solo con sesión), "Agregar al carrito" (drawer) + "Comprar ahora"
> (→ checkout), medios de pago, "La combinación perfecta" (recomendados) y value props. Strip de
> tiendas del home enlaza a la StorePage. Typecheck + compile OK.
> Pendiente afinar en fases siguientes: el detalle no tiene galería (1 imagen, por decisión).
- **HomePage:** hero/banners (placeholders estáticos) · "Los más buscados" · "Flash sales /
  Ofertas" · **bento de categorías agrupado** (grupos fijos del mapeo) · **strip de logos de
  tiendas** · value props.
- **SearchResultsPage (`/buscar`):** breadcrumb · "Resultados para…" + conteo · sidebar **filtro
  por comercio** (con conteos) · "Ordenar por" · grid de tarjetas.
- **SearchDropdown:** resultados en vivo al escribir.
- **StorePage (`/tienda/:slug`):** banner (logo+nombre+descripción) · **tiles de categorías de
  la tienda** (filtro) · "Ordenar por" · grid. Filtrado/orden en cliente.
- **ProductDetailPage (restructura):** imagen única · nombre de tienda · features (estáticos) ·
  detalles + atributos · **Agregar al carrito** (drawer) + **Comprar ahora** · "Medios de pago"
  (QR Stereum/VISA/Mastercard, estático) · **"La combinación perfecta"** (recomendados) · value props.
- **ProductCard** unificado: imagen, badge `-X%`, badge "Nuevo" (id reciente), nombre, **tienda**,
  precio (tachado + oferta o único), botón agregar.

## FASE 5 — Checkout multi-tienda
- En checkout, **dividir el carrito en un `Pedido` por tienda** (el modelo ya es por-tienda).
- Cobro a la cuenta única (Stereum actual); guardar desglose por tienda; conciliación/comisión
  posterior (fuera del flujo automático, documentado).
- `CheckoutPage` adaptado para mostrar el resumen agrupado por tienda y generar los pedidos.

## FASE 6 — Footer + páginas de soporte + "Vende en Kilikea"
- `Footer` con 3 bloques (marca+redes, Soporte Clientes, Soporte Vendedores).
- Páginas con contenido **adaptado y simplificado** desde
  `docs/footer-soporte-contenido-fuente.md`, genericizado a **Klikea**, con los datos de
  contacto reales. Rutas simples por enlace.
- **"Vende en Klikea"** = CTA a WhatsApp (`https://wa.me/59175359849`) para adquirir/alquilar
  la web. "Métodos de pago" alineado a la integración real (QR Stereum).

## FASE 7 — Datos demo + verificación
- `DemoDataSeeder`: varias tiendas con logo/descripción, productos con categorías variadas y
  algunos con `precioOferta` (para ofertas/flash sales y el badge de descuento).
- Verificación: build backend (`mvnw -DskipTests`), `npm run build`, y prueba manual de los
  flujos (buscar, categoría, tienda, detalle, carrito multi-tienda, checkout, descuentos admin).

---

## Cambios que tocan datos / infra (resumen de riesgos)
1. Nuevas columnas (nullable, auto por `ddl-auto=update`): `productos.precio_oferta`,
   `oferta_inicio/fin`; `tiendas.descripcion`, `banner_url`.
2. Extensión Postgres **`unaccent`** (one-time). Fallback: normalización en Java.
3. **Reestructuración de rutas** del frontend (riesgo medio; el admin no se toca).
4. **Carrito/checkout multi-tienda** (lo más delicado): varios carritos activos por usuario y
   división en pedidos por tienda.

## Fuera de alcance (por ahora)
- Galería de múltiples imágenes por producto.
- Entidad "Marca" y categorías globales/jerárquicas reales.
- Split de pago automático por tienda en la pasarela (queda como conciliación manual).
- Banners del hero gestionables por admin (van estáticos).
