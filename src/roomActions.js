import {
  collection, doc, setDoc, updateDoc, getDoc,
  arrayUnion, serverTimestamp, deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { assignRoles, buildNightInfo, questPassed } from './avalon'

function roomRef(roomId) { return doc(db, 'rooms', roomId) }

async function saveGameHistory(room, winner) {
  const evilRoles = ['ASSASSIN','MORGANA','MORDRED','OBERON','MINION']
  const realPlayers = room.players.filter(p => !p.isBot)
  for (const player of realPlayers) {
    const role = room.roles?.[player.id]
    if (!role) continue
    const team = evilRoles.includes(role) ? 'evil' : 'good'
    const won = team === winner
    const assassinated = winner === 'evil' && room.assassinTarget != null &&
      Object.entries(room.roles).find(([,r]) => r === 'MERLIN')?.[0] === room.assassinTarget
    const historyDoc = doc(collection(db, 'users', player.id, 'gameHistory'))
    await setDoc(historyDoc, {
      roomId: room.id,
      role,
      team,
      won,
      winner,
      assassinated: assassinated || false,
      questResults: room.questResults || [],
      playerCount: room.players.length,
      players: room.players.map(p => ({
        displayName: p.displayName,
        role: room.roles?.[p.id] || null,
      })),
      playedAt: serverTimestamp(),
    })
  }
}

export async function createRoom(user, roomName, password, gameType = 'avalon') {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase()
  await setDoc(roomRef(id), {
    id,
    name: roomName,
    password,
    hostId: user.uid,
    players: [{ id: user.uid, displayName: user.displayName, photoURL: user.photoURL || null }],
    game: null,
    gameType,
    status: 'lobby',
    createdAt: serverTimestamp(),
  })
  return id
}

export async function joinRoom(user, roomId, password) {
  const snap = await getDoc(roomRef(roomId))
  if (!snap.exists()) throw new Error('Room not found')
  const room = snap.data()
  if (room.password !== password) throw new Error('Wrong password')
  if (room.status !== 'lobby') throw new Error('Game already started')
  const alreadyIn = room.players.some(p => p.id === user.uid)
  if (!alreadyIn) {
    await updateDoc(roomRef(roomId), {
      players: arrayUnion({ id: user.uid, displayName: user.displayName, photoURL: user.photoURL || null }),
    })
  }
}

export async function leaveRoom(user, roomId) {
  const snap = await getDoc(roomRef(roomId))
  if (!snap.exists()) return
  const room = snap.data()
  const players = room.players.filter(p => p.id !== user.uid)
  if (players.length === 0 || room.hostId === user.uid) {
    await deleteDoc(roomRef(roomId))
  } else {
    await updateDoc(roomRef(roomId), { players })
  }
}

export async function startGame(roomId, selectedOptionalRoles) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const players = room.players
  const count = players.length
  if (count < 5 || count > 10) throw new Error('Need 5–10 players')

  const roles = assignRoles(players, selectedOptionalRoles)
  const nightInfo = buildNightInfo(players, roles)
  // Randomly pick a starting leader, then build the full rotation order
  const startIdx = Math.floor(Math.random() * players.length)
  const leader = players[startIdx].id
  const leaderOrder = [
    ...players.slice(startIdx),
    ...players.slice(0, startIdx),
  ].map(p => p.id)

  await updateDoc(roomRef(roomId), {
    game: 'avalon',
    status: 'night',
    roles,
    nightInfo,
    leader,
    leaderOrder,
    leaderIndex: 0,
    showLeaderOrder: room.showLeaderOrder ?? false,
    currentQuest: 0,
    questResults: [],
    rejectionCount: 0,
    team: [],
    votes: {},
    missionCards: {},
    assassinTarget: null,
    winner: null,
  })
}

export async function readyForDay(roomId, userId) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const ready = [...(room.nightReady || []), userId]
  const update = { nightReady: ready }
  if (ready.length >= room.players.length) {
    update.status = 'propose'
    update.nightReady = []
  }
  await updateDoc(roomRef(roomId), update)
}

export async function proposeTeam(roomId, teamPlayerIds) {
  await updateDoc(roomRef(roomId), {
    team: teamPlayerIds,
    status: 'vote',
    votes: {},
  })
}

