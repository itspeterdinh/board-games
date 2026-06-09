// Marks all bots as ready and advances night phase if everyone is ready
// Usage: node scripts/bot-ready.js <roomId>

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDOSoDkZ_90Df5UrS_6FNAtBRMSjeOnV_o',
  authDomain: 'doc-791f8.firebaseapp.com',
  projectId: 'doc-791f8',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const roomId = process.argv[2]
if (!roomId) { console.error('Usage: node scripts/bot-ready.js <roomId>'); process.exit(1) }

const ref = doc(db, 'rooms', roomId)
const snap = await getDoc(ref)
if (!snap.exists()) { console.error('Room not found'); process.exit(1) }

const room = snap.data()
if (room.status !== 'night') {
  console.log(`Room status is "${room.status}", not "night" — nothing to do.`)
  process.exit(0)
}

const botIds = room.players.filter(p => p.isBot).map(p => p.id)
if (botIds.length === 0) { console.log('No bots in room.'); process.exit(0) }

const alreadyReady = room.nightReady || []
const newReady = [...new Set([...alreadyReady, ...botIds])]
const update = { nightReady: newReady }

// If all players are now ready, advance to propose
if (newReady.length >= room.players.length) {
  update.status = 'propose'
  update.nightReady = []
  console.log('All players ready — advancing to propose phase.')
}

await updateDoc(ref, update)
console.log(`✓ Marked ${botIds.length} bots as ready: ${botIds.join(', ')}`)
process.exit(0)
