import {
  collection, doc, setDoc, updateDoc, getDoc,
  arrayUnion, serverTimestamp, deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { assignRoles, buildNightInfo, questPassed, QUEST_SIZES } from './avalon'

function roomRef(roomId) { return doc(db, 'rooms', roomId) }

export async function createRoom(user, roomName, password) {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase()
  await setDoc(roomRef(id), {
    id,
    name: roomName,
    password,
    hostId: user.uid,
    players: [{ id: user.uid, displayName: user.displayName }],
    game: null,
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
      players: arrayUnion({ id: user.uid, displayName: user.displayName }),
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
  const leader = players[Math.floor(Math.random() * players.length)].id

  await updateDoc(roomRef(roomId), {
    game: 'avalon',
    status: 'night',
    roles,
    nightInfo,
    leader,
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

    if (majority) {
      update.status = 'mission'
      update.missionCards = {}
    } else {
      const rejectionCount = room.rejectionCount + 1
      if (rejectionCount >= 5) {
        update.status = 'ended'
        update.winner = 'evil'
      } else {
        update.rejectionCount = rejectionCount
        update.status = 'propose'
        update.team = []
        update.votes = {}
        // advance leader
        const players = room.players
        const idx = players.findIndex(p => p.id === room.leader)
        update.leader = players[(idx + 1) % players.length].id
      }
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

    const successes = questResults.filter(Boolean).length
    const failures = questResults.filter(r => !r).length

    if (failures >= 3) {
      update.status = 'ended'
      update.winner = 'evil'
    } else if (successes >= 3) {
      // Check if Assassin role exists
      const hasAssassin = Object.values(room.roles).includes('ASSASSIN')
      update.status = hasAssassin ? 'assassination' : 'ended'
      if (!hasAssassin) update.winner = 'good'
    } else {
      // Next quest
      update.currentQuest = room.currentQuest + 1
      update.rejectionCount = 0
      update.status = 'propose'
      update.team = []
      update.votes = {}
      update.missionCards = {}
      // Advance leader
      const players = room.players
      const idx = players.findIndex(p => p.id === room.leader)
      update.leader = players[(idx + 1) % players.length].id
    }
  }
  await updateDoc(roomRef(roomId), update)
}

export async function assassinate(roomId, targetId) {
  const snap = await getDoc(roomRef(roomId))
  const room = snap.data()
  const merlinId = Object.entries(room.roles).find(([, r]) => r === 'MERLIN')?.[0]
  const winner = targetId === merlinId ? 'evil' : 'good'
  await updateDoc(roomRef(roomId), {
    assassinTarget: targetId,
    status: 'ended',
    winner,
  })
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
