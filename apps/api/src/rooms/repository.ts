import type { Room } from '@adlin/shared'
import type { Collection } from 'mongodb'
import type { RoomDoc } from '../db'

function toRoom(doc: RoomDoc): Room {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    capacity: doc.capacity,
    equipment: doc.equipment,
  }
}

export async function listRooms(rooms: Collection<RoomDoc>): Promise<Room[]> {
  const docs = await rooms.find({}).sort({ capacity: 1, name: 1 }).toArray()
  return docs.map(toRoom)
}

export async function listRoomsExcluding(rooms: Collection<RoomDoc>, excludedSlugs: readonly string[]): Promise<Room[]> {
  const docs = await rooms
    .find({ slug: { $nin: [...excludedSlugs] } })
    .sort({ capacity: 1, name: 1 })
    .toArray()
  return docs.map(toRoom)
}

export async function findBySlug(rooms: Collection<RoomDoc>, slug: string): Promise<Room | null> {
  const doc = await rooms.findOne({ slug })
  return doc ? toRoom(doc) : null
}

export async function distinctEquipment(rooms: Collection<RoomDoc>): Promise<string[]> {
  const names = await rooms.distinct('equipment')
  return names.sort()
}
