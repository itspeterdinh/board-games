// Usage: node scripts/add-bots.js <roomId> <password>
// Example: node scripts/add-bots.js HH8UL0 123456

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDOSoDkZ_90Df5UrS_6FNAtBRMSjeOnV_o',
  authDomain: 'doc-791f8.firebaseapp.com',
  projectId: 'doc-791f8',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const BOT_NAMES = [
  'Merlin Bot', 'Lancelot Bot', 'Percival Bot', 'Galahad Bot',
  'Gawain Bot', 'Tristan Bot', 'Mordred Bot',
]

const roomId = process.argv[2]
const password = process.argv[3]

if (!roomId) { console.error('Usage: node scripts/add-bots.js <roomId> <password>'); process.exit(1) }

const ref = doc(db, 'rooms', roomId)
const snap = await getDoc(ref)

if (!snap.exists()) { console.error('Room not found:', roomId); process.exit(1) }

const room = snap.data()
if (room.password !== password) { console.error('Wrong password'); process.exit(1) }

const existing = room.players.map(p => p.id)
const bots = BOT_NAMES.map((name, i) => ({
  id: `bot-${i + 1}`,
  displayName: name,
  isBot: true,
})).filter(b => !existing.includes(b.id))

if (bots.length === 0) { console.log('All bots already in room'); process.exit(0) }

await updateDoc(ref, {
  players: arrayUnion(...bots),
})

console.log(`✓ Added ${bots.length} bots to room ${roomId}:`)
bots.forEach(b => console.log(`  - ${b.displayName} (${b.id})`))
process.exit(0)
