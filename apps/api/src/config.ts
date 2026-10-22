import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const DEFAULT_ROOMS_FILE = fileURLToPath(new URL('../../../salles.json', import.meta.url))

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default('adlin'),
  WEB_ORIGIN: z.url(),
  ROOMS_FILE: z.string().min(1).default(DEFAULT_ROOMS_FILE),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export interface Config {
  readonly port: number
  readonly mongodbUri: string
  readonly mongodbDb: string
  readonly webOrigin: string
  readonly roomsFile: string
  readonly logLevel: string
}

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = configSchema.safeParse(env)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    throw new ConfigError(`Invalid environment configuration:\n${problems.join('\n')}`)
  }
  const values = parsed.data
  return {
    port: values.PORT,
    mongodbUri: values.MONGODB_URI,
    mongodbDb: values.MONGODB_DB,
    // Origin only, so the CORS check matches the browser's Origin header exactly.
    webOrigin: new URL(values.WEB_ORIGIN).origin,
    roomsFile: values.ROOMS_FILE,
    logLevel: values.LOG_LEVEL,
  }
}
