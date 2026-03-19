import { useState, useEffect, useMemo } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '../../hooks/useAuthState'
import {
  listenToSlots,
  listenToRegistrations,
  createSlot,
  updateSlot,
  deleteSlot,
  updateRegistration,
  deleteRegistration
} from '../../firebase/firestore'
import ManageSlots from './ManageSlots'
import ManageRegistrations from './ManageRegistrations'
import ManageUsers from './ManageUsers'
import ManageCheckins from './ManageCheckins'
import ManageSettings from './ManageSettings'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthState()
  const [activeTab, setActiveTab] = useState('schedule')
  const [sessions, setSessions] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmPopup, setConfirmPopup] = useState(null)

  useEffect(() => {
    const unsub1 = listenToSlots((data) => {
      setSessions(data)
      setLoadingSessions(false)
    })
    const unsub2 = listenToRegistrations((data) => {
      setRegistrations(data)
      setLoadingRegs(false)
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const showConfirm = (title, message, onConfirm) => {
    setConfirmPopup({ title, message, onConfirm })
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#000',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          zIndex: 2000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          fontWeight: 700,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast}
        </div>
      )}

      {/* Confirm Popup */}
      {confirmPopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2100,
          padding: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>{confirmPopup.title}</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{confirmPopup.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmPopup(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
                  background: 'white', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmPopup.onConfirm?.()
                  setConfirmPopup(null)
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                  background: '#ef4444', color: 'white', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px clamp(16px, 5vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        {/* Poster decoration */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.1,
          pointerEvents: 'none',
          display: window.innerWidth < 640 ? 'none' : 'block'
        }}>
          <svg width="200" height="200" viewBox="0 0 100 100">
            <path d="M0,0 L100,0 L100,100 Z" fill="#1dbb54" />
          </svg>
        </div>



        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: '#f1f5f9',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#1e293b',
            border: '1px solid #e2e8f0'
          }}>
            {user?.email?.split('@')[0]}
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
      </div>

      <div style={{ width: '100%', margin: '0', padding: 'clamp(16px, 4vw, 32px)' }}>
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(160px, 20vw, 240px), 1fr))',
          gap: 'clamp(16px, 3vw, 24px)',
          marginBottom: '32px'
        }}>
          <StatCard label="Mentors" value={sessions.length} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
          <StatCard label="Pending" value={registrations.filter(r => r.status === 'pending' && !r.checkedIn && !r.done).length} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
          <StatCard label="Live" value={registrations.filter(r => r.checkedIn && !r.done).length} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} />
          <StatCard label="Done" value={registrations.filter(r => r.done).length} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>} />
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'white',
          padding: '6px',
          borderRadius: '16px',
          marginBottom: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '14px clamp(12px, 3vw, 24px)',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'schedule' ? '#1dbb54' : 'transparent',
              color: activeTab === 'schedule' ? 'white' : '#64748b',
              fontWeight: 800,
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Manage Sessions
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '14px clamp(12px, 3vw, 24px)',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'registrations' ? '#1dbb54' : 'transparent',
              color: activeTab === 'registrations' ? 'white' : '#64748b',
              fontWeight: 800,
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Requests & Queue
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '14px clamp(12px, 3vw, 24px)',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'users' ? '#1dbb54' : 'transparent',
              color: activeTab === 'users' ? 'white' : '#64748b',
              fontWeight: 800,
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab('checkins')}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '14px clamp(12px, 3vw, 24px)',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'checkins' ? '#1dbb54' : 'transparent',
              color: activeTab === 'checkins' ? 'white' : '#64748b',
              fontWeight: 800,
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Check-ins
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              minWidth: 'max-content',
              padding: '14px clamp(12px, 3vw, 24px)',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'settings' ? '#1dbb54' : 'transparent',
              color: activeTab === 'settings' ? 'white' : '#64748b',
              fontWeight: 800,
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            Other Action
          </button>
        </div>

        {/* Tab Content */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {activeTab === 'schedule' ? (
            <ManageSlots
              sessions={sessions}
              loading={loadingSessions}
              onUpdate={updateSlot}
              onDelete={deleteSlot}
              onCreate={createSlot}
              showToast={showToast}
              showConfirm={showConfirm}
            />
          ) : activeTab === 'registrations' ? (
            <div style={{ padding: '32px' }}>
              <ManageRegistrations
                showToast={showToast}
                showConfirm={showConfirm}
              />
            </div>
          ) : activeTab === 'users' ? (
            <ManageUsers 
              showToast={showToast}
              showConfirm={showConfirm}
            />
          ) : activeTab === 'checkins' ? (
            <ManageCheckins
              showToast={showToast}
            />
          ) : (
            <ManageSettings
              showToast={showToast}
            />
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{
        fontSize: '32px',
        background: '#f1f5f9',
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
        <p style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b' }}>
          {value}
        </p>
      </div>
    </div>
  )
}
