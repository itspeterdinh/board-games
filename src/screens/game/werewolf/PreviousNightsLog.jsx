import { useState } from 'react'

const CAUSE_LABEL = {
  wolves:     '🐺 killed by wolves',
  witch:      '☠️ poisoned by witch',
  hunter:     '🏹 shot by hunter',
  heartbreak: '💔 died of heartbreak',
  vote:       '⚖️ eliminated by village',
}

function LogLine({ icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.83rem' }}>
      <span style={{ color: 'var(--muted)' }}>{icon} {label}</span>
      <span style={{ fontWeight: 600, color: valueColor || 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function PreviousNightsLog({ nightLogs, playerMap, roles }) {
  const [openRound, setOpenRound] = useState(null)
  if (!nightLogs?.length) return null

  return (
    <div className="card">
      <div className="card-title">📚 Previous Nights</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[...nightLogs].reverse().map(log => {
          const isOpen = openRound === log.round
          const deathNames = (log.deaths || [])
            .map(d => playerMap[d.id]?.displayName || d.id)
            .join(', ')

          return (
            <div key={log.round} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

              {/* Collapsed header */}
              <div
                onClick={() => setOpenRound(isOpen ? null : log.round)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', cursor: 'pointer',
                  background: isOpen ? 'var(--surface)' : 'var(--surface2)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>🌙 Night {log.round}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {log.deaths?.length > 0
                    ? <span style={{ fontSize: '0.78rem', color: 'var(--red,#e74c3c)' }}>💀 {deathNames}</span>
                    : <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>😌 No deaths</span>
                  }
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{
                  padding: '10px 14px', borderTop: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  {/* Cupid */}
                  {log.lovers && (
                    <LogLine icon="💘" label="Cupid linked"
                      value={`${playerMap[log.lovers[0]]?.displayName} & ${playerMap[log.lovers[1]]?.displayName}`} />
                  )}

                  {/* Wolves */}
                  {log.wolfKillTarget && (
                    <LogLine icon="🐺" label="Wolves targeted" value={playerMap[log.wolfKillTarget]?.displayName} />
                  )}
                  {Object.keys(log.wolfVotes || {}).length > 1 && (
                    <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Object.entries(log.wolfVotes).map(([wid, tid]) => (
                        <span key={wid} style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {playerMap[wid]?.displayName} voted → {playerMap[tid]?.displayName}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Seer */}
                  {log.nightSeerTarget && (() => {
                    const role = roles?.[log.nightSeerTarget]
                    const isWolf = role === 'WEREWOLF'
                    const isWhiteWolf = role === 'WHITE_WOLF'
                    return (
                      <LogLine icon="🔮" label="Seer investigated"
                        value={`${playerMap[log.nightSeerTarget]?.displayName} — ${isWolf ? '🐺 WOLF' : isWhiteWolf ? '✓ safe (White Wolf!)' : '✓ safe'}`}
                        valueColor={isWolf ? 'var(--red,#e74c3c)' : 'var(--green,#7ec8a0)'} />
                    )
                  })()}

                  {/* Doctor */}
                  {log.nightDoctorTarget && (
                    <LogLine icon="💉" label="Doctor protected" value={playerMap[log.nightDoctorTarget]?.displayName} />
                  )}

                  {/* Hunter */}
                  {log.hunterNightTarget && (
                    <LogLine icon="🏹" label="Hunter's target" value={playerMap[log.hunterNightTarget]?.displayName} />
                  )}

                  {/* Witch */}
                  {log.nightWitchSave && (
                    <LogLine icon="💊" label="Witch saved" value={playerMap[log.nightWitchSave]?.displayName} />
                  )}
                  {log.nightWitchPoison && (
                    <LogLine icon="☠️" label="Witch poisoned"
                      value={playerMap[log.nightWitchPoison]?.displayName}
                      valueColor="var(--red,#e74c3c)" />
                  )}

                  {/* Deaths — name + cause only, no role */}
                  {log.deaths?.length > 0 ? (
                    <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                      {log.deaths.map(d => (
                        <div key={d.id} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '0.8rem', padding: '3px 0',
                        }}>
                          <span style={{ color: 'var(--text)' }}>
                            💀 {playerMap[d.id]?.displayName || d.id}
                          </span>
                          <span style={{ color: 'var(--muted)' }}>
                            {CAUSE_LABEL[d.killedBy] || d.killedBy}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center' }}>
                      😌 No one died this night
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
