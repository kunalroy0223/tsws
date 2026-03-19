import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { listenToCheckins, updateCheckin, createCheckin, deleteCheckin } from '../../firebase/firestore'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Memoized table row component ──
// Prevents re-rendering rows that haven't changed
const CheckinRow = memo(function CheckinRow({ item, onUpdate, onBatchUpdate, onDelete, editingNameId, editNameValue, onEditNameStart, onEditNameChange, onEditNameSave, onEditNameCancel }) {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      {/* Participant Name */}
      <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b' }}>
        {editingNameId === item.id ? (
          <input
            autoFocus
            style={inputStyle}
            value={editNameValue}
            onChange={e => onEditNameChange(e.target.value)}
            onBlur={() => onEditNameSave(item.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') onEditNameSave(item.id)
              if (e.key === 'Escape') onEditNameCancel()
            }}
          />
        ) : (
          <div
            onClick={() => onEditNameStart(item.id, item.participantName || '')}
            style={{ cursor: 'pointer', borderBottom: '1px dashed #cbd5e1' }}
            title="Click to edit name"
          >
            {item.participantName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unset</span>}
          </div>
        )}
      </td>
      {/* Team Name */}
      <td style={{ padding: '16px 20px' }}>
        <DebouncedInput
          initialValue={item.teamName || ''}
          placeholder="Enter team"
          onSave={(val) => onUpdate(item.id, 'teamName', val)}
        />
      </td>
      {/* Phone */}
      <td style={{ padding: '16px 20px' }}>
        <DebouncedInput
          initialValue={item.phone || ''}
          placeholder="Enter phone"
          onSave={(val) => onUpdate(item.id, 'phone', val)}
        />
      </td>
      {/* Check-in */}
      <td style={{ padding: '16px 20px' }}>
        <select
          value={item.checkinStatus || 'Not Checked-in'}
          onChange={(e) => onUpdate(item.id, 'checkinStatus', e.target.value)}
          style={selectStyle(item.checkinStatus === 'Checked-in')}
        >
          <option value="Not Checked-in">Not Checked-in</option>
          <option value="Checked-in">Checked-in</option>
        </select>
      </td>
      {/* Kits */}
      <td style={{ padding: '16px 20px' }}>
        <select
          value={item.kitsStatus || 'Not Received'}
          onChange={(e) => onUpdate(item.id, 'kitsStatus', e.target.value)}
          style={selectStyle(item.kitsStatus === 'Received')}
        >
          <option value="Not Received">Not Received</option>
          <option value="Received">Received</option>
        </select>
      </td>
      {/* Stay */}
      <td style={{ padding: '16px 20px' }}>
        <select
          value={item.stayStatus || 'Off-campus'}
          onChange={(e) => onUpdate(item.id, 'stayStatus', e.target.value)}
          style={selectStyle(item.stayStatus === 'In-campus')}
        >
          <option value="Off-campus">Off-campus</option>
          <option value="In-campus">In-campus</option>
        </select>
      </td>
      {/* Inspirian */}
      <td style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={item.inspirianStatus || ''}
            onChange={(e) => {
              const val = e.target.value
              // Single batched write instead of two separate writes
              if (val !== 'No') {
                onBatchUpdate(item.id, { inspirianStatus: val, inspirianNote: '' })
              } else {
                onUpdate(item.id, 'inspirianStatus', val)
              }
            }}
            style={{ ...selectStyle(item.inspirianStatus === 'Yes'), width: 'auto', minWidth: '70px' }}
          >
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {item.inspirianStatus === 'No' && (
            <DebouncedInput
              initialValue={item.inspirianNote || ''}
              placeholder="From where?"
              onSave={(val) => onUpdate(item.id, 'inspirianNote', val)}
              style={{ flex: 1, minWidth: '80px' }}
            />
          )}
        </div>
      </td>
      {/* Actions */}
      <td style={{ padding: '16px 20px' }}>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this entry?')) {
              onDelete(item.id)
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Delete Entry"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </td>
    </tr>
  )
})

