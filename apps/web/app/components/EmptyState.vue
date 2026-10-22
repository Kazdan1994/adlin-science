<script setup lang="ts">
const props = defineProps<{ filtered: boolean; minCapacity: number | undefined; maxCapacity: number }>()
defineEmits<{ clear: [] }>()

const message = computed(() => {
  if (!props.filtered) return 'No room is free for this time. Try another time.'
  if (props.minCapacity !== undefined && props.maxCapacity > 0 && props.minCapacity > props.maxCapacity) {
    return `No room seats ${props.minCapacity}. The largest room seats ${props.maxCapacity}.`
  }
  return 'No room matches these filters. Try fewer filters or another time.'
})
</script>

<template>
  <div class="flex flex-col items-start gap-3 rounded-card border border-dashed border-control px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm">{{ message }}</p>
    <button
      v-if="filtered"
      type="button"
      class="h-8 shrink-0 rounded-control border border-control bg-surface px-3 text-sm font-medium hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('clear')"
    >
      Remove filters
    </button>
  </div>
</template>
