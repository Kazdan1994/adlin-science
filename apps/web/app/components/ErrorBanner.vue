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
    class="flex flex-col gap-3 rounded-card bg-negative-tint px-4 py-3.5 text-negative-ink focus:outline-none sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="flex items-start gap-2.5 text-sm">
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
      class="h-8 shrink-0 rounded-control border border-negative-ink/30 bg-surface px-3 text-sm font-medium text-negative-ink hover:border-negative-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negative-ink"
      @click="$emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
