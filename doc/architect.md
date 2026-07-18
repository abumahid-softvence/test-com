# System Architecture — Single-Vendor E-Commerce Backend

## 1. Architecture Overview

A **layered, modular monolith** built on Node.js/Express with TypeScript and MongoDB. The architecture is designed to decompose cleanly into microservices along bounded-context boundaries if scale demands it, without over-engineering for the MVP.

```
┌──────────────────────────────────────────────────┐
│                  Client Layer                     │
│  (Customer App / Admin Dashboard / Browser)       │
└──────────────────────┬───────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────▼───────────────────────────┐
│              API Gateway / Middleware              │
│  rate-limiter │ cors │ helmet │ auth-guard        │
└──────┬──────────────┬──────────────┬──────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────────────┐
│ Catalog      │ │ Order       │ │ Admin            │
│ Module       │ │ Module      │ │ Module           │
└──────┬───────┘ └─────┬───────┘ └───┬──────────────┘
       │               │              │
┌──────▼───────────────▼──────────────▼──────────────┐
│               Service Layer                         │
│  (Business logic, validation, orchestration)        │
└──────┬───────────────┬──────────────┬──────────────┘
       │               │              │
┌──────▼───────┐ ┌─────▼──────┐ ┌───▼──────────────┐
│ Repository    │ │ OTP         │ │ SMS Gateway      │
│ Layer         │ │ Service     │ │ Abstraction      │
│ (Mongoose)    │ │             │ │                  │
└──────┬───────┘ └─────────────┘ └──────────────────┘
       │
┌──────▼───────────────────────────────────────────┐
│            Data Layer (MongoDB)                   │
│  Products │ Categories │ Orders │ OTPs │ Admins   │
└──────────────────────────────────────────────────┘
```

---

## 2. Module Breakdown

Each module owns a **bounded context** with its own routes, controllers, services, validators, and models.

### 2.1 Catalog Module

| Layer | Responsibility |
|---|---|
| **Controller** | Handle HTTP request/response, delegate to services |
| **Service** | Product & category CRUD logic, filtering, pagination, slug generation |
| **Validator** | Zod schemas for product/category input |
| **Repository** | Mongoose queries — find with filters, sorting, pagination |

**Entities:**
- `Product` — title, slug, description, price, salePrice, SKU, stock, images[], status, categoryId (ref), timestamps
- `Category` — name, slug, parentId (self-ref for sub-categories), timestamps

**Key API:** `GET /api/products` (filter by category, paginate, sort), `GET /api/categories` (tree), `GET /api/products/:id`

### 2.2 Order Module

| Layer | Responsibility |
|---|---|
| **Controller** | Order creation, status queries |
| **Service** | OTP validation orchestration, stock reservation, order creation, status transitions |
| **Validator** | Zod schemas for cart/checkout payload |
| **Repository** | Order & OTP persistence |

**Entities:**
- `Order` — customer {name, phone, address}, items[] ({productId, qty, unitPrice}), total, status, paymentType ("COD"), timestamps
- `OTP` — phone, code (hashed), expiresAt, verified, attempts, timestamps

**Status Machine:**
```
Pending Verification ─► Ready for Courier ─► Shipped (Steadfast) ─► Delivered
                                    │
                                    └──► Cancelled
```

### 2.3 Admin Module

| Layer | Responsibility |
|---|---|
| **Controller** | Login, protected CRUD endpoints |
| **Service** | Auth (JWT sign/verify, password hashing), product & order management orchestration |
| **Validator** | Zod schemas for login credentials |
| **Repository** | Admin persistence, session management |

**Entity:**
- `Admin` — email (unique), passwordHash, lastLogin, timestamps

### 2.4 OTP Module (Cross-Cutting)

An independent service injected into the Order flow. Kept separate so the SMS provider or OTP strategy can be swapped.

| Component | Responsibility |
|---|---|
| **OTP Generator** | Cryptographically random 6-digit code |
| **OTP Cache/Store** | MongoDB TTL-indexed collection (auto-expire stale OTPs) |
| **SMS Adapter** | Interface + implementation for Steadfast (or any) SMS gateway |

**Flow:**
1. Customer submits phone + cart summary
2. Order Service calls `OTPService.generate(phone)` → OTP stored, SMS sent
3. Customer submits OTP → `OTPService.verify(phone, code)` → if valid, order created

---

## 3. Layered Architecture Pattern (Per Module)

```
routes/
  └── product.routes.ts        # Express Router → binds HTTP verbs to controller
controllers/
  └── product.controller.ts    # Parses req, calls service, sends res
services/
  └── product.service.ts       # Business logic, validation orchestration
repositories/
  └── product.repository.ts    # Data access (Mongoose queries)
validators/
  └── product.validator.ts     # Zod schemas
models/
  └── product.model.ts         # Mongoose schema + model
```

