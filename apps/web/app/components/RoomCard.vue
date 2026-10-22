<script setup lang="ts">
import type { Room } from '@adlin/shared'

defineProps<{ room: Room }>()
defineEmits<{ book: [room: Room] }>()
</script>

<template>
  <li class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="min-w-0">
      <h3 class="text-lg font-semibold">{{ room.name }}</h3>
      <p class="text-sm text-slate-700">Seats {{ room.capacity }}</p>
      <ul v-if="room.equipment.length > 0" class="mt-2 flex flex-wrap gap-2" aria-label="Equipment">
        <li v-for="item in room.equipment" :key="item" class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">
          {{ item }}
        </li>
      </ul>
      <p v-else class="mt-2 text-sm text-slate-700">No equipment</p>
    </div>
    <button
      type="button"
      :aria-label="`Book ${room.name}`"
      class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      @click="$emit('book', room)"
    >
      Book
    </button>
  </li>
</template>
