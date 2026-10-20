import { describe, expect, it } from 'vitest'
import {
  endTimeOptions,
  OFFICE_TZ,
  parisDateOf,
  parisTimeOf,
  parisTodayYmd,
  startTimeOptions,
  toUtcInstant,
} from '../src/office-time'

const minutesBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 60_000

describe('office time', () => {
  it('uses Europe/Paris', () => {
    expect(OFFICE_TZ).toBe('Europe/Paris')
  })

  it('converts Paris wall time to UTC in winter (UTC+1)', () => {
    expect(toUtcInstant('2026-12-01', '10:00')).toBe('2026-12-01T09:00:00.000Z')
  })

  it('converts Paris wall time to UTC in summer (UTC+2)', () => {
    expect(toUtcInstant('2026-07-01', '10:00')).toBe('2026-07-01T08:00:00.000Z')
  })

  it('treats 24:00 as the next day at 00:00', () => {
    expect(toUtcInstant('2026-12-01', '24:00')).toBe('2026-12-01T23:00:00.000Z')
  })

  it('reads the Paris calendar date of instants near midnight', () => {
    expect(parisDateOf('2026-12-01T22:59:59.999Z')).toBe('2026-12-01')
    expect(parisDateOf('2026-12-01T23:00:00.000Z')).toBe('2026-12-02')
    expect(parisDateOf('2026-07-01T21:59:59.999Z')).toBe('2026-07-01')
    expect(parisDateOf('2026-07-01T22:00:00.000Z')).toBe('2026-07-02')
  })

  it('reads the Paris wall time of an instant', () => {
    expect(parisTimeOf('2026-12-01T09:00:00.000Z')).toBe('10:00')
    expect(parisTimeOf('2026-07-01T08:15:00.000Z')).toBe('10:15')
  })

  it('reads today in Paris from a Date', () => {
    expect(parisTodayYmd(new Date('2026-12-01T23:30:00.000Z'))).toBe('2026-12-02')
  })

  it.each(['2026-10-25', '2027-03-28'])('keeps a Paris 10:00-11:00 slot at 60 minutes on %s', (day) => {
    expect(minutesBetween(toUtcInstant(day, '10:00'), toUtcInstant(day, '11:00'))).toBe(60)
  })

  it('offers 96 start times on a regular day', () => {
    const options = startTimeOptions('2026-12-01')
    expect(options).toHaveLength(96)
    expect(options[0]).toBe('00:00')
    expect(options.at(-1)).toBe('23:45')
  })

  it('omits the nonexistent 02:00-02:45 on the spring-forward day', () => {
    const options = startTimeOptions('2027-03-28')
    for (const time of ['02:00', '02:15', '02:30', '02:45']) {
      expect(options).not.toContain(time)
    }
    expect(options).toContain('01:45')
    expect(options).toContain('03:00')
  })

  it('offers end times after the start, up to 24:00', () => {
    const options = endTimeOptions('2026-12-01', '10:00')
    expect(options[0]).toBe('10:15')
    expect(options).toContain('24:00')
    expect(options).not.toContain('10:00')
    expect(options).not.toContain('09:45')
  })
})
