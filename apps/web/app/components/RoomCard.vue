<script setup lang="ts">
import type { Room } from '@adlin/shared'

const props = defineProps<{ room: Room }>()
defineEmits<{ book: [room: Room] }>()

// A door plate shows the room's number when its name has one ("Salle #2"), else the initials of
// what follows "Salle" ("Salle de ouf" reads DO), so two rooms rarely share a plate.
const plateMark = computed(() => {
  const number = /#\s*(\d+)/.exec(props.room.name)?.[1]
  if (number) return number
  const words = props.room.name.trim().split(/\s+/).filter((word) => !/^salle$/i.test(word))
  const initials = words.slice(0, 2).map((word) => word[0]).join('')
  return (initials || '?').toUpperCase()
})
</script>

<template>
  <li class="room-row grid grid-cols-(--grid-room-row) items-center gap-x-4 bg-surface py-3 pl-3 pr-4 sm:gap-x-6 sm:pr-6 sm:grid-cols-(--grid-room-row-wide)">
    <span class="grid aspect-square place-items-center bg-plate text-[2rem] font-extrabold leading-none tracking-tight text-plate-ink sm:text-[2.75rem]" aria-hidden="true">
      {{ plateMark }}
    </span>
    <div class="min-w-0">
      <h3 class="break-words text-title2 font-bold">{{ room.name }}</h3>
      <p class="mt-0.5 text-callout text-muted sm:hidden">
        {{ room.capacity }} seats,
        <template v-if="room.equipment.length > 0">{{ room.equipment.join(', ') }}</template>
        <template v-else>No equipment</template>
      </p>
    </div>
    <p class="hidden text-subhead text-ink sm:block">
      <template v-if="room.equipment.length > 0">
        <span v-for="(item, index) in room.equipment" :key="item" class="whitespace-nowrap">{{ index > 0 ? ', ' : '' }}{{ item }}</span>
      </template>
      <template v-else><span class="text-muted">None</span></template>
    </p>
    <p class="hidden text-right sm:block">
      <span class="text-title1 font-extrabold">{{ room.capacity }}</span>
      <span class="sr-only"> seats</span>
    </p>
    <button
      type="button"
      :aria-label="`Book ${room.name}`"
      class="h-11 shrink-0 bg-primary px-5 text-subhead font-bold text-white transition-transform duration-100 ease-out hover:bg-data-tint hover:text-ink active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('book', room)"
    >
      Book
    </button>
  </li>
</template>
