import { useState, useEffect } from 'react'
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

const IDLE_LIMIT_MS = 30 * 60 * 1000 // 30 minutes

export function useRoom(roomId) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (!snap.exists()) {
        setRoom(null)
        setLoading(false)
        return
      }
      const data = snap.data()
      // Whoever's client happens to load a stale room cleans it up — no backend needed
      const lastActivity = data.lastActivity?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? Date.now()
      if (Date.now() - lastActivity > IDLE_LIMIT_MS) {
        deleteDoc(doc(db, 'rooms', roomId)).catch(() => {})
        setRoom(null)
        setLoading(false)
        return
      }
      setRoom({ id: snap.id, ...data })
      setLoading(false)
    })
    return unsub
  }, [roomId])

  return { room, loading }
}
