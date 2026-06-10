import { useState } from 'react'
import { readyForDay } from '../../../roomActions'
import { ROLES, ROLE_DESCRIPTIONS } from '../../../avalon'

const ROLE_ICONS = {
  MERLIN: '🔮', PERCIVAL: '🛡️', LOYAL_SERVANT: '⚔️',
  ASSASSIN: '🗡️', MORGANA: '🌙', MORDRED: '👑', OBERON: '👁️', MINION: '💀',
}

export default function NightScreen({ user, room }) {
  const [revealed, setRevealed] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const myRole = room.roles?.[user.uid]
  const myInfo = room.nightInfo?.[user.uid]
  const alreadyReady = (room.nightReady || []).includes(user.uid)

  const roleData = myRole ? ROLES[myRole] : null

  async function markReady() {
    setLoading(true)
    await readyForDay(room.id, user.uid)
    setReady(true)
    setLoading(false)
  }

  return (
    <div className="screen">
      <div className="screen-title">🌙 Night Phase</div>
      <div className="screen-subtitle">Look at your role privately. Don't show others.</div>

      {!revealed ? (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🃏</div>
          <button className="btn btn-primary" onClick={() => setRevealed(true)}>
            Reveal My Role
          </button>
        </div>
      ) : roleData ? (
        <>
          <div className={`role-card ${roleData.team}`}>
            <div className="role-icon">{ROLE_ICONS[myRole] || '❓'}</div>
            <div className="role-name">{roleData.name}</div>
            <div className={`role-team ${roleData.team}`}>
              {roleData.team === 'good' ? '✦ Good' : '✦ Evil'}
            </div>
            <div className="role-desc">{ROLE_DESCRIPTIONS[myRole]}</div>

            {myInfo && myInfo.sees.length > 0 && (
              <div className="sees-list">
                <div className="sees-label">{myInfo.label}:</div>
                <div className="sees-names">
                  {myInfo.sees.map(name => (
                    <span key={name} className="sees-name">{name}</span>
                  ))}
                </div>
              </div>
            )}
            {myInfo && myInfo.sees.length === 0 && (
              <div className="sees-list">
                <div className="sees-label">{myInfo.label}</div>
              </div>
            )}
          </div>

          {!alreadyReady && !ready && (
            <button className="btn btn-primary" onClick={markReady} disabled={loading}>
              {loading ? '...' : "I've seen my role"}
            </button>
          )}

          {(alreadyReady || ready) && (
            <div className="card text-center">
              <div className="text-muted">Waiting for others…</div>
              <div className="spinner" style={{ margin: '12px auto 0' }} />
              <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                {(room.nightReady || []).length} / {room.players.length} ready
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-muted text-center">Loading role…</div>
      )}
    </div>
  )
}
