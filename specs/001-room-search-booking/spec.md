# Feature Specification: Meeting Room Search and Booking

**Feature Branch**: `001-room-search-booking`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Search rooms by date/time slot, capacity and equipment, book one, and
exclude booked rooms from later searches for the same slot." (Derived from the Adlin brief in
`README.md`; the command was invoked without arguments.)

## Clarifications

### Session 2026-10-20

- Q: Should a user be able to cancel a booking they just made? → A: No. Confirmed bookings are
  final; cancellation and editing are out of scope.
- Q: Should booking times be in the office's time zone or each user's device time zone? → A:
  Office time zone (Europe/Paris) for everyone, labelled on the page.
- Q: What should the page show when it first opens, before the user has searched? → A: Form
  pre-filled with the next 15-minute slot today, lasting 1 hour, with free rooms for it listed.
- Q: Should bookings be limited to office opening hours, or allowed at any time of day? → A: Any
  time of day, every day; no opening-hours restriction.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a free room for a time slot and book it (Priority: P1)

An employee needs a meeting room for a given date and time. They enter the date, a start time and
an end time, see the rooms that are free for that whole slot, pick one, enter their name and
confirm. When they (or anyone else) search the same or an overlapping slot again, the room they
booked is no longer listed.

**Why this priority**: This is the whole brief. Without it there is no product; with only this
story the app already meets every hard requirement.

**Independent Test**: With no prior bookings, search a slot, book one of the listed rooms, then
search the same slot again and confirm the booked room is absent while the others remain.

**Acceptance Scenarios**:

1. **Given** no bookings exist, **When** a user searches 2026-11-03 from 10:00 to 11:00,
   **Then** all five catalogue rooms are listed with their name, capacity and equipment.
2. **Given** the search results for 2026-11-03 10:00–11:00, **When** the user picks "Salle #2",
   enters the name "Alice Martin" and confirms, **Then** a confirmation shows the room, date,
   start time, end time and booker name.
3. **Given** "Salle #2" is booked 2026-11-03 10:00–11:00, **When** any user searches
   2026-11-03 10:00–11:00, **Then** "Salle #2" is not listed and the other four rooms are.
4. **Given** "Salle #2" is booked 2026-11-03 10:00–11:00, **When** a user searches
   2026-11-03 10:30–11:30, **Then** "Salle #2" is not listed (partial overlap).
5. **Given** "Salle #2" is booked 2026-11-03 10:00–11:00, **When** a user searches
   2026-11-03 11:00–12:00, **Then** "Salle #2" is listed (back-to-back slots do not overlap).
6. **Given** a booking was confirmed, **When** the service is restarted, **Then** a search for
   the same slot still excludes the booked room.
7. **Given** it is 2026-11-03 09:07 office time and no bookings exist, **When** a user opens the
   page, **Then** the form shows 2026-11-03 09:15–10:15 and all five rooms are already listed.

---

### User Story 2 - Narrow results by capacity and equipment (Priority: P2)

An employee organising a 10-person presentation only wants rooms that seat at least 10 people and
have a projector. They set a minimum capacity and tick the equipment they need; the list only
shows free rooms that meet every criterion.

**Why this priority**: Explicit bonus in the brief and the main way users avoid scanning
irrelevant rooms. The product still works without it, so it ranks below P1.

**Independent Test**: With no prior bookings, apply capacity and equipment filters and confirm
the list matches the catalogue rooms that satisfy all filters.

**Acceptance Scenarios**:

1. **Given** no bookings exist, **When** a user searches a slot with minimum capacity 10,
   **Then** "Salle #2", "Salle Okjsdkso", "Salle de ouf" and "Salle nulle" are listed and
   "Salle #1" (capacity 5) is not.
2. **Given** no bookings exist, **When** a user searches a slot requiring "TV",
   **Then** "Salle #1", "Salle de ouf" and "Salle nulle" are listed.
3. **Given** no bookings exist, **When** a user requires both "TV" and "Retro Projecteur" and
   minimum capacity 20, **Then** only "Salle nulle" is listed.
4. **Given** filters that no free room satisfies (e.g. minimum capacity 30), **When** the user
   searches, **Then** an empty state explains that no room matches and suggests loosening the
   filters or changing the time.
