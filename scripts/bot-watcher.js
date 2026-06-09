// Watches the room and auto-handles all bot actions
// Usage: node scripts/bot-watcher.js <roomId>

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDOSoDkZ_90Df5UrS_6FNAtBRMSjeOnV_o',
  authDomain: 'doc-791f8.firebaseapp.com',
  projectId: 'doc-791f8',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const roomId = process.argv[2]
if (!roomId) { console.error('Usage: node scripts/bot-watcher.js <roomId>'); process.exit(1) }

const ref = doc(db, 'rooms', roomId)
let lastStatus = null
let processing = false

function getBots(room) {
  return room.players.filter(p => p.isBot)
}

function isEvil(role) {
  return ['ASSASSIN','MORGANA','MORDRED','OBERON','MINION'].includes(role)
}

async function handleNight(room) {
  const bots = getBots(room)
  const alreadyReady = room.nightReady || []
  const newReady = [...new Set([...alreadyReady, ...bots.map(b => b.id)])]
  const update = { nightReady: newReady }
  if (newReady.length >= room.players.length) {
    update.status = 'propose'
    update.nightReady = []
    console.log('  → All ready, advancing to propose')
  }
  await updateDoc(ref, update)
  console.log(`  ✓ Bots ready (${newReady.length}/${room.players.length})`)
}

async function handleVote(room) {
  const bots = getBots(room)
  const votes = { ...(room.votes || {}) }
  const pending = bots.filter(b => votes[b.id] === undefined)
  if (pending.length === 0) return

  // Bots always approve (keeps game moving)
  for (const bot of pending) votes[bot.id] = true

  const update = { votes }
  const totalVotes = Object.keys(votes).length

  if (totalVotes >= room.players.length) {
    const approvals = Object.values(votes).filter(Boolean).length
    const majority = approvals > room.players.length / 2
    if (majority) {
      update.status = 'mission'
      update.missionCards = {}
      console.log(`  → Vote passed (${approvals}/${room.players.length}), advancing to mission`)
    } else {
      const rejectionCount = (room.rejectionCount || 0) + 1
      if (rejectionCount >= 5) {
        update.status = 'ended'
        update.winner = 'evil'
        console.log('  → 5 rejections — evil wins!')
      } else {
        update.rejectionCount = rejectionCount
        update.status = 'propose'
        update.team = []
        update.votes = {}
        const idx = room.players.findIndex(p => p.id === room.leader)
        update.leader = room.players[(idx + 1) % room.players.length].id
        console.log(`  → Vote failed (rejection ${rejectionCount}/5), next leader: ${update.leader}`)
      }
    }
  }

  await updateDoc(ref, update)
  console.log(`  ✓ Bots voted approve (${pending.length} bots)`)
}

async function handleMission(room) {
  const bots = getBots(room)
  const onTeam = bots.filter(b => (room.team || []).includes(b.id))
  const already = room.missionCards || {}
  const pending = onTeam.filter(b => already[b.id] === undefined)
  if (pending.length === 0) return

  const missionCards = { ...already }
  for (const bot of pending) {
    const role = room.roles?.[bot.id]
    // Evil bots fail the mission, good bots succeed
    missionCards[bot.id] = isEvil(role) ? 'fail' : 'success'
    console.log(`  ✓ ${bot.id} (${role}) plays ${missionCards[bot.id]}`)
  }

  const update = { missionCards }

  if (Object.keys(missionCards).length >= (room.team || []).length) {
    const fails = Object.values(missionCards).filter(c => c === 'fail').length
    const needsTwoFails = room.currentQuest === 3 && room.players.length >= 7
    const passed = needsTwoFails ? fails < 2 : fails === 0
    const questResults = [...(room.questResults || []), passed]
    update.questResults = questResults

    const successes = questResults.filter(Boolean).length
    const failures = questResults.filter(r => !r).length
    console.log(`  → Quest ${room.currentQuest + 1} ${passed ? 'PASSED ✓' : 'FAILED ✗'} (${fails} fail card${fails !== 1 ? 's' : ''})`)

    if (failures >= 3) {
      update.status = 'ended'
      update.winner = 'evil'
      console.log('  → Evil wins (3 failed quests)!')
    } else if (successes >= 3) {
      const hasAssassin = Object.values(room.roles || {}).includes('ASSASSIN')
      update.status = hasAssassin ? 'assassination' : 'ended'
      if (!hasAssassin) update.winner = 'good'
      console.log(hasAssassin ? '  → Good leads! Assassination phase...' : '  → Good wins!')
    } else {
      update.currentQuest = room.currentQuest + 1
      update.rejectionCount = 0
      update.status = 'propose'
      update.team = []
      update.votes = {}
      update.missionCards = {}
      const idx = room.players.findIndex(p => p.id === room.leader)
      update.leader = room.players[(idx + 1) % room.players.length].id
      console.log(`  → Next quest: ${update.currentQuest + 1}, new leader: ${update.leader}`)
    }
  }

  await updateDoc(ref, update)
}

async function handleAssassination(room) {
  // Bot assassin picks a random good player
  const assassinBot = getBots(room).find(b => room.roles?.[b.id] === 'ASSASSIN')
  if (!assassinBot) return // human is the assassin

  const evilRoles = ['ASSASSIN','MORGANA','MORDRED','OBERON','MINION']
  const goodPlayers = room.players.filter(p => !evilRoles.includes(room.roles?.[p.id]))
  if (goodPlayers.length === 0) return

  // Pick a random good player to assassinate
  const target = goodPlayers[Math.floor(Math.random() * goodPlayers.length)]
  const merlinId = Object.entries(room.roles || {}).find(([, r]) => r === 'MERLIN')?.[0]
  const winner = target.id === merlinId ? 'evil' : 'good'

  await updateDoc(ref, { assassinTarget: target.id, status: 'ended', winner })
  console.log(`  ✓ Bot assassin targets ${target.displayName} — ${winner === 'evil' ? 'found Merlin! Evil wins!' : 'wrong guess. Good wins!'}`)
}

console.log(`👁️  Watching room ${roomId} for bot actions...\n`)

onSnapshot(ref, async snap => {
  if (!snap.exists()) { console.log('Room deleted.'); process.exit(0) }
  const room = snap.data()

  if (room.status === lastStatus || processing) return
  lastStatus = room.status
  processing = true

  console.log(`[${room.status.toUpperCase()}]`)

  try {
    if (room.status === 'night')           await handleNight(room)
    else if (room.status === 'vote')       await handleVote(room)
    else if (room.status === 'voteResult') { /* host auto-advances after animation */ }
    else if (room.status === 'mission')    await handleMission(room)
    else if (room.status === 'result')  {
      // Human host handles advance via ResultScreen timer.
      // If host is a bot (unlikely), advance after 5s.
      const hostIsBot = getBots(room).some(b => b.id === room.hostId)
      if (hostIsBot) {
        await new Promise(r => setTimeout(r, 5000))
        const { advanceFromResult } = await import('../src/roomActions.js')
        await advanceFromResult(room.id)
      }
    }
    else if (room.status === 'assassination') await handleAssassination(room)
    else if (room.status === 'ended')   { console.log(`  Game over — ${room.winner} wins!`); process.exit(0) }
  } catch (e) {
    console.error('  Error:', e.message)
  } finally {
    processing = false
  }
})
