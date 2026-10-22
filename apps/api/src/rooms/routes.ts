import { Router } from 'express'
import type { Database } from '../db'
import { serviceUnavailable } from '../http/errors'
import { distinctEquipment, listRooms } from './repository'

export function createRoomsRouter({ db, rooms }: Database): Router {
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

  return router
}
