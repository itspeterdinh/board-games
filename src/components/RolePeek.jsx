import { useState } from 'react'
import RoleCard from './RoleCard'

export default function RolePeek({ role }) {
  const [open, setOpen] = useState(false)
  if (!role) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1f1f38, #2e2e50)',
          border: '2px solid #c9a84c',
          color: '#c9a84c',
          fontSize: '1.3rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 16px rgba(201,168,76,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'transform 0.15s',
        }}
        title="View my role"
      >
        🃏
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{
              textAlign: 'center',
              color: '#8888aa',
              fontSize: '0.8rem',
              marginBottom: 14,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Your Secret Role
            </p>
            <RoleCard role={role} showDesc={true} />
            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: 16,
                width: '100%',
                alignSelf: 'stretch',
                padding: '13px',
                borderRadius: 12,
                border: '1px solid #2e2e50',
                background: '#1f1f38',
                color: '#8888aa',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
