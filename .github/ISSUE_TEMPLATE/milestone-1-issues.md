# Milestone 1 — GitHub Issues

Use these to create individual GitHub issues under the **Milestone 1** project board.

---

## Issue 1: Initialize Node.js + TypeScript project

**Labels:** `milestone-1`, `scaffold`

**Description:**
Set up the Node.js project with TypeScript so the codebase compiles and can be run during development.

**Tasks:**
- Run `npm init` to create `package.json`
- Install `typescript`, `ts-node-dev`, `@types/node` as dev dependencies
- Create `tsconfig.json` with strict mode, ES2020 target, commonjs module
- Add `build`, `dev`, and `start` scripts to `package.json`
- Add `.gitignore` (node_modules, dist, .env)
- Verify `npx tsc --noEmit` passes on an empty `src/index.ts`

**Acceptance Criteria:**
- [ ] `npm run dev` starts the server and watches for changes
- [ ] `npm run build` produces a `dist/` folder
- [ ] `npm start` runs the compiled output

**Effort:** Small

---

## Issue 2: Set up ESLint + Prettier

**Labels:** `milestone-1`, `scaffold`, `tooling`

**Description:**
Enforce consistent code style across the project.

**Tasks:**
- Install `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`
- Install `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`
- Create `.eslintrc.json` with TypeScript rules
- Create `.prettierrc` (singleQuote, semi, trailingComma, printWidth)
- Add `lint` and `lint:fix` scripts to `package.json`
- Verify lint passes on `src/`

**Acceptance Criteria:**
- [ ] `npm run lint` reports zero errors on initial codebase
- [ ] Editor auto-formats on save
- [ ] Prettier and ESLint do not conflict

**Effort:** Small

---

## Issue 3: Configure environment variable loading

**Labels:** `milestone-1`, `scaffold`, `config`

**Description:**
Load environment variables from `.env` and provide a typed config object that the rest of the app consumes.

**Tasks:**
- Create `src/config/env.ts` that loads `dotenv` and exports a typed object
- Define required vars: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
- Validate required vars at startup and throw if missing
- Create `.env.example` documenting all vars with defaults
- Add `src/config/index.ts` barrel export

**Acceptance Criteria:**
- [ ] Missing required env var crashes with a clear message
- [ ] `env.PORT` is typed as `number`
- [ ] `.env.example` is committed, `.env` is gitignored

**Effort:** Small

---

## Issue 4: Create MongoDB connection utility

**Labels:** `milestone-1`, `database`, `config`

**Description:**
Create a reusable module that connects to MongoDB via Mongoose and handles connection events.

**Tasks:**
- Create `src/config/database.ts`
- Import `MONGODB_URI` from env config
- Export an `async connectDatabase()` function
- Handle connection success, error, and disconnection events with the logger
- Set Mongoose strictQuery and other recommended options

**Acceptance Criteria:**
- [ ] App connects to MongoDB at startup and logs the connection status
- [ ] Disconnection is logged
- [ ] Calling `connectDatabase()` twice does not create duplicate connections

**Effort:** Small

---

## Issue 5: Set up Express app skeleton with middleware pipeline

**Labels:** `milestone-1`, `scaffold`, `api`

**Description:**
Create the Express application with the standard security and parsing middleware stack, ready for route mounting.

**Tasks:**
- Create `src/app.ts` that instantiates Express
- Apply middleware in order: `helmet()`, `cors()`, `express.json({ limit: '10kb' })`, `express.urlencoded({ extended: true })`
- Mount a health-check route `GET /health` that returns `{ status: 'ok', uptime }`
- Export the app instance
- Create `src/server.ts` entry point that calls `connectDatabase()` then `app.listen()`
- Handle `SIGTERM`/`SIGINT` for graceful shutdown

**Acceptance Criteria:**
- [ ] `GET /health` returns 200 with `{ status: 'ok' }`
- [ ] JSON bodies larger than 10kb are rejected with 413
- [ ] CORS headers are present in responses
- [ ] Server shuts down gracefully on Ctrl+C

**Effort:** Medium

---

## Issue 6: Build centralized error handler and custom error classes

**Labels:** `milestone-1`, `error-handling`, `shared`

**Description:**
Create a consistent error-response system so every error returns the same JSON shape.

