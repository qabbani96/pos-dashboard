/**
 * CascadingCategoryPicker
 *
 * A three-level cascading selector for the category hierarchy:
 *   Brand (level 0) → Category (level 1) → Sub-Category (level 2)
 *
 * Each level only shows items that belong to it, so the list stays
 * short and scannable regardless of total category count.
 *
 * Usage:
 *   <CascadingCategoryPicker
 *     value={categoryId}          // number | null
 *     onChange={id => ...}
 *     categories={allFlatCats}    // full flat list from GET /categories
 *   />
 */

import { useState } from 'react'
import type { Category } from '../types'
import {
  FolderIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// ── Level metadata ────────────────────────────────────────────────────────────
const LEVEL_BADGE: Record<number, string> = {
  0: 'bg-indigo-100 text-indigo-700',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-teal-100 text-teal-700',
}
const LEVEL_NAMES = ['Brand', 'Category', 'Sub-Category']

// ── Helper: initial cascade from a flat parentId/categoryId ──────────────────
export function resolveInitialCascade(id: number | null, all: Category[]) {
  const empty = { brandId: null as number | null, catId: null as number | null, subId: null as number | null }
  if (id == null) return empty

  const node = all.find(c => c.id === id)
  if (!node) return empty

  if (node.level === 0) return { brandId: node.id,        catId: null,           subId: null }
  if (node.level === 1) return { brandId: node.parentId,  catId: node.id,        subId: null }
  // level 2+
  const parent = all.find(c => c.id === node.parentId)
  return { brandId: parent?.parentId ?? null, catId: node.parentId, subId: node.id }
}

// ── Single-level searchable select ───────────────────────────────────────────
function LevelSelect({
  label,
  level,
  placeholder,
  options,
  value,
  onChange,
  onClear,
}: {
  label: string
  level: number
  placeholder: string
  options: Category[]
  value: number | null
  onChange: (id: number | null) => void
  onClear?: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = q.trim()
    ? options.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
    : options

  const badge = LEVEL_BADGE[Math.min(level, 2)]

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-700">{label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge}`}>
            Level {level}
          </span>
        </div>
        {value != null && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <XMarkIcon className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Filter input — only when > 6 options */}
      {options.length > 6 && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg
              border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder={`Filter ${options.length} ${label.toLowerCase()}s…`}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      )}

      {/* Dropdown */}
      <select
        className={`input transition-colors ${value != null ? 'border-blue-300 bg-blue-50/40' : ''}`}
        value={value ?? ''}
        onChange={e => {
          setQ('')
          onChange(e.target.value ? Number(e.target.value) : null)
        }}
      >
        <option value="">{placeholder}</option>
        {filtered.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {options.length > 6 && filtered.length === 0 && q && (
        <p className="text-xs text-gray-400 px-1">No {label.toLowerCase()}s match "{q}"</p>
      )}
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export function CascadingCategoryPicker({
  value,
  onChange,
  categories,
  rootPlaceholder = '— No parent (create a root Brand) —',
}: {
  value: number | null
  onChange: (id: number | null) => void
  categories: Category[]
  /** Placeholder text for the Brand selector when nothing is selected */
  rootPlaceholder?: string
}) {
  const init = resolveInitialCascade(value, categories)

  const [brandId, setBrandId] = useState<number | null>(init.brandId)
  const [catId,   setCatId  ] = useState<number | null>(init.catId)
  const [subId,   setSubId  ] = useState<number | null>(init.subId)

  // Derived option lists per level
  const brands = categories.filter(c => c.level === 0)
  const cats   = brandId != null ? categories.filter(c => c.parentId === brandId) : []
  const subs   = catId   != null ? categories.filter(c => c.parentId === catId)   : []

  // Names for the preview row
  const brandName = brands.find(b => b.id === brandId)?.name
  const catName   = cats.find(c => c.id === catId)?.name
  const subName   = subs.find(s => s.id === subId)?.name

  // Preview message
  const previewLabel = subId != null
    ? `"${subName}" · ${LEVEL_NAMES[2]} (Level 2)`
    : catId != null
    ? `"${catName}" · ${LEVEL_NAMES[1]} (Level 1)`
    : brandId != null
    ? `"${brandName}" · ${LEVEL_NAMES[0]} (Level 0)`
    : 'None selected'

  const hasSelection = brandId != null || catId != null || subId != null

  // Propagate changes upward
  function emit(bId: number | null, cId: number | null, sId: number | null) {
    onChange(sId ?? cId ?? bId ?? null)
  }

  function handleBrandChange(id: number | null) {
    setBrandId(id); setCatId(null); setSubId(null)
    emit(id, null, null)
  }
  function handleCatChange(id: number | null) {
    setCatId(id); setSubId(null)
    emit(brandId, id, null)
  }
  function handleSubChange(id: number | null) {
    setSubId(id)
    emit(brandId, catId, id)
  }

  return (
    <div className="space-y-3">

      {/* Level 0 — Brand */}
      <LevelSelect
        label={LEVEL_NAMES[0]}
        level={0}
        placeholder={rootPlaceholder}
        options={brands}
        value={brandId}
        onChange={handleBrandChange}
        onClear={() => handleBrandChange(null)}
      />

      {/* Level 1 — Category (after Brand chosen) */}
      {brandId != null && (
        <div className="flex items-start gap-2 pl-1">
          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 mt-2.5 flex-shrink-0" />
          <div className="flex-1">
            {cats.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1 pl-1">
                No categories under this brand yet.
              </p>
            ) : (
              <LevelSelect
                label={LEVEL_NAMES[1]}
                level={1}
                placeholder="— Place directly under this Brand —"
                options={cats}
                value={catId}
                onChange={handleCatChange}
                onClear={() => handleCatChange(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Level 2 — Sub-Category (after Category chosen) */}
      {catId != null && (
        <div className="flex items-start gap-2 pl-6">
          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 mt-2.5 flex-shrink-0" />
          <div className="flex-1">
            {subs.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1 pl-1">
                No sub-categories under this category yet.
              </p>
            ) : (
              <LevelSelect
                label={LEVEL_NAMES[2]}
                level={2}
                placeholder="— Place directly under this Category —"
                options={subs}
                value={subId}
                onChange={handleSubChange}
                onClear={() => handleSubChange(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Preview badge */}
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium
        ${hasSelection
          ? 'bg-blue-50 text-blue-700 border-blue-100'
          : 'bg-gray-50 text-gray-400 border-gray-100'
        }
      `}>
        <FolderIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
        {hasSelection ? previewLabel : 'No category selected'}
      </div>

    </div>
  )
}
