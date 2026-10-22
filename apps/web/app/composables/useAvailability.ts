import { defaultSlot, type Room, toUtcInstant } from '@adlin/shared'
import type { ApiRequestError } from '~/utils/api'

export interface SearchCriteria {
  /** Paris calendar date, `YYYY-MM-DD` */
  date: string
  /** Paris wall time, `HH:mm` */
  startTime: string
  /** Paris wall time, `HH:mm`, up to `24:00` */
  endTime: string
}

export type AvailabilityStatus = 'idle' | 'loading' | 'success' | 'error'

export function useAvailability() {
  const api = useApi()
  const criteria = ref<SearchCriteria>(defaultSlot(new Date()))
  const status = ref<AvailabilityStatus>('idle')
  const rooms = ref<Room[]>([])
  const error = ref<ApiRequestError | null>(null)
  let latestRequest = 0

  async function run(current: SearchCriteria): Promise<void> {
    const request = ++latestRequest
    status.value = 'loading'
    try {
      const response = await api.getAvailableRooms({
        start: toUtcInstant(current.date, current.startTime),
        end: toUtcInstant(current.date, current.endTime),
      })
      if (request !== latestRequest) return // a newer search superseded this one
      rooms.value = response.rooms
      error.value = null
      status.value = 'success'
    } catch (caught) {
      if (request !== latestRequest) return
      error.value = caught as ApiRequestError
      status.value = 'error'
    }
  }

  const search = (next: SearchCriteria): Promise<void> => {
    criteria.value = { ...next }
    return run(criteria.value)
  }
  const refresh = (): Promise<void> => run(criteria.value)

  onMounted(refresh)

  return { criteria: readonly(criteria), status: readonly(status), rooms: readonly(rooms), error: readonly(error), search, refresh }
}
