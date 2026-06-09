import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export function useRoom(roomId) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() })
      else setRoom(null)
      setLoading(false)
    })
    return unsub
  }, [roomId])

  return { room, loading }
}
