# Data Model: Meeting Room Search and Booking

**Feature**: `001-room-search-booking` | **Date**: 2026-10-20

Two MongoDB collections. Shared TypeScript types and `zod` schemas for the API payloads live in
`packages/shared`; the HTTP shapes are in [contracts/rest-api.yaml](./contracts/rest-api.yaml).

## Room (`rooms` collection)

Seeded from `salles.json` at API startup (upsert by `slug`). Read-only to the API otherwise.

| Field | Type | Rules | Source in `salles.json` |
|-------|------|-------|-------------------------|
| `_id` | ObjectId | internal, never exposed | — |
| `slug` | string | unique; `^[a-z0-9-]{1,64}$`; derived from `name` | derived |
| `name` | string | unique; shown to users | `name` |
| `description` | string | shown as secondary text | `description` |
| `capacity` | int | ≥ 1 | `capacity` |
| `equipment` | string[] | equipment names, may be empty | `equipements[].name` |
| `sourceCreatedAt` | Date | informational | `createdAt` |
| `sourceUpdatedAt` | Date | informational | `updatedAt` |

**Indexes**: `{ slug: 1 }` unique.

**Seed data** (5 rooms): `salle-1` (5, TV + Retro Projecteur), `salle-2` (10, Retro Projecteur),
`salle-okjsdkso` (11, none), `salle-de-ouf` (10, TV + Retro Projecteur), `salle-nulle` (26,
TV + Retro Projecteur).

**Equipment** is not its own collection: the selectable set is the distinct `equipment` values
across rooms (currently `TV`, `Retro Projecteur`).

## Booking (`bookings` collection)

| Field | Type | Rules |
|-------|------|-------|
| `_id` | ObjectId | exposed as `id` (hex string) in API responses |
| `roomSlug` | string | must match an existing `rooms.slug` |
| `start` | Date (UTC) | on the 15-minute grid; not in the past at creation |
| `end` | Date (UTC) | on the grid; `end > start`; same Paris calendar day as `start` (may be exactly 24:00) |
| `slotStarts` | Date[] | every 15-minute instant in `[start, end)`; computed server-side, never sent by client |
| `bookerName` | string | trimmed, 1–80 chars, no control characters |
| `createdAt` | Date (UTC) | server clock |

**Indexes**:
- `{ roomSlug: 1, slotStarts: 1 }` **unique** (multikey). Makes overlapping bookings of the same
  room impossible (research R1).
- `{ start: 1, end: 1 }` for the availability query.

**Lifecycle**: a booking is created once and never updated or deleted (FR-021). There are no
states.

## Search criteria (not stored)

| Field | Type | Rules |
|-------|------|-------|
| `start`, `end` | ISO 8601 UTC string | same slot rules as Booking |
| `minCapacity` | int, optional | 1–1000 |
| `equipment` | string[], optional | 0–10 unique items, each 1–50 chars, each must exist in the catalogue |

## Validation rules (shared, applied to both search and booking)

1. `start` and `end` parse as ISO 8601 instants with `Z`.
2. Both on the 15-minute grid (UTC minutes % 15 = 0, seconds = 0, ms = 0).
3. `end > start`.
4. `start ≥ now` (server clock).
5. Paris calendar date of `start` equals that of `end − 1 ms` (no midnight crossing; ending at
   24:00 allowed).
6. Paris calendar date of `start` ≤ today (Paris) + 90 days.

The API only receives UTC instants, and every UTC instant maps to a real Paris time, so the
spring-forward gap cannot reach the server. The UI is responsible for not offering wall-clock
times that do not exist on the selected day (02:00–02:45 on 2027-03-28).

## Queries

- **Available rooms**: `bookedSlugs = distinct('roomSlug', { start: { $lt: qEnd }, end: { $gt: qStart } })`,
  then `rooms.find({ slug: { $nin: bookedSlugs }, capacity: { $gte: minCapacity }, equipment: { $all: equipment } })`
  sorted by `capacity` ascending then `name`. Filters are omitted when not provided.
- **Create booking**: compute `slotStarts`, `insertOne` with `{ w: 1, j: true }`. `E11000` on the
  `roomSlug_slotStarts` index → `409 SLOT_TAKEN`.
