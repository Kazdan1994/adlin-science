---

description: "Task list for Meeting Room Search and Booking"
---

# Tasks: Meeting Room Search and Booking

**Input**: Design documents from `/specs/001-room-search-booking/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/rest-api.yaml](./contracts/rest-api.yaml),
[quickstart.md](./quickstart.md)

**Tests**: Included. Constitution Principle IV requires test-first work on availability, overlap
and validation, contract tests for every endpoint status, and one end-to-end test of the brief's
key scenario. Within each phase, test tasks come first and MUST fail before implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on
its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: User story from spec.md (US1, US2, US3)

## Path Conventions

npm-workspaces monorepo (see plan.md, Project Structure): `packages/shared/`, `apps/api/`,
`apps/web/`, `e2e/`, config at the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace, toolchain and local MongoDB. Needs owner approval of the new top-level
folders (`packages/`, `apps/`, `e2e/`) before T001.

- [X] T001 Create root `package.json`: `"private": true`, `"workspaces": ["packages/*", "apps/*", "e2e"]`, `"engines": { "node": ">=24" }`, scripts `typecheck`, `lint`, `test`, `build` (each running `--workspaces --if-present`, shared built first), `test:e2e` (`npm test -w e2e`), `audit` (`npm audit --audit-level=high`); devDependencies `typescript@~6.0`, `eslint@^10`, `typescript-eslint`, `vitest@^5`
- [X] T002 [P] Create `tsconfig.base.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `target: ES2023`, `module`/`moduleResolution: NodeNext`, `declaration: true`
- [X] T003 [P] Create `eslint.config.ts` (flat config, `typescript-eslint` recommended type-checked rules, ignores `**/dist`, `**/.output`, `**/.nuxt`, `**/playwright-report`)
- [X] T004 [P] Extend `.gitignore` with `node_modules/`, `dist/`, `.output/`, `.nuxt/`, `.env`, `playwright-report/`, `test-results/` (keep the existing `.idea` entry)
- [X] T005 [P] Create `.env.example` with `MONGO_ROOT_USERNAME=adlin`, `MONGO_ROOT_PASSWORD=change-me`, `MONGODB_URI=mongodb://adlin:change-me@127.0.0.1:27017/?authSource=admin`, `MONGODB_DB=adlin`, `PORT=4000`, `WEB_ORIGIN=http://localhost:3000`, `NUXT_PUBLIC_API_BASE=http://localhost:4000/api`, `LOG_LEVEL=info`
- [X] T006 [P] Create `docker-compose.yml` with a single `mongo` service: image `mongo:8`, root credentials from `.env`, named volume `mongo-data`, port `127.0.0.1:27017:27017` (local only), healthcheck `mongosh --quiet --eval "db.adminCommand('ping')"`
- [X] T007 [P] Scaffold `packages/shared/`: `package.json` (name `@adlin/shared`, `"type": "module"`, `exports` → `./dist/index.js` + types, scripts `build: tsc -p tsconfig.json`, `test: vitest run`, `typecheck: tsc --noEmit`; deps `zod@^4`, `date-fns@^4`, `@date-fns/tz`), `tsconfig.json` extending the base (`rootDir: src`, `outDir: dist`), empty `src/index.ts`
- [X] T008 [P] Scaffold `apps/api/`: `package.json` (name `@adlin/api`, `"type": "module"`; deps `express@^5`, `mongodb@^7`, `zod@^4`, `helmet@^8`, `cors`, `express-rate-limit@^8`, `pino@^10`, `pino-http@^11`, `@adlin/shared`; devDeps `tsx`, `supertest@^7`, `@types/express`, `@types/cors`, `@types/supertest`, `mongodb-memory-server@^11`; scripts `dev: tsx watch --env-file=../../.env src/server.ts`, `start: tsx src/server.ts` (no `build`: `@adlin/shared` ships TypeScript source, so the API runs through `tsx`), `test: vitest run`, `typecheck: tsc --noEmit`), `tsconfig.json`, `vitest.config.ts` (`testTimeout: 30000`, `hookTimeout: 60000`) (deferred from slice 1 to keep the PR within budget)
- [X] T009 [P] Scaffold `apps/web/`: `package.json` (name `@adlin/web`; deps `nuxt@^4`, `vue`, `@adlin/shared`; devDeps `@nuxt/eslint`, `tailwindcss@^4`, `@tailwindcss/vite`, `vue-tsc`; scripts `dev: nuxt dev --port 3000`, `build: nuxt build`, `typecheck: nuxt typecheck`, `lint: eslint .`), minimal `nuxt.config.ts` with `ssr: false`, `app/app.vue` placeholder, `app/assets/css/main.css` containing `@import "tailwindcss";` (deferred from slice 1 to keep the PR within budget)
- [X] T010 Run `npm install` at the root, commit `package-lock.json`, and confirm `npm run typecheck && npm run lint && npm test && npm run build` passes on the empty scaffold

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain rules, API skeleton with room catalogue, web shell. Every story needs
these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Shared domain: tests first

