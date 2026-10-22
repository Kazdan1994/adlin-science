import {
  type AvailableRoomsQuery,
  type AvailableRoomsResponse,
  availableRoomsResponseSchema,
  type CreateBookingRequest,
  type CreateBookingResponse,
  createBookingResponseSchema,
  type ErrorCode,
  errorEnvelopeSchema,
  type RoomListResponse,
  roomListResponseSchema,
} from '@adlin/shared'

export type ApiErrorCode = ErrorCode | 'NETWORK'

export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields: Readonly<Record<string, string>> | undefined = undefined,
  ) {
    super(message)
  }
}

export interface Api {
  getRooms: () => Promise<RoomListResponse>
  getAvailableRooms: (query: AvailableRoomsQuery) => Promise<AvailableRoomsResponse>
  createBooking: (body: CreateBookingRequest) => Promise<CreateBookingResponse>
}

interface Parser<T> {
  safeParse: (input: unknown) => { success: true; data: T } | { success: false }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function toRequestError(error: unknown): ApiRequestError {
  const response = isRecord(error) ? error.response : undefined
  if (!isRecord(response)) {
    return new ApiRequestError('NETWORK', messageForError('NETWORK'))
  }
  const envelope = errorEnvelopeSchema.safeParse(response._data)
  if (!envelope.success) {
    return new ApiRequestError('INTERNAL_ERROR', messageForError('INTERNAL_ERROR'))
  }
  const { code, message, fields } = envelope.data.error
  return new ApiRequestError(code, message, fields)
}

export function createApi(baseURL: string): Api {
  const http = $fetch.create({ baseURL })

  async function request<T>(path: string, schema: Parser<T>, options: Parameters<typeof http>[1] = {}): Promise<T> {
    let body: unknown
    try {
      body = await http(path, options)
    } catch (error) {
      throw toRequestError(error)
    }
    const parsed = schema.safeParse(body)
    if (!parsed.success) throw new ApiRequestError('INTERNAL_ERROR', messageForError('INTERNAL_ERROR'))
    return parsed.data
  }

  return {
    getRooms: () => request('/rooms', roomListResponseSchema),
    getAvailableRooms: (query) => request('/rooms/available', availableRoomsResponseSchema, { query }),
    createBooking: (body) => request('/bookings', createBookingResponseSchema, { method: 'POST', body }),
  }
}

export function useApi(): Api {
  return createApi(useRuntimeConfig().public.apiBase)
}
