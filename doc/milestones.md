# Development Milestones

## Milestone 1 — Project Scaffold & Shared Foundation

**Goal:** Establish the skeleton that every module depends on.

| Task | Deliverable |
|---|---|
| Initialize Node.js project with TypeScript (`tsconfig.json`, `package.json`) | TypeScript compiles and runs |
| Set up ESLint + Prettier | Consistent code style |
| Configure environment variable loading (`dotenv`) | `process.env` is typed |
| Create MongoDB connection utility (`config/db.ts`) | App connects to DB on startup |
| Set up Express app skeleton with middleware pipeline (`cors`, `helmet`, `json` parser) | `app.ts` ready for route mounting |
| Build centralized error handler and custom error classes (`shared/errors/`) | Errors return consistent JSON responses |
| Build generic Zod validation middleware (`middleware/validate.ts`) | Reusable `validate(schema)` middleware |
| Create logger utility (`config/logger.ts`) | Structured logging with correlation IDs |
| Set up pagination helper (`shared/utils/pagination.ts`) | Consistent `{ data, meta }` response shape |

**Acceptance:** Server starts, responds to a health-check endpoint, logs requests, returns structured errors.

---

## Milestone 2 — Admin Authentication

**Goal:** Secure the admin panel with JWT-based login.

| Task | Deliverable |
|---|---|
| Create `Admin` Mongoose model (email, passwordHash, timestamps) | Schema with unique email index |
| Build `AdminRepository` (findByEmail, create) | Data access layer |
| Build `AdminService` (register, login with bcrypt + JWT) | Password hashing, token generation |
| Build `AdminController` + `AdminRoutes` (`POST /api/admin/register`, `POST /api/admin/login`) | Token returned on successful auth |
| Build `auth.guard.ts` middleware (JWT verification) | Protects all `/api/admin/*` routes |
| Write a seed script to create the first admin | One-command setup |

**Acceptance:** Admin can register and log in. Protected routes reject unauthenticated requests with 401.

---

## Milestone 3 — Catalog Module (Categories)

**Goal:** Build hierarchical category management.

| Task | Deliverable |
|---|---|
| Create `Category` Mongoose model (name, slug, parentId self-ref) | Supports parent → sub-category tree |
| Build `CategoryRepository` (CRUD, findTree, findBySlug) | Data access with tree-building query |
| Build `CategoryService` (slug generation, circular-reference guard on update) | Business logic |
| Build `CategoryValidator` (Zod schemas for create/update) | Input validation |
| Build `CategoryController` + routes (`GET /api/categories`, admin CRUD) | Public tree view + admin management |

**Acceptance:** Categories can be created in a hierarchy. Public API returns a nested tree. Admin CRUD is JWT-protected.

---

## Milestone 4 — Catalog Module (Products)

**Goal:** Build product CRUD with filtering and pagination.

| Task | Deliverable |
|---|---|
| Create `Product` Mongoose model (title, slug, description, price, salePrice, SKU, stock, images, status, categoryId ref) | Full product schema |
| Build `ProductRepository` (CRUD, findByCategory, search, paginated listing with compound indexes) | Optimized queries |
| Build `ProductService` (slug generation, stock validation, status gating) | Business logic |
| Build `ProductValidator` (Zod schemas) | Input validation |
| Build `ProductController` + routes | `GET /api/products` (filter, paginate, sort), `GET /api/products/:id`, admin CRUD |

**Acceptance:** Products can be created under categories. Public listing supports category filter, pagination, and sorting. Out-of-stock products are hidden from public.

---

## Milestone 5 — OTP Module

**Goal:** Phone verification system for guest checkout.

| Task | Deliverable |
|---|---|
| Create `OTP` Mongoose model (phone, code hash, expiresAt, verified, attempts, TTL index) | Auto-expire old OTPs |
| Build `OTPRepository` (save, findByPhone, markVerified, delete) | Data access |
| Build `OTPService` (generate cryptographically random 6-digit code, hash + store, verify, rate-limit per phone) | Core OTP logic |
| Build SMS Gateway abstraction layer + SMS provider adapter (interface + implementation for Steadfast) | Swappable provider |
| Build rate-limiter middleware for OTP endpoints (`middleware/rate-limiter.ts`) | Max 3 requests/60s per phone |

**Acceptance:** OTP is generated, stored hashed, sent via SMS, verified once, and expired after TTL. Same phone cannot request OTP more than 3 times per minute.

---

## Milestone 6 — Order Module (Checkout Flow)

**Goal:** End-to-end guest checkout with OTP verification.

| Task | Deliverable |
|---|---|
| Create `Order` Mongoose model (customer {name, phone, address}, items[], total, status, paymentType, timestamps) | Full order schema |
| Build `OrderRepository` (create, findById, findByStatus, updateStatus, list with pagination) | Data access |
| Build `OrderService.requestOtp(cart)` — validate stock, call OTPService | Step 1 of checkout |
| Build `OrderService.verifyAndPlace(phone, otpCode, customerDetails)` — verify OTP, atomic stock decrement, create order, clear OTP | Step 2 of checkout |
| Build `OrderController` + routes (`POST /api/orders/request-otp`, `POST /api/orders/verify-and-place`) | Guest checkout endpoints |

**Acceptance:** Guest provides phone + items → receives OTP → verifies OTP + provides details → order created with atomic stock decrement. Duplicate OTP verification is rejected. Insufficient stock returns error.

---

## Milestone 7 — Admin Order Management

**Goal:** Admin can view and update order statuses.

| Task | Deliverable |
|---|---|
| Build `GET /api/admin/orders` with status filter + pagination | View all orders |
| Build `PUT /api/admin/orders/:id` to update status (validated state machine transitions) | Status updates |
| Build order status machine enum + transition guard (invalid transitions rejected) | `Pending Verification` → `Ready for Courier` → `Shipped` → `Delivered` / `Cancelled` |

**Acceptance:** Admin lists orders filtered by status, advances orders through the pipeline, invalid transitions return 400.

---

## Milestone 8 — Security Hardening & Production Polish

**Goal:** Production-ready security, error handling, and documentation.

| Task | Deliverable |
|---|---|
| Add per-endpoint rate limiting on all public routes | DDoS protection |
| Add request size limiting (`express.json({ limit })`) | Prevent payload abuse |
| Add security headers (`helmet` config) | OWASP best practices |
| Write a comprehensive README with setup instructions, env vars table, and API overview | Developer onboarding |
| Add API documentation (Postman collection or OpenAPI spec) | Team reference |
| Create Dockerfile + docker-compose.yml (app + mongodb) | One-command local dev |
| End-to-end smoke test script | Validate the full flow |

**Acceptance:** App can be started with `docker-compose up`. All endpoints are rate-limited. README covers setup fully.

---

## Milestone Dependency Graph

```
M1 (Scaffold)
  ├──► M2 (Admin Auth)
  ├──► M3 (Categories)
  │       └──► M4 (Products)
  ├──► M5 (OTP)
  │       └──► M6 (Checkout)
  │                └──► M7 (Order Management)
  └──► M8 (Production Polish)
```

Milestones 2, 3, and 5 can be built in **parallel** after M1. M4 depends on M3. M6 depends on M4 + M5. M7 depends on M6. M8 is the final pass across everything.
