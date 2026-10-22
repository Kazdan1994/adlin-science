import { MongoMemoryServer } from 'mongodb-memory-server'
import { pino } from 'pino'
import supertest from 'supertest'
import { createApp } from '../src/app'
import { loadConfig } from '../src/config'
import { connect, type Database, ensureIndexes } from '../src/db'
import { seedRooms } from '../src/rooms/seed'

export const FIXED_NOW = new Date('2026-11-02T08:00:00.000Z')
export const WEB_ORIGIN = 'http://localhost:3000'

export interface TestApp {
  request: ReturnType<typeof supertest>
  database: Database
  mongoUri: string
  clearBookings: () => Promise<void>
  stop: () => Promise<void>
}

export function bodyOf<T>(response: { body: unknown }): T {
  return response.body as T
}

export async function startTestApp(): Promise<TestApp> {
  const mongo = await MongoMemoryServer.create()
  const mongoUri = mongo.getUri()
  return buildTestApp(mongo, mongoUri)
}

async function buildTestApp(mongo: MongoMemoryServer, mongoUri: string): Promise<TestApp> {
  const config = loadConfig({ MONGODB_URI: mongoUri, WEB_ORIGIN, LOG_LEVEL: 'silent' })
  const database = await connect(config.mongodbUri, config.mongodbDb)
  await ensureIndexes(database)
  await seedRooms(database.rooms, config.roomsFile)

  const app = createApp({
    database,
    config,
    now: () => FIXED_NOW,
    logger: pino({ level: 'silent' }),
  })

  return {
    request: supertest(app),
    database,
    mongoUri,
    clearBookings: async () => {
      await database.bookings.deleteMany({})
    },
    stop: async () => {
      await database.client.close()
      await mongo.stop()
    },
  }
}
