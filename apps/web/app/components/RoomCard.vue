<script setup lang="ts">
import type { Room } from '@adlin/shared'

defineProps<{ room: Room }>()
defineEmits<{ book: [room: Room] }>()
</script>

<template>
  <li class="grid grid-cols-(--grid-room-row) items-center gap-x-4 border-b border-rule px-4 py-4 sm:px-7 last:border-b-0 sm:grid-cols-(--grid-room-row-wide)">
    <div class="min-w-0">
      <h3 class="break-words text-body font-semibold">{{ room.name }}</h3>
      <p class="mt-0.5 text-callout text-muted sm:hidden">
        <template v-if="room.equipment.length > 0">{{ room.equipment.join(' · ') }}</template>
        <template v-else>No equipment</template>
      </p>
    </div>
    <p class="hidden text-callout text-muted sm:block">
      <template v-if="room.equipment.length > 0">
        <span v-for="(item, index) in room.equipment" :key="item" class="whitespace-nowrap">{{ index > 0 ? ' · ' : '' }}{{ item }}</span>
      </template>
      <template v-else>None</template>
    </p>
    <p class="text-right text-callout">
      <span class="text-body font-semibold">{{ room.capacity }}</span>
      <span class="sr-only"> seats</span>
    </p>
    <button
      type="button"
      :aria-label="`Book ${room.name}`"
      class="h-11 shrink-0 sm:h-8 rounded-pill bg-primary px-4 text-callout font-medium text-white transition-transform duration-100 ease-out hover:bg-primary-hover active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('book', room)"
    >
      Book
    </button>
  </li>
</template>
