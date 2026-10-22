import { type Collection, MongoServerError, type ObjectId } from 'mongodb'
import type { BookingDoc } from '../db'
import { slotTaken } from '../http/errors'

const DUPLICATE_KEY_ERROR = 11000

/** Resolves only once the insert is journaled, so a 201 means the booking survives a restart. */
export async function insertBooking(bookings: Collection<BookingDoc>, doc: BookingDoc): Promise<ObjectId> {
  try {
    const result = await bookings.insertOne(doc, { writeConcern: { w: 1, j: true } })
    return result.insertedId
  } catch (error) {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY_ERROR) throw slotTaken()
    throw error
  }
}

/** Slugs of rooms with any booking overlapping the half-open interval [start, end). */
export function bookedRoomSlugs(bookings: Collection<BookingDoc>, start: Date, end: Date): Promise<string[]> {
  return bookings.distinct('roomSlug', { start: { $lt: end }, end: { $gt: start } })
}
