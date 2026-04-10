import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { getRootCategories, getCategoryChildren } from '../api/categories'
import { getItems } from '../api/items'
import { useAuth } from '../context/AuthContext'
import type { Category, Item } from '../types'
import {
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

// ── Part card ─────────────────────────────────────────────────────────────────

function PartCard({ item }: { item: Item }) {
  const qty       = item.stockQuantity   // number | null
  const inStock   = qty != null && qty > 0
  const hasStock  = qty != null           // false only if backend didn't send the field

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-all">

      {/* Name + category path */}
      <div>
        <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
        {item.categoryPath && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{item.categoryPath}</p>
        )}
      </div>

      {/* Stock label — based purely on quantity */}
      <div className={`w-full rounded-lg py-2 text-center text-sm font-bold ${
        !hasStock
          ? 'bg-gray-100 text-gray-400'
          : inStock
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-600'
      }`}>
        {!hasStock ? '—' : inStock ? `In Stock (${qty})` : 'Out of Stock'}
      </div>

      {/* Price + SKU */}
      <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">SKU: {item.sku}</span>
        <span className="text-lg font-bold text-gray-900">
          {Number(item.price).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// ── Category breadcrumb pill ──────────────────────────────────────────────────

function BreadcrumbPill({
  categories,
  selectedId,
  onSelect,
  placeholder,
}: {
  categories: Category[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  placeholder: string
}) {
  return (
    <select
      className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[140px]"
      value={selectedId ?? ''}
      onChange={e => onSelect(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {categories.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeviceParts() {
  const { user, clearSession } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [brandId,    setBrandId]    = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [subCatId,   setSubCatId]   = useState<number | null>(null)
  const [search,     setSearch]     = useState('')
  const [inputValue, setInputValue] = useState('')

  // Brands (root categories, level 0)
  const { data: brands = [] } = useQuery<Category[]>({
    queryKey: ['roots'],
    queryFn:  getRootCategories,
  })

  // Categories (children of selected brand)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['children', brandId],
    queryFn:  () => getCategoryChildren(brandId!),
    enabled:  brandId !== null,
  })

  // Sub-categories (children of selected category)
  const { data: subCategories = [] } = useQuery<Category[]>({
    queryKey: ['children', categoryId],
    queryFn:  () => getCategoryChildren(categoryId!),
    enabled:  categoryId !== null,
  })

  // Determine the effective category to filter items by
  // Use the deepest selected level
  const effectiveCategoryId = subCatId ?? categoryId ?? brandId

  const { data: itemsPage, isLoading: itemsLoading } = useQuery({
    queryKey: ['parts-items', effectiveCategoryId, search],
    queryFn:  () => getItems({
      categoryId: effectiveCategoryId ?? undefined,
      search:     search || undefined,
      activeOnly: true,
      size:       100,
    }),
    enabled: effectiveCategoryId !== null || search.trim().length > 0,
  })

  const items = itemsPage?.content ?? []

  const handleBrandChange = (id: number | null) => {
    setBrandId(id)
    setCategoryId(null)
    setSubCatId(null)
  }
  const handleCategoryChange = (id: number | null) => {
    setCategoryId(id)
    setSubCatId(null)
  }
  const handleSubCatChange = (id: number | null) => {
    setSubCatId(id)
  }

  const applySearch = (val: string) => setSearch(val.trim())
  const clearAll = () => {
    setBrandId(null); setCategoryId(null); setSubCatId(null)
    setSearch(''); setInputValue('')
  }

  const hasFilter = brandId !== null || search.trim().length > 0
  const showItems = effectiveCategoryId !== null || search.trim().length > 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
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

      {/* ── Nav tabs ───────────────────────────────────────────────── */}
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

      {/* ── Sticky filter bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto">

          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Device Parts</h2>
            </div>
            {hasFilter && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
              >
                <XMarkIcon className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>

          {/* Cascading selectors row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Brand */}
            <BreadcrumbPill
              categories={brands}
              selectedId={brandId}
              onSelect={handleBrandChange}
              placeholder="Select Brand"
            />

            {/* Category — shown once brand is chosen */}
            {brandId !== null && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
                {categories.length > 0 ? (
                  <BreadcrumbPill
                    categories={categories}
                    selectedId={categoryId}
                    onSelect={handleCategoryChange}
                    placeholder="All Categories"
                  />
                ) : (
                  <span className="text-xs text-gray-400 italic">No sub-categories</span>
                )}
              </>
            )}

            {/* Sub-category — shown once category is chosen and has children */}
            {categoryId !== null && subCategories.length > 0 && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
                <BreadcrumbPill
                  categories={subCategories}
                  selectedId={subCatId}
                  onSelect={handleSubCatChange}
                  placeholder="All Sub-categories"
                />
              </>
            )}
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              placeholder="Search parts by name or SKU…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applySearch(inputValue) }}
              onBlur={() => applySearch(inputValue)}
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
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* Idle state */}
        {!showItems && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-blue-50 rounded-2xl p-5 mb-4">
              <WrenchScrewdriverIcon className="w-10 h-10 text-blue-300" />
            </div>
            <p className="font-semibold text-gray-600 text-lg">Select a brand to start</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Choose a brand from the dropdown above to browse available parts and prices
            </p>
          </div>
        )}

        {/* Loading */}
        {showItems && itemsLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Results */}
        {showItems && !itemsLoading && (
          <>
            {/* Result meta */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>{items.length} part{items.length !== 1 ? 's' : ''} found</span>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {items.filter(i => i.inStock).length} in stock
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  {items.filter(i => i.inStock === false).length} out of stock
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <WrenchScrewdriverIcon className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-500">No parts found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different category or search term
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(item => (
                  <PartCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
