<script setup lang="ts">
import { parisTimeOf, parisTodayYmd, type Room } from '@adlin/shared'
import type { AvailabilityStatus, SlotCriteria } from '~/composables/useAvailability'
import type { ApiRequestError } from '~/utils/api'

const props = defineProps<{
  status: AvailabilityStatus
  rooms: readonly Room[]
  error: ApiRequestError | null
  filtered: boolean
  timeSlot: SlotCriteria
  minCapacity: number | undefined
  maxCapacity: number
  roomCount: number
}>()
defineEmits<{ book: [room: Room]; retry: []; clear: []; changeTime: [] }>()

const heading = useTemplateRef<HTMLElement>('heading')
defineExpose({ focus: () => heading.value?.focus() })

const DAY_MINUTES = 24 * 60
const minutesOf = (hhmm: string): number => {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}
const percentOfDay = (minutes: number): string => `${(minutes / DAY_MINUTES) * 100}%`

const slotStyle = computed(() => {
  const start = minutesOf(props.timeSlot.startTime)
  return { left: percentOfDay(start), width: percentOfDay(minutesOf(props.timeSlot.endTime) - start) }
})
const nowOffset = computed(() => {
  const now = new Date()
  return props.timeSlot.date === parisTodayYmd(now) ? percentOfDay(minutesOf(parisTimeOf(now))) : null
})
const ticks = ['0:00', '6:00', '12:00', '18:00', '24:00']
// No opening hours, so the bar keeps the whole day; night hours are hatched to set the working day apart.
const nightBands = [
  { left: '0%', width: percentOfDay(7 * 60) },
  { left: percentOfDay(21 * 60), width: percentOfDay(3 * 60) },
]

type SeatOrder = 'none' | 'desc' | 'asc'
const seatOrder = ref<SeatOrder>('none')
const nextSeatOrder: Record<SeatOrder, SeatOrder> = { none: 'desc', desc: 'asc', asc: 'none' }
const seatSortLabel: Record<SeatOrder, string> = {
  none: 'Seats, sort largest first',
  desc: 'Seats, largest first. Sort smallest first',
  asc: 'Seats, smallest first. Clear sort',
}
const sortedRooms = computed(() => {
  if (seatOrder.value === 'none') return props.rooms
  const direction = seatOrder.value === 'desc' ? -1 : 1
  return [...props.rooms].sort((a, b) => (a.capacity - b.capacity) * direction)
})

const freeCount = computed(() => {
  if (props.status !== 'success' || props.roomCount === 0) return ''
  return props.filtered
    ? `${props.rooms.length} of ${props.roomCount} match your filters`
    : `${props.rooms.length} of ${props.roomCount} free`
})

const liveMessage = computed(() => {
  if (props.status !== 'success') return ''
  const count = props.rooms.length
  if (count === 0) return props.filtered ? 'No free room matches your filters.' : 'No rooms available.'
  return count === 1 ? '1 room available.' : `${count} rooms available.`
})
</script>

<template>
  <section aria-labelledby="rooms-heading" :aria-busy="status === 'loading'" class="rounded-card bg-surface shadow-tile">
    <div class="flex flex-col gap-1 px-4 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-7 sm:pt-7">
      <h2 id="rooms-heading" ref="heading" tabindex="-1" class="text-title2 font-semibold focus:outline-none sm:text-title1">
        Available rooms
        <span class="mt-1 block text-subhead font-normal tracking-normal text-muted">
          {{ formatDay(timeSlot.date) }}, <span class="whitespace-nowrap font-medium text-ink">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span> (Paris time)
        </span>
      </h2>
      <p class="shrink-0 text-subhead text-muted">{{ freeCount }}</p>
    </div>
    <p class="sr-only" role="status">{{ liveMessage }}</p>

    <div class="px-4 pb-5 pt-4 sm:px-7" aria-hidden="true">
      <div class="relative h-2 rounded-full bg-raised">
        <div v-for="band in nightBands" :key="band.left" class="night-band absolute inset-y-0" :style="band" />
        <div class="absolute inset-y-0 rounded-full bg-data" :style="slotStyle" />
        <div v-if="nowOffset" class="absolute -inset-y-1 w-px bg-ink" :style="{ left: nowOffset }" />
      </div>
      <div class="mt-1.5 flex justify-between text-caption text-muted">
        <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
      </div>
    </div>

    <ul v-if="status === 'loading'" class="border-t border-rule" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="flex items-center justify-between gap-4 border-b border-rule px-4 py-4 sm:px-7 last:border-b-0">
        <div class="space-y-2">
          <div class="h-4 w-28 rounded-full bg-raised" />
          <div class="h-3 w-40 rounded-full bg-raised" />
        </div>
        <div class="h-8 w-16 rounded-pill bg-raised" />
      </li>
    </ul>
    <div v-else-if="status === 'error' && error" class="border-t border-rule p-4 sm:p-7">
      <ErrorBanner :code="error.code" retryable @retry="$emit('retry')" />
    </div>
    <div v-else-if="status === 'success' && rooms.length === 0" class="border-t border-rule p-4 sm:p-7">
      <EmptyState :filtered="filtered" :min-capacity="minCapacity" :max-capacity="maxCapacity" @clear="$emit('clear')" @change-time="$emit('changeTime')" />
    </div>
    <template v-else-if="status === 'success'">
      <div class="grid grid-cols-(--grid-room-row) items-center gap-x-4 border-t border-rule px-4 py-2 text-footnote font-medium text-muted sm:px-7 sm:grid-cols-(--grid-room-row-wide)">
        <span>Room</span>
        <span class="hidden sm:block">Equipment</span>
        <button
          type="button"
          :aria-label="seatSortLabel[seatOrder]"
          class="-mx-1 inline-flex h-11 items-center justify-end gap-1 rounded-sm px-1 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-7"
          :class="seatOrder !== 'none' && 'text-ink'"
          @click="seatOrder = nextSeatOrder[seatOrder]"
        >
          Seats
          <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3.5 4.5L6 2l2.5 2.5" :class="seatOrder === 'desc' && 'opacity-25'" />
            <path d="M3.5 7.5L6 10l2.5-2.5" :class="seatOrder === 'asc' && 'opacity-25'" />
          </svg>
        </button>
        <span class="invisible px-4 text-callout" aria-hidden="true">Book</span>
      </div>
      <ul class="border-t border-rule">
        <RoomCard v-for="room in sortedRooms" :key="room.slug" :room="room" @book="$emit('book', $event)" />
      </ul>
    </template>
  </section>
</template>

<style scoped>
.night-band {
  background-image: repeating-linear-gradient(135deg, var(--color-control) 0 1px, transparent 1px 4px);
}
</style>
