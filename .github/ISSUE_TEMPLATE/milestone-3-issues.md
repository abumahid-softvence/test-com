# Milestone 3 — GitHub Issues

Use these to create individual GitHub issues under the **Milestone 3** project board.

---

## Issue 1: Create Category Mongoose Model

**Labels:** `milestone-3`, `model`, `database`

**Description:**
Define the `Category` schema with hierarchical support (self-referencing `parentId`).

**Tasks:**
- [ ] Create `src/modules/catalog/category.model.ts`
- [ ] Fields:
  - `name` (string, required)
  - `slug` (string, unique, required, auto-generated from name)
  - `parentId` (ObjectId, ref: 'Category', optional) — self-reference for sub-categories
  - `timestamps: true`
- [ ] Add index on `parentId` for tree queries
- [ ] Add compound unique index on `parentId + slug` (siblings must have unique slugs)
- [ ] Export `CategoryDocument` interface extending `Document`
- [ ] Export `Category` model

**Acceptance Criteria:**
- [ ] Model compiles without TypeScript errors
- [ ] Unique slug per sibling branch enforced at DB level
- [ ] `createdAt` / `updatedAt` managed automatically

**Effort:** Small

---

## Issue 2: Build CategoryRepository

**Labels:** `milestone-3`, `repository`, `database`

**Description:**
Create the data access layer for categories with tree-building capabilities.

**Tasks:**
- [ ] Create `src/modules/catalog/category.repository.ts`
- [ ] Export class `CategoryRepository` with methods:
  - `findAll(): Promise<CategoryDocument[]>` — flat list
  - `findById(id: string): Promise<CategoryDocument | null>`
  - `findBySlug(slug: string, parentId?: string): Promise<CategoryDocument | null>`
  - `findChildren(parentId: string): Promise<CategoryDocument[]>`
  - `findTree(): Promise<CategoryTreeNode[]>` — returns nested tree (children attached to each parent)
  - `create(data: { name: string; slug: string; parentId?: string }): Promise<CategoryDocument>`
  - `update(id: string, data: Partial<CategoryDocument>): Promise<CategoryDocument | null>`
  - `delete(id: string): Promise<boolean>` — should also delete descendants (cascade)
- [ ] Use Mongoose lean queries where possible

**Acceptance Criteria:**
- [ ] `findTree` returns correctly nested hierarchy
- [ ] `findBySlug` works with optional parent scoping
- [ ] Cascade delete removes sub-categories
- [ ] All methods are async and properly typed

**Effort:** Medium

---

## Issue 3: Build CategoryService

**Labels:** `milestone-3`, `service`, `business-logic`

**Description:**
Implement business logic for category management: slug generation, circular reference prevention, validation.

**Tasks:**
- [ ] Create `src/modules/catalog/category.service.ts`
- [ ] Install `slugify` if not present
- [ ] Export class `CategoryService` with methods:
  - `create(name: string, parentId?: string): Promise<CategoryDocument>`
    - Generate slug from name (lowercase, hyphenated)
    - If slug conflict within parent, append `-2`, `-3`, etc.
  - `findAll(): Promise<CategoryDocument[]>` — flat list
  - `findTree(): Promise<CategoryTreeNode[]>` — nested tree
  - `findBySlug(slug: string, parentId?: string): Promise<CategoryDocument | null>`
  - `update(id: string, data: { name?: string; parentId?: string }): Promise<CategoryDocument | null>`
    - If `name` changes, regenerate slug (preserving uniqueness)
    - If `parentId` changes, **prevent circular references** (cannot move parent into its own descendant)
  - `delete(id: string): Promise<void>`
    - Cascade delete descendants
    - Throw if category has products (future integration)

**Acceptance Criteria:**
- [ ] Slugs are unique within each parent branch
- [ ] Circular reference guard throws meaningful error
- [ ] Tree output is correctly nested for public API
- [ ] Service is unit-testable (repository injected)

**Effort:** Medium

---

## Issue 4: Build CategoryValidator

**Labels:** `milestone-3`, `validation`, `zod`

**Description:**
Zod schemas for category create/update inputs.

**Tasks:**
- [ ] Create `src/modules/catalog/category.validator.ts`
- [ ] Export schemas:
  - `createCategorySchema`: `{ name: string (min 1, max 100), parentId?: string (valid ObjectId) }`
  - `updateCategorySchema`: `{ name?: string, parentId?: string | null }`
- [ ] Use `validate` middleware factory from `src/middleware/validate.ts`

**Acceptance Criteria:**
- [ ] Invalid name (empty, >100 chars) returns 400 with field errors
- [ ] Invalid `parentId` format returns 400
- [ ] Schemas integrate with existing `validate` middleware

**Effort:** Small

---

## Issue 5: Build CategoryController + Routes

**Labels:** `milestone-3`, `controller`, `routes`, `api`

**Description:**
Expose HTTP endpoints for category management.

**Tasks:**
- [ ] Create `src/modules/catalog/category.controller.ts`
  - `GET /api/categories` — public, returns nested tree from `CategoryService.findTree`
  - `GET /api/categories/:slug` — public, returns single category + its children
  - `POST /api/admin/categories` — admin only (authGuard), calls `CategoryService.create`
  - `PUT /api/admin/categories/:id` — admin only, calls `CategoryService.update`
  - `DELETE /api/admin/categories/:id` — admin only, calls `CategoryService.delete`
- [ ] Create `src/modules/catalog/category.routes.ts` — mount with validation middleware
- [ ] Register routes in `src/routes/index.ts` under `/api/categories` (public) and `/api/admin/categories` (admin)

**Acceptance Criteria:**
- [ ] `GET /api/categories` returns nested tree, no auth required
- [ ] `GET /api/categories/:slug` returns category with children
- [ ] Admin endpoints require valid JWT (401 without, 403 if not admin — future)
- [ ] Create/update use validation middleware
- [ ] Responses follow `{ success: true, data: ... }` shape

**Effort:** Medium