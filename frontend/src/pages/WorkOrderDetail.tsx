import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import apiClient from '../api/client'

function WorkOrderDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [workOrder, setWorkOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkOrder()
  }, [id])

  const fetchWorkOrder = async () => {
    try {
      const response = await apiClient.get(`/v1/workorders/${id}`)
      setWorkOrder(response.data)
    } catch (error) {
      console.error('Failed to fetch work order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>
  }

  if (!workOrder) {
    return <div className="text-center py-8">{t('workOrderDetail.notFound')}</div>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {t('workOrderDetail.title')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            ID: {workOrder.id}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{t('workOrders.status')}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  workOrder.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' :
                  workOrder.status === 'OPEN' ? 'bg-blue-200 text-blue-800' :
                  workOrder.status === 'IN_PROGRESS' ? 'bg-yellow-200 text-yellow-800' :
                  workOrder.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                  workOrder.status === 'CANCELED' ? 'bg-red-200 text-red-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {t(`status.${workOrder.status}`, workOrder.status)}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{t('workOrders.customer')}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.customerName || '-'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{t('workOrders.vehicle')}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.vehiclePlate || '-'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{t('workOrders.problem')}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.problemShortNote || '-'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{t('workOrderDetail.details')}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.problemDetails || '-'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{t('workOrders.created')}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(workOrder.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default WorkOrderDetail
