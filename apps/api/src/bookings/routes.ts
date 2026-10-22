import { createBookingRequestSchema } from '@adlin/shared'
import { Router } from 'express'
import type { Database } from '../db'
import { unsupportedMediaType } from '../http/errors'
import { parseBody } from '../http/validate'
import { createBooking } from './service'

export function createBookingsRouter(database: Database, now: () => Date): Router {
  const router = Router()

  router.post('/bookings', async (req, res) => {
    if (!req.is('application/json')) throw unsupportedMediaType()

    const input = parseBody(createBookingRequestSchema, req.body)
    const booking = await createBooking(database, input, now())
    res.status(201).json({ booking })
  })

  return router
}
