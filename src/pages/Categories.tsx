import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCategoriesTree,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/categories'
import type { Category, CategoryRequest } from '../types'
import toast from 'react-hot-toast'
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { CascadingCategoryPicker } from '../components/CascadingCategoryPicker'

// ── Level helpers ─────────────────────────────────────────────────────────────
const LEVEL_STYLES = [
  'bg-indigo-100 text-indigo-700',
  'bg-blue-100   text-blue-700',
  'bg-teal-100   text-teal-700',
  'bg-gray-100   text-gray-500',
]
const LEVEL_LABELS = ['Brand', 'Category', 'Sub-Category', 'Level 3+']
const levelStyle = (l: number) => LEVEL_STYLES[Math.min(l, 3)]
const levelLabel = (l: number) => LEVEL_LABELS[Math.min(l, 3)]

// ── Walk flat list to build breadcrumb ────────────────────────────────────────
function buildBreadcrumb(cat: Category, allFlat: Category[]): string[] {
  const parts: string[] = []
  let cur: Category | undefined = cat
  while (cur) {
    parts.unshift(cur.name)
    if (cur.parentId == null) break
    cur = allFlat.find(c => c.id === cur!.parentId)
  }
  return parts
}

// ── Depth-first search in tree ────────────────────────────────────────────────
function findInTree(nodes: Category[], id: number): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

