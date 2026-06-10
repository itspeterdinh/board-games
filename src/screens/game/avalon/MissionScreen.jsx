import { playMissionCard } from '../../../roomActions'
import QuestHeader from './QuestHeader'
import PlayerAvatar from '../../../components/PlayerAvatar'

export default function MissionScreen({ user, room }) {
  const onTeam = (room.team || []).includes(user.uid)
  const myRole = room.roles?.[user.uid]
  const isEvil = ['ASSASSIN','MORGANA','MORDRED','OBERON','MINION'].includes(myRole)
  const played = room.missionCards?.[user.uid] !== undefined
  const totalPlayed = Object.keys(room.missionCards || {}).length
  const teamSize = room.team?.length || 0

  const teamPlayers = (room.team || []).map(id => room.players.find(p => p.id === id)).filter(Boolean)

  async function play(card) {
    await playMissionCard(room.id, user.uid, card)
  }

  return (
    <div className="screen">
      <div className="screen-title">🏰 Quest {room.currentQuest + 1}</div>
      <QuestHeader room={room} />

      <div className="card">
        <div className="card-title">Quest Team</div>
        <div className="player-list">
          {teamPlayers.map(p => (
            <div className="player-row" key={p.id}>
              <PlayerAvatar player={p} />
              <div className="player-name">{p.displayName}</div>
              {p.id === user.uid && <span className="player-badge you">You</span>}
              {room.missionCards?.[p.id] !== undefined && <span className="player-badge host">✓ Played</span>}
            </div>
          ))}
        </div>
        <div className="text-muted mt-2 text-center" style={{ fontSize: '0.8rem' }}>
          {totalPlayed}/{teamSize} cards played
        </div>
      </div>

      {onTeam && !played && (
        <div className="card">
          <div className="card-title">Play Your Card</div>
          <div className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
            {isEvil
              ? 'You may play Success or Fail. Cards are shuffled — no one knows who played what.'
              : 'You must play Success. Good players cannot play Fail cards.'}
          </div>
          <div className="mission-choice">
            <button className="btn btn-success" onClick={() => play('success')}>✓ Success</button>
            {isEvil && (
              <button className="btn btn-danger" onClick={() => play('fail')}>✗ Fail</button>
            )}
          </div>
        </div>
      )}

      {onTeam && played && (
        <div className="card text-center">
          <div>Card played. Waiting for others…</div>
          <div className="spinner" style={{ margin: '12px auto 0' }} />
        </div>
      )}

      {!onTeam && (
        <div className="card text-center">
          <div className="text-muted">You are not on this quest.</div>
          <div className="text-muted mt-2">Waiting for results… ({totalPlayed}/{teamSize})</div>
          <div className="spinner" style={{ margin: '12px auto 0' }} />
        </div>
      )}
    </div>
  )
}
