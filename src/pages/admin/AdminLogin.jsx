import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '../../hooks/useAuthState'

export default function AdminLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { user, role, loading: authLoading } = useAuthState()

  useEffect(() => {
    if (!authLoading && user) {
      if (role === 'admin') {
        navigate('/admin/dashboard')
      } else if (role === 'user') {
        navigate('/')
      }
    }
  }, [authLoading, user, role, navigate])

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        // Navigation will be handled by useEffect instead once role is fetched
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        await createUserWithEmailAndPassword(auth, email, password)
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
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'white',
        padding: 'clamp(24px, 5vw, 40px)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#1dbb54', letterSpacing: '-1.5px' }}>e</span>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#000', letterSpacing: '-1.5px' }}>mentor</span>
            </div>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>
            {isLogin ? 'Admin Portal' : 'Create Admin'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {isLogin ? 'Manage mentorship sessions' : 'Register as a new administrator'}
          </p>
        </div>

        {success && (
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'grid', gap: '18px' }}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login Now →' : 'Register Admin')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1dbb54',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isLogin ? 'Create new admin account' : 'Back to login'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← Back to User App
          </a>
        </p>
      </div>
    </div>
  )
}
