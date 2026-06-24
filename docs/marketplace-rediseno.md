# Reestructuración a Marketplace — Notas de requerimientos

> Documento vivo. Se actualiza vista por vista a partir de las capturas de referencia
> (sitio modelo: **elGenioX**). Al final, el plan de implementación se arma a partir de
> este archivo (no de la memoria de la conversación), para no perder ningún detalle.
>
> **Alcance acordado:** la web pasa a ser un marketplace donde el comprador ve productos
> de TODAS las tiendas. Se mantiene intacto el panel **admin** por tienda y sus
> funcionalidades. **No** se invierte esfuerzo en estética (un colaborador la pulirá);
> el foco es **estructura + funcionalidad**.

---

## Objetivo general

- Buscador que encuentre **por nombre de producto** y muestre ofertas de todas las tiendas.
- Buscar por **categoría** (cross-store).
- Buscar/ver una **tienda específica** y todos sus productos.
- Mantener vistas y funcionalidades del **admin de tienda**.

---

## VISTA 1 — Home / Pantalla principal

**Estado: capturada y revisada.**

Zonas identificadas (arriba → abajo):

1. **Navbar:** logo, menú "Categorías" (desplegable), **buscador global** con placeholder
   "¿Qué estás buscando?" / "Productos - Marcas - Comida", Cuenta / Iniciar sesión, carrito.
2. **Chips de acceso rápido:** Flash Sale, Descuentos, marcas/tiendas (Sony, Stanley,
   Victorinox…) y campañas ("Regalos hasta 100bs", "Sede de la pasión").
3. **Hero / banners bento:** carrusel + banners promocionales (campañas, "Hasta 41%", etc.).
4. **"Los más buscados":** fila de tarjetas de producto. Cada tarjeta muestra:
   **nombre de la tienda** (ej. SHOPTIC, elgeniox Store), nombre del producto, precio
   (Bs.), botón agregar al carrito, y **badge de descuento + precio tachado** si aplica.
5. **"Flash sales":** misma tarjeta, con badges de descuento (-8%, -13%, -27%, -19%).
6. **Categorías (bento):** grupos (Hogar y Decoración, Tecnología, Electrohogar, Deporte y
   recreación) → cada uno con **subcategorías** (icono + nombre) y enlace "Ver más".
7. **Strip de logos:** logos de marcas/tiendas. → En este proyecto = **las tiendas que usan
   la web** (ej. tercertiempo y otras a agregar después).
8. **Ofertas exclusivas / Combos:** tarjetas con descuentos grandes (-69%, -13%, -12%) y
   banners promocionales ("Equipa tu hogar", "Herramientas", "Disfruta del mejor sonido").

### Indicaciones explícitas del usuario para esta vista
- Quiere **TODO** lo que se ve: estructura + funcionalidades.
- **Showcase de tiendas:** mostrar el **logo de las tiendas** que usan la web.
- **Descuentos:** los admin/vendedores pueden **poner y sacar descuentos cuando quieran**.

### Mapeo al código actual / cambios necesarios
- Hoy `/tienda` ([frontend/src/pages/tienda/CatalogoPage.tsx]) es **mono-tienda** (usa
  `tiendas[0]`). Se reconvierte en **home marketplace cross-store**. Admin intacto.
- **Descuentos (NUEVO):** agregar a `Producto` `precioOferta` (nullable) y opcional
  `ofertaInicio`/`ofertaFin`. Poner descuento = setear; sacar = null. Flash sale =
  descuento con fecha de fin. Badge `-X%` calculado, precio tachado + precio nuevo.
- **Búsqueda global (NUEVO):** endpoint cross-store por nombre (hoy todo es `findByTiendaId`).
- **Secciones del home (NUEVO):** "más buscados/vendidos", "flash sales/ofertas",
  destacados — todos cross-store.
- **Showcase de tiendas:** `Tienda` ya tiene `logoUrl` ✅; falta endpoint público + sección.
- **Categorías:** hoy son **por-tienda y planas**; el home las muestra **globales y
  jerárquicas** (grupo → subcategoría).

### 8.b Footer de soporte (final del home) — AGREGADO por el usuario
Al final del home va un footer estilo elGenioX con tres bloques:

