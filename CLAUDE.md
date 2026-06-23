# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spring Boot 4.0.6 (Java 21) REST API for e-commerce with JWT auth, shopping cart management, order processing, and Stereum QR payment integration. Developed for UPB.

## Build & Run Commands

```bash
# Build all modules
./mvnw clean install

# Build skipping tests
./mvnw clean install -DskipTests

# Run the API (starts on http://localhost:8081)
./mvnw spring-boot:run -pl ecommerce-api

# Run tests
./mvnw test

# Run tests for a specific module
./mvnw test -pl ecommerce-api
```

**Prerequisites**: Java 21, PostgreSQL with database `ecommerceUPB` on port 5432.

## Architecture

Multi-module Maven project with Clean Architecture layering:

```
ecommerce-parent (root POM)
├── ecommerce-domain   → JPA @Entity classes and enums
├── ecommerce-data     → Spring Data JPA repositories + DataSeeder
├── ecommerce-core     → Business logic, DTOs, external API clients
└── ecommerce-api      → REST controllers, Security config, Scheduler
```

Dependencies flow inward: `api` → `core` → `data` → `domain`.

## Key Packages

All code lives under `com.upb.ecommerce.<module>`:

- `api.controller` — REST endpoints (Auth, Carrito, Producto, Pedido, etc.)
- `api.config` — Security (`SecurityConfig`, `JwtTokenProvider`, `JwtTokenFilter`, `TokenBlacklist`, `CorsFilter`, `GlobalExceptionHandler`)
- `api.scheduler` — Abandoned cart sweep (runs every 8h via cron `0 0 */8 * * *`)
- `core.service` — Business logic layer
- `core.dto` — Request/Response DTOs
- `core.integracion` — External API clients (Stereum payment, external ecommerce backend via `RestClient`)
- `data.repository` — JPA Repositories
- `data.seeders` — `DataSeeder` runs at startup to create default store and admin user
- `domain.entities` — JPA entities (Usuario, Producto, Carrito, Pedido, etc.)
- `domain.enums` — Roles and order/cart status enums

## Security & Auth

- JWT tokens with 8-hour expiration; `TokenBlacklist` handles logout invalidation
- All errors follow **RFC 7807** Problem Details format via `GlobalExceptionHandler`
- CORS filter enabled; configure allowed origins for non-dev environments

## Important Behaviors

- **Abandoned carts**: Carts idle >1 hour are flagged. Sweep runs every 8h and sends Gmail SMTP notifications asynchronously (thread pool: 5 core threads, 50-capacity queue)
- **Schema management**: Hibernate `ddl-auto=update` auto-creates/updates schema on startup
- **Payment**: Stereum QR code integration validated via HMAC-SHA256
- **DataSeeder**: Creates default `Comercio1` store and admin user on first run

## Configuration

Main config at `ecommerce-api/src/main/resources/application.properties`:
- Server port: `8081`
- DB: `jdbc:postgresql://localhost:5432/ecommerceUPB`
- JWT secret (Base64 encoded), expiration in minutes
- Stereum API key
- Gmail SMTP credentials
- Async thread pool and cron schedule settings