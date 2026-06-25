# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Klikea" — a multi-vendor marketplace ecommerce platform. Spring Boot backend (multi-module Maven) + React/Vite/TypeScript frontend. The product is mid-redesign: moving from a single-store catalog to a cross-store marketplace (see `docs/marketplace-rediseno.md` and `docs/plan-implementacion-marketplace.md` for the phased plan and current phase status before making product-shape changes).

## Commands

### Backend (Maven multi-module, Java 21, Spring Boot 4)

```bash
# Build everything
./mvnw clean package -DskipTests

# Run the API locally (uses application-local.properties overrides)
./mvnw spring-boot:run -pl ecommerce-api -Dspring-boot.run.profiles=local

# Run a single module's build
./mvnw -pl ecommerce-data -am package
```

There are no test sources in any module yet (`-DskipTests` is not strictly needed but is the established convention in this repo).

### Frontend (`frontend/`)

```bash
npm install
npm run dev        # http://localhost:5173, expects backend on http://localhost:8081 (VITE_API_URL)
npm run build      # tsc typecheck + vite build
npm run typecheck
npm run preview
```

No backend dev proxy is configured in `vite.config.ts` — the frontend calls the API directly and relies on the backend's permissive CORS filter (`ecommerce-api/.../config/CorsFilter.java`).

### Local seed credentials

`DataSeeder` (ecommerce-data) creates 5 demo tiendas and one admin per tienda on startup, e.g. `admin@comercio1.com` / `123456` (frontend README) — password is bcrypt-hashed `Admin123**` for newly created records; the seeder also migrates any un-prefixed legacy password hashes it finds.

## Architecture

### Module boundaries (dependency flows downward)

- **ecommerce-domain** — JPA entities only. No business logic.
- **ecommerce-data** — Spring Data repositories + `DataSeeder` (CommandLineRunner, `@Order(1)`, runs every startup). Depends on `ecommerce-domain`.
- **ecommerce-core** — Services, DTOs, email (JavaMailSender + Thymeleaf templates), validation. Depends on `ecommerce-data`. Caffeine caching is **on** (`@EnableCaching` in `EcommerceApplication`): `UsuarioService`/`ProductoService`/`CatalogoService` are `@Cacheable` over the `usuarios`/`productos`/`catalogo` caches, and mutating methods `@CacheEvict` them — note the broad `@CacheEvict(value="catalogo", allEntries=true)` on most writes. SpEL cache keys (e.g. `key="#id"`) rely on the `-parameters` compile flag set in the root `pom.xml`; don't remove it.
- **ecommerce-api** — REST controllers, Spring Security/JWT, Quartz jobs, AWS S3 uploads, OpenAPI/Swagger, Actuator. Depends on `ecommerce-core`.

When changing a domain concept, expect to touch all four modules top-to-bottom (entity → repository/seeder → service/DTO → controller).

### Auth & security (`ecommerce-api/.../config`)

- Stateless JWT auth (`io.jsonwebtoken`, `JwtTokenProvider` + `JwtTokenFilter`), ~8h expiry.
- Google OAuth login via `GoogleTokenVerifier`.
- Public (no-JWT) routes: `/api/auth`, `/api/usuarios/registrar`, `/api/tiendas` (listing), `/api/marketplace/**`, `/api/catalogo/**`, the Stereum webhook (`/api/webhooks/stereum/outbound`, authenticated by the `username`/`password` Stereum sends in the JSON body — verified against `stereum.webhook.*`), Swagger, `/actuator/health`. Everything else requires a Bearer token; method-level role checks use `@EnableMethodSecurity`.
- Logout invalidation goes through `TokenBlacklist`.

### Payments

Stereum (crypto QR payment) integration: `/api/pedidos/.../qr` generates payment QR codes (`StereumService.crearCargo` → `POST /transactions/create-charge`, needs `account_id` + an api-key with the "Generar QR de Pago" permission). Payment is confirmed by Stereum's **inbound callback** to `/api/webhooks/stereum/outbound` — a flat JSON body (`transactionId`, `username`/`password`, etc.) matched to a `Pago` by `transaccionPasarelaId`; on success the `Pago`→EXITOSO and `Pedido`→PAGADO. The callback is authenticated by the body `username`/`password` (config `stereum.webhook.*`), **not** by HMAC headers (the earlier HMAC impl was based on a wrong assumption about the payload). Credentials/URLs are env-driven with local-testnet overrides in `application-local.properties`.

### Background jobs (Quartz, persistent JDBC JobStore)

Schema lives in `script/quartz.sql` (apply before first run) and `script/quartz-cleanup-emailjob.sql` (migration cleanup). Jobs are registered at startup via `QuartzJobInitializer`:
- `CarritoAbandonadoQuartzJob` — every 8h, marks carts inactive past `carrito.abandono.horas` as ABANDONADO in batches of 50, fires an async reminder email. Implements `InterruptableJob` + `@DisallowConcurrentExecution`.
- `NotificacionJob` — periodic demo/notification job.

### Configuration

`application.properties` holds defaults with env-var fallbacks (DB, JWT secret, Google client ID, Stereum keys, SMTP). `application-local.properties` (profile `local`) carries the actual local-dev values — per [[local-credentials-convention]], real local credentials belong here, not in global Windows env vars. `ddl-auto=update` — schema migrates automatically on boot, no Flyway/Liquibase.

Two pieces of DB state are *not* covered by `ddl-auto` and need raw SQL: the Quartz `qrtz_*` tables (`script/quartz.sql`, apply before first run — see Background jobs) and the accent-insensitive search function `kilikea_norm` used by marketplace search. `MarketplaceDbInitializer` tries to `CREATE OR REPLACE` that function at startup; `script/marketplace.sql` is the manual fallback if the boot user lacks privileges.

### Frontend structure (`frontend/src`)

Three distinct visual surfaces sharing one SPA (`react-router-dom`), styled per `frontend/docs/DESIGN-SYSTEM.md`:
- `pages/admin/**` + `AdminLayout` — light theme, per-tienda vendor CRUD (productos, categorías, inventario, pedidos, reportes, `MiTiendaPage` for store branding/settings). Each vendor only manages their own tienda's data.
- `pages/marketplace/**` — dark "Klikea" storefront home/search/store pages, cross-tienda discovery (bento layout, `SwipeDeck`, `ProductMarquee`).
- `pages/tienda/**` — single-store catalog/cart/checkout/order-tracking flow, including the Stereum QR checkout step.

Cross-cutting layers: `api/` (axios service modules + JWT/401 interceptor), `context/` (`AuthContext`, `CartContext` — cart can span multiple tiendas and splits into per-tienda orders at checkout, `ToastContext`), `routes/ProtectedRoute` (role-gated routing), `lib/` (jwt decode, currency/date formatting, RFC 7807 error parsing), `types/` (mirrors backend DTOs).

### Infra (`terraform/`)

Provisions production AWS only (RDS Postgres, Elastic Beanstalk for the API jar, S3+CloudFront for the frontend build). Not used for local dev — irrelevant unless the task is explicitly about deployment.
