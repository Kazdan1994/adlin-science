<script setup lang="ts">
import { bookerNameSchema, type Room } from '@adlin/shared'
import type { SearchCriteria } from '~/composables/useAvailability'
import type { ApiRequestError } from '~/utils/api'

const props = defineProps<{ room: Room; timeSlot: SearchCriteria; error: ApiRequestError | null }>()
const emit = defineEmits<{ confirm: [bookerName: string]; close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()
const nameId = useId()
const nameErrorId = useId()
const bookerName = ref('')
const localNameError = ref<string | null>(null)

const nameError = computed(() => localNameError.value ?? props.error?.fields?.bookerName ?? null)
const bannerError = computed(() => (props.error && !props.error.fields?.bookerName ? props.error : null))

// showModal() gives the focus trap, Esc to close and focus return to the "Book" button.
onMounted(() => dialog.value?.showModal())

function onSubmit(): void {
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
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    class="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg p-6 backdrop:bg-slate-900/60"
    @close="emit('close')"
  >
    <form novalidate class="space-y-4" @submit.prevent="onSubmit">
      <h2 :id="titleId" class="text-xl font-semibold">Book {{ room.name }}</h2>
      <p>
        {{ formatDay(timeSlot.date) }}, {{ formatTimeRange(timeSlot.startTime, timeSlot.endTime) }}
        <span class="text-slate-700">(Paris time)</span>
      </p>

      <div>
        <label :for="nameId" class="font-medium">Your name</label>
        <input
          :id="nameId"
          v-model="bookerName"
          type="text"
          required
          maxlength="80"
          autocomplete="name"
          autofocus
          class="mt-1 block w-full rounded-md border border-slate-400 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 aria-[invalid=true]:border-red-700"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? nameErrorId : undefined"
        >
        <p v-if="nameError" :id="nameErrorId" class="mt-1 text-sm text-red-800">{{ nameError }}</p>
      </div>

      <ErrorBanner v-if="bannerError" :code="bannerError.code" />

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-md border border-slate-500 px-4 py-2 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          @click="dialog?.close()"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Confirm booking
        </button>
      </div>
    </form>
  </dialog>
</template>
