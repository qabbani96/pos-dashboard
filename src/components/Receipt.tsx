/**
 * Receipt.tsx
 *
 * Thermal receipt — simplified layout:
 *   Branch name  |  Branch mobile
 *   ──────────────────────────────
 *   Customer name (centre)
 *   Customer phone (centre)
 *   ──────────────────────────────
 *   Invoice number (centre, bold)
 *   ──────────────────────────────
 *   Date
 *
 * Renders `copies` identical slips separated by a page-break,
 * so the printer cuts one ticket per copy.
 *
 * Auto-triggers window.print() once on mount.
 */

import { useEffect, useRef } from 'react'
import type { Invoice } from '../types'

interface ReceiptProps {
  invoice: Invoice
  copies:  number
  onClose: () => void
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toLocaleDateString('en-GB')
  const d = new Date(raw)
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-GB')
}

function branchLabel(name: string | null | undefined): string {
  if (!name) return ''
  return name.toUpperCase().slice(0, 10).trim()
}

// ── Single slip ───────────────────────────────────────────────────────────────

function Slip({ invoice, isLast }: { invoice: Invoice; isLast: boolean }) {
  const widthMm  = invoice.receiptWidthMm  ?? 58
  const heightMm = invoice.receiptHeightMm ?? null
  const fontSize = widthMm >= 80 ? '12px' : '11px'

  return (
    <div
      style={{
        width:       `${widthMm}mm`,
        height:      heightMm != null ? `${heightMm}mm` : 'auto',
        overflow:    'hidden',
        fontFamily:  '"Courier New", Courier, monospace',
        fontSize,
        color:       '#000',
        background:  '#fff',
        padding:     '4mm 3mm',
        boxSizing:   'border-box',
        lineHeight:  '1.6',
        pageBreakAfter: isLast ? 'avoid' : 'always',
        breakAfter:     isLast ? 'avoid' : 'page',
      }}
    >
      {/* Row 1: branch label + mobile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>{branchLabel(invoice.branchName)}</span>
        <span>{invoice.branchMobile ?? ''}</span>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

      {/* Customer name */}
      {invoice.customerName && (
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
          {invoice.customerName}
        </div>
      )}

      {/* Customer phone */}
      {invoice.customerNumber && (
        <div style={{ textAlign: 'center' }}>
          {invoice.customerNumber}
        </div>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

      {/* Invoice number */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', letterSpacing: '2px' }}>
        {invoice.invoiceNumber}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

      {/* Date */}
      <div style={{ textAlign: 'center', fontSize: '10px' }}>
        {formatDate(invoice.entryDate)}
      </div>
    </div>
  )
}

// ── Receipt overlay ───────────────────────────────────────────────────────────

export default function Receipt({ invoice, copies, onClose }: ReceiptProps) {
  const printed    = useRef(false)
  const widthMm    = invoice.receiptWidthMm  ?? 58
  const heightMm   = invoice.receiptHeightMm ?? null   // null = auto
  const safeCopies = Math.max(1, Math.min(copies, 10))

  useEffect(() => {
    if (printed.current) return
    printed.current = true
    const t = setTimeout(() => window.print(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#receipt-root) { display: none !important; }
          #receipt-root               { display: block !important; }
          .no-print                   { display: none !important; }

          @page {
            size: ${widthMm}mm ${heightMm != null ? heightMm + 'mm' : 'auto'};
            margin: 0;
          }
        }

        @media screen {
          #receipt-root {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 20px 16px 32px;
            overflow-y: auto;
            gap: 0;
          }
        }
      `}</style>

      <div id="receipt-root">
        {/* Slips */}
        {Array.from({ length: safeCopies }, (_, i) => (
          <Slip key={i} invoice={invoice} isLast={i === safeCopies - 1} />
        ))}

        {/* Screen controls — hidden on print */}
        <div
          className="no-print"
          style={{
            marginTop:  16,
            display:    'flex',
            gap:        8,
            width:      `${widthMm}mm`,
            minWidth:   140,
          }}
        >
          <button
            onClick={() => window.print()}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 600,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            🖨 Print again
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
