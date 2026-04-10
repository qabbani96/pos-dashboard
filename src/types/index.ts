// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest  { username: string; password: string }
export interface LoginResponse {
  token: string
  username: string
  role: Role
  fullName: string | null
  userId: number
  branchId: number | null
}
export type Role = 'ADMIN' | 'CASHIER' | 'ADMIN_BRANCHES' | 'RECEPTION' | 'CALL_CENTER'

// ── Branches ──────────────────────────────────────────────────────────────────
export interface Branch {
  id: number
  branchName: string
  mobile: string | null
  receiptWidthMm: number
  receiptHeightMm: number | null   // null = auto height
  createdAt: string
  updatedAt: string
}

export interface BranchRequest {
  branchName: string
  mobile?: string
  receiptWidthMm?: number
  receiptHeightMm?: number | null
}

// ── Users ─────────────────────────────────────────────────────────────────────
export interface AppUser {
  id: number
  username: string
  fullName: string | null
  role: Role
  active: boolean
  branchId: number | null
  branchName: string | null
  createdAt: string
}

export interface CreateUserRequest {
  username: string
  password: string
  fullName?: string
  role: string
  branchId?: number | null
}

export interface UpdateUserRequest {
  fullName?: string
  password?: string
  role?: string
  active?: boolean
  branchId?: number | null
}

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
  stockQuantity: number | null  // null when not requested
  inStock: boolean | null       // null when not requested; true if quantity > 0
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

// ── Customer ──────────────────────────────────────────────────────────────────
export interface Customer {
  id: number
  customerName: string
  customerNumber: string
}

// ── Invoice ───────────────────────────────────────────────────────────────────
export type DeviceStatus = 'PENDING' | 'CHECKOUT' | 'FIX' | 'NOT_FIX' | 'CANCELLED'

export interface Invoice {
  id: number
  invoiceNumber: string
  customerId: number | null
  customerName: string | null
  customerNumber: string | null
  branchId: number | null
  branchName: string | null
  branchMobile: string | null
  receiptWidthMm: number
  receiptHeightMm: number | null
  deviceType: string | null
  deviceColor: string | null
  deviceQuestion: string | null
  deviceStatus: DeviceStatus | null
  deviceProblem: string | null
  deviceImei: string | null
  deviceNote: string | null
  deviceAccessories: string | null
  devicePrice: number | null
  hiddenPrice: number | null
  feedbackCallcenter: string | null
  entryDate: string | null
  entryTime: string | null
  finishMainDate: string | null
  finishMainTime: string | null
  billDate: string | null
  billTime: string | null
  createdByUsername: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceRequest {
  branchId?: number | null
  customerName?: string
  customerNumber?: string
  deviceType?: string
  deviceColor?: string
  deviceQuestion?: string
  deviceStatus?: string
  deviceProblem?: string
  deviceImei?: string
  deviceNote?: string
  deviceAccessories?: string
  devicePrice?: number | null
  hiddenPrice?: number | null
  feedbackCallcenter?: string
  entryDate?: string | null
  entryTime?: string | null
  finishMainDate?: string | null
  finishMainTime?: string | null
  billDate?: string | null
  billTime?: string | null
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
