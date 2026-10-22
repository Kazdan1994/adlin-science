import { type AvailableRoomsQuery, type Room, validateSlot } from '@adlin/shared'
import { bookedRoomSlugs } from '../bookings/repository'
import type { Database } from '../db'
import { unknownEquipment, validationError } from '../http/errors'
import { distinctEquipment, listRoomsExcluding } from './repository'

export async function listAvailable({ bookings, rooms }: Database, query: AvailableRoomsQuery, now: Date): Promise<Room[]> {
  const slot = validateSlot(query.start, query.end, now)
  if (!slot.ok) throw validationError(slot.fields)

  const { minCapacity, equipment } = query
  if (equipment) {
    const known = new Set(await distinctEquipment(rooms))
    const unknown = equipment.filter((name) => !known.has(name))
    if (unknown.length > 0) throw unknownEquipment(unknown)
  }

  const booked = await bookedRoomSlugs(bookings, new Date(query.start), new Date(query.end))
  return listRoomsExcluding(rooms, booked, { minCapacity, equipment })
}
