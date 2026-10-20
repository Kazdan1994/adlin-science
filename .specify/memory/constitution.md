<!--
Sync Impact Report
- Version change: (unfilled template) → 1.0.0
- Principles defined (all new):
  - I. Brief Compliance (NON-NEGOTIABLE)
  - II. Security by Default
  - III. Booking Integrity
  - IV. Test-First Core
  - V. Ease of Use
- Added sections: Technical Constraints & Stack; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates: not modified (plan/spec/tasks templates read this file at runtime)
-->

# Adlin Meeting Room Booking Constitution

## Core Principles

### I. Brief Compliance (NON-NEGOTIABLE)

The Adlin brief is the acceptance contract. Every feature MUST keep all of the following true:

- Backend runs on Node.js with Express. Frontend is Vue.js via Nuxt.
- Room listing, search and booking go through REST endpoints called asynchronously (AJAX)
  from the frontend. No server-rendered form posts for these flows.
- Every confirmed booking is persisted to a MongoDB local database.
- Once a room is booked for a time slot, any later search overlapping that slot MUST NOT
  return the room as available.
- No account management: no sign-up, login or user profiles.

Rationale: the reviewers grade against the brief first. A polished app that drops a hard
requirement fails the test.

### II. Security by Default

The brief names security as a primary grading axis, so it is a design input, not a final pass.

- All request input (body, query, params) MUST be validated at the API boundary against an
  explicit schema. Unknown fields are rejected. Types, lengths, ranges and formats are enforced.
- User input MUST NEVER be passed to MongoDB as a query object or operator. Queries are built
  from validated, typed values only (no NoSQL operator injection).
- Error responses MUST NOT leak stack traces, file paths, driver messages or internal IDs
  beyond what the client needs. Full context is logged server-side.
- The API MUST set security headers (helmet or equivalent), restrict CORS to the known
  frontend origin, cap request body size and rate-limit write endpoints.
- Text rendered in the UI MUST go through Vue's escaping. `v-html` on user-supplied data is
  forbidden.
- Secrets and connection strings come from environment variables only. Nothing sensitive is
  committed.
- Dependencies MUST pass `npm audit` (or the package manager equivalent) with no high or
  critical findings before a feature is considered done.

Rationale: an unauthenticated booking API is an open write surface. Validation, injection
safety and abuse limits are the minimum bar.

### III. Booking Integrity

A booking system is only useful if it never double-books.

- A slot is a half-open interval `[start, end)`. Two bookings on the same room conflict when
  `startA < endB && startB < endA`. Back-to-back bookings do not conflict.
- The conflict check and the insert MUST be atomic with respect to concurrent requests. Two
  simultaneous requests for an overlapping slot on the same room result in exactly one success
  and one `409 Conflict`.
- Timestamps are stored and exchanged as ISO 8601 in UTC. The UI converts to and from the
  user's local time and shows the time zone it uses.
- The API MUST reject bookings with `end <= start`, bookings in the past, and requests
  referencing a room that does not exist in `salles.json`.
- A booking is reported as confirmed to the client only after it is durably written to both
  MongoDB and the `.json` mirror.

Rationale: availability correctness is the core feature. Interval semantics and concurrency
rules are fixed here so specs and plans do not reinvent them.

### IV. Test-First Core

- Availability, overlap detection and input validation MUST be developed test-first:
  failing test, then implementation, then refactor.
- Every REST endpoint MUST have contract tests covering the success path and each documented
  error (400 validation, 404 unknown room, 409 conflict).
- At least one end-to-end test MUST cover the brief's key scenario: search, book a room,
  search the same slot again, and confirm the room is gone.
- UI component tests are optional. Visual polish does not require tests.

Rationale: the booking rules carry the risk. Tests there are cheap and catch the bugs a
reviewer will try first.

### V. Ease of Use

The brief names ease of use alongside security.

- A user MUST be able to go from landing to a confirmed booking without leaving the search
  page, in a single flow: pick date/time range, optionally filter by capacity and equipment,
  pick a room, confirm.
- Every error shown to the user MUST say what went wrong and what to do next, in plain
  language. Raw API errors are never displayed.
- Loading, empty ("no room matches") and conflict ("someone just booked this") states MUST
  each have a designed UI.
- The UI MUST be keyboard-operable, meet WCAG 2.1 AA contrast, and work on mobile widths.
- Booking animations MUST respect `prefers-reduced-motion`.

Rationale: reviewers will click through the app. Friction and dead ends cost more than
missing features.

## Technical Constraints & Stack

- **Language**: TypeScript with `strict: true` on both backend and frontend. `any` requires an
  inline justification. Room and Booking request/response types are shared between API and UI
  so the contract cannot drift silently.
- **Backend**: Node.js (current LTS) + Express. REST JSON API under `/api`.
- **Frontend**: Nuxt (Vue 3). Data fetching via the Nuxt/Vue client calling the REST API.
- **Room data**: `salles.json` (supplied by Adlin) is the read-only source of rooms. Its schema
  is taken from the real file. Rooms are not editable through the app.
- **Booking storage**: MongoDB is the primary store and source of truth for availability
  queries and conflict checks.
- **Local run**: a fresh clone MUST start the full stack (API, UI, MongoDB) with one documented
  command (use docker-compose)
- **Scope**: in scope are equipment/capacity filters, a polished design with booking
  animations, and MongoDB storage. A hosted deployment is out of scope unless this
  constitution is amended.

## Development Workflow & Quality Gates

- Features follow the Spec Kit cycle: specify, plan, tasks, implement. Each plan MUST include
  a Constitution Check against Principles I to V and list any justified deviation.
- Before any commit, typecheck, lint, tests and build MUST all pass. A red gate is fixed,
  never bypassed.
- Commits use Conventional Commits (`type(scope): subject`).
- Pull requests stay small: about 7 files and 120 changed lines as a target, 19 files or
  400 lines as a ceiling. Larger work is split into stacked, independently mergeable slices.
- Security-relevant changes (new endpoint, new input, storage changes) get an explicit
  security review against Principle II before merge.

## Governance

This constitution overrides other project conventions where they conflict. `CLAUDE.md`
holds runtime guidance for agents and MUST stay consistent with it.

- **Amendments**: proposed as a change to this file with a Sync Impact Report, reviewed and
  approved by the project owner before merge.
- **Versioning**: semantic versioning. MAJOR for removing or redefining a principle, MINOR
  for adding a principle or section or materially expanding guidance, PATCH for wording and
  clarifications.
- **Compliance**: every plan's Constitution Check and every PR review verifies adherence.
  Any deviation is recorded in the plan's Complexity Tracking with the reason a compliant
  approach was rejected.

**Version**: 1.0.0 | **Ratified**: 2026-10-20 | **Last Amended**: 2026-10-20
