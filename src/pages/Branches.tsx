import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBranches, createBranch, updateBranch, deleteBranch } from '../api/branches'
import type { Branch, BranchRequest } from '../types'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'

// ── Modal ──────────────────────────────────────────────────────────────────────
interface BranchModalProps {
  initial?: Branch
  onClose: () => void
  onSave: (data: BranchRequest) => void
  saving: boolean
}

const PAPER_SIZES = [58, 80] as const

function BranchModal({ initial, onClose, onSave, saving }: BranchModalProps) {
  const [branchName,    setBranchName]    = useState(initial?.branchName    ?? '')
  const [mobile,        setMobile]        = useState(initial?.mobile        ?? '')
  const [receiptWidth,  setReceiptWidth]  = useState<number>(initial?.receiptWidthMm  ?? 58)
  const [heightInput,   setHeightInput]   = useState<string>(
    initial?.receiptHeightMm != null ? String(initial.receiptHeightMm) : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchName.trim()) return
    const parsedHeight = heightInput.trim() !== '' ? parseInt(heightInput, 10) : null
    onSave({
      branchName:      branchName.trim(),
      mobile:          mobile.trim() || undefined,
      receiptWidthMm:  receiptWidth,
      receiptHeightMm: parsedHeight && parsedHeight > 0 ? parsedHeight : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {initial ? 'Edit Branch' : 'Add Branch'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="label">Branch Name</label>
            <input
              className="input"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              placeholder="e.g. Downtown Branch"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label">Mobile Number <span className="text-gray-400 font-normal">(printed on receipt)</span></label>
            <input
              className="input"
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="e.g. 0781930000"
            />
          </div>

          <div>
            <label className="label">Receipt Paper Size</label>
            <div className="flex gap-3 mt-1">
              {PAPER_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setReceiptWidth(size)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                    receiptWidth === size
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {size} mm
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">58 mm = narrow roll · 80 mm = wide roll</p>
          </div>

          <div>
            <label className="label">
              Receipt Height (mm) <span className="text-gray-400 font-normal">— leave blank for auto</span>
            </label>
            <input
              className="input"
              type="number"
              min="20"
              max="200"
              value={heightInput}
              onChange={e => setHeightInput(e.target.value)}
              placeholder="Auto (content height)"
            />
            <p className="text-xs text-gray-400 mt-1">
              Auto = paper cuts after content (Gardinz-style). Set mm for fixed-size tickets (Seven Circle-style).
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Branches() {
  const qc = useQueryClient()
  const { isAdminBranches } = useAuth()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['branches'] })

  const createMut = useMutation({
    mutationFn: createBranch,
    onSuccess: () => { toast.success('Branch created'); invalidate(); setModalOpen(false) },
    onError:   () => toast.error('Failed to create branch'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BranchRequest }) => updateBranch(id, data),
    onSuccess: () => { toast.success('Branch updated'); invalidate(); setEditTarget(null) },
    onError:   () => toast.error('Failed to update branch'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => { toast.success('Branch deleted'); invalidate(); setDeleteTarget(null) },
    onError:   () => toast.error('Failed to delete branch'),
  })

  const handleSave = (data: BranchRequest) => {
    if (editTarget) {
      updateMut.mutate({ id: editTarget.id, data })
    } else {
      createMut.mutate(data)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-0.5">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
        </div>
        {isAdminBranches && (
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4" />
            Add Branch
          </button>
        )}
      </div>

      {/* Table */}
      {branches.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No branches yet</p>
          {isAdminBranches && (
            <p className="text-sm text-gray-400 mt-1">Click "Add Branch" to get started</p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Branch Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mobile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paper Size</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                {isAdminBranches && (
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{branch.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{branch.branchName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{branch.mobile ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {branch.receiptWidthMm} × {branch.receiptHeightMm != null ? `${branch.receiptHeightMm} mm` : 'auto'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(branch.createdAt).toLocaleDateString()}
                  </td>
                  {isAdminBranches && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditTarget(branch); setModalOpen(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(branch)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <BranchModal
          initial={editTarget ?? undefined}
          onClose={() => { setModalOpen(false); setEditTarget(null) }}
          onSave={handleSave}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Branch</h2>
            <p className="text-sm text-gray-600 mb-6">
              Delete <span className="font-medium">"{deleteTarget.branchName}"</span>? Users assigned to this branch will lose their branch assignment.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deleteTarget.id)}
                disabled={deleteMut.isPending}
                className="flex-1 justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
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
