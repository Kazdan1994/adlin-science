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

const freeCount = computed(() => {
  if (props.status !== 'success' || props.roomCount === 0) return ''
  return `${props.rooms.length} of ${props.roomCount} free`
})

const liveMessage = computed(() => {
  if (props.status !== 'success') return ''
  const count = props.rooms.length
  if (count === 0) return 'No rooms available.'
  return count === 1 ? '1 room available.' : `${count} rooms available.`
})
</script>

<template>
  <section aria-labelledby="rooms-heading" :aria-busy="status === 'loading'" class="rounded-card border border-line bg-surface">
    <div class="flex items-start justify-between gap-4 px-5 pt-5">
      <h2 id="rooms-heading" ref="heading" tabindex="-1" class="text-base font-semibold focus:outline-none">
        Available rooms
        <span class="mt-0.5 block text-sm font-normal text-muted">
          {{ formatDay(timeSlot.date) }}, <span class="whitespace-nowrap font-medium text-ink">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span> (Paris time)
        </span>
      </h2>
      <p class="shrink-0 text-sm text-muted">{{ freeCount }}</p>
    </div>
    <p class="sr-only" role="status">{{ liveMessage }}</p>

    <div class="px-5 pb-4 pt-4" aria-hidden="true">
      <div class="relative h-3 rounded-sm bg-raised">
        <div class="absolute inset-y-0 rounded-sm bg-data" :style="slotStyle" />
        <div v-if="nowOffset" class="absolute -inset-y-1 w-px bg-ink" :style="{ left: nowOffset }" />
      </div>
      <div class="mt-1.5 flex justify-between text-xs text-muted">
        <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
      </div>
    </div>

    <ul v-if="status === 'loading'" class="border-t border-rule" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="flex items-center justify-between gap-4 border-b border-rule px-5 py-4 last:border-b-0">
        <div class="space-y-2">
          <div class="h-4 w-28 rounded-sm bg-raised" />
          <div class="h-3 w-40 rounded-sm bg-raised" />
        </div>
        <div class="h-8 w-16 rounded-control bg-raised" />
      </li>
    </ul>
    <div v-else-if="status === 'error' && error" class="border-t border-rule p-5">
      <ErrorBanner :code="error.code" retryable @retry="$emit('retry')" />
    </div>
    <div v-else-if="status === 'success' && rooms.length === 0" class="border-t border-rule p-5">
      <EmptyState :filtered="filtered" :min-capacity="minCapacity" :max-capacity="maxCapacity" @clear="$emit('clear')" @change-time="$emit('changeTime')" />
    </div>
    <ul v-else-if="status === 'success'" class="border-t border-rule">
      <RoomCard v-for="room in rooms" :key="room.slug" :room="room" :max-capacity="maxCapacity" @book="$emit('book', $event)" />
    </ul>
  </section>
</template>
