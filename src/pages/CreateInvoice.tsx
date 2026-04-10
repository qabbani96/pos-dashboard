import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createInvoice } from '../api/invoices'
import { findCustomerByPhone } from '../api/customers'
import { useAuth } from '../context/AuthContext'
import type { InvoiceRequest, Invoice, Customer } from '../types'
import Receipt from '../components/Receipt'
import toast from 'react-hot-toast'
import {
  ArrowRightOnRectangleIcon,
  DocumentPlusIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UserPlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

// ── Step 1: Phone lookup ───────────────────────────────────────────────────────

interface PhoneLookupStepProps {
  onFound:    (customer: Customer) => void
  onNotFound: (phone: string)      => void
}

function PhoneLookupStep({ onFound, onNotFound }: PhoneLookupStepProps) {
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = phone.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const customer = await findCustomerByPhone(trimmed)
      if (customer) {
        toast.success(`Welcome back, ${customer.customerName}!`)
        onFound(customer)
      } else {
        onNotFound(trimmed)
      }
    } catch {
      toast.error('Lookup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="card p-8 text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <MagnifyingGlassIcon className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Customer Phone Number</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter the customer's phone number to look them up or register them.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <input
            ref={inputRef}
            className="input text-center text-lg tracking-wider"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 0501234567"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Step 2: Confirm new customer name ─────────────────────────────────────────

interface NewCustomerStepProps {
  phone:    string
  onBack:   () => void
  onSubmit: (name: string) => void
}

function NewCustomerStep({ phone, onBack, onSubmit }: NewCustomerStepProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSubmit(name.trim())
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <div className="card p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>

        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <UserPlusIcon className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">New Customer</h2>
        <p className="text-sm text-gray-500 mb-1">
          Phone: <span className="font-mono font-semibold text-gray-700">{phone}</span>
        </p>
        <p className="text-sm text-gray-400 mb-6">
          This number isn't registered yet. Enter the customer's name to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Customer full name"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full justify-center py-3"
          >
            Continue to Invoice
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Step 3: Invoice form ───────────────────────────────────────────────────────

interface InvoiceFormStepProps {
  customerName:   string
  customerNumber: string
  onBack:         () => void
  onCreated:      (invoice: Invoice, copies: number) => void
}

function InvoiceFormStep({ customerName, customerNumber, onBack, onCreated }: InvoiceFormStepProps) {
  const [copies, setCopies] = useState(3)
  const [form, setForm] = useState({
    deviceType:         '',
    deviceColor:        '',
    deviceQuestion:     '',
    deviceProblem:      '',
    deviceImei:         '',
    deviceNote:         '',
    deviceAccessories:  '',
    devicePrice:        null as number | null,
    feedbackCallcenter: '',
  })

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const createMut = useMutation({
    mutationFn: (payload: InvoiceRequest) => createInvoice(payload),
    onSuccess: (data) => {
      toast.success(`Invoice ${data.invoiceNumber} created!`)
      onCreated(data, copies)
    },
    onError: () => toast.error('Failed to create invoice. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate({ ...form, customerName, customerNumber })
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Customer badge */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{customerName}</p>
          <p className="text-xs text-gray-500 font-mono">{customerNumber}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
        >
          Change
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Device */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Device Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Device Type</label>
              <input className="input" value={form.deviceType ?? ''} onChange={e => set('deviceType', e.target.value)} placeholder="e.g. iPhone 15 Pro" />
            </div>
            <div>
              <label className="label">IMEI / Serial No.</label>
              <input className="input" value={form.deviceImei ?? ''} onChange={e => set('deviceImei', e.target.value)} placeholder="IMEI or Serial" />
            </div>
            <div>
              <label className="label">Device Color</label>
              <input className="input" value={form.deviceColor ?? ''} onChange={e => set('deviceColor', e.target.value)} placeholder="e.g. Black Titanium" />
            </div>
            <div>
              <label className="label">Accessories</label>
              <input className="input" value={form.deviceAccessories ?? ''} onChange={e => set('deviceAccessories', e.target.value)} placeholder="e.g. Charger, Case" />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Initial Assessment</label>
            <textarea className="input min-h-[80px] resize-y" value={form.deviceQuestion ?? ''} onChange={e => set('deviceQuestion', e.target.value)} placeholder="Initial check / customer complaint…" />
          </div>
          <div className="mt-4">
            <label className="label">Problem Description</label>
            <textarea className="input min-h-[80px] resize-y" value={form.deviceProblem ?? ''} onChange={e => set('deviceProblem', e.target.value)} placeholder="Describe the problem…" />
          </div>
          <div className="mt-4">
            <label className="label">Technician Note</label>
            <textarea className="input min-h-[60px] resize-y" value={form.deviceNote ?? ''} onChange={e => set('deviceNote', e.target.value)} placeholder="Additional technician notes…" />
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Pricing</h2>
          <div className="max-w-xs">
            <label className="label">Price</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.devicePrice ?? ''}
              onChange={e => set('devicePrice', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Call Center */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Call Center</h2>
          <label className="label">Call Center Feedback</label>
          <textarea className="input min-h-[70px] resize-y" value={form.feedbackCallcenter ?? ''} onChange={e => set('feedbackCallcenter', e.target.value)} placeholder="Call center notes or follow-up…" />
        </div>

        {/* Print copies */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Receipt Copies</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCopies(c => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              −
            </button>
            <span className="text-2xl font-bold text-gray-900 w-8 text-center">{copies}</span>
            <button
              type="button"
              onClick={() => setCopies(c => Math.min(10, c + 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              +
            </button>
            <span className="text-sm text-gray-400 ml-1">cop{copies === 1 ? 'y' : 'ies'} will print</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setForm({
              deviceType: '', deviceColor: '', deviceQuestion: '',
              deviceProblem: '', deviceImei: '', deviceNote: '', deviceAccessories: '',
              devicePrice: null, feedbackCallcenter: '',
            })}
            className="btn-secondary"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="btn-primary flex-1 justify-center py-3 text-base"
          >
            {createMut.isPending ? 'Creating Invoice…' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Page (orchestrates the 3 steps) ──────────────────────────────────────────

type Step =
  | { name: 'lookup' }
  | { name: 'new-customer'; phone: string }
  | { name: 'form'; customerName: string; customerNumber: string }

export default function CreateInvoice() {
  const { user, clearSession } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]           = useState<Step>({ name: 'lookup' })
  const [lastInvoice, setLastInvoice] = useState<string | null>(null)
  const [printInvoice, setPrintInvoice] = useState<{ invoice: Invoice; copies: number } | null>(null)

  const handleFound = (customer: Customer) => {
    setStep({ name: 'form', customerName: customer.customerName, customerNumber: customer.customerNumber })
  }

  const handleNotFound = (phone: string) => {
    setStep({ name: 'new-customer', phone })
  }

  const handleNewCustomerSubmit = (name: string) => {
    if (step.name !== 'new-customer') return
    setStep({ name: 'form', customerName: name, customerNumber: step.phone })
  }

  const handleInvoiceCreated = (invoice: Invoice, copies: number) => {
    setLastInvoice(invoice.invoiceNumber)
    setPrintInvoice({ invoice, copies })
    setStep({ name: 'lookup' })
  }

  const handleReceiptClose = () => setPrintInvoice(null)

  const handleBackToLookup = () => setStep({ name: 'lookup' })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <DocumentPlusIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">New Invoice</h1>
            <p className="text-xs text-gray-500">{user?.fullName ?? user?.username} · {user?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastInvoice && (
            <div className="text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5">
              Last: <span className="font-mono font-semibold">{lastInvoice}</span>
            </div>
          )}
          <button
            onClick={clearSession}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* ── Nav tabs ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-1">
        <button
          onClick={() => navigate('/devices')}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
        >
          <DevicePhoneMobileIcon className="w-4 h-4" />
          Devices
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
        >
          <DocumentPlusIcon className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Step content */}
      {step.name === 'lookup' && (
        <PhoneLookupStep onFound={handleFound} onNotFound={handleNotFound} />
      )}

      {step.name === 'new-customer' && (
        <NewCustomerStep
          phone={step.phone}
          onBack={handleBackToLookup}
          onSubmit={handleNewCustomerSubmit}
        />
      )}

      {step.name === 'form' && (
        <InvoiceFormStep
          customerName={step.customerName}
          customerNumber={step.customerNumber}
          onBack={handleBackToLookup}
          onCreated={handleInvoiceCreated}
        />
      )}

      {/* Receipt overlay — shown immediately after invoice creation, auto-prints */}
      {printInvoice && (
        <Receipt invoice={printInvoice.invoice} copies={printInvoice.copies} onClose={handleReceiptClose} />
      )}
    </div>
  )
}
