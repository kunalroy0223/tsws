import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubSnapshot = null
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
      
      // Clear previous snapshot listener if it exists
      if (unsubSnapshot) {
        unsubSnapshot()
        unsubSnapshot = null
      }

      if (u) {
        const docRef = doc(db, 'users', u.uid)
        unsubSnapshot = onSnapshot(docRef, (snap) => {
          if (snap.exists() && snap.data().role) {
            setRole(snap.data().role)
          } else {
            setRole(null)
          }
          setLoading(false)
        }, (err) => {
          console.error("Error fetching user role:", err)
          setRole('user')
          setLoading(false)
        })
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubSnapshot) unsubSnapshot()
    }
  }, [])

  return { user, role, loading }
}
