import { type Booking, bookingSchema, type ErrorEnvelope, type Room } from '@adlin/shared'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { bodyOf, startTestApp, type TestApp } from '../helpers'

const BOOKING = {
  roomSlug: 'salle-2',
  start: '2026-11-03T09:00:00.000Z',
  end: '2026-11-03T10:00:00.000Z',
  bookerName: 'Alice Martin',
}

let app: TestApp

beforeAll(async () => {
  app = await startTestApp()
})

afterAll(async () => {
  await app.stop()
})

beforeEach(async () => {
  await app.clearBookings()
})

const book = (body: object) => app.request.post('/api/bookings').send(body)

async function availableSlugs(start: string, end: string): Promise<string[]> {
  const response = await app.request.get(`/api/rooms/available?start=${start}&end=${end}`)
  return bodyOf<{ rooms: Room[] }>(response).rooms.map((room) => room.slug)
}

describe('POST /api/bookings', () => {
  it('creates a booking and returns it in the contract shape', async () => {
    const response = await book(BOOKING)
    const { booking } = bodyOf<{ booking: Booking }>(response)

    expect(response.status).toBe(201)
    expect(bookingSchema.parse(booking)).toEqual(booking)
    expect(booking.id).toMatch(/^[0-9a-f]{24}$/)
    expect(booking.room).toEqual({ slug: 'salle-2', name: 'Salle #2' })
    expect(booking).toMatchObject({ start: BOOKING.start, end: BOOKING.end, bookerName: 'Alice Martin' })
  })

  it.each([
    ['an empty name', { bookerName: '' }, 'bookerName'],
    ['a whitespace-only name', { bookerName: '   ' }, 'bookerName'],
    ['an 81-character name', { bookerName: 'a'.repeat(81) }, 'bookerName'],
    ['a name with a control character', { bookerName: 'A\u0007' }, 'bookerName'],
    ['an extra field', { extra: true }, 'extra'],
    ['a roomSlug that is an object', { roomSlug: { $ne: 'x' } }, 'roomSlug'],
    ['a start in the past', { start: '2026-11-02T07:45:00.000Z', end: '2026-11-02T08:45:00.000Z' }, 'start'],
  ])('rejects %s with VALIDATION_ERROR', async (_name, override, field) => {
    const response = await book({ ...BOOKING, ...override })

    expect(response.status).toBe(400)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('VALIDATION_ERROR')
    expect(bodyOf<ErrorEnvelope>(response).error.fields).toHaveProperty([field])
  })

  it('rejects malformed JSON with VALIDATION_ERROR', async () => {
    const response = await app.request.post('/api/bookings').set('Content-Type', 'application/json').send('{bad')

    expect(response.status).toBe(400)
    expect(bodyOf<ErrorEnvelope>(response).error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'The request body is not valid JSON.',
    })
  })

  it('returns ROOM_NOT_FOUND for an unknown room', async () => {
    const response = await book({ ...BOOKING, roomSlug: 'salle-inconnue' })

    expect(response.status).toBe(404)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('ROOM_NOT_FOUND')
  })

  it('returns SLOT_TAKEN for the identical slot', async () => {
    await book(BOOKING)
    const response = await book(BOOKING)

    expect(response.status).toBe(409)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('SLOT_TAKEN')
  })

  it('returns SLOT_TAKEN for a partial overlap', async () => {
    await book(BOOKING)
    const response = await book({ ...BOOKING, start: '2026-11-03T09:30:00.000Z', end: '2026-11-03T10:30:00.000Z' })

    expect(response.status).toBe(409)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('SLOT_TAKEN')
  })

  it('accepts a back-to-back booking', async () => {
    await book(BOOKING)
    const response = await book({ ...BOOKING, start: '2026-11-03T10:00:00.000Z', end: '2026-11-03T11:00:00.000Z' })

    expect(response.status).toBe(201)
  })

  it('returns PAYLOAD_TOO_LARGE for a body over 10 kB', async () => {
    const response = await book({ ...BOOKING, bookerName: 'a'.repeat(11_000) })

    expect(response.status).toBe(413)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('PAYLOAD_TOO_LARGE')
  })

  it('returns UNSUPPORTED_MEDIA_TYPE for a non-JSON body', async () => {
    const response = await app.request.post('/api/bookings').set('Content-Type', 'text/plain').send('hello')

    expect(response.status).toBe(415)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })
})

describe('availability after a booking (SC-002)', () => {
  it.each([
    ['an equal slot', '2026-11-03T09:00:00.000Z', '2026-11-03T10:00:00.000Z'],
    ['a slot overlapping the start', '2026-11-03T08:30:00.000Z', '2026-11-03T09:30:00.000Z'],
    ['a slot overlapping the end', '2026-11-03T09:30:00.000Z', '2026-11-03T10:30:00.000Z'],
    ['a slot containing the booking', '2026-11-03T08:00:00.000Z', '2026-11-03T11:00:00.000Z'],
  ])('hides the booked room for %s', async (_name, start, end) => {
    await book(BOOKING)

    expect(await availableSlugs(start, end)).not.toContain('salle-2')
    expect(await availableSlugs(start, end)).toHaveLength(4)
  })

  it('still lists the room for the back-to-back slot', async () => {
    await book(BOOKING)

    expect(await availableSlugs('2026-11-03T10:00:00.000Z', '2026-11-03T11:00:00.000Z')).toContain('salle-2')
  })
})