// ── Category Modal (Create / Edit) ────────────────────────────────────────────
function CategoryModal({
  title,
  initial,
  allCategories,
  editingId,
  onSave,
  onClose,
}: {
  title: string
  initial: CategoryRequest
  allCategories: Category[]
  editingId?: number
  onSave: (d: CategoryRequest) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<CategoryRequest>(initial)
  const eligible = allCategories.filter(c => c.id !== editingId)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

        {/* Parent — cascading Brand → Category → Sub-Category */}
        <div>
          <label className="label">Parent</label>
          <CascadingCategoryPicker
            value={form.parentId ?? null}
            onChange={id => setForm(f => ({ ...f, parentId: id }))}
            categories={eligible}
            rootPlaceholder="— No parent (create a root Brand) —"
          />
        </div>

        {/* Name */}
        <div>
          <label className="label">Name *</label>
          <input
            className="input"
            autoFocus
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && form.name.trim() && onSave(form)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            placeholder="Optional"
            value={form.description ?? ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tree Node ─────────────────────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  selectedId,
  expanded,
  onSelect,
  onToggle,
}: {
  node: Category
  depth: number
  selectedId: number | null
  expanded: Set<number>
  onSelect: (cat: Category) => void
  onToggle: (id: number) => void
}) {
  const hasChildren = node.children.length > 0
  const isExpanded  = expanded.has(node.id)
  const isSelected  = selectedId === node.id

  return (
    <>
      <div
        className={`
          group flex items-center gap-1.5 py-1.5 pr-2 rounded-lg cursor-pointer select-none
          transition-colors duration-100
          ${isSelected
            ? 'bg-blue-50 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Chevron toggle */}
        <button
          className="w-4 h-4 flex-shrink-0 flex items-center justify-center rounded"
          onClick={e => { e.stopPropagation(); if (hasChildren) onToggle(node.id) }}
        >
          {hasChildren
            ? <ChevronRightIcon
                className={`w-3 h-3 text-gray-400 transition-transform duration-150
                  ${isExpanded ? 'rotate-90' : ''}`}
              />
            : <span className="w-3" />
          }
        </button>

        {/* Folder icon */}
        {hasChildren && isExpanded
          ? <FolderOpenIcon className={`w-4 h-4 flex-shrink-0
              ${isSelected ? 'text-blue-500' : 'text-amber-400'}`} />
          : <FolderIcon className={`w-4 h-4 flex-shrink-0
              ${isSelected ? 'text-blue-500'
                : hasChildren ? 'text-amber-400' : 'text-gray-300'}`} />
        }

        {/* Name */}
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

        {/* Level badge — visible only on hover or selection */}
        <span className={`
          text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 transition-opacity
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          ${levelStyle(node.level)}
        `}>
          {levelLabel(node.level)}
        </span>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && node.children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          expanded={expanded}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  category,
  allFlat,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category | null
  allFlat: Category[]
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  onAddChild: (parentId: number) => void
}) {
  // Empty state
  if (!category) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-200 gap-4 p-12">
        <FolderIcon className="w-20 h-20" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-400">No category selected</p>
          <p className="text-xs text-gray-300">Click any node in the tree to see its details</p>
        </div>
      </div>
    )
  }

  const breadcrumb = buildBreadcrumb(category, allFlat)

  return (
    <div className="flex-1 overflow-y-auto p-7 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm flex-wrap">
        {breadcrumb.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300 select-none">›</span>}
            <span className={
              i === breadcrumb.length - 1
                ? 'text-gray-800 font-semibold'
                : 'text-gray-400'
            }>
              {part}
            </span>
          </span>
        ))}
      </nav>

      {/* Name + badge row */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
          <span className={`
            px-2.5 py-1 rounded-full text-xs font-semibold
            ${levelStyle(category.level)}
          `}>
            {levelLabel(category.level)}
          </span>
        </div>
        {category.description
          ? <p className="text-sm text-gray-500">{category.description}</p>
          : <p className="text-sm text-gray-300 italic">No description</p>
        }
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{category.children.length}</p>
          <p className="text-xs text-gray-400 mt-1">Direct children</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{category.level}</p>
          <p className="text-xs text-gray-400 mt-1">Depth level</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-gray-900 truncate" title={category.path}>
            {category.path}
          </p>
          <p className="text-xs text-gray-400 mt-1">Path</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary"
          onClick={() => onAddChild(category.id)}
        >
          <PlusIcon className="w-4 h-4" /> Add child
        </button>
        <button
          className="btn-secondary"
          onClick={() => onEdit(category)}
        >
          <PencilIcon className="w-4 h-4" /> Edit
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
            border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => onDelete(category)}
        >
          <TrashIcon className="w-4 h-4" /> Delete
        </button>
      </div>

      {/* Children list */}
      {category.children.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Direct children ({category.children.length})
          </p>
          <div className="space-y-1.5">
            {category.children.map(child => (
              <div
                key={child.id}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50
                  hover:bg-gray-100 rounded-xl text-sm transition-colors"
              >
                <FolderIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="flex-1 font-medium text-gray-700 truncate">{child.name}</span>
                {child.description && (
                  <span className="text-xs text-gray-400 truncate max-w-[140px] hidden sm:block">
                    {child.description}
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0
                  ${levelStyle(child.level)}`}>
                  {levelLabel(child.level)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Categories() {
  const qc = useQueryClient()

  // Selection + tree expand state
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [expanded,   setExpanded  ] = useState<Set<number>>(new Set())

  // Modal state
  const [editing,  setEditing ] = useState<Category | null>(null)
  const [creating, setCreating] = useState<{ parentId: number | null } | null>(null)

  // Data
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn:  getCategoriesTree,
  })
  const { data: allFlat = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  })

  // Resolve selected category from tree (has children populated)
  const selectedCategory = selectedId != null ? findInTree(tree, selectedId) : null

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { toast.success('Category created'); invalidate(); setCreating(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryRequest }) => updateCategory(id, data),
    onSuccess: () => { toast.success('Category updated'); invalidate(); setEditing(null) },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { toast.success('Category deleted'); invalidate(); setSelectedId(null) },
    onError:   (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Cannot delete — has children or assigned items'),
  })

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelect(cat: Category) {
    setSelectedId(cat.id)
    // Auto-expand on click if it has children
    if (cat.children.length > 0) {
      setExpanded(prev => new Set(prev).add(cat.id))
    }
  }

  function handleDelete(cat: Category) {
    if (confirm(`Delete "${cat.name}"?\nThis fails if it has sub-categories or assigned items.`)) {
      deleteMutation.mutate(cat.id)
    }
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Brand → Category → Sub-Category — any depth supported
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setCreating({ parentId: null })}
        >
          <PlusIcon className="w-4 h-4" /> New Brand
        </button>
      </div>

      {/* Split explorer card */}
      <div
        className="card p-0 flex overflow-hidden"
        style={{ minHeight: '540px' }}
      >

        {/* ── Left: tree panel ────────────────────────────────────────── */}
        <div className="w-64 border-r border-gray-100 flex flex-col flex-shrink-0">

          {/* Panel header */}
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Explorer
            </span>
            <span className="text-xs text-gray-300">{allFlat.length} nodes</span>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <p className="text-xs text-gray-400 px-3 py-4">Loading…</p>
            ) : tree.length === 0 ? (
              <div className="px-3 py-8 text-center space-y-2">
                <FolderIcon className="w-8 h-8 text-gray-200 mx-auto" />
                <p className="text-xs text-gray-400">
                  No categories yet.<br />
                  Create a Brand to start.
                </p>
              </div>
            ) : (
              tree.map(root => (
                <TreeNode
                  key={root.id}
                  node={root}
                  depth={0}
                  selectedId={selectedId}
                  expanded={expanded}
                  onSelect={handleSelect}
                  onToggle={toggleExpand}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: detail panel ─────────────────────────────────────── */}
        <DetailPanel
          category={selectedCategory}
          allFlat={allFlat}
          onEdit={setEditing}
          onDelete={handleDelete}
          onAddChild={(parentId) => setCreating({ parentId })}
        />
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {creating !== null && (
        <CategoryModal
          title={creating.parentId != null ? 'New Sub-Category' : 'New Brand'}
          initial={{ name: '', description: '', parentId: creating.parentId }}
          allCategories={allFlat}
          onSave={d => createMutation.mutate(d)}
          onClose={() => setCreating(null)}
        />
      )}
      {editing && (
        <CategoryModal
          title="Edit Category"
          initial={{
            name:        editing.name,
            description: editing.description ?? '',
            parentId:    editing.parentId,
          }}
          allCategories={allFlat}
          editingId={editing.id}
          onSave={d => updateMutation.mutate({ id: editing.id, data: d })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
