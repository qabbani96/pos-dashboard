import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Renders child routes only when the logged-in user is RECEPTION or CALL_CENTER.
 * Other roles get redirected to their own landing page.
 */
export default function ReceptionRoute() {
  const { user } = useAuth()
  const allowed = user?.role === 'RECEPTION' || user?.role === 'CALL_CENTER'
  return allowed ? <Outlet /> : <Navigate to="/" replace />
}
