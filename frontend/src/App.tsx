import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { Routes, Route, Navigate } from 'react-router-dom'
import { setAccessToken } from './api/client'
import { canAccessAdmin, canAccessInvoices } from './auth/roles'
import Login from './pages/Login'
import FastIntake from './pages/FastIntake'
import WorkOrders from './pages/WorkOrders'
import WorkOrderDetail from './pages/WorkOrderDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Vehicles from './pages/Vehicles'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import Admin from './pages/Admin'
import Appointments from './pages/Appointments'
import Layout from './components/Layout'

function App() {
  const auth = useAuth()

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      setAccessToken(auth.user.access_token)
    } else {
      setAccessToken(null)
    }
  }, [auth.isAuthenticated, auth.user?.access_token])

  if (auth.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  if (auth.error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">Authentication Error: {auth.error.message}</div></div>
  }

  if (!auth.isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/fast-intake" replace />} />
        <Route path="/fast-intake" element={<FastIntake />} />
        <Route path="/workorders" element={<WorkOrders />} />
        <Route path="/workorders/:id" element={<WorkOrderDetail />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/invoices" element={canAccessInvoices(auth.user) ? <Invoices /> : <Navigate to="/fast-intake" replace />} />
        <Route path="/invoices/:id" element={canAccessInvoices(auth.user) ? <InvoiceDetail /> : <Navigate to="/fast-intake" replace />} />
        <Route path="/admin" element={canAccessAdmin(auth.user) ? <Admin /> : <Navigate to="/fast-intake" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
