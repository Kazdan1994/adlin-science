import { pino } from 'pino'
import { createApp } from './app'
import { ConfigError, loadConfig } from './config'
import { connect, ensureIndexes } from './db'
import { seedRooms } from './rooms/seed'

async function main(): Promise<void> {
  const config = loadConfig()
  const logger = pino({ level: config.logLevel })

  const database = await connect(config.mongodbUri, config.mongodbDb)
  await ensureIndexes(database)
  await seedRooms(database.rooms, config.roomsFile)

  const app = createApp({ database, config, logger, now: () => new Date() })
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'API listening')
  })

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down')
    server.close(() => {
      database.client
        .close()
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          logger.error({ err: error }, 'Failed to close the MongoDB client')
          process.exit(1)
        })
    })
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((error: unknown) => {
  if (error instanceof ConfigError) {
    process.stderr.write(`${error.message}\n`)
  } else {
    process.stderr.write(`API failed to start: ${error instanceof Error ? error.stack : String(error)}\n`)
  }
  process.exit(1)
})
