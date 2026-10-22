import type { z } from 'zod'
import { type FieldErrors, validationError } from './errors'

const NOT_ALLOWED = 'This field is not allowed.'
const REQUIRED = 'This field is required.'

function fieldErrorsFrom(error: z.ZodError, input: unknown): FieldErrors {
  const source = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const fields: Record<string, string> = {}
  const setOnce = (key: string, message: string): void => {
    fields[key] ??= message
  }

  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      issue.keys.forEach((key) => setOnce(key, NOT_ALLOWED))
      continue
    }
    const key = String(issue.path[0] ?? 'request')
    const missing = issue.code === 'invalid_type' && source[key] === undefined
    setOnce(key, missing ? REQUIRED : issue.message)
  }
  return fields
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (!result.success) throw validationError(fieldErrorsFrom(result.error, input))
  return result.data
}

export const parseQuery = parse
export const parseBody = parse
