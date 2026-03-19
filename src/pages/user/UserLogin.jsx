import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { listenToSettings } from '../../firebase/firestore'
import { useNavigate } from 'react-router-dom'
const icon = '/assets/icon-black.png'

export default function UserLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  const MASTER_ADMINS = [
    'ecelladmindeepak1@gmail.com',
    'ecelladmindeepak2@gmail.com',
    'ecelladmindeepak3@gmail.com'
  ]
  const MASTER_PASS = 'deepakchetri2003'

  useEffect(() => {
    const unsub = listenToSettings((settings) => {
      setIsRegistrationOpen(settings.isRegistrationOpen ?? true)
    })
    return () => unsub()
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const userDocRef = doc(db, 'users', userCredential.user.uid)
        const userDocSnap = await getDoc(userDocRef)

        let role = 'user'
        if (userDocSnap.exists()) {
          role = userDocSnap.data().role || 'user'
        } else {
          role = 'user'
        }

        const isMaster = MASTER_ADMINS.includes(email) && password === MASTER_PASS

        if (role === 'admin' || isMaster) {
          if (!userDocSnap.exists() || userDocSnap.data().role !== 'admin') {
            await setDoc(userDocRef, {
              email, password, role: 'admin',
              createdAt: new Date().toISOString()
            }, { merge: true })
          }
          navigate('/admin/dashboard')
        } else {
          navigate('/')
        }
      } else {
        if (!isRegistrationOpen) throw new Error('Registration is currently closed by the administrator.')
        if (!teamName) throw new Error('Please enter your Team Name')
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          teamName, email, password, role: 'user',
          createdAt: new Date().toISOString()
        })
        navigate('/')
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
  background: '#000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(32px, 5vw, 60px)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh'
      }}
        className="login-left-panel"
      >
        {/* Circuit SVG background */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">
          <g stroke="white" strokeWidth="1" fill="none">
            {[0,60,120,180,240,300,360].map(x => [0,70,140,210,280,350,420,490,560,630,700].map(y => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="white" opacity="0.6"/>
            )))}
            <line x1="0" y1="70" x2="360" y2="70" opacity="0.5"/>
            <line x1="0" y1="210" x2="360" y2="210" opacity="0.5"/>
            <line x1="0" y1="420" x2="360" y2="420" opacity="0.5"/>
            <line x1="0" y1="560" x2="360" y2="560" opacity="0.5"/>
            <line x1="60" y1="0" x2="60" y2="700" opacity="0.5"/>
            <line x1="180" y1="0" x2="180" y2="700" opacity="0.5"/>
            <line x1="300" y1="0" x2="300" y2="700" opacity="0.5"/>
            <line x1="0" y1="0" x2="180" y2="210" opacity="0.3"/>
            <line x1="180" y1="420" x2="360" y2="210" opacity="0.3"/>
          </g>
        </svg>

        {/* Logo (image only) */}
        <img src={icon} alt="logo" style={{ width: '250px', height: '250px' }} />

        {/* Main Tagline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            color: 'white',
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 900,
            lineHeight: '1.05',
            letterSpacing: '-1.5px',
            marginBottom: '20px'
          }}>
            FROM IDEA<br />TO <span style={{ color: '#a7f3c1' }}>STARTUP</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.7', maxWidth: '340px' }}>
            Inviting students, working professionals, early-stage startups, innovators, and changemakers.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '36px' }}>
            {[['20-22', 'March 2026'], ['1', 'Venue'], ['∞', 'Possibilities']].map(([val, label]) => (
              <div key={label}>
                <div style={{ color: '#a7f3c1', fontSize: '22px', fontWeight: 900 }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '8px 16px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a7f3c1', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 700 }}>Inspira Knowledge Campus, Siliguri</span>
          </div>
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

          {/* Mobile logo (shown only on small screens) - uses different asset */}
          <img src={'/assets/icon.png'} alt="logo" className="mobile-logo" style={{ width: '200px', height: '200px' }}/>

          {/* Mode toggle pills */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '36px',
            gap: '4px'
          }}>
            {['Login', 'Register'].map((mode) => {
              const active = (mode === 'Login') === isLogin
              const isRegister = mode === 'Register'
              const disabled = isRegister && !isRegistrationOpen
              return (
                <button
                  key={mode}
                  onClick={() => !disabled && setIsLogin(mode === 'Login')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: active ? 'white' : 'transparent',
                    color: active ? '#111827' : disabled ? '#cbd5e1' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {disabled ? '🔒 Closed' : mode}
                </button>
              )
            })}
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome back 👋' : 'Join the Event'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
            {isLogin ? 'Enter your credentials to access your dashboard.' : 'Create a team account to get started.'}
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label style={labelStyle}>Team Name *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Code Wizards"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="team@example.com"
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
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

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
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1dbb54, #0ea543)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(29,187,84,0.35)',
                letterSpacing: '0.3px'
              }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login to Dashboard →' : 'Create Team Account →')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#94a3b8' }}>
            {isLogin ? 'New here? Registration may be open for your team.' : 'Already registered? Switch to Login above.'}
          </p>
        </div>
      </div>

      <style>{`
        .mobile-logo { display: none; }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .mobile-logo { display: block; width: 72px; height: 72px; margin: 0 auto 16px; object-fit: contain; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
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
