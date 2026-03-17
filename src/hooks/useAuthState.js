import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists() && docSnap.data().role) {
            setRole(docSnap.data().role)
          } else {
            setRole('admin') // Admin created via AdminLogin has no user doc by default
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
          setRole('user')
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { user, role, loading }
}
