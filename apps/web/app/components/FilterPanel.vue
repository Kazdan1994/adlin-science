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
const activeCount = computed(() => (props.filters.minCapacity !== undefined ? 1 : 0) + props.filters.equipment.length)
// On a phone the filters fold away so the first rooms show on the first screen.
const open = ref(false)

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
  <div>
    <div class="flex items-center justify-between gap-3">
      <h2 :id="`${id}-title`" class="text-base font-semibold">
        Filters <span v-if="activeCount > 0" class="font-normal text-muted">({{ activeCount }})</span>
      </h2>
      <button
        type="button"
        class="h-8 rounded-control px-2 text-sm font-medium hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
        :aria-expanded="open"
        :aria-controls="`${id}-body`"
        @click="open = !open"
      >
        {{ open ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>
    <fieldset :id="`${id}-body`" :aria-labelledby="`${id}-title`" class="mt-3 space-y-4" :class="open ? 'block' : 'hidden lg:block'">
      <div>
        <label :for="`${id}-seats`" class="text-sm font-medium">Minimum seats</label>
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
          class="mt-1.5 block h-9 w-full rounded-control border border-control bg-surface px-3 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-negative"
          :aria-invalid="seatsError ? 'true' : undefined"
          :aria-describedby="`${id}-seats-hint`"
          @input="seatsText = ($event.target as HTMLInputElement).value"
          @change="onSeatsChange"
        >
        <p :id="`${id}-seats-hint`" class="mt-1.5 text-sm" :class="seatsError ? 'text-negative' : 'text-muted'">
          {{ seatsError ?? (maxCapacity > 0 ? `The largest room seats ${maxCapacity}.` : '') }}
        </p>
      </div>
      <fieldset v-if="equipmentOptions.length > 0">
        <legend class="text-sm font-medium">Equipment</legend>
        <div class="mt-2 grid gap-2">
          <label v-for="name in equipmentOptions" :key="name" class="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              class="h-4 w-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :checked="filters.equipment.includes(name)"
              @change="toggleEquipment(name, ($event.target as HTMLInputElement).checked)"
            >
            {{ name }}
          </label>
        </div>
      </fieldset>
      <button
        type="button"
        :disabled="!active"
        class="h-8 rounded-control border border-control bg-surface px-3 text-sm font-medium hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-muted"
        @click="clearFromPanel"
      >
        Clear filters
      </button>
    </fieldset>
  </div>
</template>
