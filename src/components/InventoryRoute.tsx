import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Renders child routes only for INVENTORY and ADMIN users.
 * Any other role is redirected to their own landing page.
 */
export default function InventoryRoute() {
  const { user } = useAuth()
  const allowed = user?.role === 'INVENTORY' || user?.role === 'ADMIN'
  return allowed ? <Outlet /> : <Navigate to="/login" replace />
}
