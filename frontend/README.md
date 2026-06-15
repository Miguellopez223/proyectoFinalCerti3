# Frontend React

Frontend React + Vite para el backend Spring del proyecto.

## Requisitos

- Node.js 20+
- npm 10+
- Backend corriendo en `http://localhost:8082`

## Ejecutar

```bash
npm install
npm run dev
```

El frontend queda disponible por defecto en `http://localhost:5173`.

## Configuracion

Copia `.env.example` como `.env` si necesitas apuntar a otra URL:

```bash
VITE_API_URL=http://localhost:8082
```

## Flujo implementado

- listado de tiendas
- login por tienda
- registro de cliente por tienda
- catalogo autenticado por tienda
- agregar productos al carrito
- ver y eliminar items del carrito

## Notas del backend actual

- `GET /api/tiendas` es publico.
- `POST /api/auth` es publico.
- `POST /api/usuarios/registrar` es publico.
- categorias, productos y carrito requieren JWT.
- el `usuarioId` no llega en el login; el frontend lo extrae del claim `id` dentro del JWT.

## Validacion realizada

```bash
npm run build
```

La compilacion de produccion pasa correctamente.
