import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { Logger } from 'pino'
import { pinoHttp } from 'pino-http'
import type { Config } from './config'
import type { Database } from './db'
import { errorHandler, notFoundHandler } from './http/error-handler'
import { createBookingLimiter, createGlobalLimiter } from './http/rate-limit'
import { createBookingsRouter } from './bookings/routes'
import { createRoomsRouter } from './rooms/routes'

export interface AppDeps {
  database: Database
  config: Config
  logger: Logger
  now: () => Date
  /** Booking attempts allowed per client per minute. Defaults to 10; tests raise it. */
  bookingRateLimit?: number
}

export function createApp({ database, config, logger, now, bookingRateLimit }: AppDeps): Express {
  const app = express()
  app.set('query parser', 'simple')

  app.use(
    pinoHttp({
      logger,
      genReqId: () => randomUUID(),
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  )
  app.use(helmet())
  app.use(cors({ origin: config.webOrigin, methods: ['GET', 'POST'] }))
  app.use('/api', createGlobalLimiter())
  app.use('/api/bookings', createBookingLimiter(bookingRateLimit))
  app.use(express.json({ limit: '10kb' }))

  app.use('/api', createRoomsRouter(database, now))
  app.use('/api', createBookingsRouter(database, now))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
