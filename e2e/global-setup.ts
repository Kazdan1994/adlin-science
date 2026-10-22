import { MongoClient } from 'mongodb'
import { E2E_DB } from './constants'

// Only the bookings are cleared: the API has already seeded the rooms by the time this runs.
export default async function globalSetup(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set. Copy .env.example to .env or export it.')

  const client = await new MongoClient(uri).connect()
  try {
    await client.db(E2E_DB).collection('bookings').deleteMany({})
  } finally {
    await client.close()
  }
}
