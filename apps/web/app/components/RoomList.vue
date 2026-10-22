<script setup lang="ts">
import type { Room } from '@adlin/shared'
import type { AvailabilityStatus } from '~/composables/useAvailability'
import type { ApiRequestError } from '~/utils/api'

const props = defineProps<{
  status: AvailabilityStatus
  rooms: readonly Room[]
  error: ApiRequestError | null
}>()
defineEmits<{ book: [room: Room]; retry: [] }>()

const liveMessage = computed(() => {
  if (props.status !== 'success') return ''
  return props.rooms.length === 0 ? 'No rooms available.' : `${props.rooms.length} rooms available.`
})
</script>

<template>
  <section aria-labelledby="rooms-heading" :aria-busy="status === 'loading'">
    <h2 id="rooms-heading" class="mb-3 text-lg font-semibold">Available rooms</h2>
    <p class="sr-only" role="status">{{ liveMessage }}</p>

    <ul v-if="status === 'loading'" class="space-y-3" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="h-24 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
    </ul>
    <ErrorBanner v-else-if="status === 'error' && error" :code="error.code" retryable @retry="$emit('retry')" />
    <EmptyState v-else-if="status === 'success' && rooms.length === 0" />
    <ul v-else-if="status === 'success'" class="space-y-3">
      <RoomCard v-for="room in rooms" :key="room.slug" :room="room" @book="$emit('book', $event)" />
    </ul>
  </section>
</template>
