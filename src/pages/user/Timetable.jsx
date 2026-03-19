import { useState, useEffect, useMemo } from 'react'
import { listenToSlots, listenToRegistrations } from '../../firebase/firestore'

export default function Timetable() {
  const [slots, setSlots] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [tvMode, setTvMode] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const unsub1 = listenToSlots(setSlots)
    const unsub2 = listenToRegistrations(setRegistrations)

    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)

    return () => {
      unsub1();
      unsub2();
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Organize data for the grid
  const timetableData = useMemo(() => {
    if (slots.length === 0) return { mentors: [], maxTurns: 0 }

    const mentorRows = slots.map(slot => {
      // Get and sort registrations for this mentor (only approved/active ones)
      const slotRegs = registrations
        .filter(r => r.slotId === slot.id && (r.status === 'approved' || r.done || r.checkedIn))
        .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))

      return {
        id: slot.id,
        mentorName: slot.mentorName,
        company: slot.companyName,
        room: slot.roomNumber,
        regs: slotRegs
      }
    }).sort((a, b) => a.mentorName.localeCompare(b.mentorName))

    const maxTurns = Math.max(...mentorRows.map(m => m.regs.length), 0)

    return { mentors: mentorRows, maxTurns }
  }, [slots, registrations])

  if (slots.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'white',
        borderRadius: '24px',
        border: '1px dashed #e2e8f0'
      }}>

        <h3 style={{ color: '#1e293b', fontWeight: 700 }}>No sessions scheduled</h3>
        <p style={{ color: '#64748b' }}>Check back once mentors publish their slots.</p>
      </div>
    )
  }

  return (
    <div style={{
      padding: tvMode ? '0' : '10px 0',
      position: tvMode ? 'fixed' : 'relative',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#f8fafc',
      zIndex: tvMode ? 1000 : 1,
      overflow: tvMode ? 'auto' : 'visible'
    }}>
      {!tvMode && (
        <div style={{
          marginBottom: '24px',
          background: '#ffffff',
          padding: 'clamp(16px, 4vw, 30px)',
          borderRadius: '24px',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              fontSize: 'clamp(24px, 5vw, 40px)',
              background: '#1dbb54',
              width: 'clamp(50px, 8vw, 70px)',
              height: 'clamp(50px, 8vw, 70px)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(29, 187, 84, 0.2)'
            }}>

            </div>
            <div>
              <h2 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 900, marginBottom: '4px' }}>
                Live <span style={{ color: '#1dbb54' }}>Timetable</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                Real-time tracking for <span style={{ color: '#000', fontWeight: 700 }}>Mentorship Sessions</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setTvMode(true)}
            style={{
              padding: '12px 24px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Projector Mode
          </button>
        </div>
      )}

      {tvMode && (
        <button
          onClick={() => setTvMode(false)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1100,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '12px'
          }}
        >
          ✕ Exit Display Mode
        </button>
      )}

      {timetableData.mentors.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'white',
          borderRadius: '24px',
          border: '1px dashed #e2e8f0'
        }}>

          <h3 style={{ color: '#1e293b', fontWeight: 700 }}>No sessions scheduled</h3>
          <p style={{ color: '#64748b' }}>Check back once mentors publish their slots.</p>
        </div>
      ) : isMobile && !tvMode ? (
        /* Mobile Card View (Same as Live Tab) */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px'
        }}>
          {timetableData.mentors.map(m => (
            <div key={m.id} style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid #eef2f6'
            }}>
              {/* Mentor Stats Header */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 900, color: '#000', fontSize: '18px', textTransform: 'uppercase' }}>{m.mentorName}</div>
                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Room {m.room}
                </div>
              </div>

              {/* Turns List */}
              <div style={{ display: 'grid', gap: '8px' }}>
                {m.regs.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '10px' }}>No teams scheduled</p>
                ) : (
                  m.regs.map((reg, idx) => (
                    <div key={reg.id} style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: reg.done ? '#f8fafc' : reg.checkedIn ? '#f0fdf4' : 'white',
                      border: reg.checkedIn ? '1px solid #1dbb54' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontWeight: 900, color: '#1dbb54', fontSize: '13px' }}>#{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 800,
                          fontSize: '15px',
                          color: reg.done ? '#94a3b8' : '#000',
                          textDecoration: reg.done ? 'line-through' : 'none'
                        }}>
                          {reg.teamName}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: reg.done ? '#94a3b8' : (reg.checkedIn ? '#16a34a' : '#64748b'), textTransform: 'uppercase' }}>
                          {reg.done ? 'Finished' : reg.checkedIn ? 'Currently In' : 'Waiting'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div style={{
          overflowX: 'auto',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #eef2f6'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: tvMode ? '1200px' : '800px'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{
                  padding: '24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  color: '#64748b',
                  borderBottom: '2px solid #eef2f6',
                  position: 'sticky',
                  left: 0,
                  background: '#f8fafc',
                  zIndex: 2,
                  minWidth: '220px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Mentor & Room
                </th>
                {[...Array(timetableData.maxTurns)].map((_, i) => (
                  <th key={i} style={{
                    padding: '20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#1dbb54',
                    borderBottom: '2px solid #eef2f6',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    minWidth: '180px'
                  }}>
                    Turn {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetableData.mentors.map((m, idx) => (
                <tr key={m.id} style={{
                  borderBottom: idx === timetableData.mentors.length - 1 ? 'none' : '1px solid #f1f5f9',
                  transition: 'background 0.2s',
                }}>
                  <td style={{
                    padding: 'clamp(12px, 2vw, 24px)',
                    position: 'sticky',
                    left: 0,
                    background: 'white',
                    zIndex: 5,
                    borderRight: '1px solid #f1f5f9',
                    boxShadow: '4px 0 8px rgba(0,0,0,0.02)',
                    minWidth: 'clamp(160px, 15vw, 240px)'
                  }}>
                    <div style={{
                      fontWeight: 900,
                      color: '#000',
                      fontSize: 'clamp(14px, 2vw, 20px)',
                      lineHeight: '1.1',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.3px'
                    }}>
                      {m.mentorName}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 'clamp(11px, 1vw, 13px)', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Room {m.room}
                    </div>
                  </td>
                  {[...Array(timetableData.maxTurns)].map((_, i) => {
                    const reg = m.regs[i]
                    const isDone = reg?.done
                    const isCheckedIn = reg?.checkedIn
                    const isApproved = reg?.status === 'approved'

                    return (
                      <td key={i} style={{
                        padding: '16px 24px',
                        textAlign: 'center',
                        background: isCheckedIn ? '#f0fdf4' : 'transparent'
                      }}>
                        {reg ? (
                          <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: isDone ? '#f1f5f9' : isCheckedIn ? '#dcfce7' : 'white',
                            border: isCheckedIn ? '1px solid #bdf4c9' : '1px solid #e2e8f0',
                            transition: 'all 0.3s ease',
                            transform: isCheckedIn ? 'scale(1.05)' : 'none',
                            boxShadow: isCheckedIn ? '0 4px 12px rgba(29, 187, 84, 0.1)' : 'none'
                          }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '16px',
                              color: isDone ? '#94a3b8' : isCheckedIn ? '#16a34a' : '#334155',
                              textDecoration: isDone ? 'line-through' : 'none',
                              marginBottom: '2px'
                            }}>
                              {reg.teamName}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 900,
                              color: isDone ? '#94a3b8' : isCheckedIn ? '#1dbb54' : '#94a3b8',
                              textTransform: 'uppercase'
                            }}>
                              {isDone ? 'Finished' : isCheckedIn ? 'In Session' : isApproved ? 'Approved' : 'Pending'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#e2e8f0' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        table tr:hover td {
          background-color: #f8fafc !important;
        }
        ::-webkit-scrollbar {
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #1dbb54;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #1aa34a;
        }
      `}} />
    </div>
  )
}
