import { parisTimeOf } from '@adlin/shared'

/** `2026-11-03` → `Tuesday 3 November 2026` */
export function formatDay(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number) as [number, number, number]
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

/** `10:00`, with Paris midnight shown as `24:00` when it ends a slot. */
export function formatEndTime(instant: string): string {
  const time = parisTimeOf(instant)
  return time === '00:00' ? '24:00' : time
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`
}
