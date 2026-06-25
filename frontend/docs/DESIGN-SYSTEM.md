# Sistema de diseño — Frontend Klikea

> Referencia visual para futuras modificaciones. Complementa a [README.md](./README.md).
> Cubre: los temas, tokens de Tailwind, utilidades de `index.css`, los componentes de
> presentación (`marketplace/` y `landing/`) y el deck Tinder (`SwipeDeck`).

---

## 1. Los tres "looks" del proyecto

| Área | Rutas | Tema | Dónde se define |
|---|---|---|---|
| **Panel admin** | `/admin/*` | **Claro** (slate sobre blanco) | componentes `components/ui/*` |
| **Storefront marketplace** | `/tienda/*` | **Oscuro elGenioX** (canvas negro + glass) | `MarketplaceLayout` (`.tienda-bg`) + kit `.mk-*` |
| **Catálogo público "Jack"** | `/catalogo/:slug` | **Oscuro cinematográfico** (Kanit gigante, luz cálida) | `PublicCatalogPage` + componentes `landing/*` |

El storefront y el catálogo **comparten el canvas oscuro** `.tienda-bg` (negro `#0C0C0C` con luz cálida animada) y la tipografía Kanit; difieren en el tratamiento (el marketplace es más "tienda/bento", el catálogo es más "landing de portfolio").

---

## 2. Tokens de Tailwind (`tailwind.config.js`)

### Colores
```js
brand // cyan (interacción, links, foco): 50..900  → 500 = #06B6D4
cta   // verde (CTAs, "Agregar/Comprar/Pagar"): 50..900 → 500 = #22C55E
```
> La paleta `cta` se completó (200,300,400,800,900) para soportar `text-cta-300`, `hover:from-cta-400`, `shadow-cta-900`, etc. **Si agregás clases con un tono nuevo, primero definilo acá** (en CSS rompe el build; en TSX se ignora silenciosamente).

Colores fijos del look "Jack" usados como literales (no tokens):
- Fondo: `#0C0C0C` · Texto claro: `#D7E2EA` · Acento magenta (categoría): `#B600A8` · Ámbar (pills): gradiente `#7a3310→#e7a149`.

### Tipografía
```js
sans / display → Kanit       // títulos y cuerpo
mono           → Fira Code    // precios, códigos, números
```

### Animaciones / sombras
`boxShadow`: `card`, `soft`. `keyframes/animation`: `fade-in`, `slide-in`, `toast-in`, `float(-slow)`, `slide-up`, `glow-pulse`, `carousel-in/out`. (El drawer del carrito usa `animate-fade-in` + `animate-slide-in`.)

---

## 3. Utilidades de `index.css`

### 3.a Base
- `body`: `bg-slate-50 text-slate-900` (claro por defecto → admin/login). El storefront lo cubre con `.tienda-bg`.
- Anillo de foco global: `*:focus-visible` con `ring-2 ring-brand-500`.
- Scrollbars finos; `@media (prefers-reduced-motion)` desactiva animaciones.

### 3.b Componentes admin (claros)
`.input-base` · `.label-base` · `.card-base` — inputs/cards del panel admin.

### 3.c Canvas oscuro "Jack" (reutilizable)
- **`.tienda-bg`** — canvas `#0C0C0C` con **dos capas de luz cálida animadas** (`::before`/`::after`, drift independiente). Es el fondo de `MarketplaceLayout` y `PublicCatalogPage`.
- **`.hero-heading`** — texto en degradado (`#646973→#BBCCD7`) con `-webkit-background-clip:text` + glow pulsante. Para títulos grandes (marca, secciones del catálogo).
- `.hero-aurora` — aurora cónica giratoria (acento del hero). `.orb` — orbe decorativo difuminado.
- Glass del catálogo viejo: `.lg-card`, `.lg-panel`, `.lg-shimmer`, `.section-revealed *` — ⚠️ `.lg-card` arranca `opacity:0` y **solo** se revela bajo un ancestro con `.section-revealed`; no usar sin esa mecánica.

### 3.d ⭐ Kit del marketplace oscuro (`.mk-*`)
Clases self-contained creadas para el storefront (`@layer components`). **Estas son las que se usan al restilizar `/tienda`:**

