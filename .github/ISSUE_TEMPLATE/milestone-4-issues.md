# Milestone 4 — GitHub Issues

Use these to create individual GitHub issues under the **Milestone 4** project board.

---

## Issue 1: Create Product Mongoose Model

**Labels:** `milestone-4`, `model`, `database`

**Description:**
Define the `Product` schema with all required fields and proper indexing.

**Tasks:**
- [ ] Create `src/modules/product/product.model.ts`
- [ ] Fields:
  - `title` (string, required)
  - `slug` (string, unique, required, auto-generated from title)
  - `description` (string, optional)
  - `price` (number, required, min 0)
  - `salePrice` (number, optional, min 0)
  - `sku` (string, required, unique)
  - `stock` (number, required, default 0, min 0)
  - `images` (array of strings, default [])
  - `status` (enum: 'active' | 'draft', default 'draft')
  - `categoryId` (ObjectId, ref: 'Category', required)
  - `timestamps: true`
- [ ] Add compound index on `{ categoryId: 1, status: 1, price: 1 }` for public listing
- [ ] Add compound index on `{ categoryId: 1, slug: 1 }` unique
- [ ] Export `ProductDocument` interface and `Product` model

**Acceptance Criteria:**
- [ ] Model compiles without TypeScript errors
- [ ] Unique constraints on `sku` and `slug` (within category)
- [ ] Compound index supports paginated public listing

**Effort:** Small

---

## Issue 2: Build ProductRepository

**Labels:** `milestone-4`, `repository`, `database`

**Description:**
Create the data access layer for products with optimized queries for public listings.

**Tasks:**
- [ ] Create `src/modules/product/product.repository.ts`
- [ ] Export class `ProductRepository` with methods:
  - `findAll(): Promise<ProductDocument[]>`
  - `findById(id: string): Promise<ProductDocument | null>`
  - `findBySlug(slug: string, categoryId?: string): Promise<ProductDocument | null>`
  - `findBySku(sku: string): Promise<ProductDocument | null>`
  - `findByCategory(categoryId: string, options?: { status?: string; page?: number; limit?: number; sort?: string }): Promise<{ products: ProductDocument[]; total: number }>`
    - Filter by `categoryId` and `status === 'active'` by default
    - Support pagination (page, limit with max 100)
    - Support sorting by `price` (asc/desc), `createdAt` (asc/desc)
  - `create(data: ProductCreateData): Promise<ProductDocument>`
  - `update(id: string, data: Partial<ProductDocument>): Promise<ProductDocument | null>`
  - `delete(id: string): Promise<boolean>`
  - `decrementStock(productId: string, qty: number): Promise<ProductDocument | null>` — atomic `$inc`
  - `incrementStock(productId: string, qty: number): Promise<ProductDocument | null>`

**Acceptance Criteria:**
- [ ] `findByCategory` uses compound index for performance
- [ ] Pagination returns correct `total` count for meta
- [ ] Atomic stock operations prevent race conditions
- [ ] All methods are async and properly typed

**Effort:** Medium

---

## Issue 3: Build ProductService

**Labels:** `milestone-4`, `service`, `business-logic`

**Description:**
Implement business logic for product management: slug generation, stock validation, status gating.

**Tasks:**
- [ ] Create `src/modules/product/product.service.ts`
- [ ] Install `slugify` if not present
- [ ] Export class `ProductService` with methods:
  - `create(data: { title: string; description?: string; price: number; salePrice?: number; sku: string; stock: number; images?: string[]; status?: 'active' | 'draft'; categoryId: string }): Promise<ProductDocument>`
    - Generate slug from title, ensure uniqueness within category (append -2, -3)
    - Validate category exists via CategoryService
  - `findAll(): Promise<ProductDocument[]>` — admin only, no status filter
  - `findByCategory(categoryId: string, options: { page?: number; limit?: number; sort?: string }): Promise<{ products: ProductDocument[]; meta: PaginationMeta }>`
    - Default: `status === 'active'`, page=1, limit=20
    - Out-of-stock products hidden (`stock > 0`)
    - Returns `{ data, meta: { page, limit, total, totalPages } }`
  - `findById(id: string): Promise<ProductDocument | null>`
  - `findBySlug(slug: string, categoryId?: string): Promise<ProductDocument | null>` — public, filters active + in-stock
  - `update(id: string, data: Partial<ProductUpdateData>): Promise<ProductDocument | null>`
    - If title changes, regenerate slug (uniqueness check)
    - If stock changes to 0, hide from public
  - `delete(id: string): Promise<boolean>`
  - `validateStock(productId: string, qty: number): Promise<boolean>` — for checkout flow
  - `reserveStock(productId: string, qty: number): Promise<void>` — atomic decrement, throws if insufficient

**Acceptance Criteria:**
- [ ] Slugs unique within category branch
- [ ] Public queries only return `active` + `stock > 0` products
- [ ] `reserveStock` throws if insufficient stock
- [ ] Service is unit-testable (repository injected)

**Effort:** Medium

---

## Issue 4: Build ProductValidator

**Labels:** `milestone-4`, `validation`, `zod`

**Description:**
Zod schemas for product create/update inputs.

**Tasks:**
- [ ] Create `src/modules/product/product.validator.ts`
- [ ] Export schemas:
  - `createProductSchema`: `{ title, description?, price, salePrice?, sku, stock, images?, status?, categoryId }`
    - `title`: min 1, max 200
    - `price`: positive number
    - `salePrice`: positive number, < price (if provided)
    - `sku`: string, unique (service enforces)
    - `stock`: int, min 0
    - `images`: array of URL strings
    - `status`: enum 'active' | 'draft'
    - `categoryId`: valid ObjectId
  - `updateProductSchema`: all fields optional, same validations
- [ ] Use `validate` middleware factory from `src/middleware/validate.ts`

**Acceptance Criteria:**
- [ ] Invalid body returns 400 with field-level errors
- [ ] `salePrice < price` enforced at schema level
- [ ] `categoryId` validated as ObjectId string

**Effort:** Small

---

## Issue 5: Build ProductController + Routes

**Labels:** `milestone-4`, `controller`, `routes`, `api`

**Description:**
Expose HTTP endpoints for product management.

**Tasks:**
- [ ] Create `src/modules/product/product.controller.ts`
  - `GET /api/products` — public, supports `?category=`, `?page=`, `?limit=`, `?sort=` (price:asc|desc, newest)
  - `GET /api/products/:id` — public, returns single product (active + in-stock only)
  - `POST /api/admin/products` — admin (authGuard), createProductSchema validation
  - `PUT /api/admin/products/:id` — admin, updateProductSchema validation
  - `DELETE /api/admin/products/:id` — admin
- [ ] Create `src/modules/product/product.routes.ts` — mount with validation middleware
- [ ] Register in `src/routes/index.ts` under `/api/products` (public) and `/api/admin/products` (admin)

**Acceptance Criteria:**
- [ ] `GET /api/products?category=<catId>&page=2&limit=10&sort=price:asc` returns paginated active in-stock products
- [ ] `GET /api/products/:id` returns 404 if draft or out of stock
- [ ] Admin endpoints require valid JWT (401 without)
- [ ] Responses follow `{ success: true, data: ..., meta? }` shape

**Effort:** Medium