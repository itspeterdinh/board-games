import {
  doc,
  getDoc,
  updateDoc,
  collection,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  assignWerewolfRoles,
  buildWerewolfNightInfo,
  WOLF_ROLES,
  getInitialNightPhase,
  getNextNightPhase,
  resolveNightDeaths,
  checkWerewolfWin,
} from './werewolf';

function roomRef(id) {
  return doc(db, 'rooms', id);
}

async function saveWerewolfHistory(room, winner) {
  const evilRoles = ['WEREWOLF'];
  const realPlayers = room.players.filter(
    (p) => !p.isBot && p.id !== room.hostId,
  );
  for (const player of realPlayers) {
    const role = room.roles?.[player.id];
    if (!role) continue;
    const team = evilRoles.includes(role) ? 'werewolves' : 'village';
    const won = team === winner;
    const histRef = doc(collection(db, 'users', player.id, 'gameHistory'));
    await setDoc(histRef, {
      game: 'werewolf',
      roomId: room.id,
      role,
      team,
      won,
      winner,
      playerCount: room.players.length,
      players: room.players.map((p) => ({
        displayName: p.displayName,
        role: room.roles?.[p.id] || null,
      })),
      playedAt: serverTimestamp(),
    });
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

export async function startWerewolfGame(
  roomId,
  optionalRoles = [],
  wolfCount = null,
) {
  const snap = await getDoc(roomRef(roomId));
  const room = snap.data();
  const { players, hostId } = room;

  // Host is moderator — excluded from gameplay
  const gamePlayers = players.filter((p) => p.id !== hostId);
  if (gamePlayers.length < 5)
    throw new Error(
      'Need at least 5 players (not counting the host/moderator)',
    );

  const roles = assignWerewolfRoles(gamePlayers, optionalRoles, wolfCount);
  const nightInfo = buildWerewolfNightInfo(gamePlayers, roles);
  const alivePlayers = gamePlayers.map((p) => p.id);
  const nightPhase = getInitialNightPhase(roles, alivePlayers, 1);

  await updateDoc(roomRef(roomId), {
    game: 'werewolf',
    status: 'ww_roleReveal',
    roles,
    nightInfo,
    alivePlayers,
    deadPlayers: [],
    round: 1,
    nightPhase,
    wolfKillTarget: null,
    wolfVotes: {},
    wolfConfirmed: {},
    nightDoctorTarget: null,
    nightDoctorLastTarget: null,
    nightWitchSave: null,
    nightWitchPoison: null,
    witchUsedSave: false,
    witchUsedPoison: false,
    lovers: null,
    nightDeaths: [],
    dayVotes: {},
    dayEliminated: null,
    hunterPendingShot: null,
    winner: null,
    nightLogs: [],
  });
}

// ── Night phase helpers ───────────────────────────────────────────────────────

// Shared: after each night action, maybe advance phase or resolve night
async function advanceNightPhase(roomId, extraUpdate = {}) {
  const snap = await getDoc(roomRef(roomId));
  const room = { ...snap.data(), ...extraUpdate };
  const { roles, alivePlayers, nightPhase, witchUsedSave, witchUsedPoison } =
    room;

  const next = getNextNightPhase(
    roles,
    alivePlayers,
    nightPhase,
    witchUsedSave,
    witchUsedPoison,
  );

  if (next === 'resolve') {
    // Resolve night deaths
    const deaths = resolveNightDeaths(room);
    const deathIds = deaths.map((d) => d.id);
    const newAlive = alivePlayers.filter((id) => !deathIds.includes(id));

    // Build dead player records
    const playerMap = Object.fromEntries(room.players.map((p) => [p.id, p]));
    const newDead = [
      ...(room.deadPlayers || []),
      ...deaths.map((d) => ({
        id: d.id,
        displayName: playerMap[d.id]?.displayName || d.id,
        role: roles[d.id],
        killedBy: d.killedBy,
        round: room.round,
      })),
    ];

    // Hunter auto-fires inside resolveNightDeaths — win check runs on full death list
    const winner = checkWerewolfWin(newAlive, roles);

    // Snapshot this night's actions for the permanent log
    const nightLogEntry = {
      round: room.round,
      wolfKillTarget: room.wolfKillTarget || null,
      wolfVotes: room.wolfVotes || {},
      nightSeerTarget: room.nightSeerTarget || null,
      nightDoctorTarget: room.nightDoctorTarget || null,
      hunterNightTarget: room.hunterNightTarget || null,
      nightWitchSave: room.nightWitchSave || null,
      nightWitchPoison: room.nightWitchPoison || null,
      witchUsedSave: room.witchUsedSave || false,
      witchUsedPoison: room.witchUsedPoison || false,
      lovers: room.round === 1 ? room.lovers || null : null,
      deaths: deaths.map((d) => ({ id: d.id, killedBy: d.killedBy })),
    };

    const update = {
      ...extraUpdate,
      nightPhase: null,
      nightDeaths: deaths,
      alivePlayers: newAlive,
      deadPlayers: newDead,
      nightLogs: [...(room.nightLogs || []), nightLogEntry],
      status: 'ww_dayReveal',
      nightDeathsRevealed: false,
      winner: winner || null,
    };
    await updateDoc(roomRef(roomId), update);
  } else {
    await updateDoc(roomRef(roomId), { ...extraUpdate, nightPhase: next });
  }
}

export async function startNightFromRoleReveal(roomId) {
  await updateDoc(roomRef(roomId), { status: 'ww_night' })
}

export async function submitCupidLovers(roomId, userId, [lover1, lover2]) {
  await advanceNightPhase(roomId, { lovers: [lover1, lover2] });
}

export async function submitWolfVote(roomId, userId, targetId) {
  // Changing vote resets all confirmations so everyone must re-confirm
  await updateDoc(roomRef(roomId), {
    [`wolfVotes.${userId}`]: targetId,
    wolfConfirmed: {},
  });
}

export async function confirmWolfKill(roomId, userId) {
  const snap = await getDoc(roomRef(roomId));
  const room = snap.data();

  const wolfConfirmed = { ...(room.wolfConfirmed || {}), [userId]: true };
  const aliveWolves = (room.alivePlayers || []).filter((id) =>
    WOLF_ROLES.includes(room.roles[id]),
  );
  const allConfirmed =
    aliveWolves.length > 0 && aliveWolves.every((id) => wolfConfirmed[id]);

  if (allConfirmed) {
    // Determine winning target (majority, no ties — UI already enforces this)
    const tally = {};
    Object.values(room.wolfVotes || {}).forEach((t) => {
      tally[t] = (tally[t] || 0) + 1;
    });
    const max = Math.max(...Object.values(tally));
    const target = Object.keys(tally).find((k) => tally[k] === max);
    await advanceNightPhase(roomId, {
      wolfVotes: room.wolfVotes,
      wolfConfirmed,
      wolfKillTarget: target,
    });
  } else {
    await updateDoc(roomRef(roomId), { wolfConfirmed });
  }
}

export async function submitSeerTarget(roomId, userId, targetId) {
  // Result shown client-side (roles are in room.roles). Just advance phase.
  await advanceNightPhase(roomId, { nightSeerTarget: targetId });
}

export async function submitHunterNightTarget(roomId, userId, targetId) {
  // Hunter picks their contingency target each night. If they die, it fires automatically.
  await advanceNightPhase(roomId, { hunterNightTarget: targetId });
}

export async function submitDoctorTarget(roomId, _userId, targetId) {
  await advanceNightPhase(roomId, {
    nightDoctorTarget: targetId,
    nightDoctorLastTarget: targetId,
  });
}

export async function submitWitchAction(roomId, _userId, { save, poison }) {
  const update = {};
  if (save !== undefined) {
    update.nightWitchSave = save;
    update.witchUsedSave = true;
  }
  if (poison !== undefined) {
    update.nightWitchPoison = poison;
    update.witchUsedPoison = true;
  }
  await advanceNightPhase(roomId, update);
}

export async function skipNightAction(roomId) {
  // Used when a role has nothing to do (e.g. witch has no potions left but phase still called)
  await advanceNightPhase(roomId, {});
}

// Host-only: force advance if a player is disconnected / stalling
export async function forceAdvanceNightPhase(roomId) {
  await advanceNightPhase(roomId, {});
}

// ── Day phase ────────────────────────────────────────────────────────────────

export async function revealNightDeaths(roomId) {
  await updateDoc(roomRef(roomId), { nightDeathsRevealed: true });
}

export async function advanceFromDayReveal(roomId) {
  const snap = await getDoc(roomRef(roomId));
  const room = snap.data();
  if (room.winner) {
    await saveWerewolfHistory(room, room.winner);
    await updateDoc(roomRef(roomId), { status: 'ended' });
  } else {
    await updateDoc(roomRef(roomId), {
      status: 'ww_day',
      dayVotes: {},
      dayEliminated: null,
    });
  }
}

export async function startDayVoting(roomId) {
  await updateDoc(roomRef(roomId), { status: 'ww_dayVote', dayVotes: {} });
}

export async function castDayVote(roomId, userId, targetId) {
  const snap = await getDoc(roomRef(roomId));
  const room = snap.data();
  const dayVotes = { ...room.dayVotes, [userId]: targetId };
  const update = { dayVotes };

  if (Object.keys(dayVotes).length >= room.alivePlayers.length) {
    // Tally votes
    const tally = {};
    Object.values(dayVotes).forEach((t) => {
      tally[t] = (tally[t] || 0) + 1;
    });
    const max = Math.max(...Object.values(tally));
    const winners = Object.keys(tally).filter((k) => tally[k] === max);

    let eliminated = null;
    if (winners.length === 1) eliminated = winners[0]; // single majority
    // tie → no elimination (eliminated stays null)

    update.dayEliminated = eliminated;
    update.status = 'ww_dayResult';

    if (eliminated) {
      // Apply elimination
      const newAlive = room.alivePlayers.filter((id) => id !== eliminated);
      let extraDeaths = [];

      // Lovers
      if (room.lovers?.includes(eliminated)) {
        const other = room.lovers.find((l) => l !== eliminated);
        if (other && newAlive.includes(other)) {
          extraDeaths.push({ id: other, killedBy: 'heartbreak' });
        }
      }

      const allEliminated = [eliminated, ...extraDeaths.map((d) => d.id)];
      let finalAlive = newAlive.filter(
        (id) => !extraDeaths.map((d) => d.id).includes(id),
      );

      const playerMap = Object.fromEntries(room.players.map((p) => [p.id, p]));
      let newDead = [
        ...(room.deadPlayers || []),
        {
          id: eliminated,
          displayName: playerMap[eliminated]?.displayName,
          role: room.roles[eliminated],
          killedBy: 'vote',
          round: room.round,
        },
        ...extraDeaths.map((d) => ({
          id: d.id,
          displayName: playerMap[d.id]?.displayName,
          role: room.roles[d.id],
          killedBy: d.killedBy,
          round: room.round,
        })),
      ];

      // Hunter auto-revenge: if the hunter was eliminated, their pre-selected target also dies
      const hunterElim = allEliminated.find(
        (id) => room.roles[id] === 'HUNTER',
      );
      if (hunterElim && room.hunterNightTarget) {
        const target = room.hunterNightTarget;
        const targetFinalAlive = finalAlive.includes(target);
        if (targetFinalAlive) {
          extraDeaths.push({ id: target, killedBy: 'hunter' });
          finalAlive = finalAlive.filter((id) => id !== target);
          const pm = Object.fromEntries(room.players.map((p) => [p.id, p]));
          newDead.push({
            id: target,
            displayName: pm[target]?.displayName,
            role: room.roles[target],
            killedBy: 'hunter',
            round: room.round,
          });
          // Lover heartbreak from hunter's target
          if (room.lovers?.includes(target)) {
            const other = room.lovers.find((l) => l !== target);
            if (other && finalAlive.includes(other)) {
              extraDeaths.push({ id: other, killedBy: 'heartbreak' });
              finalAlive = finalAlive.filter((id) => id !== other);
              newDead.push({
                id: other,
                displayName: pm[other]?.displayName,
                role: room.roles[other],
                killedBy: 'heartbreak',
                round: room.round,
              });
            }
          }
        }
      }

      update.alivePlayers = finalAlive;
      update.deadPlayers = newDead;
      update.dayExtraDeaths = extraDeaths; // for the result screen to show

      // Check win after all deaths (including hunter's revenge) are applied
      const winner = checkWerewolfWin(finalAlive, room.roles);
      if (winner) {
        update.status = 'ended';
        update.winner = winner;
        await updateDoc(roomRef(roomId), update);
        await saveWerewolfHistory({ ...room, ...update }, winner);
        return;
      }
    }
  }

  await updateDoc(roomRef(roomId), update);
}

export async function advanceFromDayResult(roomId) {
  const snap = await getDoc(roomRef(roomId));
  const room = snap.data();

  // Start next night (hunter's revenge already applied in castDayVote)
  const nextRound = room.round + 1;
  const nightPhase = getInitialNightPhase(
    room.roles,
    room.alivePlayers,
    nextRound,
  );
  await updateDoc(roomRef(roomId), {
    status: 'ww_night',
    round: nextRound,
    nightPhase,
    wolfKillTarget: null,
    wolfVotes: {},
    wolfConfirmed: {},
    nightDoctorTarget: null,
    nightSeerTarget: null,
    nightWitchSave: null,
    nightWitchPoison: null,
    // hunterNightTarget intentionally NOT reset — carries over as default until hunter re-picks
    nightDeaths: [],
    dayVotes: {},
    dayEliminated: null,
    dayExtraDeaths: [],
  });
}

// ── Hunter ────────────────────────────────────────────────────────────────────

export async function submitHunterShot(roomId, hunterId, targetId) {
  const snap = await getDoc(roomRef(roomId));
  const room = snap.data();

  const newAlive = room.alivePlayers.filter((id) => id !== targetId);
  const playerMap = Object.fromEntries(room.players.map((p) => [p.id, p]));
  const newDead = [
    ...(room.deadPlayers || []),
    {
      id: targetId,
      displayName: playerMap[targetId]?.displayName,
      role: room.roles[targetId],
      killedBy: 'hunter',
      round: room.round,
    },
  ];

  const winner = checkWerewolfWin(newAlive, room.roles);
  const update = {
    alivePlayers: newAlive,
    deadPlayers: newDead,
    hunterShotTarget: targetId,
    hunterPendingShot: null,
    status: winner
      ? 'ended'
      : room.nightDeaths?.length > 0
        ? 'ww_day'
        : 'ww_night',
    winner: winner || null,
  };

  if (!winner) {
    // If hunter died at night, proceed to day. If died during day result, proceed to next night.
    const fromNight =
      room.status === 'ww_hunterShot' && room.dayEliminated == null;
    if (!fromNight) {
      const nextRound = room.round + 1;
      update.status = 'ww_night';
      update.round = nextRound;
      update.nightPhase = getInitialNightPhase(room.roles, newAlive, nextRound);
      update.wolfKillTarget = null;
      update.nightDoctorTarget = null;
      update.nightSeerTarget = null;
      update.nightWitchSave = null;
      update.nightWitchPoison = null;
      update.nightDeaths = [];
      update.dayVotes = {};
      update.dayEliminated = null;
      update.dayExtraDeaths = [];
    } else {
      update.status = 'ww_day';
      update.dayVotes = {};
      update.dayEliminated = null;
      update.dayExtraDeaths = [];
    }
  }

  await updateDoc(roomRef(roomId), update);
  if (winner) await saveWerewolfHistory({ ...room, ...update }, winner);
}