- [X] T011 [P] Write failing tests in `packages/shared/tests/office-time.test.ts`: Paris wall time ↔ UTC instant in winter (UTC+1) and summer (UTC+2); `parisDateOf` for instants near midnight; on 2026-10-25 and 2027-03-28 a Paris 10:00–11:00 slot is exactly 60 minutes; `startTimeOptions('2027-03-28')` omits 02:00–02:45; `endTimeOptions` includes `24:00`
- [X] T012 [P] Write failing tests in `packages/shared/tests/slot.test.ts` covering each data-model rule verbatim: (1) "`start` and `end` parse as ISO 8601 instants with `Z`"; (2) "Both on the 15-minute grid (UTC minutes % 15 = 0, seconds = 0, ms = 0)"; (3) "`end > start`"; (4) "`start ≥ now` (server clock)"; (5) "Paris calendar date of `start` equals that of `end − 1 ms` (no midnight crossing; ending at 24:00 allowed)"; (6) "Paris calendar date of `start` ≤ today (Paris) + 90 days". Also: `expandSlotStarts` for `[09:00Z, 10:00Z)` returns 4 instants and excludes `end`; a full Paris day returns 96; `defaultSlot` at Paris 09:07 → 09:15–10:15, at exactly 09:00:00.000 → 09:15–10:15 (first grid instant strictly after now), at 22:50 → 23:00–24:00, at 23:20 → tomorrow 09:00–10:00 (spec FR-001: "If that default slot would cross midnight, the default becomes tomorrow 09:00–10:00")
- [X] T013 [P] Write failing tests in `packages/shared/tests/schemas.test.ts`: `createBookingRequestSchema` rejects unknown keys; `roomSlug` must match `^[a-z0-9-]{1,64}$` and rejects an object (`{ "$ne": "x" }`); `bookerName` is "trimmed, 1–80 chars, no control characters" (`"  Al  "` → `"Al"`, `""`/`"   "`/81 chars/`"A\u0007"` rejected); instants without `Z` rejected; `availableRoomsQuerySchema` (start/end only at this stage) rejects unknown keys such as `foo` and `start[$gt]`

### Shared domain: implementation

