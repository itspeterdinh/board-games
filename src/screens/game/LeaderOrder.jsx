import { useState } from 'react'

export default function LeaderOrder({ room }) {
  const [activeI, setActiveI] = useState(null)

  if (!room.showLeaderOrder || !room.leaderOrder) return null

  const { leaderOrder, leaderIndex, players } = room
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  const count = leaderOrder.length
  const upcoming = Array.from({ length: count }, (_, i) =>
    leaderOrder[(leaderIndex + i) % count]
  )

  return (
    <div className="card">
      <div className="card-title">Leader Order</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {upcoming.map((id, i) => {
          const p = playerMap[id]
          if (!p) return null
          const isCurrent = i === 0
          const isActive = activeI === i

          return (
            <div
              key={`${id}-${i}`}
              onClick={() => setActiveI(isActive ? null : i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                cursor: 'pointer',
                minWidth: isActive ? 60 : isCurrent ? 42 : 34,
                transition: 'min-width 0.2s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: isCurrent ? 42 : 34,
                height: isCurrent ? 42 : 34,
                borderRadius: '50%',
                background: isCurrent ? 'var(--gold)' : isActive ? 'var(--surface)' : 'var(--surface2)',
                border: `${isCurrent ? 2 : 1.5}px solid ${isCurrent ? 'var(--gold)' : isActive ? 'var(--muted)' : 'var(--border)'}`,
                color: isCurrent ? '#0d0d1a' : 'var(--muted)',
                fontWeight: 700,
                fontSize: isCurrent ? '1rem' : '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCurrent ? '0 0 12px rgba(201,168,76,0.4)' : 'none',
                transition: 'all 0.2s',
              }}>
                {p.photoURL
                  ? <img src={p.photoURL} alt={p.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : p.displayName[0].toUpperCase()}
              </div>

              {/* Label — number normally, full name when active */}
              <div style={{
                fontSize: '0.7rem',
                color: isCurrent ? 'var(--gold)' : isActive ? 'var(--text)' : 'var(--muted)',
                textAlign: 'center',
                fontWeight: isCurrent || isActive ? 700 : 400,
                maxWidth: isActive ? 64 : 44,
                whiteSpace: isActive ? 'normal' : 'nowrap',
                overflow: isActive ? 'visible' : 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                wordBreak: 'break-word',
                transition: 'all 0.2s',
              }}>
                {isActive
                  ? (isCurrent ? `👑 ${p.displayName}` : p.displayName)
                  : isCurrent ? '👑' : `${i + 1}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
