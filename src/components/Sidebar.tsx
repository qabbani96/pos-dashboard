import { NavLink } from 'react-router-dom'
import {
  HomeIcon, CubeIcon, TagIcon, ArchiveBoxIcon,
  QrCodeIcon, ShoppingCartIcon, ChartBarIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',          label: 'Dashboard',   icon: HomeIcon },
  { to: '/items',     label: 'Items',        icon: CubeIcon },
  { to: '/categories',label: 'Categories',   icon: TagIcon },
  { to: '/stock',     label: 'Stock',        icon: ArchiveBoxIcon },
  { to: '/barcodes',  label: 'Barcodes',     icon: QrCodeIcon },
  { to: '/sales',     label: 'Sales',        icon: ShoppingCartIcon },
  { to: '/reports',   label: 'Reports',      icon: ChartBarIcon },
]

export default function Sidebar() {
  const { user, clearSession } = useAuth()

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-xl font-bold tracking-tight text-white">⚡ POS Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-1">{user?.username}</p>
        <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded mb-3">
          {user?.role}
        </span>
        <button
          onClick={clearSession}
          className="flex items-center gap-2 w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
