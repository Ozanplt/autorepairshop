import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import apiClient from '../api/client'

function extractList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.content && Array.isArray(data.content)) return data.content
  return []
}

function Appointments() {
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState<any[]>([])
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({})
  const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [apptRes, custRes, vehRes] = await Promise.all([
        apiClient.get('/v1/appointments'),
        apiClient.get('/v1/customers'),
        apiClient.get('/v1/vehicles')
      ])
      setAppointments(extractList(apptRes.data))

      const cMap: Record<string, string> = {}
      extractList(custRes.data).forEach((c: any) => { if (c.id) cMap[c.id] = c.fullName || '-' })
      setCustomerMap(cMap)

      const vMap: Record<string, string> = {}
      extractList(vehRes.data).forEach((v: any) => { if (v.id) vMap[v.id] = v.rawPlate || v.normalizedPlate || '-' })
      setVehicleMap(vMap)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
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
      </div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">{t('appointments.noData')}</td>
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
