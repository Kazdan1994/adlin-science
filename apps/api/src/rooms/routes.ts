import { availableRoomsQuerySchema } from '@adlin/shared'
import { Router } from 'express'
import type { Database } from '../db'
import { serviceUnavailable } from '../http/errors'
import { parseQuery } from '../http/validate'
import { listAvailable } from './availability'
import { distinctEquipment, listRooms } from './repository'

export function createRoomsRouter(database: Database, now: () => Date): Router {
  const { db, rooms } = database
  const router = Router()

  router.get('/health', async (req, res) => {
    try {
      await db.command({ ping: 1 })
    } catch (error) {
      req.log.error({ err: error, reqId: req.id }, 'Health check failed')
      throw serviceUnavailable()
    }
    res.json({ status: 'ok' })
  })

  router.get('/rooms', async (_req, res) => {
    const [roomList, equipment] = await Promise.all([listRooms(rooms), distinctEquipment(rooms)])
    res.json({ rooms: roomList, equipment })
  })

  router.get('/rooms/available', async (req, res) => {
    const query = parseQuery(availableRoomsQuerySchema, req.query)
    res.json({ rooms: await listAvailable(database, query, now()) })
  })

  return router
}
