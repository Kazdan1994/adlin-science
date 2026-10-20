import { describe, expect, it } from 'vitest'
import { defaultSlot, expandSlotStarts, HORIZON_DAYS, SLOT_MINUTES, validateSlot } from '../src/slot'

const NOW = new Date('2026-11-02T08:00:00.000Z')
const slot = (start: string, end: string) => validateSlot(start, end, NOW)

describe('constants', () => {
  it('uses a 15-minute grid and a 90-day horizon', () => {
    expect(SLOT_MINUTES).toBe(15)
    expect(HORIZON_DAYS).toBe(90)
  })
})

describe('validateSlot', () => {
  it('accepts a valid slot', () => {
    expect(slot('2026-11-03T09:00:00.000Z', '2026-11-03T10:00:00.000Z')).toEqual({ ok: true })
  })

  it('1. rejects instants that are not ISO 8601 with Z', () => {
    const result = slot('2026-11-03T09:00:00', '2026-11-03T10:00:00.000Z')
    expect(result).toMatchObject({ ok: false })
    expect(!result.ok && result.fields.start).toBeDefined()
  })

  it('1. rejects unparseable end', () => {
    const result = slot('2026-11-03T09:00:00.000Z', 'tomorrow')
    expect(!result.ok && result.fields.end).toBeDefined()
  })

  it('2. rejects instants off the 15-minute grid', () => {
    const minutes = slot('2026-11-03T09:07:00.000Z', '2026-11-03T10:00:00.000Z')
    expect(!minutes.ok && minutes.fields.start).toBeDefined()
    const seconds = slot('2026-11-03T09:00:30.000Z', '2026-11-03T10:00:00.000Z')
    expect(!seconds.ok && seconds.fields.start).toBeDefined()
    const millis = slot('2026-11-03T09:00:00.000Z', '2026-11-03T10:00:00.500Z')
    expect(!millis.ok && millis.fields.end).toBeDefined()
  })

  it('3. rejects end before or equal to start', () => {
    const equal = slot('2026-11-03T09:00:00.000Z', '2026-11-03T09:00:00.000Z')
    expect(!equal.ok && equal.fields.end).toBe('End time must be after the start time.')
    const before = slot('2026-11-03T10:00:00.000Z', '2026-11-03T09:00:00.000Z')
    expect(!before.ok && before.fields.end).toBe('End time must be after the start time.')
  })

  it('4. rejects a start in the past but accepts start equal to now', () => {
    const past = slot('2026-11-02T07:45:00.000Z', '2026-11-02T09:00:00.000Z')
    expect(!past.ok && past.fields.start).toBeDefined()
    expect(slot('2026-11-02T08:00:00.000Z', '2026-11-02T09:00:00.000Z')).toEqual({ ok: true })
  })

  it('5. rejects a slot crossing Paris midnight but allows ending at 24:00', () => {
    const crossing = slot('2026-11-03T22:00:00.000Z', '2026-11-03T23:15:00.000Z')
    expect(!crossing.ok && crossing.fields.end).toBeDefined()
    expect(slot('2026-11-03T22:00:00.000Z', '2026-11-03T23:00:00.000Z')).toEqual({ ok: true })
  })

  it('6. rejects a start more than 90 Paris days ahead', () => {
    expect(slot('2027-01-31T09:00:00.000Z', '2027-01-31T10:00:00.000Z')).toEqual({ ok: true })
    const far = slot('2027-02-01T09:00:00.000Z', '2027-02-01T10:00:00.000Z')
    expect(!far.ok && far.fields.start).toBeDefined()
  })
})

describe('expandSlotStarts', () => {
  it('returns every 15-minute start in [start, end) and excludes end', () => {
    const starts = expandSlotStarts('2026-11-03T09:00:00.000Z', '2026-11-03T10:00:00.000Z')
    expect(starts.map((d) => d.toISOString())).toEqual([
      '2026-11-03T09:00:00.000Z',
      '2026-11-03T09:15:00.000Z',
      '2026-11-03T09:30:00.000Z',
      '2026-11-03T09:45:00.000Z',
    ])
  })

  it('returns 96 starts for a full Paris day', () => {
    expect(expandSlotStarts('2026-12-01T23:00:00.000Z', '2026-12-02T23:00:00.000Z')).toHaveLength(96)
  })
})

describe('defaultSlot', () => {
  const at = (iso: string) => defaultSlot(new Date(iso))

  it('starts at the next grid instant and lasts an hour', () => {
    // Paris 09:07
    expect(at('2026-11-02T08:07:00.000Z')).toEqual({ date: '2026-11-02', startTime: '09:15', endTime: '10:15' })
  })

  it('moves to the next grid instant when exactly on the grid', () => {
    expect(at('2026-11-02T08:00:00.000Z')).toEqual({ date: '2026-11-02', startTime: '09:15', endTime: '10:15' })
  })

  it('may end at 24:00', () => {
    // Paris 22:50
    expect(at('2026-11-02T21:50:00.000Z')).toEqual({ date: '2026-11-02', startTime: '23:00', endTime: '24:00' })
  })

  it('falls back to tomorrow 09:00-10:00 when the default would cross midnight', () => {
    // Paris 23:20
    expect(at('2026-11-02T22:20:00.000Z')).toEqual({ date: '2026-11-03', startTime: '09:00', endTime: '10:00' })
  })
})
