<script setup lang="ts">
import { bookerNameSchema, type Room } from '@adlin/shared'
import type { SlotCriteria } from '~/composables/useAvailability'
import type { ApiRequestError } from '~/utils/api'

const props = defineProps<{ room: Room; timeSlot: SlotCriteria; error: ApiRequestError | null; submitting: boolean }>()
const emit = defineEmits<{ confirm: [bookerName: string]; close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()
const nameId = useId()
const nameErrorId = useId()
const bookerName = ref('')
const localNameError = ref<string | null>(null)
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')

const roomFacts = computed(() => [`${props.room.capacity} seats`, ...props.room.equipment].join(' · '))
const nameError = computed(() => localNameError.value ?? props.error?.fields?.bookerName ?? null)
const bannerError = computed(() => (props.error && !props.error.fields?.bookerName ? props.error : null))

onMounted(() => dialog.value?.showModal())

watch(nameError, async (error) => {
  if (!error) return
  await nextTick()
  nameInput.value?.focus()
})

function onSubmit(): void {
  if (props.submitting) return
  const parsed = bookerNameSchema.safeParse(bookerName.value)
  if (!parsed.success) {
    localNameError.value = parsed.error.issues[0]?.message ?? 'Enter your name.'
    return
  }
  localNameError.value = null
  emit('confirm', parsed.data)
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-card bg-surface p-6 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.14)] backdrop:bg-ink/40"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="onSubmit">
      <h2 :id="titleId" class="text-lg font-semibold">Book {{ room.name }}</h2>
      <p class="mt-0.5 text-sm text-muted">{{ roomFacts }}</p>

      <div class="mt-4 rounded-control bg-data-tint px-4 py-3">
        <p class="text-2xl font-semibold tracking-tight text-data">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</p>
        <p class="mt-0.5 text-sm text-ink">{{ formatDay(timeSlot.date) }} <span class="whitespace-nowrap text-muted">(Paris time)</span></p>
      </div>

      <div class="mt-5">
        <label :for="nameId" class="text-sm font-medium">Your name</label>
        <input
          :id="nameId"
          ref="nameInput"
          v-model="bookerName"
          type="text"
          required
          maxlength="80"
          autocomplete="name"
          autofocus
          class="mt-1.5 block h-11 w-full rounded-control border border-control bg-surface px-3 text-base sm:h-9 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-negative"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? nameErrorId : undefined"
        >
        <p v-if="nameError" :id="nameErrorId" class="mt-1.5 text-sm text-negative">{{ nameError }}</p>
      </div>

      <ErrorBanner v-if="bannerError" :code="bannerError.code" class="mt-4" />

      <p class="mt-5 text-sm text-ink">Once confirmed, this slot is yours: no one else can book this room for it.</p>
      <p class="mt-0.5 text-sm text-muted">Bookings are final and can't be changed or cancelled.</p>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="h-11 sm:h-9 rounded-control border border-control bg-surface px-4 text-sm font-medium hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="dialog?.close()"
        >
          Cancel
        </button>
        <button
          type="submit"
          :aria-disabled="submitting"
          class="h-11 sm:h-9 rounded-control bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-wait aria-disabled:bg-primary-hover"
        >
          <template v-if="submitting">Booking…</template>
          <template v-else>Confirm booking<span class="hidden sm:inline"> · {{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span></template>
        </button>
      </div>
    </form>
  </dialog>
</template>
