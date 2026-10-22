<script setup lang="ts">
import {
  addDays,
  endTimeOptions,
  HORIZON_DAYS,
  parisTodayYmd,
  startTimeOptions,
  toUtcInstant,
  validateSlot,
} from '@adlin/shared'
import type { SlotCriteria } from '~/composables/useAvailability'

const props = defineProps<{ criteria: SlotCriteria; busy: boolean }>()
const emit = defineEmits<{ search: [criteria: SlotCriteria] }>()

const id = useId()
const today = parisTodayYmd(new Date())
const maxDate = addDays(today, HORIZON_DAYS)

const date = ref(props.criteria.date)
const startTime = ref(props.criteria.startTime)
const endTime = ref(props.criteria.endTime)
const errors = ref<{ start?: string; end?: string }>({})

const isDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)
const startOptions = computed(() => (isDate(date.value) ? startTimeOptions(date.value) : []))
const endOptions = computed(() =>
  startOptions.value.includes(startTime.value) ? endTimeOptions(date.value, startTime.value) : [],
)

// Keep the selects on times that exist for the chosen day (e.g. the spring-forward gap).
watch(startOptions, (options) => {
  if (options.includes(startTime.value)) return
  const next = options.find((time) => time > startTime.value) ?? options[0]
  if (next) startTime.value = next
})
watch(endOptions, (options) => {
  if (options.includes(endTime.value)) return
  const next = options[3] ?? options[options.length - 1]
  if (next) endTime.value = next
})

function onSubmit(): void {
  if (!isDate(date.value)) {
    errors.value = { start: 'Choose a date.' }
    return
  }
  const result = validateSlot(toUtcInstant(date.value, startTime.value), toUtcInstant(date.value, endTime.value), new Date())
  if (!result.ok) {
    errors.value = result.fields
    return
  }
  errors.value = {}
  emit('search', { date: date.value, startTime: startTime.value, endTime: endTime.value })
}

const field =
  'mt-1 block w-full rounded-md border border-slate-400 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 aria-[invalid=true]:border-red-700'
</script>

<template>
  <form class="rounded-lg border border-slate-200 bg-white p-4" novalidate @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-3">
      <div>
        <label :for="`${id}-date`" class="font-medium">Date</label>
        <input :id="`${id}-date`" v-model="date" type="date" :min="today" :max="maxDate" required :class="field">
      </div>
      <div>
        <label :for="`${id}-start`" class="font-medium">Start</label>
        <select
          :id="`${id}-start`"
          v-model="startTime"
          :class="field"
          :aria-invalid="errors.start ? 'true' : undefined"
          :aria-describedby="errors.start ? `${id}-start-error` : undefined"
        >
          <option v-for="time in startOptions" :key="time" :value="time">{{ time }}</option>
        </select>
        <p v-if="errors.start" :id="`${id}-start-error`" class="mt-1 text-sm text-red-800">{{ errors.start }}</p>
      </div>
      <div>
        <label :for="`${id}-end`" class="font-medium">End</label>
        <select
          :id="`${id}-end`"
          v-model="endTime"
          :class="field"
          :aria-invalid="errors.end ? 'true' : undefined"
          :aria-describedby="errors.end ? `${id}-end-error` : undefined"
        >
          <option v-for="time in endOptions" :key="time" :value="time">{{ time }}</option>
        </select>
        <p v-if="errors.end" :id="`${id}-end-error`" class="mt-1 text-sm text-red-800">{{ errors.end }}</p>
      </div>
    </div>
    <button
      type="submit"
      :disabled="busy"
      class="mt-4 rounded-md bg-blue-700 px-5 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Search
    </button>
  </form>
</template>
