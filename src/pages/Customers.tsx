import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCustomers, getCustomerInvoices } from '../api/customers'
import type { Customer, Invoice } from '../types'
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  FIX:       'bg-green-50 text-green-700 border border-green-200',
  NOT_FIX:   'bg-red-50 text-red-700 border border-red-200',
  CHECKOUT:  'bg-blue-50 text-blue-700 border border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pending',
  FIX:       'Fixed',
  NOT_FIX:   'Not Fixed',
  CHECKOUT:  'Checkout',
  CANCELLED: 'Cancelled',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>
  const cls   = STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
  const label = STATUS_LABEL[status] ?? status
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ── Customer invoices panel ───────────────────────────────────────────────────

function CustomerInvoicesPanel({
  customer,
  onClose,
}: {
  customer: Customer
  onClose: () => void
}) {
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-invoices', customer.id, page],
    queryFn:  () => getCustomerInvoices(customer.id, { page, size: 20 }),
  })

  const invoices   = data?.content    ?? []
  const totalPages = data?.totalPages ?? 0
  const total      = data?.totalElements ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">{customer.customerName}</p>
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <PhoneIcon className="w-3.5 h-3.5" />
              {customer.customerNumber}
            </p>
            <p className="text-xs text-gray-400 mt-1">{total} invoice{total !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 mt-0.5"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice list */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="font-medium">No invoices yet</p>
              <p className="text-xs mt-1">This customer has no service records</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">#</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Device</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Branch</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">Price</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: Invoice) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-blue-700 text-xs tracking-wider">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900 font-medium leading-tight">
                        {inv.deviceType ?? '—'}
                      </p>
                      {inv.deviceProblem && (
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">
                          {inv.deviceProblem}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.deviceStatus} />
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {inv.branchName ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.devicePrice != null ? (
                        <span className="font-semibold text-gray-900 text-sm">
                          {Number(inv.devicePrice).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 hidden sm:table-cell">
                      {inv.entryDate ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function Customers() {
  const [inputValue, setInputValue] = useState('')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(0)
  const [selected,   setSelected]   = useState<Customer | null>(null)

  const applySearch = useCallback((val: string) => {
    setSearch(val)
    setPage(0)
  }, [])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customers', search, page],
    queryFn:  () => getCustomers({ search: search || undefined, page, size: PAGE_SIZE }),
    placeholderData: prev => prev,
  })

  const customers  = data?.content      ?? []
  const totalPages = data?.totalPages   ?? 0
  const total      = data?.totalElements ?? 0

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-400">
              {isFetching && !isLoading ? 'Updating…' : `${total} registered customer${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div className="relative mb-5">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          placeholder="Search by name or phone number…"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') applySearch(inputValue.trim()) }}
          onBlur={() => applySearch(inputValue.trim())}
        />
        {inputValue && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => { setInputValue(''); applySearch('') }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Customer table ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center shadow-sm">
          <UserGroupIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No customers found</p>
          {search && (
            <p className="text-xs text-gray-300 mt-1">
              No results for "{search}" — try a different name or number
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{c.customerName}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-gray-500 font-mono text-sm">
                      <PhoneIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      {c.customerNumber}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Customer invoices panel ────────────────────────────────── */}
      {selected && (
        <CustomerInvoicesPanel
          customer={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
