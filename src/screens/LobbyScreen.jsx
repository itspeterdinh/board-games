import { useState } from 'react'
import { leaveRoom, startGame, setShowLeaderOrder, setWitchSeesKill, setDoctorBlocksPoison } from '../roomActions'
import { startWerewolfGame } from '../werewolfActions'
import { TEAM_SPLIT } from '../avalon'
import { maxWolves } from '../werewolf'
import PlayerAvatar from '../components/PlayerAvatar'

const OPTIONAL_ROLES = [
  { id: 'PERCIVAL', label: 'Percival',  team: 'good', desc: 'Sees Merlin + Morgana' },
  { id: 'MORGANA',  label: 'Morgana',   team: 'evil', desc: 'Appears as Merlin to Percival' },
  { id: 'MORDRED',  label: 'Mordred',   team: 'evil', desc: 'Hidden from Merlin' },
  { id: 'OBERON',   label: 'Oberon',    team: 'evil', desc: 'Unknown to other evil players' },
]

const WW_OPTIONAL_ROLES = [
  { id: 'HUNTER',     icon: '🏹',   label: 'Hunter',     desc: 'When eliminated, takes someone down' },
  { id: 'WITCH',      icon: '🧙',   label: 'Witch',      desc: 'One save + one poison potion' },
  { id: 'CUPID',      icon: '💘',   label: 'Cupid',      desc: 'Links two lovers on night 1' },
  { id: 'WHITE_WOLF', icon: '🤍🐺', label: 'White Wolf', desc: 'Werewolf that appears safe to the Seer' },
]

