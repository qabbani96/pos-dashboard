import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Renders child routes only when the logged-in user is ADMIN_BRANCHES.
 * ADMIN does NOT have access to branch/user management pages.
 */
export default function AdminBranchesRoute() {
  const { user } = useAuth()
  return user?.role === 'ADMIN_BRANCHES' ? <Outlet /> : <Navigate to="/" replace />
}
