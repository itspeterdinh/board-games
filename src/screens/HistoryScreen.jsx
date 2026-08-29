import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import RoleCard from '../components/RoleCard'
import { ROLE_CONFIG } from '../components/RoleCard'

export default function HistoryScreen({ user, onBack }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'gameHistory'),
          orderBy('playedAt', 'desc'),
          limit(50)
        )
        const snap = await getDocs(q)
        setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Failed to load history:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.uid])

  const wins   = games.filter(g => g.won).length
  const losses = games.filter(g => !g.won).length
  const rate   = games.length ? Math.round((wins / games.length) * 100) : null

  if (selected) {
    return <GameDetail game={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="screen">
      <div className="header-row">
        <button className="btn btn-ghost btn-small" onClick={onBack}>← Back</button>
        <div className="screen-title" style={{ flex: 1, textAlign: 'center' }}>Game History</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Stats */}
      {games.length > 0 && (
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <span style={{ ...styles.statNum, color: 'var(--green)' }}>{wins}</span>
            <span style={styles.statLabel}>Wins</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statNum, color: 'var(--red)' }}>{losses}</span>
            <span style={styles.statLabel}>Losses</span>
          </div>
          <div style={styles.statBox}>
            <span style={{ ...styles.statNum, color: 'var(--gold)' }}>{rate}%</span>
            <span style={styles.statLabel}>Win Rate</span>
          </div>
        </div>
      )}

      {loading && <div className="spinner" style={{ margin: '40px auto' }} />}

      {!loading && games.length === 0 && (
        <div className="card text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📜</div>
          <div className="text-muted">No games played yet.</div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
            Complete a game to see your history here.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {games.map(game => {
          const cfg = ROLE_CONFIG[game.role]
          return (
            <div
              key={game.id}
              onClick={() => setSelected(game)}
              style={{
                ...styles.gameRow,
                borderColor: game.won ? 'rgba(39,174,96,0.4)' : 'rgba(192,57,43,0.25)',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg?.bg || 'var(--surface2)',
                border: `1.5px solid ${cfg?.border || 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>
                {roleEmoji(game.role)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: cfg?.color || 'var(--text)' }}>
                  {cfg?.name || game.role}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                  {game.playerCount} players · {formatDate(game.playedAt)}
                </div>
              </div>
              <div style={{
                fontWeight: 700, fontSize: '0.85rem',
                color: game.won ? 'var(--green)' : 'var(--red)',
                flexShrink: 0,
              }}>
                {game.won ? '✓ Win' : '✗ Loss'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GameDetail({ game, onBack }) {
  const cfg = ROLE_CONFIG[game.role]
  return (
    <div className="screen">
      <div className="header-row">
        <button className="btn btn-ghost btn-small" onClick={onBack}>← Back</button>
        <div className="screen-title" style={{ flex: 1 }}>Game Details</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <RoleCard role={game.role} showDesc={true} />
      </div>

      <div className="card">
        <div className="card-title">Result</div>
        <div style={{
          textAlign: 'center', padding: '12px',
          borderRadius: 10,
          background: game.won ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)',
          border: `1px solid ${game.won ? 'var(--green)' : 'var(--red)'}`,
          fontWeight: 700,
          color: game.won ? 'var(--green-light)' : 'var(--red-light)',
          fontSize: '1.1rem',
        }}>
          {game.won ? '✦ Victory' : '✦ Defeat'}
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <InfoRow label="Team" value={cfg?.team === 'good' ? '⚔️ Servants of Arthur' : '💀 Minions of Mordred'} />
          <InfoRow label="Players" value={game.playerCount} />
          <InfoRow label="Quests" value={`${game.questResults?.filter(Boolean).length ?? '?'} won / ${game.questResults?.filter(r => !r).length ?? '?'} failed`} />
          {game.assassinated !== undefined && (
            <InfoRow label="Merlin found" value={game.assassinated ? 'Yes (evil stole win)' : 'No'} />
          )}
          <InfoRow label="Played" value={formatDate(game.playedAt)} />
        </div>
      </div>

      {game.players && (
        <div className="card">
          <div className="card-title">Players</div>
          <div className="player-list">
            {game.players.map((p, i) => (
              <div key={i} className="player-row">
                <div className={`avatar ${ROLE_CONFIG[p.role]?.team || ''}`}>
                  {roleEmoji(p.role)}
                </div>
                <div className="player-name">{p.displayName}</div>
                <span className="player-badge" style={{
                  color: ROLE_CONFIG[p.role]?.color,
                  borderColor: ROLE_CONFIG[p.role]?.color,
                }}>
                  {ROLE_CONFIG[p.role]?.name || p.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function roleEmoji(role) {
  const map = { MERLIN:'🔮', PERCIVAL:'🛡️', LOYAL_SERVANT:'⚔️', ASSASSIN:'🗡️', MORGANA:'🌙', MORDRED:'👑', OBERON:'👁️', MINION:'💀' }
  return map[role] || '❓'
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const styles = {
  statsRow: {
    display: 'flex',
    gap: 10,
  },
  statBox: {
    flex: 1,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontSize: '1.8rem',
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.72rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  gameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--surface)',
    border: '1px solid',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
  },
}
