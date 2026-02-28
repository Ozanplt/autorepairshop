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

function Appointments() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({})
  const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm, setAddForm] = useState({ customerId: '', vehicleId: '', appointmentDate: '', startTime: '', endTime: '', title: '' })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [apptRes, custRes, vehRes] = await Promise.allSettled([
        apiClient.get('/v1/appointments'),
        apiClient.get('/v1/customers'),
        apiClient.get('/v1/vehicles')
      ])

      if (apptRes.status === 'fulfilled') {
        setAppointments(extractList(apptRes.value.data))
      } else {
        console.error('Failed to fetch appointments:', apptRes.reason)
      }

      if (custRes.status === 'fulfilled') {
        const custList = extractList(custRes.value.data)
        setCustomers(custList)
        const cMap: Record<string, string> = {}
        custList.forEach((c: any) => { if (c.id) cMap[c.id] = c.fullName || '-' })
        setCustomerMap(cMap)
      } else {
        console.warn('Failed to fetch customers:', custRes.reason)
      }

      if (vehRes.status === 'fulfilled') {
        const vehList = extractList(vehRes.value.data)
        setVehicles(vehList)
        const vMap: Record<string, string> = {}
        vehList.forEach((v: any) => { if (v.id) vMap[v.id] = v.rawPlate || v.normalizedPlate || '-' })
        setVehicleMap(vMap)
      } else {
        console.warn('Failed to fetch vehicles:', vehRes.reason)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.customerId || !addForm.appointmentDate || !addForm.startTime) return
    setAddLoading(true)
    try {
      await apiClient.post('/v1/appointments', {
        customerId: addForm.customerId,
        vehicleId: addForm.vehicleId || undefined,
        appointmentDate: addForm.appointmentDate,
        startTime: addForm.startTime + ':00',
        endTime: addForm.endTime ? addForm.endTime + ':00' : undefined,
        title: addForm.title || undefined
      }, { headers: { 'Idempotency-Key': crypto.randomUUID() } })
      showToast('success', t('appointments.addSuccess'))
      setAddForm({ customerId: '', vehicleId: '', appointmentDate: '', startTime: '', endTime: '', title: '' })
      setShowAddForm(false)
      fetchAll()
    } catch (err: any) {
      showToast('error', err.message || t('appointments.addError'))
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.deleteConfirm'))) return
    try {
      await apiClient.delete(`/v1/appointments/${id}`)
      showToast('success', t('appointments.deleteSuccess'))
      fetchAll()
    } catch (err: any) {
      showToast('error', err.message || t('common.deleteError'))
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-200 text-blue-800',
      CONFIRMED: 'bg-indigo-200 text-indigo-800',
      CHECKED_IN: 'bg-yellow-200 text-yellow-800',
      COMPLETED: 'bg-green-200 text-green-800',
      CANCELED: 'bg-red-200 text-red-800',
      NO_SHOW: 'bg-gray-200 text-gray-800'
    }
    return colors[status] || 'bg-gray-200 text-gray-800'
  }

  const translateStatus = (status: string): string => {
    const key = `appointmentStatus.${status}`
    const translated = t(key)
    return translated !== key ? translated : status
  }

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{t('appointments.title')}</h1>
        </div>
        {canManageCustomers(auth.user) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {t('appointments.addNew')}
            </button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="mt-4 bg-white rounded-lg shadow-md p-6 border">
          <form onSubmit={handleAddAppointment} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appointments.customer')} *</label>
                <select
                  value={addForm.customerId}
                  onChange={(e) => setAddForm({...addForm, customerId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('appointments.selectCustomer')}</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appointments.vehicle')}</label>
                <select
                  value={addForm.vehicleId}
                  onChange={(e) => setAddForm({...addForm, vehicleId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('appointments.selectVehicle')}</option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.rawPlate} - {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appointments.appointmentDate')} *</label>
                <input
                  type="date"
                  value={addForm.appointmentDate}
                  onChange={(e) => setAddForm({...addForm, appointmentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appointments.startTime')} *</label>
                <input
                  type="time"
                  value={addForm.startTime}
                  onChange={(e) => setAddForm({...addForm, startTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appointments.endTime')}</label>
                <input
                  type="time"
                  value={addForm.endTime}
                  onChange={(e) => setAddForm({...addForm, endTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('appointments.notes')}</label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm({...addForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('appointments.date')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('appointments.time')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('appointments.customer')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('appointments.vehicle')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('appointments.description')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('appointments.status')}</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">{t('common.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">{t('appointments.noData')}</td>
                    </tr>
                  ) : (
                    appointments.map((appt: any) => (
                      <tr key={appt.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {appt.appointmentDate || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {appt.startTime ? appt.startTime.substring(0, 5) : '-'}
                          {appt.endTime ? ` - ${appt.endTime.substring(0, 5)}` : ''}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {customerMap[appt.customerId] || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-medium">
                          {vehicleMap[appt.vehicleId] || '-'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {appt.title || appt.description || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(appt.status)}`}>
                            {translateStatus(appt.status)}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {appt.status !== 'CANCELED' && appt.status !== 'COMPLETED' && canManageCustomers(auth.user) && (
                            <button
                              onClick={() => handleDelete(appt.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              {t('common.delete')}
                            </button>
                          )}
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

export default Appointments
