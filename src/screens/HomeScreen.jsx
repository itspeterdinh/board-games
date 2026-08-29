import { useState } from 'react'
import { createRoom, joinRoom } from '../roomActions'
import HistoryScreen from './HistoryScreen'
import ProfileScreen from './ProfileScreen'
import TestScreen from './TestScreen'

export default function HomeScreen({ user, onJoin, onUserUpdated }) {
  // ALL hooks must be at the top — never after a conditional return
  const [tab, setTab] = useState('create')
  const [showHistory, setShowHistory] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [gameType, setGameType] = useState('avalon')
  const [roomName, setRoomName] = useState('')
  const [password, setPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (showHistory) return <HistoryScreen user={user} onBack={() => setShowHistory(false)} />
  if (showTest)    return <TestScreen   user={user} onBack={() => setShowTest(false)} />
  if (showProfile) return (
    <ProfileScreen
      user={user}
      onBack={() => setShowProfile(false)}
      onUpdated={u => { onUserUpdated?.(u); setShowProfile(false) }}
    />
  )

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!roomName.trim()) return setError('Room name is required')
    if (!password.trim()) return setError('Password is required')
    setLoading(true)
    try {
      const id = await createRoom(user, roomName.trim(), password.trim(), gameType)
      onJoin(id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError('')
    if (!joinCode.trim()) return setError('Room code is required')
    setLoading(true)
    try {
      await joinRoom(user, joinCode.trim().toUpperCase(), joinPassword.trim())
      onJoin(joinCode.trim().toUpperCase())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="header-row">
        <div className="screen-title" style={{ flex: 1 }}>⚔️ Board Games</div>
        {user.role === 'admin' && <button className="btn btn-ghost btn-small" onClick={() => setShowTest(true)} style={{ marginRight: 6 }}>🧪</button>}
        <button className="btn btn-ghost btn-small" onClick={() => window.open('/rules', '_blank')} style={{ marginRight: 6 }}>📖</button>
        <button className="btn btn-ghost btn-small" onClick={() => setShowHistory(true)} style={{ marginRight: 6 }}>📜</button>
        <button className="btn btn-ghost btn-small" onClick={() => setShowProfile(true)} style={{ marginRight: 6 }}>
          {user.photoURL
            ? <img src={user.photoURL} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }} />
            : '👤'}
        </button>
      </div>
      <div className="text-muted text-center">Welcome, {user.displayName}</div>

      <div className="tabs">
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => { setTab('create'); setError('') }}>Create Room</button>
        <button className={`tab ${tab === 'join'   ? 'active' : ''}`} onClick={() => { setTab('join');   setError('') }}>Join Room</button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Game</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'avalon',    icon: '⚔️', name: 'Avalon',   desc: '5–10 players' },
                { key: 'werewolf',  icon: '🐺', name: 'Werewolf', desc: '5–15 players' },
              ].map(g => (
                <div
                  key={g.key}
                  onClick={() => setGameType(g.key)}
                  style={{
                    flex: 1, padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: gameType === g.key ? 'var(--surface)' : 'var(--surface2)',
                    border: `2px solid ${gameType === g.key ? 'var(--gold)' : 'var(--border)'}`,
                    boxShadow: gameType === g.key ? '0 0 12px rgba(201,168,76,0.25)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>{g.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 4 }}>{g.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Room Name</label>
            <input type="text" placeholder="e.g. Friday Night Games" value={roomName} onChange={e => setRoomName(e.target.value)} />
          </div>
          <div className="field">
            <label>Room Password</label>
            <input type="password" placeholder="Others use this to join" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Create Room'}</button>
        </form>
      ) : (
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Room Code</label>
            <input type="text" placeholder="6-character code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Room password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Join Room'}</button>
        </form>
      )}
    </div>
  )
}
