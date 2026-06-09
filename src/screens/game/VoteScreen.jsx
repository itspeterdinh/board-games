import { castVote } from '../../roomActions'
import QuestHeader from './QuestHeader'

export default function VoteScreen({ user, room }) {
  const myVote = room.votes?.[user.uid]
  const team = room.team || []
  const totalVotes = Object.keys(room.votes || {}).length
  const hasVoted = myVote !== undefined

  const teamPlayers = team.map(id => room.players.find(p => p.id === id)).filter(Boolean)

  async function vote(approve) {
    await castVote(room.id, user.uid, approve)
  }

  return (
    <div className="screen">
      <div className="screen-title">🗳️ Team Vote</div>
      <QuestHeader room={room} />

      <div className="card">
        <div className="card-title">Proposed Team</div>
        <div className="player-list">
          {teamPlayers.map(p => (
            <div className="player-row" key={p.id}>
              <div className="avatar">{p.displayName[0].toUpperCase()}</div>
              <div className="player-name">{p.displayName}</div>
              {p.id === user.uid && <span className="player-badge you">You</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Your Vote</div>
        {!hasVoted ? (
          <div className="vote-row">
            <button className="btn btn-success" onClick={() => vote(true)}>✓ Approve</button>
            <button className="btn btn-danger"  onClick={() => vote(false)}>✗ Reject</button>
          </div>
        ) : (
          <div className="text-center">
            <div style={{ fontSize: '1.1rem', marginBottom: 6 }}>
              You voted: <strong style={{ color: myVote ? 'var(--green)' : 'var(--red)' }}>
                {myVote ? 'Approve ✓' : 'Reject ✗'}
              </strong>
            </div>
            <div className="text-muted">Waiting for others… ({totalVotes}/{room.players.length})</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Votes Cast</div>
        <div className="vote-result">
          {room.players.map(p => (
            <div
              key={p.id}
              className={`vote-chip ${room.votes?.[p.id] === true ? 'approve' : room.votes?.[p.id] === false ? 'reject' : ''}`}
            >
              {p.displayName}
              {room.votes?.[p.id] !== undefined ? (room.votes[p.id] ? ' ✓' : ' ✗') : ' …'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
