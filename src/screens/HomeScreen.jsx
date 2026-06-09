import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { createRoom, joinRoom } from '../roomActions'

export default function HomeScreen({ user, onJoin }) {
  const [tab, setTab] = useState('create')
  const [roomName, setRoomName] = useState('')
  const [password, setPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!roomName.trim()) return setError('Room name is required')
    if (!password.trim()) return setError('Password is required')
    setLoading(true)
    try {
      const id = await createRoom(user, roomName.trim(), password.trim())
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
        <button className="btn btn-ghost btn-small" onClick={() => signOut(auth)}>Sign out</button>
      </div>
      <div className="text-muted text-center">Welcome, {user.displayName}</div>

      <div className="tabs">
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => { setTab('create'); setError('') }}>Create Room</button>
        <button className={`tab ${tab === 'join'   ? 'active' : ''}`} onClick={() => { setTab('join');   setError('') }}>Join Room</button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
