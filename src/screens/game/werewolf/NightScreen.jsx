import { useState } from 'react';
import { WW_ROLES, WOLF_ROLES } from '../../../werewolf';
import PreviousNightsLog from './PreviousNightsLog';
import {
  submitCupidLovers,
  submitWolfVote,
  confirmWolfKill,
  submitSeerTarget,
  submitDoctorTarget,
  submitWitchAction,
  submitHunterNightTarget,
  forceAdvanceNightPhase,
} from '../../../werewolfActions';
import PlayerAvatar from '../../../components/PlayerAvatar';

// Script the host reads aloud for each sub-phase
const SCRIPTS = {
  cupid: {
    icon: '💘',
    label: 'Cupid',
    lines: [
      'Everyone close your eyes and make some noise.',
      'Cupid, open your eyes.',
      'Silently point to two players who will become lovers.',
      '(tap Confirm Lovers on their phone)',
      'Cupid, close your eyes.',
    ],
  },
  wolves: {
    icon: '🐺',
    label: 'Werewolves',
    lines: [
      'Werewolves, open your eyes and look around.',
      'Silently agree on a player to eliminate tonight.',
      '(one wolf taps their target on their phone)',
      'Werewolves, close your eyes.',
    ],
  },
  seer: {
    icon: '🔮',
    label: 'Seer',
    lines: [
      'Seer, open your eyes.',
      'Point to a player you want to investigate.',
      '(the app will privately show them the result)',
      'Seer, close your eyes.',
    ],
  },
  doctor: {
    icon: '💉',
    label: 'Doctor',
    lines: [
      'Doctor, open your eyes.',
      'Point to a player you want to protect tonight.',
      '(tap Confirm on their phone)',
      'Doctor, close your eyes.',
    ],
  },
  witch: {
    icon: '🧙',
    label: 'Witch',
    lines: [
      'Witch, open your eyes.',
      'I will show you who the wolves targeted tonight.',
      '(the app shows the wolf target on their phone)',
      'Do you want to use your save potion? Your poison potion?',
      '(tap Done on their phone)',
      'Witch, close your eyes.',
    ],
  },
  hunter: {
    icon: '🏹',
    label: 'Hunter',
    lines: [
      'Hunter, open your eyes.',
      'Secretly choose who you would take down if you are eliminated.',
      '(tap Confirm on their phone — only you will see this)',
      'If you die tonight or tomorrow, that person goes with you.',
      'Hunter, close your eyes.',
    ],
  },
};

const PHASE_FLAVOR = {
  cupid: { icon: '💘', text: 'Cupid is weaving the threads of fate…' },
  wolves: { icon: '🐺', text: 'The wolves are hunting in the dark…' },
  seer: { icon: '🔮', text: 'The seer peers into the darkness…' },
  doctor: { icon: '💉', text: 'The doctor tends to the wounded…' },
  hunter: { icon: '🏹', text: 'The hunter sets their sights…' },
  witch: { icon: '🧙', text: 'The witch stirs her cauldron…' },
};

// ── Build the ordered night-log entries ──────────────────────────────────────

