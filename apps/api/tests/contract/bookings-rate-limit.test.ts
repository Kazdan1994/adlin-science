import type { ErrorEnvelope } from '@adlin/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bodyOf, startTestApp, type TestApp } from '../helpers'

const BOOKING = {
  roomSlug: 'salle-1',
  start: '2026-11-03T09:00:00.000Z',
  end: '2026-11-03T10:00:00.000Z',
  bookerName: 'Alice Martin',
}

let app: TestApp

beforeAll(async () => {
  app = await startTestApp({ productionRateLimits: true })
})

afterAll(async () => {
  await app.stop()
})

describe('booking rate limit (FR-018)', () => {
  it('answers the 11th booking attempt within a minute with RATE_LIMITED', async () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await app.request.post('/api/bookings').send(BOOKING)
      expect(response.status).not.toBe(429)
    }

    const response = await app.request.post('/api/bookings').send(BOOKING)

    expect(response.status).toBe(429)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('RATE_LIMITED')
  })
})