// ── Debounced text input ──
// Keeps local state so typing is instant, only saves to Firestore on blur/Enter
const DebouncedInput = memo(function DebouncedInput({ initialValue, placeholder, onSave, style: extraStyle }) {
  const [value, setValue] = useState(initialValue)
  const lastSaved = useRef(initialValue)

  // Sync from Firestore only when a genuinely new value arrives
  useEffect(() => {
    if (initialValue !== lastSaved.current) {
      setValue(initialValue)
      lastSaved.current = initialValue
    }
  }, [initialValue])

  const handleSave = useCallback(() => {
    const trimmed = value
    if (trimmed !== lastSaved.current) {
      lastSaved.current = trimmed
      onSave(trimmed)
    }
  }, [value, onSave])

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={e => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.target.blur()
        }
      }}
      style={{ ...inputStyle, ...extraStyle }}
    />
  )
})

// ══════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════

export default function ManageCheckins({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingNameId, setEditingNameId] = useState(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newItem, setNewItem] = useState({
    participantName: '',
    teamName: '',
    phone: '',
    checkinStatus: 'Not Checked-in',
    kitsStatus: 'Not Received',
    stayStatus: 'Off-campus',
    inspirianStatus: ''
  })

  // ── Filter & search state ──
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTeam, setFilterTeam] = useState('All')
  const [filterCheckin, setFilterCheckin] = useState('All')
  const [filterKits, setFilterKits] = useState('All')
  const [filterStay, setFilterStay] = useState('All')
  const [filterInspirian, setFilterInspirian] = useState('All')

  useEffect(() => {
    const unsub = listenToCheckins((snapshot) => {
      setData(snapshot)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // ── Stable callbacks (don't change on every render) ──
  const handleUpdate = useCallback(async (id, field, value) => {
    try {
      await updateCheckin(id, { [field]: value })
    } catch (err) {
      showToast('Failed to update')
    }
  }, [showToast])

  // Batch update: write multiple fields in a single Firestore call
  const handleBatchUpdate = useCallback(async (id, fields) => {
    try {
      await updateCheckin(id, fields)
    } catch (err) {
      showToast('Failed to update')
    }
  }, [showToast])

  const handleSaveName = useCallback(async (id) => {
    if (!editNameValue.trim()) return
    try {
      await updateCheckin(id, { participantName: editNameValue })
    } catch (err) {
      showToast('Failed to update')
    }
    setEditingNameId(null)
  }, [editNameValue, showToast])

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteCheckin(id)
      showToast('Entry deleted')
    } catch (err) {
      showToast('Delete failed')
    }
  }, [showToast])

  const handleEditNameStart = useCallback((id, name) => {
    setEditingNameId(id)
    setEditNameValue(name)
  }, [])

  const handleEditNameChange = useCallback((val) => {
    setEditNameValue(val)
  }, [])

  const handleEditNameCancel = useCallback(() => {
    setEditingNameId(null)
  }, [])

  // ── Derived: unique team names for team filter dropdown ──
  const teamNames = useMemo(() => {
    const names = [...new Set(data.map(d => d.teamName).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )
    return names
  }, [data])

  // ── Derived: filtered data ──
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return data.filter(item => {
      // Text search
      if (q) {
        const name = (item.participantName || '').toLowerCase()
        const team = (item.teamName || '').toLowerCase()
        const phone = (item.phone || '').toLowerCase()
        if (!name.includes(q) && !team.includes(q) && !phone.includes(q)) return false
      }
      // Team filter
      if (filterTeam !== 'All' && (item.teamName || '') !== filterTeam) return false
      // Check-in filter
      if (filterCheckin !== 'All' && (item.checkinStatus || 'Not Checked-in') !== filterCheckin) return false
      // Kits filter
      if (filterKits !== 'All' && (item.kitsStatus || 'Not Received') !== filterKits) return false
      // Stay filter
      if (filterStay !== 'All' && (item.stayStatus || 'Off-campus') !== filterStay) return false
      // Inspirian filter
      if (filterInspirian !== 'All') {
        if (filterInspirian === 'Yes' && item.inspirianStatus !== 'Yes') return false
        if (filterInspirian === 'No' && item.inspirianStatus === 'Yes') return false
      }
      return true
    })
  }, [data, searchQuery, filterTeam, filterCheckin, filterKits, filterStay, filterInspirian])

  // ── Derived: group filtered data by team ──
  const groupedByTeam = useMemo(() => {
    if (filterTeam !== 'All') return null // no grouping when a specific team is already selected
    const groups = {}
    filteredData.forEach(item => {
      const team = item.teamName || '(No Team)'
      if (!groups[team]) groups[team] = []
      groups[team].push(item)
    })
    // Sort team keys alphabetically
    const sorted = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )
    return sorted.map(team => ({ team, items: groups[team] }))
  }, [filteredData, filterTeam])

  const hasActiveFilters = searchQuery || filterTeam !== 'All' || filterCheckin !== 'All' || filterKits !== 'All' || filterStay !== 'All' || filterInspirian !== 'All'

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterTeam('All')
    setFilterCheckin('All')
    setFilterKits('All')
    setFilterStay('All')
    setFilterInspirian('All')
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newItem.participantName.trim()) {
      showToast('Participant Name is required')
      return
    }
    try {
      await createCheckin(newItem)
      setNewItem({
        participantName: '',
        teamName: '',
        phone: '',
        checkinStatus: 'Not Checked-in',
        kitsStatus: 'Not Received',
        stayStatus: 'Off-campus',
        inspirianStatus: ''
      })
      setIsCreating(false)
      showToast('Team entry created!')
    } catch (err) {
      showToast('Creation failed')
    }
  }, [newItem, showToast])

  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF()

    // Add Title
    doc.setFontSize(18)
    doc.setTextColor(17, 24, 39)
    doc.text('Independent Logistics Sheet', 14, 22)

    // Add timestamp + filter info subtitle
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    const filterInfo = hasActiveFilters ? ' (Filtered)' : ''
    doc.text(`Generated on: ${new Date().toLocaleString()}${filterInfo}`, 14, 30)

    const tableColumn = ["Participant Name", "Team Name", "Phone No.", "Check-in", "Kits", "Stay", "Inspirian"]
    const tableRows = []

    // Export only filtered data
    filteredData.forEach(item => {
      const inspirian = item.inspirianStatus === 'Yes'
        ? 'Yes'
        : item.inspirianStatus === 'No'
          ? `No${item.inspirianNote ? ' - ' + item.inspirianNote : ''}`
          : ''
      const rowData = [
        item.participantName || 'Unset',
        item.teamName || 'Unset',
        item.phone || 'Unset',
        item.checkinStatus || 'Not Checked-in',
        item.kitsStatus || 'Not Received',
        item.stayStatus || 'Off-campus',
        inspirian
      ]
      tableRows.push(rowData)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 36,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [29, 187, 84], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })

    doc.save(`Logistics_Sheet_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`)
    showToast('Downloading PDF...')
  }, [filteredData, hasActiveFilters, showToast])

  const renderRow = useCallback(item => (
    <CheckinRow
      key={item.id}
      item={item}
      onUpdate={handleUpdate}
      onBatchUpdate={handleBatchUpdate}
      onDelete={handleDelete}
      editingNameId={editingNameId}
      editNameValue={editNameValue}
      onEditNameStart={handleEditNameStart}
      onEditNameChange={handleEditNameChange}
      onEditNameSave={handleSaveName}
      onEditNameCancel={handleEditNameCancel}
    />
  ), [handleUpdate, handleBatchUpdate, handleDelete, editingNameId, editNameValue, handleEditNameStart, handleEditNameChange, handleSaveName, handleEditNameCancel])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading logistics sheet...</div>

  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 32px)', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>Independent Logistics Sheet ({data.length})</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleDownloadPDF} style={{ padding: '10px 16px', background: 'white', color: '#1dbb54', border: '2px solid #1dbb54', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Download PDF</button>
          <button onClick={() => setIsCreating(!isCreating)} style={{ padding: '10px 20px', background: '#1dbb54', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>{isCreating ? 'Cancel' : '+ Create New Entry'}</button>
        </div>
      </div>

      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
            <input type="text" placeholder="Search by name, team, or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
          </div>
          <div style={{ padding: '8px 14px', background: hasActiveFilters ? '#eff6ff' : '#f8fafc', border: `1px solid ${hasActiveFilters ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '10px' }}>Showing {filteredData.length} of {data.length}</div>
          {hasActiveFilters && <button onClick={clearFilters} style={{ padding: '8px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px' }}>Clear Filters</button>}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
            <label style={filterLabelStyle}>Team</label>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={filterSelectStyle(filterTeam !== 'All')}>
              <option value="All">All Teams</option>
              {teamNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={filterLabelStyle}>Check-in</label>
            <select value={filterCheckin} onChange={e => setFilterCheckin(e.target.value)} style={filterSelectStyle(filterCheckin !== 'All')}>
              <option value="All">All</option>
              <option value="Checked-in">Checked-in</option>
              <option value="Not Checked-in">Not Checked-in</option>
            </select>
          </div>
        </div>
      </div>

      {isCreating && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>Participant Name *</label>
            <input style={inputStyle} value={newItem.participantName} onChange={e => setNewItem({ ...newItem, participantName: e.target.value })} />
          </div>
          <div>
            <button onClick={handleCreate} style={{ padding: '10px 16px', background: '#1dbb54', color: 'white', border: 'none', borderRadius: '8px' }}>Confirm Entry</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={thStyle}>Participant Name</th>
                <th style={thStyle}>Team Name</th>
                <th style={thStyle}>Phone No.</th>
                <th style={thStyle}>Check-in</th>
                <th style={thStyle}>Kits</th>
                <th style={thStyle}>Stay</th>
                <th style={thStyle}>Inspirian</th>
                <th style={{ ...thStyle, width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {filteredData.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>{data.length === 0 ? <>Independent sheet is empty.</> : <div>No results match your filters</div>}</td></tr>
              ) : groupedByTeam ? (
                groupedByTeam.map(group => (
                  <React.Fragment key={group.team}>
                    <tr>
                      <td colSpan="8" style={{ padding: '10px 20px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
                        <strong style={{ color: '#16a34a' }}>{group.team}</strong> <span style={{ marginLeft: 8, color: '#86efac' }}>({group.items.length})</span>
                      </td>
                    </tr>
                    {group.items.map(renderRow)}
                  </React.Fragment>
                ))
              ) : (
                filteredData.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle = { padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }
const inputStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' }
const selectStyle = isActive => ({ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', width: '100%', outline: 'none', background: isActive ? '#dcfce7' : '#fff', color: isActive ? '#16a34a' : '#1e293b' })
const filterLabelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }
const filterSelectStyle = isActive => ({ padding: '8px 10px', borderRadius: '8px', border: `1px solid ${isActive ? '#93c5fd' : '#e2e8f0'}`, fontSize: '13px', width: '100%', outline: 'none', background: isActive ? '#eff6ff' : '#f8fafc', color: isActive ? '#2563eb' : '#1e293b' })
  }, [filteredData, hasActiveFilters, showToast])

  // ── Render a row via the memoized component ──
  const renderRow = useCallback((item) => (
    <CheckinRow
      key={item.id}
      item={item}
      onUpdate={handleUpdate}
      onBatchUpdate={handleBatchUpdate}
      onDelete={handleDelete}
      editingNameId={editingNameId}
      editNameValue={editNameValue}
      onEditNameStart={handleEditNameStart}
      onEditNameChange={handleEditNameChange}
      onEditNameSave={handleSaveName}
      onEditNameCancel={handleEditNameCancel}
    />
  ), [handleUpdate, handleBatchUpdate, handleDelete, editingNameId, editNameValue, handleEditNameStart, handleEditNameChange, handleSaveName, handleEditNameCancel])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading logistics sheet...</div>

  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 32px)', paddingBottom: '32px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: 0 }}>
          Independent Logistics Sheet ({data.length})
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '10px 16px',
              background: 'white',
              color: '#1dbb54',
              border: '2px solid #1dbb54',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download PDF
          </button>
          <button
            onClick={() => setIsCreating(!isCreating)}
            style={{
              padding: '10px 20px',
              background: '#1dbb54',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(29, 187, 84, 0.2)'
            }}
          >
            {isCreating ? 'Cancel' : '+ Create New Entry'}
          </button>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Row 1: Search + Result count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by name, team, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '36px',
                padding: '10px 12px 10px 36px',
                fontSize: '14px',
                borderRadius: '10px',
                background: '#f8fafc'
              }}
            />
          </div>
          <div style={{
            padding: '8px 14px',
            background: hasActiveFilters ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${hasActiveFilters ? '#bfdbfe' : '#e2e8f0'}`,
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: hasActiveFilters ? '#2563eb' : '#64748b',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}>
            Showing {filteredData.length} of {data.length}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 14px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Row 2: Filter dropdowns */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
            <label style={filterLabelStyle}>Team</label>
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              style={filterSelectStyle(filterTeam !== 'All')}
            >
              <option value="All">All Teams</option>
              {teamNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={filterLabelStyle}>Check-in</label>
            <select
              value={filterCheckin}
              onChange={e => setFilterCheckin(e.target.value)}
              style={filterSelectStyle(filterCheckin !== 'All')}
            >
              <option value="All">All</option>
              <option value="Checked-in">Checked-in</option>
              <option value="Not Checked-in">Not Checked-in</option>
            </select>
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={filterLabelStyle}>Kits</label>
            <select
              value={filterKits}
              onChange={e => setFilterKits(e.target.value)}
              style={filterSelectStyle(filterKits !== 'All')}
            >
              <option value="All">All</option>
              <option value="Received">Received</option>
              <option value="Not Received">Not Received</option>
            </select>
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={filterLabelStyle}>Stay</label>
            <select
              value={filterStay}
              onChange={e => setFilterStay(e.target.value)}
              style={filterSelectStyle(filterStay !== 'All')}
            >
              <option value="All">All</option>
              <option value="In-campus">In-campus</option>
              <option value="Off-campus">Off-campus</option>
            </select>
          </div>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <label style={filterLabelStyle}>Inspirian</label>
            <select
              value={filterInspirian}
              onChange={e => setFilterInspirian(e.target.value)}
              style={filterSelectStyle(filterInspirian !== 'All')}
            >
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No / Blank</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Create new entry form ── */}
      {isCreating && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Participant Name *</label>
            <input
              style={inputStyle}
              value={newItem.participantName}
              onChange={e => setNewItem({ ...newItem, participantName: e.target.value })}
              placeholder="Participant Name"
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Team Name</label>
            <input
              style={inputStyle}
              value={newItem.teamName}
              onChange={e => setNewItem({ ...newItem, teamName: e.target.value })}
              placeholder="Team Name"
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone No.</label>
            <input
              style={inputStyle}
              value={newItem.phone}
              onChange={e => setNewItem({ ...newItem, phone: e.target.value })}
              placeholder="Phone Number"
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Check-in</label>
            <select
              style={selectStyle(false)}
              value={newItem.checkinStatus}
              onChange={e => setNewItem({ ...newItem, checkinStatus: e.target.value })}
            >
              <option value="Not Checked-in">Not Checked-in</option>
              <option value="Checked-in">Checked-in</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Inspirian</label>
            <select
              style={selectStyle(false)}
              value={newItem.inspirianStatus}
              onChange={e => setNewItem({ ...newItem, inspirianStatus: e.target.value, inspirianNote: e.target.value !== 'No' ? '' : newItem.inspirianNote })}
            >
              <option value="">—</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {newItem.inspirianStatus === 'No' && (
              <input
                style={{ ...inputStyle, marginTop: '6px' }}
                value={newItem.inspirianNote || ''}
                onChange={e => setNewItem({ ...newItem, inspirianNote: e.target.value })}
                placeholder="From where?"
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleCreate}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1dbb54',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Confirm Entry
            </button>
          </div>
        </div>
      )}

      {/* ── Data table ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={thStyle}>Participant Name</th>
                <th style={thStyle}>Team Name</th>
                <th style={thStyle}>Phone No.</th>
                <th style={thStyle}>Check-in</th>
                <th style={thStyle}>Kits</th>
                <th style={thStyle}>Stay</th>
                <th style={thStyle}>Inspirian</th>
                <th style={{ ...thStyle, width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                    {data.length === 0 ? (
                      <>Independent sheet is empty. Click "+ Create New Entry" above.</>
                    ) : (
                      <div>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <p style={{ margin: 0, fontWeight: 600, color: '#94a3b8' }}>No results match your filters</p>
                        <button
                          onClick={clearFilters}
                          style={{
                            marginTop: '8px',
                            padding: '6px 16px',
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            color: '#2563eb',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : groupedByTeam ? (
                groupedByTeam.map(group => (
                  <React.Fragment key={group.team}>
                    <tr>
                      <td colSpan="8" style={{
                        padding: '10px 20px',
                        background: '#f0fdf4',
                        borderBottom: '1px solid #dcfce7',
                        borderTop: '1px solid #dcfce7'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#16a34a',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          {group.team}
                        </span>
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#86efac'
                        }}>
                          ({group.items.length} {group.items.length === 1 ? 'member' : 'members'})
                        </span>
                      </td>
                    </tr>
                    {group.items.map(renderRow)}
                  </React.Fragment>
                ))
              ) : (
                filteredData.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '16px 20px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

const inputStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
}

const selectStyle = (isActive) => ({
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: isActive ? '#dcfce7' : '#fff',
  color: isActive ? '#16a34a' : '#1e293b',
  fontWeight: isActive ? 700 : 400,
  cursor: 'pointer'
})