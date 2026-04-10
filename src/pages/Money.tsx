import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBranches } from '../api/branches'
import { getMoneySummary } from '../api/invoices'
import type { Branch } from '../types'
import { BanknotesIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUSES = [
  { value: '',          label: 'All Statuses' },
  { value: 'PENDING',   label: 'Pending'      },
  { value: 'FIX',       label: 'Fixed'        },
  { value: 'NOT_FIX',   label: 'Not Fixed'    },
  { value: 'CHECKOUT',  label: 'Checkout'     },
  { value: 'CANCELLED', label: 'Cancelled'    },
]

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'text-yellow-600',
  FIX:       'text-green-600',
  NOT_FIX:   'text-red-500',
  CHECKOUT:  'text-blue-600',
  CANCELLED: 'text-gray-400',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Money() {
  const [branchId, setBranchId] = useState<string>('')   // '' = all branches
  const [status,   setStatus]   = useState<string>('')   // '' = all statuses

  // Load branches for the selector
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn:  getBranches,
  })

  const isAllBranches = branchId === ''

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['money-summary', branchId, status],
    queryFn:  () => getMoneySummary({
      branchId: branchId ? Number(branchId) : undefined,
      status:   status   || undefined,
    }),
  })

  const total     = data?.totalAmount  ?? 0
  const count     = data?.invoiceCount ?? 0
  const breakdown = data?.breakdown    ?? []

  const selectedBranchName = branches.find(b => String(b.id) === branchId)?.branchName
  const selectedStatusLabel = STATUSES.find(s => s.value === status)?.label

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <BanknotesIcon className="w-7 h-7 text-green-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Money</h1>
          <p className="text-sm text-gray-400">Revenue summary by branch and status</p>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Branch selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Branch</label>
          <select
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        </div>

        {/* Status selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
          <select
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Total card ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium mb-1">
              {isAllBranches ? 'All Branches' : selectedBranchName}
              {status ? ` · ${selectedStatusLabel}` : ' · All Statuses'}
            </p>
            {isLoading || isFetching ? (
              <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className="text-white text-4xl font-bold tracking-tight">
                {fmt(total)}
              </p>
            )}
            <p className="text-green-100 text-sm mt-2">
              {isLoading ? '…' : `${count} invoice${count !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <BanknotesIcon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* ── Per-branch breakdown (only when All Branches selected) ─── */}
      {isAllBranches && (
        <>
          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <BuildingOfficeIcon className="w-4 h-4" />
            Per-Branch Breakdown
            {status && (
              <span className={`text-xs font-medium ${STATUS_COLOR[status] ?? 'text-gray-500'}`}>
                · {selectedStatusLabel}
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          ) : breakdown.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
              <BanknotesIcon className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="font-medium">No data</p>
              <p className="text-xs mt-1">No invoices match the selected filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Branch</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">Invoices</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">Total</th>
                    <th className="px-5 py-3 text-xs hidden sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map(row => {
                    const pct = total > 0 ? (row.totalAmount / total) * 100 : 0
                    return (
                      <tr
                        key={row.branchId}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900">{row.branchName}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500 text-sm">
                          {row.invoiceCount}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold text-gray-900">{fmt(row.totalAmount)}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Footer total row */}
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-5 py-3 text-xs font-semibold text-gray-500">
                      Total
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
                      {count}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-green-600">
                      {fmt(total)}
                    </td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
