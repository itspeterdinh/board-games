import { useState } from 'react'
import { submitHunterShot } from '../../../werewolfActions'
import PlayerAvatar from '../../../components/PlayerAvatar'

export default function HunterShotScreen({ user, room }) {
  const { hunterPendingShot, alivePlayers, players } = room
  const isHunter = user.uid === hunterPendingShot
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const targets = (alivePlayers || []).filter(id => id !== hunterPendingShot).map(id => playerMap[id]).filter(Boolean)
  const hunterPlayer = playerMap[hunterPendingShot]

  const [pick, setPick] = useState(null)
  const [done, setDone] = useState(false)

  async function confirm() {
    if (!pick) return
    setDone(true)
    await submitHunterShot(room.id, user.uid, pick)
  }

  if (!isHunter) {
    return (
      <div className="screen">
        <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
          <div style={{ fontSize: '2.4rem' }}>🏹</div>
          <div className="screen-title" style={{ marginTop: 8 }}>The Hunter's Last Shot</div>
          <div className="screen-subtitle">
            {hunterPlayer?.displayName} was the Hunter. They are taking someone down with them…
          </div>
        </div>
        <div className="card text-center">
          <div className="text-muted">Waiting for the hunter to choose…</div>
          <div className="spinner" style={{ margin: '12px auto 0' }} />
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="screen">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '2.4rem' }}>🏹</div>
          <div className="screen-title" style={{ marginTop: 8 }}>Shot fired!</div>
          <div className="screen-subtitle">Waiting for the game to continue…</div>
        </div>
        <div className="card text-center">
          <div className="spinner" style={{ margin: '10px auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
        <div style={{ fontSize: '2.4rem' }}>🏹</div>
        <div className="screen-title" style={{ marginTop: 4 }}>Hunter's Revenge</div>
        <div className="screen-subtitle">You were eliminated. Take one player down with you!</div>
      </div>

      <div className="card">
        <div className="card-title">Choose your target</div>
        <div className="player-list">
          {targets.map(p => (
            <div key={p.id} className={`player-row selectable ${pick === p.id ? 'selected' : ''}`}
              onClick={() => setPick(p.id)} style={{ cursor: 'pointer' }}>
              <PlayerAvatar player={p} style={pick === p.id ? { background: '#e67e22' } : {}} />
              <div className="player-name">{p.displayName}</div>
              {pick === p.id && <span className="player-badge" style={{ color: '#e67e22', borderColor: '#e67e22' }}>🏹 Target</span>}
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" style={{ background: '#e67e22' }} onClick={confirm} disabled={!pick}>
        🏹 Fire!
      </button>
    </div>
  )
}
