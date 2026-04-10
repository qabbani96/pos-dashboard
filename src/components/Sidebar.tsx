import { NavLink } from 'react-router-dom'
import {
  HomeIcon, CubeIcon, TagIcon, ArchiveBoxIcon,
  QrCodeIcon, ShoppingCartIcon, ChartBarIcon, ArrowRightOnRectangleIcon,
  UsersIcon, BuildingOfficeIcon, UserGroupIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  roles: Role[]
}

const navItems: NavItem[] = [
  // ── ADMIN: POS operations only ────────────────────────────────────────────
  { to: '/',           label: 'Dashboard',  icon: HomeIcon,           roles: ['ADMIN'] },
  { to: '/items',      label: 'Items',       icon: CubeIcon,           roles: ['ADMIN'] },
  { to: '/categories', label: 'Categories',  icon: TagIcon,            roles: ['ADMIN'] },
  { to: '/stock',      label: 'Stock',       icon: ArchiveBoxIcon,     roles: ['ADMIN'] },
  { to: '/barcodes',   label: 'Barcodes',    icon: QrCodeIcon,         roles: ['ADMIN'] },
  { to: '/sales',      label: 'Sales',       icon: ShoppingCartIcon,   roles: ['ADMIN'] },
  { to: '/reports',    label: 'Reports',     icon: ChartBarIcon,       roles: ['ADMIN'] },

  // ── ADMIN_BRANCHES: branch + user management only ─────────────────────────
  { to: '/branches',   label: 'Branches',    icon: BuildingOfficeIcon, roles: ['ADMIN_BRANCHES'] },
  { to: '/users',      label: 'Users',       icon: UsersIcon,          roles: ['ADMIN_BRANCHES'] },
  { to: '/customers',  label: 'Customers',   icon: UserGroupIcon,      roles: ['ADMIN_BRANCHES'] },
  { to: '/money',      label: 'Money',       icon: BanknotesIcon,      roles: ['ADMIN_BRANCHES'] },
]

/** Branding config per role */
const LOGO: Record<string, { icon: string; label: string }> = {
  ADMIN:          { icon: '⚡', label: 'POS Admin'       },
  ADMIN_BRANCHES: { icon: '🏢', label: 'Harmonex-center' },
}

export default function Sidebar() {
  const { user, clearSession } = useAuth()
  const role = user?.role as Role | undefined

  const logo = (role && LOGO[role]) ?? { icon: '⚡', label: 'POS System' }

  const visibleItems = navItems.filter(item => role && item.roles.includes(role))

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-xl font-bold tracking-tight text-white">
          {logo.icon} {logo.label}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ to, label, icon: Icon }) => (
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
