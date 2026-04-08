# CLAUDE.md — pos-dashboard

This file provides guidance when working with the React admin dashboard of the POS system.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev         # → http://localhost:5173

# Type check (no emit)
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Tech Stack

- **React 18** + **TypeScript** (Vite build tool)
- **Tailwind CSS** — utility classes only, no component library
- **TanStack Query v5** — all server state (`useQuery`, `useMutation`)
- **Axios** — HTTP client with JWT interceptor (`src/api/client.ts`)
- **React Router v6** — client-side routing
- **Recharts** — dashboard and report charts
- **react-hot-toast** — success/error toasts
- **@heroicons/react** — icon set

**Currency:** Jordanian Dinar — always display as `JD` prefix (e.g. `JD 18.50`).

---

## Project Structure

```
src/
├── api/              # One file per backend resource
│   ├── client.ts     # Axios instance + JWT Bearer interceptor
│   ├── auth.ts
│   ├── categories.ts # includes getCategoriesTree(), getRootCategories(), getCategoryChildren()
│   ├── items.ts
│   ├── stock.ts
│   ├── barcodes.ts
│   ├── sales.ts
│   └── reports.ts
├── components/
│   └── CascadingCategoryPicker.tsx   # Shared Brand→Category→Sub-Category picker
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx   # KPI cards + configurable date-range chart + export
│   ├── Items.tsx       # Filters (category, status, search) + cascading picker modal + export
│   ├── Categories.tsx  # Split-explorer layout (tree panel + detail panel)
│   ├── Stock.tsx       # Search filter + low-stock toggle + export
│   ├── Barcodes.tsx
│   ├── Sales.tsx       # Date + status filters + export
│   └── Reports.tsx     # 4 export tiles + charts with per-chart export buttons
├── types/
│   └── index.ts        # All shared TypeScript interfaces
└── utils/
    └── exportExcel.ts  # Zero-dependency SpreadsheetML XML export engine
```

---

## Key Patterns

### Server state
Always use TanStack Query. Never use `useState` + `useEffect` for data fetching.

```ts
const { data, isLoading } = useQuery({
  queryKey: ['items', search, categoryId, page],
  queryFn:  () => getItems({ search, categoryId, page }),
})
```

Invalidate after mutations with prefix matching:
```ts
qc.invalidateQueries({ queryKey: ['categories'] })
// ↑ invalidates both ['categories'] and ['categories', 'tree']
```

### API response shape
All backend responses are wrapped:
```ts
interface ApiResponse<T> { success: boolean; message: string; data: T }
```
Every `api/*.ts` function unwraps `.data.data` before returning.

### Export to Excel
Use the shared utility — no external library needed:
```ts
import { exportToExcel } from '../utils/exportExcel'

exportToExcel(
  rows,           // Record<string, unknown>[]  — keys become column headers
  'filename',     // downloaded as filename.xls
  'Sheet Name',   // optional worksheet tab name
)
```
Numeric values are written as ESC/POS Number cells so Excel can sum/sort them. The header row is bold with a light-blue background. Opens natively in Excel, LibreOffice, and Google Sheets.

---

## Category Hierarchy

The backend exposes a 3-level hierarchy: **Brand (level 0) → Category (level 1) → Sub-Category (level 2)**.

### Types
```ts
interface Category {
  id: number; name: string; description: string | null
  parentId: number | null; parentName: string | null
  level: number; path: string; children: Category[]
}
```

### Shared picker component
`CascadingCategoryPicker` (`src/components/CascadingCategoryPicker.tsx`) is used in both the **Categories modal** (parent selection) and the **Items modal** (category assignment):

```tsx
<CascadingCategoryPicker
  value={form.categoryId ?? null}          // number | null
  onChange={id => setForm(f => ({ ...f, categoryId: id ?? undefined }))}
  categories={categories}                   // flat list from getCategories()
  rootPlaceholder="— No Category —"
/>
```

- Exports `resolveInitialCascade(id, allCategories)` — reconstructs Brand/Category/Sub state from a flat `parentId` (used when opening the edit modal with an existing value)
- Filter input appears automatically when a level has more than 6 options

### Categories page layout
Split-explorer: left **tree panel** (collapsible `TreeNode` components) + right **detail panel** (`DetailPanel` with breadcrumb, stats cards, action buttons, children list). Create/Edit opens a **centered modal**.

---

## Pages Quick Reference

| Page | Filters | Export |
|------|---------|--------|
| Dashboard | Date range (7d/30d/90d presets + custom) | Daily Summary |
| Items | Search, Category (dropdown), Status (All/Active/Inactive) | Full catalogue |
| Categories | Tree navigation (no table filter) | — |
| Stock | Search by name/SKU (client-side), Low stock toggle | Stock snapshot |
| Sales | Date range, Status (All/Completed/Refunded) | All matching sales |
| Reports | Date range | Sales, Items & Inventory, Stock Snapshot, Daily Summary, Top Items, Cashier Performance |

---

## Custom CSS Classes

Defined in `src/index.css` via Tailwind `@layer components`:

| Class | Usage |
|-------|-------|
| `.card` | White rounded card with shadow |
| `.btn-primary` | Filled blue action button |
| `.btn-secondary` | Outlined grey button |
| `.input` | Styled text / select input |
| `.label` | Form field label |
| `.badge-green` | Green status pill |
| `.badge-red` | Red status pill |
| `.badge-yellow` | Yellow status pill |

---

## Known Gotchas

- **TanStack Query v5 invalidation:** `invalidateQueries({ queryKey: ['categories'] })` is a **prefix match** — it invalidates all keys that start with `['categories']`, including `['categories', 'tree']`. No need to invalidate each query key separately.
- **`activeOnly` param:** The backend `GET /items` accepts `activeOnly=true` (only active) or `activeOnly=false` (all items including inactive). There is no "inactive only" backend param — the Items page filters inactive items client-side on the loaded page.
- **Excel export:** The `xlsx` and `exceljs` npm packages are blocked by network policy. Use `src/utils/exportExcel.ts` instead — it generates SpreadsheetML XML (`.xls` extension, Excel opens it natively).
- **Category picker in filters:** Use a simple flat `<select>` with `categoryLabel(c)` indentation helper for filter dropdowns. Reserve `CascadingCategoryPicker` for form fields (create/edit modals).
