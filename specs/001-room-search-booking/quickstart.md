# Quickstart & Validation: Meeting Room Search and Booking

**Feature**: `001-room-search-booking` | **Date**: 2026-10-20

How to run the stack and prove the feature works. Endpoint shapes are in
[contracts/rest-api.yaml](./contracts/rest-api.yaml); storage rules in [data-model.md](./data-model.md).

## Prerequisites

- Docker with Compose v2
- Node.js ≥ 24 and npm ≥ 10 (for tests and local development only)

## Run the full stack (one command)

```bash
cp .env.example .env          # first time only; set MONGO_ROOT_PASSWORD
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:4000/api |
| MongoDB | `127.0.0.1:27017` (local only) |

Expected: `curl -s localhost:4000/api/health` returns `{"status":"ok"}`, and
`curl -s localhost:4000/api/rooms` lists the 5 rooms from `salles.json`.

## Quality gate (run before every commit)

```bash
npm ci
npm run typecheck && npm run lint && npm test && npm run build
```

`npm test` runs the shared unit tests and the API contract tests against an in-memory MongoDB; no
Docker needed. End-to-end tests run separately (below).

## Validation scenarios

Use dates in the future: below, `D` is tomorrow's date (Paris, `YYYY-MM-DD`) and `D1` the day
after.
API instants are UTC: in winter, Paris 10:00 is `09:00Z`.

### 1. Booked room disappears from the same slot (US1, SC-002)

```bash
curl -s "localhost:4000/api/rooms/available?start=${D}T09:00:00.000Z&end=${D}T10:00:00.000Z"
# → 5 rooms
curl -s -X POST localhost:4000/api/bookings -H 'content-type: application/json' \
  -d "{\"roomSlug\":\"salle-2\",\"start\":\"${D}T09:00:00.000Z\",\"end\":\"${D}T10:00:00.000Z\",\"bookerName\":\"Alice Martin\"}"
# → 201 with booking
curl -s "localhost:4000/api/rooms/available?start=${D}T09:30:00.000Z&end=${D}T10:30:00.000Z"
# → 4 rooms, no salle-2 (partial overlap)
curl -s "localhost:4000/api/rooms/available?start=${D}T10:00:00.000Z&end=${D}T11:00:00.000Z"
# → 5 rooms (back-to-back is free)
```

### 2. Filters (US2)

```bash
curl -s "localhost:4000/api/rooms/available?start=${D1}T09:00:00.000Z&end=${D1}T10:00:00.000Z&minCapacity=20&equipment=TV&equipment=Retro%20Projecteur"
# → only salle-nulle
```

### 3. Concurrent booking (US3, SC-003)

Covered by the API test suite: `npm test -w apps/api -- concurrency` sends 20 parallel identical
bookings and asserts one `201` and nineteen `409 SLOT_TAKEN`.

### 4. Rejections (SC-005)

Each returns `400 VALIDATION_ERROR` with a `fields` entry, and no stack trace or driver message:
end before start, start in the past, `09:07Z`, slot crossing Paris midnight, date beyond 90 days,
empty `bookerName`, 81-character `bookerName`, extra body field, `roomSlug` given as an object.
Unknown room → `404 ROOM_NOT_FOUND`. The 11th booking attempt within a minute → `429 RATE_LIMITED`.

### 5. Persistence across restart (SC-006)

```bash
docker compose restart api
curl -s "localhost:4000/api/rooms/available?start=${D}T09:00:00.000Z&end=${D}T10:00:00.000Z"
# → still no salle-2
```

### 6. End-to-end UI flow (US1, FR-001, FR-014, SC-001, SC-007)

```bash
docker compose up -d --build
npm run test:e2e
```

Playwright checks: page opens with the next 15-minute slot pre-filled and rooms listed; booking a
room shows the confirmation; searching the same slot no longer lists it; the same flow completes
with keyboard only.

### 7. Manual UI checks

- Page label reads "Paris time"; change the OS time zone and confirm times do not shift.
- Open two browser windows on the same slot, book the same room in both: the second shows "just
  taken" and a refreshed list without that room.
- With "reduce motion" enabled in the OS, the confirmation appears without animation.
- At 360 px width, the whole flow is usable without horizontal scrolling.
