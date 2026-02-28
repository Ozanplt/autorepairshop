import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from 'react-oidc-context'
import apiClient from '../api/client'
import { useToast } from '../components/Toast'
import { canManageCustomers } from '../auth/roles'

function extractList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.content && Array.isArray(data.content)) return data.content
  return []
}

function Customers() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', phone: '', email: '', address: '' })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/v1/customers')
      setCustomers(extractList(response.data))
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchCustomers()
      return
    }
    try {
      const response = await apiClient.get('/v1/customers', { params: { q: searchQuery } })
      setCustomers(extractList(response.data))
    } catch (error) {
      console.error('Failed to search customers:', error)
    }
  }

  const validateAdd = (): boolean => {
    const errs: Record<string, string> = {}
    const name = addForm.fullName.trim()
    if (!name) {
      errs.fullName = t('validation.required')
    } else if (name.length < 2) {
      errs.fullName = t('validation.nameMin')
    } else if (!/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(name)) {
      errs.fullName = t('validation.nameLettersOnly')
    }
    if (addForm.phone) {
      const phoneClean = addForm.phone.replace(/[\s\-\(\)]/g, '')
      if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
        errs.phone = t('validation.phoneInvalid')
      }
    }
    if (addForm.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
        errs.email = t('validation.emailInvalid')
      }
    }
    setAddErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAdd()) return
    setAddLoading(true)
    try {
      await apiClient.post('/v1/customers', {
        fullName: addForm.fullName.trim(),
        phoneE164: addForm.phone.replace(/[\s\-\(\)]/g, '') || undefined,
        emailNormalized: addForm.email || undefined,
        address: addForm.address || undefined,
        type: 'GUEST'
      }, {
        headers: { 'Idempotency-Key': crypto.randomUUID() }
      })
      showToast('success', t('customers.addSuccess'))
      setAddForm({ fullName: '', phone: '', email: '', address: '' })
      setAddErrors({})
      setShowAddForm(false)
      fetchCustomers()
    } catch (err: any) {
      showToast('error', err.message || t('customers.addError'))
    } finally {
      setAddLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{t('customers.title')}</h1>
        </div>
        {canManageCustomers(auth.user) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {t('customers.addNew')}
            </button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="mt-4 bg-white rounded-lg shadow-md p-6 border">
          <h2 className="text-lg font-semibold mb-4">{t('customers.addTitle')}</h2>
          <form onSubmit={handleAddCustomer} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.fullName')} *</label>
                <input
                  type="text"
                  value={addForm.fullName}
                  onChange={(e) => { setAddForm({...addForm, fullName: e.target.value}); setAddErrors({...addErrors, fullName: ''}) }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${addErrors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Ahmet Yılmaz"
                />
                {addErrors.fullName && <p className="mt-1 text-sm text-red-600">{addErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.phone')}</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => { setAddForm({...addForm, phone: e.target.value.replace(/[^0-9+\s\-\(\)]/g, '')}); setAddErrors({...addErrors, phone: ''}) }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${addErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="+90 555 123 4567"
                />
                {addErrors.phone && <p className="mt-1 text-sm text-red-600">{addErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.email')}</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => { setAddForm({...addForm, email: e.target.value}); setAddErrors({...addErrors, email: ''}) }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${addErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="ornek@email.com"
                />
                {addErrors.email && <p className="mt-1 text-sm text-red-600">{addErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.address')}</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={(e) => setAddForm({...addForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={addLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400"
              >
                {addLoading ? t('common.loading') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddErrors({}) }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('customers.searchPlaceholder')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            onClick={handleSearch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('customers.search')}
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('customers.name')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('customers.phone')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('customers.email')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('customers.type')}</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">{t('common.noData')}</td>
                    </tr>
                  ) : (
                    customers.map((customer: any) => (
                      <tr key={customer.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {customer.fullName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.phoneE164 || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.emailNormalized || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {t(`customerType.${customer.type}`, customer.type)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link to={`/customers/${customer.id}`} className="text-blue-600 hover:text-blue-900">
                            {t('common.view')}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Customers
