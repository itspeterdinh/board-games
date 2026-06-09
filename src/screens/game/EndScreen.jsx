import { resetToLobby } from '../../roomActions'
import { ROLES } from '../../avalon'

const ROLE_ICONS_MAP = {
  MERLIN: '🔮', PERCIVAL: '🛡️', LOYAL_SERVANT: '⚔️',
  ASSASSIN: '🗡️', MORGANA: '🌙', MORDRED: '👑', OBERON: '👁️', MINION: '💀',
}

export default function EndScreen({ user, room, onLeave }) {
  const isHost = room.hostId === user.uid
  const { winner, questResults, roles, players, assassinTarget } = room
  const isGood = winner === 'good'

  const merlinId = Object.entries(roles || {}).find(([, r]) => r === 'MERLIN')?.[0]
  const assassinPlayer = players.find(p => roles?.[p.id] === 'ASSASSIN')
  const targetPlayer = players.find(p => p.id === assassinTarget)
  const merlinPlayer = players.find(p => p.id === merlinId)

  const assassinationHappened = assassinTarget != null

  return (
    <div className="screen">
      <div className="screen-title">🏁 Game Over</div>

      <div className={`winner-banner ${isGood ? 'good' : 'evil'}`}>
        <h2>{isGood ? '✦ Good Wins! ✦' : '✦ Evil Wins! ✦'}</h2>
        <p>
          {!isGood && assassinationHappened && targetPlayer?.id === merlinId
            ? `${assassinPlayer?.displayName} correctly identified Merlin (${merlinPlayer?.displayName})!`
            : !isGood && questResults?.filter(r => !r).length >= 3
            ? 'Evil sabotaged 3 quests!'
            : !isGood
            ? '5 consecutive team rejections!'
            : assassinationHappened
            ? `${assassinPlayer?.displayName} failed to identify Merlin.`
            : 'The servants of Arthur completed 3 quests!'}
        </p>
      </div>

      {assassinationHappened && (
        <div className="card">
          <div className="card-title">Assassination</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            {assassinPlayer?.displayName} targeted <strong style={{ color: 'var(--text)' }}>{targetPlayer?.displayName}</strong>
            {targetPlayer?.id === merlinId
              ? <span style={{ color: 'var(--red)' }}> — that was Merlin! Evil wins.</span>
              : <span style={{ color: 'var(--green)' }}> — not Merlin. Good wins.</span>}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--muted)' }}>
            Merlin was: <strong style={{ color: 'var(--gold)' }}>{merlinPlayer?.displayName}</strong>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">All Roles Revealed</div>
        <div className="player-list">
          {players.map(p => {
            const role = roles?.[p.id]
            const roleData = ROLES[role]
            return (
              <div className="player-row" key={p.id}>
                <div className={`avatar ${roleData?.team || ''}`}>
                  {ROLE_ICONS_MAP[role] || p.displayName[0].toUpperCase()}
                </div>
                <div className="player-name">{p.displayName}</div>
                <span className="player-badge" style={{
                  color: roleData?.team === 'good' ? 'var(--gold)' : 'var(--red)',
                  borderColor: roleData?.team === 'good' ? 'var(--gold)' : 'var(--red)',
                }}>
                  {roleData?.name || role}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Quest Results</div>
        <div className="quest-tracker">
          {(questResults || []).map((r, i) => (
            <div key={i} className={`quest-dot ${r ? 'success' : 'fail'}`}>
              {r ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button className="btn btn-primary" onClick={() => resetToLobby(room.id)}>
          Play Again
        </button>
      ) : (
        <div className="text-muted text-center">Waiting for host to start a new game…</div>
      )}
      <button className="btn btn-ghost" onClick={onLeave}>Leave Room</button>
    </div>
  )
}
