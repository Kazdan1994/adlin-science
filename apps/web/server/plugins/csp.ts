import { createHash } from 'node:crypto'

// The SPA shell carries inline scripts (import map, runtime config) whose text changes with every build,
// so their hashes are computed per response instead of falling back to 'unsafe-inline'.
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g

function scriptHashes(html: string): string[] {
  return [...html.matchAll(INLINE_SCRIPT)].map(([, code]) => `'sha256-${createHash('sha256').update(code ?? '').digest('base64')}'`)
}

export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) return // the dev server needs inline styles and a HMR websocket

  const apiOrigin = new URL(useRuntimeConfig().public.apiBase).origin
  nitroApp.hooks.hook('render:response', (response) => {
    if (typeof response.body !== 'string') return
    const policy = [
      "default-src 'self'",
      ['script-src', "'self'", ...scriptHashes(response.body)].join(' '),
      `connect-src 'self' ${apiOrigin}`,
      "img-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; ')
    response.headers = { ...response.headers, 'content-security-policy': policy }
  })
})
