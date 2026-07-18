# Milestone 2 — GitHub Issues

Use these to create individual GitHub issues under the **Milestone 2** project board.

---

## Issue 1: Create Admin Mongoose Model

**Labels:** `milestone-2`, `model`, `database`

**Description:**
Define the `Admin` schema with required fields and a unique email index.

**Tasks:**
- [ ] Create `src/modules/admin/admin.model.ts`
- [ ] Fields: `email` (string, unique, required), `passwordHash` (string, required), `lastLogin` (date, optional), `timestamps: true`
- [ ] Add compound index if needed
- [ ] Export the Mongoose model

**Acceptance Criteria:**
- [ ] Model compiles without TypeScript errors
- [ ] Unique index on `email` is created in MongoDB
- [ ] `createdAt` / `updatedAt` are automatically managed

**Effort:** Small

---

## Issue 2: Build AdminRepository

**Labels:** `milestone-2`, `repository`, `database`

**Description:**
Create the data access layer for the Admin model.

**Tasks:**
- [ ] Create `src/modules/admin/admin.repository.ts`
- [ ] Export class `AdminRepository` with methods:
  - `findByEmail(email: string): Promise<AdminDoc | null>`
  - `create(email: string, passwordHash: string): Promise<AdminDoc>`
  - (optional) `findById(id: string): Promise<AdminDoc | null>`
  - (optional) `updateLastLogin(id: string): Promise<void>`
- [ ] Use dependency inversion — the repository should not import controllers or services

**Acceptance Criteria:**
- [ ] `findByEmail` returns the admin document or null
- [ ] `create` persists a new admin with hashed password
- [ ] All methods are async and properly typed

**Effort:** Small

---

## Issue 3: Build AdminService (register + login)

**Labels:** `milestone-2`, `service`, `auth`

**Description:**
Implement business logic for admin registration and JWT-based login with bcrypt password hashing.

**Tasks:**
- [ ] Create `src/modules/admin/admin.service.ts`
- [ ] Install `bcryptjs` and `@types/bcryptjs` (if not present)
- [ ] Install `jsonwebtoken` and `@types/jsonwebtoken` (if not present)
- [ ] Export class `AdminService` with methods:
  - `register(email: string, password: string): Promise<{ token: string; admin: AdminDoc }>`
  - `login(email: string, password: string): Promise<{ token: string; admin: AdminDoc }>`
  - `verifyToken(token: string): Promise<AdminDoc | null>`
- [ ] Password hashing with `bcryptjs` (cost factor 12)
- [ ] JWT signing with `JWT_SECRET` from env, expiry `7d`
- [ ] Throw `UnauthorizedError` on invalid credentials

**Acceptance Criteria:**
- [ ] `register` hashes password, saves admin, returns JWT
- [ ] `login` verifies password with bcrypt, returns JWT on success
- [ ] `verifyToken` decodes JWT and returns admin (or null if invalid/expired)
- [ ] Unit tests can mock `AdminRepository`

**Effort:** Medium

---

## Issue 4: Build AdminController + AdminRoutes

**Labels:** `milestone-2`, `controller`, `routes`, `api`

**Description:**
Expose HTTP endpoints for admin registration and login.

**Tasks:**
- [ ] Create `src/modules/admin/admin.validator.ts` — Zod schemas for:
  - Register body: `{ email: string, password: string (min 8) }`
  - Login body: `{ email: string, password: string }`
- [ ] Create `src/modules/admin/admin.controller.ts`
  - `POST /api/admin/register` — calls `AdminService.register`
  - `POST /api/admin/login` — calls `AdminService.login`
  - Both return `{ success: true, data: { token, admin: { id, email } } }`
- [ ] Create `src/modules/admin/admin.routes.ts` — mounts the two endpoints
- [ ] Register routes in `src/routes/index.ts` under `/api/admin`

**Acceptance Criteria:**
- [ ] `POST /api/admin/register` creates admin and returns 201 with token
- [ ] `POST /api/admin/login` returns 200 with token on valid credentials
- [ ] Invalid body returns 400 with validation errors (via `validate` middleware)
- [ ] Wrong password returns 401 via `UnauthorizedError`

**Effort:** Medium

---

## Issue 5: Build auth.guard.ts Middleware (JWT Verification)

**Labels:** `milestone-2`, `middleware`, `auth`, `security`

**Description:**
Create a reusable Express middleware that validates the JWT and attaches the admin to `req`.

**Tasks:**
- [ ] Create `src/middleware/auth.guard.ts`
- [ ] Use `AdminService.verifyToken` to decode and validate the JWT
- [ ] Expect `Authorization: Bearer <token>` header
- [ ] On success: attach `req.admin = adminDoc` and call `next()`
- [ ] On failure (missing/invalid/expired): throw `UnauthorizedError` with message "Invalid or expired token"
- [ ] Export as `authGuard` middleware function

**Acceptance Criteria:**
- [ ] Valid JWT → `req.admin` populated, request proceeds
- [ ] Missing/invalid/expired JWT → 401 with `{ success: false, error: { message: "Invalid or expired token", code: 401 } }`
- [ ] Works on any route it's applied to

**Effort:** Small

---

## Issue 6: Seed Script for First Admin

**Labels:** `milestone-2`, `script`, `devops`

**Description:**
Create a one-command script to bootstrap the first admin user.

**Tasks:**
- [ ] Create `scripts/seed-admin.ts`
- [ ] Read `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment (or prompt)
- [ ] Use `AdminService.register` to create the admin (idempotent: if email exists, log and exit 0)
- [ ] Add npm script: `"seed:admin": "ts-node scripts/seed-admin.ts"`
- [ ] Document in README

**Acceptance Criteria:**
- [ ] `npm run seed:admin` creates admin when none exists
- [ ] Running twice does not throw (idempotent)
- [ ] Admin can log in immediately after seeding

**Effort:** Small