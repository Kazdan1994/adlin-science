import { type Booking, type CreateBookingRequest, expandSlotStarts, validateSlot } from '@adlin/shared'
import type { Database } from '../db'
import { roomNotFound, validationError } from '../http/errors'
import { findBySlug } from '../rooms/repository'
import { insertBooking } from './repository'

export async function createBooking(
  { bookings, rooms }: Database,
  input: CreateBookingRequest,
  now: Date,
): Promise<Booking> {
  const slot = validateSlot(input.start, input.end, now)
  if (!slot.ok) throw validationError(slot.fields)

  const room = await findBySlug(rooms, input.roomSlug)
  if (!room) throw roomNotFound()

  const start = new Date(input.start)
  const end = new Date(input.end)
  const id = await insertBooking(bookings, {
    roomSlug: room.slug,
    start,
    end,
    slotStarts: expandSlotStarts(input.start, input.end),
    bookerName: input.bookerName,
    createdAt: now,
  })

  return {
    id: id.toHexString(),
    room: { slug: room.slug, name: room.name },
    start: start.toISOString(),
    end: end.toISOString(),
    bookerName: input.bookerName,
    createdAt: now.toISOString(),
  }
}
