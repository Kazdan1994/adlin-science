import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startTestApp, type TestApp } from '../helpers'

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

describe('concurrent bookings (FR-010, SC-003)', () => {
  it('lets exactly one of 20 identical parallel requests win', async () => {
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => app.request.post('/api/bookings').send(BOOKING)),
    )

    const statuses = responses.map((response) => response.status)
    expect(statuses.filter((status) => status === 201)).toHaveLength(1)
    expect(statuses.filter((status) => status === 409)).toHaveLength(19)
    expect(await app.database.bookings.countDocuments()).toBe(1)
  })
})