- **Bloque marca:** logo de la plataforma + "Redes Sociales" (Facebook, Instagram, TikTok, LinkedIn).
- **Columna "SOPORTE PARA CLIENTES":** Términos y condiciones · Envíos · Puntos de recojo ·
  Cambios y devoluciones · Garantías · Reclamos · Métodos de pago · Contáctanos.
- **Columna "SOPORTE PARA VENDEDORES":** Vende en [plataforma] · Términos y Condiciones (comercio) ·
  Comisiones y Facturación · Inhabilitación o Suspensión de cuenta · Marketing y Publicidad.

Cada enlace lleva a una **página/sección informativa** con texto **adaptado y simplificado**
(no copiado tal cual) desde `docs/footer-soporte-contenido-fuente.md`. Hay que genericizar:
quitar lo específico de elGenioX (EGX, direcciones, CAINCO, teléfonos/correos reales, marcas
de tarjetas, puntos Pick Up). Algunos enlaces no tienen texto fuente (Garantías, Reclamos,
Comisiones y Facturación, Marketing y Publicidad) → redactar versión breve derivada de los T&C.

**"Vende en [plataforma]"** NO es texto legal: es un **CTA que redirige a un contacto de
WhatsApp** para adquirir o alquilar la web y poder publicar productos.

Nota: el `TiendaLayout` actual ya tiene un footer simple (email + copyright) que se amplía/reemplaza.

### Decisiones pendientes (resolver en el plan final)
1. **Categorías globales vs por-tienda.** Para "buscar categoría" cross-store lo natural son
   categorías **globales** con grupo padre. Cambia cómo el vendedor categoriza hoy. ⬅ la más grande.
2. **Carrito multi-tienda.** Hoy el carrito es por (tienda, usuario). Si se agregan productos
   de varias tiendas, definir si se agrupa por vendedor o se unifica.
3. **Banners del hero.** ¿Estáticos (placeholder) o gestionables por el admin?
4. **Footer — implementación:** ¿una ruta/página por enlace (ej. `/ayuda/envios`,
   `/vendedores/comisiones`) o una sola página con secciones? (recomiendo rutas simples).
5. **Footer — contenido:** ¿estático (hardcodeado) o editable por admin? (recomiendo estático).
6. **Nombre de la plataforma/marca** a usar en los textos (hoy en el código aparece "EcommerceUPB").
7. **Datos de contacto reales** (WhatsApp + correo) para "Contáctanos" y "Vende en [plataforma]",
   o usar placeholders por ahora.

---

## NOTA TRANSVERSAL — Comercio (tienda) vs Marca
En elGenioX existen DOS conceptos: **Comercio** (la tienda/vendedor) y **Marca** (Sony, JBL…).
La página de resultados tiene filtro por COMERCIO y por MARCA por separado.
**Decisión del usuario:** solo quiere el **filtro por COMERCIO (tienda)**. → En este proyecto
NO se modela "Marca"; el texto gris bajo el nombre del producto en las tarjetas = **la tienda**.
(El dropdown de elGenioX muestra marcas tipo UGREEN/HAVIT; aquí será siempre la tienda.)

---

## VISTA 2 — Búsqueda (dropdown + página de resultados)
**Estado: capturada y revisada.**

### 2.A Dropdown de búsqueda (typeahead, al escribir en el buscador)
Overlay que aparece bajo el buscador mientras se escribe, con dos secciones:
- **"Sugerencias":** sugerencias de texto de la consulta (ej. portátil, laptop, para laptop).
- **"Productos":** resultados de productos en vivo (cross-store). Cada fila: thumbnail con
  badge de descuento (-11%) si aplica, nombre del producto, **tienda** debajo, y precio
  (tachado + precio con descuento si hay oferta; precio único si no).

### 2.B Página de resultados (ruta nueva, ej. `/buscar?q=...`)
- **Breadcrumb:** Inicio / Búsqueda: {término}.
- **Encabezado:** "Resultados para '{término}'  N productos".
- **Sidebar izquierdo de filtros — SOLO filtro por COMERCIO (tienda):** checkboxes con cada
  tienda + conteo de productos por tienda (ej. "elgeniox Store (82)"), con enlace "Reiniciar".
  (elGenioX también tiene MARCA y DISPONIBILIDAD → **se omiten** por pedido del usuario;
  confirmar si se quiere conservar "Disponibilidad / artículos disponibles".)
