# MultiTienda — Frontend

Frontend completo para la API REST de ecommerce **multi-tienda** (Spring Boot, `:8081`).
Construido con **React 18 + Vite + TypeScript + Tailwind CSS**. Consume el backend existente; no lo modifica.

Hay **dos interfaces**, enrutadas según el **rol** del usuario logueado:

- **Panel del dueño (ADMIN)** → `/admin/*`: dashboard con KPIs y gráficos, y CRUDs de productos, categorías, unidades de medida, atributos, clientes, inventario, pedidos y reportes analíticos.
- **Tienda del cliente (CLIENTE)** → `/tienda/*`: storefront con catálogo, carrito, checkout con **QR de pago (Stereum)** e historial de pedidos.

---

## Requisitos

- Node.js 18+ y npm
- El backend corriendo en `http://localhost:8081` (Swagger en `/swagger-ui.html`)

## Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

Otros scripts:

```bash
npm run build      # type-check + build de producción (carpeta dist/)
npm run preview    # sirve el build de producción
npm run typecheck  # solo verificación de tipos
```

## Variable de entorno

| Variable       | Default                 | Descripción                        |
| -------------- | ----------------------- | ---------------------------------- |
| `VITE_API_URL` | `http://localhost:8081` | URL base del backend Spring Boot.  |

Está en `.env` (y `.env.example`). Si tu backend corre en otro host/puerto, cámbiala y reinicia `npm run dev`.

## Credenciales de prueba

Admin sembrado al arrancar el backend:

- **Tienda:** se elige en el `<select>` del login (se cargan con `GET /api/tiendas`). El admin de demo pertenece a *Comercio1*.
- **Email:** `admin@comercio1.com`
- **Contraseña:** `123456`

Para probar como CLIENTE, regístrate en `/registro` (crea siempre rol CLIENTE) o crea un cliente desde el panel admin (Clientes → Nuevo usuario).

---

## Nota sobre CORS

El backend incluye un `CorsFilter` que responde con `Access-Control-Allow-Origin: *`,
`Access-Control-Allow-Headers: *` y `Access-Control-Allow-Methods: *`, y maneja los
preflight `OPTIONS`. **No se necesita proxy** ni configuración extra: la app llama
directamente a `http://localhost:8081`.

Como usamos **token Bearer en el header** (no cookies), el `*` de origen no genera el
conflicto típico de credenciales. Si en algún entorno el backend restringe orígenes,
ajusta `VITE_API_URL` o añade tu origen a la lista permitida del backend.

---

## Arquitectura del proyecto

```
src/
├── api/            # Capa de servicios: un archivo por recurso (axios centralizado)
│   ├── client.ts   #   instancia axios + interceptores (auth + 401)
│   └── *.ts        #   auth, tiendas, productos, categorias, unidades, atributos,
│                   #   usuarios, inventario, pedidos, pagos, direcciones, carrito,
│                   #   dashboard, reportes, catalogo
├── components/     # UI reutilizable
│   ├── ui/         #   Button, Field (Input/Select/Textarea), Modal, ConfirmDialog,
│   │               #   Table, Pagination, Card, Badge, Spinner, Skeleton, States,
│   │               #   DataState, PageHeader
│   ├── icons.tsx   #   set de iconos SVG (sin emojis)
│   └── *.tsx       #   AuthShell, ProductImage, EstadoStepper, PedidoItems
├── context/        # AuthContext, ToastContext, CartContext
├── hooks/          # useAsync, useDebounced
├── lib/            # jwt (decode), format (moneda/fecha/slug), errors (RFC7807), cn
├── pages/
│   ├── admin/      # AdminLayout + Dashboard, Productos, Categorias, Unidades,
│   │               # Clientes, Inventario, Pedidos, Reportes (+ modales)
│   ├── tienda/     # TiendaLayout + Catalogo, ProductoDetalle, Carrito, Checkout, MisPedidos
│   ├── LoginPage / RegisterPage / PublicCatalogPage / NotFoundPage
├── routes/         # ProtectedRoute (sesión + rol)
├── types/          # interfaces TS que reflejan los DTOs del backend
└── App.tsx         # árbol de rutas
```

**Decisiones clave**

- **Todas** las llamadas HTTP pasan por `src/api/*`; los componentes nunca usan `axios` suelto.
- `tiendaId` y `userId` **siempre** salen del `AuthContext` (nunca hardcodeados).
- El interceptor de axios inyecta `Authorization: Bearer <token>` y, ante un `401`,
  limpia la sesión y redirige a `/login`.
- Cada vista maneja **3 estados**: cargando (skeleton/spinner), error (muestra el
  `detail` del Problem Details RFC 7807) y vacío.
- Diseño con paleta cian + verde y tipografía Fira Sans / Fira Code (números y códigos en mono).

---

## Flujo de autenticación (multi-tienda)

1. El login pide **tienda + email + contraseña**. La tienda se elige por nombre en un
   `<select>` poblado con `GET /api/tiendas` (público).
2. Se llama `POST /api/auth`. La respuesta trae `access_token` (snake_case).
3. Se **decodifica el JWT** para obtener el `userId`.
4. Se llama `GET /api/usuarios/{userId}` para conocer el **rol** y el nombre.
5. Se guarda la sesión (`token`, `userId`, `tiendaId`, `rol`, `nombre`) en
   `AuthContext` + `localStorage`.
6. Redirección por rol: `ADMIN → /admin`, `CLIENTE → /tienda`. Las rutas están
   protegidas: cada quien solo entra a su sección.

**Logout:** `POST /api/auth/logout` con el token y limpieza local.

---

## Notas / supuestos sobre la API

Estos puntos se verificaron leyendo los DTOs/controladores del backend y difieren o
precisan lo que podría asumirse a primera vista:

- **El body de login usa `tienda_id` en snake_case** (anotación `@JsonProperty("tienda_id")`
  en `LoginRequest`), no `tiendaId`. La app lo envía correctamente.
- **El JWT guarda el `userId` en el claim `jti`** (proviene de `Claims.id()` de JJWT).
  El decodificador lee `jti` con respaldo a `id`. El email está en `sub`.
- **El QR del pedido** (`POST /api/pedidos/tienda/{t}/{p}/qr`) devuelve el objeto de
  Stereum (`StereumCreateChargeResponse`) en **snake_case**: `qr_base64`, `transaction_status`,
  `payment_link`, etc. La imagen `qr_base64` se muestra como `data:image/jpeg;base64,…`
  (o se respeta el prefijo `data:` si ya viene incluido).
- **No existe un endpoint "listar todos los pedidos de la tienda".** El panel admin de
  pedidos lista por cliente (`GET /api/pedidos/tienda/{t}/usuario/{u}`) y permite buscar
  un pedido puntual por su número (`GET /api/pedidos/tienda/{t}/{id}`).
- **Confirmación de pago asíncrona:** el estado se confirma por un webhook del backend.
  El checkout hace *polling* del pedido cada 5 s y ofrece un botón "Ya pagué / actualizar".
- **Actualizar un usuario exige contraseña** (el `UsuarioRequest` la marca `@NotBlank`).
  El formulario de edición de clientes lo advierte y pide reingresar la contraseña.
- Los reportes traen series (`etiqueta`, `cantidad`, `ingresos`) que se grafican con
  Recharts (líneas y barras).

---

## Catálogo público (sin login)

Ruta `/catalogo/:slug` → `GET /api/catalogo/{slug}`. Muestra los productos de la tienda
en modo lectura, con botones de WhatsApp para el cierre conversacional. No requiere token.
