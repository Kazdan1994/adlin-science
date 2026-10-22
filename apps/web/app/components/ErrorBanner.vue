<script setup lang="ts">
import type { ApiErrorCode } from '~/utils/api'

defineProps<{ code: ApiErrorCode; roomName?: string; retryable?: boolean }>()
defineEmits<{ retry: [] }>()

const banner = useTemplateRef<HTMLElement>('banner')
defineExpose({ focus: () => banner.value?.focus() })
</script>

<template>
  <div
    ref="banner"
    role="alert"
    tabindex="-1"
    class="flex flex-col gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 sm:flex-row sm:items-center sm:justify-between"
  >
    <p>{{ messageForError(code, roomName) }}</p>
    <button
      v-if="retryable"
      type="button"
      class="rounded-md border border-red-800 px-4 py-2 font-medium text-red-900 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
      @click="$emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
