import type { ErrorEnvelope } from '@adlin/shared'
import type { RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'

const WINDOW_MS = 60_000
const GLOBAL_LIMIT_PER_WINDOW = 300

const rateLimited: ErrorEnvelope = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute and try again.' },
}

// A factory, not a module singleton: each app instance gets its own counters.
export function createLimiter(limit: number): RequestHandler {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(rateLimited)
    },
  })
}

export function createGlobalLimiter(): RequestHandler {
  return createLimiter(GLOBAL_LIMIT_PER_WINDOW)
}