- [X] T014 Implement `packages/shared/src/office-time.ts` with `@date-fns/tz` `TZDate`: `OFFICE_TZ = 'Europe/Paris'`, `toUtcInstant(dateYmd, 'HH:mm')` (`'24:00'` = next day 00:00), `parisDateOf(instant)`, `parisTimeOf(instant)`, `parisTodayYmd(now)`, `startTimeOptions(dateYmd)` (00:00–23:45, only times that exist that day), `endTimeOptions(dateYmd, startHHmm)` (after start, up to 24:00) so T011 passes
- [X] T015 Implement `packages/shared/src/slot.ts`: `SLOT_MINUTES = 15`, `HORIZON_DAYS = 90`, `validateSlot(start, end, now)` returning `{ ok: true } | { ok: false, fields: { start?: string, end?: string } }` with plain-language messages (e.g. "End time must be after the start time."), `expandSlotStarts(start, end)`, `defaultSlot(now)` so T012 passes (depends on T014)
- [X] T016 Implement `packages/shared/src/schemas.ts` and re-export from `packages/shared/src/index.ts`: `instantSchema`, `roomSlugSchema`, `bookerNameSchema`, `createBookingRequestSchema` (`.strict()`), `availableRoomsQuerySchema` (`{ start, end }`, `.strict()`), `roomSchema`, `bookingSchema`, `errorCodeSchema` with the enum from `contracts/rest-api.yaml` (`VALIDATION_ERROR`, `UNKNOWN_EQUIPMENT`, `ROOM_NOT_FOUND`, `SLOT_TAKEN`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `RATE_LIMITED`, `NOT_FOUND`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`), `errorEnvelopeSchema`, and inferred types (`Room`, `Booking`, `CreateBookingRequest`, `AvailableRoomsQuery`, `ErrorEnvelope`) so T013 passes

### API skeleton

- [X] T017 [P] Implement `apps/api/src/config.ts` (`loadConfig(env)` throws a readable `ConfigError`; `server.ts` prints it and exits): parse `process.env` with zod (`PORT` default 4000, `MONGODB_URI` required, `MONGODB_DB` default `adlin`, `WEB_ORIGIN` required URL, `ROOMS_FILE` default absolute path to repo-root `salles.json`, `LOG_LEVEL` default `info`); exit with a readable message listing missing/invalid vars
- [X] T018 [P] Implement `apps/api/src/db.ts`: `connect(uri, dbName)` returning `{ client, db, rooms, bookings }` with typed collections (`RoomDoc`, `BookingDoc` per data-model.md) and `ensureIndexes()` creating `rooms` `{ slug: 1 }` unique
- [X] T019 [P] Implement `apps/api/src/http/errors.ts`: `AppError(status, code, message, fields?)` typed with the shared `ErrorCode`, plus helpers `validationError(fields)`, `roomNotFound()`, `slotTaken()`, `unknownEquipment(names)`, `unsupportedMediaType()`
- [X] T020 Implement `apps/api/src/http/validate.ts`: `parseQuery(schema, req.query)` and `parseBody(schema, req.body)` that throw `validationError` with a `fields` map built from zod issues (first path segment → message; unknown keys → "This field is not allowed.") (depends on T016, T019)
- [X] T021 Implement `apps/api/src/http/error-handler.ts`: `AppError` → `{ error: { code, message, fields? } }`; body-parser `entity.parse.failed` → 400 `VALIDATION_ERROR` "The request body is not valid JSON."; `entity.too.large` → 413 `PAYLOAD_TOO_LARGE`; anything else → 500 `INTERNAL_ERROR` "Something went wrong on our side. Please try again." and log the full error with the request id; plus a `notFoundHandler` → 404 `NOT_FOUND` (depends on T019)
- [X] T022 [P] Implement `apps/api/src/http/rate-limit.ts` with `createGlobalLimiter()` (a factory so each app instance has its own counters; `express-rate-limit`, 300 requests per minute per IP, `standardHeaders: 'draft-8'`, `legacyHeaders: false`, handler returning 429 `RATE_LIMITED` envelope "Too many requests. Please wait a minute and try again.")
- [X] T023 Create `apps/api/tests/helpers.ts`: start one `MongoMemoryServer` per test file, build the app via `createApp` with a fixed clock (`now = 2026-11-02T08:00:00.000Z`), seed rooms from repo-root `salles.json`, expose `request` (Supertest), `clearBookings()`, `stop()`

### Room catalogue: tests first

- [X] T024 [P] Write failing test `apps/api/tests/integration/seed.test.ts`: seeding `salles.json` gives exactly 5 rooms with slugs `salle-1`, `salle-2`, `salle-okjsdkso`, `salle-de-ouf`, `salle-nulle`; `equipment` is flattened from `equipements[].name`; running the seed twice still gives 5 rooms; two names that slugify identically make the seed throw
- [X] T025 [P] Write failing contract test `apps/api/tests/contract/rooms.test.ts` against `contracts/rest-api.yaml`: `GET /api/rooms` → 200, rooms sorted by capacity then name, `equipment` = `["Retro Projecteur", "TV"]`, no `_id` in output; `GET /api/health` → 200 `{ "status": "ok" }`; `GET /api/nope` → 404 `NOT_FOUND` envelope; responses carry helmet headers and no `x-powered-by`; CORS preflight from `WEB_ORIGIN` allowed, from `http://evil.test` not allowed

### Room catalogue: implementation

- [X] T026 Implement `apps/api/src/rooms/seed.ts`: `slugify(name)` (lowercase, NFD + strip diacritics, non-alphanumerics → `-`, trim `-`), zod-validate the file shape `{ rooms: [{ name, description, capacity, equipements: [{ name }], createdAt, updatedAt }] }`, map to `RoomDoc` (`equipment`, `sourceCreatedAt`, `sourceUpdatedAt`), throw on duplicate slugs, upsert each by `slug` so T024 passes
- [X] T027 Implement `apps/api/src/rooms/repository.ts`: `listRooms()` sorted `{ capacity: 1, name: 1 }` projected to the public `Room` shape, `findBySlug(slug)`, `distinctEquipment()` sorted
- [X] T028 Implement `apps/api/src/app.ts` `createApp({ db, now, config, logger })` and `apps/api/src/rooms/routes.ts` (`GET /rooms` returning `{ rooms, equipment }` per the contract, `GET /health` pinging the DB → 503 `SERVICE_UNAVAILABLE` on failure). Middleware order: `app.set('query parser', 'simple')`, `pino-http` (request ids, no body logging), `helmet()`, `cors({ origin: WEB_ORIGIN, methods: ['GET', 'POST'] })`, global rate limiter on `/api` (before body parsing, so floods are rejected before any parsing), `express.json({ limit: '10kb' })`, routers under `/api`, `notFoundHandler`, error handler, so T025 passes
- [X] T029 Implement `apps/api/src/server.ts`: load config, connect, `ensureIndexes()`, seed rooms from `ROOMS_FILE`, listen on `PORT`, close the Mongo client on `SIGTERM`/`SIGINT`

### Web shell

- [X] T030 [P] Configure `apps/web/nuxt.config.ts`: `ssr: false`, `css: ['~/assets/css/main.css']`, `vite.plugins: [tailwindcss()]`, `runtimeConfig.public.apiBase` (default `http://localhost:4000/api`), `routeRules['/**'].headers` with `Content-Security-Policy` (`default-src 'self'; connect-src 'self' <apiBase origin>; img-src 'self' data:; frame-ancestors 'none'`, plus only what Nuxt's SPA bootstrap needs, confirmed with zero CSP errors in the console), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` (the CSP header is set per response by `apps/web/server/plugins/csp.ts`, which hashes the shell's inline scripts so no `'unsafe-inline'` is needed; its zero-error browser check is asserted in the T040 e2e); add `apps/web/eslint.config.mjs` via `@nuxt/eslint` with `vue/no-v-html: 'error'`
- [X] T031 [P] Implement `apps/web/app/utils/api.ts`: `$fetch.create({ baseURL: apiBase })`, typed `getRooms()`, `getAvailableRooms(query)`, `createBooking(body)`; parse success bodies with the shared schemas; normalize failures to `{ code, message, fields? }` using `errorEnvelopeSchema`, with `code: 'NETWORK'` when no response arrives
- [X] T032 [P] Implement `apps/web/app/utils/error-messages.ts`: plain-language message plus next step for every contract error code and `NETWORK` (e.g. `SLOT_TAKEN` → "Someone just booked this room for this time. Pick another room below.", `RATE_LIMITED` → "Too many attempts. Wait a minute, then try again.") (FR-016)
- [X] T033 Implement `apps/web/app/app.vue` and placeholder `apps/web/app/pages/index.vue`: skip link, `<header>` with "Book a meeting room" and the label "Times shown in Paris time (CET/CEST)" (FR-015), `<main>` landmark, responsive container usable at 360 px

**Checkpoint**: `npm run typecheck && npm run lint && npm test && npm run build` green; `GET /api/rooms` returns the 5 seeded rooms.

---

## Phase 3: User Story 1 - Find a free room for a time slot and book it (Priority: P1) 🎯 MVP

**Goal**: Search a slot, see free rooms, book one with a name, and the room disappears from any
later search that overlaps the slot. Bookings survive restarts and are never double-booked.

**Independent Test**: With no bookings, search 10:00–11:00, book "Salle #2" as "Alice Martin",
search 10:00–11:00 again: "Salle #2" absent, the other four present; 11:00–12:00 still lists it.

### Tests for User Story 1 ⚠️ write first, confirm they fail

- [X] T034 [P] [US1] Write contract test `apps/api/tests/contract/available.test.ts`: `GET /api/rooms/available?start=2026-11-03T09:00:00.000Z&end=2026-11-03T10:00:00.000Z` → 200 with all 5 rooms; 400 `VALIDATION_ERROR` with a `fields` entry for: end ≤ start, start before the fixed clock, `09:07Z`, Paris-midnight crossing (`2026-11-03T22:00:00.000Z` → `2026-11-03T23:15:00.000Z`), start beyond 90 days, missing `start`, unknown param `foo=1`, `start[$gt]=x`; no 400 body contains a stack trace, file path or driver message
- [X] T035 [P] [US1] Write contract test `apps/api/tests/contract/bookings.test.ts`: `POST /api/bookings` → 201 with `booking` matching the contract (`id` is 24 hex chars, `room: { slug, name }`); 400 for empty, whitespace-only, 81-char and control-character `bookerName`, extra field, `roomSlug` as object, malformed JSON; 404 `ROOM_NOT_FOUND` for `salle-inconnue`; 409 `SLOT_TAKEN` for the identical slot and for a partial overlap (09:30–10:30); 201 for back-to-back (10:00–11:00); 413 for a body over 10 kB; 415 for `text/plain`; after a booking, `GET /api/rooms/available` omits the room for equal and overlapping slots and lists it for the back-to-back slot (SC-002)
- [X] T036 [P] [US1] Write test `apps/api/tests/contract/bookings-rate-limit.test.ts` (fresh app instance): the 11th `POST /api/bookings` from one client within a minute → 429 `RATE_LIMITED` envelope (FR-018)
- [X] T037 [P] [US1] Write test `apps/api/tests/integration/concurrency.test.ts`: 20 parallel identical `POST /api/bookings` → exactly one 201 and nineteen 409 `SLOT_TAKEN`; `bookings` collection holds 1 document (FR-010, SC-003, research R1)
- [X] T038 [P] [US1] Write test `apps/api/tests/integration/restart.test.ts`: create a booking, close the app and Mongo client, reconnect a new client and app to the same memory server, `GET /api/rooms/available` still omits the room (FR-013, SC-006)
- [X] T039 [P] [US1] Scaffold `e2e/`: `package.json` (name `@adlin/e2e`, devDeps `@playwright/test@^1.64`, `mongodb@^7`; script `e2e: playwright test`; the root `test:e2e` runs it, and the root `test` script must not, because it runs every workspace's `test`), `playwright.config.ts` (`baseURL: http://localhost:3000`, `webServer` entries starting the API with `MONGODB_DB=adlin_e2e` and the web dev server, `reuseExistingServer: false`), `global-setup.ts` clearing the `bookings` collection of the `adlin_e2e` database via `MONGODB_URI` (not dropping the database: Playwright starts the API first and it has already seeded the rooms); the web server entry runs the production build (`nuxt build` then `node .output/server/index.mjs`) so the Content-Security-Policy is exercised, and neither server is reused
- [X] T040 [US1] Write `e2e/booking.spec.ts`: page opens with the next 15-minute Paris slot pre-filled and rooms already listed (US1 scenario 7); pick tomorrow 10:00–11:00, book "Salle #2" as "Alice Martin", confirmation shows room, date, times, name and "Bookings are final" note; search the same slot: "Salle #2" absent, the other four present (depends on T039)

### Implementation for User Story 1

- [X] T041 [US1] Add `bookings` indexes to `ensureIndexes()` in `apps/api/src/db.ts`: `{ roomSlug: 1, slotStarts: 1 }` **unique**, named `roomSlug_slotStarts`; `{ start: 1, end: 1 }`
- [X] T042 [US1] Implement `apps/api/src/bookings/repository.ts`: `insertBooking(doc)` with `writeConcern: { w: 1, j: true }`, mapping a duplicate-key error (code 11000) on `roomSlug_slotStarts` to `slotTaken()`; `bookedRoomSlugs(start, end)` = `distinct('roomSlug', { start: { $lt: end }, end: { $gt: start } })`
- [X] T043 [US1] Implement `apps/api/src/rooms/availability.ts` `listAvailable({ start, end }, now)`: `validateSlot` (shared) → `validationError(fields)`; rooms whose `slug` is not in `bookedRoomSlugs`, sorted by capacity then name
- [X] T044 [US1] Implement `apps/api/src/bookings/service.ts` `createBooking(input, now)`: `validateSlot` → 400; `findBySlug` → 404 `roomNotFound()`; `slotStarts = expandSlotStarts(start, end)`; insert `{ roomSlug, start, end, slotStarts, bookerName, createdAt: now }`; return the public `Booking` (`id` as hex, ISO strings, `room: { slug, name }`)
- [X] T045 [US1] Add `GET /rooms/available` to `apps/api/src/rooms/routes.ts` using `parseQuery(availableRoomsQuerySchema, req.query)` and `listAvailable` so T034 passes
- [X] T046 [US1] Add `bookingLimiter` (10 requests per minute per IP, same 429 envelope) to `apps/api/src/http/rate-limit.ts`; implement `apps/api/src/bookings/routes.ts` `POST /bookings` (415 `unsupportedMediaType()` unless `req.is('application/json')`, `parseBody(createBookingRequestSchema)`, `createBooking`, respond 201 `{ booking }`) and mount it in `apps/api/src/app.ts` so T035–T038 pass
- [X] T047 [P] [US1] Implement `apps/web/app/composables/useAvailability.ts`: criteria `{ date, startTime, endTime }` initialized from shared `defaultSlot(new Date())`, converted with `toUtcInstant`; `status: 'idle' | 'loading' | 'success' | 'error'`, `rooms`, `error`; `search()` and `refresh()` (same criteria); runs the first search on mount
- [X] T048 [P] [US1] Implement `apps/web/app/composables/useBooking.ts`: `submit(room, slot, bookerName)` calling `createBooking`; `status`, `booking`, `error` (with `fields` for the name input)
- [X] T049 [P] [US1] Implement `apps/web/app/components/SearchForm.vue`: labelled date input (`min` = Paris today, `max` = today + 90 days), start `<select>` from `startTimeOptions`, end `<select>` from `endTimeOptions`, "Search" button; client-side `validateSlot` with errors shown next to the field (`aria-describedby`); emits `search`
- [X] T050 [P] [US1] Implement `apps/web/app/components/RoomCard.vue`: room name, "Seats N", equipment chips (or "No equipment"), "Book" button with an accessible name including the room name
- [X] T051 [P] [US1] Implement `apps/web/app/components/EmptyState.vue` ("No room is free for this time. Try another time.") and `apps/web/app/components/ErrorBanner.vue` (`role="alert"`, message from `error-messages.ts`, optional "Try again" action)
- [X] T052 [US1] Implement `apps/web/app/components/RoomList.vue`: loading skeleton with `aria-busy="true"`, `EmptyState` when no rooms, `ErrorBanner` with retry on error, list of `RoomCard` (FR-006) (depends on T050, T051)
- [X] T053 [P] [US1] Implement `apps/web/app/components/BookingDialog.vue`: `role="dialog"`, `aria-modal="true"`, labelled title, focus moves in on open, trapped, Esc closes and focus returns to the "Book" button; shows room and slot in Paris time; name input (`required`, `maxlength="80"`, field error from API `fields.bookerName`); "Confirm booking" button
- [X] T054 [P] [US1] Implement `apps/web/app/components/BookingConfirmation.vue`: room, date, start–end in Paris time, booker name, note "Bookings are final and can't be changed or cancelled." (FR-021); entrance animation via `<Transition>` (scale-in plus check-mark stroke), fully disabled under `@media (prefers-reduced-motion: reduce)` (FR-012); "Book another room" button
- [X] T055 [US1] Wire `apps/web/app/pages/index.vue`: `SearchForm` → `useAvailability`, `RoomList`, `BookingDialog` → `useBooking`; on success show `BookingConfirmation` and call `refresh()` so the booked room disappears; everything on one page with no reload (FR-014) (depends on T047–T054)
- [X] T056 [US1] Run the gate and `npm run test:e2e`; T034–T040 all pass

**Checkpoint**: MVP. The brief's hard requirements are met and demonstrable.

---

## Phase 4: User Story 2 - Narrow results by capacity and equipment (Priority: P2)

**Goal**: Optional minimum capacity and required equipment filters; only free rooms meeting every
criterion are listed.

**Independent Test**: With no bookings, minimum capacity 20 plus "TV" and "Retro Projecteur"
lists only "Salle nulle"; minimum capacity 30 shows the filtered empty state.

### Tests for User Story 2 ⚠️ write first, confirm they fail

- [X] T057 [P] [US2] Extend `packages/shared/tests/schemas.test.ts`: `minCapacity` is an integer "1–1000" (`0`, `1001`, `abc`, `2.5` rejected; `"10"` coerced to 10); `equipment` is "0–10 unique items, each 1–50 chars"; a single `equipment` string becomes a one-item array; duplicates and an 11th item rejected
- [X] T058 [P] [US2] Write contract test `apps/api/tests/contract/available-filters.test.ts`: `minCapacity=10` → `salle-2`, `salle-de-ouf`, `salle-okjsdkso`, `salle-nulle`; `equipment=TV` → `salle-1`, `salle-de-ouf`, `salle-nulle`; `equipment=TV&equipment=Retro%20Projecteur&minCapacity=20` → only `salle-nulle`; `minCapacity=30` → `[]`; `equipment=Piano` → 400 `UNKNOWN_EQUIPMENT`; a booked room matching the filters is still excluded

### Implementation for User Story 2

- [X] T059 [US2] Extend `availableRoomsQuerySchema` in `packages/shared/src/schemas.ts` with optional `minCapacity` (coerced integer, 1–1000) and `equipment` (string or string array → array, max 10, unique, each 1–50 chars) so T057 passes
- [X] T060 [US2] Extend `apps/api/src/rooms/availability.ts`: reject any `equipment` not in `distinctEquipment()` with `unknownEquipment(names)` (400 `UNKNOWN_EQUIPMENT`); add `capacity: { $gte: minCapacity }` and `equipment: { $all: equipment }` to the room query only when provided, so T058 passes
- [X] T061 [P] [US2] Implement `apps/web/app/composables/useRooms.ts`: load `GET /api/rooms` once, expose `equipment` options and the catalogue's max capacity
- [X] T062 [US2] Implement `apps/web/app/components/FilterPanel.vue`: "Minimum seats" number input (1–1000, optional) and an equipment checkbox group from `useRooms().equipment`, inside a `<fieldset>` with `<legend>`; "Clear filters" button (depends on T061)
- [X] T063 [US2] Add `minCapacity` and `equipment` to the criteria in `apps/web/app/composables/useAvailability.ts`, render `FilterPanel` in `apps/web/app/pages/index.vue`, and switch `EmptyState.vue` copy to "No room matches these filters. Try fewer filters or another time." when filters are active (FR-006)

**Checkpoint**: US1 and US2 both work; filters never bring back a booked room.

---

## Phase 5: User Story 3 - Recover when a room is taken during booking (Priority: P3)

**Goal**: The losing side of a simultaneous booking gets a clear "just taken" message and a
refreshed list without retyping; double-clicking confirm creates at most one booking.

**Independent Test**: Two browser contexts on the same slot both confirm "Salle #1": one
confirmation, one "just taken" message followed by a list without "Salle #1".

### Tests for User Story 3 ⚠️ write first, confirm they fail

- [X] T064 [US3] Write `e2e/conflict.spec.ts`: context A and B both open tomorrow 14:00–15:00; A books "Salle #1"; B confirms "Salle #1" → alert with the `SLOT_TAKEN` message, dialog closed, list refreshed without "Salle #1", criteria unchanged (FR-011); separately, double-clicking "Confirm booking" yields exactly one confirmation and the button is disabled after the first click

### Implementation for User Story 3

- [X] T065 [US3] In `apps/web/app/composables/useBooking.ts`, ignore `submit` while a request is pending (in-flight guard) and expose `isSubmitting`; in `apps/web/app/components/BookingDialog.vue`, set `aria-disabled` on "Confirm booking" while submitting (not the `disabled` attribute, which would drop keyboard focus from the button)
- [X] T066 [US3] In `apps/web/app/pages/index.vue`, on a `SLOT_TAKEN` result close the dialog, show `ErrorBanner` with the conflict message naming the room, move focus to the banner, and call `useAvailability().refresh()` with the same criteria so T064 passes

**Checkpoint**: All three stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: One-command run, accessibility evidence, docs, final checks.

- [X] T067 [P] Create `apps/api/Dockerfile`: multi-stage on `node:24-alpine`, `npm ci` with workspaces, copy `tsconfig.base.json` (tsx and Vite read it through the shared package) and `salles.json`, set `ROOMS_FILE`, run `node_modules/.bin/tsx apps/api/src/server.ts` as the non-root `node` user
- [X] T068 [P] Create `apps/web/Dockerfile`: multi-stage on `node:24-alpine`, build `@adlin/shared` then `nuxt build` with `NUXT_PUBLIC_API_BASE` as a build arg, run `node .output/server/index.mjs` as the non-root `node` user on port 3000
- [X] T069 Extend `docker-compose.yml` with `api` (build `apps/api/Dockerfile`, env from `.env` with `MONGODB_URI` pointing at `mongo`, `depends_on: mongo: condition: service_healthy`, port `127.0.0.1:4000:4000`, healthcheck on `/api/health`) and `web` (build `apps/web/Dockerfile`, port `127.0.0.1:3000:3000`, depends on `api`); `docker compose up --build` starts everything (depends on T067, T068)
- [ ] T070 [P] Write `e2e/accessibility.spec.ts`: complete search → book with keyboard only (Tab/Enter/Space/Esc); `@axe-core/playwright` scan of the page and the open dialog reports zero `serious`/`critical` violations, including `color-contrast` (SC-007); with `reducedMotion: 'reduce'` the confirmation appears with no running animation; at a 360 px viewport `document.documentElement.scrollWidth <= 360` (FR-019)
- [ ] T071 [P] Check API logging in `apps/api/src/app.ts`: `pino-http` serializers log method, URL, status, duration and request id only, never request bodies (booker names); 500s log the full error server-side
- [ ] T072 Write the root `README.md` run and architecture section (keep the existing brief): one-command start, tests, endpoint list linking `specs/001-room-search-booking/contracts/rest-api.yaml`, double-booking guarantee, security measures, and the MongoDB-only storage decision; run it through the humanizer skill
- [ ] T073 Update the Status section of `CLAUDE.md` with the real commands (`docker compose up --build`, gate, `npm run test:e2e`) now that the stack exists
- [ ] T074 Run `npm run audit`; resolve any high or critical finding (constitution Principle II)
- [ ] T075 Run every scenario in `specs/001-room-search-booking/quickstart.md` against `docker compose up --build`, including restart persistence and the two-window manual check; record results in the PR description
- [ ] T076 Final gate: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: needs owner approval of the folder layout, then no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks all user stories
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on Foundational; its API filter work is independent of US1, but its UI
  task T063 edits `useAvailability.ts` and `index.vue` created in US1 (T047, T055)
- **US3 (Phase 5)**: depends on US1 (it changes the booking flow US1 builds)
- **Polish (Phase 6)**: T067–T069 can start after Foundational; T070–T076 after the stories you
  ship

### Within Each Story

- Tests first, confirmed failing
- Shared schema → repository → service → route
- Composables and leaf components before `index.vue` wiring

### Parallel Opportunities

- Setup: T002–T009 in parallel after T001
- Foundational: T011–T013 together; T017–T019 and T022 together; T024–T025 together; T030–T032
  together (web shell does not depend on the API skeleton)
- US1: T034–T039 together; T047–T051, T053, T054 together once T046 lands
- US2: T057–T058 together; T061 alongside T059–T060
- Polish: T067, T068, T070, T071 together

## Parallel Example: User Story 1

```bash
# All US1 tests at once (different files):
Task: "Contract test GET /api/rooms/available in apps/api/tests/contract/available.test.ts"
Task: "Contract test POST /api/bookings in apps/api/tests/contract/bookings.test.ts"
Task: "Rate-limit test in apps/api/tests/contract/bookings-rate-limit.test.ts"
Task: "Concurrency test in apps/api/tests/integration/concurrency.test.ts"
Task: "Restart test in apps/api/tests/integration/restart.test.ts"

# Leaf UI pieces at once:
Task: "useAvailability in apps/web/app/composables/useAvailability.ts"
Task: "useBooking in apps/web/app/composables/useBooking.ts"
Task: "SearchForm in apps/web/app/components/SearchForm.vue"
Task: "RoomCard in apps/web/app/components/RoomCard.vue"
Task: "BookingDialog in apps/web/app/components/BookingDialog.vue"
Task: "BookingConfirmation in apps/web/app/components/BookingConfirmation.vue"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 US1
3. **Stop and validate**: quickstart scenarios 1, 4, 5 and `e2e/booking.spec.ts`
4. The brief's hard requirements are met at this point

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate → MVP
3. US2 → validate filters (bonus)
4. US3 → validate conflict recovery
5. Polish → one-command Docker run, accessibility evidence, docs

### PR Slices (constitution budget: ~7 files / 120 lines, ceiling 19 files / 400 lines)

Stacked branches, each mergeable alone; lockfiles and generated files do not count.

| Slice | Tasks | Content |
|-------|-------|---------|
| 1 | T001–T016 | Workspace, toolchain, shared domain + tests |
| 2a | T008, T017–T022 | `apps/api` scaffold, config, db, HTTP error/validation/rate-limit infrastructure |
| 2b | T023–T029 | Test helpers, room seeding, `GET /api/rooms`, health, app factory, server |
| 3a | T034, T043, T045, `bookedRoomSlugs` from T042 | `GET /api/rooms/available` with its contract test |
| 3b | T035–T038, T041, T042 (insert), T044, T046 | `POST /api/bookings`: indexes, insert, service, rate limit, contract, concurrency and restart tests |
| 4a | T009, T030–T033 | `apps/web` scaffold, Nuxt config with CSP, API client, error messages, page shell |
| 4b | T047, T049–T052 | Search form, room list and states |
| 5 | T039–T040, T048, T053–T056 | Booking dialog, confirmation, e2e MVP |
| 6 | T057–T063 | US2 filters (API + UI) |
| 7 | T064–T066 | US3 conflict recovery |
| 8 | T067–T076 | Docker, accessibility e2e, README, final validation |

Slices 3 and 4 are the largest; if either crosses the ceiling, split tests from implementation
(3) or the shell from the search UI (4).

## Notes

- [P] = different files, no dependency on an incomplete task
- Re-read a file immediately before editing it
- Commit after each task or logical group; never bypass a red gate
- New dependencies not listed in plan.md (e.g. `@axe-core/playwright` in T070) need owner OK
  before install
