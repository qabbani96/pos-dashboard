import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStock, getStockSummary, adjustStock, getMovements } from '../api/stock'
import type { MovementType, StockRecord } from '../types'
import toast from 'react-hot-toast'
import {
  AdjustmentsHorizontalIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { exportToExcel } from '../utils/exportExcel'

// ── Adjust Modal ──────────────────────────────────────────────────────────────
function AdjustModal({ stock, onClose }: { stock: StockRecord; onClose: () => void }) {
  const qc = useQueryClient()
  const [type,     setType    ] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState(1)
  const [note,     setNote    ] = useState('')

  const mutation = useMutation({
    mutationFn: () => adjustStock(stock.itemId, { type, quantity, note: note || undefined }),
    onSuccess: () => {
      toast.success('Stock adjusted')
      qc.invalidateQueries({ queryKey: ['stock'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Adjust Stock — {stock.itemName}</h2>
        <p className="text-sm text-gray-500">Current quantity: <strong>{stock.quantity}</strong></p>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={e => setType(e.target.value as MovementType)}>
            <option value="IN">IN — Add stock</option>
            <option value="OUT">OUT — Remove stock</option>
            <option value="ADJUSTMENT">ADJUSTMENT — Set exact quantity</option>
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input className="input" type="number" min="1" value={quantity}
            onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Movements Modal ───────────────────────────────────────────────────────────
function MovementsModal({ stock, onClose }: { stock: StockRecord; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['movements', stock.itemId],
    queryFn:  () => getMovements(stock.itemId),
  })
  const movements = data?.content ?? []

  const typeColors: Record<MovementType, string> = {
    IN: 'badge-green', OUT: 'badge-red', ADJUSTMENT: 'badge-yellow',
  }

  function handleExportMovements() {
    const rows = movements.map(m => ({
      Type:      m.type,
      Quantity:  m.quantity,
      Note:      m.note ?? '',
      'By':      m.createdBy ?? '',
      Date:      new Date(m.createdAt).toLocaleString(),
    }))
    exportToExcel(rows, `movements-${stock.itemSku}-${stock.itemName}`, 'Movements')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Movement History — {stock.itemName}</h2>
          <button
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700
              text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            onClick={handleExportMovements}
            disabled={movements.length === 0}
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['Type', 'Qty', 'Note', 'By', 'Date'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="px-3 py-2"><span className={typeColors[m.type]}>{m.type}</span></td>
                  <td className="px-3 py-2 font-mono">{m.quantity}</td>
                  <td className="px-3 py-2 text-gray-500">{m.note ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{m.createdBy ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No movements</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="btn-secondary self-end" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Stock() {
  const [lowOnly,    setLowOnly   ] = useState(false)
  const [search,     setSearch    ] = useState('')
  const [page,       setPage      ] = useState(0)
  const [adjusting,  setAdjusting ] = useState<StockRecord | null>(null)
  const [viewing,    setViewing   ] = useState<StockRecord | null>(null)
  const [exporting,  setExporting ] = useState(false)

  const { data: summary } = useQuery({
    queryKey: ['stock-summary'],
    queryFn:  getStockSummary,
  })

  const { data: stockPage, isLoading } = useQuery({
    queryKey: ['stock', lowOnly, page],
    queryFn:  () => getStock({ lowStockOnly: lowOnly, page, size: 15 }),
  })

  // Client-side search filter on the current page
  const allStocks    = stockPage?.content ?? []
  const stocks       = search.trim()
    ? allStocks.filter(s =>
        s.itemName.toLowerCase().includes(search.toLowerCase()) ||
        s.itemSku.toLowerCase().includes(search.toLowerCase())
      )
    : allStocks
  const totalPages   = stockPage?.totalPages ?? 1
  const hasFilter    = !!(search || lowOnly)

  function clearFilters() {
    setSearch(''); setLowOnly(false); setPage(0)
  }

  async function handleExport() {
    setExporting(true)
    try {
      // Fetch all stock records matching the current low-stock filter
      const all = await getStock({ lowStockOnly: lowOnly, page: 0, size: 9999 })
      const list = (all?.content ?? []).filter(s =>
        search.trim()
          ? s.itemName.toLowerCase().includes(search.toLowerCase()) ||
            s.itemSku.toLowerCase().includes(search.toLowerCase())
          : true
      )
      const rows = list.map(s => ({
        SKU:           s.itemSku,
        'Item Name':   s.itemName,
        Quantity:      s.quantity,
        'Min Quantity': s.minQuantity,
        Status:        s.low ? 'Low' : 'OK',
        'Last Updated': new Date(s.updatedAt).toLocaleString(),
      }))
      exportToExcel(
        rows,
        `stock-inventory-${new Date().toLocaleDateString('en-CA')}`,
        'Stock',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Stock</h1>
          {summary && (
            <span className="text-sm text-gray-500">
              <span className="text-red-600 font-semibold">{summary.lowStockCount}</span> low stock
            </span>
          )}
        </div>
        <button
          className="flex items-center gap-1.5 text-sm px-3 py-2 bg-green-600 hover:bg-green-700
            text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          onClick={handleExport}
          disabled={exporting}
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          {exporting ? 'Exporting…' : 'Export Excel'}
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-56"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Low stock toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded"
            checked={lowOnly}
            onChange={e => { setLowOnly(e.target.checked); setPage(0) }}
          />
          Low stock only
        </label>

        {hasFilter && (
          <button
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            onClick={clearFilters}
          >
            <XMarkIcon className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['SKU', 'Item', 'Qty', 'Min Qty', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stocks.map(s => (
                <tr key={s.stockId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.itemSku}</td>
                  <td className="px-4 py-3 font-medium">{s.itemName}</td>
                  <td className={`px-4 py-3 font-semibold ${s.low ? 'text-red-600' : ''}`}>{s.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{s.minQuantity}</td>
                  <td className="px-4 py-3">
                    <span className={s.low ? 'badge-red' : 'badge-green'}>{s.low ? 'Low' : 'OK'}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Adjust stock"
                      onClick={() => setAdjusting(s)}
                    >
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-gray-400 hover:text-purple-600 rounded"
                      title="Movement history"
                      onClick={() => setViewing(s)}
                    >
                      <ClockIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {search ? `No results for "${search}"` : 'No stock records'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button
            className="btn-secondary"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}

      {adjusting && <AdjustModal stock={adjusting} onClose={() => setAdjusting(null)} />}
      {viewing   && <MovementsModal stock={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
