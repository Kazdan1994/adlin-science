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
  <div class="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
    <p class="font-medium">{{ message }}</p>
    <button
      v-if="filtered"
      type="button"
      class="mt-4 rounded-md border border-slate-500 px-4 py-2 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      @click="$emit('clear')"
    >
      Remove filters
    </button>
  </div>
</template>
