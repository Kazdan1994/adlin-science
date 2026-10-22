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
    class="flex flex-col gap-3 rounded-card bg-negative-tint px-5 py-4 text-negative-ink focus:outline-none sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="flex items-start gap-2.5 text-subhead">
      <svg class="mt-0.5 h-4 w-4 shrink-0 text-negative" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.75v3.5" stroke-linecap="round" />
        <circle cx="8" cy="10.9" r="0.8" fill="currentColor" stroke="none" />
      </svg>
      {{ messageForError(code, roomName) }}
    </p>
    <button
      v-if="retryable"
      type="button"
      class="h-11 shrink-0 sm:h-8 rounded-pill bg-surface px-4 text-callout font-medium text-negative-ink hover:bg-negative-ink/5 transition-transform duration-100 ease-out active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negative-ink"
      @click="$emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
