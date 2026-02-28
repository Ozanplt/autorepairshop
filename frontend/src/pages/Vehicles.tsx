import { useState, useEffect } from 'react'
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

function Vehicles() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { showToast } = useToast()
  const [plate, setPlate] = useState('')
  const [vehicles, setVehicles] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm, setAddForm] = useState({ rawPlate: '', make: '', model: '', year: '', customerId: '', mileage: '', color: '' })

  useEffect(() => {
    fetchCustomers()
    fetchVehicles()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/v1/customers')
      const list = extractList(response.data)
      setCustomers(list)
      const map: Record<string, string> = {}
      list.forEach((c: any) => { map[c.id] = c.fullName })
      setCustomerMap(map)
    } catch (error) {
      console.error('Failed to fetch customers for lookup:', error)
    }
  }

  const fetchVehicles = async (searchPlate?: string) => {
    setLoading(true)
    try {
      const params = searchPlate ? { plate: searchPlate } : {}
      const response = await apiClient.get('/v1/vehicles', { params })
      setVehicles(extractList(response.data))
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    fetchVehicles(plate || undefined)
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.rawPlate || !addForm.make || !addForm.model || !addForm.customerId) return
    setAddLoading(true)
    try {
      await apiClient.post('/v1/vehicles', {
        rawPlate: addForm.rawPlate.toUpperCase(),
        make: addForm.make,
        model: addForm.model,
        year: addForm.year ? parseInt(addForm.year) : undefined,
        customerId: addForm.customerId,
        mileage: addForm.mileage ? parseInt(addForm.mileage) : undefined,
        color: addForm.color || undefined
      }, { headers: { 'Idempotency-Key': crypto.randomUUID() } })
      showToast('success', t('vehicles.addSuccess'))
      setAddForm({ rawPlate: '', make: '', model: '', year: '', customerId: '', mileage: '', color: '' })
      setShowAddForm(false)
      fetchVehicles()
    } catch (err: any) {
      showToast('error', err.message || t('vehicles.addError'))
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.deleteConfirm'))) return
    try {
      await apiClient.delete(`/v1/vehicles/${id}`)
      showToast('success', t('vehicles.deleteSuccess'))
      fetchVehicles()
    } catch (err: any) {
      showToast('error', err.message || t('common.deleteError'))
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{t('vehicles.title')}</h1>
        </div>
        {canManageCustomers(auth.user) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {t('vehicles.addNew')}
            </button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border">
          <form onSubmit={handleAddVehicle} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicles.plate')} *</label>
                <input type="text" value={addForm.rawPlate} onChange={(e) => setAddForm({...addForm, rawPlate: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="34 ABC 123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicles.customer')} *</label>
                <select value={addForm.customerId} onChange={(e) => setAddForm({...addForm, customerId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">{t('vehicles.selectCustomer')}</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicles.make')} *</label>
                <input type="text" value={addForm.make} onChange={(e) => setAddForm({...addForm, make: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Toyota" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicles.model')} *</label>
                <input type="text" value={addForm.model} onChange={(e) => setAddForm({...addForm, model: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Corolla" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicles.year')}</label>
                <input type="number" value={addForm.year} onChange={(e) => setAddForm({...addForm, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="2020" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicles.mileage')}</label>
                <input type="number" value={addForm.mileage} onChange={(e) => setAddForm({...addForm, mileage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="85000" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={addLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400">
                {addLoading ? t('common.loading') : t('common.create')}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={plate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlate(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            placeholder={t('vehicles.searchPlaceholder')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-3"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? t('vehicles.searching') : t('vehicles.search')}
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : vehicles.length > 0 ? (
        <div className="mt-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('vehicles.plate')}</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('vehicles.make')}</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('vehicles.model')}</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('vehicles.year')}</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('vehicles.mileage')}</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('vehicles.customer')}</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {vehicles.map((vehicle: any) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      {vehicle.rawPlate}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.make || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.model || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.year || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.mileage != null ? vehicle.mileage.toLocaleString() + ' km' : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {customerMap[vehicle.customerId] || '-'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      {canManageCustomers(auth.user) && (
                        <button onClick={() => handleDelete(vehicle.id)} className="text-red-600 hover:text-red-900">
                          {t('common.delete')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">{t('vehicles.noResults')}</div>
      )}
    </div>
  )
}

export default Vehicles
