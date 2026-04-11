import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilSquareIcon, TrashIcon,
         CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getUsers, createUser, updateUser, deleteUser,
         activateUser, deactivateUser } from '../api/users'
import { getBranches } from '../api/branches'
import { getShops } from '../api/shops'
import { useAuth } from '../context/AuthContext'
import type { AppUser, CreateUserRequest, UpdateUserRequest, Role } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** All roles an ADMIN can assign */
const ALL_ASSIGNABLE_ROLES: Role[] = ['CASHIER', 'INVENTORY', 'RECEPTION', 'CALL_CENTER']

/** Roles available to ADMIN_BRANCHES — CASHIER is excluded */
const BRANCHES_ASSIGNABLE_ROLES: Role[] = ['INVENTORY', 'RECEPTION', 'CALL_CENTER']

/** Roles that require a branch assignment */
const BRANCH_REQUIRED_ROLES = new Set<Role>(['RECEPTION', 'CALL_CENTER'])

/** Roles that require a shop assignment */
const SHOP_REQUIRED_ROLES = new Set<Role>(['CASHIER', 'INVENTORY'])

const roleBadge: Record<string, string> = {
  ADMIN:          'bg-purple-100 text-purple-700',
  CASHIER:        'bg-blue-100 text-blue-700',
  INVENTORY:      'bg-teal-100 text-teal-700',
  ADMIN_BRANCHES: 'bg-indigo-100 text-indigo-700',
  RECEPTION:      'bg-green-100 text-green-700',
  CALL_CENTER:    'bg-orange-100 text-orange-700',
}

// ── Modal form state ──────────────────────────────────────────────────────────

interface FormState {
  username: string
  password: string
  fullName: string
  role: Role
  branchId: number | null
  shopId:   number | null
  active:   boolean
}

const emptyForm = (): FormState => ({
  username: '', password: '', fullName: '',
  role: 'CASHIER', branchId: null, shopId: null, active: true,
})

// ── Main component ────────────────────────────────────────────────────────────