- **"Ordenar por":** dropdown (Más relevante / precio asc / precio desc…). Definir opciones.
- **Grid de tarjetas** (cross-store): imagen, badge de descuento, **tienda**, nombre, precio
  (tachado + oferta o único), botón agregar al carrito.

### Mapeo / cambios necesarios
- **Endpoint de búsqueda cross-store** por nombre, con: lista de productos + **facetas de
  conteo por tienda** (para los checkboxes), filtro opcional `tiendaId(s)`, orden y paginación.
- El dropdown puede reusar el mismo endpoint (limитado a pocos resultados) + sugerencias
  simples derivadas de nombres de producto (o versión mínima sin "Sugerencias" — definir).

---

## VISTA 3 — Categorías (menú + resultados por categoría)
**Estado: capturada y revisada.**

elGenioX usa un mega-menú de 2 niveles (grupo → subcategorías). **El usuario NO quiere ese
desglose/jerarquía.** En su lugar:

### 3.A Menú/zona "Categorías" (las 3 barras de arriba)
- Muestra las **categorías más populares** (lista plana, sin grupos ni subcategorías).
- Al pulsar una categoría → se muestran **todos los productos de TODAS las tiendas** de esa
  categoría (no abre submenú).

### 3.B Cómo se agregan las categorías (mecanismo definido por el usuario)
Como **cada tienda crea sus propias categorías** (modelo actual: `Categoria` por-tienda, plana),
la agregación cross-store se hace por **coincidencia del NOMBRE de la categoría**, con match
**parcial, insensible a mayúsculas/minúsculas y a tildes** (ej. "cocina" = "Cocina" = "COCINA"
= "cocína"). → Esto **RESUELVE** la decisión "categorías globales vs por-tienda": se quedan
**por-tienda, planas, y se agrupan por nombre normalizado**. NO se crea entidad de categoría global.

### 3.C Resultados por categoría (captura "cocina")
- Misma página/estructura que los **resultados de búsqueda** (VISTA 2): breadcrumb
  "Inicio / Búsqueda: cocina", "Resultados para 'cocina'  N productos", sidebar de filtro por
  **comercio**, "Ordenar por", y grid de tarjetas cross-store.
- De hecho **pulsar una categoría = ejecutar una búsqueda por ese término**: el breadcrumb dice
  "Búsqueda: cocina" y los resultados incluyen productos cuyo **nombre** contiene "cocina"
  (ej. "CUCHILLO DE COCINA"), no solo los de categoría "Cocina". → Búsqueda y categoría usan
  **el mismo buscador y la misma página de resultados**.

### 3.D Semántica del buscador (definida por el usuario)
El buscador hace **match por coincidencia (parcial, normalizado) sobre TRES campos**:
**nombre de producto · nombre de categoría · nombre de tienda**. Normalizado = minúsculas +
sin tildes + "contiene" (no exacto).

### Mapeo / implementación
- **Un solo endpoint de búsqueda** (reusado por: buscador, dropdown, click en categoría) que
  hace match normalizado sobre producto.nombre / categoria.nombre / tienda.nombre, con facetas
  de conteo por tienda, orden y paginación.
- **Normalización** (minúsculas + sin tildes, "contiene"): opciones → extensión Postgres
  `unaccent` + `lower()` con `ILIKE`, o columna normalizada, o normalizar en Java. DECISIÓN
  menor de implementación.
- **"Categorías más populares":** lista de nombres de categoría (normalizados, distintos)
  rankeados por popularidad. Métrica a definir (lo más simple: cantidad de productos activos
  por nombre de categoría; alternativa: por ventas). DECISIÓN menor.
- **Reconciliación con VISTA 1 (RESUELTO):** el home mantiene el **bento agrupado visual**
  con grupos FIJOS/decorativos (Hogar, Tecnología, Electrohogar, Deporte…). Los grupos NO son
  subcategorías reales: son solo agrupación visual hardcodeada de categorías por nombre. Hace
  falta un mapeo grupo → categorías. El menú "Categorías" del top sí es plano (populares).

---

