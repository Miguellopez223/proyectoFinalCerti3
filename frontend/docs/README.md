# Frontend Klikea — Documentación detallada

> Documentación de referencia del frontend para futuras modificaciones.
> Acompaña a `frontend/README.md` (guía rápida de arranque) y a `CLAUDE.md` (raíz).
>
> Archivos de esta carpeta:
> - **README.md** (este) — arquitectura, rutas, capa de datos, estado, convenciones.
> - **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** — temas visuales, tokens de Tailwind, utilidades de `index.css`, componentes `landing/` y el deck Tinder (`SwipeDeck`).

---

## 1. Stack y herramientas

| Pieza | Versión / detalle |
|---|---|
| Framework | **React 18** (`^18.3.1`) |
| Bundler / dev | **Vite 5** (`vite`, dev en `:5173`) |
| Lenguaje | **TypeScript** (`tsc --noEmit` para typecheck) |
| Estilos | **Tailwind CSS 3** + `index.css` con utilidades propias |
| Router | **react-router-dom** (v6, `<Routes>`/`<Route>`) |
| HTTP | **axios** (instancia única en `api/client.ts`) |
| Animación | **framer-motion** (`^12`) |
| Íconos | **lucide-react** + set propio en `components/icons.tsx` |
| Gráficos | **Recharts** (chunk `charts-*.js`, dashboards/reportes) |
| Fuente | **Kanit** (display/sans) + **Fira Code** (mono) |
| Subida de imágenes | **Cloudinary** (`lib/cloudinary.ts`) |

**Alias de imports:** `@/` → `src/` (configurado en `tsconfig` y `vite.config`). Usar siempre `@/...`, nunca rutas relativas largas.

### Comandos

```bash
cd frontend
npm install
npm run dev        # dev server http://localhost:5173
npm run build      # tsc --noEmit + vite build → dist/
npm run typecheck  # solo verificación de tipos
npm run preview    # sirve el build de producción (dist/)
```

> ⚠️ En Windows, si el proyecto está en una unidad distinta a `C:` (ej. `G:`), el file-watching de Vite puede "colgarse" y dejar de aplicar HMR. Si editás y no ves cambios: reiniciá `npm run dev` y hacé `Ctrl+Shift+R` en el navegador.

### Variables de entorno (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8081` | Base del backend Spring Boot |
| `VITE_GOOGLE_CLIENT_ID` | (vacío) | OAuth Client ID; debe coincidir con `google.oauth.client-id` del backend. Si está vacío, el login con Google se degrada con gracia |
| `VITE_CLOUDINARY_*` | — | Config de subida de imágenes (ver `lib/cloudinary.ts`) |

---

## 2. Estructura de carpetas (`src/`)

```
src/
├── main.tsx                 # Entry. Provider stack (ver §4)
├── App.tsx                  # Árbol de rutas (ver §3)
├── index.css                # Tailwind + utilidades propias (ver DESIGN-SYSTEM.md)
│
├── api/                     # Capa de servicios HTTP (1 archivo por dominio)
│   ├── client.ts            #   instancia axios + interceptores (auth + 401)
│   ├── auth.ts  marketplace.ts  catalogo.ts  productos.ts  pedidos.ts
│   ├── carrito.ts  direcciones.ts  pagos.ts  tiendas.ts  usuarios.ts
│   ├── categorias.ts  unidades.ts  atributos.ts  inventario.ts
│   ├── dashboard.ts  reportes.ts
│
├── context/                 # Estado global (React Context)
│   ├── AuthContext.tsx      #   sesión, login/logout, rol
│   ├── CartContext.tsx      #   carrito multi-tienda + drawer
│   └── ToastContext.tsx     #   notificaciones (toasts)
│
├── hooks/
│   ├── useAsync.ts          #   carga async con {data, loading, error, reload}
│   ├── useAddToCart.ts      #   agregar al carrito (valida sesión/rol CLIENTE)
│   ├── useDebounced.ts      #   debounce (buscador)
│   └── useScrollReveal.ts   #   revelado por scroll (IntersectionObserver)
│
├── lib/                     # Helpers transversales
│   ├── cn.ts                #   merge de clases (clsx/tailwind-merge)
│   ├── format.ts            #   formatCurrency, fechas, slug
│   ├── errors.ts            #   getErrorMessage / getFieldErrors (RFC 7807)
│   ├── jwt.ts               #   decode del JWT (lee userId del claim `jti`)
│   ├── cloudinary.ts        #   widget de subida de imágenes
│   ├── categoriaGrupos.ts   #   GRUPOS_CATEGORIAS (bento del home, fijo)
│   └── footerContent.ts     #   FOOTER_CLIENTES / FOOTER_VENDEDORES / INFO
│
├── types/
│   ├── index.ts             #   interfaces TS que reflejan los DTOs del backend
│   ├── css-custom-props.d.ts#   tipado de CSS custom properties
│   └── ...
│
├── routes/
│   └── ProtectedRoute.tsx   #   gate por sesión + rol
│
├── components/
│   ├── ui/                  # Primitivas del PANEL ADMIN (tema claro)
│   │   ├── Button  Field(Input/Select/Textarea)  Modal  ConfirmDialog
│   │   ├── Table  Pagination  Card  Badge  Spinner  Skeleton
│   │   └── States  DataState  PageHeader
│   ├── marketplace/         # Componentes del STOREFRONT (tema oscuro)
│   │   ├── ProductoCard.tsx #   tarjeta de producto (badge descuento, precio)
│   │   ├── CartDrawer.tsx   #   drawer lateral del carrito
│   │   └── Footer.tsx       #   footer de soporte (2 columnas)
│   ├── landing/             # Componentes "estilo Jack" (catálogo público + home)
│   │   ├── FadeIn  Magnet  AnimatedText  PillButton(Gradient/Ghost)
│   │   ├── HeroProductField  ProductMarquee  ProductCard  StackingProducts
│   │   └── SwipeDeck.tsx    #   ⭐ deck tipo Tinder (ver DESIGN-SYSTEM.md §5)
│   ├── ProductImage.tsx     #   <img> con fallback / placeholder
│   ├── AuthShell.tsx  EstadoStepper.tsx  PedidoItems.tsx  icons.tsx
│
└── pages/
    ├── LoginPage  RegisterPage  NotFoundPage  PublicCatalogPage
    ├── admin/               # Panel del dueño (/admin/*) — tema claro
    │   ├── AdminLayout  DashboardPage  ProductosPage  ProductoFormModal
    │   ├── CategoriasPage  UnidadesPage  ClientesPage  InventarioPage
    │   ├── PedidosPage  ReportesPage  MiTiendaPage  AtributosModal
    ├── marketplace/         # Storefront cross-store (/tienda/*) — tema oscuro
    │   ├── MarketplaceLayout #   navbar + buscador + menú categorías + footer + drawer
    │   ├── HomePage         #   hero bento + deck Tinder + secciones + categorías + tiendas
    │   ├── SearchResultsPage#   resultados + filtro por comercio + orden
    │   ├── StorePage        #   página de una tienda (cabecera + tiles + grid)
    │   └── InfoPage         #   páginas de soporte del footer (por slug)
    └── tienda/              # Vistas de cliente (dentro de /tienda/*)
        ├── ProductoDetallePage  CheckoutPage  CarritoPage  MisPedidosPage
        └── TiendaLayout  CatalogoPage   # ⚠️ VIEJOS (mono-tienda), referencia de estilo
```

