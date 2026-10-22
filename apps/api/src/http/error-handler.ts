import type { ErrorEnvelope } from '@adlin/shared'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import type {} from 'pino-http' // adds `req.id` and `req.log` to Express requests
import { AppError } from './errors'

const INTERNAL_MESSAGE = 'Something went wrong on our side. Please try again.'

function bodyParserErrorType(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error)) return undefined
  return typeof error.type === 'string' ? error.type : undefined
}

function toAppError(error: unknown): AppError | undefined {
  if (error instanceof AppError) return error
  switch (bodyParserErrorType(error)) {
    case 'entity.parse.failed':
      return new AppError(400, 'VALIDATION_ERROR', 'The request body is not valid JSON.')
    case 'entity.too.large':
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request is too large.')
    default:
      return undefined
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ErrorEnvelope = { error: { code: 'NOT_FOUND', message: 'This page does not exist.' } }
  res.status(404).json(body)
}

// Express recognises error middleware by its four-argument signature, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const known = toAppError(error)
  if (known) {
    const body: ErrorEnvelope = {
      error: {
        code: known.code,
        message: known.message,
        ...(known.fields ? { fields: { ...known.fields } } : {}),
      },
    }
    res.status(known.status).json(body)
    return
  }

  req.log.error({ err: error, reqId: req.id }, 'Unhandled error')
  const body: ErrorEnvelope = { error: { code: 'INTERNAL_ERROR', message: INTERNAL_MESSAGE } }
  res.status(500).json(body)
}
