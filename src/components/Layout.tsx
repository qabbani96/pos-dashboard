import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'

/**
 * Main app shell.
 * ADMIN and ADMIN_BRANCHES get the full sidebar + content layout.
 * RECEPTION and CALL_CENTER get standalone pages with no sidebar.
 */
export default function Layout() {
  const { isReception, isCallCenter } = useAuth()
  const standalone = isReception || isCallCenter

  if (standalone) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