> **Nota — archivos viejos:** `tienda/TiendaLayout.tsx` y `tienda/CatalogoPage.tsx` son del diseño mono-tienda anterior. **Ya no se enrutan** (no están en `App.tsx`), pero se conservan como referencia de estilo (glassmorphism/animaciones) y porque `CatalogoPage` aún importa `StackingProducts`. No borrar sin revisar.

---

## 3. Ruteo (`App.tsx`)

Tres áreas. El `<Route path="/" >` redirige a `/tienda`.

```
PÚBLICO
  /login                         LoginPage
  /registro                      RegisterPage          (crea siempre rol CLIENTE)
  /catalogo/:slug                PublicCatalogPage     (catálogo público estilo "Jack" + deck Tinder)

ADMIN  — <ProtectedRoute rol="ADMIN">  → AdminLayout (tema claro)
  /admin                         DashboardPage (index)
  /admin/productos               ProductosPage
  /admin/categorias              CategoriasPage
  /admin/unidades                UnidadesPage
  /admin/clientes                ClientesPage
  /admin/inventario              InventarioPage
  /admin/pedidos                 PedidosPage
  /admin/reportes                ReportesPage
  /admin/mi-tienda               MiTiendaPage          (datos de la tienda; incluye preview de cabecera)

STOREFRONT  — MarketplaceLayout (tema oscuro)  bajo /tienda
  /tienda                        HomePage              (público)
  /tienda/buscar?q=...           SearchResultsPage     (público)
  /tienda/comercio/:slug         StorePage             (público)
  /tienda/info/:slug             InfoPage              (público)
  /tienda/producto/:productoId   ProductoDetallePage   (público)
  /tienda/carrito                CarritoPage           — <ProtectedRoute rol="CLIENTE">
  /tienda/checkout               CheckoutPage          — <ProtectedRoute rol="CLIENTE">
  /tienda/pedidos                MisPedidosPage        — <ProtectedRoute rol="CLIENTE">

  /                              → Navigate a /tienda
  *                              NotFoundPage
```

`ProtectedRoute` (en `routes/`) verifica sesión y rol; si falta, redirige a `/login` guardando `from` para volver tras autenticar.

---

## 4. Provider stack (`main.tsx`)

```
BrowserRouter
  └─ ToastProvider          (toasts globales)
     └─ AuthProvider        (sesión)
        └─ App              (rutas; CartProvider se monta dentro del storefront)
```

`GoogleOAuthProvider` envuelve todo **solo si** `VITE_GOOGLE_CLIENT_ID` está definido (degradación elegante).
`CartProvider` (de `CartContext`) se monta acotado al área `/tienda` para que el carrito viva solo en el storefront.

---

## 5. Autenticación (`context/AuthContext.tsx`)