**Tasks:**
- Create `src/shared/errors/AppError.ts` — base class extending `Error` with `statusCode`, `message`, `isOperational`
- Create `src/shared/errors/NotFoundError.ts` (404)
- Create `src/shared/errors/ValidationError.ts` (400)
- Create `src/shared/errors/UnauthorizedError.ts` (401)
- Create `src/shared/errors/ForbiddenError.ts` (403)
- Create `src/shared/errors/index.ts` barrel export
- Build `src/middleware/errorHandler.ts` middleware that catches all errors and returns:
  ```json
  { "success": false, "error": { "message": "...", "code": "..." } }
  ```
- In development mode, include `stack` in the response
- Register the error handler as the LAST middleware in `app.ts`
- Wrap `server.ts` entry with `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers

**Acceptance Criteria:**
- [ ] `throw new NotFoundError('Product not found')` returns 404 with consistent JSON
- [ ] Unhandled errors return 500 without leaking stack in production
- [ ] `NODE_ENV=development` includes stack traces
- [ ] Unhandled promise rejections are caught and logged

**Effort:** Medium

---

## Issue 7: Build generic Zod validation middleware

**Labels:** `milestone-1`, `validation`, `middleware`

**Description:**
Create a reusable middleware factory that validates request body, query, and params against Zod schemas.

**Tasks:**
- Create `src/middleware/validate.ts`
- Export a function `validate(schema: { body?, query?, params? })` that returns an Express middleware
- On validation failure, throw `ValidationError` with formatted Zod error messages
- The middleware should set `req.body` / `req.query` to the parsed (and transformed) value

**Acceptance Criteria:**
- [ ] Valid request passes through unchanged
- [ ] Invalid body returns 400 with field-level error messages
- [ ] Can validate body, query, and params independently
- [ ] TypeScript types are inferred from the Zod schema

**Effort:** Medium

---

## Issue 8: Create logger utility

**Labels:** `milestone-1`, `logging`, `shared`

**Description:**
Set up structured logging with correlation IDs so requests can be traced through the system.

**Tasks:**
- Install `pino` and `pino-http` (or `winston` with a transport)
- Create `src/config/logger.ts`
- Export a default logger instance
- Create an HTTP request-logging middleware using `pino-http`
- Include request ID (correlation ID) in every log line
- Log level based on `NODE_ENV` (debug in dev, info in production)
- Mount the HTTP logger in `app.ts` before other middleware

**Acceptance Criteria:**
- [ ] Every HTTP request is logged with method, URL, status, duration
- [ ] Logs are JSON-formatted in production, human-readable in dev
- [ ] `logger.info('message')` works anywhere in the app
- [ ] Each request gets a unique correlation ID

**Effort:** Small

---

## Issue 9: Set up pagination helper

**Labels:** `milestone-1`, `shared`, `utils`

**Description:**
Create a reusable pagination utility that produces a consistent response shape for all list endpoints.

**Tasks:**
- Create `src/shared/utils/pagination.ts`
- Export `PaginationParams` type: `{ page: number; limit: number; skip: number }`
- Export `parsePagination(query)` that reads `page` and `limit` from query string with defaults (page=1, limit=20, max limit=100)
- Export `PaginationMeta` type: `{ page: number; limit: number; total: number; totalPages: number }`
- Export `paginatedResponse<T>(data: T[], meta: PaginationMeta)` returning `{ success: true, data, meta }`

**Acceptance Criteria:**
- [ ] `parsePagination({})` returns `{ page: 1, limit: 20, skip: 0 }`
- [ ] `parsePagination({ page: '2', limit: '50' })` returns `{ page: 2, limit: 50, skip: 50 }`
- [ ] Limit over 100 is clamped to 100
- [ ] `paginatedResponse` shape is consistent across all endpoints

**Effort:** Small

---

## Issue 10: Milestone 1 Integration — Health check end-to-end

**Labels:** `milestone-1`, `integration`, `verification`

**Description:**
Verify that all pieces of Milestone 1 work together before moving on.

**Tasks:**
- Ensure all middleware is properly ordered in `app.ts`
- Create `src/routes/index.ts` to centralize route mounting (health check only for now)
- Start the server, hit `GET /health`
- Verify: server boots, connects to MongoDB, logs requests, returns structured errors on bad routes

**Acceptance Criteria:**
- [ ] `GET /health` returns `200 { success: true, data: { status: 'ok', uptime: ... } }`
- [ ] `GET /nonexistent` returns `404 { success: false, error: { message: 'Route not found' } }`
- [ ] Logs show the health-check request with status 200 and duration
- [ ] Server exits gracefully on SIGTERM

**Effort:** Small
