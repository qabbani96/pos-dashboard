import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

/**
 * Returns the appropriate landing page for each non-admin role.
 * Prevents infinite redirect loops when non-ADMIN users land on AdminRoute paths.
 */
function landingFor(role: Role | undefined): string {
  switch (role) {
    case 'ADMIN_BRANCHES': return '/branches'
    case 'RECEPTION':
    case 'CALL_CENTER':    return '/call-center'
    case 'INVENTORY':      return '/shops'
    default:               return '/login'
  }
}

/**
 * Renders child routes only when the logged-in user is ADMIN.
 * Other roles are redirected to their own home page to avoid infinite loops.
 */
export default function AdminRoute() {
  const { isAdmin, user } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to={landingFor(user?.role)} replace />
}