5. **Given** a room matching the filters is booked for the slot, **When** the user searches with
   those filters, **Then** that room is excluded like in an unfiltered search.

---

### User Story 3 - Recover when a room is taken during booking (Priority: P3)

Two employees look at the same results and try to book the same room for overlapping times. The
first to confirm gets it. The second is told plainly that the room was just taken and sees an
updated list of free rooms for their slot, without retyping their search.

**Why this priority**: Correctness (never double-booking) is guaranteed by P1's requirements;
this story covers the user-facing recovery path, which matters for ease of use but is rarer.

**Independent Test**: Open two sessions on the same results, confirm the same room in both;
verify one confirmation and one clear "just taken" message followed by refreshed results.

**Acceptance Scenarios**:

1. **Given** two users viewing "Salle #1" as free for 2026-11-03 14:00–15:00, **When** both
   confirm a booking at the same moment, **Then** exactly one booking is created and the other
   user sees a message that the room was just booked by someone else.
2. **Given** a user received the "just taken" message, **When** the message is shown, **Then**
   the results list is refreshed for the same search criteria and no longer shows "Salle #1".
3. **Given** a user double-clicks the confirm button, **When** the requests are processed,
   **Then** at most one booking is created and the user sees a single confirmation.

---

### Edge Cases

- End time equal to or earlier than start time: the search and the booking are refused with a
  message asking for an end time after the start time.
- Start time in the past (including earlier today): refused with a message asking for a future
  time.
- Times not on a 15-minute boundary (e.g. 10:07): refused, with the allowed steps stated.
- Slot spanning midnight or longer than one calendar day: refused; bookings stay within one day.
- Date more than 90 days ahead: refused with the booking horizon stated.
- Booker name empty, whitespace-only, or longer than 80 characters: refused with a field-level
  message.
- Booking request naming a room that is not in the catalogue: refused as "room not found".
- Malformed, oversized or unexpected input (extra fields, wrong types): refused with a generic
  validation message; nothing about the system's internals is revealed.
- Text containing markup or script in the booker name: stored and displayed as plain text,
  never interpreted.
- A client sending booking requests faster than the allowed rate: further attempts are refused
  with a "too many attempts, try again shortly" message.
- Booking service unreachable while searching or booking: the user sees a plain-language error
  with a retry action; no booking is shown as confirmed unless it was saved.
- Daylight saving change day: times stay consistent with the office clock (Europe/Paris); a
  10:00–11:00 booking is still one hour.
- User's device set to another time zone: times are still entered and shown in office time, so
  "10:00" means 10:00 in Paris for every user.

## Requirements *(mandatory)*

### Functional Requirements

**Search**

- **FR-001**: System MUST let a user search by date, start time and end time; all three are
  required. On first load the form MUST be pre-filled with the next 15-minute boundary in
  office time and a 1-hour duration, and the free rooms for that slot MUST already be listed.
  If that default slot would cross midnight, the default becomes tomorrow 09:00–10:00.
- **FR-002**: System MUST list as available only catalogue rooms with no confirmed booking
  overlapping the searched slot. Slots are start-inclusive and end-exclusive, so a booking
  ending at 11:00 does not block a slot starting at 11:00.
- **FR-003**: Each listed room MUST show its name, capacity and equipment.
- **FR-004**: Users MUST be able to set an optional minimum capacity; only rooms whose capacity
  is greater than or equal to it are listed.
- **FR-005**: Users MUST be able to select zero or more equipment items from the set present in
  the catalogue; only rooms that have every selected item are listed.
- **FR-006**: System MUST show a distinct loading state while searching and a distinct empty
  state when no room matches, with a suggestion to change time or filters.

**Booking**

- **FR-007**: Users MUST be able to book a listed room for the searched slot by entering a booker
  name (1–80 characters after trimming) and confirming.
- **FR-008**: System MUST refuse a booking whose slot is invalid: end not after start, start in
  the past, times off the 15-minute grid, slot crossing midnight, or date beyond 90 days ahead.
  There is no opening-hours restriction: any slot within 00:00–24:00 on one day is valid.
