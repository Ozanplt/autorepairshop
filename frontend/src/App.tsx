import { useAuth } from 'react-oidc-context'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import Layout from './components/Layout'

function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return <div>Loading...</div>
  }

  if (auth.error) {
    return <div>Authentication Error: {auth.error.message}</div>
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
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  )
}

export default App
