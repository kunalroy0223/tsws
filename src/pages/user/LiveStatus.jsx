import { useState, useEffect } from 'react'
import { listenToSlots, listenToRegistrations } from '../../firebase/firestore'

export default function LiveStatus() {
  const [slots, setSlots] = useState([])
  const [registrations, setRegistrations] = useState([])

  useEffect(() => {
    const unsub1 = listenToSlots(setSlots)
    const unsub2 = listenToRegistrations(setRegistrations)
    return () => { unsub1(); unsub2() }
  }, [])

  const getSlotRegistrations = (slotId) =>
    registrations
      .filter(r => r.slotId === slotId && r.status === 'approved')
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))

  const getCurrentTeam = (slotId) => {
    const regs = getSlotRegistrations(slotId)
    return regs.find(r => r.checkedIn && !r.done) || null
  }

  const isBusy = (slotId) => !!getCurrentTeam(slotId)

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Live Mentorship Status
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#dcfce7',
          padding: '6px 14px',
          borderRadius: '20px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#16a34a',
            animation: 'livePulse 2s infinite'
          }} />
          <span style={{
            fontSize: '12px',
            color: '#16a34a',
            fontWeight: 700
          }}>
            LIVE
          </span>
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>

      {slots.length === 0 ? (
        <div style={{
          padding: '80px 32px',
          background: 'white',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
          color: '#6b7280'
        }}>

          <p style={{ fontSize: '18px', marginBottom: '8px', color: '#1e293b' }}>
            No active sessions right now
          </p>
          <small style={{ fontSize: '14px' }}>
            Check back later or look at your registrations
          </small>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'clamp(16px, 3vw, 32px)'
        }}>
          {slots.map(slot => {
            const busy = isBusy(slot.id)
            const currentTeam = getCurrentTeam(slot.id)
            const allRegs = getSlotRegistrations(slot.id)

            return (
              <div
                key={slot.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  boxShadow: busy
                    ? '0 12px 36px rgba(239,68,68,0.15)'
                    : '0 12px 36px rgba(16,185,129,0.12)',
                  border: busy
                    ? '2px solid #ef4444'
                    : '2px solid #10b981',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Mentor Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <img
                      src={slot.photoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          slot.mentorName || 'Mentor'
                        )}&background=1dbb54&color=fff&size=256`
                      }
                      alt={slot.mentorName}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: `3px solid ${busy ? '#ef4444' : '#1dbb54'}`,
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '2px'
                      }}>
                        {slot.mentorName}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>
                        {slot.companyName} · Room {slot.roomNumber}
                      </p>
                    </div>
                  </div>

                  <span style={{
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 800,
                    background: busy ? '#fee2e2' : '#f0fdf4',
                    color: busy ? '#b91c1c' : '#16a34a'
                  }}>
                    {busy ? 'BUSY' : 'AVAILABLE'}
                  </span>
                </div>

                {/* Participants List */}
                <div style={{
                  background: '#f9fafb',
                  padding: '18px',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '14px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    Approved Teams Queue
                  </h4>

                  {allRegs.length === 0 ? (
                    <p style={{
                      color: '#9ca3af',
                      textAlign: 'center',
                      padding: '20px 0',
                      fontSize: '14px'
                    }}>
                      No approved teams yet
                    </p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {allRegs.map((reg, idx) => {
                        const isCurrent = reg.checkedIn && !reg.done
                        const isDone = reg.done

                        return (
                          <li
                            key={reg.id}
                            style={{
                              padding: '12px 14px',
                              marginBottom: '8px',
                              borderRadius: '10px',
                              background: isCurrent
                                ? '#f0fdfa'
                                : isDone
                                  ? '#f3f4f6'
                                  : 'white',
                              border: isCurrent
                                ? '1px solid #5eead4'
                                : isDone
                                  ? '1px dashed #cbd5e1'
                                  : '1px solid #e5e7eb',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              opacity: isDone ? 0.6 : 1,
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <span style={{
                                color: '#6b7280',
                                fontWeight: 700,
                                fontSize: '13px',
                                minWidth: '28px'
                              }}>
                                {idx + 1}
                              </span>
                              <div>
                                <div style={{
                                  fontWeight: isCurrent ? 700 : 500,
                                  fontSize: '14px',
                                  color: isDone ? '#9ca3af' : '#111827'
                                }}>
                                  {reg.teamName}
                                </div>
                                {reg.leaderName && reg.leaderName !== 'N/A' && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280'
                                  }}>
                                    {reg.leaderName}
                                  </div>
                                )}
                                {isDone && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#1dbb54',
                                    fontWeight: 800,
                                    marginTop: '2px'
                                  }}>
                                    Done
                                  </div>
                                )}
                              </div>
                            </div>

                            {isCurrent && (
                              <span style={{
                                background: '#ccfbf1',
                                color: '#0f766e',
                                padding: '5px 12px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}>
                                In Session
                              </span>
                            )}

                            {!isCurrent && !isDone && idx ===
                              allRegs.findIndex(r => !r.checkedIn && !r.done) && (
                                <span style={{
                                  background: '#fef3c7',
                                  color: '#d97706',
                                  padding: '5px 12px',
                                  borderRadius: '999px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  Up Next
                                </span>
                              )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