- La sesión es un `SessionUser` persistido en **`localStorage`** bajo la clave **`multitienda.session`**.
- **Flujo de login:** `POST /api/auth` (credenciales) → se **decodifica el JWT** para sacar el `userId` (`lib/jwt.ts`, claim **`jti`**; el email va en `sub`) → `GET /api/usuarios/{id}` para resolver `rol`, `tiendaId`, `nombre`.
- `homePathForRol`: **ADMIN → `/admin`**, **CLIENTE → `/tienda`**.
- **Login solo con credenciales** (sin selector de tienda; `tienda_id` es opcional en el backend).
- También existe `POST /api/auth/google` (Google ID token) y logout `POST /api/auth/logout`.
- El provider registra su handler de **logout-on-401** dentro del interceptor de axios, manteniéndolo desacoplado del router.

Credenciales de prueba sembradas por el backend: **`admin@comercio1.com` / `123456`** (rol ADMIN, tienda Comercio1).

---

## 6. Capa de datos (`api/`)

- **Toda** llamada HTTP pasa por `api/*`. Los componentes **nunca** usan `axios` suelto.
- `api/client.ts` expone la instancia axios con:
  - **request interceptor**: inyecta `Authorization: Bearer <token>` desde la sesión persistida.
  - **response interceptor**: ante un **401** (salvo durante un intento de login) llama al handler `onUnauthorized` → limpia sesión y redirige a `/login`.
- `tiendaId` y `userId` salen **siempre** del `AuthContext`, nunca hardcodeados.
- Errores en formato **RFC 7807 (Problem Details)**; `lib/errors.ts` extrae `detail` (mensaje) y errores por campo.

### Módulos clave
- **`api/marketplace.ts`** — endpoints cross-store del storefront: `home()`, `buscar({q,tiendaId,orden,page,size})`, `sugerencias(q,n)`, `categoriasPopulares(n)`, `obtenerProducto(id)`, `recomendados(id,n)`. Tipo de orden: `OrdenBusqueda = 'relevante'|'reciente'|'precio_desc'|'precio_asc'|'descuento'`.
- **`api/catalogo.ts`** — `porSlug(slug)` → `{ tienda, productos, contactosWhatsapp }` (catálogo público).
- **`api/carrito.ts`** — `agregarItem`, `eliminarItem`, etc. Carrito por (tienda, usuario).
- **`api/pedidos.ts`** — `checkout(userId, direccionId)` (crea **un pedido por tienda**), `obtener`, `generarQr` (Stereum, snake_case: `qr_base64`, `payment_link`...).

> Detalles de la API que difieren de lo intuitivo: el JWT guarda `userId` en `jti`; el body de login usa `tienda_id` (snake_case); el pago se confirma por **webhook + polling cada 5 s**; **no existe** endpoint "listar todos los pedidos de la tienda" (se busca por cliente o por número).

---

## 7. Estado de carga en cada vista (patrón obligatorio)

Cada vista maneja **3 estados** con `useAsync`:
- **Cargando** → spinner / skeleton (`components/ui/Skeleton`, `DataState`).
- **Error** → muestra el `detail` del Problem Details.
- **Vacío** → mensaje claro.

`useAsync<T>(fn, deps)` devuelve `{ data, loading, error, reload }` y re-ejecuta cuando cambian las `deps`.

---

## 8. Reglas / convenciones para modificar el frontend

1. **No mezclar capas:** la UI nunca llama a axios directo → siempre `api/*`. `tiendaId`/`userId` desde `AuthContext`.
2. **Dos temas visuales** (ver DESIGN-SYSTEM.md): **admin = claro** (componentes `ui/`), **storefront/catálogo = oscuro**. No usar componentes `ui/` (claros) dentro de `/tienda` ni viceversa, salvo `MiTiendaPage` que es admin.
3. **Lógica vs estilo:** al restilizar, tocar solo markup/clases; no cambiar llamadas API, hooks, props, rutas.
4. **Tipos:** `types/index.ts` refleja los DTOs del backend. Si cambia un DTO, actualizar acá.
5. **Build verde:** `npm run typecheck` y `npm run build` deben pasar antes de dar por terminado. El proyecto usa `noUnusedLocals` → eliminá imports que dejes de usar.
6. **Accesibilidad:** `aria-label` en botones de ícono, `label` en inputs, `alt` en imágenes, foco visible (hay anillo global en `index.css`).
7. **Tailwind extendido:** podés agregar colores/animaciones a `tailwind.config.js`. ⚠️ Si usás un tono que no existe en la paleta (`brand`/`cta`), en CSS (`@apply`) **rompe el build**, y en `.tsx` se **ignora en silencio** (la clase no se genera). Definí el tono primero.

---

## 9. Backend asociado (contexto)

- API REST Spring Boot en `http://localhost:8081` (Swagger en `/swagger-ui.html`).
- CORS abierto (`Access-Control-Allow-Origin: *`); se usa token Bearer en header (no cookies), así que no hay conflicto de credenciales.
- Ver `CLAUDE.md` en la raíz para arquitectura del backend, pagos Stereum, Quartz, etc.
