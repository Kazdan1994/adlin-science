# Implementation Plan: Meeting Room Search and Booking

**Branch**: `001-room-search-booking` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-search-booking/spec.md`

## Summary

A single-page Nuxt app where an employee picks a date and a 15-minute-aligned time range (in
Paris time, pre-filled with the next slot), optionally filters by capacity and equipment, sees
the rooms free for that whole slot, and books one by entering a name. An Express REST API serves
rooms and bookings from MongoDB. The core technical choice is how double-booking is prevented:
each booking stores the 15-minute slots it covers, and a unique compound index on
`{ roomSlug, slotStarts }` makes MongoDB reject any overlapping insert atomically, without
transactions or a replica set ([research R1](./research.md#r1-preventing-double-booking-atomically-in-mongodb)).
Rooms are seeded into MongoDB from `salles.json` at API startup.

## Technical Context

**Language/Version**: TypeScript 6.0 (`strict: true`) on Node.js 24 LTS

**Primary Dependencies**: API: Express 5, `mongodb` driver 7, `zod` 4, `helmet` 8, `cors`,
`express-rate-limit` 8, `pino`/`pino-http`. Web: Nuxt 4 (`ssr: false`), Tailwind CSS 4.
Shared: `zod` 4, `date-fns` 4, `@date-fns/tz`.

**Storage**: MongoDB 8. Collections `rooms` (seeded from `salles.json`) and `bookings`. No JSON
file persistence.

**Testing**: Vitest 5 (unit + API contract), Supertest 7, `mongodb-memory-server` 11, Playwright
1.64 (end-to-end)

**Target Platform**: Linux containers via Docker Compose; evergreen desktop and mobile browsers

**Project Type**: Web application (REST API + SPA + shared package)

**Performance Goals**: Search and booking responses within 1 s end to end (SC-004); the
catalogue is 5 rooms, so this is about avoiding slow paths, not scaling

**Constraints**: No accounts; times in Europe/Paris; 15-minute grid; 90-day horizon; 10 booking
attempts per minute per client; one-command local start

**Scale/Scope**: 5 rooms, one office, one page, 4 endpoints, single API instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | How this plan complies | Status |
|------------------------|------------------------|--------|
| I. Express backend, Nuxt frontend | `apps/api` on Express 5, `apps/web` on Nuxt 4 | Pass |
| I. REST over AJAX | SPA calls `GET /api/rooms`, `GET /api/rooms/available`, `POST /api/bookings` with `$fetch` | Pass |
| I. Bookings persisted to MongoDB | `bookings` collection, journaled writes | Pass |
| I. Booked room hidden from overlapping searches | Availability query excludes rooms with any overlapping booking | Pass |
| I. No accounts | No auth, no user entity | Pass |
| II. Schema validation, unknown fields rejected | Shared `zod` `.strict()` schemas on every input | Pass |
| II. No NoSQL injection | Express 5 `simple` query parser; filters built from parsed typed values only | Pass |
| II. No leaked internals | Single error handler, fixed envelope, stack traces only in logs | Pass |
| II. Headers, CORS, body cap, rate limit | `helmet`, single-origin CORS, 10 kB JSON limit, 10/min on bookings, 300/min overall | Pass |
| II. No `v-html` on user data | Text interpolation only; lint rule `vue/no-v-html` set to error | Pass |
| II. Secrets via env, `npm audit` clean | `.env` gitignored, `.env.example` committed; `npm audit --audit-level=high` in the gate | Pass |
| III. Half-open intervals, back-to-back allowed | Slots `[start, end)`; slot expansion excludes `end` | Pass |
| III. Atomic conflict check, one 201 and one 409 | Unique multikey index, single `insertOne` (R1) | Pass |
| III. UTC storage, Paris display | UTC instants on the wire and in MongoDB; shared Paris-time module (R3) | Pass |
| III. Reject invalid, past, unknown room | Shared slot rules + room lookup before insert | Pass |
| III. Confirmed only after durable write | `writeConcern { w: 1, j: true }`; 201 sent after insert resolves | Pass |
| IV. Test-first core, contract tests, one e2e | Unit tests for slot rules first; contract tests per status code; Playwright e2e | Pass |
| V. Single flow, plain errors, designed states, a11y, reduced motion | One page; error code → message map; loading/empty/conflict components; keyboard + contrast checks | Pass |
| Tech: TypeScript strict, shared types | `packages/shared` exports schemas and inferred types to both apps | Pass |
| Tech: one-command start | `docker compose up --build` | Pass |
| Tech: hosted deployment out of scope | No deployment work | Pass |
| Workflow: PR size budget | Implementation split into 6 stacked slices (below) | Pass |

No violations. Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: still passing. The design added no new project, store
or pattern beyond the table above. One clarification for reviewers: Principle III says rooms must
exist "in `salles.json`"; rooms are now checked against the `rooms` collection, which is seeded
from that file at every startup, so the rule holds.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-search-booking/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R8
├── data-model.md        # Phase 1: collections, indexes, validation rules
├── quickstart.md        # Phase 1: run and validation guide
├── contracts/
│   └── rest-api.yaml    # Phase 1: OpenAPI 3.1 contract
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
package.json                 # npm workspaces root, gate scripts
tsconfig.base.json
eslint.config.mjs
docker-compose.yml
.env.example
salles.json                  # supplied room data (existing)

packages/shared/
├── src/
│   ├── schemas.ts           # zod: search query, booking request, responses, error envelope
│   ├── slot.ts              # grid check, same-day, horizon, slot expansion, default slot
│   ├── office-time.ts       # Europe/Paris conversions (TZDate)
│   └── index.ts
└── tests/                   # slot.test.ts, office-time.test.ts (incl. DST days)

apps/api/
├── src/
│   ├── app.ts               # Express app factory (injectable db + clock), middleware order
│   ├── server.ts            # boot: connect, ensure indexes, seed rooms, listen
│   ├── config.ts            # env parsing (zod)
│   ├── db.ts                # client, collections, indexes
│   ├── rooms/               # seed.ts, repository.ts, routes.ts
│   ├── bookings/            # repository.ts, service.ts, routes.ts
│   └── http/                # errors.ts, error-handler.ts, rate-limit.ts, validate.ts
├── tests/
│   ├── contract/            # rooms.test.ts, available.test.ts, bookings.test.ts
│   └── integration/         # concurrency.test.ts, restart.test.ts, seed.test.ts
└── Dockerfile

apps/web/
├── app/
│   ├── pages/index.vue
│   ├── components/          # SearchForm, RoomList, RoomCard, BookingDialog,
│   │                        # BookingConfirmation, EmptyState, ErrorBanner
│   ├── composables/         # useRooms, useAvailability, useBooking
│   └── utils/               # api client, error-code → message map
├── nuxt.config.ts           # ssr: false, runtimeConfig.public.apiBase, security headers
└── Dockerfile

e2e/
├── playwright.config.ts
└── booking.spec.ts          # book → re-search → gone; keyboard-only variant
```

