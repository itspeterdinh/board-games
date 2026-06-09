import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

export default function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'register') {
        if (!name.trim()) throw new Error('Display name is required')
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name.trim() })
        onAuth(cred.user)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        onAuth(cred.user)
      }
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div style={{ marginTop: 24 }}>
        <div className="screen-title">⚔️ Board Games</div>
        <div className="screen-subtitle">Avalon & more</div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
        <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'register' && (
          <div className="field">
            <label>Display Name</label>
            <input type="text" placeholder="e.g. Arthur" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '...' : tab === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

function friendlyError(msg) {
  if (msg.includes('email-already')) return 'Email already in use.'
  if (msg.includes('invalid-email')) return 'Invalid email address.'
  if (msg.includes('wrong-password') || msg.includes('invalid-credential')) return 'Incorrect email or password.'
  if (msg.includes('weak-password')) return 'Password must be at least 6 characters.'
  if (msg.includes('user-not-found')) return 'No account found with that email.'
  return msg
}
