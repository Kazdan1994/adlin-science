<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <a
      href="#main"
      class="sr-only rounded bg-white px-3 py-2 font-medium text-blue-800 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
    >
      Skip to main content
    </a>
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-3xl px-4 py-4">
        <h1 class="text-xl font-semibold">Book a meeting room</h1>
        <p class="text-sm text-slate-700">Times shown in Paris time (CET/CEST)</p>
      </div>
    </header>
    <main id="main" tabindex="-1" class="mx-auto max-w-3xl px-4 py-6">
      <NuxtPage />
    </main>
  </div>
</template>