function buildNightLog(room, playerMap) {
  const {
    roles,
    alivePlayers,
    nightPhase,
    round,
    wolfKillTarget,
    nightDoctorTarget,
    nightWitchSave,
    nightWitchPoison,
    nightSeerTarget,
    lovers,
    witchUsedSave,
    witchUsedPoison,
  } = room;

  const has = (r) => Object.values(roles || {}).some((v) => v === r);
  const isRoleAlive = (r) => (alivePlayers || []).some((uid) => roles?.[uid] === r);

  // Ordered phases active this round
  const phases = [];
  if (round === 1 && has('CUPID')) phases.push('cupid');
  phases.push('wolves');
  if (has('SEER')) phases.push('seer');
  if (has('DOCTOR')) phases.push('doctor');
  if (has('HUNTER')) phases.push('hunter');
  if (has('WITCH')) phases.push('witch');

  const currentIdx = phases.indexOf(nightPhase); // -1 when resolving/done

  return phases.map((phase, i) => {
    const isDone = currentIdx === -1 || i < currentIdx;
    const isCurrent = i === currentIdx;

    // Build the action detail line
    let detail = null;
    if (isDone) {
      if (phase === 'cupid') {
        detail = lovers
          ? `${playerMap[lovers[0]]?.displayName} 💘 ${playerMap[lovers[1]]?.displayName}`
          : '(no action)';
      } else if (phase === 'wolves') {
        detail = wolfKillTarget
          ? `🎯 ${playerMap[wolfKillTarget]?.displayName}`
          : '(no target)';
      } else if (phase === 'seer') {
        detail = nightSeerTarget
          ? `🔍 ${playerMap[nightSeerTarget]?.displayName} — ${roles?.[nightSeerTarget] === 'WEREWOLF' ? '🐺 WOLF' : '✓ safe'}${roles?.[nightSeerTarget] === 'WHITE_WOLF' ? ' (White Wolf!)' : ''}`
          : '(no investigation)';
      } else if (phase === 'doctor') {
        detail = nightDoctorTarget
          ? `🛡️ ${playerMap[nightDoctorTarget]?.displayName}`
          : '(no protection)';
      } else if (phase === 'hunter') {
        detail = room.hunterNightTarget
          ? `🏹 Will take ${playerMap[room.hunterNightTarget]?.displayName} if eliminated`
          : '(no target set)';
      } else if (phase === 'witch') {
        const parts = [];
        if (nightWitchSave)
          parts.push(`💊 Saved ${playerMap[nightWitchSave]?.displayName}`);
        else if (witchUsedSave) parts.push('💊 Save already used');
        else parts.push('💊 No save');
        if (nightWitchPoison)
          parts.push(`☠️ Poisoned ${playerMap[nightWitchPoison]?.displayName}`);
        else if (witchUsedPoison) parts.push('☠️ Poison already used');
        else parts.push('☠️ No poison');
        detail = parts.join(' · ');
      }
    } else if (isCurrent && phase === 'wolves') {
      const aliveWolves = (alivePlayers || []).filter((uid) =>
        WOLF_ROLES.includes(roles?.[uid]),
      );
      const castVotes = Object.keys(room.wolfVotes || {}).length;
      const castConfirms = Object.keys(room.wolfConfirmed || {}).length;
      if (castConfirms > 0) {
        detail = `${castVotes}/${aliveWolves.length} voted · ${castConfirms}/${aliveWolves.length} confirmed`;
      } else if (castVotes > 0) {
        detail = `${castVotes}/${aliveWolves.length} wolves voted`;
      }
    }

    const phaseRoleMap = { seer: 'SEER', doctor: 'DOCTOR', hunter: 'HUNTER', witch: 'WITCH' };
    const playerDead = phase in phaseRoleMap && !isRoleAlive(phaseRoleMap[phase]);

    return {
      phase,
      icon: SCRIPTS[phase]?.icon || '🌙',
      label: SCRIPTS[phase]?.label || phase,
      isDone,
      isCurrent,
      detail,
      playerDead,
    };
  });
}

// ── Moderator view (host) ─────────────────────────────────────────────────────

