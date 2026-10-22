import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadConfig } from '../../src/config'
import { connect, type Database, ensureIndexes } from '../../src/db'
import { seedRooms, slugify } from '../../src/rooms/seed'

const { roomsFile } = loadConfig({ MONGODB_URI: 'mongodb://unused', WEB_ORIGIN: 'http://localhost:3000' })

let mongo: MongoMemoryServer
let database: Database

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  database = await connect(mongo.getUri(), 'seed_test')
  await ensureIndexes(database)
})

afterAll(async () => {
  await database.client.close()
  await mongo.stop()
})

describe('slugify', () => {
  it('lowercases, strips diacritics and collapses non-alphanumerics', () => {
    expect(slugify('Salle #1')).toBe('salle-1')
    expect(slugify('  Salle de Réunion  ')).toBe('salle-de-reunion')
  })
})

describe('seedRooms', () => {
  it('seeds the five rooms from salles.json with flattened equipment', async () => {
    await seedRooms(database.rooms, roomsFile)

    const rooms = await database.rooms.find({}).sort({ slug: 1 }).toArray()
    expect(rooms.map((room) => room.slug)).toEqual([
      'salle-1',
      'salle-2',
      'salle-de-ouf',
      'salle-nulle',
      'salle-okjsdkso',
    ])
    expect(rooms.find((room) => room.slug === 'salle-1')?.equipment).toEqual(['TV', 'Retro Projecteur'])
    expect(rooms.find((room) => room.slug === 'salle-okjsdkso')?.equipment).toEqual([])
  })

  it('is idempotent', async () => {
    await seedRooms(database.rooms, roomsFile)
    await seedRooms(database.rooms, roomsFile)

    expect(await database.rooms.countDocuments()).toBe(5)
  })

  it('throws when two names slugify to the same value', async () => {
    const room = (name: string): object => ({
      name,
      description: name,
      capacity: 4,
      equipements: [],
      createdAt: '2016-12-07T12:39:29.812Z',
      updatedAt: '2016-12-07T12:39:29.812Z',
    })
    const dir = await mkdtemp(join(tmpdir(), 'rooms-'))
    const file = join(dir, 'rooms.json')
    await writeFile(file, JSON.stringify({ rooms: [room('Salle #1'), room('salle 1')] }))

    await expect(seedRooms(database.rooms, file)).rejects.toThrow(/duplicate/i)
  })
})
