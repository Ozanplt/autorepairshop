import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from 'react-oidc-context'
import apiClient from '../api/client'
import { canCreateWorkOrder, canManageCustomers } from '../auth/roles'
import { useToast } from '../components/Toast'

function extractList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.content && Array.isArray(data.content)) return data.content
  return []
}

function WorkOrders() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { showToast } = useToast()
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({})
  const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [woRes, custRes, vehRes] = await Promise.allSettled([
        apiClient.get('/v1/workorders'),
        apiClient.get('/v1/customers'),
        apiClient.get('/v1/vehicles')
      ])

      if (woRes.status === 'fulfilled') {
        setWorkOrders(extractList(woRes.value.data))
      } else {
        console.error('Failed to fetch work orders:', woRes.reason)
      }

      if (custRes.status === 'fulfilled') {
        const cMap: Record<string, string> = {}
        extractList(custRes.value.data).forEach((c: any) => { if (c.id) cMap[c.id] = c.fullName || '-' })
        setCustomerMap(cMap)
      } else {
        console.warn('Failed to fetch customers:', custRes.reason)
      }

      if (vehRes.status === 'fulfilled') {
        const vMap: Record<string, string> = {}
        extractList(vehRes.value.data).forEach((v: any) => { if (v.id) vMap[v.id] = v.rawPlate || v.normalizedPlate || '-' })
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

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.deleteConfirm'))) return
    try {
      await apiClient.delete(`/v1/workorders/${id}`)
      showToast('success', t('common.deleteSuccess'))
      fetchAll()
    } catch (err: any) {
      showToast('error', err.message || t('common.deleteError'))
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      OPEN: 'bg-blue-200 text-blue-800',
      IN_PROGRESS: 'bg-yellow-200 text-yellow-800',
      WAITING_CUSTOMER_APPROVAL: 'bg-orange-200 text-orange-800',
      COMPLETED: 'bg-green-200 text-green-800',
      CANCELED: 'bg-red-200 text-red-800',
      INTAKE: 'bg-purple-200 text-purple-800'
    }
    return colors[status] || 'bg-gray-200 text-gray-800'
  }

  const translateStatus = (status: string): string => {
    const key = `status.${status}`
    const translated = t(key)
    return translated !== key ? translated : status
  }

  const renderProblem = (note: string | null) => {
    if (!note) return <span className="text-gray-400">-</span>

    const sectionRegex = /\[([^\]]+)\]\s*([^|[\]]*)/g
    const sections: { label: string; items: string }[] = []
    let match
    let hasStructured = false

    while ((match = sectionRegex.exec(note)) !== null) {
      hasStructured = true
      sections.push({ label: match[1].trim(), items: match[2].trim() })
    }

    if (!hasStructured) {
      return <span className="text-gray-700">{note.length > 60 ? note.substring(0, 60) + '...' : note}</span>
    }

    const freeText = note.split('|')[0]?.replace(/\[[^\]]+\][^|]*/g, '').trim()

    const categoryColors: Record<string, string> = {}
    const maintenanceLabels = [t('fastIntake.parts.maintenance'), 'Maintenance', 'Bakım']
    const issueLabels = [t('fastIntake.parts.issues'), 'Issues', 'Sorunlar']
    const replacementLabels = [t('fastIntake.parts.replacements'), 'Replacements', 'Değişimler']

    maintenanceLabels.forEach(l => { categoryColors[l] = 'bg-green-100 text-green-700' })
    issueLabels.forEach(l => { categoryColors[l] = 'bg-red-100 text-red-700' })
    replacementLabels.forEach(l => { categoryColors[l] = 'bg-blue-100 text-blue-700' })

    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {freeText && <span className="text-gray-700 text-xs mr-1">{freeText}</span>}
        {sections.map((s, i) => (
          <span
            key={i}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[s.label] || 'bg-gray-100 text-gray-700'}`}
            title={s.items}
          >
            {s.label}: {s.items.length > 25 ? s.items.substring(0, 25) + '...' : s.items}
          </span>
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{t('workOrders.title')}</h1>
        </div>
        {canCreateWorkOrder(auth.user) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/fast-intake"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {t('workOrders.createNew')}
            </Link>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('workOrders.id')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('workOrders.customer')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('workOrders.vehicle')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('workOrders.problem')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('workOrders.status')}</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('workOrders.created')}</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">{t('common.noData')}</td>
                    </tr>
                  ) : (
                    workOrders.map((wo: any) => (
                      <tr key={wo.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                          {wo.id.substring(0, 8)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {wo.customerName || customerMap[wo.customerId] || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-medium">
                          {wo.vehiclePlate || vehicleMap[wo.vehicleId] || '-'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {renderProblem(wo.problemShortNote)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(wo.status)}`}>
                            {translateStatus(wo.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                          <Link to={`/workorders/${wo.id}`} className="text-blue-600 hover:text-blue-900">
                            {t('common.view')}
                          </Link>
                          {wo.status !== 'COMPLETED' && wo.status !== 'CANCELED' && canManageCustomers(auth.user) && (
                            <button
                              onClick={() => handleDelete(wo.id)}
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

export default WorkOrders