function ModeratorNightView({ room }) {
  const { players, roles, alivePlayers, nightPhase, round, hostId } = room;
  const script = SCRIPTS[nightPhase];
  const flavor = PHASE_FLAVOR[nightPhase] || {
    icon: '🌙',
    text: 'Night phase',
  };
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const log = buildNightLog(room, playerMap);

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ fontSize: '2rem' }}>📋</div>
        <div className="screen-title" style={{ marginTop: 4 }}>
          Moderator — Night {round}
        </div>
        <div className="screen-subtitle">
          Read the script aloud, players act on their phones.
        </div>
      </div>

      {/* ── Night action log ── */}
      <div className="card">
        <div className="card-title">🌙 Night {round} — Action Log</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {log.map((entry, i) => (
            <div
              key={entry.phase}
              style={{
                display: 'flex',
                gap: 12,
                paddingBottom: i < log.length - 1 ? 12 : 0,
              }}
            >
              {/* Timeline spine */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: 28,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    background: entry.isDone
                      ? 'rgba(126,200,160,0.15)'
                      : entry.isCurrent
                        ? 'rgba(201,168,76,0.15)'
                        : 'var(--surface2)',
                    border: `2px solid ${entry.isDone ? 'var(--green,#7ec8a0)' : entry.isCurrent ? 'var(--gold)' : 'var(--border)'}`,
                    boxShadow: entry.isCurrent
                      ? '0 0 8px rgba(201,168,76,0.4)'
                      : 'none',
                  }}
                >
                  {entry.isDone ? '✓' : entry.icon}
                </div>
                {/* Connector line */}
                {i < log.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 10,
                      background: entry.isDone
                        ? 'var(--green,#7ec8a0)'
                        : 'var(--border)',
                      opacity: entry.isDone ? 0.5 : 0.3,
                      marginTop: 3,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  paddingTop: 3,
                  opacity: !entry.isDone && !entry.isCurrent ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: entry.isDone
                      ? 'var(--green,#7ec8a0)'
                      : entry.isCurrent
                        ? 'var(--gold)'
                        : 'var(--text)',
                  }}
                >
                  {entry.label}
                  {entry.isCurrent && !entry.playerDead && (
                    <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--muted)', marginLeft: 6 }}>
                      waiting…
                    </span>
                  )}
                  {entry.isCurrent && entry.playerDead && (
                    <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--red,#e74c3c)', marginLeft: 6 }}>
                      💀 dead — call anyway, then advance
                    </span>
                  )}
                </div>
                {entry.detail && (
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    {entry.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current phase indicator + script */}
      {script && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--surface2)',
              borderRadius: 12,
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>{flavor.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
                Now: {script.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Waiting for the active player to submit…
              </div>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
            <div className="card-title">📜 Script — say this aloud</div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {script.lines.map((line, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.9rem',
                    color: line.startsWith('(')
                      ? 'var(--muted)'
                      : 'var(--text)',
                    fontStyle: line.startsWith('(') ? 'italic' : 'normal',
                  }}
                >
                  {line}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {/* All roles — host can see everything */}
      <div className="card">
        <div className="card-title">🔍 All Roles (host only)</div>
        <div className="player-list">
          {players
            .filter((p) => p.id !== hostId)
            .map((p) => {
              const role = roles?.[p.id];
              const roleData = WW_ROLES[role];
              const isAlive = alivePlayers?.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="player-row"
                  style={{ opacity: isAlive ? 1 : 0.45 }}
                >
                  <PlayerAvatar
                    player={p}
                    style={{
                      border: `2px solid ${roleData?.border || 'var(--border)'}`,
                      filter: isAlive ? 'none' : 'grayscale(1)',
                    }}
                  />
                  <div className="player-name">
                    {p.displayName}
                    {!isAlive ? ' 💀' : ''}
                  </div>
                  <span
                    className="player-badge"
                    style={{
                      color: roleData?.color,
                      borderColor: roleData?.color,
                    }}
                  >
                    {roleData?.icon} {roleData?.name || role}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Previous nights — only shown from round 2 onwards */}
      {room.nightLogs?.length > 0 && (
        <PreviousNightsLog
          nightLogs={room.nightLogs}
          playerMap={playerMap}
          roles={roles}
        />
      )}

      {/* Force advance */}
      <button
        className="btn btn-ghost"
        style={{ fontSize: '0.82rem', color: 'var(--muted)' }}
        onClick={() => forceAdvanceNightPhase(room.id)}
      >
        ⏭ Force advance phase (player disconnected?)
      </button>
    </div>
  );
}

// ── Player view ───────────────────────────────────────────────────────────────

export default function WerewolfNightScreen({ user, room }) {
  const {
    roles,
    alivePlayers,
    nightPhase,
    players,
    nightInfo,
    round,
    lovers,
    hostId,
  } = room;

  // Host is moderator
  if (user.uid === hostId)
    return <ModeratorNightView user={user} room={room} />;

  const myRole = roles?.[user.uid];
  const isAlive = alivePlayers?.includes(user.uid);
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const aliveList = (alivePlayers || [])
    .map((id) => playerMap[id])
    .filter(Boolean);

  const isActive = (() => {
    if (!isAlive) return false;
    switch (nightPhase) {
      case 'cupid':
        return myRole === 'CUPID';
      case 'wolves':
        return WOLF_ROLES.includes(myRole);
      case 'seer':
        return myRole === 'SEER';
      case 'doctor':
        return myRole === 'DOCTOR';
      case 'hunter':
        return myRole === 'HUNTER';
      case 'witch':
        return myRole === 'WITCH';
      default:
        return false;
    }
  })();

  const flavor = PHASE_FLAVOR[nightPhase] || {
    icon: '🌙',
    text: 'Night is falling…',
  };
  const roleData = WW_ROLES[myRole];

  // Dead player waiting
  if (!isAlive) {
    return (
      <div className="screen">
        <div style={{ textAlign: 'center', padding: '40px 0 16px' }}>
          <div style={{ fontSize: '2.4rem' }}>💀</div>
          <div className="screen-title" style={{ marginTop: 8 }}>
            You are dead
          </div>
          <div className="screen-subtitle">
            Observe silently — don't reveal what you know!
          </div>
        </div>
        <div className="card text-center">
          <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>
            {flavor.icon}
          </div>
          <div className="text-muted">{flavor.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ fontSize: '2.4rem' }}>{flavor.icon}</div>
        <div className="screen-title" style={{ marginTop: 4 }}>
          Night — Round {round}
        </div>
        <div className="screen-subtitle">
          {isActive ? "It's your turn to act" : flavor.text}
        </div>
      </div>

      {/* Role reminder */}
      {myRole && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: roleData?.bg || 'var(--surface)',
            borderRadius: 12,
            border: `1px solid ${roleData?.border || 'var(--border)'}`,
            boxShadow: `0 0 12px ${roleData?.glow || 'transparent'}`,
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>{roleData?.icon}</span>
          <div>
            <div style={{ fontWeight: 700, color: roleData?.color }}>
              {roleData?.name}
            </div>
            {nightInfo?.[user.uid]?.sees?.length > 0 && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--muted)',
                  marginTop: 2,
                }}
              >
                {nightInfo[user.uid].label}{' '}
                {nightInfo[user.uid].sees.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lovers reminder */}
      {lovers?.includes(user.uid) &&
        (() => {
          const other = lovers.find((l) => l !== user.uid);
          return (
            <div
              style={{
                fontSize: '0.82rem',
                color: '#e91e8c',
                textAlign: 'center',
              }}
            >
              💘 You are lovers with{' '}
              <strong>{playerMap[other]?.displayName}</strong>
            </div>
          );
        })()}

      {/* Active role action */}
      {isActive && (
        <div style={{ marginTop: 8 }}>
          {nightPhase === 'wolves' && (
            <WolfAction room={room} user={user} aliveList={aliveList} />
          )}
          {nightPhase === 'seer' && (
            <SeerAction room={room} user={user} aliveList={aliveList} />
          )}
          {nightPhase === 'doctor' && (
            <DoctorAction room={room} user={user} aliveList={aliveList} />
          )}
          {nightPhase === 'hunter' && (
            <HunterNightAction room={room} user={user} aliveList={aliveList} />
          )}
          {nightPhase === 'witch' && (
            <WitchAction room={room} user={user} aliveList={aliveList} />
          )}
          {nightPhase === 'cupid' && (
            <CupidAction room={room} user={user} aliveList={aliveList} />
          )}
        </div>
      )}

      {/* Waiting */}
      {!isActive && (
        <div className="card text-center">
          <div className="text-muted">Close your eyes and wait…</div>
          <div className="spinner" style={{ margin: '12px auto 0' }} />
        </div>
      )}
    </div>
  );
}

// ── Role actions (unchanged from before) ─────────────────────────────────────

function WolfAction({ room, user, aliveList }) {
  const {
    roles,
    players,
    alivePlayers,
    wolfVotes = {},
    wolfConfirmed = {},
  } = room;
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const aliveWolves = players.filter(
    (p) =>
      WOLF_ROLES.includes(roles[p.id]) && (alivePlayers || []).includes(p.id),
  );
  const targets = aliveList.filter((p) => !WOLF_ROLES.includes(roles[p.id]));

  const myVote = wolfVotes[user.uid] || null;
  const iConfirmed = wolfConfirmed[user.uid] || false;
  const votedCount = aliveWolves.filter((p) => wolfVotes[p.id]).length;
  const allVoted = aliveWolves.length > 0 && votedCount >= aliveWolves.length;
  const confirmedCount = aliveWolves.filter((p) => wolfConfirmed[p.id]).length;

  // Tally votes
  const tally = {};
  Object.values(wolfVotes).forEach((t) => {
    tally[t] = (tally[t] || 0) + 1;
  });
  const tallyEntries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxVotes = tallyEntries[0]?.[1] ?? 0;
  const leaders = tallyEntries.filter(([, v]) => v === maxVotes);
  const isTied = leaders.length > 1; // (1,1) or (2,2) or (1,1,1) etc.
  const hasMajority = allVoted && !isTied;

  // Confirm button state
  const canConfirm = hasMajority && !iConfirmed;

  async function castVote(targetId) {
    if (iConfirmed) return; // locked after confirming
    await submitWolfVote(room.id, user.uid, targetId);
  }

  async function handleConfirm() {
    if (!canConfirm) return;
    await confirmWolfKill(room.id, user.uid);
  }

  return (
    <div className="card">
      <div className="card-title">🐺 Choose your prey</div>

      {/* Wolf pack status panel */}
      {aliveWolves.length > 1 && (
        <div
          style={{
            background: 'rgba(231,76,60,0.08)',
            border: '1px solid rgba(231,76,60,0.25)',
            borderRadius: 10,
            padding: '8px 12px',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--red,#e74c3c)',
              marginBottom: 6,
            }}
          >
            Wolf Pack — {votedCount}/{aliveWolves.length} voted ·{' '}
            {confirmedCount}/{aliveWolves.length} confirmed
          </div>
          {aliveWolves.map((wolf) => {
            const voted = wolfVotes[wolf.id];
            const confirmed = wolfConfirmed[wolf.id];
            const isMe = wolf.id === user.uid;
            return (
              <div
                key={wolf.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  padding: '2px 0',
                }}
              >
                <span
                  style={{
                    color: isMe ? 'var(--text)' : 'var(--muted)',
                    fontWeight: isMe ? 600 : 400,
                  }}
                >
                  {wolf.displayName}
                  {isMe ? ' (you)' : ''}
                </span>
                <span
                  style={{
                    color: confirmed
                      ? 'var(--green,#7ec8a0)'
                      : voted
                        ? 'var(--red,#e74c3c)'
                        : 'var(--muted)',
                    fontStyle: voted ? 'normal' : 'italic',
                  }}
                >
                  {confirmed
                    ? `✓ confirmed → ${playerMap[voted]?.displayName}`
                    : voted
                      ? `→ ${playerMap[voted]?.displayName}`
                      : 'choosing…'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Target list */}
      <div className="player-list">
        {targets.map((p) => {
          const votes = tally[p.id] || 0;
          const isMyVote = myVote === p.id;
          const isLeader = votes === maxVotes && votes > 0;
          return (
            <div
              key={p.id}
              className={`player-row ${!iConfirmed ? 'selectable' : ''} ${isMyVote ? 'selected' : ''}`}
              onClick={() => castVote(p.id)}
              style={{ cursor: iConfirmed ? 'default' : 'pointer' }}
            >
              <PlayerAvatar
                player={p}
                style={
                  isMyVote
                    ? {
                        background: 'var(--red,#c0392b)',
                        borderColor: 'var(--red)',
                      }
                    : {}
                }
              />
              <div className="player-name">{p.displayName}</div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {votes > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 10,
                      background:
                        isLeader && !isTied
                          ? 'rgba(231,76,60,0.25)'
                          : 'rgba(231,76,60,0.1)',
                      color: 'var(--red,#e74c3c)',
                      border: `1px solid ${isLeader && !isTied ? 'rgba(231,76,60,0.6)' : 'rgba(231,76,60,0.25)'}`,
                    }}
                  >
                    🐺×{votes}
                  </span>
                )}
                {isMyVote && !iConfirmed && (
                  <span
                    className="player-badge"
                    style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                  >
                    Your vote
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status / confirm button */}
      <div style={{ marginTop: 12 }}>
        {!allVoted && (
          <div
            className="text-muted text-center"
            style={{ fontSize: '0.82rem' }}
          >
            Waiting for all wolves to vote…
          </div>
        )}

        {allVoted && isTied && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              textAlign: 'center',
              background: 'rgba(231,76,60,0.1)',
              border: '1px solid rgba(231,76,60,0.3)',
              fontSize: '0.83rem',
              color: 'var(--red,#e74c3c)',
            }}
          >
            ⚠️ Votes are tied — someone must change their vote before
            confirming.
          </div>
        )}

        {allVoted &&
          !isTied &&
          (iConfirmed ? (
            <div
              className="text-muted text-center"
              style={{ fontSize: '0.82rem' }}
            >
              ✓ You confirmed. Waiting for the pack… ({confirmedCount}/
              {aliveWolves.length})
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ background: '#c0392b', width: '100%' }}
              onClick={handleConfirm}
            >
              ✓ Confirm Kill — {playerMap[leaders[0]?.[0]]?.displayName}
            </button>
          ))}
      </div>
    </div>
  );
}

function SeerAction({ room, user, aliveList }) {
  const { roles } = room;
  const targets = aliveList.filter((p) => p.id !== user.uid);
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);
  const [done, setDone] = useState(false);

  function investigate(p) {
    if (pick) return; // locked after first choice
    setPick(p.id);
    setResult(roles[p.id] === 'WEREWOLF' ? 'wolf' : 'safe'); // WHITE_WOLF intentionally reads as safe
  }

  async function confirm() {
    setDone(true);
    await submitSeerTarget(room.id, user.uid, pick);
  }

  if (done)
    return (
      <div className="card text-center">
        <div className="text-muted">✓ Investigation done. Waiting…</div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-title">🔮 Investigate one player</div>
      <div
        style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}
      >
        Tap a player to reveal whether they are a Werewolf. You can only
        investigate one person per night.
      </div>
      {result && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 10,
            fontWeight: 700,
            textAlign: 'center',
            background:
              result === 'wolf'
                ? 'rgba(231,76,60,0.15)'
                : 'rgba(126,200,160,0.15)',
            border: `1px solid ${result === 'wolf' ? 'var(--red)' : 'var(--green)'}`,
            color:
              result === 'wolf'
                ? 'var(--red-light,#e74c3c)'
                : 'var(--green-light,#2ecc71)',
          }}
        >
          {result === 'wolf' ? '🐺 WEREWOLF!' : '✓ Not a Werewolf'}
        </div>
      )}
      <div className="player-list">
        {targets.map((p) => (
          <div
            key={p.id}
            className={`player-row ${!pick ? 'selectable' : ''} ${pick === p.id ? 'selected' : ''}`}
            onClick={() => investigate(p)}
            style={{
              cursor: pick ? 'default' : 'pointer',
              opacity: pick && pick !== p.id ? 0.4 : 1,
            }}
          >
            <PlayerAvatar player={p} />
            <div className="player-name">{p.displayName}</div>
            {pick === p.id && result && (
              <span
                className="player-badge"
                style={{
                  color: result === 'wolf' ? 'var(--red)' : 'var(--green)',
                  borderColor:
                    result === 'wolf' ? 'var(--red)' : 'var(--green)',
                }}
              >
                {result === 'wolf' ? '🐺 Wolf' : '✓ Safe'}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 10 }}
        onClick={confirm}
        disabled={!pick}
      >
        Confirm Investigation
      </button>
    </div>
  );
}

function DoctorAction({ room, user, aliveList }) {
  const { nightDoctorLastTarget } = room;
  const [pick, setPick] = useState(null);
  const [done, setDone] = useState(false);

  async function confirm() {
    setDone(true);
    await submitDoctorTarget(room.id, user.uid, pick);
  }

  if (done)
    return (
      <div className="card text-center">
        <div className="text-muted">✓ Protection set. Waiting…</div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-title">💉 Protect a player</div>
      {nightDoctorLastTarget && (
        <div
          style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}
        >
          You cannot protect the same person two nights in a row.
        </div>
      )}
      <div className="player-list">
        {aliveList.map((p) => {
          const blocked = p.id === nightDoctorLastTarget;
          return (
            <div
              key={p.id}
              className={`player-row ${blocked ? '' : 'selectable'} ${pick === p.id ? 'selected' : ''}`}
              onClick={() => !blocked && setPick(p.id)}
              style={{
                cursor: blocked ? 'not-allowed' : 'pointer',
                opacity: blocked ? 0.4 : 1,
              }}
            >
              <PlayerAvatar
                player={p}
                style={
                  pick === p.id ? { background: 'var(--blue,#5b9bd5)' } : {}
                }
              />
              <div className="player-name">
                {p.displayName}
                {p.id === user.uid ? ' (you)' : ''}
              </div>
              {pick === p.id && (
                <span className="player-badge host">🛡️ Protected</span>
              )}
              {blocked && (
                <span
                  className="player-badge"
                  style={{ color: 'var(--muted)', borderColor: 'var(--muted)' }}
                >
                  Blocked
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 10 }}
        onClick={confirm}
        disabled={!pick}
      >
        Confirm
      </button>
    </div>
  );
}

function WitchAction({ room, user, aliveList }) {
  const { wolfKillTarget, witchUsedSave, witchUsedPoison, players, witchSeesKill } = room;
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const canSeeKill = witchSeesKill ?? true;
  const isSelfTargeted = wolfKillTarget === user.uid;
  // Always show save if witch is the target (self-save), otherwise respect canSeeKill setting
  const wolfVictim = (canSeeKill || isSelfTargeted) && wolfKillTarget ? playerMap[wolfKillTarget] : null;

  const [willSave, setWillSave] = useState(false);
  const [poisonPick, setPoisonPick] = useState(null);
  const [done, setDone] = useState(false);

  async function confirm() {
    setDone(true);
    const update = {};
    if (!witchUsedSave && willSave) update.save = wolfKillTarget;
    if (!witchUsedPoison && poisonPick) update.poison = poisonPick;
    await submitWitchAction(room.id, user.uid, update);
  }

  if (done)
    return (
      <div className="card text-center">
        <div className="text-muted">✓ Potions decided. Waiting…</div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-title">🧙 Your potions</div>

      {!witchUsedSave && wolfVictim ? (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            background: 'var(--surface2)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>💊 Save Potion</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
            {isSelfTargeted
              ? <span style={{ color: 'var(--red,#e74c3c)' }}>⚠️ You were targeted by the wolves. Save yourself?</span>
              : <>Wolves targeted <strong style={{ color: 'var(--text)' }}>{wolfVictim.displayName}</strong>. Save them?</>
            }
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-small ${willSave ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setWillSave(true)}
            >
              Yes, save!
            </button>
            <button
              className={`btn btn-small ${!willSave ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setWillSave(false)}
              disabled={isSelfTargeted}
            >
              Skip
            </button>
          </div>
        </div>
      ) : witchUsedSave ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8 }}>
          💊 Save potion already used.
          {canSeeKill && wolfKillTarget && (
            <span style={{ color: 'var(--text)', marginLeft: 6 }}>
              Wolves targeted <strong>{playerMap[wolfKillTarget]?.displayName}</strong>.
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--muted)',
            marginBottom: 8,
          }}
        >
          💊 No one was targeted tonight.
        </div>
      )}

      {!witchUsedPoison ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            ☠️ Poison Potion (optional)
          </div>
          <div className="player-list">
            {aliveList.filter((p) => p.id !== user.uid).map((p) => (
              <div
                key={p.id}
                className={`player-row selectable ${poisonPick === p.id ? 'selected' : ''}`}
                onClick={() =>
                  setPoisonPick((prev) => (prev === p.id ? null : p.id))
                }
                style={{ cursor: 'pointer' }}
              >
                <PlayerAvatar
                  player={p}
                  style={
                    poisonPick === p.id ? { background: 'var(--red)' } : {}
                  }
                />
                <div className="player-name">{p.displayName}</div>
                {poisonPick === p.id && (
                  <span
                    className="player-badge"
                    style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                  >
                    ☠️ Poison
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--muted)',
            marginBottom: 8,
          }}
        >
          ☠️ Poison potion already used.
        </div>
      )}

      <button className="btn btn-primary" onClick={confirm}>
        Done
      </button>
    </div>
  );
}

function HunterNightAction({ room, user, aliveList }) {
  const [pick, setPick] = useState(null);
  const [done, setDone] = useState(false);

  async function confirm() {
    if (!pick) return;
    setDone(true);
    await submitHunterNightTarget(room.id, user.uid, pick);
  }

  if (done)
    return (
      <div className="card text-center">
        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🏹</div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
          Target locked in.
        </div>
        <div
          className="text-muted"
          style={{ fontSize: '0.82rem', marginTop: 4 }}
        >
          If you are eliminated, they go with you.
        </div>
      </div>
    );

  const targets = aliveList.filter((p) => p.id !== user.uid);

  return (
    <div className="card">
      <div className="card-title">🏹 Choose your contingency target</div>
      <div
        style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 10 }}
      >
        If you are eliminated tonight or tomorrow, this person dies with you.
        Choose wisely — the village won't know.
      </div>
      <div className="player-list">
        {targets.map((p) => (
          <div
            key={p.id}
            className={`player-row selectable ${pick === p.id ? 'selected' : ''}`}
            onClick={() => setPick(p.id)}
            style={{ cursor: 'pointer' }}
          >
            <PlayerAvatar
              player={p}
              style={
                pick === p.id
                  ? { background: '#e67e22', borderColor: '#e67e22' }
                  : {}
              }
            />
            <div className="player-name">{p.displayName}</div>
            {pick === p.id && (
              <span
                className="player-badge"
                style={{ color: '#e67e22', borderColor: '#e67e22' }}
              >
                🏹 Target
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 10, background: '#e67e22', borderColor: '#e67e22' }}
        onClick={confirm}
        disabled={!pick}
      >
        Confirm Target
      </button>
    </div>
  );
}

function CupidAction({ room, user, aliveList }) {
  const [picks, setPicks] = useState([]);
  const [done, setDone] = useState(false);

  function toggle(id) {
    setPicks((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev,
    );
  }

  async function confirm() {
    if (picks.length !== 2) return;
    setDone(true);
    await submitCupidLovers(room.id, user.uid, picks);
  }

  if (done)
    return (
      <div className="card text-center">
        <div className="text-muted">✓ Lovers chosen. Waiting…</div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-title">💘 Choose 2 lovers ({picks.length}/2)</div>
      <div
        style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8 }}
      >
        If one dies, the other dies of heartbreak. You may include yourself.
      </div>
      <div className="player-list">
        {aliveList.map((p) => (
          <div
            key={p.id}
            className={`player-row selectable ${picks.includes(p.id) ? 'selected' : ''}`}
            onClick={() => toggle(p.id)}
            style={{ cursor: 'pointer' }}
          >
            <PlayerAvatar
              player={p}
              style={picks.includes(p.id) ? { background: '#e91e8c' } : {}}
            />
            <div className="player-name">{p.displayName}</div>
            {picks.includes(p.id) && (
              <span
                className="player-badge"
                style={{ color: '#e91e8c', borderColor: '#e91e8c' }}
              >
                💘 Lover
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 10 }}
        onClick={confirm}
        disabled={picks.length !== 2}
      >
        Confirm Lovers
      </button>
    </div>
  );
}
