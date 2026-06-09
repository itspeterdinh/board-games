import { castVote } from '../../roomActions'
import QuestHeader from './QuestHeader'
import PlayerAvatar from '../../components/PlayerAvatar'

export default function VoteScreen({ user, room }) {
  const myVote = room.votes?.[user.uid]
  const team = room.team || []
  const totalVotes = Object.keys(room.votes || {}).length
  const totalPlayers = room.players.length
  const allVoted = totalVotes >= totalPlayers
  const hasVoted = myVote !== undefined

  const teamPlayers = team.map(id => room.players.find(p => p.id === id)).filter(Boolean)

  // Only tally revealed after everyone voted
  const approvals = allVoted ? Object.values(room.votes).filter(Boolean).length : null
  const rejections = allVoted ? totalPlayers - approvals : null
  const passed = allVoted ? approvals > totalPlayers / 2 : null

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
              <PlayerAvatar player={p} />
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
              You voted:{' '}
              <strong style={{ color: myVote ? 'var(--green)' : 'var(--red)' }}>
                {myVote ? 'Approve ✓' : 'Reject ✗'}
              </strong>
            </div>
            {!allVoted && (
              <div className="text-muted">Waiting for others… ({totalVotes}/{totalPlayers})</div>
            )}
          </div>
        )}
      </div>

      {/* Progress — only show who has voted, not how */}
      <div className="card">
        <div className="card-title">
          {allVoted ? 'Result' : `Waiting for votes (${totalVotes}/${totalPlayers})`}
        </div>

        {!allVoted ? (
          <div className="vote-result">
            {room.players.map(p => (
              <div key={p.id} className="vote-chip">
                {p.displayName}
                {room.votes?.[p.id] !== undefined ? ' ✓' : ' …'}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.4rem', fontWeight: 700, marginBottom: 8,
              color: passed ? 'var(--green)' : 'var(--red)',
            }}>
              {passed ? '✓ Approved' : '✗ Rejected'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green)' }}>{approvals}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Approve</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--red)' }}>{rejections}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Reject</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
