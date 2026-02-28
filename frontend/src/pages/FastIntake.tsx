import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useToast } from '../components/Toast'

const PART_CATEGORIES = {
  maintenance: [
    'oil_filter', 'air_filter', 'cabin_filter', 'fuel_filter',
    'spark_plug', 'brake_pad', 'brake_disc', 'timing_belt',
    'serpentine_belt', 'coolant', 'transmission_fluid', 'battery'
  ],
  issues: [
    'engine', 'transmission', 'suspension', 'steering',
    'electrical', 'ac_system', 'exhaust', 'fuel_system',
    'cooling_system', 'brakes', 'clutch', 'turbo'
  ],
  replacements: [
    'windshield', 'headlight', 'taillight', 'mirror',
    'bumper', 'fender', 'door', 'hood',
    'tire', 'wheel', 'wiper_blade', 'muffler'
  ]
}

function FastIntake() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    licensePlate: '',
    customerName: '',
    phone: '',
    email: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    color: '',
    vin: '',
    problem: '',
    problemDetails: ''
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedParts, setSelectedParts] = useState<Record<string, string[]>>({
    maintenance: [],
    issues: [],
    replacements: []
  })

  const togglePart = (category: string, part: string) => {
    setSelectedParts(prev => {
      const current = prev[category] || []
      const updated = current.includes(part)
        ? current.filter(p => p !== part)
        : [...current, part]
      return { ...prev, [category]: updated }
    })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    const plateTrimmed = formData.licensePlate.trim()
    if (!plateTrimmed) {
      errs.licensePlate = t('validation.required')
    } else if (plateTrimmed.length < 4) {
      errs.licensePlate = t('validation.plateMin')
    }

    const nameTrimmed = formData.customerName.trim()
    if (!nameTrimmed) {
      errs.customerName = t('validation.required')
    } else if (nameTrimmed.length < 2) {
      errs.customerName = t('validation.nameMin')
    } else if (!/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(nameTrimmed)) {
      errs.customerName = t('validation.nameLettersOnly')
    }

    if (formData.phone) {
      const phoneClean = formData.phone.replace(/[\s\-\(\)]/g, '')
      if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
        errs.phone = t('validation.phoneInvalid')
      }
    }

    if (formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = t('validation.emailInvalid')
      }
    }

    const makeTrimmed = formData.make.trim()
    if (!makeTrimmed) {
      errs.make = t('validation.required')
    } else if (makeTrimmed.length < 2) {
      errs.make = t('validation.makeMin')
    }

    const modelTrimmed = formData.model.trim()
    if (!modelTrimmed) {
      errs.model = t('validation.required')
    } else if (modelTrimmed.length < 1) {
      errs.model = t('validation.modelMin')
    }

    if (formData.year) {
      const yearNum = parseInt(formData.year, 10)
      if (isNaN(yearNum) || yearNum < 1950 || yearNum > 2100) {
        errs.year = t('validation.yearInvalid')
      }
    }

    if (formData.mileage) {
      const km = parseInt(formData.mileage, 10)
      if (isNaN(km) || km < 0 || km > 9999999) {
        errs.mileage = t('validation.mileageInvalid')
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildProblemNote = (): string => {
    const parts: string[] = []

    if (selectedParts.maintenance.length > 0) {
      parts.push(`[${t('fastIntake.parts.maintenance')}] ${selectedParts.maintenance.map(p => t(`parts.${p}`)).join(', ')}`)
    }
    if (selectedParts.issues.length > 0) {
      parts.push(`[${t('fastIntake.parts.issues')}] ${selectedParts.issues.map(p => t(`parts.${p}`)).join(', ')}`)
    }
    if (selectedParts.replacements.length > 0) {
      parts.push(`[${t('fastIntake.parts.replacements')}] ${selectedParts.replacements.map(p => t(`parts.${p}`)).join(', ')}`)
    }

    const problemText = formData.problem.trim()
    if (problemText) {
      parts.unshift(problemText)
    }

    return parts.join(' | ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      const customerRes = await apiClient.post('/v1/customers', {
        fullName: formData.customerName.trim(),
        phoneE164: formData.phone.replace(/[\s\-\(\)]/g, '') || undefined,
        emailNormalized: formData.email || undefined,
        type: 'GUEST'
      }, {
        headers: { 'Idempotency-Key': crypto.randomUUID() }
      })
      const customerId = customerRes.data.id

      const vehicleRes = await apiClient.post('/v1/vehicles', {
        customerId,
        rawPlate: formData.licensePlate.trim(),
        make: formData.make.trim(),
        model: formData.model.trim() || undefined,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        mileage: formData.mileage ? parseInt(formData.mileage, 10) : undefined,
        color: formData.color.trim() || undefined,
        vin: formData.vin.trim() || undefined
      }, {
        headers: { 'Idempotency-Key': crypto.randomUUID() }
      })
      const vehicleId = vehicleRes.data.id

      const problemNote = buildProblemNote()

      await apiClient.post('/v1/workorders/fast-intake', {
        customer: {
          fullName: formData.customerName.trim(),
          phoneE164: formData.phone.replace(/[\s\-\(\)]/g, '') || undefined,
          email: formData.email || undefined,
          customerId
        },
        vehicle: {
          rawPlate: formData.licensePlate.trim(),
          make: formData.make.trim(),
          model: formData.model.trim() || undefined,
          vehicleId
        },
        workOrder: {
          problemShortNote: problemNote || undefined,
          problemDetails: formData.problemDetails.trim() || undefined
        }
      }, {
        headers: { 'Idempotency-Key': crypto.randomUUID() }
      })

      showToast('success', t('fastIntake.success'))
      setFormData({ licensePlate: '', customerName: '', phone: '', email: '', make: '', model: '', year: '', mileage: '', color: '', vin: '', problem: '', problemDetails: '' })
      setErrors({})
      setSelectedParts({ maintenance: [], issues: [], replacements: [] })
      navigate('/workorders')
    } catch (err: any) {
      showToast('error', err.message || t('fastIntake.error'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  const renderPartGroup = (category: string, parts: string[]) => (
    <div key={category} className="mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {t(`fastIntake.parts.${category}`)}
      </h4>
      <div className="flex flex-wrap gap-2">
        {parts.map(part => {
          const isSelected = (selectedParts[category] || []).includes(part)
          return (
            <button
              key={part}
              type="button"
              onClick={() => togglePart(category, part)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? category === 'maintenance'
                    ? 'bg-green-100 text-green-800 border-2 border-green-400'
                    : category === 'issues'
                    ? 'bg-red-100 text-red-800 border-2 border-red-400'
                    : 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {isSelected ? '✓ ' : ''}{t(`parts.${part}`)}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t('fastIntake.title')}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">{t('fastIntake.customerSection')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.customer')} *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => { setFormData({...formData, customerName: e.target.value}); setErrors({...errors, customerName: ''}) }}
                className={inputClass('customerName')}
                placeholder="Ahmet Yılmaz"
              />
              {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9+\s\-\(\)]/g, '')
                  setFormData({...formData, phone: val})
                  setErrors({...errors, phone: ''})
                }}
                className={inputClass('phone')}
                placeholder="+90 555 123 4567"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ''}) }}
                className={inputClass('email')}
                placeholder="ornek@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-green-800 mb-4">{t('fastIntake.vehicleSection')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.licensePlate')} *
              </label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => { setFormData({...formData, licensePlate: e.target.value.toUpperCase()}); setErrors({...errors, licensePlate: ''}) }}
                className={inputClass('licensePlate')}
                placeholder="34 ABC 123"
              />
              {errors.licensePlate && <p className="mt-1 text-sm text-red-600">{errors.licensePlate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.make')} *
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => { setFormData({...formData, make: e.target.value}); setErrors({...errors, make: ''}) }}
                className={inputClass('make')}
                placeholder="Toyota"
              />
              {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.model')} *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => { setFormData({...formData, model: e.target.value}); setErrors({...errors, model: ''}) }}
                className={inputClass('model')}
                placeholder="Corolla"
              />
              {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.year')}
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({...formData, year: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)}); setErrors({...errors, year: ''}) }}
                className={inputClass('year')}
                placeholder="2020"
                min="1950"
                max="2100"
              />
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.mileage')}
              </label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => { setFormData({...formData, mileage: e.target.value.replace(/[^0-9]/g, '')}); setErrors({...errors, mileage: ''}) }}
                className={inputClass('mileage')}
                placeholder="85000"
                min="0"
              />
              {errors.mileage && <p className="mt-1 text-sm text-red-600">{errors.mileage}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.color')}
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className={inputClass('color')}
                placeholder={t('fastIntake.colorPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fastIntake.vin')}
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase().slice(0, 17)})}
                className={inputClass('vin')}
                placeholder="WVWZZZ3CZWE123456"
                maxLength={17}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <h2 className="text-lg font-semibold text-orange-800 mb-4">{t('fastIntake.workOrderSection')}</h2>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('fastIntake.partsSection')}</h3>
            {renderPartGroup('maintenance', PART_CATEGORIES.maintenance)}
            {renderPartGroup('issues', PART_CATEGORIES.issues)}
            {renderPartGroup('replacements', PART_CATEGORIES.replacements)}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? '▼' : '▶'} {t('fastIntake.showAdvanced')}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fastIntake.problem')}
                </label>
                <textarea
                  value={formData.problem}
                  onChange={(e) => { setFormData({...formData, problem: e.target.value}); setErrors({...errors, problem: ''}) }}
                  className={inputClass('problem')}
                  rows={3}
                  placeholder={t('fastIntake.problemPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fastIntake.problemDetails')}
                </label>
                <textarea
                  value={formData.problemDetails}
                  onChange={(e) => setFormData({...formData, problemDetails: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder={t('fastIntake.problemDetailsPlaceholder')}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t('fastIntake.creating') : t('fastIntake.createButton')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FastIntake
