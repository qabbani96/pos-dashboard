import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getShops, createShop, updateShop, activateShop, deactivateShop, deleteShop } from '../api/shops'
import { getBranches } from '../api/branches'
import type { Shop, ShopRequest } from '../types'

// ── Modal form ────────────────────────────────────────────────────────────────

interface FormState { name: string; branchId: number | null }
const emptyForm = (): FormState => ({ name: '', branchId: null })

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Shops() {
  const qc = useQueryClient()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingShop,  setEditingShop]  = useState<Shop | null>(null)
  const [form,         setForm]         = useState<FormState>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<Shop | null>(null)

  // ── Queries ──

  // Management view: load ALL shops (active + inactive) so admins can toggle them
  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shops', 'all'],
    queryFn:  () => getShops(false),
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn:  getBranches,
  })

  // ── Mutations ──

  const invalidate = () => qc.invalidateQueries({ queryKey: ['shops'] })

  const createMut = useMutation({
    mutationFn: (payload: ShopRequest) => createShop(payload),
    onSuccess: () => { toast.success('Shop created'); invalidate(); closeModal() },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ShopRequest }) => updateShop(id, payload),
    onSuccess: () => { toast.success('Shop updated'); invalidate(); closeModal() },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Update failed'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? deactivateShop(id) : activateShop(id),
    onSuccess: (_, v) => { toast.success(v.active ? 'Deactivated' : 'Activated'); invalidate() },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Action failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteShop(id),
    onSuccess: () => { toast.success('Shop deleted'); invalidate(); setDeleteTarget(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  })

  // ── Handlers ──

  const openCreate = () => { setEditingShop(null); setForm(emptyForm()); setModalOpen(true) }

  const openEdit = (shop: Shop) => {
    setEditingShop(shop)
    setForm({ name: shop.name, branchId: shop.branchId })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditingShop(null); setForm(emptyForm()) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: ShopRequest = { name: form.name.trim(), branchId: form.branchId }
    if (editingShop) {
      updateMut.mutate({ id: editingShop.id, payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const busy = createMut.isPending || updateMut.isPending

  // ── Render ──

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
          <p className="text-sm text-gray-500 mt-1">Manage shop locations and their active status</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Add Shop
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading shops…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shops.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No shops yet</td></tr>
              ) : shops.map(shop => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{shop.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{shop.name}</td>
                  <td className="px-4 py-3 text-gray-500">{shop.branchName ?? '—'}</td>
                  <td className="px-4 py-3">
                    {shop.active ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircleIcon className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        <XCircleIcon className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(shop.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(shop)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => toggleMut.mutate({ id: shop.id, active: shop.active })}
                      disabled={toggleMut.isPending}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                        shop.active
                          ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      {shop.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(shop)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Delete Shop</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">"{deleteTarget.name}"</span>?
              This cannot be undone.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Deletion will fail if the shop has assigned users or stock entries.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-60"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.id)}
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingShop ? 'Edit Shop' : 'Add Shop'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Main Street Store"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch (optional)</label>
                <select
                  value={form.branchId ?? ''}
                  onChange={e => setForm(f => ({ ...f, branchId: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— No branch —</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {busy ? 'Saving…' : editingShop ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
