import { useState, useRef } from 'react'
import { updateProfile, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

/** Resize & compress an image File to a small base64 JPEG (max 80×80px) */
function resizeToBase64(file, maxSize = 80) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ProfileScreen({ user, onBack, onUpdated }) {
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [avatarUrl, setAvatarUrl] = useState(user.photoURL || null)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef()

  function pickFile(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 3 * 1024 * 1024) return setError('Image must be under 3 MB.')
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  async function save() {
    if (!displayName.trim()) return setError('Display name cannot be empty.')
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      let photoURL = avatarUrl

      // Resize image to base64 and store in Firestore (no Storage plan needed)
      if (file) {
        photoURL = await resizeToBase64(file)
      }

      // Update Firebase Auth profile
      // Note: Auth photoURL has a ~1KB limit — we pass a placeholder if base64 is too big,
      // and rely on Firestore for the real photo everywhere in the app.
      const shortPhoto = photoURL && photoURL.startsWith('data:') ? null : photoURL
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: shortPhoto,
      })

      // Save to Firestore (base64 up to ~8KB fits fine in a document)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL || null,
        uid: user.uid,
      }, { merge: true })

      setAvatarUrl(photoURL)
      setFile(null)
      setPreview(null)
      setSuccess(true)
      onUpdated?.({ ...user, displayName: displayName.trim(), photoURL })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const shown = preview || avatarUrl

  return (
    <div className="screen">
      <div className="header-row">
        <button className="btn btn-ghost btn-small" onClick={onBack}>← Back</button>
        <div className="screen-title" style={{ flex: 1, textAlign: 'center' }}>Profile</div>
        <button className="btn btn-ghost btn-small" onClick={() => signOut(auth)} style={{ color: 'var(--red-light, #e74c3c)' }}>Sign out</button>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          onClick={() => fileRef.current.click()}
          style={{
            width: 100, height: 100, borderRadius: '50%', cursor: 'pointer',
            border: '3px solid var(--gold)',
            boxShadow: '0 0 24px rgba(201,168,76,0.3)',
            overflow: 'hidden',
            background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          {shown
            ? <img src={shown} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--gold)' }}>
                {displayName?.[0]?.toUpperCase() || '?'}
              </span>}
          {/* Overlay hint */}
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
            borderRadius: '50%',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            <span style={{ color: '#fff', fontSize: '1.4rem' }}>📷</span>
          </div>
        </div>

        <button
          className="btn btn-ghost btn-small"
          onClick={() => fileRef.current.click()}
          style={{ fontSize: '0.85rem' }}
        >
          📷 Change Avatar
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={pickFile}
        />
      </div>

      {/* Display name */}
      <div className="card">
        <div className="card-title">Display Name</div>
        <input
          type="text"
          value={displayName}
          onChange={e => { setDisplayName(e.target.value); setSuccess(false) }}
          placeholder="Your name"
          maxLength={24}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: '1rem',
            padding: '12px 14px', width: '100%', outline: 'none',
          }}
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>
          Shown to other players in the room
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {success && (
        <div style={{
          background: 'rgba(39,174,96,0.12)', border: '1px solid var(--green)',
          borderRadius: 8, padding: '10px 14px', fontSize: '0.9rem', color: 'var(--green-light)',
          textAlign: 'center',
        }}>
          ✓ Profile updated!
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={save}
        disabled={saving || (!file && displayName.trim() === (user.displayName || ''))}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
