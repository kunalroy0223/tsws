import { useState, useEffect } from 'react'
import { listenToSlots, createSlot, updateSlot, deleteSlot } from '../../firebase/firestore'

const emptyForm = {
  mentorName: '',
  companyName: '',
  roomNumber: '',
  bio: '',
  linkedinLink: '',
  websiteLink: '',
  photoUrl: ''
}

export default function ManageSlots({ showToast, showConfirm }) {
  const [slots, setSlots] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = listenToSlots(setSlots)
    return () => unsub()
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 1MB to stay within Firestore document limits)
    if (file.size > 1 * 1024 * 1024) {
      showToast('Image too large. Please use an image under 1MB.', 'error')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photoUrl: reader.result }))
      showToast('Photo ready!')
      setUploading(false)
    }
    reader.onerror = () => {
      showToast('Failed to read photo', 'error')
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.mentorName.trim()) {
      setError('Mentor name is required')
      return
    }
    if (!form.roomNumber.trim()) {
      setError('Room number is required')
      return
    }
    setLoading(true)
    try {
      if (editMode && editingId) {
        await updateSlot(editingId, form)
        showToast('Slot updated successfully!')
      } else {
        await createSlot(form)
        showToast('Slot created successfully!')
      }
      handleCancelEdit()
    } catch (err) {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  const prepareEdit = (slot) => {
    setForm({
      mentorName: slot.mentorName || '',
      companyName: slot.companyName || '',
      roomNumber: slot.roomNumber || '',
      bio: slot.bio || '',
      linkedinLink: slot.linkedinLink || '',
      websiteLink: slot.websiteLink || '',
      photoUrl: slot.photoUrl || ''
    })
    setEditingId(slot.id)
    setEditMode(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setForm(emptyForm)
    setEditingId(null)
    setEditMode(false)
    setError('')
    showToast('Edit cancelled', 'info')
  }

  const handleDeleteSlot = async (id) => {
    showConfirm(
      'Delete Slot',
      'Are you sure? This cannot be undone.',
      async () => {
        await deleteSlot(id)
        showToast('Slot deleted')
      }
    )
  }

  return (
    <div>

      {/* Form */}
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        marginBottom: '48px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827'
          }}>
            {editMode ? '✏️ Edit Mentor Slot' : '➕ Add New Mentor Slot'}
          </h2>
          {editMode && (
            <button
              onClick={handleCancelEdit}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>

          {/* Mentor Name */}
          <div className="form-group">
            <label>Mentor Full Name *</label>
            <input
              type="text"
              value={form.mentorName}
              onChange={e => setForm({ ...form, mentorName: e.target.value })}
              placeholder="e.g. Deepak Kumar"
              required
            />
          </div>

          {/* Company */}
          <div className="form-group">
            <label>Company / Organization</label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm({ ...form, companyName: e.target.value })}
              placeholder="e.g. Google, Microsoft, Freelancer"
            />
          </div>

          {/* Room */}
          <div className="form-group">
            <label>Room / Session Code *</label>
            <input
              type="text"
              value={form.roomNumber}
              onChange={e => setForm({ ...form, roomNumber: e.target.value })}
              placeholder="e.g. Room 101, Hall A, Zoom-XYZ"
              required
            />
          </div>

          {/* Social Links */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={form.linkedinLink}
                onChange={e => setForm({ ...form, linkedinLink: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="form-group">
              <label>Website URL</label>
              <input
                type="url"
                value={form.websiteLink}
                onChange={e => setForm({ ...form, websiteLink: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="form-group">
            <label>Short Bio / Focus Area</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="e.g. Helping students build real-world AI projects..."
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label>Mentor Photo (optional)</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <img
                src={form.photoUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    form.mentorName || 'Mentor'
                  )}&background=4f46e5&color=fff&size=256`
                }
                alt="Preview"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #e5e7eb'
                }}
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    padding: '8px 0',
                    fontSize: '14px'
                  }}
                />
                {uploading && (
                  <p style={{
                    color: '#2563eb',
                    fontSize: '13px',
                    marginTop: '4px'
                  }}>
                    Uploading photo...
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploading}
            style={{
              padding: '14px 24px',
              background: editMode ? '#f59e0b' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading
              ? 'Saving...'
              : editMode
                ? '✏️ Update Mentor Slot'
                : '✅ Create Mentor Slot'}
          </button>
        </form>
      </div>

      {/* Slots List */}
      <h3 style={{
        fontSize: '22px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '20px'
      }}>
        Current Mentorship Slots ({slots.length})
      </h3>

      {slots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#64748b',
          padding: '60px 0',
          background: 'white',
          borderRadius: '16px',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗂️</div>
          <p>No mentorship slots created yet.</p>
          <p style={{ fontSize: '14px', marginTop: '6px' }}>
            Use the form above to add your first mentor.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {slots.map(slot => (
            <div
              key={slot.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              {/* Left: Photo + Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flex: 1
              }}>
                <img
                  src={slot.photoUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      slot.mentorName || 'Mentor'
                    )}&background=4f46e5&color=fff&size=256`
                  }
                  alt={slot.mentorName}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #e5e7eb',
                    flexShrink: 0
                  }}
                />
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '17px',
                    color: '#111827'
                  }}>
                    {slot.mentorName}
                  </div>
                  {slot.companyName && (
                    <div style={{
                      color: '#4f46e5',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginTop: '2px'
                    }}>
                      {slot.companyName}
                    </div>
                  )}
                  <div style={{
                    color: '#6b7280',
                    fontSize: '13px',
                    marginTop: '2px'
                  }}>
                    🚪 Room {slot.roomNumber}
                  </div>
                  {slot.bio && (
                    <div style={{
                      color: '#64748b',
                      fontSize: '13px',
                      marginTop: '4px',
                      maxWidth: '400px',
                      lineHeight: '1.4'
                    }}>
                      {slot.bio.substring(0, 90)}
                      {slot.bio.length > 90 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Links + Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {slot.linkedinLink && (
                  <a
                    href={slot.linkedinLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#0a66c2',
                      fontSize: '22px',
                      textDecoration: 'none'
                    }}
                    title="LinkedIn"
                  >
                    in
                  </a>
                )}
                {slot.websiteLink && (
                  <a
                    href={slot.websiteLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '20px',
                      textDecoration: 'none'
                    }}
                    title="Website"
                  >
                    🌐
                  </a>
                )}

                {/* Status Dropdown */}
                <select
                  value={slot.status}
                  onChange={e => updateSlot(slot.id, { status: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: 'auto',
                    background: 'white'
                  }}
                >
                  <option value="available">🟢 Available</option>
                  <option value="in_session">🔴 In Session</option>
                  <option value="break">🟡 On Break</option>
                  <option value="done">✅ Done</option>
                </select>

                <button
                  onClick={() => prepareEdit(slot)}
                  style={{
                    padding: '9px 18px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  style={{
                    padding: '9px 18px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
