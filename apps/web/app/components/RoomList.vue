<script setup lang="ts">
import type { Room } from '@adlin/shared'
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
}>()
defineEmits<{ book: [room: Room]; retry: []; clear: [] }>()

const heading = useTemplateRef<HTMLElement>('heading')
defineExpose({ focus: () => heading.value?.focus() })

const liveMessage = computed(() => {
  if (props.status !== 'success') return ''
  const count = props.rooms.length
  if (count === 0) return 'No rooms available.'
  return count === 1 ? '1 room available.' : `${count} rooms available.`
})
</script>

<template>
  <section aria-labelledby="rooms-heading" :aria-busy="status === 'loading'">
    <h2 id="rooms-heading" ref="heading" tabindex="-1" class="mb-3 text-lg font-semibold">
      Available rooms
      <span class="block text-base font-normal text-slate-700">
        {{ formatDay(timeSlot.date) }}, <span class="whitespace-nowrap">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span> (Paris time)
      </span>
    </h2>
    <p class="sr-only" role="status">{{ liveMessage }}</p>

    <ul v-if="status === 'loading'" class="space-y-3" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="h-24 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
    </ul>
    <ErrorBanner v-else-if="status === 'error' && error" :code="error.code" retryable @retry="$emit('retry')" />
    <EmptyState
      v-else-if="status === 'success' && rooms.length === 0"
      :filtered="filtered"
      :min-capacity="minCapacity"
      :max-capacity="maxCapacity"
      @clear="$emit('clear')"
    />
    <ul v-else-if="status === 'success'" class="space-y-3">
      <RoomCard v-for="room in rooms" :key="room.slug" :room="room" @book="$emit('book', $event)" />
    </ul>
  </section>
</template>
