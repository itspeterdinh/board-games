import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useRoom } from './useRoom'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameScreen from './screens/GameScreen'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [roomId, setRoomId] = useState(null)

  useEffect(() => onAuthStateChanged(auth, u => setUser(u || null)), [])

  if (user === undefined) {
    return <div className="screen"><div className="spinner" style={{ marginTop: 80 }} /></div>
  }

  if (!user) return <AuthScreen onAuth={setUser} />
  if (!roomId) return <HomeScreen user={user} onJoin={setRoomId} />

  return <RoomController user={user} roomId={roomId} onLeave={() => setRoomId(null)} />
}

function RoomController({ user, roomId, onLeave }) {
  const { room, loading } = useRoom(roomId)

  if (loading) return <div className="screen"><div className="spinner" style={{ marginTop: 80 }} /></div>
  if (!room) { onLeave(); return null }

  if (room.status === 'lobby') return <LobbyScreen user={user} room={room} onLeave={onLeave} />
  return <GameScreen user={user} room={room} onLeave={onLeave} />
}
