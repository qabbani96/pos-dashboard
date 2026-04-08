import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboard, getDailySales } from '../api/reports'
import { ShoppingCartIcon, CurrencyDollarIcon, CubeIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { exportToExcel, today, daysAgo } from '../utils/exportExcel'

// ── Preset ranges ─────────────────────────────────────────────────────────────
const PRESETS = [
  { label: '7 d',  days: 6  },
  { label: '30 d', days: 29 },
  { label: '90 d', days: 89 },
] as const

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, color }: {
  title: string; value: string | number; icon: React.ElementType; color: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [from, setFrom] = useState(daysAgo(29))
  const [to,   setTo  ] = useState(today())
  const [activePreset, setActivePreset] = useState<number>(29)

  function applyPreset(days: number) {
    setFrom(daysAgo(days))
    setTo(today())
    setActivePreset(days)
  }

  function handleFromChange(val: string) {
    setFrom(val)
    setActivePreset(-1) // custom
  }

  function handleToChange(val: string) {
    setTo(val)
    setActivePreset(-1) // custom
  }

  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  })

  const { data: daily = [] } = useQuery({
    queryKey: ['daily', from, to],
    queryFn: () => getDailySales(from, to),
    enabled: !!from && !!to,
  })

  function handleExport() {
    const rows = daily.map(d => ({
      Date:          d.date,
      'Sales Count': d.salesCount,
      'Revenue (JD)': Number(d.totalRevenue).toFixed(2),
    }))

    const totalRevenue = daily.reduce((s, d) => s + d.totalRevenue, 0)
    const totalSales   = daily.reduce((s, d) => s + d.salesCount, 0)
    rows.push({
      Date:            'TOTAL',
      'Sales Count':   String(totalSales),
      'Revenue (JD)': totalRevenue.toFixed(2),
    } as never)

    exportToExcel(rows, `daily-summary-${from}-to-${to}`, 'Daily Summary')
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* KPI Cards — always "today" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Sales Today"   value={summary?.salesToday ?? '—'} icon={ShoppingCartIcon}       color="bg-blue-500"   />
        <KpiCard title="Revenue Today" value={summary ? `JD ${summary.revenueToday.toFixed(2)}` : '—'} icon={CurrencyDollarIcon} color="bg-green-500" />
        <KpiCard title="Total Items"   value={summary?.totalItems ?? '—'} icon={CubeIcon}               color="bg-purple-500" />
        <KpiCard title="Low Stock"     value={summary?.lowStockCount ?? '—'} icon={ExclamationTriangleIcon} color="bg-red-500" />
      </div>

      {/* Daily Revenue Chart */}
      <div className="card space-y-4">

        {/* Chart header + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-700">Daily Revenue</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Preset buttons */}
            {PRESETS.map(p => (
              <button
                key={p.days}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                  activePreset === p.days
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => applyPreset(p.days)}
              >
                {p.label}
              </button>
            ))}

            {/* Custom date pickers */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                className="input w-auto text-sm py-1"
                value={from}
                max={to}
                onChange={e => handleFromChange(e.target.value)}
              />
              <span className="text-gray-400 text-xs">→</span>
              <input
                type="date"
                className="input w-auto text-sm py-1"
                value={to}
                min={from}
                max={today()}
                onChange={e => handleToChange(e.target.value)}
              />
            </div>

            {/* Export button */}
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700
                text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              onClick={handleExport}
              disabled={daily.length === 0}
              title="Export daily summary to Excel"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Chart */}
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={daily} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`JD ${v.toFixed(2)}`, 'Revenue']}
                labelFormatter={l => `Date: ${l}`}
              />
              <Area type="monotone" dataKey="totalRevenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-16">No sales data for selected period</p>
        )}

        {/* Summary row */}
        {daily.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              Period: <strong className="text-gray-800">{from} → {to}</strong>
            </span>
            <span className="text-gray-500">
              Total sales: <strong className="text-gray-800">{daily.reduce((s, d) => s + d.salesCount, 0)}</strong>
            </span>
            <span className="text-gray-500">
              Total revenue:{' '}
              <strong className="text-blue-600">
                JD {daily.reduce((s, d) => s + d.totalRevenue, 0).toFixed(2)}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
