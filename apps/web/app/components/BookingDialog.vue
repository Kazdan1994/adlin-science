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
    class="booking-sheet m-auto w-sheet max-w-sheet rounded-sheet bg-surface p-6 text-ink shadow-sheet sm:p-8"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="onSubmit">
      <h2 :id="titleId" class="text-title1 font-semibold">Book {{ room.name }}</h2>
      <p class="mt-1 text-subhead text-muted">{{ roomFacts }}</p>

      <div class="mt-4 rounded-control bg-data-tint px-4 py-3">
        <p class="text-large-title font-semibold text-data">{{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</p>
        <p class="mt-0.5 text-callout text-ink">{{ formatDay(timeSlot.date) }} <span class="whitespace-nowrap text-muted">(Paris time)</span></p>
      </div>

      <div class="mt-5">
        <label :for="nameId" class="text-callout font-medium">Your name</label>
        <input
          :id="nameId"
          ref="nameInput"
          v-model="bookerName"
          type="text"
          required
          maxlength="80"
          autocomplete="name"
          autofocus
          class="mt-1.5 block h-11 w-full rounded-control border border-control bg-surface px-3.5 text-body sm:h-10 sm:text-subhead focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary aria-invalid:border-negative"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? nameErrorId : undefined"
        >
        <p v-if="nameError" :id="nameErrorId" class="mt-1.5 text-callout text-negative">{{ nameError }}</p>
      </div>

      <ErrorBanner v-if="bannerError" :code="bannerError.code" class="mt-4" />

      <p class="mt-5 text-callout text-ink">Once confirmed, this slot is yours: no one else can book this room for it.</p>
      <p class="mt-0.5 text-callout text-muted">Bookings are final and can't be changed or cancelled.</p>

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="h-11 sm:h-10 rounded-pill bg-raised px-4 text-callout font-medium text-ink hover:bg-line transition-transform duration-100 ease-out active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          @click="dialog?.close()"
        >
          Cancel
        </button>
        <button
          type="submit"
          :aria-disabled="submitting"
          class="h-11 sm:h-10 rounded-pill bg-primary px-5 text-callout font-medium text-white hover:bg-primary-hover transition-transform duration-100 ease-out active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-wait aria-disabled:bg-primary-hover aria-disabled:active:scale-100"
        >
          <template v-if="submitting">Booking…</template>
          <template v-else>Confirm booking<span class="hidden sm:inline"> · {{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}</span></template>
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
/*
 * The sheet grows into place on a critically damped curve while the blurred scrim fades in behind it.
 * The sheet itself stays opaque so its text keeps full contrast from the first frame.
 */
.booking-sheet[open] {
  transform: scale(1);
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);

  @starting-style {
    transform: scale(0.96);
  }
}

.booking-sheet[open]::backdrop {
  background-color: rgb(0 0 0 / 0.32);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 1;
  transition: opacity 0.3s ease-out;

  @starting-style {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .booking-sheet[open] {
    transform: none;
    transition: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .booking-sheet[open]::backdrop {
    background-color: rgb(0 0 0 / 0.5);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>
