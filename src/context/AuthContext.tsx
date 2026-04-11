import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { LoginResponse, Role } from '../types'

interface AuthUser {
  username: string
  role: Role
  token: string
  fullName: string | null
  userId: number
  branchId: number | null
  shopId: number | null
  shopName: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  setSession: (data: LoginResponse) => void
  clearSession: () => void
  isAdmin: boolean
  isAdminBranches: boolean
  isReception: boolean
  isCallCenter: boolean
  isInventory: boolean
  isCashier: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const setSession = useCallback((data: LoginResponse) => {
    const authUser: AuthUser = {
      username:  data.username,
      role:      data.role,
      token:     data.token,
      fullName:  data.fullName ?? null,
      userId:    data.userId,
      branchId:  data.branchId ?? null,
      shopId:    data.shopId ?? null,
      shopName:  data.shopName ?? null,
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(authUser))
    setUser(authUser)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      setSession,
      clearSession,
      isAdmin:         user?.role === 'ADMIN',
      isAdminBranches: user?.role === 'ADMIN_BRANCHES',
      isReception:     user?.role === 'RECEPTION',
      isCallCenter:    user?.role === 'CALL_CENTER',
      isInventory:     user?.role === 'INVENTORY',
      isCashier:       user?.role === 'CASHIER',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
