import { useState } from 'react'
import { assassinate } from '../../roomActions'
import QuestHeader from './QuestHeader'

export default function AssassinScreen({ user, room }) {
  const myRole = room.roles?.[user.uid]
  const isAssassin = myRole === 'ASSASSIN'
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(false)

  // Only show non-evil players as targets
  const evilRoles = ['ASSASSIN','MORGANA','MORDRED','OBERON','MINION']
  const goodPlayers = room.players.filter(p => !evilRoles.includes(room.roles?.[p.id]))

  async function handleAssassinate() {
    if (!target) return
    setLoading(true)
    await assassinate(room.id, target)
    setLoading(false)
  }

  return (
    <div className="screen">
      <div className="screen-title">🗡️ Assassination</div>
      <QuestHeader room={room} />

      <div className="card">
        <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          Good has completed 3 quests! But evil may still win — the Assassin must name Merlin.
        </div>
      </div>

      {isAssassin ? (
        <>
          <div className="card">
            <div className="card-title">Choose who is Merlin</div>
            <div className="player-list">
              {goodPlayers.map(p => (
                <div
                  key={p.id}
                  className={`player-row ${target === p.id ? 'selected' : ''}`}
                  onClick={() => setTarget(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="avatar" style={target === p.id ? { background: 'var(--red)' } : {}}>
                    {p.displayName[0].toUpperCase()}
                  </div>
                  <div className="player-name">{p.displayName}</div>
                  {target === p.id && <span className="player-badge" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>Target</span>}
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn btn-danger"
            disabled={!target || loading}
            onClick={handleAssassinate}
          >
            {loading ? '...' : `Assassinate ${target ? goodPlayers.find(p => p.id === target)?.displayName : '?'}`}
          </button>
        </>
      ) : (
        <div className="card text-center">
          <div className="text-muted">
            {myRole === 'MERLIN'
              ? '⚠️ You are Merlin. Stay calm. Give nothing away.'
              : 'The Assassin is deciding who Merlin is…'}
          </div>
          <div className="spinner" style={{ margin: '12px auto 0' }} />
        </div>
      )}
    </div>
  )
}