export default function LobbyScreen({ user, room, onLeave }) {
  const isHost = room.hostId === user.uid
  const playerCount = room.players.length
  const gameType = room.gameType || 'avalon'
  const [selectedRoles, setSelectedRoles] = useState([])
  const [wolfCount, setWolfCount] = useState(null)  // null = use default
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Werewolf player count = all players minus moderator (host)
  const wwPlayerCount = playerCount - 1
  const maxW = maxWolves(wwPlayerCount)
  // Default wolf count from table
  const defaultWolfCount = { 4:1,5:1,6:1,7:2,8:2,9:2,10:2,11:3,12:3,13:3,14:3,15:4,16:4 }[wwPlayerCount] ?? Math.max(1, Math.floor(wwPlayerCount / 4))
  const effectiveWolfCount = wolfCount ?? defaultWolfCount

  function toggleRole(id) {
    setSelectedRoles(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id])
  }

  function validateRoles() {
    if (gameType === 'werewolf') {
      if (playerCount < 6) return 'Need at least 6 players (5 + you as moderator) to start'
      if (effectiveWolfCount > maxW) return `Too many wolves — max ${maxW} for ${wwPlayerCount} players`
      const hasWhiteWolf = selectedRoles.includes('WHITE_WOLF')
      if (hasWhiteWolf && effectiveWolfCount < 2) return 'Need at least 2 wolves total to include a White Wolf'
      return null
    }
    const count = playerCount
    if (count < 5 || count > 10) return 'Need 5–10 players to start'
    const [goodSlots, evilSlots] = TEAM_SPLIT[count]
    const extraGood = selectedRoles.filter(r => r === 'PERCIVAL').length
    const extraEvil = selectedRoles.filter(r => ['MORGANA','MORDRED','OBERON'].includes(r)).length
    if (extraGood > goodSlots - 1) return 'Too many good special roles for this player count'
    if (extraEvil > evilSlots - 1) return 'Too many evil special roles for this player count'
    return null
  }

  async function handleStart() {
    const err = validateRoles()
    if (err) return setError(err)
    setError('')
    setLoading(true)
    try {
      if (gameType === 'werewolf') {
        await startWerewolfGame(room.id, selectedRoles, effectiveWolfCount)
      } else {
        await startGame(room.id, selectedRoles)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    await leaveRoom(user, room.id)
    onLeave()
  }

  const split = TEAM_SPLIT[playerCount] || null

  return (
    <div className="screen">
      <div className="header-row">
        <div className="screen-title" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Lobby</div>
        <button className="btn btn-ghost btn-small" onClick={handleLeave}>Leave</button>
      </div>

      <div className="card">
        <div className="card-title">Room</div>
        <div style={{ marginBottom: 6 }}>{room.name}</div>
        <div className="room-code">{room.id}</div>
        <div className="text-muted text-center mt-2">Share this code with friends</div>
      </div>

      <div className="card">
        <div className="card-title">Players ({playerCount}/16)</div>
        <div className="player-list">
          {room.players.map(p => (
            <div className="player-row" key={p.id}>
              <PlayerAvatar player={p} />
              <div className="player-name">{p.displayName}</div>
              {p.id === room.hostId && <span className="player-badge host">{gameType === 'werewolf' ? '📋 Moderator' : 'Host'}</span>}
              {p.id === user.uid    && <span className="player-badge you">You</span>}
            </div>
          ))}
        </div>
        {gameType === 'werewolf' ? (
          <div className="text-muted mt-2 text-center" style={{ fontSize: '0.8rem' }}>
            {wwPlayerCount} players · {effectiveWolfCount} wolf{effectiveWolfCount !== 1 ? 's' : ''} · {wwPlayerCount - effectiveWolfCount} villager{(wwPlayerCount - effectiveWolfCount) !== 1 ? 's' : ''}
          </div>
        ) : split && (
          <div className="text-muted mt-2 text-center" style={{ fontSize: '0.8rem' }}>
            {split[0]} good · {split[1]} evil
          </div>
        )}
      </div>

      {isHost && (
        <>
          <div className="card">
            <div className="card-title">Game</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontWeight: 600 }}>
                {gameType === 'werewolf' ? '🐺 Werewolf' : '⚔️ Avalon'}
              </div>
              <span className="player-badge host">Selected</span>
            </div>
          </div>

          {gameType === 'avalon' && (<>
          <div className="card">
            <div className="card-title">Game Settings</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Show Leader Order</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                  Reveal the full turn order to all players
                </div>
              </div>
              <button
                onClick={() => setShowLeaderOrder(room.id, !room.showLeaderOrder)}
                style={{
                  width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: room.showLeaderOrder ? 'var(--gold)' : 'var(--surface2)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  outline: `1px solid ${room.showLeaderOrder ? 'var(--gold)' : 'var(--border)'}`,
                }}
              >
                <div style={{
                  position: 'absolute', top: 4, width: 20, height: 20, borderRadius: '50%',
                  background: room.showLeaderOrder ? '#0d0d1a' : 'var(--muted)',
                  transition: 'left 0.2s',
                  left: room.showLeaderOrder ? 24 : 4,
                }} />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Optional Roles</div>
            <div className="chip-group">
              {OPTIONAL_ROLES.map(r => (
                <button
                  key={r.id}
                  className={`chip ${r.team === 'evil' ? 'evil' : ''} ${selectedRoles.includes(r.id) ? 'selected' : ''}`}
                  onClick={() => toggleRole(r.id)}
                  title={r.desc}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              Always included: Merlin, Assassin, Loyal Servants, Minions of Mordred
            </div>
          </div>
          </>)}

          {gameType === 'werewolf' && (
          <div className="card">
            <div className="card-title">Werewolf Settings</div>

            {/* Wolf count stepper */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                🐺 Number of Wolves
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => setWolfCount(Math.max(1, effectiveWolfCount - 1))}
                  disabled={effectiveWolfCount <= 1}
                  style={{ width: 36, fontWeight: 700, fontSize: '1.1rem' }}
                >−</button>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', minWidth: 20, textAlign: 'center' }}>
                  {effectiveWolfCount}
                </span>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => setWolfCount(Math.min(maxW, effectiveWolfCount + 1))}
                  disabled={effectiveWolfCount >= maxW}
                  style={{ width: 36, fontWeight: 700, fontSize: '1.1rem' }}
                >+</button>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  max {maxW} for {wwPlayerCount} players
                </span>
              </div>
            </div>

            {/* Witch sees kill toggle */}
            {selectedRoles.includes('WITCH') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>🧙 Witch sees wolf target</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                    Show witch who the wolves killed (even if already saved)
                  </div>
                </div>
                <button
                  onClick={() => setWitchSeesKill(room.id, !(room.witchSeesKill ?? true))}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: (room.witchSeesKill ?? true) ? 'var(--gold)' : 'var(--surface2)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    outline: `1px solid ${(room.witchSeesKill ?? true) ? 'var(--gold)' : 'var(--border)'}`,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 4, width: 20, height: 20, borderRadius: '50%',
                    background: (room.witchSeesKill ?? true) ? '#0d0d1a' : 'var(--muted)',
                    transition: 'left 0.2s',
                    left: (room.witchSeesKill ?? true) ? 24 : 4,
                  }} />
                </button>
              </div>
            )}

            {/* Doctor blocks poison toggle */}
            {selectedRoles.includes('WITCH') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>💉 Doctor blocks poison</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                    Doctor can protect a player from witch poison (and wolf kill simultaneously)
                  </div>
                </div>
                <button
                  onClick={() => setDoctorBlocksPoison(room.id, !(room.doctorBlocksPoison ?? false))}
                  style={{
                    width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: (room.doctorBlocksPoison ?? false) ? 'var(--gold)' : 'var(--surface2)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    outline: `1px solid ${(room.doctorBlocksPoison ?? false) ? 'var(--gold)' : 'var(--border)'}`,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 4, width: 20, height: 20, borderRadius: '50%',
                    background: (room.doctorBlocksPoison ?? false) ? '#0d0d1a' : 'var(--muted)',
                    transition: 'left 0.2s',
                    left: (room.doctorBlocksPoison ?? false) ? 24 : 4,
                  }} />
                </button>
              </div>
            )}

            {/* Optional roles */}
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8 }}>Optional Roles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WW_OPTIONAL_ROLES.map(r => {
                const isOn = selectedRoles.includes(r.id)
                const disabled = r.id === 'WHITE_WOLF' && effectiveWolfCount < 2
                return (
                  <div
                    key={r.id}
                    onClick={() => !disabled && toggleRole(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1,
                      background: isOn ? 'var(--surface)' : 'var(--surface2)',
                      border: `1.5px solid ${isOn ? 'var(--gold)' : 'var(--border)'}`,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {r.id === 'WHITE_WOLF' && effectiveWolfCount < 2
                          ? 'Requires at least 2 wolves total'
                          : r.desc}
                      </div>
                    </div>
                    {isOn && <span className="player-badge host">✓ On</span>}
                  </div>
                )
              })}
            </div>
            <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              Always included: Werewolves, Seer, Doctor, Villagers
            </div>
          </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          {(() => {
            const minPlayers = gameType === 'werewolf' ? 6 : 5  // werewolf: 5 players + 1 moderator
            const needed = minPlayers - playerCount
            const canStart = playerCount >= minPlayers
            const label = gameType === 'werewolf'
              ? `Need ${needed} more player${needed !== 1 ? 's' : ''} (+ you as moderator)`
              : `Need ${needed} more player${needed !== 1 ? 's' : ''}`
            return (
              <button
                className="btn btn-primary"
                disabled={!canStart || loading}
                onClick={handleStart}
              >
                {loading ? '...' : !canStart ? label : 'Start Game'}
              </button>
            )
          })()}
        </>
      )}

      {!isHost && (
        <div className="card text-center">
          <div className="text-muted">Waiting for host to start the game…</div>
          <div className="spinner mt-2" style={{ margin: '12px auto 0' }} />
        </div>
      )}
    </div>
  )
}
