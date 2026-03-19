import { Routes, Route, Navigate } from 'react-router-dom'
import UserApp from './pages/user/UserApp'
import UserLogin from './pages/user/UserLogin'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import { useAuthState } from './hooks/useAuthState'

function ProtectedRoute({ children, redirectTo, requiredRole }) {
  const { user, role, loading } = useAuthState()
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      color: '#2563eb'
    }}>
      Loading...
    </div>
  )
  if (!user) return <Navigate to={redirectTo} />
  
  // If a specific role is required and user does not have it, redirect
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={redirectTo} />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* User Side */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/" element={
        <ProtectedRoute redirectTo="/login" requiredRole="user">
          <UserApp />
        </ProtectedRoute>
      } />

      {/* Admin Side */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute redirectTo="/admin" requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
