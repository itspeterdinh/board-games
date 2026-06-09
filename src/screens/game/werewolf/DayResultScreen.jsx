import { useEffect, useState } from 'react'
import { WW_ROLES } from '../../../werewolf'
import { advanceFromDayResult } from '../../../werewolfActions'
import PlayerAvatar from '../../../components/PlayerAvatar'
import PreviousNightsLog from './PreviousNightsLog'

export default function DayResultScreen({ user, room }) {
  const { dayEliminated, dayExtraDeaths, players, roles, hostId, round, nightLogs } = room
  const isHost = user.uid === hostId
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const [advanced, setAdvanced] = useState(false)

  useEffect(() => {
    if (!isHost || advanced) return
    const t = setTimeout(async () => {
      setAdvanced(true)
      await advanceFromDayResult(room.id)
    }, 5000)
    return () => clearTimeout(t)
  }, [isHost])

  const eliminatedPlayer = dayEliminated ? playerMap[dayEliminated] : null
  const eliminatedRole = dayEliminated ? WW_ROLES[roles?.[dayEliminated]] : null
  const extras = dayExtraDeaths || []

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
        <div style={{ fontSize: '2.4rem' }}>⚖️</div>
        <div className="screen-title" style={{ marginTop: 4 }}>Village Vote — Round {round}</div>
      </div>

      {!dayEliminated ? (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🤝</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No majority!</div>
          <div className="text-muted" style={{ marginTop: 6 }}>The votes were tied. No one was eliminated.</div>
        </div>
      ) : (
        <>
          <div style={{
            background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.5)',
            borderRadius: 16, padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>💀</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{eliminatedPlayer?.displayName}</div>
            {isHost && (
              <div style={{ color: eliminatedRole?.color, fontWeight: 600, marginTop: 4 }}>
                {eliminatedRole?.name || roles?.[dayEliminated]}
                {' '}
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.85rem' }}>
                  ({eliminatedRole?.team === 'werewolves' ? 'Werewolves' : 'Village'})
                </span>
              </div>
            )}
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 6 }}>
              was eliminated by the village.
            </div>
          </div>

          {/* Heartbreak deaths */}
          {extras.map((d, i) => {
            const p = playerMap[d.id]
            const roleData = WW_ROLES[roles?.[d.id]]
            return (
              <div key={i} style={{
                background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.4)',
                borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <PlayerAvatar player={p} style={{ opacity: 0.6, filter: 'grayscale(0.5)' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{d.displayName}</div>
                  {isHost && <div style={{ fontSize: '0.8rem', color: '#e91e8c' }}>💔 Died of heartbreak</div>}
                  {isHost && (
                    <div style={{ fontSize: '0.78rem', color: roleData?.color }}>
                      {roleData?.icon} {roleData?.name}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      <div className="card text-center">
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          {isHost ? 'Advancing in a moment…' : 'Waiting for next phase…'}
        </div>
        <div className="spinner" style={{ margin: '10px auto 0' }} />
      </div>

      {isHost && nightLogs?.length > 0 && (
        <PreviousNightsLog nightLogs={nightLogs} playerMap={playerMap} roles={roles} />
      )}
    </div>
  )
}