| Clase | Para qué |
|---|---|
| `.mk-surface` | superficie glass (panel/card estática): `rounded-2xl border-white/10 bg-white/[0.045] backdrop-blur` |
| `.mk-card` | tarjeta interactiva con hover-lift (productos, tiendas) |
| `.mk-input` | input redondeado oscuro (buscador) con foco cyan |
| `.mk-select` | `<select>` oscuro (incluye estilo de `option`) |
| `.mk-chip` / `.mk-chip-active` | chips de categoría/filtro (estado activo cyan) |
| `.mk-btn-cta` | botón verde en gradiente (CTA principal) |
| `.mk-btn-ghost` | botón outline sobre oscuro (secundario) |
| `.mk-badge-disc` | badge de descuento (gradiente rosa/rojo) |
| `.mk-section-title` | título de sección (blanco, bold) |

**Patrón de color:** **cyan** (`brand`) = interacción/links/foco · **verde** (`cta`) = CTAs · **rosa/rojo** = descuentos/eliminar · texto: `text-white` (títulos), `text-slate-300` (cuerpo), `text-slate-400/500` (apagado).

---

## 4. Componentes de presentación

### 4.a `components/marketplace/` (tema oscuro `.mk-*`)
- **`ProductoCard`** — `props: { producto: Producto; onAdd: (p) => void }`. Imagen con zoom en hover, `mk-badge-disc` (`-X%`), badge "Agotado", precio efectivo + tachado, nombre de tienda (cyan), botón "Agregar". Se reutiliza en Home, Search, Store y Detalle.
- **`CartDrawer`** — drawer lateral; lee del `CartContext` (`carritos`, `drawerOpen`, `itemCount`). Agrupa por tienda, total, "Ir a pagar" (`mk-btn-cta`) / "Ver mi carrito".
- **`Footer`** — marca + redes + 2 columnas (`FOOTER_CLIENTES` / `FOOTER_VENDEDORES` de `lib/footerContent.ts`). Enlaces a `/tienda/info/:slug`.

### 4.b `components/landing/` (estilo "Jack")
Reutilizables del catálogo público y ahora también del home. **Props clave:**

| Componente | Props / uso |
|---|---|
| `FadeIn` | `{ delay?, duration?=0.7, x?=0, y?=30, className }` — wrapper `whileInView` (revela una vez). |
| `Magnet` | efecto magnético al mouse: `{ padding, strength, activeTransition, inactiveTransition }`. |
| `AnimatedText` | `{ text, className }` — revela el texto caracter por caracter según scroll. |
| `GradientPill` / `GhostPill` | pills cálidas (ripple + sheen) / outline. (`PillButton.tsx`, exporta `WARM_GRADIENT`.) |
| `HeroProductField` | `{ products }` — campo flotante de productos del hero. |
| `ProductMarquee` | `{ products }` — dos filas que se desplazan con el scroll. |
| `ProductCard` | grid card con capa de acción en hover (`{ product, index, addingId, onAddToCart, onNavigate }`). |
| `StackingProducts` | showcase sticky-stacking por scroll (`{ products, addingId?, onAddToCart?, onNavigate?, renderAction? }`). |
| **`SwipeDeck`** | ⭐ deck tipo Tinder — ver §5. |

---

## 5. ⭐ `SwipeDeck` — deck de productos tipo Tinder

`components/landing/SwipeDeck.tsx`. Cartas apiladas una sobre otra; la de arriba se arrastra: **derecha = me interesa**, **izquierda = descartar**. Botones ✕/♥ replican el gesto. 100% fluido con **framer-motion**.

### Props
```ts
interface SwipeDeckProps {
  products: Producto[];
  onLike?: (product: Producto) => void;     // swipe derecha
  onDismiss?: (product: Producto) => void;   // swipe izquierda
  renderEmpty?: (reset: () => void) => ReactNode; // override del estado vacío
}
```

