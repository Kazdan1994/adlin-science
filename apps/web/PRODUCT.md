# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, reviewers first:

1. **Adlin reviewers.** Engineers grading a technical test. They read the brief, open the app, click
   through the booking flow and try to break it: double bookings, bad input, overlapping slots. The
   brief says they weigh ease of use and security most heavily.
2. **An Adlin employee booking a meeting room.** The persona the UI serves. They need a room for a
   date and time, sometimes with a minimum headcount or specific equipment, and want it booked in
   one pass without an account.

Design decisions serve the employee's task. Where two options are otherwise equal, pick the one
that makes correctness and safety visible to a reviewer.

## Product Purpose

A single-page tool to find a meeting room that is free for a slot and book it. Rooms can be
narrowed by minimum capacity and required equipment. Once a room is booked, any later search
overlapping that slot no longer lists it, for every user.

Success means a first-time user goes from opening the page to a confirmed booking in under
60 seconds (spec SC-001), and a reviewer cannot produce a double booking or a raw error.

## Positioning

The available list is accurate. Each booking stores its 15-minute slots under a unique index on room
and slot, so of two simultaneous requests for the same room, exactly one succeeds. The UI can state
availability plainly. The rare "just taken" case still needs a clear recovery path, not a hidden one.

## Operating Context

- Delivered as a technical test for Adlin. The brief (French) is in the repo `README.md`; the
  acceptance contract is `.specify/memory/constitution.md` (v2.0.0) and
  `specs/001-room-search-booking/spec.md`.
- Reviewers run it locally with `docker compose up --build` (web on :3000, API on :4000/api).
- One office, so all times are entered and shown in Europe/Paris whatever the device time zone,
  and the page labels it ("Paris time").
- On first load the form is pre-filled with the next 15-minute slot, lasting one hour, and the free
  rooms for it are already listed.

## Capabilities and Constraints

- **Flow:** search (date, start, end) → optional filters (minimum capacity, equipment) → pick a
  room → enter booker name → confirm. All on one page, over REST/AJAX, no full reload.
- **No accounts.** No sign-up, login or profile. Booker identity is a free-text name of 1–80
  characters.
- **Bookings are final.** No cancel or edit, and the confirmation says so.
- **Slot rules:** 15-minute grid, end after start, not in the past, within one calendar day, at most
  90 days ahead. No opening-hours restriction.
- **Designed states required:** loading, empty ("no room matches", with a hint to loosen filters or
  change the time), conflict ("someone just booked this", followed by refreshed results), rate limit
  (10 booking attempts per minute), and service unreachable with a retry.
- **Errors:** always name the problem and the next step in plain language; field errors sit next to
  their field. Raw API errors are never shown.
- **Rooms** come read-only from `salles.json`: 5 rooms, fields `name` (the identifier),
  `description`, `capacity` (5 to 26), `equipements[].name`. The catalogue currently holds two
  equipment values, "TV" and "Retro Projecteur". Room names and descriptions are placeholder-grade
  ("Salle nulle", "Salle Okjsdkso") and are shown as supplied.
- **Stack:** Nuxt 4 SPA with Tailwind 4 (`apps/web`), Express 5 + MongoDB API, shared zod schemas in
  `packages/shared`. Strict CSP without `unsafe-inline`: inline scripts are hashed per response, and
  user text never goes through `v-html`.
- **Language:** UI copy is English (`lang="en"`), even though the brief and room data are French.

## Brand Commitments

- Neutral internal-tool identity. No Adlin logo, brand colours or styling that imitates Adlin.
- Page title: "Book a meeting room".

## Evidence on Hand

- `salles.json` at the repo root is the only content source.
- No testimonials, usage data, screenshots of a real deployment or Adlin assets exist. Do not
  invent any.
- No hosted deployment; it is out of scope per the constitution.

## Product Principles

1. Every state, error and conflict ends in a next action on the same page.
2. What the list shows as free can be booked. When a race loses, say so and refresh, don't apologise
   vaguely.
3. Users see what went wrong and what to do. Never codes, stack traces or internal field names.
4. Paris time is the only clock, and the page says so.
5. Input limits and plain-text rendering are part of the UI's shape (field lengths, inline errors),
   not something added after.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast; all flows keyboard-operable; focus moves to the confirmation or conflict
  message after a booking attempt.
- Usable at a 360 px viewport.
- The booking confirmation animation is suppressed under `prefers-reduced-motion`.
- Covered by Playwright accessibility checks in `e2e/`.
