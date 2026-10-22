<script setup lang="ts">
import { type Booking, parisDateOf, parisTimeOf } from '@adlin/shared'

defineProps<{ booking: Booking }>()
defineEmits<{ another: [] }>()

const heading = useTemplateRef<HTMLElement>('heading')
const headingId = useId()

defineExpose({ focus: () => heading.value?.focus() })
</script>

<template>
  <Transition
    appear
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
  >
    <section :aria-labelledby="headingId" class="rounded-card border border-line bg-surface p-5">
      <div class="flex items-center gap-2.5">
        <svg class="confirmation-check h-7 w-7 shrink-0 text-positive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle class="confirmation-check-ring" cx="12" cy="12" r="10" />
          <path class="confirmation-check-mark" d="M7 12.5l3.5 3.5L17 9" />
        </svg>
        <h2 :id="headingId" ref="heading" tabindex="-1" class="text-lg font-semibold focus:outline-none">Booking confirmed</h2>
      </div>
      <p class="mt-1 text-sm text-ink">{{ booking.room.name }} is yours for this slot. No one else can book it.</p>
      <div class="confirmation-slot mt-4 rounded-control bg-data-tint px-4 py-3">
        <p class="confirmation-slot-time text-2xl font-semibold tracking-tight text-data">{{ formatTimeRange(parisTimeOf(booking.start), formatEndTime(booking.end)) }}</p>
        <p class="mt-0.5 text-sm text-ink">{{ formatDay(parisDateOf(booking.start)) }} <span class="whitespace-nowrap text-muted">(Paris time)</span></p>
      </div>
      <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        <dt class="text-muted">Room</dt>
        <dd class="font-medium">{{ booking.room.name }}</dd>
        <dt class="text-muted">Name</dt>
        <dd class="break-words">{{ booking.bookerName }}</dd>
      </dl>
      <p class="mt-4 text-sm text-muted">Bookings are final and can't be changed or cancelled.</p>
      <button
        type="button"
        class="mt-4 h-9 rounded-control border border-control bg-surface px-4 text-sm font-medium hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="$emit('another')"
      >
        Book another room
      </button>
    </section>
  </Transition>
</template>

<style scoped>
.confirmation-check-ring {
  stroke-dasharray: 63;
  stroke-dashoffset: 63;
  animation: confirmation-draw 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.confirmation-check-mark {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: confirmation-draw 0.25s 0.25s ease-out forwards;
}

.confirmation-slot {
  animation: confirmation-fill 0.45s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.confirmation-slot-time {
  animation: confirmation-settle 0.3s 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes confirmation-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes confirmation-fill {
  from {
    clip-path: inset(0 100% 0 0 round 6px);
  }
  to {
    clip-path: inset(0 0 0 0 round 6px);
  }
}

@keyframes confirmation-settle {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .confirmation-check-ring,
  .confirmation-check-mark {
    animation: none;
    stroke-dashoffset: 0;
  }

  .confirmation-slot,
  .confirmation-slot-time {
    animation: none;
  }
}
</style>
