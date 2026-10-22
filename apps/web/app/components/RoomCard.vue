<script setup lang="ts">
import type { Room } from '@adlin/shared'

defineProps<{ room: Room }>()
defineEmits<{ book: [room: Room] }>()
</script>

<template>
  <li class="grid grid-cols-[minmax(0,1fr)_3.5rem_auto] items-center gap-x-4 border-b border-rule px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem_auto]">
    <div class="min-w-0">
      <h3 class="break-words text-[15px] font-medium">{{ room.name }}</h3>
      <p class="mt-0.5 text-sm text-muted sm:hidden">
        <template v-if="room.equipment.length > 0">{{ room.equipment.join(' · ') }}</template>
        <template v-else>No equipment</template>
      </p>
    </div>
    <p class="hidden text-sm text-muted sm:block">
      <template v-if="room.equipment.length > 0">
        <span v-for="(item, index) in room.equipment" :key="item" class="whitespace-nowrap">{{ index > 0 ? ' · ' : '' }}{{ item }}</span>
      </template>
      <template v-else>None</template>
    </p>
    <p class="text-right text-sm">
      <span class="text-base font-semibold">{{ room.capacity }}</span>
      <span class="sr-only"> seats</span>
    </p>
    <button
      type="button"
      :aria-label="`Book ${room.name}`"
      class="h-11 shrink-0 sm:h-8 rounded-control border border-control bg-surface px-3 text-sm font-medium hover:border-primary active:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('book', room)"
    >
      Book
    </button>
  </li>
</template>
