import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/admin" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
