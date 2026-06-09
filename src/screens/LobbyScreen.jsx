import { useState } from 'react'
import { leaveRoom, startGame } from '../roomActions'
import { TEAM_SPLIT } from '../avalon'

const OPTIONAL_ROLES = [
  { id: 'PERCIVAL', label: 'Percival',  team: 'good', desc: 'Sees Merlin + Morgana' },
  { id: 'MORGANA',  label: 'Morgana',   team: 'evil', desc: 'Appears as Merlin to Percival' },
  { id: 'MORDRED',  label: 'Mordred',   team: 'evil', desc: 'Hidden from Merlin' },
  { id: 'OBERON',   label: 'Oberon',    team: 'evil', desc: 'Unknown to other evil players' },
]

export default function LobbyScreen({ user, room, onLeave }) {
  const isHost = room.hostId === user.uid
  const playerCount = room.players.length
  const [selectedRoles, setSelectedRoles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleRole(id) {
    setSelectedRoles(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id])
  }

  function validateRoles() {
    const count = playerCount
    if (count < 5 || count > 10) return 'Need 5–10 players to start'
    const [goodSlots, evilSlots] = TEAM_SPLIT[count]
    // Merlin+Assassin always included = 1 good + 1 evil taken
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
      await startGame(room.id, selectedRoles)
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
        <div className="screen-title" style={{ flex: 1 }}>Lobby</div>
        <button className="btn btn-ghost btn-small" onClick={handleLeave}>Leave</button>
      </div>

      <div className="card">
        <div className="card-title">Room</div>
        <div style={{ marginBottom: 6 }}>{room.name}</div>
        <div className="room-code">{room.id}</div>
        <div className="text-muted text-center mt-2">Share this code with friends</div>
      </div>

      <div className="card">
        <div className="card-title">Players ({playerCount}/10)</div>
        <div className="player-list">
          {room.players.map(p => (
            <div className="player-row" key={p.id}>
              <div className="avatar">{p.displayName[0].toUpperCase()}</div>
              <div className="player-name">{p.displayName}</div>
              {p.id === room.hostId && <span className="player-badge host">Host</span>}
              {p.id === user.uid    && <span className="player-badge you">You</span>}
            </div>
          ))}
        </div>
        {split && (
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
              <div style={{ flex: 1, fontWeight: 600 }}>🛡️ Avalon</div>
              <span className="player-badge host">Selected</span>
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

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn btn-primary"
            disabled={playerCount < 5 || loading}
            onClick={handleStart}
          >
            {loading ? '...' : playerCount < 5 ? `Need ${5 - playerCount} more player${5 - playerCount !== 1 ? 's' : ''}` : 'Start Game'}
          </button>
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
