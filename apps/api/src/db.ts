import { type Collection, type Db, MongoClient } from 'mongodb'

export interface RoomDoc {
  slug: string
  name: string
  description: string
  capacity: number
  equipment: string[]
  sourceCreatedAt: Date
  sourceUpdatedAt: Date
}

export interface BookingDoc {
  roomSlug: string
  start: Date
  end: Date
  slotStarts: Date[]
  bookerName: string
  createdAt: Date
}

export interface Database {
  client: MongoClient
  db: Db
  rooms: Collection<RoomDoc>
  bookings: Collection<BookingDoc>
}

export async function connect(uri: string, dbName: string): Promise<Database> {
  const client = await new MongoClient(uri).connect()
  const db = client.db(dbName)
  return {
    client,
    db,
    rooms: db.collection<RoomDoc>('rooms'),
    bookings: db.collection<BookingDoc>('bookings'),
  }
}

export async function ensureIndexes(database: Database): Promise<void> {
  await database.rooms.createIndex({ slug: 1 }, { unique: true, name: 'slug' })
}
