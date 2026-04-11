import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getTransfers, createTransfer, completeTransfer, cancelTransfer } from '../api/transfers'
import { getShops } from '../api/shops'
import client from '../api/client'
import type { StockTransfer, StockTransferRequest, TransferItemLine, ApiResponse, Page, Item } from '../types'

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StockTransfer['status'] }) {
  const cls =
    status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
    status === 'CANCELLED' ? 'bg-gray-100 text-gray-500'   :
                             'bg-yellow-100 text-yellow-700'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>
}

// ── Item search helper ────────────────────────────────────────────────────────

function useItemSearch() {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState<Item[]>([])

  const search = async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    try {
      const res = await client.get<ApiResponse<Page<Item>>>('/items', { params: { search: q, size: 10 } })
      setResults(res.data.data.content)
    } catch {
      setResults([])
    }
  }

  return { query, setQuery, results, setResults, search }
}

// ── Create Transfer Modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  shops: { id: number; name: string }[]
  onClose: () => void
  onCreate: (data: StockTransferRequest) => void
  busy: boolean
}

function CreateTransferModal({ shops, onClose, onCreate, busy }: CreateModalProps) {
  const [shopId, setShopId] = useState<number | null>(null)
  const [note,   setNote]   = useState('')
  const [lines,  setLines]  = useState<TransferItemLine[]>([])
  const { query, setQuery, results, setResults, search } = useItemSearch()

  const addItem = (item: Item) => {
    setLines(prev => {
      const existing = prev.find(l => l.itemId === item.id)
      if (existing) return prev.map(l => l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l)
      return [...prev, { itemId: item.id, itemName: item.name, quantity: 1 }]
    })
    setQuery('')
    setResults([])
  }

  const updateQty = (itemId: number, qty: number) => {
    if (qty <= 0) {
      setLines(prev => prev.filter(l => l.itemId !== itemId))
    } else {
      setLines(prev => prev.map(l => l.itemId === itemId ? { ...l, quantity: qty } : l))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopId) { toast.error('Select a shop'); return }
    if (lines.length === 0) { toast.error('Add at least one item'); return }
    onCreate({ shopId, items: lines.map(({ itemId, quantity }) => ({ itemId, quantity })), note: note || undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">New Stock Transfer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Shop *</label>
            <select
              value={shopId ?? ''}
              onChange={e => setShopId(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select shop —</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Item search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Items</label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => search(e.target.value)}
                placeholder="Search items by name or SKU…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              {results.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {results.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between"
                    >
                      <span>{item.name}</span>
                      <span className="text-gray-400 text-xs">{item.sku}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          {lines.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Item</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium w-28">Qty</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map(line => (
                    <tr key={line.itemId}>
                      <td className="px-3 py-2 text-gray-700">{line.itemName}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={e => updateQty(line.itemId, Number(e.target.value))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => updateQty(line.itemId, 0)}
                          className="text-red-400 hover:text-red-600">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Weekly restock"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {busy ? 'Creating…' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Transfers() {
  const qc = useQueryClient()
  const [modalOpen,  setModalOpen]  = useState(false)
  const [detailOpen, setDetailOpen] = useState<StockTransfer | null>(null)

  const { data: transfersPage, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn:  () => getTransfers({ size: 50 }),
  })

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn:  () => getShops(true),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['transfers'] })

  const createMut = useMutation({
    mutationFn: (data: StockTransferRequest) => createTransfer(data),
    onSuccess: () => { toast.success('Transfer created'); invalidate(); setModalOpen(false) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Create failed'),
  })

  const completeMut = useMutation({
    mutationFn: (id: number) => completeTransfer(id),
    onSuccess: () => { toast.success('Transfer completed — stock deducted from warehouse'); invalidate(); setDetailOpen(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Complete failed'),
  })

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelTransfer(id),
    onSuccess: () => { toast.success('Transfer cancelled'); invalidate(); setDetailOpen(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Cancel failed'),
  })

  const transfers = transfersPage?.content ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="text-sm text-gray-500 mt-1">Send stock from the warehouse to shop locations</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          New Transfer
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Shop</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Created By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No transfers yet</td></tr>
              ) : transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailOpen(t)}>
                  <td className="px-4 py-3 text-gray-400">{t.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.shopName}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{t.items?.length ?? 0} lines</td>
                  <td className="px-4 py-3 text-gray-500">{t.createdBy}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {t.status === 'PENDING' && (
                      <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => completeMut.mutate(t.id)}
                          disabled={completeMut.isPending}
                          className="flex items-center gap-1 text-xs text-green-600 border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                        >
                          <CheckIcon className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button
                          onClick={() => cancelMut.mutate(t.id)}
                          disabled={cancelMut.isPending}
                          className="flex items-center gap-1 text-xs text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Transfer #{detailOpen.id}</h2>
              <button onClick={() => setDetailOpen(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Shop:</span> {detailOpen.shopName}</p>
              <p><span className="font-medium">Status:</span> <StatusBadge status={detailOpen.status} /></p>
              {detailOpen.note && <p><span className="font-medium">Note:</span> {detailOpen.note}</p>}
              <p><span className="font-medium">Created by:</span> {detailOpen.createdBy}</p>
              <p><span className="font-medium">Date:</span> {new Date(detailOpen.createdAt).toLocaleString()}</p>
            </div>
            {detailOpen.items?.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">Item</th>
                      <th className="px-3 py-2 text-right text-gray-500">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailOpen.items.map(line => (
                      <tr key={line.itemId}>
                        <td className="px-3 py-2 text-gray-700">{line.itemName ?? line.itemId}</td>
                        <td className="px-3 py-2 text-right font-medium">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {detailOpen.status === 'PENDING' && (
              <div className="flex gap-3">
                <button
                  onClick={() => completeMut.mutate(detailOpen.id)}
                  disabled={completeMut.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4" /> Complete Transfer
                </button>
                <button
                  onClick={() => cancelMut.mutate(detailOpen.id)}
                  disabled={cancelMut.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium border border-red-200 disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <CreateTransferModal
          shops={shops}
          onClose={() => setModalOpen(false)}
          onCreate={data => createMut.mutate(data)}
          busy={createMut.isPending}
        />
      )}
    </div>
  )
}
