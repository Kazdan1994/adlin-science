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
      <div :class="column" class="flex h-14 items-center justify-between">
        <p class="flex items-center gap-3 text-subhead font-bold">
          <span class="grid size-8 place-items-center bg-data-tint text-title3 font-extrabold leading-none text-ink" aria-hidden="true">R</span>
          Meeting rooms
        </p>
        <p class="text-subhead text-plate-muted">
          Paris <time class="ml-1 text-title3 font-bold text-plate-ink">{{ parisNow }}</time>
        </p>
      </div>
    </header>
    <main id="main" tabindex="-1" :class="column" class="pb-24 pt-10 focus:outline-none sm:pt-16">
      <div class="mb-10 grid grid-cols-1 gap-5 sm:mb-14 lg:grid-cols-12 lg:items-end lg:gap-5">
        <h1 class="min-w-0 text-hero font-extrabold [overflow-wrap:anywhere] sm:text-hero-lg lg:col-span-8">Book a meeting room</h1>
        <p class="max-w-md text-pretty text-title3 font-normal text-ink lg:col-span-4 lg:pb-2">
          Every time is Paris time. Slots run in {{ SLOT_MINUTES }}-minute steps, up to {{ HORIZON_DAYS }} days ahead.
        </p>
      </div>
      <NuxtPage />
    </main>
  </div>
</template>
