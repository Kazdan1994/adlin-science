import { parisDateOf, parisTimeOf, parisTodayYmd } from './office-time'

export const SLOT_MINUTES = 15
export const HORIZON_DAYS = 90

const SLOT_MS = SLOT_MINUTES * 60_000
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/
const MESSAGES = {
  badInstant: 'Enter a valid date and time.',
  offGrid: 'Times must be on a 15-minute step.',
  endBeforeStart: 'End time must be after the start time.',
  past: 'Start time must not be in the past.',
  crossesMidnight: 'A booking must end by midnight (Paris time).',
  tooFar: `Bookings open up to ${HORIZON_DAYS} days ahead.`,
} as const

export type SlotValidation = { ok: true } | { ok: false; fields: { start?: string; end?: string } }

const parseInstant = (value: string): number | undefined => {
  if (!INSTANT_PATTERN.test(value)) return undefined
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? undefined : ms
}

const addDays = (ymd: string, days: number): string => {
  const d = new Date(`${ymd}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function validateSlot(start: string, end: string, now: Date): SlotValidation {
  const fields: { start?: string; end?: string } = {}
  const startMs = parseInstant(start)
  const endMs = parseInstant(end)

  if (startMs === undefined) fields.start = MESSAGES.badInstant
  else if (startMs % SLOT_MS !== 0) fields.start = MESSAGES.offGrid
  if (endMs === undefined) fields.end = MESSAGES.badInstant
  else if (endMs % SLOT_MS !== 0) fields.end = MESSAGES.offGrid

  if (startMs !== undefined && endMs !== undefined) {
    if (endMs <= startMs) fields.end ??= MESSAGES.endBeforeStart
    if (startMs < now.getTime()) fields.start ??= MESSAGES.past
    if (endMs > startMs && parisDateOf(start) !== parisDateOf(new Date(endMs - 1))) {
      fields.end ??= MESSAGES.crossesMidnight
    }
    if (parisDateOf(start) > addDays(parisTodayYmd(now), HORIZON_DAYS)) fields.start ??= MESSAGES.tooFar
  }

  return fields.start || fields.end ? { ok: false, fields } : { ok: true }
}

/** Every 15-minute instant in [start, end). Inputs must already be valid. */
export function expandSlotStarts(start: string, end: string): Date[] {
  const starts: Date[] = []
  for (let t = Date.parse(start); t < Date.parse(end); t += SLOT_MS) starts.push(new Date(t))
  return starts
}

export interface DefaultSlot {
  date: string
  startTime: string
  endTime: string
}

/** Next grid instant strictly after now, one hour long; tomorrow 09:00-10:00 if that crosses midnight. */
export function defaultSlot(now: Date): DefaultSlot {
  const startMs = (Math.floor(now.getTime() / SLOT_MS) + 1) * SLOT_MS
  const endMs = startMs + 4 * SLOT_MS
  const date = parisDateOf(new Date(startMs))
  if (parisDateOf(new Date(endMs - 1)) !== date) {
    return { date: addDays(parisTodayYmd(now), 1), startTime: '09:00', endTime: '10:00' }
  }
  const endTime = parisTimeOf(new Date(endMs))
  return { date, startTime: parisTimeOf(new Date(startMs)), endTime: endTime === '00:00' ? '24:00' : endTime }
}
