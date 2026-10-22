import tailwindcss from '@tailwindcss/vite'

const DEFAULT_API_BASE = 'http://localhost:4000/api'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: { public: { apiBase: DEFAULT_API_BASE } },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    },
  },
  // The Content-Security-Policy header is set by server/plugins/csp.ts.
})