**Structure Decision**: npm-workspaces monorepo with two apps and one shared package. The shared
package is what keeps API and UI on the same contract (constitution: shared types) and the same
Paris-time rules. Creating these top-level folders (`packages/`, `apps/`, `e2e/`) is part of the
first implementation slice and needs owner approval before it starts.

## Delivery Slices (PR budget: about 7 files / 120 lines, ceiling 19 files / 400 lines)

Each slice compiles, passes the gate and breaks nothing if later slices never land.

1. **Foundation + shared domain**: workspace root, TS/ESLint config, `packages/shared` (schemas,
   slot rules, Paris time) with unit tests written first.
2. **API read side**: config, db, room seeding, `GET /api/health`, `GET /api/rooms`,
   `GET /api/rooms/available`, error handler, helmet/CORS, contract tests.
3. **API write side**: `POST /api/bookings`, unique index, rate limit, concurrency and restart
   tests.
4. **Web search**: Nuxt app, search form with default slot, filters, room list, loading/empty/error
   states.
5. **Web booking**: booking dialog, confirmation with animation, conflict recovery, error
   messages.
6. **Run and verify**: Dockerfiles, `docker-compose.yml`, `.env.example`, Playwright e2e, README
   run instructions.

Slices 1 and 4 add several config files and may approach the file ceiling; lockfiles and generated
files do not count.

## Complexity Tracking

No constitution violations to justify.
