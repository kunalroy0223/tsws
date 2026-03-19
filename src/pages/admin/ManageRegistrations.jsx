import { useState, useEffect, useMemo } from 'react'
import {
  listenToSlots,
  listenToRegistrations,
  updateRegistration,
  deleteRegistration
} from '../../firebase/firestore'

export default function ManageRegistrations({ showToast, showConfirm }) {
  const [slots, setSlots] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [view, setView] = useState('mentors')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub1 = listenToSlots(setSlots)
    const unsub2 = listenToRegistrations(setRegistrations)
    return () => { unsub1(); unsub2() }
  }, [])

  // ── Helpers ──────────────────────────────────────────

  const getStatus = (reg) => {
    if (reg.done) return 'done'
    if (reg.checkedIn) return 'checkedIn'
    return reg.status
  }

  const getStatusBadge = (reg) => {
    const s = getStatus(reg)
    const map = {
      pending:   { label: '⏳ Pending',    bg: '#fef9c3', color: '#854d0e' },
      approved:  { label: '✅ Approved',   bg: '#dcfce7', color: '#16a34a' },
      rejected:  { label: '❌ Rejected',   bg: '#fee2e2', color: '#dc2626' },
      checkedIn: { label: '📍 Checked In', bg: '#dbeafe', color: '#1d4ed8' },
      done:      { label: '✔️ Done',       bg: '#f3f4f6', color: '#6b7280' },
    }
    return map[s] || { label: s, bg: '#f3f4f6', color: '#6b7280' }
  }

  const approve  = (id) => updateRegistration(id, { status: 'approved' })
  const reject   = (id) => updateRegistration(id, { status: 'rejected', checkedIn: false })
  const checkIn  = (id) => updateRegistration(id, { checkedIn: true, status: 'approved' })
  const markDone = (id) => updateRegistration(id, { done: true, checkedIn: false })
  const undoDone = (id) => updateRegistration(id, { done: false })

  const handleMove = async (reg, direction, siblings) => {
    const idx = siblings.findIndex(r => r.id === reg.id)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    
    if (targetIdx < 0 || targetIdx >= siblings.length) return

    const target = siblings[targetIdx]
    
    // Swap createdAt values
    const regTime = reg.createdAt
    const targetTime = target.createdAt

    await updateRegistration(reg.id, { createdAt: targetTime })
    await updateRegistration(target.id, { createdAt: regTime })
    
    showToast(`Moved ${direction === 'up' ? 'Up' : 'Down'}`)
  }

  const handleDelete = (id, teamName) => {
    showConfirm(
      'Delete Registration',
      `Permanently delete "${teamName}"? This cannot be undone.`,
      async () => {
        await deleteRegistration(id)
        showToast('Registration deleted')
      }
    )
  }

  // Optimized calculations with useMemo
  const counts = useMemo(() => ({
    all:       registrations.length,
    pending:   registrations.filter(r => r.status === 'pending' && !r.checkedIn && !r.done).length,
    approved:  registrations.filter(r => r.status === 'approved' && !r.checkedIn && !r.done).length,
    checkedIn: registrations.filter(r => r.checkedIn && !r.done).length,
    done:      registrations.filter(r => r.done).length,
  }), [registrations])

  const filtered = useMemo(() => registrations.filter(r =>
    !search ||
    r.teamName?.toLowerCase().includes(search.toLowerCase()) ||
    r.mentorName?.toLowerCase().includes(search.toLowerCase())
  ), [registrations, search])

  const regsBySlot = useMemo(() => slots.map(slot => ({
    ...slot,
    regs: filtered
      .filter(r => r.slotId === slot.id)
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || 9999999999;
        const timeB = b.createdAt?.seconds || 9999999999;
        return timeA - timeB;
      })
  })).filter(slot => slot.regs.length > 0), [slots, filtered])

  const regsByTeam = useMemo(() => {
    const teamMap = {}
    filtered.forEach(reg => {
      // Do not show registrations for mentors (slots) that have been deleted
      if (!slots.some(s => s.id === reg.slotId)) return;

      const team = reg.teamName || 'Unknown Team'
      if (!teamMap[team]) {
        teamMap[team] = {
          teamName: team,
          regs: []
        }
      }
      teamMap[team].regs.push(reg)
    })
    return Object.values(teamMap).sort((a, b) => a.teamName.localeCompare(b.teamName))
  }, [filtered, slots])

  const teamPriorities = useMemo(() => {
    const map = {}
    registrations.forEach(r => {
      const team = r.teamName || 'Unknown Team'
      if (!map[team]) map[team] = []
      map[team].push(r)
    })
    const priorityMap = {}
    Object.keys(map).forEach(team => {
      map[team].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 9999999999;
        const timeB = b.createdAt?.seconds || 9999999999;
        return timeA - timeB;
      })
      map[team].forEach((r, idx) => {
         priorityMap[r.id] = idx + 1
      })
    })
    return priorityMap
  }, [registrations])

  const tabs = [
    { key: 'mentors', label: '🧑‍🏫 Mentor Queues' },
    { key: 'teams', label: '👥 Team Queues' }
  ]

  return (
    <div>

      {/* Header + Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{fontSize: '20px', fontWeight: 700, marginBottom: '4px'}}>
            Requests & Approvals
          </h2>
          <p style={{color: '#6b7280', fontSize: '13px'}}>
            {counts.all} total · {counts.pending} pending · {counts.approved} approved · {counts.checkedIn} checked in · {counts.done} done
          </p>
        </div>
        <input
          placeholder="🔍 Search team, leader, mentor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            width: '260px',
            outline: 'none'
          }}
        />
      </div>

      {/* View Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: view === t.key ? 'none' : '1px solid #e5e7eb',
              background: view === t.key
                ? 'linear-gradient(90deg, #6366f1, #4f46e5)'
                : 'white',
              color: view === t.key ? 'white' : '#6b7280',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: view === t.key
                ? '0 4px 14px rgba(99,102,241,0.3)'
                : 'none',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BY MENTOR VIEW ──────────────────────────────── */}
      {view === 'mentors' && (
        <div style={{display: 'grid', gap: '20px'}}>
          {slots.length === 0 ? (
            <EmptyState message="No mentor slots created yet." />
          ) : regsBySlot.length === 0 ? (
            <EmptyState message="No registrations yet." />
          ) : (
            regsBySlot.map(slot => (
              <div key={slot.id} style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}>
                {/* Slot header */}
                <div style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
                    <img
                      src={slot.photoUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          slot.mentorName || 'M'
                        )}&background=4f46e5&color=fff&size=128`
                      }
                      alt={slot.mentorName}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #4f46e5'
                      }}
                    />
                    <div>
                      <h3 style={{fontWeight: 700, fontSize: '16px', color: '#111827'}}>
                        {slot.mentorName}
                      </h3>
                      <p style={{fontSize: '12px', color: '#6b7280'}}>
                        {slot.companyName} · 🚪 Room {slot.roomNumber}
                      </p>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 600}}>
                    <span style={{color: '#d97706'}}>
                      {slot.regs.filter(r => r.status === 'pending' && !r.done).length} pending
                    </span>
                    <span style={{color: '#16a34a'}}>
                      {slot.regs.filter(r => r.status === 'approved' && !r.done).length} approved
                    </span>
                    <span style={{color: '#1d4ed8'}}>
                      {slot.regs.filter(r => r.checkedIn && !r.done).length} checked in
                    </span>
                    <span style={{color: '#6b7280'}}>
                      {slot.regs.filter(r => r.done).length} done
                    </span>
                  </div>
                </div>

                {/* Registrations */}
                <div style={{padding: '12px 16px'}}>
                  {slot.regs.map((reg, idx) => (
                    <RegCard
                      key={reg.id}
                      reg={reg}
                      idx={idx}
                      slots={slots}
                      getStatusBadge={getStatusBadge}
                      getStatus={getStatus}
                      approve={approve}
                      reject={reject}
                      checkIn={checkIn}
                      markDone={markDone}
                      undoDone={undoDone}
                      handleDelete={handleDelete}
                      handleMove={handleMove}
                      siblings={slot.regs}
                      showMentor={false}
                      computedPriority={teamPriorities[reg.id]}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── BY TEAM VIEW ──────────────────────────────── */}
      {view === 'teams' && (
        <div style={{display: 'grid', gap: '20px'}}>
          {regsByTeam.length === 0 ? (
            <EmptyState message="No team registrations yet." />
          ) : (
            regsByTeam.map(team => (
              <div key={team.teamName} style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}>
                {/* Team header */}
                <div style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      border: '2px solid #e0e7ff'
                    }}>
                      {team.teamName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{fontWeight: 700, fontSize: '16px', color: '#111827'}}>
                        {team.teamName}
                      </h3>
                      <p style={{fontSize: '12px', color: '#6b7280'}}>
                        {team.regs.length} mentor{team.regs.length !== 1 ? 's' : ''} chosen
                      </p>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 600}}>
                    <span style={{color: '#d97706'}}>
                      {team.regs.filter(r => r.status === 'pending' && !r.done).length} pending
                    </span>
                    <span style={{color: '#16a34a'}}>
                      {team.regs.filter(r => r.status === 'approved' && !r.done).length} approved
                    </span>
                    <span style={{color: '#1d4ed8'}}>
                      {team.regs.filter(r => r.checkedIn && !r.done).length} checked in
                    </span>
                    <span style={{color: '#6b7280'}}>
                      {team.regs.filter(r => r.done).length} done
                    </span>
                  </div>
                </div>

                {/* Registrations */}
                <div style={{padding: '12px 16px'}}>
                  {team.regs.map((reg, idx) => (
                    <RegCard
                      key={reg.id}
                      reg={reg}
                      idx={idx}
                      slots={slots}
                      getStatusBadge={getStatusBadge}
                      getStatus={getStatus}
                      approve={approve}
                      reject={reject}
                      checkIn={checkIn}
                      markDone={markDone}
                      undoDone={undoDone}
                      handleDelete={handleDelete}
                      handleMove={handleMove}
                      siblings={team.regs}
                      showMentor={true}
                      computedPriority={teamPriorities[reg.id]}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ALL VIEW ──────────────────────────────── */}
      {view === 'all' && (
        <div style={{display: 'grid', gap: '10px'}}>
          <EmptyState message="View removed for simplicity." />
        </div>
      )}
    </div>
  )
}

// ── RegCard Component ─────────────────────────────────────

function RegCard({
  reg, idx, slots,
  getStatusBadge, getStatus,
  approve, reject, checkIn, markDone, undoDone,
  handleDelete, handleMove, siblings,
  showMentor, computedPriority
}) {
  const badge = getStatusBadge(reg)
  const status = getStatus(reg)

  return (
    <div style={{
      padding: '14px 16px',
      marginBottom: '8px',
      borderRadius: '12px',
      background: status === 'checkedIn'
        ? '#f0f9ff'
        : status === 'done'
        ? '#f9fafb'
        : 'white',
      border: status === 'checkedIn'
        ? '1px solid #bae6fd'
        : status === 'done'
        ? '1px dashed #d1d5db'
        : '1px solid #e5e7eb',
      opacity: status === 'done' ? 0.8 : 1,
      transition: 'all 0.2s'
    }}>

      {/* Top row: info + badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#9ca3af',
              minWidth: '24px'
            }}>
              #{idx + 1}
            </span>
            <span style={{
              fontWeight: 800,
              fontSize: '16px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {showMentor ? reg.mentorName || 'Unknown Mentor' : reg.teamName}
              {computedPriority && (
                <span style={{
                   padding: '2px 8px',
                   background: '#fef3c7',
                   color: '#d97706',
                   borderRadius: '12px',
                   fontSize: '11px',
                   fontWeight: 800
                }}>
                  Priority {computedPriority}
                </span>
              )}
            </span>
          </div>
          
          {handleMove && (
            <div style={{display: 'flex', gap: '4px', marginLeft: '34px', marginBottom: '8px'}}>
              <button 
                onClick={() => handleMove(reg, 'up', siblings)}
                disabled={idx === 0}
                style={{
                  padding: '4px 8px', 
                  fontSize: '11px', 
                  borderRadius: '4px', 
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  opacity: idx === 0 ? 0.5 : 1
                }}
              >
                🔼 Move Up
              </button>
              <button 
                onClick={() => handleMove(reg, 'down', siblings)}
                disabled={idx === siblings.length - 1}
                style={{
                  padding: '4px 8px', 
                  fontSize: '11px', 
                  borderRadius: '4px', 
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  cursor: idx === siblings.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: idx === siblings.length - 1 ? 0.5 : 1
                }}
              >
                🔽 Move Down
              </button>
            </div>
          )}
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 700,
          background: badge.bg,
          color: badge.color,
          whiteSpace: 'nowrap'
        }}>
          {badge.label}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6'
      }}>

        {status === 'pending' && (
          <>
            <ActionBtn
              onClick={() => approve(reg.id)}
              bg="#16a34a" label="✅ Approve"
            />
            <ActionBtn
              onClick={() => reject(reg.id)}
              bg="#dc2626" label="❌ Reject"
            />
          </>
        )}

        {status === 'approved' && (
          <>
            <ActionBtn
              onClick={() => checkIn(reg.id)}
              bg="#2563eb" label="📍 Check In"
            />
            <ActionBtn
              onClick={() => reject(reg.id)}
              bg="#dc2626" label="❌ Reject"
            />
          </>
        )}

        {status === 'checkedIn' && (
          <ActionBtn
            onClick={() => markDone(reg.id)}
            bg="#7c3aed" label="✔️ Mark Done"
          />
        )}

        {status === 'done' && (
          <ActionBtn
            onClick={() => undoDone(reg.id)}
            bg="#6b7280" label="↩️ Undo Done"
          />
        )}

        {status === 'rejected' && (
          <ActionBtn
            onClick={() => approve(reg.id)}
            bg="#16a34a" label="✅ Re-approve"
          />
        )}

        {/* Delete — always shown, pushed to right */}
        <button
          onClick={() => handleDelete(reg.id, reg.teamName)}
          style={{
            marginLeft: 'auto',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid #fca5a5',
            background: '#fff1f1',
            color: '#dc2626',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────

function ActionBtn({ onClick, bg, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: '8px',
        border: 'none',
        background: bg,
        color: 'white',
        fontWeight: 600,
        fontSize: '12px',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px dashed #e5e7eb',
      color: '#6b7280'
    }}>
      <div style={{fontSize: '36px', marginBottom: '12px'}}>👥</div>
      <p style={{fontSize: '15px'}}>{message}</p>
    </div>
  )
}