## VISTA 4 — Página de una tienda
**Estado: capturada y revisada.** Se llega buscando/seleccionando una tienda (ej. "Sony" →
en este proyecto "Tercer Tiempo"). Equivale a una versión mejorada del catálogo público actual.

### 4.A Encabezado de la tienda
- Breadcrumb "Inicio".
- Banner con: **logo de la tienda** (círculo), **nombre** y **descripción/tagline**
  (ej. "Tienda de productos tecnológicos"), sobre una imagen de fondo.
  ⚠️ **NUEVO dato:** `Tienda` hoy tiene `logoUrl` ✅ pero NO tiene **descripción** ni
  **banner**. Hay que agregar al menos `descripcion`; el banner es opcional (placeholder).
  DECISIÓN.

### 4.B Tiles de categorías de la tienda
- Fila de tiles (con íconos) de las **categorías de esa tienda** (carrusel con flechas).
  Pulsar una = filtra los productos de la tienda por esa categoría.
- Mapea directo a lo existente: `Categoria` es por-tienda y ya hay
  `findByTiendaIdAndCategoriaIdAndEstadoTrue`. ✅ (El usuario pidió expresamente AGREGAR este
  filtro por categoría dentro de la tienda.)

### 4.C Grid + orden
- "Mostrando N productos" + grid de tarjetas de la tienda (con descuento, badge "Nuevo", etc.).
- **"Ordenar por"** (el usuario pidió agregarlo) con opciones EXACTAS de la captura:
  **Más reciente · Mayor precio · Menor precio · Mayor descuento**.
  - ⚠️ "Más reciente" y el badge **"Nuevo"** necesitan saber qué producto es reciente, pero
    `Producto` **no tiene fecha de creación**. Proxy simple: ordenar por `id` DESC (las IDENTITY
    crecen). Alternativa: agregar `fechaCreacion`. DECISIÓN menor.
  - "Mayor/Menor precio" usa el precio efectivo (oferta si existe). "Mayor descuento" usa el %
    de `precioOferta` (requiere descuentos, ya decididos).

### Mapeo / implementación
- Página de tienda = catálogo público actual (`/api/catalogo/{slug}` + `PublicCatalogPage`)
  mejorado con: descripción de tienda, tiles de categoría y orden.
- Como es una sola tienda (~decenas de productos), **filtrar/ordenar en el cliente es
  aceptable** (no hace falta endpoint nuevo si el catálogo ya trae todos los productos).
- Cómo se llega a la página: clic en el nombre de la tienda (en tarjetas/filtro) y/o buscar el
  nombre de la tienda. Definir si buscar el nombre exacto de una tienda abre su página o la
  página de resultados con filtro de comercio. DECISIÓN menor.

## VISTA 5 — Detalle de producto (+ recomendaciones)
**Estado: capturada y revisada.** (Reemplaza/restructura el `ProductoDetallePage` actual.)

- **Breadcrumb:** Inicio / Búsqueda: {término} / {nombre del producto}.
- **Galería de imágenes:** columna de miniaturas + imagen principal, con zoom y flechas.
  ⚠️ **NUEVO requisito de datos:** hoy `Producto` tiene **una sola** `imagenUrl`. Para la
  galería se necesitan **múltiples imágenes por producto** (campo/colección nueva). DECISIÓN.
