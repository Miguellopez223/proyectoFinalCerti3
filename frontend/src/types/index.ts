// ============================================================================
// Tipos que reflejan los DTOs del backend Spring Boot (com.upb.ecommerce.core.dto).
// Los montos llegan como number (BigDecimal serializado por Jackson) — los
// tratamos como number y los formateamos como moneda (Bs / BOB).
// ============================================================================

export type Rol = 'ADMIN' | 'CLIENTE';

// --- Page<T> de Spring Data ------------------------------------------------
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // página actual (0-based)
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

// --- Auth ------------------------------------------------------------------
/** Body de POST /api/auth — solo credenciales; el backend resuelve la tienda por email. */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface LoginResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

/** Sesión persistida en localStorage + AuthContext. */
export interface SessionUser {
  token: string;
  userId: number;
  tiendaId: number;
  rol: Rol;
  nombre: string;
  email: string;
  expiresAt?: number;
}

// --- Tienda ----------------------------------------------------------------
export interface Tienda {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  bannerUrl?: string | null;
  telefonoContacto?: string;
  emailContacto?: string;
  logoUrl?: string;
  estado: boolean;
}
export interface TiendaRequest {
  nombre: string;
  slug: string;
  descripcion?: string | null;
  bannerUrl?: string | null;
  telefonoContacto?: string;
  emailContacto?: string;
  logoUrl?: string;
}

// --- Categoría -------------------------------------------------------------
export interface Categoria {
  id: number;
  tiendaId: number;
  nombre: string;
  estado: boolean;
}
export interface CategoriaRequest {
  tiendaId: number;
  nombre: string;
}

// --- Unidad de medida ------------------------------------------------------
export interface UnidadMedida {
  id: number;
  tiendaId: number;
  nombre: string;
  abreviatura?: string;
  estado: boolean;
}
export interface UnidadMedidaRequest {
  tiendaId: number;
  nombre: string;
  abreviatura?: string;
}

// --- Producto --------------------------------------------------------------
export interface Producto {
  id: number;
  tiendaId: number;
  tiendaNombre?: string | null;
  tiendaSlug?: string | null;
  categoriaId?: number | null;
  categoriaNombre?: string | null;
  unidadMedidaId?: number | null;
  unidadMedidaNombre?: string | null;
  nombre: string;
  slugProducto: string;
  descripcionLarga?: string | null;
  precio: number;
  precioCosto?: number | null;
  precioOferta?: number | null;
  ofertaInicio?: string | null;
  ofertaFin?: string | null;
  // Derivados calculados en el backend (según vigencia de la oferta):
  enOferta?: boolean | null;
  precioEfectivo?: number | null;
  descuentoPorcentaje?: number | null;
  stock: number;
  stockMinimo?: number | null;
  imagenUrl?: string | null;
  estado: boolean;
}
export interface ProductoRequest {
  tiendaId: number;
  categoriaId?: number | null;
  unidadMedidaId?: number | null;
  nombre: string;
  slugProducto: string;
  descripcionLarga?: string;
  precio: number;
  precioCosto?: number | null;
  precioOferta?: number | null;
  ofertaInicio?: string | null;
  ofertaFin?: string | null;
  stock: number;
  stockMinimo?: number | null;
  imagenUrl?: string;
}

// --- Atributos de producto -------------------------------------------------
export interface AtributoProducto {
  id: number;
  productoId: number;
  nombre: string;
  valor: string;
}
export interface AtributoProductoRequest {
  productoId: number;
  nombre: string;
  valor: string;
}

// --- Usuario ---------------------------------------------------------------
export interface Usuario {
  id: number;
  tiendaId: number;
  nombre: string;
  email: string;
  rol: Rol;
  numeroWhatsapp?: string | null;
  visibleCatalogo?: boolean | null;
  estado: boolean;
}
export interface UsuarioRequest {
  tiendaId: number;
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  numeroWhatsapp?: string;
  visibleCatalogo?: boolean;
}

