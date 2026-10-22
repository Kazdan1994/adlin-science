import type { ErrorEnvelope } from '@adlin/shared'
import { pino } from 'pino'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { bodyOf, startTestApp, type TestApp } from '../helpers'

interface LogLine {
  level: number
  msg?: string
  reqId?: string
  responseTime?: number
  req?: Record<string, unknown>
  res?: Record<string, unknown>
  err?: { message?: string; stack?: string }
}

const written: string[] = []
const logger = pino({ level: 'info' }, { write: (chunk: string) => void written.push(chunk) })
const logLines = (): LogLine[] => written.join('').trim().split('\n').map((line) => JSON.parse(line) as LogLine)

let app: TestApp

beforeAll(async () => {
  app = await startTestApp({ logger })
})

afterAll(async () => {
  await app.stop()
})

describe('request logging', () => {
  it('logs method, URL, status, duration and request id, and never the request body', async () => {
    const response = await app.request
      .post('/api/bookings')
      .send({ roomSlug: 'salle-2', start: '2026-11-03T09:00:00.000Z', end: '2026-11-03T10:00:00.000Z', bookerName: 'Secret Sam' })
    expect(response.status).toBe(201)

    const entry = logLines().find((line) => line.req?.method === 'POST')
    expect(entry?.req).toEqual({ id: expect.any(String) as string, method: 'POST', url: '/api/bookings' })
    expect(entry?.res).toEqual({ statusCode: 201 })
    expect(entry?.responseTime).toEqual(expect.any(Number))
    expect(written.join('')).not.toContain('Secret Sam')
  })

  it('logs the full error server-side and keeps it out of the response', async () => {
    vi.spyOn(app.database.rooms, 'find').mockImplementation(() => {
      throw new Error('driver exploded at /srv/internal/path')
    })

    const response = await app.request.get('/api/rooms')

    expect(response.status).toBe(500)
    expect(bodyOf<ErrorEnvelope>(response).error.code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(response.body)).not.toContain('exploded')
    const entry = logLines().find((line) => line.msg === 'Unhandled error')
    expect(entry?.err?.message).toBe('driver exploded at /srv/internal/path')
    expect(entry?.err?.stack).toContain('driver exploded')
    expect(entry?.reqId).toEqual(expect.any(String))
  })
})
