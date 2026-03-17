import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

// --- Slots (Mentors) ---

export const listenToSlots = (callback) => {
  const q = query(collection(db, 'slots'), orderBy('mentorName', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const slots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(slots)
  })
}

export const createSlot = async (form) => {
  return addDoc(collection(db, 'slots'), {
    ...form,
    status: form.status || 'available',
    createdAt: serverTimestamp()
  })
}

export const updateSlot = async (id, form) => {
  const slotRef = doc(db, 'slots', id)
  return updateDoc(slotRef, form)
}

export const deleteSlot = async (id) => {
  const slotRef = doc(db, 'slots', id)
  return deleteDoc(slotRef)
}

// --- Registrations (Team Requests) ---

export const listenToRegistrations = (callback) => {
  const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const regs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(regs)
  })
}

export const registerTeam = async (data) => {
  return addDoc(collection(db, 'registrations'), {
    ...data,
    status: 'pending',
    checkedIn: false,
    done: false,
    createdAt: serverTimestamp()
  })
}

export const updateRegistration = async (id, data) => {
  const regRef = doc(db, 'registrations', id)
  return updateDoc(regRef, data)
}

export const deleteRegistration = async (id) => {
  const regRef = doc(db, 'registrations', id)
  return deleteDoc(regRef)
}
