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

// --- Users (Auth Accounts Track) ---

export const listenToUsers = (callback) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(users)
  })
}

export const updateUserTeamName = async (id, teamName) => {
  const userRef = doc(db, 'users', id)
  return updateDoc(userRef, { teamName })
}

export const updateUserLogistics = async (id, data) => {
  const userRef = doc(db, 'users', id)
  return updateDoc(userRef, data)
}

export const createNewUser = async (data) => {
  return addDoc(collection(db, 'users'), {
    ...data,
    role: 'user',
    createdAt: new Date().toISOString()
  })
}

// --- Checkins (Independent Logistics Sheet) ---

export const listenToCheckins = (callback) => {
  const q = query(collection(db, 'checkins'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(data)
  })
}

export const createCheckin = async (data) => {
  return addDoc(collection(db, 'checkins'), {
    ...data,
    createdAt: new Date().toISOString()
  })
}

export const updateCheckin = async (id, data) => {
  const ref = doc(db, 'checkins', id)
  return updateDoc(ref, data)
}

export const deleteCheckin = async (id) => {
  const ref = doc(db, 'checkins', id)
  return deleteDoc(ref)
}

export const deleteUser = async (id) => {
  const ref = doc(db, 'users', id)
  return deleteDoc(ref)
}

// --- Settings (Global App Config) ---

export const listenToSettings = (callback) => {
  const ref = doc(db, 'settings', 'registration')
  return onSnapshot(ref, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data())
    } else {
      callback({ isRegistrationOpen: true })
    }
  })
}

export const updateRegistrationStatus = async (isOpen) => {
  const ref = doc(db, 'settings', 'registration')
  return updateDoc(ref, { isRegistrationOpen: isOpen }).catch(async (err) => {
    // If doc doesn't exist, create it
    if (err.code === 'not-found') {
      const { setDoc } = await import('firebase/firestore')
      return setDoc(ref, { isRegistrationOpen: isOpen })
    }
    throw err
  })
}
