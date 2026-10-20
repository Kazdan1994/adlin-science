# Research: Meeting Room Search and Booking

**Feature**: `001-room-search-booking` | **Date**: 2026-10-20

Versions below are the latest published majors on 2026-10-20 (`npm view`). Exact patch versions are
locked at install time.

## R1. Preventing double-booking atomically in MongoDB

**Decision**: Each booking document stores `slotStarts`, the array of every 15-minute instant it
covers (`[start, end)`), and the `bookings` collection has a **unique compound multikey index**
on `{ roomSlug: 1, slotStarts: 1 }`. A booking is a single `insertOne`. If any of its slots is
already held by another booking of the same room, MongoDB rejects the insert with a duplicate-key
error (`E11000`), which the API maps to `409 SLOT_TAKEN`.

**Rationale**:
- The guarantee comes from the database, not application code, so it holds under any concurrency
  and across API restarts (FR-010, SC-003, Principle III).
- A unique index on an array field enforces uniqueness across separate documents, which is exactly
  "no two bookings of the same room share a 15-minute slot". Because every slot is on the
  15-minute grid (FR-008), two bookings overlap if and only if they share a slot.
- It is a single-document write: no transaction, so no replica set is needed in Docker Compose or
  in tests.
- Worst case is 96 index keys per booking (a full day), negligible at this scale.

**Alternatives considered**:
- *Check-then-insert inside a multi-document transaction*: under snapshot isolation two concurrent
  transactions can both see "no conflict" and both insert (write skew). Needs a replica set too.
- *Per-room lock document bumped inside a transaction*: correct, but needs a replica set, retry
  logic for write conflicts and more code.
- *Application-level mutex*: breaks with more than one API process and on crash.

**Proof obligation**: the first test written (Principle IV) is the concurrency test: 20 parallel
`POST /api/bookings` for the same room and slot give exactly one `201` and nineteen `409`.

## R2. Room catalogue storage

**Decision**: Rooms live in a MongoDB `rooms` collection. On API startup, `salles.json` is read
and each room is upserted by `slug` (idempotent). The API never writes rooms otherwise. `slug` is
derived from `name` (lowercase, accents stripped, non-alphanumerics → `-`): `Salle #1` →
`salle-1`, `Salle de ouf` → `salle-de-ouf`. Startup fails loudly if two names produce the same
slug.

**Rationale**: the owner decided that all persistence lives in MongoDB (constitution v2.0.0);
`salles.json` stays the supplied, read-only source. The file has no ID field, so the spec makes
`name` the identifier; a slug is the URL- and validation-safe form of that name
(`^[a-z0-9-]{1,64}$`), which keeps free text out of query paths.

**Alternatives considered**: reading `salles.json` per request (contradicts the MongoDB-only
decision); using MongoDB `ObjectId`s as public IDs (unstable across re-seeds of a fresh database,
meaningless in URLs).

## R3. Time zone handling

**Decision**: The API exchanges instants as ISO 8601 UTC strings (`2026-11-03T09:00:00.000Z`).
All "office calendar" rules (same-day slot, 90-day horizon, default slot, display) are computed in
`Europe/Paris` using `date-fns` 4 + `@date-fns/tz` (`TZDate`), in a shared module used by both API
and UI.

**Rationale**: Principle III fixes UTC storage and office-time display. Putting the time zone
logic in one shared module means the client's default slot and the server's validation cannot
disagree. Paris offsets are whole hours, so "on the 15-minute grid" can be checked on the UTC
instant (minutes % 15 === 0, seconds and milliseconds 0).

**DST cases to test**: 2026-10-25 (clocks go back, 02:00–03:00 occurs twice) and 2027-03-28
(clocks go forward, 02:00–03:00 does not exist). Booking 10:00–11:00 on both days is one hour.
The time selects do not offer wall-clock times that do not exist on the spring-forward day.

**Alternatives considered**: `Temporal` (not available unflagged on Node 24 LTS); Luxon (fine, but
heavier and a second date model next to native `Date`); device time zone (rejected in
clarification).

## R4. Request validation and injection safety

**Decision**: `zod` 4 schemas in the shared package, `.strict()` on every object (unknown fields
→ 400). Express 5's default `simple` query parser (no nested objects from `a[b]=c`).
`express.json({ limit: '10kb' })`. MongoDB filters are built only from parsed, typed values,
never from raw `req.query`/`req.body`.

