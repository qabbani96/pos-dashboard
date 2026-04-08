import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getItems } from '../api/items'
import { generateBarcode, getBarcodeImageUrl, getBarcodePdfUrl } from '../api/barcodes'
import type { Item } from '../types'
import toast from 'react-hot-toast'
import { QrCodeIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

function BarcodePreview({ item }: { item: Item }) {
  const token = localStorage.getItem('token') ?? ''
  return (
    <div className="border rounded-lg p-3 flex flex-col items-center gap-2 bg-white">
      <img
        src={getBarcodeImageUrl(item.id)}
        alt={`barcode-${item.barcode}`}
        className="h-16 object-contain"
        style={{ filter: 'none' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <p className="text-xs font-mono text-gray-500">{item.barcode}</p>
      <a
        href={`${getBarcodePdfUrl(item.id)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (e) => {
          // Fetch PDF with auth header and open as blob URL
          e.preventDefault()
          const res = await fetch(getBarcodePdfUrl(item.id), { headers: { Authorization: `Bearer ${token}` } })
          const blob = await res.blob()
          window.open(URL.createObjectURL(blob), '_blank')
        }}
        className="btn-secondary text-xs py-1 px-2"
      >
        <ArrowDownTrayIcon className="w-3 h-3" /> Print Label
      </a>
    </div>
  )
}

export default function Barcodes() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data: itemsPage, isLoading } = useQuery({
    queryKey: ['items-barcodes', search, page],
    queryFn: () => getItems({ search: search || undefined, page, size: 12, activeOnly: false }),
  })

  const generateMutation = useMutation({
    mutationFn: (itemId: number) => generateBarcode(itemId),
    onSuccess: (item) => {
      toast.success(`Barcode assigned: ${item.barcode}`)
      qc.invalidateQueries({ queryKey: ['items-barcodes'] })
    },
  })

  const items = itemsPage?.content ?? []
  const totalPages = itemsPage?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Barcodes</h1>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search items…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
      </div>

      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="card space-y-3">
              <div>
                <p className="font-semibold text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="badge-blue">{item.barcodeType}</span>
                <span className={item.active ? 'badge-green' : 'badge-red'}>{item.active ? 'Active' : 'Inactive'}</span>
              </div>

              {item.barcode ? (
                <BarcodePreview item={item} />
              ) : (
                <div className="border rounded-lg p-4 text-center">
                  <QrCodeIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-2">No barcode assigned</p>
                  <button className="btn-primary text-xs py-1 px-3"
                    onClick={() => generateMutation.mutate(item.id)}
                    disabled={generateMutation.isPending}>
                    Generate
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-400 py-8">No items found</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</button>
        </div>
      )}
    </div>
  )
}
