import { useState, useEffect, useRef, useCallback } from 'react'
import { leaveRoom, resetToLobby } from '../roomActions'
import NightScreen from './game/avalon/NightScreen'
import ProposeScreen from './game/avalon/ProposeScreen'
import VoteScreen from './game/avalon/VoteScreen'
import VoteResultScreen from './game/avalon/VoteResultScreen'
import MissionScreen from './game/avalon/MissionScreen'
import ResultScreen from './game/avalon/ResultScreen'
import AssassinScreen from './game/avalon/AssassinScreen'
import EndScreen from './game/avalon/EndScreen'
import RolePeek from '../components/RolePeek'
// Werewolf screens
import WerewolfRoleReveal  from './game/werewolf/RoleRevealScreen'
import WerewolfNightScreen from './game/werewolf/NightScreen'
import WerewolfDayReveal   from './game/werewolf/DayRevealScreen'
import WerewolfDayScreen   from './game/werewolf/DayScreen'
import WerewolfDayResult   from './game/werewolf/DayResultScreen'
import WerewolfHunterShot  from './game/werewolf/HunterShotScreen'
import WerewolfEndScreen   from './game/werewolf/EndScreen'
import { WW_ROLES } from '../werewolf'

const INACTIVITY_MS = 10_000

export default function GameScreen({ user, room, onLeave }) {
  const [confirm, setConfirm] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)
  const [blurred, setBlurred] = useState(false)
  const timerRef = useRef(null)

  const resetTimer = useCallback(() => {
    setBlurred(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setBlurred(true), INACTIVITY_MS)
  }, [])

  useEffect(() => {
    const events = ['touchstart', 'mousemove', 'mousedown', 'keydown']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimeout(timerRef.current)
    }
  }, [resetTimer])
  const props = { user, room, onLeave }
  const myRole = room.roles?.[user.uid]
  const isWerewolf = (room.gameType || room.game) === 'werewolf'
  const showPeek = !isWerewolf && room.status !== 'night' && room.status !== 'ended'
  const isHost = room.hostId === user.uid
  const showLeaveBtn = room.status !== 'ended'

  async function handleLeave() {
    if (isHost) {
      await resetToLobby(room.id)
    } else {
      await leaveRoom(user, room.id)
      onLeave()
    }
    setConfirm(false)
  }

  function renderGame() {
    if (isWerewolf) {
      switch (room.status) {
        case 'ww_roleReveal': return <WerewolfRoleReveal   {...props} />
        case 'ww_night':      return <WerewolfNightScreen {...props} />
        case 'ww_dayReveal':  return <WerewolfDayReveal   {...props} />
        case 'ww_day':
        case 'ww_dayVote':    return <WerewolfDayScreen   {...props} />
        case 'ww_dayResult':  return <WerewolfDayResult   {...props} />
        case 'ww_hunterShot': return <WerewolfHunterShot  {...props} />
        case 'ended':         return <WerewolfEndScreen    {...props} />
        default: return <div className="screen"><div className="text-muted text-center">Loading…</div></div>
      }
    }
    switch (room.status) {
      case 'night':         return <NightScreen {...props} />
      case 'propose':       return <ProposeScreen {...props} />
      case 'vote':          return <VoteScreen {...props} />
      case 'voteResult':    return <VoteResultScreen {...props} />
      case 'mission':       return <MissionScreen {...props} />
      case 'result':        return <ResultScreen {...props} />
      case 'assassination': return <AssassinScreen {...props} />
      case 'ended':         return <EndScreen {...props} />
      default: return <div className="screen"><div className="text-muted text-center">Loading game…</div></div>
    }
  }

  const wwRoleData = isWerewolf ? WW_ROLES[myRole] : null
  const showWwPeek = false

  return (
    <>
      {renderGame()}

      {/* Avalon role peek */}
      {showPeek && <RolePeek role={myRole} />}

      {/* Werewolf role peek button */}
      {showWwPeek && (
        <>
          <button
            onClick={() => setPeekOpen(true)}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 200,
              width: 52, height: 52, borderRadius: '50%',
              background: wwRoleData.bg, border: `2px solid ${wwRoleData.border}`,
              boxShadow: `0 0 18px ${wwRoleData.glow}`,
              fontSize: '1.5rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {wwRoleData.icon}
          </button>
          {peekOpen && (
            <div
              onClick={() => setPeekOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 250,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 340, borderRadius: 20,
                  padding: '28px 24px',
                  background: wwRoleData.bg,
                  border: `2px solid ${wwRoleData.border}`,
                  boxShadow: `0 0 40px ${wwRoleData.glow}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ fontSize: '3.5rem' }}>{wwRoleData.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: wwRoleData.color }}>{wwRoleData.name}</div>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: wwRoleData.team === 'werewolves' ? '#e74c3c' : '#7ec8a0',
                }}>
                  {wwRoleData.team === 'werewolves' ? '🐺 Werewolves' : '🏘️ Village'}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                  {wwRoleData.desc}
                </div>
                {/* Night info (wolf allies, lovers) */}
                {room.nightInfo?.[user.uid]?.sees?.length > 0 && (
                  <div style={{ fontSize: '0.82rem', color: wwRoleData.color, textAlign: 'center' }}>
                    {room.nightInfo[user.uid].label} <strong>{room.nightInfo[user.uid].sees.join(', ')}</strong>
                  </div>
                )}
                {room.lovers?.includes(user.uid) && (() => {
                  const other = room.lovers.find(l => l !== user.uid)
                  const p = room.players.find(pl => pl.id === other)
                  return <div style={{ fontSize: '0.82rem', color: '#e91e8c' }}>💘 Lovers with {p?.displayName}</div>
                })()}
                <button className="btn btn-ghost btn-small" onClick={() => setPeekOpen(false)} style={{ marginTop: 6 }}>Close</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating back-to-lobby / leave button */}
      {showLeaveBtn && !confirm && (
        <button
          onClick={() => setConfirm(true)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 200,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '6px 14px',
            color: 'var(--muted)', fontSize: '0.82rem',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          ← {isHost ? 'Lobby' : 'Leave'}
        </button>
      )}

      {/* Inactivity blur */}
      {blurred && (
        <div
          onTouchStart={resetTimer}
          onMouseDown={resetTimer}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ textAlign: 'center', color: 'var(--muted)', userSelect: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: '0.9rem' }}>Tap to reveal</div>
          </div>
        </div>
      )}

      {/* Confirmation overlay */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, width: '100%', maxWidth: 320,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}>
              {isHost ? '⚠️ End game & return to lobby?' : '⚠️ Leave the game?'}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              {isHost
                ? 'This will reset the game for everyone. Players will stay in the room.'
                : 'You will be removed from the room.'}
            </div>
            <button className="btn btn-primary" onClick={handleLeave}>
              {isHost ? 'Back to Lobby' : 'Leave Game'}
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
