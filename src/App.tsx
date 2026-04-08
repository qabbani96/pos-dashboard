import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Layout      from './components/Layout'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Items       from './pages/Items'
import Categories  from './pages/Categories'
import Stock       from './pages/Stock'
import Barcodes    from './pages/Barcodes'
import Sales       from './pages/Sales'
import Reports     from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/items"      element={<Items />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/stock"      element={<Stock />} />
            <Route path="/barcodes"   element={<Barcodes />} />
            <Route path="/sales"      element={<Sales />} />
            <Route path="/reports"    element={<Reports />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
