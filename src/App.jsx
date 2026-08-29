import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { useRoom } from './useRoom'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'
import AvalonRulesScreen from './screens/AvalonRulesScreen'

const ROOM_KEY = 'bg_room_id'

function saveRoom(id) {
  if (id) sessionStorage.setItem(ROOM_KEY, id)
  else sessionStorage.removeItem(ROOM_KEY)
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem(ROOM_KEY))

  if (window.location.pathname === '/rules') {
    return <AvalonRulesScreen onBack={() => { window.history.pushState({}, '', '/'); window.location.reload() }} />
  }

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) { setUser(null); return }
    // Merge Firestore profile (has base64 photoURL) over the Auth user object
    try {
      const snap = await getDoc(doc(db, 'users', u.uid))
      const profile = snap.exists() ? snap.data() : {}
      setUser({ ...u, displayName: profile.displayName || u.displayName, photoURL: profile.photoURL || u.photoURL || null, role: profile.role || 'user' })
    } catch {
      setUser(u)
    }
  }), [])

  function joinRoom(id) {
    saveRoom(id)
    setRoomId(id)
  }

  function leaveRoom() {
    saveRoom(null)
    setRoomId(null)
  }

  if (user === undefined) {
    return <div className="screen"><div className="spinner" style={{ marginTop: 80 }} /></div>
  }

  if (!user) return <AuthScreen onAuth={setUser} />
  if (!roomId) return <HomeScreen user={user} onJoin={joinRoom} onUserUpdated={u => setUser({ ...user, ...u })} />

  return <RoomController user={user} roomId={roomId} onLeave={leaveRoom} />
}

function RoomController({ user, roomId, onLeave }) {
  const { room, loading } = useRoom(roomId)

  if (loading) return <div className="screen"><div className="spinner" style={{ marginTop: 80 }} /></div>
  if (!room) { onLeave(); return null }

  if (room.status === 'lobby') return <LobbyScreen user={user} room={room} onLeave={onLeave} />
  return <GameScreen user={user} room={room} onLeave={onLeave} />
}
