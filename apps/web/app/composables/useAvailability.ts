import { defaultSlot, type Room, toUtcInstant } from '@adlin/shared'
import type { ApiRequestError } from '~/utils/api'

export interface SlotCriteria {
  /** Paris calendar date, `YYYY-MM-DD` */
  date: string
  /** Paris wall time, `HH:mm` */
  startTime: string
  /** Paris wall time, `HH:mm`, up to `24:00` */
  endTime: string
}

export interface FilterCriteria {
  minCapacity?: number | undefined
  equipment: string[]
}

export type SearchCriteria = SlotCriteria & FilterCriteria

export type AvailabilityStatus = 'idle' | 'loading' | 'success' | 'error'

export function useAvailability() {
  const api = useApi()
  const criteria = ref<SearchCriteria>({ ...defaultSlot(new Date()), equipment: [] })
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
        ...(current.minCapacity !== undefined ? { minCapacity: current.minCapacity } : {}),
        ...(current.equipment.length > 0 ? { equipment: current.equipment } : {}),
      })
      if (request !== latestRequest) return // a newer search superseded this one
      rooms.value = response.rooms
      error.value = null
      status.value = 'success'
    } catch (caught) {
      if (request !== latestRequest) return
      error.value = toApiError(caught)
      status.value = 'error'
    }
  }

  const search = (next: SlotCriteria): Promise<void> => {
    criteria.value = { ...criteria.value, ...next }
    return run(criteria.value)
  }
  const setFilters = (next: FilterCriteria): Promise<void> => {
    criteria.value = { ...criteria.value, minCapacity: next.minCapacity, equipment: [...next.equipment] }
    return run(criteria.value)
  }
  const refresh = (): Promise<void> => run(criteria.value)

  onMounted(refresh)

  return { criteria: shallowReadonly(criteria), status: shallowReadonly(status), rooms: shallowReadonly(rooms), error: shallowReadonly(error), search, setFilters, refresh }
}