- **Datos centrales:** nombre de la **tienda**, título, precio (con oferta si aplica), y una
  lista de "features" con íconos: Pago seguro · Aplica política de devolución · Artículo
  elegible para regalo · Recojo en tienda · Envío a domicilio. (Mayormente estáticos; "Recojo
  en tienda"/"Envío a domicilio" podrían ser flags por producto/tienda → DECISIÓN.)
- **"Detalles del producto":** descripción larga (ya existe `descripcionLarga`). También están
  los atributos (ya existe `AtributoProducto`).
- **CTAs:** "Agregar al carrito" (abre el drawer, ver VISTA 6) y **"Comprar ahora"** (flujo de
  compra directa → checkout). "Comprar ahora" es NUEVO.
- **"Medios de pago":** panel con íconos QR / VISA / Mastercard (estático; alinear el QR con
  la integración real Stereum).

### 5.b Recomendaciones — "La combinación perfecta"
Fila de productos recomendados bajo el detalle (misma tarjeta cross-store). + Tira de 4
"value props" con íconos (Entrega segura, Recogida en tienda, Garantía de precios, Lo último
en tecnología) — estático.
- **NUEVO endpoint** de recomendados (simple: misma categoría y/o misma tienda, excluyendo el
  producto actual). Definir criterio.

---

## VISTA 6 — Carrito (drawer al "Agregar al carrito")
**Estado: capturada y revisada.**

Al pulsar "Agregar al carrito" se abre un **drawer lateral** (slide-over) en vez de navegar:
- Título "Mi Carrito (N artículos)" + cerrar.
- Por ítem: thumbnail, nombre, precio, **stepper de cantidad** (borrar/–, cantidad, +),
  enlace "Eliminar".
- **Subtotal (N artículos)** + botón **"Comprar ahora"** + enlace **"Ver mi carrito"**.

### Mapeo / cambios necesarios
- Hoy "agregar" navega/usa `carritoApi.agregarItem({tiendaId, usuarioId, productoId, cantidad})`
  y el carrito es por (tienda, usuario). El drawer es UX nueva.
- ⬅ **Reaparece la decisión de carrito multi-tienda:** si el comprador agrega productos de
  varias tiendas, el drawer y el checkout deben manejar varias tiendas (agrupar por vendedor)
  o el modelo de carrito debe cambiar. Pendiente de decidir.

---

## DECISIONES CONFIRMADAS por el usuario
1. **Imágenes de producto:** se mantiene **UNA sola imagen** (`imagenUrl` actual). NO se hace
   galería ni múltiples imágenes. La VISTA 5 muestra una imagen principal sin miniatura múltiple.
2. **Filtro de búsqueda:** SOLO por **comercio (tienda)**. Sin "Marca". (Pendiente menor:
   confirmar si se conserva "Disponibilidad" — por defecto NO se incluye.)
3. **Carrito multi-tienda: SÍ.** El comprador puede agregar productos de varias tiendas al
   mismo carrito. (Implica resolver el reparto de pago — ver abajo.)
4. **Categorías: por-tienda, agregadas por nombre normalizado, SIN subcategorías reales.**
   Sin entidad de categoría global.
   - **Menú "Categorías" (top):** muestra las categorías **más populares** (plano); pulsar
     una = búsqueda por ese nombre.
   - **Bloque de categorías del HOME:** **bento AGRUPADO visual** (decisión del usuario), con
     **grupos FIJOS/decorativos en el código** (ej. "Hogar y Decoración", "Tecnología",
     "Electrohogar", "Deporte y recreación"…) y dentro categorías reales. Requiere un **mapeo
     hardcodeado grupo → categorías** (por nombre normalizado). NO hay subcategorías reales:
     al pulsar una categoría salen los productos de esa categoría de todas las tiendas.
   - Pendiente: definir el mapeo grupo → qué nombres de categoría caen en cada grupo
     (lo armo en el plan; puede que te pida la lista de grupos/categorías que quieras).
5. **Buscador = match parcial normalizado** (minúsculas + sin tildes, "contiene") sobre
   **nombre de producto + nombre de categoría + nombre de tienda**. Un solo endpoint/resultados
   reutilizado por buscador, dropdown y click en categoría.

### Solución propuesta para el pago multi-tienda (decisión 3)
Problema: la pasarela (Stereum) deposita a **una sola cuenta**, pero el dinero debería llegar a
cada tienda. Enfoque recomendado (modelo "marketplace como intermediario", coincide con los
T&C que el usuario pasó para el footer):

- **Al hacer checkout, el carrito multi-tienda se DIVIDE en un `Pedido` por tienda.** El modelo
  ya soporta esto: `Pedido` es por (tienda, usuario). Un carrito con 3 tiendas → 3 pedidos.
- **El cobro va a la cuenta única de la plataforma** (setup actual de Stereum). Se guarda el
  desglose: cuánto corresponde a cada tienda.
- **La plataforma liquida (paga) a cada tienda después**, descontando una **comisión** (esto
  habilita/da sentido a la sección "Comisiones y Facturación" del footer). Conciliación manual.
- Alternativa "más correcta" (futuro): que **cada tienda tenga su propia cuenta/credenciales
  Stereum** y se genere **un QR por pedido/tienda** → el dinero va directo a cada vendedor.
  Requiere que cada tienda configure su cuenta de pasarela.

**Por ahora (lo pedido):** carrito multi-tienda + checkout que divide en pedidos por tienda +
cobro a la cuenta de la plataforma. El reparto real a las tiendas queda como conciliación
posterior (manual / fuera del alcance inmediato). A confirmar en el plan.

6. **Opciones de "Ordenar por"** (de Vista 4, confirmadas por el usuario): **Más reciente ·
   Mayor precio · Menor precio · Mayor descuento**. En la página de resultados/búsqueda se suma
   "Más relevante". "Más reciente" = por `id` DESC (proxy, sin fecha de creación).
7. **Datos de contacto** (para footer "Contáctanos" y "Vende en…"): **WhatsApp 75359849**,
   **correo miguel762005@gmail.com**.
8. **Descripción de tienda:** la **carga el admin** → agregar campo `descripcion` a `Tienda` +
   campo en el formulario/edición de tienda del admin. Banner opcional/placeholder.
9. **Nombre de marca: "Klikea"** (reemplaza "EcommerceUPB" en el storefront).
10. **Mapeo grupo→categorías del home** (confirmado, grupos fijos/decorativos):
    - **Tecnología:** Computación · Celulares · Periféricos · Monitores · Impresoras
    - **Audio y Gaming:** Audio · Parlantes · Audífonos · Consolas · Videojuegos
    - **Electrohogar:** Climatización · Refrigeración · Lavadoras · Electrodomésticos
    - **Hogar y Decoración:** Cocina · Muebles · Decoración · Iluminación · Termos y Vasos
    - **Deporte y Recreación:** Gimnasio · Camping · Ropa Deportiva · Pádel · Bicicletas
    - **Belleza y Cuidado Personal:** Maquillaje · Cuidado de Piel · Perfumería · Peluquería
    - **Vestimenta y Accesorios:** Ropa · Calzado · Mochilas y Accesorios · Relojes
    - **Alimentos y Bebidas:** Abarrotes · Bebidas · Snacks · Despensa
    - **Juguetes:** Juguetes · Juegos de Mesa · Didácticos · Aire Libre
    (Las categorías se muestran y al pulsarlas buscan por nombre normalizado; ajustar a las
    categorías reales que usen las tiendas.)

## ESTADO: las 6 vistas están capturadas ✅ (home+footer, búsqueda, categorías, detalle,
## carrito, página de tienda). Listo para armar el PLAN.

## Decisiones aún pendientes (se resuelven / se asumen por defecto en el plan)
- (Vista 1) Banners hero estáticos vs editables. → default: **estáticos**.
- (Vista 1) Footer: rutas por enlace vs sección única (→ default: **rutas simples**); contenido
  estático (→ default: **estático**); **nombre de marca** (INPUT del usuario); **datos de
  contacto** WhatsApp/correo (INPUT del usuario, o placeholder).
- (Vista 2) ¿"Sugerencias" en el dropdown o solo "Productos"? → default: **solo Productos**
  (más simple). ¿Conservar filtro "Disponibilidad"? → default: **no**.
- (Vista 3) Métrica de "categorías más populares" → default: **cantidad de productos activos**.
  Normalización → default: **Postgres `unaccent` + lower + ILIKE**. **Mapeo grupo→categorías
  del home** (INPUT del usuario: qué grupos y qué categorías).
- (Vista 4) **Descripción de tienda** (agregar campo `descripcion`; banner opcional/placeholder).
  "Más reciente"/"Nuevo" por `id` DESC vs agregar `fechaCreacion`. Cómo se llega a la página de
  tienda (clic en nombre vs búsqueda exacta).
- (Vista 5) Flags "Recojo en tienda"/"Envío a domicilio" → default: **estáticos**. Criterio de
  recomendados → default: **misma categoría (normalizada), excluyendo el actual**. "Comprar
  ahora" → checkout directo del ítem.
- (Transversal) Descuentos: agregar `precioOferta` (+ opcional `ofertaInicio/Fin`) a `Producto`,
  y CRUD en el admin para poner/quitar. Carrito multi-tienda → checkout divide en pedidos por
  tienda, cobro a cuenta única + conciliación posterior.
