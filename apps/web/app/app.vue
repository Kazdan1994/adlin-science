<script setup lang="ts">
import { HORIZON_DAYS, parisTimeOf, SLOT_MINUTES } from '@adlin/shared'

const parisNow = ref(parisTimeOf(new Date()))
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  clock = setInterval(() => {
    parisNow.value = parisTimeOf(new Date())
  }, 15_000)
})
onBeforeUnmount(() => clearInterval(clock))

const column = 'mx-auto w-full max-w-[1100px] px-4 sm:px-6'
</script>

<template>
  <div class="min-h-dvh bg-ground font-sans text-ink">
    <a
      href="#main"
      class="sr-only rounded-control bg-surface px-3 py-2 font-medium text-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
    >
      Skip to main content
    </a>
    <header>
      <div :class="column" class="flex h-12 items-center justify-between">
        <p class="flex items-center gap-2 text-[15px] font-semibold">
          <svg class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M4.75 17.25V3.75a1 1 0 0 1 1-1h8.5a1 1 0 0 1 1 1v13.5" />
            <path d="M2.75 17.25h14.5" stroke-linecap="round" />
            <circle cx="12.25" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          Meeting rooms
        </p>
        <p class="text-sm text-muted">
          Paris time <time class="font-medium text-ink">{{ parisNow }}</time>
        </p>
      </div>
    </header>
    <main id="main" tabindex="-1" :class="column" class="pb-16 pt-6 focus:outline-none">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold tracking-[-0.01em]">Book a meeting room</h1>
        <p class="mt-1 text-sm text-muted">
          Every time is Paris time. Slots run in {{ SLOT_MINUTES }}-minute steps, up to {{ HORIZON_DAYS }} days ahead.
        </p>
      </div>
      <NuxtPage />
    </main>
  </div>
</template>