export async function castVote(roomId, userId, approve) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const votes = { ...room.votes, [userId]: approve }
  const update = { votes }

  if (Object.keys(votes).length >= room.players.length) {
    const approvals = Object.values(votes).filter(Boolean).length
    const majority = approvals > room.players.length / 2
    // Go to voteResult screen; advanceFromVoteResult handles the real transition
    update.status = 'voteResult'
    update.voteApprovals = approvals
    update.votePassed = majority
  }
  await updateDoc(roomRef(roomId), update)
}

export async function advanceFromVoteResult(roomId) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const { votePassed } = room
  const update = {}

  if (votePassed) {
    update.status = 'mission'
    update.missionCards = {}
  } else {
    const rejectionCount = room.rejectionCount + 1
    if (rejectionCount >= 5) {
      update.status = 'ended'
      update.winner = 'evil'
      await saveGameHistory(room, 'evil')
    } else {
      update.rejectionCount = rejectionCount
      update.status = 'propose'
      update.team = []
      update.votes = {}
      const nextIdx = (room.leaderIndex + 1) % room.players.length
      update.leaderIndex = nextIdx
      update.leader = room.leaderOrder[nextIdx]
    }
  }
  await updateDoc(roomRef(roomId), update)
}

export async function playMissionCard(roomId, userId, card) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const missionCards = { ...room.missionCards, [userId]: card }
  const update = { missionCards }

  if (Object.keys(missionCards).length >= room.team.length) {
    const passed = questPassed(missionCards, room.currentQuest, room.players.length)
    const questResults = [...room.questResults, passed]
    update.questResults = questResults
    // Shuffle cards for anonymous reveal
    const shuffledCards = Object.values(missionCards).sort(() => Math.random() - 0.5)
    update.revealCards = shuffledCards
    update.status = 'result'
  }
  await updateDoc(roomRef(roomId), update)
}

export async function advanceFromResult(roomId) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const questResults = room.questResults
  const successes = questResults.filter(Boolean).length
  const failures = questResults.filter(r => !r).length
  const update = { revealCards: [] }

  if (failures >= 3) {
    update.status = 'ended'
    update.winner = 'evil'
    await saveGameHistory({ ...room, questResults }, 'evil')
  } else if (successes >= 3) {
    const hasAssassin = Object.values(room.roles).includes('ASSASSIN')
    update.status = hasAssassin ? 'assassination' : 'ended'
    if (!hasAssassin) {
      update.winner = 'good'
      await saveGameHistory({ ...room, questResults }, 'good')
    }
  } else {
    update.currentQuest = room.currentQuest + 1
    update.rejectionCount = 0
    update.status = 'propose'
    update.team = []
    update.votes = {}
    update.missionCards = {}
    const nextIdx = (room.leaderIndex + 1) % room.players.length
    update.leaderIndex = nextIdx
    update.leader = room.leaderOrder[nextIdx]
  }
  await updateDoc(roomRef(roomId), update)
}

export async function assassinate(roomId, targetId) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const merlinId = Object.entries(room.roles).find(([, r]) => r === 'MERLIN')?.[0]
  const winner = targetId === merlinId ? 'evil' : 'good'
  await saveGameHistory({ ...room, assassinTarget: targetId }, winner)
  await updateDoc(roomRef(roomId), {
    assassinTarget: targetId,
    status: 'ended',
    winner,
  })
}

export async function setShowLeaderOrder(roomId, value) {
  await updateDoc(roomRef(roomId), { showLeaderOrder: value })
}

export async function setHostProposesTeam(roomId, value) {
  await updateDoc(roomRef(roomId), { hostProposesTeam: value })
}

export async function setWitchSeesKill(roomId, value) {
  await updateDoc(roomRef(roomId), { witchSeesKill: value })
}

export async function setDoctorBlocksPoison(roomId, value) {
  await updateDoc(roomRef(roomId), { doctorBlocksPoison: value })
}

export async function resetToLobby(roomId) {
  await updateDoc(roomRef(roomId), {
    game: null,
    status: 'lobby',
    roles: null,
    nightInfo: null,
    leader: null,
    currentQuest: 0,
    questResults: [],
    rejectionCount: 0,
    team: [],
    votes: {},
    missionCards: {},
    assassinTarget: null,
    winner: null,
    nightReady: [],
  })
}
