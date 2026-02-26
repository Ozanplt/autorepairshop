import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import apiClient from '../api/client'

function Vehicles() {
  const { t } = useTranslation()
  const [plate, setPlate] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!plate) return
    setLoading(true)
    try {
      const response = await apiClient.get(`/v1/vehicles/search?plate=${plate}`)
      setVehicles(response.data.content || [])
    } catch (error) {
      console.error('Failed to search vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t('vehicles.title')}</h1>
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
      {vehicles.length > 0 && (
        <div className="mt-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Plate</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Make</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Model</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Year</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {vehicles.map((vehicle: any) => (
                  <tr key={vehicle.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      {vehicle.rawPlate}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.make}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.model || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.year || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {vehicle.customerName || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vehicles
