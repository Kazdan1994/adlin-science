import type { ApiErrorCode } from './api'

const MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: 'Some details need fixing. Check the highlighted fields and try again.',
  UNKNOWN_EQUIPMENT: 'That equipment is not available. Clear the filters and try again.',
  ROOM_NOT_FOUND: 'This room is no longer available. Search again to see the current rooms.',
  SLOT_TAKEN: 'Someone just booked this room for this time. Pick another room below.',
  PAYLOAD_TOO_LARGE: 'That request was too large. Shorten your details and try again.',
  UNSUPPORTED_MEDIA_TYPE: 'Something went wrong sending your request. Reload the page and try again.',
  RATE_LIMITED: 'Too many attempts. Wait a minute, then try again.',
  NOT_FOUND: 'We could not find that. Reload the page and try again.',
  SERVICE_UNAVAILABLE: 'The booking service is temporarily unavailable. Try again in a moment.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
  NETWORK: "We can't reach the booking service. Check your connection and try again.",
}

/** `roomName` makes the booking conflict message say which room was lost. */
export function messageForError(code: ApiErrorCode, roomName?: string): string {
  if (code === 'SLOT_TAKEN' && roomName) {
    return `Someone just booked ${roomName} for this time. Pick another room below.`
  }
  return MESSAGES[code]
}
