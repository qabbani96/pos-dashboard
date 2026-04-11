import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'
import toast from 'react-hot-toast'

/** Maps each role to its landing page after login. */
function getRedirectPath(role: Role): string {
  switch (role) {
    case 'ADMIN':          return '/'
    case 'ADMIN_BRANCHES': return '/branches'
    case 'RECEPTION':      return '/invoice/create'
    case 'CALL_CENTER':    return '/call-center'
    case 'INVENTORY':      return '/shops'
    default:               return '/'
  }
}

export default function Login() {
  const navigate      = useNavigate()
  const { setSession } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Only allow roles that have a frontend portal
      // CASHIER is Android-only — they have no web dashboard
      const allowed: Role[] = ['ADMIN', 'ADMIN_BRANCHES', 'RECEPTION', 'CALL_CENTER', 'INVENTORY']
      if (!allowed.includes(data.role as Role)) {
        toast.error('Access denied. This portal is not available for your role.')
        return
      }
      setSession(data)
      navigate(getRedirectPath(data.role as Role), { replace: true })
    },
    onError: () => toast.error('Invalid username or password'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (username.trim() && password) mutate({ username: username.trim(), password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold text-gray-900">POS Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary w-full justify-center py-2.5">
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
