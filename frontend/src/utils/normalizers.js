function read(object, ...keys) {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) {
      return object[key];
    }
  }
  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function normalizeStore(store) {
  return {
    id: toNumber(read(store, "id")),
    nombre: read(store, "nombre"),
    slug: read(store, "slug"),
    telefonoContacto: read(store, "telefonoContacto", "telefono_contacto"),
    emailContacto: read(store, "emailContacto", "email_contacto"),
    logoUrl: read(store, "logoUrl", "logo_url"),
    estado: Boolean(read(store, "estado"))
  };
}

export function normalizeCategory(category) {
  return {
    id: toNumber(read(category, "id")),
    tiendaId: toNumber(read(category, "tiendaId", "tienda_id")),
    nombre: read(category, "nombre"),
    estado: Boolean(read(category, "estado"))
  };
}

export function normalizeProduct(product) {
  return {
    id: toNumber(read(product, "id")),
    tiendaId: toNumber(read(product, "tiendaId", "tienda_id")),
    categoriaId: toNumber(read(product, "categoriaId", "categoria_id")),
    categoriaNombre: read(product, "categoriaNombre", "categoria_nombre"),
    nombre: read(product, "nombre"),
    slugProducto: read(product, "slugProducto", "slug_producto"),
    descripcionLarga: read(product, "descripcionLarga", "descripcion_larga"),
    precio: toNumber(read(product, "precio")),
    precioCosto: toNumber(read(product, "precioCosto", "precio_costo")),
    stock: toNumber(read(product, "stock")),
    stockMinimo: toNumber(read(product, "stockMinimo", "stock_minimo")),
    imagenUrl: read(product, "imagenUrl", "imagen_url"),
    estado: Boolean(read(product, "estado"))
  };
}

export function normalizeUser(user) {
  return {
    id: toNumber(read(user, "id")),
    tiendaId: toNumber(read(user, "tiendaId", "tienda_id")),
    nombre: read(user, "nombre", "name"),
    email: read(user, "email"),
    rol: read(user, "rol", "role"),
    estado: Boolean(read(user, "estado"))
  };
}

export function normalizeMovement(movement) {
  return {
    id: toNumber(read(movement, "id")),
    tiendaId: toNumber(read(movement, "tiendaId", "tienda_id")),
    productoId: toNumber(read(movement, "productoId", "producto_id")),
    productoNombre: read(movement, "productoNombre", "producto_nombre"),
    usuarioId: toNumber(read(movement, "usuarioId", "usuario_id")),
    tipo: read(movement, "tipo"),
    cantidad: toNumber(read(movement, "cantidad")),
    referencia: read(movement, "referencia"),
    fecha: read(movement, "fecha")
  };
}

export function normalizeOrder(order) {
  const items = Array.isArray(read(order, "items"))
    ? read(order, "items").map((item) => ({
        id: toNumber(read(item, "id")),
        productoId: toNumber(read(item, "productoId", "producto_id")),
        productoNombre: read(item, "productoNombre", "producto_nombre"),
        cantidad: toNumber(read(item, "cantidad")),
        precioUnitario: toNumber(read(item, "precioUnitario", "precio_unitario")),
        subtotal: toNumber(read(item, "subtotal"))
      }))
    : [];

  return {
    id: toNumber(read(order, "id")),
    tiendaId: toNumber(read(order, "tiendaId", "tienda_id")),
    usuarioId: toNumber(read(order, "usuarioId", "usuario_id")),
    codigoSeguimiento: read(order, "codigoSeguimiento", "codigo_seguimiento"),
    total: toNumber(read(order, "total")),
    estadoPedido: read(order, "estadoPedido", "estado_pedido"),
    direccionId: toNumber(read(order, "direccionId", "direccion_id")),
    items
  };
}

export function normalizeCart(cart) {
  const items = Array.isArray(read(cart, "items"))
    ? read(cart, "items").map((item) => ({
        id: toNumber(read(item, "id")),
        productoId: toNumber(read(item, "productoId", "producto_id")),
        productoNombre: read(item, "productoNombre", "producto_nombre"),
        cantidad: toNumber(read(item, "cantidad")),
        precioUnitario: toNumber(read(item, "precioUnitario", "precio_unitario")),
        subtotal: toNumber(read(item, "subtotal"))
      }))
    : [];

  return {
    id: toNumber(read(cart, "id")),
    tiendaId: toNumber(read(cart, "tiendaId", "tienda_id")),
    usuarioId: toNumber(read(cart, "usuarioId", "usuario_id")),
    estado: read(cart, "estado"),
    totalEstimado: toNumber(read(cart, "totalEstimado", "total_estimado")),
    items
  };
}

export function normalizeLoginResponse(payload) {
  return {
    accessToken: read(payload, "accessToken", "access_token"),
    idToken: read(payload, "idToken", "id_token"),
    refreshToken: read(payload, "refreshToken", "refresh_token"),
    tokenType: read(payload, "tokenType", "token_type"),
    expiresIn: toNumber(read(payload, "expiresIn", "expires_in")),
    expiresAt: toNumber(read(payload, "expiresAt", "expires_at"))
  };
}

export function decodeJwtPayload(token) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}
