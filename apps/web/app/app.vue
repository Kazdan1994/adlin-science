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

const column = 'mx-auto w-full max-w-page px-4 sm:px-6'
</script>

<template>
  <div class="min-h-dvh bg-ground font-sans text-ink">
    <a
      href="#main"
      class="sr-only rounded-control bg-surface px-3 py-2 font-medium text-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30"
    >
      Skip to main content
    </a>
    <header class="glass-nav sticky top-0 z-20">
      <div :class="column" class="flex h-11 items-center justify-between">
        <p class="flex items-center gap-2 text-callout font-semibold">
          <svg class="size-4.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M4.75 17.25V3.75a1 1 0 0 1 1-1h8.5a1 1 0 0 1 1 1v13.5" />
            <path d="M2.75 17.25h14.5" stroke-linecap="round" />
            <circle cx="12.25" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          Meeting rooms
        </p>
        <p class="text-caption text-muted">
          Paris time <time class="font-medium text-ink">{{ parisNow }}</time>
        </p>
      </div>
    </header>
    <main id="main" tabindex="-1" :class="column" class="pb-20 pt-10 focus:outline-none sm:pt-14">
      <div class="mb-8 text-center sm:mb-12">
        <h1 class="text-hero font-semibold sm:text-hero-lg">Book a meeting room</h1>
        <p class="mx-auto mt-3 max-w-xl text-balance text-body text-muted sm:text-title3">
          Every time is Paris time. Slots run in {{ SLOT_MINUTES }}-minute steps, up to {{ HORIZON_DAYS }} days ahead.
        </p>
      </div>
      <NuxtPage />
    </main>
  </div>
</template>
