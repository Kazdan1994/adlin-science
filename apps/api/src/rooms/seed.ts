import { readFile } from 'node:fs/promises'
import { roomSlugSchema } from '@adlin/shared'
import type { Collection } from 'mongodb'
import { z } from 'zod'
import type { RoomDoc } from '../db'

const roomsFileSchema = z.object({
  rooms: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string(),
      capacity: z.number().int().min(1),
      equipements: z.array(z.object({ name: z.string().min(1) })),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
})

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function readRoomDocs(file: string): Promise<RoomDoc[]> {
  const parsed = roomsFileSchema.parse(JSON.parse(await readFile(file, 'utf8')))
  const seen = new Set<string>()

  return parsed.rooms.map((room) => {
    const slug = roomSlugSchema.parse(slugify(room.name))
    if (seen.has(slug)) throw new Error(`Duplicate room slug "${slug}" in ${file}`)
    seen.add(slug)

    return {
      slug,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      equipment: room.equipements.map((equipment) => equipment.name),
      sourceCreatedAt: room.createdAt,
      sourceUpdatedAt: room.updatedAt,
    }
  })
}

export async function seedRooms(rooms: Collection<RoomDoc>, file: string): Promise<void> {
  const docs = await readRoomDocs(file)
  if (docs.length === 0) return

  await rooms.bulkWrite(
    docs.map((doc) => ({
      updateOne: { filter: { slug: doc.slug }, update: { $set: doc }, upsert: true },
    })),
  )
}
