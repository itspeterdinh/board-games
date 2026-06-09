import { useState, useEffect } from 'react'
import { advanceFromVoteResult } from '../../roomActions'
import QuestHeader from './QuestHeader'

export default function VoteResultScreen({ user, room }) {
  const { votePassed, voteApprovals, players, votes } = room
  const total = players.length
  const rejections = total - voteApprovals
  const isHost = room.hostId === user.uid

  const [phase, setPhase] = useState('counting') // counting → reveal → banner
  const [countApprove, setCountApprove] = useState(0)
  const [countReject, setCountReject] = useState(0)

  // Phase 1: count up numbers over ~1.5s
  useEffect(() => {
    const steps = 20
    const duration = 1500
    const interval = duration / steps
    let step = 0
    const t = setInterval(() => {
      step++
      const progress = step / steps
      setCountApprove(Math.round(voteApprovals * progress))
      setCountReject(Math.round(rejections * progress))
      if (step >= steps) {
        clearInterval(t)
        setCountApprove(voteApprovals)
        setCountReject(rejections)
        setTimeout(() => setPhase('reveal'), 300)
      }
    }, interval)
    return () => clearInterval(t)
  }, [])

  // Phase 2: show verdict after short pause
  useEffect(() => {
    if (phase !== 'reveal') return
    const t = setTimeout(() => setPhase('banner'), 600)
    return () => clearTimeout(t)
  }, [phase])

  // Host auto-advances 2.5s after banner appears
  useEffect(() => {
    if (phase !== 'banner' || !isHost) return
    const t = setTimeout(() => advanceFromVoteResult(room.id), 2500)
    return () => clearTimeout(t)
  }, [phase, isHost])

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div className="screen-title">🗳️ Vote Result</div>
      <QuestHeader room={room} />

      {/* Big tally */}
      <div style={styles.tally}>
        <div style={styles.tallyItem}>
          <span style={{ ...styles.tallyNum, color: 'var(--green)' }}>{countApprove}</span>
          <span style={styles.tallyLabel}>Approve</span>
        </div>
        <div style={styles.tallyDivider} />
        <div style={styles.tallyItem}>
          <span style={{ ...styles.tallyNum, color: 'var(--red)' }}>{countReject}</span>
          <span style={styles.tallyLabel}>Reject</span>
        </div>
      </div>

      {/* Vote dots — who voted (not how) */}
      {phase !== 'counting' && (
        <div style={styles.dotsWrap}>
          {players.map(p => (
            <div
              key={p.id}
              style={{
                ...styles.dot,
                background: votes?.[p.id] !== undefined
                  ? (phase === 'banner'
                    ? (votes[p.id] ? 'var(--green)' : 'var(--red)')
                    : 'var(--gold)')
                  : 'var(--surface2)',
                border: `2px solid ${votes?.[p.id] !== undefined ? 'transparent' : 'var(--border)'}`,
                transform: votes?.[p.id] !== undefined ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
              title={p.displayName}
            />
          ))}
        </div>
      )}

      {/* Verdict banner */}
      {phase === 'banner' && (
        <div style={{
          ...styles.banner,
          background: votePassed ? 'rgba(39,174,96,0.15)' : 'rgba(192,57,43,0.15)',
          border: `2px solid ${votePassed ? 'var(--green)' : 'var(--red)'}`,
          color: votePassed ? 'var(--green-light)' : 'var(--red-light)',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>
            {votePassed ? '✦ Team Approved ✦' : '✦ Team Rejected ✦'}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
            {votePassed
              ? 'The quest team sets out!'
              : room.rejectionCount + 1 >= 5
                ? 'Fifth rejection — Evil wins!'
                : `${5 - room.rejectionCount - 1} rejection${5 - room.rejectionCount - 1 !== 1 ? 's' : ''} remaining`}
          </div>
        </div>
      )}

      {phase === 'banner' && !isHost && (
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Continuing in a moment…</div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  tally: {
    display: 'flex',
    gap: 32,
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '24px 40px',
  },
  tallyItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  tallyNum: {
    fontSize: '3rem',
    fontWeight: 900,
    lineHeight: 1,
    transition: 'all 0.05s',
    fontVariantNumeric: 'tabular-nums',
  },
  tallyLabel: {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  tallyDivider: {
    width: 1,
    height: 56,
    background: 'var(--border)',
  },
  dotsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 280,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
  },
  banner: {
    width: '100%',
    textAlign: 'center',
    padding: '18px 20px',
    borderRadius: 14,
  },
}
