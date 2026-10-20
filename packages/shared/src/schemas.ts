import { z } from 'zod'

const CONTROL_CHARS = /\p{Cc}/u

export const instantSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/, 'Enter a valid date and time.')
export const roomSlugSchema = z.string().regex(/^[a-z0-9-]{1,64}$/, 'Unknown room.')
export const bookerNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name.')
  .max(80, 'Name must be 80 characters or fewer.')
  .refine((value) => !CONTROL_CHARS.test(value), 'Name contains characters that are not allowed.')

export const createBookingRequestSchema = z
  .object({
    roomSlug: roomSlugSchema,
    start: instantSchema,
    end: instantSchema,
    bookerName: bookerNameSchema,
  })
  .strict()

export const availableRoomsQuerySchema = z.object({ start: instantSchema, end: instantSchema }).strict()

export const roomSchema = z.object({
  slug: roomSlugSchema,
  name: z.string(),
  description: z.string(),
  capacity: z.number().int(),
  equipment: z.array(z.string()),
})

export const bookingSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/),
  room: z.object({ slug: roomSlugSchema, name: z.string() }),
  start: instantSchema,
  end: instantSchema,
  bookerName: z.string(),
  createdAt: instantSchema,
})

export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNKNOWN_EQUIPMENT',
  'ROOM_NOT_FOUND',
  'SLOT_TAKEN',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'NOT_FOUND',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
])

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
})

export type Room = z.infer<typeof roomSchema>
export type Booking = z.infer<typeof bookingSchema>
export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>
export type AvailableRoomsQuery = z.infer<typeof availableRoomsQuerySchema>
export type ErrorCode = z.infer<typeof errorCodeSchema>
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>