### Comportamiento
- Renderiza hasta **3 cartas** visibles; las de atrás asoman escaladas/desplazadas y se promueven con resorte.
- **Decisión por gesto**: `offset.x > 110` o `velocity.x > 700` → like; valores negativos análogos → nope; si no, vuelve al centro (spring).
- Sellos **"Me interesa"** (verde, izq.) / **"No"** (rojo, der.) que aparecen con la opacidad ligada al arrastre (`useTransform`).
- Rotación ligada a `x` (`[-220,220] → [-14°,14°]`).
- Estado vacío: "Viste todos los destacados" + **"Volver a empezar"** (`reset()`), o `renderEmpty`.
- Visual: carta `#0C0C0C` con borde `#D7E2EA/50`, imagen a sangre + degradado inferior, nombre (`hero`-like) y precio en `font-mono`.

### Dónde se usa
1. **`/tienda` (HomePage)** — sección **"Productos destacados"**. Fuente: `data.destacados` (fallback `ofertas` → `masBuscados`). `onLike` llena la bandeja **"Tus intereses"**, desde donde se puede **agregar al carrito** (`useAddToCart`).
2. **`/catalogo/:slug` (PublicCatalogPage)** — sección **"Destacados"**. `onLike` llena la bandeja de intereses con enlace a **WhatsApp** para pedir.

### Cómo reutilizarlo en otra vista
```tsx
import { SwipeDeck } from '@/components/landing/SwipeDeck';

const [intereses, setIntereses] = useState<Producto[]>([]);

<SwipeDeck
  products={misProductos}
  onLike={(p) => setIntereses((prev) => prev.some((x) => x.id === p.id) ? prev : [...prev, p])}
  onDismiss={(p) => {/* opcional */}}
/>
```
Notas: la carta usa `p.imagenUrl`, `p.nombre`, `p.precio`, `p.categoriaNombre`, `p.stock`. No modifica datos ni hace llamadas; es 100% presentacional. La altura es `h-[440px] sm:h-[520px]`; ajustá ahí si querés cartas más grandes.

---

## 6. Mapa de "dónde tocar" para cambios comunes

| Quiero cambiar… | Archivo(s) |
|---|---|
| Color de marca / CTA / agregar un tono | `tailwind.config.js` (paletas `brand`/`cta`) |
| Estilo de tarjeta de producto | `components/marketplace/ProductoCard.tsx` |
| Botones/inputs/chips del storefront | utilidades `.mk-*` en `src/index.css` |
| Navbar / buscador / menú categorías | `pages/marketplace/MarketplaceLayout.tsx` |
| Hero, banners bento, secciones del home | `pages/marketplace/HomePage.tsx` |
| Deck Tinder (tamaño, sellos, umbrales) | `components/landing/SwipeDeck.tsx` |
| Bandeja "Tus intereses" del home | `pages/marketplace/HomePage.tsx` |
| Filtro por comercio / orden de resultados | `pages/marketplace/SearchResultsPage.tsx` |
| Cabecera de tienda / tiles de categoría | `pages/marketplace/StorePage.tsx` |
| Detalle de producto (CTAs, features) | `pages/tienda/ProductoDetallePage.tsx` |
| Checkout / pasos / QR | `pages/tienda/CheckoutPage.tsx` |
| Drawer del carrito | `components/marketplace/CartDrawer.tsx` |
| Footer / textos de soporte | `components/marketplace/Footer.tsx` + `lib/footerContent.ts` |
| Bento de categorías (qué grupos/categorías) | `lib/categoriaGrupos.ts` |
| Canvas oscuro / luz cálida / títulos degradado | `src/index.css` (`.tienda-bg`, `.hero-heading`) |
| Form de "Mi tienda" + preview de cabecera | `pages/admin/MiTiendaPage.tsx` |
| Catálogo público "Jack" (hero/marquee/deck) | `pages/PublicCatalogPage.tsx` + `components/landing/*` |

---

## 7. Checklist antes de terminar un cambio visual
- [ ] `npm run typecheck` y `npm run build` en verde (sin imports sin usar).
- [ ] Tono nuevo de color → definido en `tailwind.config.js`.
- [ ] Responsive ok (móvil 375px, tablet 768px, desktop 1024px+).
- [ ] `aria-label` en botones de ícono; `alt` en imágenes.
- [ ] No se rompió la lógica (API/hooks/props/rutas intactos).
- [ ] Hard-refresh (`Ctrl+Shift+R`) al verificar en el navegador (HMR en `G:` puede colgarse).