// --- Carrito ---------------------------------------------------------------
export interface ItemCarrito {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
export interface Carrito {
  id: number;
  tiendaId: number;
  usuarioId: number;
  estado: string;
  totalEstimado: number;
  items: ItemCarrito[];
}
export interface AgregarItemCarritoRequest {
  tiendaId: number;
  usuarioId: number;
  productoId: number;
  cantidad: number;
}

// --- Pedido ----------------------------------------------------------------
export type EstadoPedido =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'PREPARANDO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface ItemPedido {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
export interface Pedido {
  id: number;
  tiendaId: number;
  usuarioId: number;
  codigoSeguimiento?: string;
  total: number;
  estadoPedido: EstadoPedido | string;
  direccionId?: number | null;
  items: ItemPedido[];
}
export interface CrearPedidoRequest {
  tiendaId: number;
  usuarioId: number;
  direccionId?: number | null;
}

/** Body opcional de POST /api/pedidos/tienda/{t}/{p}/qr */
export interface GenerarQrRequest {
  country?: string;
  currency?: string;
  network?: string;
  documentNumber?: string;
  reservationValidityTime?: string;
}

/**
 * Respuesta de Stereum al generar el QR del pedido.
 * OJO: viene en snake_case (com.upb.ecommerce.core.integracion.StereumCreateChargeResponse).
 * `qr_base64` es la imagen lista para `data:image/jpeg;base64,...`.
 */
export interface StereumCharge {
  id: string;
  amount: number;
  currency: string;
  network: string;
  qr_base64?: string;
  payment_link?: string;
  transaction_status?: string;
  collecting_account?: string;
  on_main_net?: boolean;
  expiration_time?: number;
}

// --- Pago ------------------------------------------------------------------
export interface Pago {
  id: number;
  pedidoId: number;
  metodo: string;
  transaccionPasarelaId?: string;
  monto: number;
  estadoPago: string;
}

// --- Dirección de envío ----------------------------------------------------
export interface DireccionEnvio {
  id: number;
  usuarioId: number;
  direccionCalle: string;
  ciudad: string;
  referencias?: string;
  estado: boolean;
}
export interface DireccionEnvioRequest {
  usuarioId: number;
  direccionCalle: string;
  ciudad: string;
  referencias?: string;
}

// --- Inventario ------------------------------------------------------------
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export interface MovimientoInventario {
  id: number;
  tiendaId: number;
  productoId: number;
  productoNombre: string;
  usuarioId?: number | null;
  tipo: TipoMovimiento | string;
  cantidad: number;
  referencia?: string;
  fecha: string; // LocalDateTime ISO
}
export interface MovimientoInventarioRequest {
  tiendaId: number;
  productoId: number;
  usuarioId?: number | null;
  tipo: TipoMovimiento;
  cantidad: number;
  referencia?: string;
}

// --- Dashboard -------------------------------------------------------------
export interface Dashboard {
  totalProductos: number;
  totalMovimientos: number;
  productosAgotados: number;
  productosStockBajo: number;
  ventasHoy: number;
  ingresosHoy: number;
  alertasStock: Producto[];
  ultimasVentas: Pedido[];
}

// --- Reportes --------------------------------------------------------------
export interface SerieItem {
  etiqueta: string;
  cantidad: number;
  ingresos: number;
}
export interface ReporteAnalitico {
  ventasPorDia: SerieItem[];
  ventasPorCategoria: SerieItem[];
  ventasPorHora: SerieItem[];
  ingresosSemanaActual: number;
  ingresosSemanaAnterior: number;
  variacionPorcentaje: number;
}
export interface ReporteVentas {
  totalVentas: number;
  ingresosBrutos: number;
  costoVentas: number;
  utilidadBruta: number;
  ticketPromedio: number;
  margenPorcentaje: number;
  porMetodoPago: SerieItem[];
}
export interface ProductoRanking {
  productoId: number;
  nombre: string;
  cantidadVendida: number;
  ingresos: number;
}
export interface ReporteProductos {
  masVendidos: ProductoRanking[];
  productosMuertos: Producto[];
  valorizacionCosto: number;
  valorizacionVenta: number;
  stockCritico: Producto[];
}
export interface ReporteCliente {
  usuarioId: number;
  nombre: string;
  email: string;
  cantidadCompras: number;
  totalGastado: number;
}

// --- Catálogo público ------------------------------------------------------
export interface Catalogo {
  tienda: Tienda;
  productos: Producto[];
  contactosWhatsapp: string[];
}

// --- Marketplace -----------------------------------------------------------
export interface FacetaTienda {
  tiendaId: number;
  nombre: string;
  cantidad: number;
}
export interface BusquedaResponse {
  productos: Producto[];
  total: number;
  page: number;
  size: number;
  totalPaginas: number;
  facetasTiendas: FacetaTienda[];
}
export interface CategoriaPopular {
  nombre: string;
  cantidad: number;
}
export interface HomeData {
  masBuscados: Producto[];
  ofertas: Producto[];
  destacados: Producto[];
  tiendas: Tienda[];
}

// --- Error RFC 7807 --------------------------------------------------------
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string>;
  // fallbacks comunes
  message?: string;
  error?: string;
  mensaje?: string;
}
