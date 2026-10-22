<script setup lang="ts">
import type { FilterCriteria } from '~/composables/useAvailability'

const MIN_SEATS = 1
const MAX_SEATS = 1000

const props = defineProps<{
  filters: FilterCriteria
  equipmentOptions: readonly string[]
  maxCapacity: number
}>()
const emit = defineEmits<{ update: [filters: FilterCriteria] }>()

const id = useId()
const seatsError = ref<string | null>(null)
// Local text so an invalid entry stays on screen while the list falls back to any size.
const seatsText = ref(props.filters.minCapacity?.toString() ?? '')
const seatsInput = useTemplateRef<HTMLInputElement>('seatsInput')
const active = computed(() => props.filters.minCapacity !== undefined || props.filters.equipment.length > 0)

function onSeatsChange(): void {
  const raw = seatsText.value.trim()
  if (raw === '') {
    seatsError.value = null
    emit('update', { ...props.filters, minCapacity: undefined })
    return
  }
  const seats = Number(raw)
  if (!Number.isInteger(seats) || seats < MIN_SEATS || seats > MAX_SEATS) {
    seatsError.value = `Enter a whole number from ${MIN_SEATS} to ${MAX_SEATS}. Showing rooms of any size.`
    if (props.filters.minCapacity !== undefined) emit('update', { ...props.filters, minCapacity: undefined })
    return
  }
  seatsError.value = null
  emit('update', { ...props.filters, minCapacity: seats })
}

function toggleEquipment(name: string, checked: boolean): void {
  const rest = props.filters.equipment.filter((item) => item !== name)
  emit('update', { ...props.filters, equipment: checked ? [...rest, name] : rest })
}

function clear(): void {
  seatsError.value = null
  seatsText.value = ''
  emit('update', { minCapacity: undefined, equipment: [] })
}

// The button disables itself once nothing is filtered, so focus moves back to the first filter.
function clearFromPanel(): void {
  clear()
  seatsInput.value?.focus()
}

defineExpose({ clear })
</script>

<template>
  <fieldset class="rounded-lg border border-slate-200 bg-white p-4">
    <legend class="px-1 font-medium">Filter rooms</legend>
    <div class="grid gap-4 sm:grid-cols-[12rem_1fr]">
      <div>
        <label :for="`${id}-seats`" class="font-medium">Minimum seats</label>
        <input
          :id="`${id}-seats`"
          ref="seatsInput"
          type="number"
          inputmode="numeric"
          :min="MIN_SEATS"
          :max="MAX_SEATS"
          step="1"
          placeholder="Any"
          :value="seatsText"
          class="mt-1 block w-full rounded-md border border-slate-400 bg-white px-3 py-2 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 aria-[invalid=true]:border-red-700"
          :aria-invalid="seatsError ? 'true' : undefined"
          :aria-describedby="`${id}-seats-hint`"
          @input="seatsText = ($event.target as HTMLInputElement).value"
          @change="onSeatsChange"
        >
        <p :id="`${id}-seats-hint`" class="mt-1 text-sm" :class="seatsError ? 'text-red-800' : 'text-slate-700'">
          {{ seatsError ?? (maxCapacity > 0 ? `The largest room seats ${maxCapacity}.` : '') }}
        </p>
      </div>
      <fieldset v-if="equipmentOptions.length > 0">
        <legend class="font-medium">Equipment</legend>
        <div class="mt-1 flex flex-wrap gap-x-5 gap-y-2">
          <label v-for="name in equipmentOptions" :key="name" class="flex items-center gap-2">
            <input
              type="checkbox"
              class="h-5 w-5 accent-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              :checked="filters.equipment.includes(name)"
              @change="toggleEquipment(name, ($event.target as HTMLInputElement).checked)"
            >
            {{ name }}
          </label>
        </div>
      </fieldset>
    </div>
    <button
      type="button"
      :disabled="!active"
      class="mt-4 rounded-md border border-slate-500 px-4 py-2 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      @click="clearFromPanel"
    >
      Clear filters
    </button>
  </fieldset>
</template>
