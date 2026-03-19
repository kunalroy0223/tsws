import { useState, useEffect } from 'react'
import { listenToSlots, listenToRegistrations, registerTeam } from '../../firebase/firestore'
import { db, auth } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthState } from '../../hooks/useAuthState'

export default function Register() {
  const [slots, setSlots] = useState([])
  const [popup, setPopup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [profile, setProfile] = useState(null)
  const [showInfo, setShowInfo] = useState(false)

  const { user } = useAuthState()

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setProfile(docSnap.data())
        }
      } else {
        setProfile(null)
      }
    }
    fetchProfile()
  }, [user])

  useEffect(() => {
    const unsub1 = listenToSlots(setSlots)
    const unsub2 = listenToRegistrations(setRegistrations)
    return () => { unsub1(); unsub2() }
  }, [])

  const mySortedRegs = profile
    ? [...registrations].filter(r => r.teamName === profile.teamName).sort((a, b) => {
      const timeA = a.createdAt?.seconds || 9999999999;
      const timeB = b.createdAt?.seconds || 9999999999;
      return timeA - timeB;
    })
    : []

  const activeRegs = mySortedRegs.filter(r => r.status !== 'rejected')


  const getMyReg = (slotId) => {
    // Return the active one if exists, otherwise the rejected one so they still see the badge
    return activeRegs.find(r => r.slotId === slotId) || mySortedRegs.find(r => r.slotId === slotId)
  }

  const getMyPriority = (slotId) => {
    // Only active (non-rejected) registrations get a priority rating
    const idx = activeRegs.findIndex(r => r.slotId === slotId)
    return idx !== -1 ? idx + 1 : null
  }

  const handleConfirmRegistration = async () => {
    if (!profile) return
    setError('')
    setLoading(true)
    try {
      if (false) {
        // No limit enforced
        return
      }

      const slot = slots.find(s => s.id === popup)
      await registerTeam({
        teamName: profile.teamName,
        email: profile.email,
        slotId: popup,
        mentorName: slot?.mentorName || '',
        companyName: slot?.companyName || '',
        roomNumber: slot?.roomNumber || '',
        status: 'pending',
        checkedIn: false,
        done: false,
        leaderName: profile.leaderName || 'N/A', // backwards compatibility or hidden
        phone: profile.phone || 'N/A'
      })
      setSuccess(`Successfully registered for ${slot?.mentorName}!`)
      setPopup(null)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError('Registration failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div>
      {success && (
        <div style={{
          background: '#dcfce7',
          color: '#16a34a',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 28px)',
            fontWeight: 800,
            color: '#111827',
            margin: 0
          }}>
            Choose Your Mentors
          </h2>
          <button
            onClick={() => setShowInfo(!showInfo)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: showInfo ? '#f59e0b' : '#f1f5f9',
              color: showInfo ? 'white' : '#94a3b8',
              border: '1px solid',
              borderColor: showInfo ? '#f59e0b' : '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            title="Important Note"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </button>
        </div>

        {showInfo && (
          <div style={{
            background: '#fff8f1',
            borderLeft: '4px solid #f59e0b',
            padding: '16px 20px',
            borderRadius: '8px',
            color: '#78350f',
            fontSize: '15px',
            lineHeight: '1.6',
            marginTop: '8px'
          }}>
            <strong>Note:</strong> Please select your mentors carefully according to your preferences. Your selections will be ranked by priority, so we strongly recommend choosing your most preferred mentor first. <strong>Once a request is submitted, it cannot be cancelled.</strong>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'clamp(20px, 3vw, 32px)'
      }}>
        {slots.length === 0 ? (
          <div style={{
            gridColumn: '1/-1',
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.05)'
          }}>

            <h3 style={{
              fontSize: '20px',
              marginBottom: '8px',
              color: '#1e293b'
            }}>
              No mentorship slots available yet
            </h3>
            <p style={{ color: '#64748b' }}>
              New sessions will appear here once mentors publish them.
            </p>
          </div>
        ) : (
          slots.map(slot => {
            const myReg = getMyReg(slot.id)
            const computedPriority = getMyPriority(slot.id)
            let currentStatus = null
            if (myReg) {
              currentStatus = myReg.done ? 'done' : (myReg.checkedIn ? 'checkedIn' : myReg.status)
            }
            return (
              <SlotCard
                key={slot.id}
                slot={slot}
                onRequest={() => setPopup(slot.id)}
                status={currentStatus}
                priority={computedPriority}
                limitReached={false}
              />
            )
          })
        )}
      </div>

      {popup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
              Confirm Registration
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
              You are about to request a session with <br />
              <strong style={{ color: '#1dbb54' }}>{slots.find(s => s.id === popup)?.mentorName}</strong>. <br />
              Your team <strong>({profile?.teamName})</strong> details will be sent to the admin.
            </p>

            {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConfirmRegistration}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: '#1dbb54',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(29, 187, 84, 0.2)'
                }}
              >
                {loading ? 'Submitting...' : 'Yes, Confirm!'}
              </button>
              <button
                onClick={() => setPopup(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SlotCard({ slot, onRequest, status, priority, limitReached }) {
  const [hovered, setHovered] = useState(false)
  const [showBio, setShowBio] = useState(false)

  const hasIcons = !!(slot.linkedinLink || slot.bio || priority)

  const getBadge = () => {
    if (!status) return null
    const map = {
      pending: { label: 'PENDING', bg: '#fef9c3', text: '#854d0e' },
      approved: { label: 'APPROVED', bg: '#dcfce7', text: '#16a34a' },
      rejected: { label: 'REJECTED', bg: '#fee2e2', text: '#991b1b' },
      checkedIn: { label: 'CHECKED IN', bg: '#dbeafe', text: '#1d4ed8' },
      done: { label: 'DONE', bg: '#f3f4f6', text: '#64748b' }
    }
    const b = map[status] || { label: status, bg: '#f3f4f6', text: '#64748b' }
    return (
      <span style={{
        padding: '5px 14px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 800,
        background: b.bg,
        color: b.text,
        letterSpacing: '0.5px'
      }}>
        {b.label}
      </span>
    )
  }

  const iconStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none'
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: hovered
          ? '0 12px 32px rgba(0,0,0,0.1)'
          : '0 1px 8px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* Icons & Priority — top right corner */}
      {hasIcons && (
        <div style={{
          position: 'absolute',
          top: 'clamp(14px, 3vw, 20px)',
          right: 'clamp(14px, 3vw, 20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          zIndex: 2
        }}>
          {priority && (
            <div style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#d97706',
              fontWeight: '800',
              fontSize: '11px',
              letterSpacing: '0.5px'
            }}>
              Priority {priority}
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            {slot.linkedinLink && (
              <a
                href={slot.linkedinLink}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                style={iconStyle}
                title="LinkedIn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a66c2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {slot.bio && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowBio(!showBio) }}
                style={{
                  ...iconStyle,
                  background: showBio ? '#1dbb54' : '#fff',
                  borderColor: showBio ? '#1dbb54' : '#e5e7eb'
                }}
                title="View Info"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={showBio ? '#fff' : '#64748b'}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo + Details row */}
      <div style={{
        display: 'flex',
        gap: 'clamp(10px, 3vw, 14px)',
        alignItems: 'center',
        marginBottom: '14px',
        paddingRight: hasIcons ? '80px' : '0'
      }}>
        <img
          src={slot.photoUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              slot.mentorName || 'Mentor'
            )}&background=1dbb54&color=fff&size=256`
          }
          alt={slot.mentorName}
          style={{
            width: 'clamp(68px, 18vw, 84px)',
            height: 'clamp(68px, 18vw, 84px)',
            borderRadius: '12px',
            objectFit: 'cover',
            border: '2px solid #1dbb54',
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{
              fontSize: 'clamp(20px, 5.5vw, 26px)',
              fontWeight: 800,
              color: '#111827',
              lineHeight: '1.25',
              margin: 0
            }}>
              {slot.mentorName}
            </h3>
          </div>
          {slot.companyName && (
            <p style={{
              fontSize: 'clamp(15px, 4vw, 17px)',
              fontWeight: 600,
              color: '#1dbb54',
              marginBottom: '1px'
            }}>
              {slot.companyName}
            </p>
          )}
          <p style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Room {slot.roomNumber}
          </p>
        </div>
      </div>

      {/* Bio panel — toggled by info icon */}
      {showBio && slot.bio && (
        <div style={{
          fontSize: '15px',
          color: '#475569',
          lineHeight: '1.6',
          marginBottom: '14px',
          padding: '12px 14px',
          background: '#f9fafb',
          borderRadius: '10px',
          borderLeft: '3px solid #1dbb54'
        }}>
          {slot.bio}
        </div>
      )}

      {/* Bottom: Badge + Button */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {status && (
          <div>{getBadge()}</div>
        )}
        <button
          onClick={onRequest}
          disabled={!!status || limitReached}
          style={{
            width: '100%',
            padding: 'clamp(13px, 3.5vw, 16px)',
            borderRadius: '10px',
            border: 'none',
            background: !!status || limitReached ? '#f3f4f6' : '#1dbb54',
            color: !!status || limitReached ? '#9ca3af' : 'white',
            fontWeight: 700,
            fontSize: 'clamp(14px, 4vw, 16px)',
            cursor: !!status || limitReached ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.3px'
          }}
        >
          {status === 'rejected'
            ? 'Rejected'
            : (status ? 'Already Requested' : (limitReached ? 'Max Limit Reached' : 'Request Slot'))}
        </button>
      </div>
    </div>
  )
}
