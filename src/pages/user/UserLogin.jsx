import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

export default function UserLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
          role = 'admin'
        }

        if (role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/')
        }
      } else {
        if (!teamName) {
          throw new Error('Please enter your Team Name')
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          teamName,
          email,
          role: 'user',
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
            {isLogin ? 'Welcome Back!' : 'Join the Program'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {isLogin ? 'Login to manage your mentorship sessions' : 'Create a team account to get started'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'grid', gap: '18px' }}>
          {!isLogin && (
            <div className="form-group">
              <label>Team Name *</label>
              <input
                placeholder="e.g. Code Wizards"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="team@example.com"
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
            {loading ? 'Processing...' : (isLogin ? 'Login Now →' : 'Create Account →')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          {isLogin ? "New here?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1dbb54',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '6px'
            }}
          >
            {isLogin ? 'Register Team' : 'Login Here'}
          </button>
        </div>
      </div>
    </div>
  )
}
