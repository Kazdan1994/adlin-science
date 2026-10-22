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
    <header class="app-nav sticky top-0 z-20">
      <div :class="column" class="flex h-12 items-center justify-between">
        <p class="flex items-center gap-2 font-display text-callout font-semibold">
          <svg class="size-4.5 shrink-0 text-primary" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M4.75 17.25V3.75a1 1 0 0 1 1-1h8.5a1 1 0 0 1 1 1v13.5" />
            <path d="M2.75 17.25h14.5" stroke-linecap="round" />
            <circle cx="12.25" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          Meeting rooms
        </p>
        <p class="font-mono text-caption uppercase tracking-wider text-muted">
          Paris <time class="font-medium text-ink">{{ parisNow }}</time>
        </p>
      </div>
    </header>
    <main id="main" tabindex="-1" :class="column" class="pb-20 pt-8 focus:outline-none sm:pt-12">
      <div class="mb-8 grid grid-cols-1 gap-3 border-b border-line pb-8 sm:mb-10 lg:grid-cols-12 lg:items-end lg:gap-5">
        <h1 class="min-w-0 text-hero font-semibold [overflow-wrap:anywhere] sm:text-hero-lg lg:col-span-7">Book a meeting room</h1>
        <p class="max-w-xl text-pretty text-body text-muted lg:col-span-5 lg:pb-1">
          Every time is Paris time. Slots run in {{ SLOT_MINUTES }}-minute steps, up to {{ HORIZON_DAYS }} days ahead.
        </p>
      </div>
      <NuxtPage />
    </main>
  </div>
</template>
