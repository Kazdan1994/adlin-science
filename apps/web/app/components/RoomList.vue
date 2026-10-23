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

const hasResult = ref(false)
watch(() => props.status, (status) => {
  if (status === 'success') hasResult.value = true
  else if (status === 'error') hasResult.value = false
})
const showSkeleton = computed(() => props.status === 'loading' && !hasResult.value)
const refreshing = computed(() => props.status === 'loading' && hasResult.value)
const view = computed(() => (refreshing.value ? 'success' : props.status))

const liveMessage = computed(() => {
  if (props.status !== 'success') return ''
  const count = props.rooms.length
  if (count === 0) return props.filtered ? 'No free room matches your filters.' : 'No rooms available.'
  return count === 1 ? '1 room available.' : `${count} rooms available.`
})
</script>

<template>
  <section aria-labelledby="rooms-heading" :aria-busy="status === 'loading'">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div>
        <h2 id="rooms-heading" ref="heading" tabindex="-1" class="text-large-title font-extrabold focus:outline-none sm:text-[2.5rem] sm:leading-none">Available rooms</h2>
        <p class="mt-3 text-title3 text-ink">
          {{ formatDay(timeSlot.date) }}, <span class="whitespace-nowrap bg-data-tint px-1.5 font-bold">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span> (Paris time)
        </p>
      </div>
      <p class="shrink-0 text-title3 font-bold">{{ freeCount }}</p>
    </div>
    <p class="sr-only" role="status">{{ liveMessage }}</p>

    <div class="pb-8 pt-6" aria-hidden="true">
      <div class="relative h-4 bg-surface">
        <div v-for="band in nightBands" :key="band.left" class="absolute inset-y-0 bg-raised" :style="band" />
        <div class="slot-bar absolute inset-y-0 bg-data-tint" :style="slotStyle" />
        <div v-if="nowOffset" class="absolute -inset-y-1.5 w-0.5 bg-ink" :style="{ left: nowOffset }" />
      </div>
      <div class="mt-2 flex justify-between text-footnote font-semibold text-muted">
        <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
      </div>
    </div>

    <ul v-if="showSkeleton" class="grid gap-1.5" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="flex items-center gap-4 bg-surface py-3 pl-3 pr-4 sm:pr-6">
        <div class="size-16 shrink-0 bg-raised sm:size-[5.5rem]" />
        <div class="flex-1 space-y-2">
          <div class="h-5 w-32 bg-raised" />
          <div class="h-3.5 w-44 bg-raised" />
        </div>
        <div class="h-11 w-20 bg-raised" />
      </li>
    </ul>
    <ErrorBanner v-else-if="view === 'error' && error" :code="error.code" retryable @retry="$emit('retry')" />
    <EmptyState
      v-else-if="view === 'success' && rooms.length === 0"
      :filtered="filtered"
      :min-capacity="minCapacity"
      :max-capacity="maxCapacity"
      @clear="$emit('clear')"
      @change-time="$emit('changeTime')"
    />
    <div v-else-if="view === 'success'" class="results" :class="refreshing && 'is-refreshing'">
      <div class="grid grid-cols-(--grid-room-row) items-center gap-x-4 pb-2 pl-3 pr-4 text-footnote font-semibold text-muted sm:gap-x-6 sm:pr-6 sm:grid-cols-(--grid-room-row-wide)">
        <span aria-hidden="true" />
        <span>Room</span>
        <span class="hidden sm:block">Equipment</span>
        <button
          type="button"
          :aria-label="seatSortLabel[seatOrder]"
          class="-mx-1 inline-flex h-11 items-center justify-end gap-1 px-1 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-7"
          :class="seatOrder !== 'none' && 'text-ink'"
          @click="seatOrder = nextSeatOrder[seatOrder]"
        >
          Seats
          <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3.5 4.5L6 2l2.5 2.5" :class="seatOrder === 'desc' && 'opacity-25'" />
            <path d="M3.5 7.5L6 10l2.5-2.5" :class="seatOrder === 'asc' && 'opacity-25'" />
          </svg>
        </button>
        <span class="invisible hidden px-5 text-subhead sm:block" aria-hidden="true">Book</span>
      </div>
      <TransitionGroup tag="ul" name="room" class="relative grid gap-1.5">
        <RoomCard v-for="(room, index) in sortedRooms" :key="room.slug" :room="room" :style="{ '--i': index }" @book="$emit('book', $event)" />
      </TransitionGroup>
    </div>
  </section>
</template>

<style scoped>
/* Plates slide in one after another, like signs being hung down a corridor. */
.room-enter-active {
  transition:
    opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--i, 0) * 60ms);
}

.room-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.room-leave-active {
  position: absolute;
  inset-inline: 0;
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}

.room-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.results {
  transition: opacity 0.2s ease-out;
}

.results.is-refreshing {
  opacity: 0.6;
}

.room-move {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.slot-bar {
  transition:
    left 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .room-enter-active,
  .room-leave-active,
  .room-move,
  .results,
  .slot-bar {
    transition: none;
  }
}
</style>
