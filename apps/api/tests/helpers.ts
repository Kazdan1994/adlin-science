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
  clearBookings: () => Promise<void>
  /** Closes this app's Mongo client and starts a new app and client on the same database server. */
  restart: () => Promise<TestApp>
  stop: () => Promise<void>
}

export interface TestAppOptions {
  /** Keep the real 10-per-minute booking limit. Off by default so bulk POST tests do not trip it. */
  productionRateLimits?: boolean
}

const RELAXED_BOOKING_LIMIT = 1000

export function bodyOf<T>(response: { body: unknown }): T {
  return response.body as T
}

export async function startTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const mongo = await MongoMemoryServer.create()
  return buildTestApp(mongo, options)
}

async function buildTestApp(mongo: MongoMemoryServer, options: TestAppOptions): Promise<TestApp> {
  const mongoUri = mongo.getUri()
  const config = loadConfig({ MONGODB_URI: mongoUri, WEB_ORIGIN, LOG_LEVEL: 'silent' })
  const database = await connect(config.mongodbUri, config.mongodbDb)
  await ensureIndexes(database)
  await seedRooms(database.rooms, config.roomsFile)

  const app = createApp({
    database,
    config,
    now: () => FIXED_NOW,
    logger: pino({ level: 'silent' }),
    ...(options.productionRateLimits ? {} : { bookingRateLimit: RELAXED_BOOKING_LIMIT }),
  })

  return {
    request: supertest(app),
    database,
    clearBookings: async () => {
      await database.bookings.deleteMany({})
    },
    restart: async () => {
      await database.client.close()
      return buildTestApp(mongo, options)
    },
    stop: async () => {
      await database.client.close()
      await mongo.stop()
    },
  }
}