**Dependency Rule:** Controllers → Services → Repositories. Never the reverse.

---

## 4. Scalability & Modularity Considerations

| Concern | Approach |
|---|---|
| **Separation of Concerns** | Each module is a folder with its own routes/controllers/services/repos. No cross-module imports except through interfaces. |
| **Repository Pattern** | All DB queries behind repositories. Swapping MongoDB for another store only requires changing one layer. |
| **Dependency Injection (Lightweight)** | Services receive repositories and utilities via constructor injection (simple classes). Makes unit testing trivial. |
| **Pagination** | Cursor-based or skip/limit pagination on `GET /api/products` with configurable defaults to prevent unbounded queries. |
| **Indexing Strategy** | Compound indexes on `products (categoryId, status, price)`, `orders (status, createdAt)`, TTL index on `otps (expiresAt)`. |
| **Rate Limiting** | Per-IP rate limiter on OTP endpoints (e.g., 3 requests/60s per phone). Admin endpoints throttled separately. |
| **Configuration Management** | Environment variables via `dotenv` for DB URI, JWT secret, SMS gateway URL, rate-limit thresholds. |
| **Logging** | Structured logging (pino/winston) with correlation IDs per request for debugging order flows. |
| **Error Handling** | Centralized error middleware that maps domain errors to HTTP status codes. No stack traces in production. |
| **Graceful Degradation** | If SMS gateway is down, OTP creation fails gracefully with a clear error message. Order creation is not blocked. |

---

## 5. Data Flow — Checkout (Critical Path)

```
POST /api/orders/request-otp  ──► rate-limiter check
         │
         ▼
  OrderService.requestOtp(phone, items[])
         │
         ├──► CatalogModule: validate stock for each item
         ├──► OTPModule: generate + store + send via SMS
         │
         ◄── 200 { message: "OTP sent" }

POST /api/orders/verify-and-place  ──► rate-limiter check
         │
         ▼
  OrderService.verifyAndPlace(phone, otpCode)
         │
         ├──► OTPModule: verify(phone, code)
         ├──► CatalogModule: decrement stock (atomic $inc)
         ├──► OrderRepository: create order
         ├──► OTPRepository: clear OTP
         │
         ◄── 201 { orderId, status: "Pending Verification" }
```

---

## 6. Admin Security Boundaries

```
                    ┌──────────────────────┐
                    │   JWT Auth Middleware  │
                    │  (protects all /api/admin/*) │
                    └──────────────────────┘

Admin can:
  • CRUD products & categories
  • List & update order statuses
  • View sales summary (future)

Admin CANNOT:
  • Place orders (separate concern)
  • View OTP codes (security boundary)
```

---

## 7. Future Extraction Path (Microservices)

When the monolith needs to scale, natural split points exist:

| Module | Microservice | Reason |
|---|---|---|
| Catalog + Search | Product Service | High read volume, can be cached independently |
| Order + OTP | Order Service | Transactional writes, slow-changing state |
| Admin | Admin Service | Different scaling needs (low traffic) |
| SMS | Notification Service | Can serve multiple services |

Each communicates via **message queue** (RabbitMQ/Redis pub-sub) for eventual consistency, with a **REST API gateway** for synchronous reads.

---

## 8. Folder Structure

```
src/
├── config/              # env vars, db connection, logger setup
├── modules/
│   ├── catalog/
│   │   ├── product.routes.ts
│   │   ├── product.controller.ts
│   │   ├── product.service.ts
│   │   ├── product.repository.ts
│   │   ├── product.validator.ts
│   │   ├── product.model.ts
│   │   ├── category.routes.ts
│   │   ├── category.controller.ts
│   │   ├── category.service.ts
│   │   ├── category.repository.ts
│   │   ├── category.validator.ts
│   │   └── category.model.ts
│   ├── order/
│   │   ├── order.routes.ts
│   │   ├── order.controller.ts
│   │   ├── order.service.ts
│   │   ├── order.repository.ts
│   │   ├── order.validator.ts
│   │   ├── order.model.ts
│   │   ├── otp.service.ts
│   │   └── otp.repository.ts
│   └── admin/
│       ├── admin.routes.ts
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       ├── admin.repository.ts
│       ├── admin.validator.ts
│       └── admin.model.ts
├── middleware/
│   ├── auth.guard.ts         # JWT verification for admin routes
│   ├── rate-limiter.ts       # Per-endpoint rate limiting
│   ├── error-handler.ts      # Centralized error handler
│   └── validate.ts           # Generic Zod validation middleware
├── shared/
│   ├── interfaces/           # Shared TypeScript interfaces/types
│   ├── errors/               # Custom error classes
│   └── utils/                # Pagination helper, slugify, etc.
├── app.ts                    # Express app setup (middleware, routes)
└── server.ts                 # Entry point (listen, DB connect)
```
