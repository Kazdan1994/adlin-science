import type { ErrorCode } from '@adlin/shared'

export type FieldErrors = Readonly<Record<string, string>>

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields: FieldErrors | undefined = undefined,
  ) {
    super(message)
  }
}

export function validationError(fields: FieldErrors): AppError {
  return new AppError(400, 'VALIDATION_ERROR', 'Some details need fixing.', fields)
}

export function roomNotFound(): AppError {
  return new AppError(404, 'ROOM_NOT_FOUND', 'This room does not exist.')
}

export function slotTaken(): AppError {
  return new AppError(409, 'SLOT_TAKEN', 'Someone just booked this room for this time. Pick another room.')
}

export function unknownEquipment(names: readonly string[]): AppError {
  return new AppError(400, 'UNKNOWN_EQUIPMENT', `Unknown equipment: ${names.join(', ')}.`)
}

export function serviceUnavailable(): AppError {
  return new AppError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again shortly.')
}

export function unsupportedMediaType(): AppError {
  return new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the request body as application/json.')
}
