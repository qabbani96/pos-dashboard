import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getItems, createItem, updateItem, deactivateItem, activateItem } from '../api/items'
import { getCategories } from '../api/categories'
import type { Item, ItemRequest, BarcodeType, Category } from '../types'
import toast from 'react-hot-toast'
import { PencilIcon, PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CascadingCategoryPicker } from '../components/CascadingCategoryPicker'
import { exportToExcel } from '../utils/exportExcel'

const BARCODE_TYPES: BarcodeType[] = ['CODE128', 'EAN13', 'QR']

// ── Category flat label helper ────────────────────────────────────────────────
function categoryLabel(c: Category) {
  const indent = '\u00A0\u00A0'.repeat(c.level)
  const prefix = c.level > 0 ? '↳ ' : ''
  return `${indent}${prefix}${c.name}`
}

// ── Item Modal (Create / Edit) ────────────────────────────────────────────────
function ItemModal({
  item,
  categories,
  onSave,
  onClose,
}: {
  item?: Item
  categories: Category[]
  onSave: (data: ItemRequest) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ItemRequest>({
    sku:         item?.sku          ?? '',
    name:        item?.name         ?? '',
    description: item?.description  ?? '',
    categoryId:  item?.categoryId   ?? undefined,
    price:       item?.price        ?? 0,
    costPrice:   item?.costPrice    ?? undefined,
    barcode:     item?.barcode      ?? '',
    barcodeType: item?.barcodeType  ?? 'CODE128',
    imageUrl:    item?.imageUrl     ?? '',
  })

  const set =
    (k: keyof ItemRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{item ? 'Edit Item' : 'New Item'}</h2>

        {/* Category — full-width cascading picker */}
        <div>
          <label className="label">Category</label>
          <CascadingCategoryPicker
            value={form.categoryId ?? null}
            onChange={id => setForm(f => ({ ...f, categoryId: id ?? undefined }))}
            categories={categories}
            rootPlaceholder="— No Category —"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* SKU */}
          <div>
            <label className="label">SKU *</label>
            <input className="input" value={form.sku} onChange={set('sku')} />
          </div>

          {/* Barcode Type */}
          <div>
            <label className="label">Barcode Type</label>
            <select className="input" value={form.barcodeType} onChange={set('barcodeType')}>
              {BARCODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Name */}
          <div className="col-span-2">
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={set('name')} />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description ?? ''} onChange={set('description')} />
          </div>

          {/* Price */}
          <div>
            <label className="label">Price (JD) *</label>
            <input
              className="input" type="number" min="0" step="0.01"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="label">Cost Price (JD)</label>
            <input
              className="input" type="number" min="0" step="0.01"
              value={form.costPrice ?? ''}
              onChange={e =>
                setForm(f => ({ ...f, costPrice: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </div>

          {/* Barcode Value */}
          <div className="col-span-2">
            <label className="label">Barcode Value</label>
            <input
              className="input"
              value={form.barcode ?? ''}
              onChange={set('barcode')}
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => onSave(form)}
            disabled={!form.sku.trim() || !form.name.trim() || !form.price}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Items() {
  const qc = useQueryClient()

  // Filter state
  // activeFilter: '' = all, 'active' = active only, 'inactive' = inactive only (all + client badge)
  const [search,       setSearch      ] = useState('')
  const [categoryId,   setCategoryId  ] = useState<number | undefined>(undefined)
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('')
  const [page,         setPage        ] = useState(0)


  // Modal state
  const [editing,   setEditing  ] = useState<Item | null>(null)
  const [creating,  setCreating ] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Build query params (inactive filter fetches all then filters locally)
  const queryParams = {
    search:     search     || undefined,
    categoryId: categoryId,
    activeOnly: activeFilter === 'active' ? true : false, // false = all
    page,
    size: 15,
  }

  const { data: itemsPage, isLoading } = useQuery({
    queryKey: ['items', search, categoryId, activeFilter, page],
    queryFn:  () => getItems(queryParams),
  })

  // Flat category list for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['items'] })

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => { toast.success('Item created'); invalidate(); setCreating(false) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ItemRequest }) => updateItem(id, data),
    onSuccess: () => { toast.success('Item updated'); invalidate(); setEditing(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update'),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? deactivateItem(id) : activateItem(id),
    onSuccess: () => { toast.success('Status updated'); invalidate() },
  })

  // Client-side inactive filter (backend doesn't support "inactive only" param)
  const rawItems   = itemsPage?.content ?? []
  const items      = activeFilter === 'inactive' ? rawItems.filter(i => !i.active) : rawItems
  const totalPages = itemsPage?.totalPages ?? 1
  const hasFilter  = !!(search || categoryId || activeFilter)

  function clearFilters() {
    setSearch(''); setCategoryId(undefined); setActiveFilter(''); setPage(0)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const all = await getItems({
        search:     search     || undefined,
        categoryId: categoryId,
        activeOnly: activeFilter === 'active' ? true : false,
        page: 0, size: 9999,
      })
      const rows = (all?.content ?? []).map(item => ({
        SKU:           item.sku,
        Name:          item.name,
        Category:      item.categoryPath ?? item.categoryName ?? '',
        'Price (JD)': Number(item.price).toFixed(2),
        'Cost (JD)':  item.costPrice != null ? Number(item.costPrice).toFixed(2) : '',
        'Barcode':     item.barcode ?? '',
        'Barcode Type': item.barcodeType,
        Status:        item.active ? 'Active' : 'Inactive',
        Description:   item.description ?? '',
      }))
      exportToExcel(rows, `items-inventory-${new Date().toLocaleDateString('en-CA')}`, 'Items')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-green-600 hover:bg-green-700
              text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            onClick={handleExport}
            disabled={exporting}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <PlusIcon className="w-4 h-4" /> New Item
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-56"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>

        {/* Category filter */}
        <select
          className="input w-auto"
          value={categoryId ?? ''}
          onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(0) }}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{categoryLabel(c)}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="input w-auto"
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value as typeof activeFilter); setPage(0) }}
        >
          <option value="">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>

        {hasFilter && (
          <button
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            onClick={clearFilters}
          >
            <XMarkIcon className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['SKU', 'Name', 'Category', 'Price', 'Barcode', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>

                  {/* Category — full path if available */}
                  <td className="px-4 py-3 text-gray-500 max-w-[180px]">
                    {item.categoryPath ? (
                      <span title={item.categoryPath} className="block truncate text-xs leading-snug">
                        {item.categoryPath}
                      </span>
                    ) : item.categoryName ? (
                      <span className="text-xs">{item.categoryName}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">JD {Number(item.price).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.barcode ?? '—'}</td>

                  <td className="px-4 py-3">
                    <span className={item.active ? 'badge-green' : 'badge-red'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      onClick={() => setEditing(item)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        item.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                      }`}
                      onClick={() => toggleMutation.mutate({ id: item.id, active: item.active })}
                    >
                      {item.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

      {/* Modals */}
      {creating && (
        <ItemModal
          categories={categories}
          onSave={d => createMutation.mutate(d)}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <ItemModal
          item={editing}
          categories={categories}
          onSave={d => updateMutation.mutate({ id: editing.id, data: d })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
