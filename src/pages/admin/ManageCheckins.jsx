import { useState, useEffect } from 'react'
import { listenToCheckins, updateCheckin, createCheckin, deleteCheckin } from '../../firebase/firestore'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    stayStatus: 'Off-campus'
  })

  useEffect(() => {
    const unsub = listenToCheckins((snapshot) => {
      setData(snapshot)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleUpdate = async (id, field, value) => {
    try {
      await updateCheckin(id, { [field]: value })
      showToast('Updated successfully')
    } catch (err) {
      showToast('Failed to update')
    }
  }

  const handleSaveName = async (id) => {
    if (!editNameValue.trim()) return
    await handleUpdate(id, 'participantName', editNameValue)
    setEditingNameId(null)
  }

  const handleDelete = async (id) => {
    try {
      await deleteCheckin(id)
      showToast('Entry deleted')
    } catch (err) {
      showToast('Delete failed')
    }
  }

  const handleCreate = async () => {
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
        stayStatus: 'Off-campus'
      })
      setIsCreating(false)
      showToast('Team entry created!')
    } catch (err) {
      showToast('Creation failed')
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    
    // Add Title
    doc.setFontSize(18)
    doc.setTextColor(17, 24, 39)
    doc.text('Independent Logistics Sheet', 14, 22)
    
    // Add timestamp subtitle
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

    const tableColumn = ["Participant Name", "Team Name", "Phone No.", "Check-in", "Kits", "Stay"]
    const tableRows = []

    data.forEach(item => {
      const rowData = [
        item.participantName || 'Unset',
        item.teamName || 'Unset',
        item.phone || 'Unset',
        item.checkinStatus || 'Not Checked-in',
        item.kitsStatus || 'Not Received',
        item.stayStatus || 'Off-campus'
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
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading logistics sheet...</div>

  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 32px)', paddingBottom: '32px' }}>
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
              onChange={e => setNewItem({...newItem, participantName: e.target.value})}
              placeholder="Participant Name"
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Team Name</label>
            <input
              style={inputStyle}
              value={newItem.teamName}
              onChange={e => setNewItem({...newItem, teamName: e.target.value})}
              placeholder="Team Name"
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone No.</label>
            <input
              style={inputStyle}
              value={newItem.phone}
              onChange={e => setNewItem({...newItem, phone: e.target.value})}
              placeholder="Phone Number"
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Check-in</label>
            <select
              style={selectStyle(false)}
              value={newItem.checkinStatus}
              onChange={e => setNewItem({...newItem, checkinStatus: e.target.value})}
            >
              <option value="Not Checked-in">Not Checked-in</option>
              <option value="Checked-in">Checked-in</option>
            </select>
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
                <th style={{...thStyle, width: '80px'}}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {data.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Independent sheet is empty. Click "+ Create New Entry" above.</td></tr>
              ) : data.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b' }}>
                    {editingNameId === item.id ? (
                      <input
                        autoFocus
                        style={inputStyle}
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onBlur={() => handleSaveName(item.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveName(item.id)
                          if (e.key === 'Escape') setEditingNameId(null)
                        }}
                      />
                    ) : (
                      <div 
                        onClick={() => { setEditingNameId(item.id); setEditNameValue(item.participantName || '') }}
                        style={{ cursor: 'pointer', borderBottom: '1px dashed #cbd5e1' }}
                        title="Click to edit name"
                      >
                        {item.participantName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unset</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input
                      type="text"
                      defaultValue={item.teamName || ''}
                      placeholder="Enter team"
                      onBlur={(e) => handleUpdate(item.id, 'teamName', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(item.id, 'teamName', e.target.value)
                      }}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input
                      type="text"
                      defaultValue={item.phone || ''}
                      placeholder="Enter phone"
                      onBlur={(e) => handleUpdate(item.id, 'phone', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(item.id, 'phone', e.target.value)
                      }}
                      style={inputStyle}
                    />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={item.checkinStatus || 'Not Checked-in'}
                      onChange={(e) => handleUpdate(item.id, 'checkinStatus', e.target.value)}
                      style={selectStyle(item.checkinStatus === 'Checked-in')}
                    >
                      <option value="Not Checked-in">Not Checked-in</option>
                      <option value="Checked-in">Checked-in</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={item.kitsStatus || 'Not Received'}
                      onChange={(e) => handleUpdate(item.id, 'kitsStatus', e.target.value)}
                      style={selectStyle(item.kitsStatus === 'Received')}
                    >
                      <option value="Not Received">Not Received</option>
                      <option value="Received">Received</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={item.stayStatus || 'Off-campus'}
                      onChange={(e) => handleUpdate(item.id, 'stayStatus', e.target.value)}
                      style={selectStyle(item.stayStatus === 'In-campus')}
                    >
                      <option value="Off-campus">Off-campus</option>
                      <option value="In-campus">In-campus</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this entry?')) {
                          handleDelete(item.id)
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
              ))}
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
  transition: 'border-color 0.2s'
}

const selectStyle = (isActive) => ({
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
  background: isActive ? '#dcfce7' : '#fff',
  color: isActive ? '#16a34a' : '#1e293b',
  fontWeight: isActive ? 700 : 400,
  cursor: 'pointer'
})
