import type { Booking, Room } from '@adlin/shared'
import type { ApiRequestError } from '~/utils/api'

export type BookingStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface BookingSlot {
  /** UTC instants */
  start: string
  end: string
}

export function useBooking() {
  const api = useApi()
  const status = ref<BookingStatus>('idle')
  const booking = ref<Booking | null>(null)
  const error = ref<ApiRequestError | null>(null)

  const isSubmitting = computed(() => status.value === 'submitting')

  async function submit(room: Room, slot: BookingSlot, bookerName: string): Promise<void> {
    if (isSubmitting.value) return
    status.value = 'submitting'
    error.value = null
    try {
      const response = await api.createBooking({ roomSlug: room.slug, start: slot.start, end: slot.end, bookerName })
      booking.value = response.booking
      status.value = 'success'
    } catch (caught) {
      error.value = toApiError(caught)
      status.value = 'error'
    }
  }

  function reset(): void {
    status.value = 'idle'
    booking.value = null
    error.value = null
  }

  return { status: shallowReadonly(status), booking: shallowReadonly(booking), error: shallowReadonly(error), isSubmitting, submit, reset }
}
