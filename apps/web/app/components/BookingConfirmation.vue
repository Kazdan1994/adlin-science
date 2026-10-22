<script setup lang="ts">
import { type Booking, parisDateOf, parisTimeOf } from '@adlin/shared'

defineProps<{ booking: Booking }>()
defineEmits<{ another: [] }>()

const heading = useTemplateRef<HTMLElement>('heading')
const headingId = useId()

// Focused by the page once the booking dialog has closed, because the modal makes the page inert.
defineExpose({ focus: () => heading.value?.focus() })
</script>

<template>
  <Transition
    appear
    enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="scale-95 opacity-0 motion-reduce:scale-100 motion-reduce:opacity-100"
  >
    <section :aria-labelledby="headingId" class="rounded-lg border border-green-700 bg-green-50 p-5 text-green-950">
      <div class="flex items-center gap-3">
        <svg class="confirmation-check h-8 w-8 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path class="confirmation-check-mark" d="M7 12.5l3.5 3.5L17 9" />
        </svg>
        <h2 :id="headingId" ref="heading" tabindex="-1" class="text-xl font-semibold">Booking confirmed</h2>
      </div>
      <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt class="font-medium">Room</dt>
        <dd>{{ booking.room.name }}</dd>
        <dt class="font-medium">Date</dt>
        <dd>{{ formatDay(parisDateOf(booking.start)) }}</dd>
        <dt class="font-medium">Time</dt>
        <dd>{{ formatTimeRange(parisTimeOf(booking.start), formatEndTime(booking.end)) }} (Paris time)</dd>
        <dt class="font-medium">Name</dt>
        <dd>{{ booking.bookerName }}</dd>
      </dl>
      <p class="mt-4 text-sm">Bookings are final and can't be changed or cancelled.</p>
      <button
        type="button"
        class="mt-4 rounded-md bg-green-800 px-4 py-2 font-medium text-white hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
        @click="$emit('another')"
      >
        Book another room
      </button>
    </section>
  </Transition>
</template>

<style scoped>
.confirmation-check-mark {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: confirmation-draw 0.4s 0.2s ease-out forwards;
}

@keyframes confirmation-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confirmation-check-mark {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
