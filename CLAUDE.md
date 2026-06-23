# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Frontend Design Philosophy

Make creative, distinctive frontends that surprise and delight — avoid the generic "AI slop" aesthetic:

- **Typography**: Choose beautiful, unique fonts. Avoid Inter, Roboto, Arial. Commit to distinctive choices.
- **Color & Theme**: Use CSS variables. Dominant colors with sharp accents outperform timid palettes. Draw from IDE themes and cultural aesthetics.
- **Motion**: Prioritize CSS-only animations. One well-orchestrated page load with staggered reveals (animation-delay) beats scattered micro-interactions. Use Motion library in React when available.
- **Backgrounds**: Layer CSS gradients, use geometric patterns, add contextual effects — never default to flat solid colors.
- Avoid Space Grotesk, purple-on-white gradients, predictable layouts. Vary between light/dark themes and unexpected aesthetic choices.

## Project Overview

Full-stack e-commerce platform for UPB. Spring Boot 4.0.6 (Java 21) REST API + React/TypeScript frontend. Features: JWT auth, multi-tenant stores, shopping cart, order processing, Stereum QR payments, abandoned cart notifications.

## Commands

### Backend (Maven)
```bash
# Run the API on http://localhost:8081
./mvnw spring-boot:run -pl ecommerce-api

# Build all modules
./mvnw clean install -DskipTests

# Run tests
./mvnw test -pl ecommerce-api
```

On Windows without bash, use `mvnw.cmd` instead of `./mvnw`.

**Prerequisites**: Java 21, PostgreSQL with database `ecommerceUPB` on port 5432.

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # TypeScript check without build
npm run build        # tsc --noEmit && vite build
```

## Architecture

### Backend — Multi-module Maven with Clean Architecture

```
ecommerce-parent (root POM)
├── ecommerce-domain   → JPA @Entity classes + enums
├── ecommerce-data     → Spring Data JPA repositories + DataSeeder
├── ecommerce-core     → Business logic services, DTOs, external API clients
└── ecommerce-api      → REST controllers, Security config, Quartz jobs
```

Dependencies flow inward: `api` → `core` → `data` → `domain`. All code lives under `com.upb.ecommerce.<module>`.

Key packages:
- `api.controller` — REST endpoints (Auth, Carrito, Producto, Pedido, Pago, Dashboard, Reporte, etc.)
- `api.config` — `SecurityConfig`, `JwtTokenProvider`, `JwtTokenFilter`, `TokenBlacklist`, `CorsFilter`, `GlobalExceptionHandler`
- `api.scheduler` — `CarritoAbandonadoJob` (Spring `@Scheduled`, every 8h)
- `api.quartz` — Quartz JDBC job store infrastructure (`JobService`, `JobInitializer`, `AutowiringSpringBeanJobFactory`)
- `api.jobs` — `EmailSenderJob` (Quartz job class)
- `core.service` — Business logic (one service interface per domain entity)
- `core.integracion` — `StereumService` (QR payments via `RestClient`), `SistemaExternoService` (external ecommerce peer)
- `data.repository` — JPA repositories with custom JPQL queries
- `data.seeders` — `DataSeeder`: creates default `Comercio1` store + admin user on first run
- `domain.entities` — `Usuario`, `Producto`, `Carrito`, `DetalleCarrito`, `Pedido`, `DetallePedido`, `Pago`, `Categoria`, `Tienda`, `MovimientoInventario`, etc.
- `domain.enums` — `RolType` (ADMIN, CLIENTE), `UsuarioStatus`

### Frontend — React + TypeScript + Tailwind

React Router v6 with two protected role-based shells:
- `/admin/*` — ADMIN role: Dashboard, Productos, Categorias, Unidades, Clientes, Inventario, Pedidos, Reportes
- `/tienda/*` — CLIENTE role: Catalogo, ProductoDetalle, Carrito, Checkout, MisPedidos
- `/catalogo/:slug` — Public storefront (no auth)

State: `AuthContext` (JWT + user), `CartContext` (cart state for `/tienda`), `ToastContext` (notifications). API calls go through `src/api/client.ts` (axios instance that injects the JWT header).

## Security & Auth

- Auth: `POST /api/auth` with `{email, password, tiendaId}` → JWT (8h expiry).  Multi-tenant: user must belong to the requested `tiendaId`.
- Logout: `POST /api/auth/logout` — token added to in-memory `TokenBlacklist` until expiry.
- All errors return RFC 7807 Problem Details (`spring.mvc.problem-details.enabled=true`).

## Scheduler Architecture

Two parallel scheduling systems coexist:

1. **Spring `@Scheduled`** (`CarritoAbandonadoJob`) — abandonment sweep every 8h, processes carts in batches of 50, dispatches `@Async` workers (thread pool: 5 core / 50-queue). Carts idle >1h flagged ABANDONADO; Gmail SMTP notification sent (failure silently logged, cart still marked).

2. **Quartz JDBC** — persistent job store on PostgreSQL (tables must be initialized once with `spring.quartz.jdbc.initialize-schema=always`, then set back to `never`). `JobInitializer` registers `EmailSenderJob` at startup (idempotent). Configured for clustering (`isClustered=true`). SQL schema: `ecommerce-api/src/main/resources/db/quartz-tables-postgres.sql`.

## Payment Integration

Stereum QR: `POST /api/v1/transactions/create-charge` with `x-api-key` header. Webhook signature validated via HMAC-SHA256 (`commons-codec`). Idempotency key auto-generated (UUID v4) if absent.

## Configuration Notes

- `spring.quartz.jdbc.initialize-schema`: set to `always` on first run to create Quartz tables, then `never`.
- Gmail SMTP credentials (`spring.mail.username` / `spring.mail.password`) must use an App Password, not the regular account password. Empty credentials still allow the abandonment sweep — only email sending fails.
- `sistema.externo.url-base`: currently points to `localhost:8081` (self); update to the peer ecommerce system's URL for real integration.
- `ddl-auto=update`: Hibernate auto-migrates schema. New columns must be nullable to avoid breaking existing rows.
