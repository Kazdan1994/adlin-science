# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Greenfield. No application code, `package.json`, build, lint or test commands exist yet. The repo only
holds the brief (`README.md`) and Spec Kit scaffolding. Add real commands here once the stack is set up;
don't invent them.

## The brief (from README.md, in French)

Adlin technical test: build one piece of a meeting-room booking system. A small site to search for and
book a meeting room by availability, capacity and equipment. No account management.

Hard requirements:
- Backend: Node.js + Express.
- Frontend: Vue.js / Nuxt.js.
- Fetching rooms and making bookings goes through REST APIs called via AJAX.
- Bookings persist to a `.json` file (format is free).
- A room booked for a given date/time must not appear in a later search for the same date/time.
- Reviewers weigh ease of use and security most heavily.

Room data comes from `salles.json`, supplied as an attachment. It is **not in the repo yet**; get it from
the user rather than guessing its schema.

Bonus: hosted version, MongoDB for bookings, equipment/capacity filters, booking animations, decent design.

## Spec Kit workflow

The project is driven by GitHub Spec Kit (v1.2.3.dev0, `claude` integration, `sh` scripts). Skills live in
`.claude/skills/speckit-*`. The cycle is `/speckit-constitution` → `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`, with review gates between steps
(`.specify/workflows/speckit/workflow.yml`). Optional helpers: `/speckit-clarify`, `/speckit-checklist`,
`/speckit-analyze`, `/speckit-converge`, `/speckit-taskstoissues`.

- Feature specs are written to `specs/NNN-<name>/` (sequential numbering) by
  `.specify/scripts/bash/create-new-feature.sh`.
- `.specify/memory/constitution.md` is still the unfilled template. Run `/speckit-constitution` before
  `/speckit-plan`, since plans check against it.
- Templates in `.specify/templates/` are versioned scaffolding. Don't edit them to change one feature's output.
- `.specify/feature.json` is per-checkout state (gitignored).
