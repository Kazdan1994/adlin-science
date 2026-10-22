import type { ErrorEnvelope, Room } from '@adlin/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bodyOf, startTestApp, type TestApp } from '../helpers'

const END = 'end=2026-11-03T10:00:00.000Z'
const START = 'start=2026-11-03T09:00:00.000Z'
const LEAK_PATTERN = /(\/Users|node_modules|MongoServerError|\bat\s+\S+\s+\()/

let app: TestApp

beforeAll(async () => {
  app = await startTestApp()
})

afterAll(async () => {
  await app.stop()
})

describe('GET /api/rooms/available', () => {
  it('lists every room when nothing is booked', async () => {
    const response = await app.request.get(`/api/rooms/available?${START}&${END}`)

    expect(response.status).toBe(200)
    expect(bodyOf<{ rooms: Room[] }>(response).rooms).toHaveLength(5)
  })

  it.each([
    ['end is not after start', 'start=2026-11-03T10:00:00.000Z&end=2026-11-03T09:00:00.000Z', ['end']],
    ['start is before the server clock', 'start=2026-11-02T07:45:00.000Z&end=2026-11-02T08:45:00.000Z', ['start']],
    ['start is off the 15-minute grid', 'start=2026-11-03T09:07:00.000Z&end=2026-11-03T10:00:00.000Z', ['start']],
    ['slot crosses Paris midnight', 'start=2026-11-03T22:00:00.000Z&end=2026-11-03T23:15:00.000Z', ['end']],
    ['start is beyond 90 days', 'start=2027-02-01T09:00:00.000Z&end=2027-02-01T10:00:00.000Z', ['start']],
    ['start is missing', END, ['start']],
    ['an unknown parameter is sent', `${START}&${END}&foo=1`, ['foo']],
    ['an operator-style key is sent', `start%5B%24gt%5D=x&${END}`, ['start[$gt]', 'start']],
  ])('rejects with VALIDATION_ERROR when %s', async (_name, query, fieldNames) => {
    const response = await app.request.get(`/api/rooms/available?${query}`)
    const body = bodyOf<ErrorEnvelope>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    for (const field of fieldNames) expect(body.error.fields).toHaveProperty([field])
    expect(JSON.stringify(response.body)).not.toMatch(LEAK_PATTERN)
  })
})
