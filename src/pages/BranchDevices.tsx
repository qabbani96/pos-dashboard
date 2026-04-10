import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, updateInvoice } from '../api/invoices'
import { useAuth } from '../context/AuthContext'
import type { DeviceStatus, Invoice } from '../types'
import toast from 'react-hot-toast'
import {
  ArrowRightOnRectangleIcon,
  DevicePhoneMobileIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUSES: { value: DeviceStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL',       label: 'All',        color: 'bg-gray-100 text-gray-700 border-gray-200'     },
  { value: 'PENDING',   label: 'Pending',    color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'FIX',       label: 'Fixed',      color: 'bg-green-50 text-green-700 border-green-200'   },
  { value: 'NOT_FIX',   label: 'Not Fixed',  color: 'bg-red-50 text-red-700 border-red-200'         },
  { value: 'CHECKOUT',  label: 'Checkout',   color: 'bg-blue-50 text-blue-700 border-blue-200'      },
  { value: 'CANCELLED', label: 'Cancelled',  color: 'bg-gray-50 text-gray-500 border-gray-200'      },
]

const EDITABLE_STATUSES: DeviceStatus[] = ['PENDING', 'FIX', 'NOT_FIX', 'CANCELLED']

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  FIX:       'bg-green-50 text-green-700 border border-green-200',
  NOT_FIX:   'bg-red-50 text-red-700 border border-red-200',
  CHECKOUT:  'bg-blue-50 text-blue-700 border border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-300">—</span>
  const cls   = STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
  const label = STATUSES.find(s => s.value === status)?.label ?? status
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ── Invoice detail / edit drawer ──────────────────────────────────────────────

interface DrawerProps {
  invoice:     Invoice
  canEdit:     boolean
  onClose:     () => void
  onSaved:     () => void
}

function InvoiceDrawer({ invoice, canEdit, onClose, onSaved }: DrawerProps) {
  const [editing, setEditing] = useState(false)

  const [customerName,   setCustomerName]   = useState(invoice.customerName   ?? '')
  const [customerNumber, setCustomerNumber] = useState(invoice.customerNumber ?? '')
  const [devicePrice,    setDevicePrice]    = useState<string>(invoice.devicePrice != null ? String(invoice.devicePrice) : '')
  const [deviceStatus,   setDeviceStatus]   = useState<DeviceStatus>(
    (invoice.deviceStatus as DeviceStatus) ?? 'PENDING'
  )
  const [deviceProblem,  setDeviceProblem]  = useState(invoice.deviceProblem  ?? '')

  const saveMut = useMutation({
    mutationFn: () => updateInvoice(invoice.id, {
      customerName:   customerName.trim()   || undefined,
      customerNumber: customerNumber.trim() || undefined,
      devicePrice:    devicePrice !== '' ? parseFloat(devicePrice) : undefined,
      deviceStatus,
      deviceProblem:  deviceProblem.trim()  || undefined,
    }),
    onSuccess: () => {
      toast.success('Invoice updated')
      setEditing(false)
      onSaved()
    },
    onError: () => toast.error('Failed to update invoice'),
  })

  const handleCancel = () => {
    // reset to original values
    setCustomerName(invoice.customerName   ?? '')
    setCustomerNumber(invoice.customerNumber ?? '')
    setDevicePrice(invoice.devicePrice != null ? String(invoice.devicePrice) : '')
    setDeviceStatus((invoice.deviceStatus as DeviceStatus) ?? 'PENDING')
    setDeviceProblem(invoice.deviceProblem ?? '')
    setEditing(false)
  }

  // ── View mode rows ──────────────────────────────────────────────────────────
  const row = (label: string, value: string | null | undefined) =>
    value ? (
      <div key={label} className="flex gap-2 text-sm py-2 border-b border-gray-50 last:border-0">
        <span className="text-gray-400 w-32 flex-shrink-0 text-xs pt-0.5">{label}</span>
        <span className="text-gray-900 font-medium break-words flex-1">{value}</span>
      </div>
    ) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={editing ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-0.5">{invoice.invoiceNumber}</p>
            <p className="font-bold text-gray-900 text-lg leading-tight">
              {editing ? customerName || 'Customer' : (invoice.customerName ?? '—')}
            </p>
            <p className="text-sm text-gray-500">
              {editing ? customerNumber || '—' : (invoice.customerNumber ?? '—')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {!editing && <StatusBadge status={invoice.deviceStatus} />}
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {!editing && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Edit form ───────────────────────────────────────────────── */}
        {editing ? (
          <div className="p-5 space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Customer Name</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer full name"
                />
              </div>

              {/* Customer phone */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="tel"
                  value={customerNumber}
                  onChange={e => setCustomerNumber(e.target.value)}
                  placeholder="e.g. 0501234567"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="number"
                  min="0"
                  step="0.01"
                  value={devicePrice}
                  onChange={e => setDevicePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={deviceStatus}
                  onChange={e => setDeviceStatus(e.target.value as DeviceStatus)}
                >
                  {EDITABLE_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {STATUSES.find(st => st.value === s)?.label ?? s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problem description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Problem Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                value={deviceProblem}
                onChange={e => setDeviceProblem(e.target.value)}
                placeholder="Describe the problem…"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saveMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                {saveMut.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ─────────────────────────────────────────────── */
          <div className="p-5 space-y-0">
            {row('Device',        invoice.deviceType)}
            {row('Color',         invoice.deviceColor)}
            {row('IMEI / Serial', invoice.deviceImei)}
            {row('Accessories',   invoice.deviceAccessories)}
            {row('Assessment',    invoice.deviceQuestion)}
            {row('Problem',       invoice.deviceProblem)}
            {row('Note',          invoice.deviceNote)}
            {invoice.devicePrice != null && row('Price', String(invoice.devicePrice))}
            {row('Branch',        invoice.branchName)}
            {row('Entry Date',    invoice.entryDate ?? null)}
            {row('Created by',    invoice.createdByUsername)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export default function BranchDevices() {
  const { user, clearSession } = useAuth()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [activeStatus, setActiveStatus] = useState<DeviceStatus | 'ALL'>('PENDING')
  const [search,       setSearch]       = useState('')
  const [inputValue,   setInputValue]   = useState('')
  const [page,         setPage]         = useState(0)
  const [selected,     setSelected]     = useState<Invoice | null>(null)

  const applySearch = useCallback((val: string) => {
    setSearch(val)
    setPage(0)
  }, [])

  const isSearching = search.trim().length > 0

  const queryKey = ['branch-devices', isSearching ? null : user?.branchId, activeStatus, search, page]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => getInvoices({
      branchId: isSearching ? undefined : (user?.branchId ?? undefined),
      status:   activeStatus === 'ALL' ? undefined : activeStatus,
      search:   search || undefined,
      page,
      size:     PAGE_SIZE,
    }),
    placeholderData: prev => prev,
  })

  const invoices   = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalItems = data?.totalElements ?? 0

  const handleStatusClick = (s: DeviceStatus | 'ALL') => {
    setActiveStatus(s)
    setPage(0)
    setSearch('')
    setInputValue('')
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Branch Devices</h1>
            <p className="text-xs text-gray-400">{user?.fullName ?? user?.username} · {user?.role}</p>
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

      {/* ── Nav tabs ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-1">
        <button className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
          <DevicePhoneMobileIcon className="w-4 h-4" />
          Devices
        </button>
        <button
          onClick={() => navigate('/invoice/create')}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
        >
          <DocumentPlusIcon className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* ── Status pills ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => handleStatusClick(s.value as DeviceStatus | 'ALL')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeStatus === s.value
                  ? s.color + ' ring-2 ring-offset-1 ring-blue-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by phone number or invoice number…"
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

        {/* ── Results info ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{isFetching && !isLoading ? 'Updating…' : `${totalItems} device${totalItems !== 1 ? 's' : ''}`}</span>
          {isSearching ? (
            <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
              🔍 All branches · "{search}"
            </span>
          ) : (
            <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full border border-gray-100">
              This branch only
            </span>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <DevicePhoneMobileIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No devices found</p>
            <p className="text-xs text-gray-300 mt-1">
              {isSearching
                ? 'No invoices found across any branch for this search'
                : `No ${activeStatus === 'ALL' ? '' : activeStatus.toLowerCase() + ' '}invoices for this branch`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Device</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Branch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const isMyBranch = inv.branchId === user?.branchId
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelected(inv)}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-blue-700 text-xs tracking-wider">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm leading-tight">{inv.customerName ?? '—'}</p>
                        <p className="text-xs text-gray-400 font-mono">{inv.customerNumber ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-gray-700 text-sm leading-tight">{inv.deviceType ?? '—'}</p>
                        {inv.deviceProblem && (
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">{inv.deviceProblem}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.deviceStatus} />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs ${isMyBranch ? 'text-gray-500' : 'text-purple-500 font-medium'}`}>
                          {inv.branchName ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                        {inv.entryDate ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
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
      </div>

      {/* ── Drawer ────────────────────────────────────────────────────── */}
      {selected && (
        <InvoiceDrawer
          invoice={selected}
          canEdit={selected.branchId === user?.branchId && selected.deviceStatus !== 'CHECKOUT'}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            qc.invalidateQueries({ queryKey: ['branch-devices'] })
          }}
        />
      )}
    </div>
  )
}
