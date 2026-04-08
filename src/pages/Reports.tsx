import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDailySales, getTopItems, getCashierReport } from '../api/reports'
import { getSales } from '../api/sales'
import { getItems } from '../api/items'
import { getStock } from '../api/stock'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { exportToExcel, today, daysAgo } from '../utils/exportExcel'

const COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#14b8a6',
]

// ── Export button component ───────────────────────────────────────────────────
function ExportBtn({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <button
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700
        text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      onClick={onClick}
      disabled={loading || disabled}
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
      {loading ? 'Exporting…' : 'Export Excel'}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const todayStr = today()
  const from30   = daysAgo(29)

  const [from, setFrom] = useState(from30)
  const [to,   setTo  ] = useState(todayStr)

  // Loading states for each export
  const [exSales,    setExSales   ] = useState(false)
  const [exItems,    setExItems   ] = useState(false)
  const [exStock,    setExStock   ] = useState(false)
  const [exDaily,    setExDaily   ] = useState(false)
  const [exTop,      setExTop     ] = useState(false)
  const [exCashier,  setExCashier ] = useState(false)

  // Chart data queries
  const { data: daily    } = useQuery({ queryKey: ['daily-report',    from, to], queryFn: () => getDailySales(from, to) })
  const { data: topItems } = useQuery({ queryKey: ['top-items-report', from, to], queryFn: () => getTopItems(from, to, 10) })
  const { data: cashiers } = useQuery({ queryKey: ['cashier-report',   from, to], queryFn: () => getCashierReport(from, to) })

  // ── Export handlers ─────────────────────────────────────────────────────────

  async function exportSalesReport() {
    setExSales(true)
    try {
      const all = await getSales({ from, to: `${to}T23:59:59`, page: 0, size: 9999 })
      const rows: Record<string, unknown>[] = (all?.content ?? []).map(s => ({
        'Sale #':      s.id,
        Cashier:       s.cashierUsername,
        Status:        s.status,
        'Items Count': s.items.length,
        'Total (JD)': Number(s.totalAmount).toFixed(2),
        Date:          new Date(s.createdAt).toLocaleString(),
        Note:          s.note ?? '',
      }))
      const totalRev = (all?.content ?? []).reduce((acc, s) => acc + s.totalAmount, 0)
      rows.push({ 'Sale #': '', Cashier: 'TOTAL', Status: '', 'Items Count': '', 'Total (JD)': totalRev.toFixed(2), Date: '', Note: '' })
      exportToExcel(rows, `sales-report-${from}-to-${to}`, 'Sales')
    } finally { setExSales(false) }
  }

  async function exportItemsReport() {
    setExItems(true)
    try {
      const all = await getItems({ activeOnly: false, page: 0, size: 9999 })
      const rows = (all?.content ?? []).map(item => ({
        SKU:             item.sku,
        Name:            item.name,
        Category:        item.categoryPath ?? item.categoryName ?? '',
        'Price (JD)':   Number(item.price).toFixed(2),
        'Cost (JD)':    item.costPrice != null ? Number(item.costPrice).toFixed(2) : '',
        Barcode:         item.barcode ?? '',
        'Barcode Type':  item.barcodeType,
        Status:          item.active ? 'Active' : 'Inactive',
        Description:     item.description ?? '',
      }))
      exportToExcel(rows, `items-inventory-${todayStr}`, 'Items')
    } finally { setExItems(false) }
  }

  async function exportStockReport() {
    setExStock(true)
    try {
      const all = await getStock({ page: 0, size: 9999 })
      const rows = (all?.content ?? []).map(s => ({
        SKU:            s.itemSku,
        'Item Name':    s.itemName,
        Quantity:       s.quantity,
        'Min Quantity': s.minQuantity,
        Status:         s.low ? 'Low' : 'OK',
        'Last Updated': new Date(s.updatedAt).toLocaleString(),
      }))
      exportToExcel(rows, `stock-inventory-${todayStr}`, 'Stock')
    } finally { setExStock(false) }
  }

  function exportDailySummary() {
    setExDaily(true)
    try {
      if (!daily?.length) return
      const rows = daily.map(d => ({
        Date:           d.date,
        'Sales Count':  d.salesCount,
        'Revenue (JD)': Number(d.totalRevenue).toFixed(2),
      }))
      const totRev   = daily.reduce((s, d) => s + d.totalRevenue, 0)
      const totSales = daily.reduce((s, d) => s + d.salesCount, 0)
      rows.push({ Date: 'TOTAL', 'Sales Count': totSales as never, 'Revenue (JD)': totRev.toFixed(2) })
      exportToExcel(rows, `daily-summary-${from}-to-${to}`, 'Daily')
    } finally { setExDaily(false) }
  }

  function exportTopItems() {
    setExTop(true)
    try {
      if (!topItems?.length) return
      const rows = topItems.map(t => ({
        Item:             t.itemName,
        'Units Sold':     t.totalQuantitySold,
        'Revenue (JD)':  Number(t.totalRevenue).toFixed(2),
      }))
      exportToExcel(rows, `top-items-${from}-to-${to}`, 'Top Items')
    } finally { setExTop(false) }
  }

  function exportCashiers() {
    setExCashier(true)
    try {
      if (!cashiers?.length) return
      const rows = cashiers.map(c => ({
        Cashier:          c.cashierUsername,
        'Total Sales':    c.totalSales,
        'Revenue (JD)':  Number(c.totalRevenue).toFixed(2),
      }))
      exportToExcel(rows, `cashier-performance-${from}-to-${to}`, 'Cashiers')
    } finally { setExCashier(false) }
  }

  return (
    <div className="space-y-6">

      {/* ── Header + date range ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <input
            type="date" className="input w-auto" value={from} max={to}
            onChange={e => setFrom(e.target.value)}
          />
          <span className="text-gray-400">→</span>
          <input
            type="date" className="input w-auto" value={to} min={from} max={todayStr}
            onChange={e => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* ── Quick export tiles ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Sales report */}
        <div className="card flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Sales Report</p>
            <p className="text-xs text-gray-400 mt-0.5">All transactions in the selected period</p>
          </div>
          <ExportBtn onClick={exportSalesReport} loading={exSales} />
        </div>

        {/* Items / Inventory */}
        <div className="card flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Items &amp; Inventory</p>
            <p className="text-xs text-gray-400 mt-0.5">Full item catalogue with prices and barcodes</p>
          </div>
          <ExportBtn onClick={exportItemsReport} loading={exItems} />
        </div>

        {/* Stock snapshot */}
        <div className="card flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Stock Snapshot</p>
            <p className="text-xs text-gray-400 mt-0.5">Current stock levels and low-stock status</p>
          </div>
          <ExportBtn onClick={exportStockReport} loading={exStock} />
        </div>

        {/* Daily summary */}
        <div className="card flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Daily Summary</p>
            <p className="text-xs text-gray-400 mt-0.5">Day-by-day revenue totals for the period</p>
          </div>
          <ExportBtn onClick={exportDailySummary} loading={exDaily} disabled={!daily?.length} />
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Daily Revenue */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Daily Revenue</h2>
            <ExportBtn onClick={exportDailySummary} loading={exDaily} disabled={!daily?.length} />
          </div>
          {daily && daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`JD ${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No data</p>
          )}
        </div>

        {/* Top Items */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Top 10 Items (by quantity)</h2>
            <ExportBtn onClick={exportTopItems} loading={exTop} disabled={!topItems?.length} />
          </div>
          {topItems && topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topItems} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="itemName" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => [v, 'Units sold']} />
                <Bar dataKey="totalQuantitySold" radius={[0, 4, 4, 0]}>
                  {topItems.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No data</p>
          )}
        </div>
      </div>

      {/* ── Cashier Performance ─────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">Cashier Performance</h2>
          <ExportBtn onClick={exportCashiers} loading={exCashier} disabled={!cashiers?.length} />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Cashier', 'Total Sales', 'Total Revenue'].map(h => (
                <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(cashiers ?? []).map(c => (
              <tr key={c.cashierId} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{c.cashierUsername}</td>
                <td className="px-6 py-3">{c.totalSales}</td>
                <td className="px-6 py-3 font-semibold text-blue-600">
                  JD {Number(c.totalRevenue).toFixed(2)}
                </td>
              </tr>
            ))}
            {!cashiers?.length && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                  No data for selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
