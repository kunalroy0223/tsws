import { useState, useEffect } from 'react'
import { listenToSettings, updateRegistrationStatus } from '../../firebase/firestore'

export default function ManageSettings({ showToast }) {
  const [settings, setSettings] = useState({ isRegistrationOpen: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = listenToSettings((data) => {
      setSettings(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const toggleRegistration = async () => {
    try {
      const newStatus = !settings.isRegistrationOpen
      await updateRegistrationStatus(newStatus)
      showToast(`Registration ${newStatus ? 'Opened' : 'Closed'} successfully`)
    } catch (err) {
      showToast('Action failed')
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading system settings...</div>

  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 32px)', paddingBottom: '32px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>
        Other Actions & System Control
      </h2>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        padding: '32px',
        maxWidth: '600px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Registration Status
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {settings.isRegistrationOpen 
                ? 'New teams can currently register for the program.' 
                : 'Registration is blocked. Only existing teams can login.'}
            </p>
          </div>
          
          <div 
            onClick={toggleRegistration}
            style={{
              width: '64px',
              height: '34px',
              background: settings.isRegistrationOpen ? '#1dbb54' : '#e2e8f0',
              borderRadius: '20px',
              padding: '4px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.3s'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              left: settings.isRegistrationOpen ? '34px' : '4px',
              transition: 'left 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: settings.isRegistrationOpen ? '#f0fdf4' : '#fef2f2',
          borderRadius: '12px',
          border: `1px solid ${settings.isRegistrationOpen ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: settings.isRegistrationOpen ? '#1dbb54' : '#ef4444'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: settings.isRegistrationOpen ? '#166534' : '#991b1b' }}>
            System Status: {settings.isRegistrationOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
      </div>
    </div>
  )
}
