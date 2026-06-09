import { useState } from 'react'
import { WW_ROLES } from '../../../werewolf'
import { advanceFromDayReveal } from '../../../werewolfActions'
import PlayerAvatar from '../../../components/PlayerAvatar'
import PreviousNightsLog from './PreviousNightsLog'

const KILL_LABELS = {
  wolves: '🐺 Killed by the wolves',
  witch: '☠️ Poisoned by the witch',
  heartbreak: '💔 Died of heartbreak',
  vote: '⚖️ Eliminated by the village',
  hunter: '🏹 Shot by the Hunter',
}

export default function DayRevealScreen({ user, room }) {
  const { nightDeaths, players, roles, hostId, round, nightLogs } = room
  const isHost = user.uid === hostId
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const [advancing, setAdvancing] = useState(false)

  async function handleAdvance() {
    setAdvancing(true)
    await advanceFromDayReveal(room.id)
  }

  const deaths = nightDeaths || []

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
        <div style={{ fontSize: isHost ? '2rem' : '2.4rem' }}>{isHost ? '📋' : '🌅'}</div>
        <div className="screen-title" style={{ marginTop: 4 }}>{isHost ? 'Moderator — Morning' : 'Morning'} — Round {round}</div>
        <div className="screen-subtitle">
          {deaths.length === 0 ? 'The village slept peacefully. No one died.' : `${deaths.length} player${deaths.length > 1 ? 's' : ''} did not survive the night.`}
        </div>
      </div>

      {deaths.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>😌</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green-light,#2ecc71)' }}>
            A peaceful night!
          </div>
          <div className="text-muted" style={{ marginTop: 6 }}>No one was killed tonight.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deaths.map(d => {
            const p = playerMap[d.id]
            const roleData = WW_ROLES[d.role]
            return (
              <div key={d.id} style={{
                background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.4)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <PlayerAvatar player={p} style={{ opacity: 0.6, filter: 'grayscale(0.6)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{p?.displayName || d.id}</div>
                  {isHost && (
                    <div style={{ fontSize: '0.82rem', color: roleData?.color || 'var(--muted)', marginTop: 2 }}>
                      {roleData?.icon} {roleData?.name || d.role}
                      {' · '}
                      <span style={{ color: 'var(--muted)' }}>{roleData?.team === 'werewolves' ? 'Werewolves' : 'Village'}</span>
                    </div>
                  )}
                  {isHost && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                      {KILL_LABELS[d.killedBy] || d.killedBy}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isHost ? (
        <button className="btn btn-primary" onClick={handleAdvance} disabled={advancing}>
          {advancing ? '⏳ Starting day…' : '☀️ Begin Day Discussion'}
        </button>
      ) : (
        <div className="card text-center">
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>Waiting for the moderator…</div>
          <div className="spinner" style={{ margin: '10px auto 0' }} />
        </div>
      )}

      {isHost && nightLogs?.length > 0 && (
        <PreviousNightsLog nightLogs={nightLogs} playerMap={playerMap} roles={roles} />
      )}
    </div>
  )
}
