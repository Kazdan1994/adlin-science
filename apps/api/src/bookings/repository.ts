import type { Collection } from 'mongodb'
import type { BookingDoc } from '../db'

/** Slugs of rooms with any booking overlapping the half-open interval [start, end). */
export function bookedRoomSlugs(bookings: Collection<BookingDoc>, start: Date, end: Date): Promise<string[]> {
  return bookings.distinct('roomSlug', { start: { $lt: end }, end: { $gt: start } })
}
