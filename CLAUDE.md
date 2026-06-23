# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spring Boot 4.0.6 (Java 21) REST API for a multi-store e-commerce platform, with JWT + Google OAuth auth, shopping cart management, order processing, inventory, dashboards/reports, and Stereum QR payment integration. A React + Vite frontend lives under `frontend/`. Developed for UPB (Certificación III).

## Build & Run Commands

Backend (Maven, run from repo root; `mvnw` wrapper is checked in):

```bash
# Build all modules
./mvnw clean install

# Build skipping tests
./mvnw clean install -DskipTests

# Run the API (starts on http://localhost:8081)
./mvnw spring-boot:run -pl ecommerce-api

# Run tests (NOTE: there is currently no test source — `mvn test` is a no-op)
./mvnw test
```

On Windows use `mvnw.cmd` instead of `./mvnw`.

Frontend (`frontend/`, Vite + TypeScript + Tailwind):

```bash
cd frontend
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # tsc --noEmit type-check + vite build
npm run typecheck  # type-check only
```

**Prerequisites**: Java 21; PostgreSQL on port 5432 with database `ecommerce`; Node for the frontend.

**One-time DB setup**: the Quartz tables (`qrtz_*`) are **not** auto-created. Run the script once before first startup, or the app fails to boot:

```bash
psql -U postgres -d ecommerce -f script/quartz.sql
```

## Architecture

Multi-module Maven project with Clean Architecture layering. Dependencies flow inward (`api` → `core` → `data` → `domain`):

```
ecommerce-parent (root POM)
├── ecommerce-domain   → JPA @Entity classes and enums (no Spring deps)
├── ecommerce-data     → Spring Data JPA repositories + DataSeeder / DemoDataSeeder
├── ecommerce-core     → Business logic, DTOs (request/response), external API clients
└── ecommerce-api      → REST controllers, Security config, Quartz jobs, app entry point
```

All code lives under `com.upb.ecommerce.<module>`:

- `api.controller` — REST endpoints (Auth, Carrito, Producto, Pedido, Catalogo, Dashboard, Reporte, Pago, StereumWebhook, etc.)
- `api.config` — Security (`SecurityConfig`, `JwtTokenProvider`, `JwtTokenFilter`, `TokenBlacklist`, `CorsFilter`, `GlobalExceptionHandler`, `GoogleTokenVerifier`, `UsuarioPrincipal`)
- `api.quartz` + `api.job` — Quartz scheduling infrastructure and jobs (see below)
- `api.exception` — custom exceptions (e.g. `InvalidJwtAuthenticationException`)
- `core.service` — business logic layer
- `core.dto.request` / `core.dto.response` — request/response DTOs
- `core.integracion` — external API clients via `RestClient`: Stereum payments, and an external ecommerce backend (`AuthClient`, `ProductoClient`, `TiendaClient`, `SistemaExternoService`)
- `data.repository` — JPA repositories
- `data.seeders` — `DataSeeder` (default store + admin) and `DemoDataSeeder`, run at startup
- `domain.entities` — JPA entities (Usuario, Producto, Carrito/DetalleCarrito, Pedido/DetallePedido, Pago, Categoria, MovimientoInventario, DireccionEnvio, Tienda, etc.)
- `domain.enums` — `RolType`, `UsuarioStatus`, and order/cart status enums

## Security & Auth

- JWT tokens, 8-hour expiration (`security.jwt.token.expire-length=480` minutes); `TokenBlacklist` invalidates tokens on logout
- Login paths: `POST /api/auth` (credentials), `POST /api/auth/google` (Google ID token verified by `GoogleTokenVerifier`), `POST /api/auth/externo` (external backend)
- Public (permitAll) endpoints are whitelisted explicitly in `SecurityConfig`: auth/register, `GET /api/tiendas`, `GET /api/catalogo/**`, the Stereum outbound webhook, and `GET /actuator/health`. Everything else requires a valid JWT.
- All errors follow **RFC 7807** Problem Details (`GlobalExceptionHandler` + `spring.mvc.problem-details.enabled`), so framework errors (404/405) match the app's JSON error format
- CORS enabled via `CorsFilter`; configure allowed origins for non-dev environments

## Scheduling (Quartz)

The old `@Scheduled` approach was replaced by **Quartz with a JDBC job store** (jobs persist in `qrtz_*` tables and survive restarts; can be reprogrammed at runtime via `JobService`). `QuartzJobInitializer` registers jobs on startup.

- `CarritoAbandonadoQuartzJob` — sweeps carts idle longer than `carrito.abandono.horas` (default 1h) and sends async email notifications. Cron `job.carrito-abandonado.cron` (default every 8h: 00:00, 08:00, 16:00).
- `NotificacionJob` — demo notification job, runs every minute (`job.notificacion.cron`).

Quartz cron uses the **7-field Quartz format** (`sec min hour day month day-of-week [year]`, with `?` for the unused day field), **not** the Spring `@Scheduled` format.

## Other Important Behaviors

- **Schema management**: Hibernate `ddl-auto=update` auto-creates/updates app tables on startup (Quartz tables are the exception — see DB setup above). New columns are declared nullable to avoid breaking rows from the `.backup` import.
- **Email**: SMTP (Gmail) via a custom `JavaMailSender` bean + Thymeleaf templates. Credentials come from env vars `MAIL_SMTP_USERNAME` / `MAIL_SMTP_PASSWORD`; if unset, the app still boots but email sending fails. Async thread pool: 5 threads, 50-capacity queue (`async.*`).
- **Payment**: Stereum QR integration; webhook signatures validated via HMAC-SHA256.
- **Caching**: Caffeine is configured (`spring.cache.*`) but **not yet active** — `@EnableCaching` and `@Cacheable` annotations are not wired up yet.
- **Actuator**: endpoints are an explicit whitelist (`health,info,metrics,quartz,scheduledtasks,loggers,caches`). Only `/actuator/health` is public; the rest require JWT. `env`/`heapdump`/`shutdown` are intentionally not exposed (they would leak the JWT secret, DB password, and Gmail credentials).

## Configuration

Main config: `ecommerce-api/src/main/resources/application.properties`

- Server port `8081`; DB `jdbc:postgresql://localhost:5432/ecommerce` (user `postgre`)
- JWT secret (Base64) and expiration (minutes)
- `google.oauth.client-id` (env `GOOGLE_CLIENT_ID`) — must match the frontend OAuth client
- Stereum API base URL + key + timeouts
- External backend (`sistema.externo.url-base`) + timeouts
- Gmail SMTP settings (credentials via env vars) + email template data (`app.tienda-nombre`, `app.url-frontend`)
- Quartz job store + cron schedules
- Caffeine cache spec (config only, not yet used)
