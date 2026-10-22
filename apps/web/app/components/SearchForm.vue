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

const props = defineProps<{ criteria: SlotCriteria }>()
const emit = defineEmits<{ search: [criteria: SlotCriteria] }>()

const id = useId()
const today = parisTodayYmd(new Date())
const maxDate = addDays(today, HORIZON_DAYS)

const date = ref(props.criteria.date)
const startTime = ref(props.criteria.startTime)
const endTime = ref(props.criteria.endTime)
const errors = ref<{ start?: string; end?: string }>({})

const minutesOf = (hhmm: string): number => {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}
const toHHmm = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
// Moving the start keeps the length the user picked, so a new start never silently stretches the slot.
let durationMinutes = minutesOf(endTime.value) - minutesOf(startTime.value)
const rememberDuration = (): void => {
  durationMinutes = minutesOf(endTime.value) - minutesOf(startTime.value)
}

const isDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)
// Today only offers start times that have not passed yet.
const startOptions = computed(() => {
  if (!isDate(date.value)) return []
  const options = startTimeOptions(date.value)
  if (date.value !== parisTodayYmd(new Date())) return options
  const now = Date.now()
  return options.filter((time) => Date.parse(toUtcInstant(date.value, time)) >= now)
})
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
  const wanted = toHHmm(minutesOf(startTime.value) + durationMinutes)
  const next = options.includes(wanted) ? wanted : options.includes(endTime.value) ? endTime.value : options[options.length - 1]
  if (next && next !== endTime.value) endTime.value = next
})

// The results always follow the slot in the form, so it searches as soon as the slot changes.
watch([date, startTime, endTime], onSubmit, { flush: 'post' })

function onSubmit(): void {
  if (!isDate(date.value)) {
    errors.value = { start: 'Choose a date.' }
    return
  }
  if (startOptions.value.length === 0) {
    errors.value = { start: 'No start times are left today. Choose another date.' }
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
  'mt-1.5 block h-9 w-full rounded-control border border-control bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-negative'
</script>

<template>
  <form novalidate :aria-labelledby="`${id}-title`" @submit.prevent="onSubmit">
    <h2 :id="`${id}-title`" class="text-base font-semibold">When</h2>
    <div class="mt-3 grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label :for="`${id}-date`" class="text-sm font-medium">Date</label>
        <input :id="`${id}-date`" v-model="date" type="date" :min="today" :max="maxDate" required :class="field">
      </div>
      <div>
        <label :for="`${id}-start`" class="text-sm font-medium">Start</label>
        <select
          :id="`${id}-start`"
          v-model="startTime"
          :class="field"
          :aria-invalid="errors.start ? 'true' : undefined"
          :aria-describedby="errors.start ? `${id}-start-error` : undefined"
        >
          <option v-for="time in startOptions" :key="time" :value="time">{{ time }}</option>
        </select>
        <p v-if="errors.start" :id="`${id}-start-error`" class="mt-1.5 text-sm text-negative">{{ errors.start }}</p>
      </div>
      <div>
        <label :for="`${id}-end`" class="text-sm font-medium">End</label>
        <select
          :id="`${id}-end`"
          v-model="endTime"
          :class="field"
          :aria-invalid="errors.end ? 'true' : undefined"
          :aria-describedby="errors.end ? `${id}-end-error` : undefined"
          @change="rememberDuration"
        >
          <option v-for="time in endOptions" :key="time" :value="time">{{ time }}</option>
        </select>
        <p v-if="errors.end" :id="`${id}-end-error`" class="mt-1.5 text-sm text-negative">{{ errors.end }}</p>
      </div>
    </div>
  </form>
</template>
