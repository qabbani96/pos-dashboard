import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

function landingFor(role: Role | undefined): string {
  switch (role) {
    case 'RECEPTION':
    case 'CALL_CENTER': return '/call-center'
    case 'INVENTORY':   return '/shops'
    default:            return '/login'
  }
}

/**
 * Renders child routes when the logged-in user is ADMIN or ADMIN_BRANCHES.
 * All other roles are redirected to their own home page.
 */
export default function AdminOrBranchesRoute() {
  const { user } = useAuth()
  const role = user?.role

  if (role === 'ADMIN' || role === 'ADMIN_BRANCHES') {
    return <Outlet />
  }

  return <Navigate to={landingFor(role)} replace />
}
