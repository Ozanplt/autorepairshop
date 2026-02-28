import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import apiClient from '../api/client'

function WorkOrders() {
  const { t } = useTranslation()
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      const response = await apiClient.get('/v1/workorders')
      setWorkOrders(response.data.content || [])
    } catch (error) {
      console.error('Failed to fetch work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      OPEN: 'bg-blue-200 text-blue-800',
      IN_PROGRESS: 'bg-yellow-200 text-yellow-800',
      COMPLETED: 'bg-green-200 text-green-800',
      CANCELED: 'bg-red-200 text-red-800'
    }
    return colors[status] || 'bg-gray-200 text-gray-800'
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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/fast-intake"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {t('workOrders.createNew')}
          </Link>
        </div>
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
                  {workOrders.map((wo: any) => (
                    <tr key={wo.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {wo.id.substring(0, 8)}...
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {wo.customerName || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {wo.vehiclePlate || 'N/A'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {wo.problemShortNote || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadge(wo.status)}`}>
                          {wo.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(wo.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link to={`/workorders/${wo.id}`} className="text-blue-600 hover:text-blue-900">
                          {t('common.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
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
