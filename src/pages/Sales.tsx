import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSales, getSaleById } from '../api/sales'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { exportToExcel } from '../utils/exportExcel'

// ── Sale Detail Modal ─────────────────────────────────────────────────────────
function SaleDetailModal({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const { data: sale } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => getSaleById(saleId),
  })

  if (!sale) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sale #{sale.id}</h2>
          <span className={sale.status === 'COMPLETED' ? 'badge-green' : 'badge-red'}>{sale.status}</span>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Cashier: <strong className="text-gray-800">{sale.cashierUsername}</strong></p>
          <p>Date: <strong className="text-gray-800">{new Date(sale.createdAt).toLocaleString()}</strong></p>
          {sale.note && <p>Note: {sale.note}</p>}
        </div>
        <div className="overflow-y-auto flex-1 border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Item</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Unit</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{item.itemName}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">JD {Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium">JD {Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={3} className="px-3 py-2 font-semibold text-right">Total</td>
                <td className="px-3 py-2 font-bold text-right text-blue-600">
                  JD {Number(sale.totalAmount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button className="btn-secondary self-end" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Sales() {
  const [page,     setPage    ] = useState(0)
  const [from,     setFrom    ] = useState('')
  const [to,       setTo      ] = useState('')
  const [status,   setStatus  ] = useState<'' | 'COMPLETED' | 'REFUNDED'>('')
  const [selected, setSelected] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  const queryParams = {
    page, size: 20,
    from:   from || undefined,
    to:     to   ? `${to}T23:59:59` : undefined,
    status: status || undefined,
  }

  const { data: salesPage, isLoading } = useQuery({
    queryKey: ['sales', page, from, to, status],
    queryFn: () => getSales(queryParams),
  })

  const sales      = salesPage?.content    ?? []
  const totalPages = salesPage?.totalPages ?? 1
  const hasFilter  = !!(from || to || status)

  function clearFilters() {
    setFrom(''); setTo(''); setStatus(''); setPage(0)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const all = await getSales({
        from:   from || undefined,
        to:     to   ? `${to}T23:59:59` : undefined,
        status: status || undefined,
        page: 0, size: 9999,
      })
      const rows = (all?.content ?? []).map(s => ({
        'Sale #':     s.id,
        Cashier:      s.cashierUsername,
        Status:       s.status,
        'Items Count': s.items.length,
        'Total (JD)': Number(s.totalAmount).toFixed(2),
        Date:         new Date(s.createdAt).toLocaleString(),
        Note:         s.note ?? '',
      }))
      const label = from && to ? `${from}-to-${to}` : from || to || 'all'
      exportToExcel(rows, `sales-report-${label}`, 'Sales')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales History</h1>

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Date range */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">From</label>
          <input
            type="date" className="input w-auto"
            value={from}
            onChange={e => { setFrom(e.target.value); setPage(0) }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">To</label>
          <input
            type="date" className="input w-auto"
            value={to}
            onChange={e => { setTo(e.target.value); setPage(0) }}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">Status</label>
          <select
            className="input w-auto"
            value={status}
            onChange={e => { setStatus(e.target.value as typeof status); setPage(0) }}
          >
            <option value="">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {hasFilter && (
          <button className="btn-secondary text-xs" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        {/* Spacer + Export */}
        <div className="flex-1" />
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

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['#', 'Cashier', 'Items', 'Total', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map(sale => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(sale.id)}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{sale.id}</td>
                  <td className="px-4 py-3 font-medium">{sale.cashierUsername}</td>
                  <td className="px-4 py-3 text-gray-500">{sale.items.length} item(s)</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">
                    JD {Number(sale.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={sale.status === 'COMPLETED' ? 'badge-green' : 'badge-red'}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-blue-600 hover:underline">View</button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
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

      {selected !== null && (
        <SaleDetailModal saleId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
