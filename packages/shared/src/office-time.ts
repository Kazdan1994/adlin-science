import { TZDate } from '@date-fns/tz'

export const OFFICE_TZ = 'Europe/Paris'

const pad = (n: number) => String(n).padStart(2, '0')
const GRID_MINUTES = 15

const toParis = (instant: string | Date) => new TZDate(new Date(instant), OFFICE_TZ)

export function toUtcInstant(dateYmd: string, hhmm: string): string {
  const [year, month, day] = dateYmd.split('-').map(Number) as [number, number, number]
  const [hour, minute] = hhmm.split(':').map(Number) as [number, number]
  return new Date(new TZDate(year, month - 1, day, hour, minute, 0, 0, OFFICE_TZ).getTime()).toISOString()
}

export function parisDateOf(instant: string | Date): string {
  const d = toParis(instant)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parisTimeOf(instant: string | Date): string {
  const d = toParis(instant)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function parisTodayYmd(now: Date): string {
  return parisDateOf(now)
}

function gridTimes(fromMinute: number, toMinute: number): string[] {
  const times: string[] = []
  for (let m = fromMinute; m <= toMinute; m += GRID_MINUTES) {
    times.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
  }
  return times
}

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

/** Start times 00:00-23:45 that exist on that Paris day (skips the spring-forward gap). */
export function startTimeOptions(dateYmd: string): string[] {
  return gridTimes(0, 23 * 60 + 45).filter((time) => parisTimeOf(toUtcInstant(dateYmd, time)) === time)
}

/** End times strictly after `startHHmm`, up to 24:00. */
export function endTimeOptions(dateYmd: string, startHHmm: string): string[] {
  const valid = new Set(startTimeOptions(dateYmd))
  return gridTimes(minutesOf(startHHmm) + GRID_MINUTES, 24 * 60).filter((t) => t === '24:00' || valid.has(t))
}
