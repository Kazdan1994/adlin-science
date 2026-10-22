<script setup lang="ts">
const props = defineProps<{ filtered: boolean; minCapacity: number | undefined; maxCapacity: number }>()
defineEmits<{ clear: []; changeTime: [] }>()

const message = computed(() => {
  if (!props.filtered) return 'No room is free for this time. Try another time.'
  if (props.minCapacity !== undefined && props.maxCapacity > 0 && props.minCapacity > props.maxCapacity) {
    return `No room seats ${props.minCapacity}. The largest room seats ${props.maxCapacity}.`
  }
  return 'No room matches these filters. Try fewer filters or another time.'
})
</script>

<template>
  <div class="flex flex-col items-start gap-3 rounded-card bg-ground px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-subhead">{{ message }}</p>
    <button
      v-if="!filtered"
      type="button"
      class="h-11 shrink-0 rounded-pill bg-raised px-4 text-callout font-medium text-ink hover:bg-line transition-transform duration-100 ease-out active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-8"
      @click="$emit('changeTime')"
    >
      Change time
    </button>
    <button
      v-else
      type="button"
      class="h-11 shrink-0 sm:h-8 rounded-pill bg-raised px-4 text-callout font-medium text-ink hover:bg-line transition-transform duration-100 ease-out active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('clear')"
    >
      Remove filters
    </button>
  </div>
</template>
