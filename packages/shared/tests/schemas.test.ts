import { describe, expect, it } from 'vitest'
import {
  availableRoomsQuerySchema,
  bookerNameSchema,
  createBookingRequestSchema,
  errorCodeSchema,
  roomSlugSchema,
} from '../src/schemas'

const validBooking = {
  roomSlug: 'salle-2',
  start: '2026-11-03T09:00:00.000Z',
  end: '2026-11-03T10:00:00.000Z',
  bookerName: 'Alice Martin',
}

describe('createBookingRequestSchema', () => {
  it('accepts a valid request', () => {
    expect(createBookingRequestSchema.safeParse(validBooking).success).toBe(true)
  })

  it('rejects unknown keys', () => {
    expect(createBookingRequestSchema.safeParse({ ...validBooking, admin: true }).success).toBe(false)
  })

  it('rejects instants without Z', () => {
    expect(createBookingRequestSchema.safeParse({ ...validBooking, start: '2026-11-03T09:00:00' }).success).toBe(false)
  })

  it('rejects a roomSlug that is an object', () => {
    expect(createBookingRequestSchema.safeParse({ ...validBooking, roomSlug: { $ne: 'x' } }).success).toBe(false)
  })
})

describe('roomSlugSchema', () => {
  it.each(['salle-1', 'a', 'salle-de-ouf'])('accepts %s', (slug) => {
    expect(roomSlugSchema.safeParse(slug).success).toBe(true)
  })

  it.each(['', 'Salle 1', 'salle_1', 'a'.repeat(65), '../etc'])('rejects %j', (slug) => {
    expect(roomSlugSchema.safeParse(slug).success).toBe(false)
  })
})

describe('bookerNameSchema', () => {
  it('trims', () => {
    expect(bookerNameSchema.parse('  Al  ')).toBe('Al')
  })

  it.each(['', '   ', 'A'.repeat(81), 'A\u0007'])('rejects %j', (name) => {
    expect(bookerNameSchema.safeParse(name).success).toBe(false)
  })

  it('accepts 80 characters', () => {
    expect(bookerNameSchema.safeParse('A'.repeat(80)).success).toBe(true)
  })
})

describe('availableRoomsQuerySchema', () => {
  const query = { start: '2026-11-03T09:00:00.000Z', end: '2026-11-03T10:00:00.000Z' }

  it('accepts start and end', () => {
    expect(availableRoomsQuerySchema.safeParse(query).success).toBe(true)
  })

  it('rejects unknown keys', () => {
    expect(availableRoomsQuerySchema.safeParse({ ...query, foo: '1' }).success).toBe(false)
    expect(availableRoomsQuerySchema.safeParse({ ...query, 'start[$gt]': 'x' }).success).toBe(false)
  })

  it('rejects a missing start', () => {
    expect(availableRoomsQuerySchema.safeParse({ end: query.end }).success).toBe(false)
  })
})

describe('errorCodeSchema', () => {
  it('matches the contract enum', () => {
    expect(errorCodeSchema.options).toEqual([
      'VALIDATION_ERROR',
      'UNKNOWN_EQUIPMENT',
      'ROOM_NOT_FOUND',
      'SLOT_TAKEN',
      'PAYLOAD_TOO_LARGE',
      'UNSUPPORTED_MEDIA_TYPE',
      'RATE_LIMITED',
      'NOT_FOUND',
      'SERVICE_UNAVAILABLE',
      'INTERNAL_ERROR',
    ])
  })
})
