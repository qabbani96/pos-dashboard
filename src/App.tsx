import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute         from './components/PrivateRoute'
import AdminRoute           from './components/AdminRoute'
import AdminBranchesRoute  from './components/AdminBranchesRoute'
import ReceptionRoute      from './components/ReceptionRoute'
import Layout              from './components/Layout'
import Login               from './pages/Login'
import Dashboard           from './pages/Dashboard'
import Items               from './pages/Items'
import Categories          from './pages/Categories'
import Stock               from './pages/Stock'
import Barcodes            from './pages/Barcodes'
import Sales               from './pages/Sales'
import Reports             from './pages/Reports'
import Users               from './pages/Users'
import Branches            from './pages/Branches'
import Customers           from './pages/Customers'
import Money               from './pages/Money'
import CreateInvoice       from './pages/CreateInvoice'
import BranchDevices       from './pages/BranchDevices'
import CallCenterDashboard from './pages/CallCenterDashboard'
import DeviceParts         from './pages/DeviceParts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* All authenticated routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>

            {/* ── ADMIN: POS operations only ──────────────────────────────── */}
            <Route element={<AdminRoute />}>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/items"      element={<Items />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/stock"      element={<Stock />} />
              <Route path="/barcodes"   element={<Barcodes />} />
              <Route path="/sales"      element={<Sales />} />
              <Route path="/reports"    element={<Reports />} />
            </Route>

            {/* ── ADMIN_BRANCHES: branch + user management ────────────────── */}
            <Route element={<AdminBranchesRoute />}>
              <Route path="/branches"  element={<Branches />} />
              <Route path="/users"     element={<Users />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/money"     element={<Money />} />
            </Route>

            {/* ── RECEPTION + CALL_CENTER: standalone pages ───────────────── */}
            <Route element={<ReceptionRoute />}>
              <Route path="/invoice/create" element={<CreateInvoice />} />
              <Route path="/devices"        element={<BranchDevices />} />
              <Route path="/call-center"    element={<CallCenterDashboard />} />
              <Route path="/parts"          element={<DeviceParts />} />
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