**Rationale**: Principle II. The `simple` query parser plus string-typed schemas makes operator
injection (`?roomSlug[$ne]=x`) structurally impossible. The same schemas type the client.

**Booker name rule**: trimmed, 1–80 characters, no control characters (`\p{Cc}`). Stored as given;
rendered with Vue text interpolation only, never `v-html`.

## R5. HTTP hardening and abuse limits

**Decision**:
- `helmet` 8 with defaults; `x-powered-by` off.
- `cors` with a single allowed origin from `WEB_ORIGIN`, methods `GET, POST`, no credentials.
- `express-rate-limit` 8: `POST /api/bookings` 10 requests per minute per IP (FR-018); all `/api`
  routes 300 per minute per IP. Memory store (single API instance).
- The browser calls the API origin directly (no proxy in front), so `trust proxy` stays off and
  the client IP is the real one.
- Errors go through one handler: a fixed JSON envelope with a stable `code` and plain-language
  `message`; stack traces only in server logs.
- Web app: security headers including a CSP (`default-src 'self'; connect-src 'self' <API
  origin>`) set through Nuxt `routeRules`.

**Rationale**: an unauthenticated write API needs abuse limits and a strict origin policy. Calling
the API directly avoids the trap where a reverse proxy makes every user share one rate-limit
bucket.

**Alternatives considered**: proxying `/api` through the Nuxt server (same-origin, but every
request then comes from the web container's IP unless `X-Forwarded-For` is forwarded and trusted
correctly); the `nuxt-security` module (an extra dependency for headers we can set in a few
lines).

## R6. Frontend rendering mode

**Decision**: Nuxt 4 with `ssr: false` (single-page app). Data is fetched in the browser with
`$fetch` against `runtimeConfig.public.apiBase`. Styling with Tailwind CSS 4 (`@tailwindcss/vite`).
Animations with Vue `<Transition>` and CSS, disabled under `prefers-reduced-motion: reduce`.

**Rationale**: the brief requires AJAX calls to REST endpoints; an SPA makes that unambiguous and
removes hydration edge cases. There is one page and no SEO need.

**Time inputs**: native date input plus two `<select>` lists of 15-minute times (00:00–23:45 for
start, 00:15–24:00 for end). Selects are keyboard- and screen-reader-friendly everywhere;
`<input type="time" step="900">` behaves inconsistently across browsers.

## R7. Testing stack

**Decision**:
- **Unit** (`packages/shared`): Vitest 5. Slot rules, slot expansion, default slot, DST.
- **Contract/integration** (`apps/api`): Vitest 5 + Supertest 7 against the real Express app and a
  real `mongod` from `mongodb-memory-server` 11 (standalone is enough, see R1). Covers every
  documented status code, the 20-request concurrency case and persistence across an app restart.
- **End-to-end** (`e2e/`): Playwright 1.64 against the Docker Compose stack: open page, book, search
  the same slot, room gone. A keyboard-only run of the same flow.
- The API takes an injectable clock (`now()`) so past/horizon/default-slot rules are tested
  deterministically.

## R8. Toolchain and repository layout

**Decision**:
- Node.js 24 LTS (Docker `node:24-alpine`; `engines: ">=24"`, also runs on the local Node 26).
- **TypeScript 6.0** (`strict: true`). TypeScript 7 (native compiler) is out but Vue/Nuxt type
  checking (`vue-tsc`) relies on the JS compiler API; revisit once Nuxt documents TS 7 support.
- npm workspaces (no extra package manager): `packages/shared`, `apps/api`, `apps/web`, `e2e`.
- ESLint 10 flat config with `typescript-eslint`; `@nuxt/eslint` for the web app.
- Logging: `pino` 10 + `pino-http` 11, request IDs, request bodies never logged (they contain names).
- MongoDB 8 image with root credentials from `.env` (gitignored, `.env.example` committed); port
  published on `127.0.0.1` only.
- Writes use `writeConcern: { w: 1, j: true }` so "confirmed" means journaled (FR-013).

**Rationale**: smallest toolchain that meets the constitution. One repo, one install, one
`docker compose up --build`.
