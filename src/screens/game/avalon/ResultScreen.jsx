import { useState, useEffect } from 'react'
import { advanceFromResult } from '../../../roomActions'
import QuestHeader from './QuestHeader'

export default function ResultScreen({ user, room }) {
  const cards = room.revealCards || []
  const [revealed, setRevealed] = useState([])
  const [done, setDone] = useState(false)
  const isHost = room.hostId === user.uid

  const successes = cards.filter(c => c === 'success').length
  const fails = cards.filter(c => c === 'fail').length
  const passed = room.questResults?.[room.questResults.length - 1]

  // Reveal one card every (4000 / cards.length) ms, then show result at 4.5s
  useEffect(() => {
    if (cards.length === 0) return
    const interval = Math.min(800, Math.floor(3500 / cards.length))

    const timers = cards.map((_, i) =>
      setTimeout(() => setRevealed(r => [...r, i]), (i + 1) * interval)
    )
    const resultTimer = setTimeout(() => setDone(true), cards.length * interval + 600)

    return () => { timers.forEach(clearTimeout); clearTimeout(resultTimer) }
  }, [cards.length])

  // Host auto-advances after 5s
  useEffect(() => {
    if (!done || !isHost) return
    const t = setTimeout(() => advanceFromResult(room.id), 2500)
    return () => clearTimeout(t)
  }, [done, isHost])

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div className="screen-title">Quest {room.currentQuest + 1} Result</div>
      <QuestHeader room={room} />


      {/* Tally */}
      {done && (
        <div style={styles.tally}>
          <div style={styles.tallyItem}>
            <span style={{ ...styles.tallyNum, color: 'var(--green)' }}>{successes}</span>
            <span style={styles.tallyLabel}>Success</span>
          </div>
          <div style={styles.tallyDivider} />
          <div style={styles.tallyItem}>
            <span style={{ ...styles.tallyNum, color: 'var(--red)' }}>{fails}</span>
            <span style={styles.tallyLabel}>Fail</span>
          </div>
        </div>
      )}

      {/* Banner */}
      {done && (
        <div style={{
          ...styles.banner,
          background: passed ? 'rgba(39,174,96,0.15)' : 'rgba(192,57,43,0.15)',
          border: `2px solid ${passed ? 'var(--green)' : 'var(--red)'}`,
          color: passed ? 'var(--green-light)' : 'var(--red-light)',
        }}>
          {passed ? '✦ Quest Succeeded ✦' : '✦ Quest Failed ✦'}
        </div>
      )}

      {done && !isHost && (
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Continuing in a moment…</div>
      )}
    </div>
  )
}

const styles = {
  cardsRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    width: 64,
    height: 88,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: 800,
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  cardHidden: {
    background: '#1f1f38',
    border: '2px solid #2e2e50',
    color: '#8888aa',
    fontSize: '1.4rem',
  },
  cardSuccess: {
    background: 'rgba(39,174,96,0.2)',
    border: '2px solid var(--green)',
    color: 'var(--green-light)',
    transform: 'scale(1.08)',
  },
  cardFail: {
    background: 'rgba(192,57,43,0.2)',
    border: '2px solid var(--red)',
    color: 'var(--red-light)',
    transform: 'scale(1.08)',
  },
  tally: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '16px 32px',
  },
  tallyItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  tallyNum: {
    fontSize: '2.4rem',
    fontWeight: 800,
    lineHeight: 1,
  },
  tallyLabel: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  tallyDivider: {
    width: 1,
    height: 48,
    background: 'var(--border)',
  },
  banner: {
    width: '100%',
    textAlign: 'center',
    padding: '16px 20px',
    borderRadius: 12,
    fontSize: '1.2rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
}
