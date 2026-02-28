import { useAuth } from 'react-oidc-context'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { canAccessAdmin, canAccessInvoices, getUserRoles } from '../auth/roles'

interface LayoutProps {
  children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const userRoles = getUserRoles(auth.user)
  const primaryRole = userRoles[0] || 'USER'

  const handleLogout = () => {
    auth.signoutRedirect()
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'tr' : 'en')
  }

  const navLinkClass = "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">AutoRepairShop</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/fast-intake" className={navLinkClass}>
                  {t('fastIntake.title')}
                </Link>
                <Link to="/workorders" className={navLinkClass}>
                  {t('workOrders.title')}
                </Link>
                <Link to="/customers" className={navLinkClass}>
                  {t('customers.title')}
                </Link>
                <Link to="/vehicles" className={navLinkClass}>
                  {t('vehicles.title')}
                </Link>
                {canAccessInvoices(auth.user) && (
                  <Link to="/invoices" className={navLinkClass}>
                    {t('invoices.title')}
                  </Link>
                )}
                {canAccessAdmin(auth.user) && (
                  <Link to="/admin" className={navLinkClass}>
                    {t('admin.title')}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                {i18n.language === 'en' ? 'TR' : 'EN'}
              </button>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {primaryRole}
                </span>
                <span className="text-sm text-gray-700">
                  {auth.user?.profile?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
