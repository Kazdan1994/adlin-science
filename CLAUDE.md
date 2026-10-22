# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

The stack is built (feature `001-room-search-booking`, see `specs/001-room-search-booking/tasks.md`).
npm workspaces: `packages/shared` (zod schemas, Paris time and slot rules), `apps/api` (Express 5 +
MongoDB), `apps/web` (Nuxt 4 SPA, Tailwind), `e2e` (Playwright).

Commands, from the repo root:

- Run everything: `cp .env.example .env`, then `docker compose up --build` (web :3000, api :4000/api).
- Gate before a commit: `npm run typecheck && npm run lint && npm test && npm run build`.
  `npm test` needs no Docker (in-memory MongoDB).
- End to end: `docker compose up -d mongo`, `docker compose stop api web`, then `npm run test:e2e`.
  It starts its own api and web on ports 4000 and 3000 against the `adlin_e2e` database.
- Dependency audit: `npm run audit`. It currently fails on `braces` and `node-forge` (no upstream fix;
  see the README "Known issue" section).

`@adlin/shared` ships TypeScript source, so the API runs through `tsx`, not a compiled `dist/`.

## The brief (from README.md, in French)

Adlin technical test: build one piece of a meeting-room booking system. A small site to search for and
book a meeting room by availability, capacity and equipment. No account management.

Hard requirements:
- Backend: Node.js + Express.
- Frontend: Vue.js / Nuxt.js.
- Fetching rooms and making bookings goes through REST APIs called via AJAX.
- A room booked for a given date/time must not appear in a later search for the same date/time.
- Reviewers weigh ease of use and security most heavily.

Persistence: the brief asks for bookings in a `.json` file. The project owner chose to deviate from
that: **all persistence goes to MongoDB, never to a JSON file** (constitution v2.0.0, Principle I).
Don't reintroduce a JSON store or mirror.

Room data comes from `salles.json` at the repo root (5 rooms; fields `name`, `description`, `capacity`,
`equipements[].name`, `createdAt`, `updatedAt`; no ID field, so `name` is the identifier). It is the
read-only source of rooms.

Bonus: hosted version, MongoDB for bookings, equipment/capacity filters, booking animations, decent design.

## Spec Kit workflow

The project is driven by GitHub Spec Kit (v1.2.3.dev0, `claude` integration, `sh` scripts). Skills live in
`.claude/skills/speckit-*`. The cycle is `/speckit-constitution` → `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`, with review gates between steps
(`.specify/workflows/speckit/workflow.yml`). Optional helpers: `/speckit-clarify`, `/speckit-checklist`,
`/speckit-analyze`, `/speckit-converge`, `/speckit-taskstoissues`.

- Feature specs are written to `specs/NNN-<name>/` (sequential numbering) by
  `.specify/scripts/bash/create-new-feature.sh`.
- `.specify/memory/constitution.md` is filled in (v2.0.0). Plans check against it.
- Templates in `.specify/templates/` are versioned scaffolding. Don't edit them to change one feature's output.
- `.specify/feature.json` is per-checkout state (gitignored).
