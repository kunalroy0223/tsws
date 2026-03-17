import { useState, useEffect } from 'react'
import { auth, db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useAuthState } from '../../hooks/useAuthState'
import Register from './Register'
import LiveStatus from './LiveStatus'
import Timetable from './Timetable'

export default function UserApp() {
  const { user } = useAuthState()
  const [activeTab, setActiveTab] = useState('register')
  const [profile, setProfile] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)

    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) setProfile(snap.data())
      })
    }

    return () => window.removeEventListener('resize', handleResize)
  }, [user])

  const safePaddingBottom = isMobile ? '80px' : '0'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: safePaddingBottom }}>
      {/* Header Bar */}
      <div style={{
        background: '#ffffff',
        padding: '20px clamp(16px, 5vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap' }}>
          {profile && (
            <div style={{
              background: '#f1f5f9',
              padding: '6px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Team</p>
              <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 800, color: '#000' }}>{profile.teamName}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut(auth)}
          style={{
            padding: '10px',
            background: 'white',
            borderRadius: '10px',
            color: '#ef4444',
            cursor: 'pointer',
            border: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
            transition: 'all 0.2s'
          }}
          title="Logout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Navigation (Floating for mobile, Sticky Header for desktop) */}
      <div style={{
        position: isMobile ? 'fixed' : 'sticky',
        bottom: isMobile ? '24px' : 'auto',
        top: isMobile ? 'auto' : 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: isMobile ? '0 20px' : '0',
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex',
          margin: '0 auto',
          maxWidth: isMobile ? '400px' : '100%',
          width: '100%',
          background: isMobile ? 'rgba(255, 255, 255, 0.85)' : '#fff',
          backdropFilter: isMobile ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isMobile ? 'blur(12px)' : 'none',
          border: isMobile ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
          borderBottom: isMobile ? 'none' : '1px solid #e2e8f0',
          borderRadius: isMobile ? '24px' : '0',
          boxShadow: isMobile ? '0 12px 30px rgba(0,0,0,0.12)' : 'none',
          padding: isMobile ? '8px' : '0',
          pointerEvents: 'auto',
          transition: 'all 0.3s ease'
        }}>
          {[
            {
              id: 'register',
              label: 'Register',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            },
            {
              id: 'status',
              label: 'Live Status',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            },
            {
              id: 'timetable',
              label: 'Schedule',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: isMobile ? '10px 0' : '18px 24px',
                border: 'none',
                background: activeTab === tab.id && !isMobile ? '#f0fdf4' : 'transparent',
                color: activeTab === tab.id ? '#1dbb54' : '#64748b',
                fontWeight: 800,
                fontSize: isMobile ? '10px' : '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '4px' : '10px',
                borderRadius: isMobile ? '18px' : '0',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                transform: isMobile && activeTab === tab.id ? 'scale(1.05)' : 'none',
                opacity: activeTab === tab.id ? 1 : 0.7
              }}
            >
              {tab.icon}
              <span style={{
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                fontSize: isMobile ? '9px' : '13px',
                fontWeight: activeTab === tab.id ? 900 : 700
              }}>
                {tab.label}
              </span>
              {isMobile && activeTab === tab.id && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#1dbb54',
                  boxShadow: '0 0 8px #1dbb54'
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="page-container" style={{ padding: '24px 12px' }}>
        {activeTab === 'register' && <Register />}
        {activeTab === 'status' && <LiveStatus />}
        {activeTab === 'timetable' && <Timetable />}
      </div>
    </div>
  )
}
