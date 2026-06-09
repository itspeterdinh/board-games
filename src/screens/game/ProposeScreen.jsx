import { useState } from 'react'
import { proposeTeam } from '../../roomActions'
import { QUEST_SIZES } from '../../avalon'
import QuestHeader from './QuestHeader'
import PlayerAvatar from '../../components/PlayerAvatar'

export default function ProposeScreen({ user, room }) {
  const isLeader = room.leader === user.uid
  const teamSize = QUEST_SIZES[room.players.length]?.[room.currentQuest] || 2
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  function toggle(id) {
    if (selected.includes(id)) {
      setSelected(s => s.filter(x => x !== id))
    } else if (selected.length < teamSize) {
      setSelected(s => [...s, id])
    }
  }

  async function handlePropose() {
    if (selected.length !== teamSize) return
    setLoading(true)
    await proposeTeam(room.id, selected)
    setLoading(false)
  }

  const leader = room.players.find(p => p.id === room.leader)

  return (
    <div className="screen">
      <div className="screen-title">⚔️ Quest {room.currentQuest + 1}</div>
      <QuestHeader room={room} />

      <div className="card">
        <div className="card-title">Leader</div>
        <div className="player-row">
          <PlayerAvatar player={leader} />
          <div className="player-name">{leader?.displayName}</div>
          {leader?.id === user.uid && <span className="player-badge you">You</span>}
          <span className="player-badge host">👑 Leader</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          {isLeader ? `Choose ${teamSize} players for the quest` : `Leader is choosing ${teamSize} players`}
        </div>
        <div className="player-list">
          {room.players.map(p => (
            <div
              key={p.id}
              className={`player-row ${isLeader ? 'selectable' : ''} ${selected.includes(p.id) ? 'selected' : ''}`}
              onClick={() => isLeader && toggle(p.id)}
              style={{ cursor: isLeader ? 'pointer' : 'default' }}
            >
              <PlayerAvatar player={p} style={selected.includes(p.id) ? { background: 'var(--gold)' } : {}} />
              <div className="player-name">{p.displayName}</div>
              {p.id === user.uid && <span className="player-badge you">You</span>}
              {selected.includes(p.id) && <span className="player-badge host">✓ Quest</span>}
            </div>
          ))}
        </div>
      </div>

      {isLeader && (
        <button
          className="btn btn-primary"
          disabled={selected.length !== teamSize || loading}
          onClick={handlePropose}
        >
          {loading ? '...' : `Propose Team (${selected.length}/${teamSize})`}
        </button>
      )}

      {!isLeader && (
        <div className="card text-center">
          <div className="text-muted">Waiting for {leader?.displayName} to propose a team…</div>
          <div className="spinner" style={{ margin: '12px auto 0' }} />
        </div>
      )}
    </div>
  )
}
