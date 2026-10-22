import type { ErrorEnvelope, Room } from '@adlin/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startTestApp, type TestApp, WEB_ORIGIN } from '../helpers'

let app: TestApp

beforeAll(async () => {
  app = await startTestApp()
})

afterAll(async () => {
  await app.stop()
})

describe('GET /api/rooms', () => {
  it('returns the catalogue sorted by capacity then name, with the distinct equipment', async () => {
    const response = await app.request.get('/api/rooms')

    const body = response.body as { rooms: Room[]; equipment: string[] }
    expect(response.status).toBe(200)
    expect(body.rooms.map((room) => room.slug)).toEqual([
      'salle-1',
      'salle-2',
      'salle-de-ouf',
      'salle-okjsdkso',
      'salle-nulle',
    ])
    expect(body.rooms[0]).toEqual({
      slug: 'salle-1',
      name: 'Salle #1',
      description: 'Salle #1',
      capacity: 5,
      equipment: ['TV', 'Retro Projecteur'],
    })
    expect(body.equipment).toEqual(['Retro Projecteur', 'TV'])
    expect(JSON.stringify(response.body)).not.toContain('_id')
  })
})

describe('GET /api/health', () => {
  it('reports ok when the database answers', async () => {
    const response = await app.request.get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('unknown routes', () => {
  it('returns the NOT_FOUND envelope', async () => {
    const response = await app.request.get('/api/nope')

    const body = response.body as ErrorEnvelope
    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

describe('security headers and CORS', () => {
  it('sets helmet headers and hides x-powered-by', async () => {
    const response = await app.request.get('/api/health')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('allows a preflight from the web origin', async () => {
    const response = await app.request
      .options('/api/bookings')
      .set('Origin', WEB_ORIGIN)
      .set('Access-Control-Request-Method', 'POST')

    expect(response.headers['access-control-allow-origin']).toBe(WEB_ORIGIN)
  })

  it('does not allow a preflight from another origin', async () => {
    const response = await app.request
      .options('/api/bookings')
      .set('Origin', 'http://evil.test')
      .set('Access-Control-Request-Method', 'POST')

    expect(response.headers['access-control-allow-origin']).not.toBe('http://evil.test')
  })
})