- **FR-009**: System MUST refuse a booking for a room that does not exist in the catalogue.
- **FR-010**: System MUST NEVER hold two confirmed bookings for the same room with overlapping
  slots, including when requests arrive simultaneously; exactly one such request succeeds.
- **FR-011**: When a booking is refused because the room was taken, System MUST tell the user
  in plain language and refresh the available rooms for the same criteria.
- **FR-012**: On success, System MUST show a confirmation with room, date, start and end time
  and booker name, accompanied by a confirmation animation that is suppressed for users who
  prefer reduced motion.
- **FR-013**: A booking MUST be reported as confirmed only after it has been durably saved, and
  confirmed bookings MUST remain in effect after the service restarts.

**Experience and safety**

- **FR-014**: Searching and booking MUST happen on a single page without a full page reload.
- **FR-015**: Times MUST be entered and displayed in the office time zone (Europe/Paris) for every
  user, whatever their device setting, and the page MUST label it (e.g. "Paris time"). "In the
  past" (FR-008) is judged against the current office time.
- **FR-016**: Every error shown to the user MUST name the problem and the next step in plain
  language; field errors appear next to the field concerned.
- **FR-017**: System MUST validate every search and booking input, reject anything malformed or
  unexpected, and never expose internal details (stack traces, file paths, storage messages)
  in responses.
- **FR-018**: System MUST limit how many booking attempts a single client can make in a short
  window (default: 10 per minute) and tell the client when the limit is hit.
- **FR-019**: All flows MUST be operable by keyboard alone, meet WCAG 2.1 AA contrast and remain
  usable at a 360-pixel-wide viewport.
- **FR-020**: The app MUST NOT require or offer any account, sign-up or login.
- **FR-021**: Confirmed bookings MUST be final: the app MUST NOT offer any way to cancel or edit
  a booking, and the confirmation MUST say so.

### Key Entities *(include if feature involves data)*

- **Room**: A bookable meeting room from the supplied catalogue (`salles.json`). Attributes:
  name (unique, used as its identifier since the catalogue has no other ID), description,
  capacity (number of people), list of equipment. Read-only in this feature.
- **Equipment**: A named facility a room may have. The catalogue currently contains "TV" and
  "Retro Projecteur". The selectable set is whatever the catalogue contains.
- **Booking**: A reservation of one room for one slot. Attributes: room, start date-time, end
  date-time, booker name, creation time. A room has zero or more bookings; bookings of the same
  room never overlap.
- **Search criteria**: Date, start time, end time, optional minimum capacity, optional set of
  required equipment. Not stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user goes from opening the page to a confirmed booking in under
  60 seconds, without leaving the page.
- **SC-002**: In 100% of tested cases, a search for a slot equal to or overlapping a confirmed
  booking omits the booked room, and a back-to-back slot still lists it.
- **SC-003**: When 20 booking attempts for the same room and slot are sent at once, exactly one
  succeeds and the other 19 receive a "room just taken" outcome.
- **SC-004**: Search results and booking confirmations appear within 1 second for the supplied
  catalogue under normal conditions.
- **SC-005**: 100% of invalid inputs in the edge-case list are refused with a message naming the
  problem, and none of the responses reveal internal system details.
- **SC-006**: 100% of confirmed bookings are still in effect after a service restart.
- **SC-007**: Search, filter and booking flows can be completed with keyboard only, and all text
  meets WCAG 2.1 AA contrast.
- **SC-008**: In a hallway test, at least 9 out of 10 participants complete a filtered booking on
  their first attempt without help.

## Assumptions

- The room catalogue is the five rooms in `salles.json`. It is read-only, and rooms are
  identified by their name because the file has no ID field.
- Bookings use a 15-minute time grid, stay within a single calendar day, and can be made up to
  90 days ahead. Any hour of the day is bookable; the brief sets no opening hours.
- The only booker detail collected is a name. No email or contact information is gathered, to
  keep personal data to a minimum.
- Cancelling, editing and listing existing bookings are out of scope (see FR-021): with no
  accounts, there is no safe way to restrict who may change a booking.
- All rooms are in one office in the Europe/Paris time zone.
- Interface copy is in English.
- How and where bookings are stored is decided in the plan, within the project constitution.
- A hosted deployment is out of scope for this feature, per the constitution.
