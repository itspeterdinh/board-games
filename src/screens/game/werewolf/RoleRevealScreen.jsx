import { useState } from 'react'
import { WW_ROLES } from '../../../werewolf'
import { startNightFromRoleReveal } from '../../../werewolfActions'
import PlayerAvatar from '../../../components/PlayerAvatar'

export default function RoleRevealScreen({ user, room }) {
  const { roles, players, hostId, nightInfo, lovers } = room
  const isHost = user.uid === hostId
  const myRole = roles?.[user.uid]
  const roleData = WW_ROLES[myRole]
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const [starting, setStarting] = useState(false)

  async function handleStartNight() {
    setStarting(true)
    await startNightFromRoleReveal(room.id)
  }

  if (isHost) {
    return (
      <div className="screen">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: '2rem' }}>📋</div>
          <div className="screen-title" style={{ marginTop: 4 }}>Moderator — Roles Assigned</div>
          <div className="screen-subtitle">Players are viewing their roles. Start night when ready.</div>
        </div>

        <div className="card">
          <div className="card-title">🔍 All Roles</div>
          <div className="player-list">
            {players.filter(p => p.id !== hostId).map(p => {
              const role = roles?.[p.id]
              const rd = WW_ROLES[role]
              return (
                <div key={p.id} className="player-row">
                  <PlayerAvatar player={p} style={{ border: `2px solid ${rd?.border || 'var(--border)'}` }} />
                  <div className="player-name">{p.displayName}</div>
                  <span className="player-badge" style={{ color: rd?.color, borderColor: rd?.color }}>
                    {rd?.icon} {rd?.name || role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleStartNight} disabled={starting}>
          {starting ? '⏳…' : '🌙 Start Night'}
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: '2.4rem' }}>🌙</div>
        <div className="screen-title" style={{ marginTop: 4 }}>Your Role</div>
        <div className="screen-subtitle">Memorise it — night begins soon.</div>
      </div>

      {roleData && (
        <div style={{
          borderRadius: 20, padding: '28px 24px',
          background: roleData.bg, border: `2px solid ${roleData.border}`,
          boxShadow: `0 0 40px ${roleData.glow}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3.5rem' }}>{roleData.icon}</div>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', color: roleData.color }}>{roleData.name}</div>
          <div style={{
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: roleData.team === 'werewolves' ? '#e74c3c' : '#7ec8a0',
          }}>
            {roleData.team === 'werewolves' ? '🐺 Werewolves' : '🏘️ Village'}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>{roleData.desc}</div>
          {nightInfo?.[user.uid]?.sees?.length > 0 && (
            <div style={{ fontSize: '0.85rem', color: roleData.color }}>
              {nightInfo[user.uid].label} <strong>{nightInfo[user.uid].sees.join(', ')}</strong>
            </div>
          )}
          {lovers?.includes(user.uid) && (() => {
            const other = lovers.find(l => l !== user.uid)
            return (
              <div style={{ fontSize: '0.85rem', color: '#e91e8c' }}>
                💘 Lovers with <strong>{playerMap[other]?.displayName}</strong>
              </div>
            )
          })()}
        </div>
      )}

      <div className="card text-center">
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Waiting for the moderator to start the night…</div>
        <div className="spinner" style={{ margin: '10px auto 0' }} />
      </div>
    </div>
  )
}
