// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest  { username: string; password: string }
export interface LoginResponse { token: string; username: string; role: Role }
export type Role = 'ADMIN' | 'CASHIER'

// ── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  description: string | null
  parentId: number | null
  parentName: string | null
  level: number        // 0 = root (Brand), 1 = Category, 2 = Sub-Category, …
  path: string         // e.g. "/1/5/12/"
  children: Category[] // populated only by tree endpoint
}

export interface CategoryRequest {
  name: string
  description?: string
  parentId?: number | null
}

// ── Item ─────────────────────────────────────────────────────────────────────
export type BarcodeType = 'CODE128' | 'EAN13' | 'QR'

export interface Item {
  id: number; sku: string; name: string; description: string | null
  categoryId: number | null; categoryName: string | null
  categoryPath: string | null   // e.g. "Apple › Screens › iPhone 15 Pro"
  price: number; costPrice: number | null; barcode: string | null
  barcodeType: BarcodeType; imageUrl: string | null; active: boolean
  createdAt: string; updatedAt: string
}

export interface ItemRequest {
  sku: string; name: string; description?: string; categoryId?: number
  price: number; costPrice?: number; barcode?: string
  barcodeType?: BarcodeType; imageUrl?: string
}

// ── Stock ─────────────────────────────────────────────────────────────────────
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface StockRecord {
  stockId: number; itemId: number; itemSku: string; itemName: string
  quantity: number; minQuantity: number; low: boolean; updatedAt: string
}

export interface StockAdjustRequest {
  type: MovementType; quantity: number; reference?: string; note?: string
}

export interface StockMovement {
  id: number; itemId: number; itemName: string; type: MovementType
  quantity: number; reference: string | null; note: string | null
  createdBy: string | null; createdAt: string
}

export interface StockSummary { totalItems: number; lowStockCount: number }

// ── Sale ─────────────────────────────────────────────────────────────────────
export interface SaleItem {
  itemId: number; itemName: string; quantity: number
  unitPrice: number; subtotal: number
}
export interface Sale {
  id: number; cashierUsername: string; totalAmount: number
  status: 'COMPLETED' | 'REFUNDED'; note: string | null
  items: SaleItem[]; createdAt: string
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  salesToday: number; revenueToday: number
  totalItems: number; lowStockCount: number
}
export interface DailySalesReport  { date: string; salesCount: number; totalRevenue: number }
export interface TopItemReport     { itemId: number; itemName: string; totalQuantitySold: number; totalRevenue: number }
export interface CashierReport     { cashierId: number; cashierUsername: string; totalSales: number; totalRevenue: number }

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[]; totalElements: number; totalPages: number
  number: number; size: number
}

// ── API wrapper ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> { success: boolean; message: string; data: T }
