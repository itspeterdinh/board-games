import { useState } from 'react'
import { WW_ROLES } from '../../../werewolf'
import { advanceFromDayReveal, revealNightDeaths } from '../../../werewolfActions'
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
  const { nightDeaths, nightDeathsRevealed, players, roles, hostId, round, nightLogs, winner } = room
  const isHost = user.uid === hostId
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const [advancing, setAdvancing] = useState(false)
  const [revealing, setRevealing] = useState(false)

  const deaths = nightDeaths || []
  const revealed = nightDeathsRevealed === true

  async function handleReveal() {
    setRevealing(true)
    await revealNightDeaths(room.id)
  }

  async function handleAdvance() {
    setAdvancing(true)
    await advanceFromDayReveal(room.id)
  }

  const deathCards = (
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
  )

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
        <div style={{ fontSize: isHost ? '2rem' : '2.4rem' }}>{isHost ? '📋' : '🌅'}</div>
        <div className="screen-title" style={{ marginTop: 4 }}>{isHost ? 'Moderator — Morning' : 'Morning'} — Round {round}</div>
        {revealed && (
          <div className="screen-subtitle">
            {deaths.length === 0 ? 'The village slept peacefully. No one died.' : `${deaths.length} player${deaths.length > 1 ? 's' : ''} did not survive the night.`}
          </div>
        )}
      </div>

      {/* Host sees deaths always; players see them only after reveal */}
      {isHost && deaths.length === 0 && (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>😌</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green-light,#2ecc71)' }}>A peaceful night!</div>
          <div className="text-muted" style={{ marginTop: 6 }}>No one was killed tonight.</div>
        </div>
      )}
      {isHost && deaths.length > 0 && deathCards}

      {!isHost && revealed && deaths.length === 0 && (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>😌</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green-light,#2ecc71)' }}>A peaceful night!</div>
          <div className="text-muted" style={{ marginTop: 6 }}>No one was killed tonight.</div>
        </div>
      )}
      {!isHost && revealed && deaths.length > 0 && deathCards}

      {!isHost && !revealed && (
        <div className="card text-center">
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>Waiting for the moderator to announce…</div>
          <div className="spinner" style={{ margin: '10px auto 0' }} />
        </div>
      )}

      {isHost && !revealed && (
        <button className="btn btn-primary" onClick={handleReveal} disabled={revealing}>
          {revealing ? '⏳…' : '📢 Reveal Deaths'}
        </button>
      )}
      {isHost && revealed && winner && (
        <div style={{
          borderRadius: 16, padding: '20px', textAlign: 'center', marginTop: 8,
          background: winner === 'werewolves'
            ? 'linear-gradient(135deg, rgba(44,10,10,0.9), rgba(61,17,17,0.9))'
            : 'linear-gradient(135deg, rgba(13,40,24,0.9), rgba(22,61,39,0.9))',
          border: `1.5px solid ${winner === 'werewolves' ? '#e74c3c' : '#7ec8a0'}`,
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{winner === 'werewolves' ? '🐺' : '🏘️'}</div>
          <h2 style={{ margin: 0, color: winner === 'werewolves' ? '#e74c3c' : '#7ec8a0', fontSize: '1.4rem' }}>
            {winner === 'werewolves' ? 'Werewolves Win!' : 'Village Wins!'}
          </h2>
          <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.88rem' }}>
            {winner === 'werewolves' ? 'The wolves have taken over the village.' : 'The villagers hunted down every last wolf.'}
          </div>
        </div>
      )}
      {isHost && revealed && (
        <button className="btn btn-primary" onClick={handleAdvance} disabled={advancing}>
          {advancing ? '⏳…' : winner ? '🏁 End Game' : '☀️ Begin Day Discussion'}
        </button>
      )}

      {isHost && nightLogs?.length > 0 && (
        <PreviousNightsLog nightLogs={nightLogs} playerMap={playerMap} roles={roles} />
      )}
    </div>
  )
}
