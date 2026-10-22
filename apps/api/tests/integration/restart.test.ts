import type { Room } from '@adlin/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { bodyOf, startTestApp, type TestApp } from '../helpers'

const START = '2026-11-03T09:00:00.000Z'
const END = '2026-11-03T10:00:00.000Z'

let app: TestApp

beforeAll(async () => {
  app = await startTestApp()
})

afterAll(async () => {
  await app.stop()
})

describe('persistence across restarts (FR-013, SC-006)', () => {
  it('still hides a booked room after the app and its Mongo client are replaced', async () => {
    const created = await app.request
      .post('/api/bookings')
      .send({ roomSlug: 'salle-2', start: START, end: END, bookerName: 'Alice Martin' })
    expect(created.status).toBe(201)

    app = await app.restart()

    const response = await app.request.get(`/api/rooms/available?start=${START}&end=${END}`)
    const slugs = bodyOf<{ rooms: Room[] }>(response).rooms.map((room) => room.slug)
    expect(slugs).toHaveLength(4)
    expect(slugs).not.toContain('salle-2')
  })
})