export default function Users() {
  const qc = useQueryClient()
  const { isAdmin } = useAuth()

  /** Roles this principal is allowed to assign */
  const ASSIGNABLE_ROLES = isAdmin ? ALL_ASSIGNABLE_ROLES : BRANCHES_ASSIGNABLE_ROLES

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingUser,  setEditingUser]  = useState<AppUser | null>(null)
  const [form,         setForm]         = useState<FormState>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)

  // ── Queries ──

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  })

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => getShops(true),   // active shops only
  })

  // ── Mutations ──

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const createMut = useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),
    onSuccess: () => { toast.success('User created'); invalidate(); closeModal() },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserRequest }) =>
      updateUser(id, payload),
    onSuccess: () => { toast.success('User updated'); invalidate(); closeModal() },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => { toast.success('User deleted'); invalidate(); setDeleteTarget(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? deactivateUser(id) : activateUser(id),
    onSuccess: (_, vars) => {
      toast.success(vars.active ? 'User deactivated' : 'User activated')
      invalidate()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Action failed'),
  })

  // ── Handlers ──

  const openCreate = () => {
    setEditingUser(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (u: AppUser) => {
    setEditingUser(u)
    // Keep the user's current role if it is within this caller's assignable set;
    // otherwise fall back to the first available role.
    const role: Role = ASSIGNABLE_ROLES.includes(u.role as Role)
      ? (u.role as Role)
      : ASSIGNABLE_ROLES[0]
    setForm({
      username: u.username,
      password: '',
      fullName: u.fullName ?? '',
      role,
      branchId: u.branchId ?? null,
      shopId:   u.shopId   ?? null,
      active:   u.active,
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditingUser(null) }

  /** When the role changes, clear the fields that don't apply to the new role */
  const handleRoleChange = (role: Role) => {
    setForm(f => ({
      ...f,
      role,
      branchId: BRANCH_REQUIRED_ROLES.has(role) ? f.branchId : null,
      shopId:   SHOP_REQUIRED_ROLES.has(role)   ? f.shopId   : null,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (BRANCH_REQUIRED_ROLES.has(form.role) && !form.branchId) {
      toast.error('Please select a branch for this role')
      return
    }
    if (SHOP_REQUIRED_ROLES.has(form.role) && !form.shopId) {
      toast.error('Please select a shop for this role')
      return
    }

    if (editingUser) {
      const payload: UpdateUserRequest = {
        fullName: form.fullName || undefined,
        role:     form.role,
        active:   form.active,
        branchId: form.branchId,
        shopId:   form.shopId,
        ...(form.password ? { password: form.password } : {}),
      }
      updateMut.mutate({ id: editingUser.id, payload })
    } else {
      const payload: CreateUserRequest = {
        username: form.username,
        password: form.password,
        fullName: form.fullName || undefined,
        role:     form.role,
        branchId: form.branchId,
        shopId:   form.shopId,
      }
      createMut.mutate(payload)
    }
  }

  const isBusy      = createMut.isPending || updateMut.isPending
  const needsBranch = BRANCH_REQUIRED_ROLES.has(form.role)
  const needsShop   = SHOP_REQUIRED_ROLES.has(form.role)

  // ── Render ──

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? 'Manage all staff accounts — cashier, inventory, reception and call centre'
              : 'Manage branch staff accounts — reception, call centre and inventory'}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <PlusIcon className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Full Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Branch / Shop</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600">{u.fullName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleBadge[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {/* Show shop for CASHIER/INVENTORY, branch for RECEPTION/CALL_CENTER */}
                      {SHOP_REQUIRED_ROLES.has(u.role as Role)
                        ? u.shopName
                          ? <span className="text-teal-600">📦 {u.shopName}</span>
                          : <span className="text-red-400">No shop assigned</span>
                        : BRANCH_REQUIRED_ROLES.has(u.role as Role)
                          ? u.branchName ?? <span className="text-gray-300">—</span>
                          : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => u.role !== 'ADMIN' && toggleMut.mutate({ id: u.id, active: u.active })}
                        disabled={u.role === 'ADMIN' || toggleMut.isPending}
                        className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-60"
                        title={u.role === 'ADMIN' ? 'Admin status cannot be changed' : (u.active ? 'Click to deactivate' : 'Click to activate')}
                      >
                        {u.active
                          ? <><CheckCircleIcon className="w-4 h-4 text-green-500" /><span className="text-green-600 text-xs font-medium">Active</span></>
                          : <><XCircleIcon    className="w-4 h-4 text-red-400"   /><span className="text-red-500   text-xs font-medium">Inactive</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create User'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

              {/* Username */}
              <div>
                <label className="label">Username</label>
                <input
                  className="input w-full"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  disabled={!!editingUser}
                  required={!editingUser}
                  placeholder="e.g. cashier_ali"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input w-full"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              {/* Password */}
              <div>
                <label className="label">
                  Password{' '}
                  {editingUser && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="input w-full"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                />
              </div>

              {/* Role */}
              <div>
                <label className="label">Role</label>
                <select
                  className="input w-full"
                  value={form.role}
                  onChange={e => handleRoleChange(e.target.value as Role)}
                >
                  {ASSIGNABLE_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {needsShop   ? 'This role requires a shop assignment.'   : ''}
                  {needsBranch ? 'This role requires a branch assignment.' : ''}
                </p>
              </div>

              {/* Shop — required for CASHIER / INVENTORY */}
              {needsShop && (
                <div>
                  <label className="label">
                    Shop <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input w-full"
                    value={form.shopId ?? ''}
                    onChange={e => setForm(f => ({ ...f, shopId: e.target.value ? Number(e.target.value) : null }))}
                    required
                  >
                    <option value="">Select shop…</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {shops.length === 0 && (
                    <p className="text-xs text-orange-500 mt-1">
                      No active shops available. Please create a shop first in the Inventory section.
                    </p>
                  )}
                </div>
              )}

              {/* Branch — required for RECEPTION / CALL_CENTER */}
              {needsBranch && (
                <div>
                  <label className="label">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input w-full"
                    value={form.branchId ?? ''}
                    onChange={e => setForm(f => ({ ...f, branchId: e.target.value ? Number(e.target.value) : null }))}
                    required
                  >
                    <option value="">Select branch…</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branchName}</option>
                    ))}
                  </select>
                  {branches.length === 0 && (
                    <p className="text-xs text-orange-500 mt-1">No branches available. Please create a branch first.</p>
                  )}
                </div>
              )}

              {/* Active toggle — edit only */}
              {editingUser && (
                <div className="flex items-center gap-3">
                  <label className="label mb-0">Active</label>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isBusy}>
                  {isBusy ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">{deleteTarget.username}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-60"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.id)}
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
