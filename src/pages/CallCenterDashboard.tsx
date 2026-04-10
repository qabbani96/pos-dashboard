import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { getInvoices } from '../api/invoices'
import { useAuth } from '../context/AuthContext'
import type { Invoice } from '../types'
import {
  ArrowRightOnRectangleIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  HashtagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

// ── Status helpers ────────────────────────────────────────────────────────────

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
  if (!status) return null
  const cls   = STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
  const label = STATUS_LABEL[status] ?? status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

// ── Invoice detail drawer ─────────────────────────────────────────────────────

function InvoiceDetail({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const section = (title: string, children: React.ReactNode) => (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">{children}</div>
    </div>
  )

  const row = (icon: React.ReactNode, label: string, value: string | null | undefined) =>
    value ? (
      <div className="flex items-start gap-3 px-4 py-2.5">
        <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
        <span className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-gray-900 font-medium break-words flex-1">{value}</span>
      </div>
    ) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-blue-700 text-sm tracking-widest">
                {invoice.invoiceNumber}
              </span>
              <StatusBadge status={invoice.deviceStatus} />
            </div>
            <p className="font-bold text-gray-900 text-lg leading-tight">
              {invoice.customerName ?? '—'}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <PhoneIcon className="w-3.5 h-3.5" />
              {invoice.customerNumber ?? '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 ml-3 mt-0.5">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {section('Customer',
            <>
              {row(<UserCircleIcon className="w-4 h-4" />, 'Name',   invoice.customerName)}
              {row(<PhoneIcon className="w-4 h-4" />,       'Phone',  invoice.customerNumber)}
            </>
          )}

          {section('Device',
            <>
              {row(<DevicePhoneMobileIcon className="w-4 h-4" />, 'Type',         invoice.deviceType)}
              {row(<span className="w-4 h-4 text-center text-xs">🎨</span>,       'Color',        invoice.deviceColor)}
              {row(<HashtagIcon className="w-4 h-4" />,            'IMEI / Serial',invoice.deviceImei)}
              {row(<span className="w-4 h-4 text-center text-xs">🔧</span>,       'Problem',      invoice.deviceProblem)}
              {row(<span className="w-4 h-4 text-center text-xs">📋</span>,       'Assessment',   invoice.deviceQuestion)}
              {row(<span className="w-4 h-4 text-center text-xs">📝</span>,       'Note',         invoice.deviceNote)}
              {row(<span className="w-4 h-4 text-center text-xs">🎒</span>,       'Accessories',  invoice.deviceAccessories)}
            </>
          )}

          {section('Service',
            <>
              {row(<CurrencyDollarIcon className="w-4 h-4" />,  'Price',      invoice.devicePrice != null ? String(invoice.devicePrice) : null)}
              {row(<BuildingOfficeIcon className="w-4 h-4" />,  'Branch',     invoice.branchName)}
              {row(<CalendarDaysIcon className="w-4 h-4" />,    'Entry Date', invoice.entryDate ?? null)}
              {row(<UserCircleIcon className="w-4 h-4" />,      'Created by', invoice.createdByUsername)}
              {invoice.feedbackCallcenter &&
                row(<span className="w-4 h-4 text-center text-xs">💬</span>, 'Feedback', invoice.feedbackCallcenter)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Invoice result card ───────────────────────────────────────────────────────

function InvoiceCard({ invoice, onClick }: { invoice: Invoice; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4 group"
    >
      {/* Top row: invoice number + status */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-bold text-blue-700 text-sm tracking-widest">
          {invoice.invoiceNumber}
        </span>
        <StatusBadge status={invoice.deviceStatus} />
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 mb-3">
        <UserCircleIcon className="w-4 h-4 text-gray-300 shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            {invoice.customerName ?? '—'}
          </p>
          <p className="text-xs text-gray-400 font-mono">{invoice.customerNumber}</p>
        </div>
      </div>

      {/* Device + branch row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <DevicePhoneMobileIcon className="w-3.5 h-3.5" />
          {invoice.deviceType ?? '—'}
          {invoice.deviceProblem && (
            <span className="text-gray-300"> · {invoice.deviceProblem.slice(0, 40)}{invoice.deviceProblem.length > 40 ? '…' : ''}</span>
          )}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          <BuildingOfficeIcon className="w-3.5 h-3.5" />
          {invoice.branchName ?? '—'}
        </span>
      </div>

      {/* Price + date */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-gray-400 flex items-center gap-1">
          <CalendarDaysIcon className="w-3.5 h-3.5" />
          {invoice.entryDate ?? '—'}
        </span>
        {invoice.devicePrice != null && (
          <span className="font-bold text-gray-700">
            {Number(invoice.devicePrice).toLocaleString()}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function CallCenterDashboard() {
  const { user, clearSession } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const inputRef  = useRef<HTMLInputElement>(null)

  const [inputValue, setInputValue] = useState('')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(0)
  const [selected,   setSelected]   = useState<Invoice | null>(null)

  const hasSearch = search.trim().length > 0

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['cc-search', search, page],
    queryFn:  () => getInvoices({
      // No branchId → searches across all branches
      search: search || undefined,
      page,
      size: PAGE_SIZE,
    }),
    enabled:  hasSearch,
    placeholderData: prev => prev,
  })

  const invoices   = data?.content      ?? []
  const totalPages = data?.totalPages   ?? 0
  const total      = data?.totalElements ?? 0

  const doSearch = (val: string) => {
    const trimmed = val.trim()
    setSearch(trimmed)
    setPage(0)
  }

  const clearSearch = () => {
    setInputValue('')
    setSearch('')
    setPage(0)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-xl p-2">
            <PhoneIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Call Center</h1>
            <p className="text-xs text-gray-400">{user?.fullName ?? user?.username}</p>
          </div>
        </div>
        <button
          onClick={clearSession}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign out
        </button>
      </header>

      {/* ── Nav tabs ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-1">
        <button
          onClick={() => navigate('/call-center')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            location.pathname === '/call-center'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <PhoneIcon className="w-4 h-4" />
          Lookup
        </button>
        <button
          onClick={() => navigate('/parts')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            location.pathname === '/parts'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <WrenchScrewdriverIcon className="w-4 h-4" />
          Device Parts
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Search bar ─────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Search by phone number or invoice number
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 0501234567 or AB3KP…"
                value={inputValue}
                autoFocus
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doSearch(inputValue) }}
              />
              {inputValue && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => doSearch(inputValue)}
              disabled={!inputValue.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Empty / idle state ─────────────────────────────────────── */}
        {!hasSearch && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-blue-50 rounded-2xl p-5 mb-4">
              <PhoneIcon className="w-10 h-10 text-blue-300" />
            </div>
            <p className="font-semibold text-gray-600 text-lg">Ready to help</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Enter a customer's phone number or invoice number above to look up their service record
            </p>
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────────────── */}
        {hasSearch && isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────── */}
        {hasSearch && !isLoading && (
          <>
            {/* Result count */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {isFetching ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} for "${search}"`}
              </span>
            </div>

            {invoices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <MagnifyingGlassIcon className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">
                  No invoices matched "{search}". Check the number and try again.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map(inv => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    onClick={() => setSelected(inv)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <ChevronLeftIcon className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-gray-400">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Next <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Invoice detail drawer ───────────────────────────────────── */}
      {selected && (
        <InvoiceDetail invoice={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
