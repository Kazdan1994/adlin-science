<script setup lang="ts">
import type { Room } from '@adlin/shared'

const props = defineProps<{ room: Room; maxCapacity: number }>()
defineEmits<{ book: [room: Room] }>()

// Seats as a share of the largest room, so a 5-seat room reads small next to a 26-seat one.
const seatsShare = computed(() => (props.maxCapacity > 0 ? `${(props.room.capacity / props.maxCapacity) * 100}%` : '0%'))
</script>

<template>
  <li class="flex items-center gap-4 border-b border-rule px-5 py-3.5 last:border-b-0">
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-[15px] font-medium">{{ room.name }}</h3>
      <p class="mt-0.5 text-sm text-muted">
        <template v-if="room.equipment.length > 0">
          <span v-for="(item, index) in room.equipment" :key="item" class="whitespace-nowrap">{{ index > 0 ? ' · ' : '' }}{{ item }}</span>
        </template>
        <template v-else>No equipment</template>
      </p>
    </div>
    <div class="w-20 shrink-0 text-right sm:w-28">
      <p class="text-sm"><span class="font-medium">{{ room.capacity }}</span> <span class="text-muted">seats</span></p>
      <div class="ml-auto mt-1.5 hidden h-0.5 w-full bg-line sm:block" aria-hidden="true">
        <div class="ml-auto h-full bg-muted" :style="{ width: seatsShare }" />
      </div>
    </div>
    <button
      type="button"
      :aria-label="`Book ${room.name}`"
      class="h-8 shrink-0 rounded-control border border-control bg-surface px-3 text-sm font-medium hover:border-primary active:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('book', room)"
    >
      Book
    </button>
  </li>
</template>
