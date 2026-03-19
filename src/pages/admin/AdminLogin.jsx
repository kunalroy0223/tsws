import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '../../hooks/useAuthState'

export default function AdminLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { user, role, loading: authLoading } = useAuthState()

  useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'user') navigate('/')
    }
  }, [authLoading, user, role, navigate])

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const userDocRef = doc(db, 'users', userCredential.user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, { email, role: 'admin', createdAt: new Date().toISOString() })
        }
      } else {
        if (password !== confirmPassword) throw new Error('Passwords do not match')
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email, password, role: 'admin',
          createdAt: new Date().toISOString()
        })
        setSuccess('Account created! Please log in.')
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: '0 0 45%',
        background: 'linear-gradient(155deg, #0a1628 0%, #0f2d4a 50%, #0a3d62 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(32px, 5vw, 60px)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh'
      }}
        className="admin-left-panel"
      >
        {/* Circuit SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">
          <g stroke="#1dbb54" strokeWidth="1" fill="none">
            {[0,60,120,180,240,300,360].map(x => [0,70,140,210,280,350,420,490,560,630,700].map(y => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#1dbb54" opacity="0.8"/>
            )))}
            <line x1="0" y1="70" x2="360" y2="70" opacity="0.6"/>
            <line x1="0" y1="210" x2="360" y2="210" opacity="0.6"/>
            <line x1="0" y1="420" x2="360" y2="420" opacity="0.6"/>
            <line x1="60" y1="0" x2="60" y2="700" opacity="0.6"/>
            <line x1="180" y1="0" x2="180" y2="700" opacity="0.6"/>
            <line x1="300" y1="0" x2="300" y2="700" opacity="0.6"/>
          </g>
        </svg>

        {/* Green glow blob */}
        <div style={{
          position: 'absolute', top: '30%', left: '-60px',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(29,187,84,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: '#1dbb54',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(29,187,84,0.4)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>
              Admin <span style={{ color: '#1dbb54' }}>Portal</span>
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ementoring system
          </p>
        </div>

        {/* Central content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(29,187,84,0.15)',
            border: '1px solid rgba(29,187,84,0.3)',
            borderRadius: '999px',
            padding: '6px 16px',
            marginBottom: '20px'
          }}>
            <span style={{ color: '#1dbb54', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Restricted Access
            </span>
          </div>
          <h1 style={{
            color: 'white',
            fontSize: 'clamp(28px, 3.5vw, 48px)',
            fontWeight: 900,
            lineHeight: '1.1',
            letterSpacing: '-1.5px',
            marginBottom: '20px'
          }}>
            MANAGE<br /><span style={{ color: '#1dbb54' }}>EVERYTHING</span><br />IN ONE PLACE
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: '1.7', maxWidth: '300px' }}>
            Control mentorship sessions, registrations, check-ins, and analytics from your admin console.
          </p>

          {/* Feature bullets */}
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Mentor Slot Management', 'Team Queue & Approvals', 'Live Check-in Tracking', 'Logistics Sheet Export'].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(29,187,84,0.2)', border: '1px solid rgba(29,187,84,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#1dbb54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600 }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <a href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none'
          }}>
            ← Back to User Login
          </a>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 60px)',
        background: '#fafbfc'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '36px',
            gap: '4px'
          }}>
            {['Login', 'Create Admin'].map((mode) => {
              const active = (mode === 'Login') === isLogin
              return (
                <button
                  key={mode}
                  onClick={() => setIsLogin(mode === 'Login')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: active ? 'white' : 'transparent',
                    color: active ? '#111827' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode}
                </button>
              )
            })}
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Admin Sign In 🔐' : 'Register Admin'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
            {isLogin ? 'Access the management console.' : 'Create a new administrator account.'}
          </p>

          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '10px', padding: '12px 14px',
              color: '#16a34a', fontSize: '13px', fontWeight: 700, marginBottom: '20px'
            }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="admin@ecell.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  style={inputStyle}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '12px 14px',
                color: '#dc2626', fontSize: '13px', fontWeight: 600
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                marginTop: '4px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(15,23,42,0.25)',
                letterSpacing: '0.3px'
              }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Access Dashboard →' : 'Create Admin Account →')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#94a3b8' }}>
            Not an admin?{' '}
            <a href="/login" style={{ color: '#1dbb54', fontWeight: 700, textDecoration: 'none' }}>Go to user login</a>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-left-panel { display: none !important; }
        }
        input:focus { outline: none; border-color: #1dbb54 !important; box-shadow: 0 0 0 3px rgba(29,187,84,0.12) !important; }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '6px'
}

const inputStyle = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  fontSize: '14px',
  color: '#111827',
  background: 'white',
  transition: 'all 0.2s',
  boxSizing: 'border-box'
}
