import type { ErrorEnvelope, Room } from '@adlin/shared'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { bodyOf, startTestApp, type TestApp } from '../helpers'

const SLOT = 'start=2026-11-03T09:00:00.000Z&end=2026-11-03T10:00:00.000Z'

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

async function slugsFor(filters: string): Promise<string[]> {
  const response = await app.request.get(`/api/rooms/available?${SLOT}&${filters}`)
  expect(response.status).toBe(200)
  return bodyOf<{ rooms: Room[] }>(response).rooms.map((room) => room.slug)
}

describe('GET /api/rooms/available filters', () => {
  it('filters by minimum capacity', async () => {
    expect(await slugsFor('minCapacity=10')).toEqual(['salle-2', 'salle-de-ouf', 'salle-okjsdkso', 'salle-nulle'])
  })

  it('filters by one equipment item', async () => {
    expect(await slugsFor('equipment=TV')).toEqual(['salle-1', 'salle-de-ouf', 'salle-nulle'])
  })

  it('requires every equipment item together with the capacity', async () => {
    expect(await slugsFor('equipment=TV&equipment=Retro%20Projecteur&minCapacity=20')).toEqual(['salle-nulle'])
  })

  it('returns an empty list when no room is big enough', async () => {
    expect(await slugsFor('minCapacity=30')).toEqual([])
  })

  it('rejects equipment that is not in the catalogue with UNKNOWN_EQUIPMENT', async () => {
    const response = await app.request.get(`/api/rooms/available?${SLOT}&equipment=Piano`)

    expect(response.status).toBe(400)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('UNKNOWN_EQUIPMENT')
  })

  it.each([
    ['minCapacity=0', 'minCapacity'],
    ['minCapacity=abc', 'minCapacity'],
    ['equipment=TV&equipment=TV', 'equipment'],
  ])('rejects %s with VALIDATION_ERROR', async (filters, field) => {
    const response = await app.request.get(`/api/rooms/available?${SLOT}&${filters}`)

    expect(response.status).toBe(400)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('VALIDATION_ERROR')
    expect(bodyOf<ErrorEnvelope>(response).error.fields).toHaveProperty([field])
  })

  it('still excludes a booked room that matches the filters', async () => {
    await app.request
      .post('/api/bookings')
      .send({ roomSlug: 'salle-nulle', start: '2026-11-03T09:00:00.000Z', end: '2026-11-03T10:00:00.000Z', bookerName: 'Alice' })

    expect(await slugsFor('equipment=TV')).toEqual(['salle-1', 'salle-de-ouf'])
  })
})
