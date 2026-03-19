import { useState, useEffect } from 'react'
import { listenToUsers, updateUserTeamName, deleteUser } from '../../firebase/firestore'

export default function ManageUsers({ showToast, showConfirm }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    const unsub = listenToUsers((data) => {
      setUsers(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const admins = users.filter(u => u.role === 'admin')
  const teams = users.filter(u => u.role === 'user')

  const handleSaveTeamName = async (id) => {
    try {
      if (!editName.trim()) {
        showToast('Team name cannot be empty')
        return
      }
      await updateUserTeamName(id, editName)
      setEditingId(null)
      showToast('Team name updated successfully!')
    } catch (err) {
      showToast('Failed to update team name')
    }
  }

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this team? This will remove their data from the system.')) {
      try {
        await deleteUser(id)
        showToast('Team deleted successfully')
      } catch (err) {
        showToast('Failed to delete team')
      }
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading users...</div>

  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 32px)', paddingBottom: '32px' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Registered Mentee Teams ({teams.length})
        </h2>
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
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '14px' }}>
                {teams.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No teams found</td></tr>
                ) : teams.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b' }}>
                      {editingId === u.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveTeamName(u.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #1dbb54',
                            borderRadius: '6px',
                            width: '100%',
                            outline: 'none'
                          }}
                        />
                      ) : (
                        u.teamName
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '16px 20px', color: '#ef4444', fontFamily: 'monospace', fontWeight: 500 }}>
                      {u.password || 'Hidden'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {editingId === u.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleSaveTeamName(u.id)} style={btnStyle('#16a34a')}>Save</button>
                          <button onClick={() => setEditingId(null)} style={btnStyle('#64748b')}>Cancel</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setEditingId(u.id); setEditName(u.teamName) }} 
                          style={btnStyle('#3b82f6')}
                        >
                          Edit
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        style={{...btnStyle('#ef4444'), marginLeft: '8px'}}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
          Registered Administrators ({admins.length})
        </h2>
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
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '14px' }}>
                {admins.length === 0 ? (
                  <tr><td colSpan="2" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No admins explicitly registered with passwords in db</td></tr>
                ) : admins.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b' }}>{u.email}</td>
                    <td style={{ padding: '16px 20px', color: '#ef4444', fontFamily: 'monospace', fontWeight: 500 }}>
                      {u.password || 'Hidden'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}

const btnStyle = (color) => ({
  background: 'transparent',
  border: `1px solid ${color}`,
  color: color,
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
})
