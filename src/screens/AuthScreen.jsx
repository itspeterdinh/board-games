import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const googleProvider = new GoogleAuthProvider()

// Usernames are stored in Firestore as usernames/{username} → { uid }
// Auth email is generated as username@bg.local (never shown to users)
function usernameToEmail(username) {
  return `${username.toLowerCase()}@boardgames.invalid`
}

async function checkUsernameAvailable(username) {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  return !snap.exists()
}

async function reserveUsername(username, uid) {
  await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid })
}

async function resolveUsername(username) {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  if (!snap.exists()) throw new Error('Username not found.')
  return snap.data().uid
}

export default function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      onAuth(cred.user)
    } catch (err) {
      const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']
      if (!ignored.includes(err.code)) setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    const trimmedUsername = username.trim().toLowerCase()
    if (!trimmedUsername) return setError('Username is required.')
    if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername))
      return setError('Username must be 3–20 characters: letters, numbers, underscores only.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      if (tab === 'register') {
        const trimmedName = displayName.trim()
        if (!trimmedName) throw new Error('Display name is required.')

        const available = await checkUsernameAvailable(trimmedUsername)
        if (!available) throw new Error('Username is already taken.')

        const email = usernameToEmail(trimmedUsername)
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: trimmedName })
        await reserveUsername(trimmedUsername, cred.user.uid)
        onAuth(cred.user)
      } else {
        // Look up username → generate email → sign in
        await resolveUsername(trimmedUsername) // validates it exists
        const email = usernameToEmail(trimmedUsername)
        const cred = await signInWithEmailAndPassword(auth, email, password)
        onAuth(cred.user)
      }
    } catch (err) {
      console.error('Auth error code:', err.code, 'message:', err.message)
      setError(friendlyError(err.code, err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.emblem}>⚔️</div>
        <h1 style={styles.title}>Board Games</h1>
        <p style={styles.subtitle}>Play Avalon with friends</p>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#8888aa', textAlign: 'center' }}>
        <a href="/rules" target="_blank" rel="noreferrer" style={{ color: '#c9a84c', textDecoration: 'none' }}>📖 How to play Avalon</a>
      </div>

      <div style={styles.card}>
        <button style={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'login' ? styles.tabActive : {}) }}
            onClick={() => { setTab('login'); setError('') }}
          >Sign In</button>
          <button
            style={{ ...styles.tab, ...(tab === 'register' ? styles.tabActive : {}) }}
            onClick={() => { setTab('register'); setError('') }}
          >Register</button>
        </div>

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. arthur_king"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
            {tab === 'register' && (
              <span style={styles.hint}>3–20 chars · letters, numbers, underscores</span>
            )}
          </div>

          {tab === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Display Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Arthur Pendragon"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                autoComplete="name"
              />
              <span style={styles.hint}>Shown to other players in the room</span>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? '…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.1 0-9.6-3.3-11.2-8H6.3C9.7 35.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C37 39.6 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  )
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    gap: 28,
    background: 'linear-gradient(160deg, #0d0d1a 0%, #12122a 100%)',
  },
  hero: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emblem: {
    fontSize: 56,
    lineHeight: 1,
    marginBottom: 4,
    filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.5))',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#c9a84c',
    letterSpacing: '-0.5px',
    margin: 0,
    textShadow: '0 0 40px rgba(201,168,76,0.3)',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#8888aa',
    margin: 0,
  },
  card: {
    background: '#161628',
    border: '1px solid #2e2e50',
    borderRadius: 20,
    padding: '28px 24px',
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: '#fff',
    color: '#1f1f1f',
    border: 'none',
    borderRadius: 12,
    padding: '13px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#2e2e50',
  },
  dividerText: {
    fontSize: '0.8rem',
    color: '#8888aa',
  },
  tabs: {
    display: 'flex',
    background: '#1f1f38',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: '9px 0',
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    color: '#8888aa',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabActive: {
    background: '#161628',
    color: '#e8e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#55556a',
  },
  input: {
    background: '#1f1f38',
    border: '1px solid #2e2e50',
    borderRadius: 10,
    color: '#e8e8f0',
    fontSize: '1rem',
    padding: '12px 14px',
    width: '100%',
    outline: 'none',
  },
  error: {
    background: 'rgba(192,57,43,0.15)',
    border: '1px solid #c0392b',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: '#e74c3c',
  },
  submitBtn: {
    background: '#c9a84c',
    color: '#0d0d1a',
    border: 'none',
    borderRadius: 12,
    padding: '14px 20px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    marginTop: 4,
  },
}

function friendlyError(code, msg) {
  if (code === 'auth/email-already-in-use' || code === 'auth/invalid-email') return `Firebase error: ${code} — try a different username format`
  if (code === 'auth/operation-not-allowed') return 'Email/Password sign-in is not enabled in Firebase. Enable it in Firebase Console → Authentication → Sign-in method.'
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.'
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Wrong username or password.'
  if (msg?.includes('Username not found')) return 'Username not found.'
  if (msg?.includes('already taken')) return 'Username is already taken.'
  return msg || code
}
