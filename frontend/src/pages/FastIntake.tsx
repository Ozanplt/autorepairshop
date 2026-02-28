import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useToast } from '../components/Toast'

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
    problem: ''
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

    const problemTrimmed = formData.problem.trim()
    if (!problemTrimmed) {
      errs.problem = t('validation.required')
    } else if (problemTrimmed.length < 3) {
      errs.problem = t('validation.problemMin')
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      await apiClient.post('/v1/workorders/fast-intake', {
        customer: {
          fullName: formData.customerName.trim(),
          phoneE164: formData.phone.replace(/[\s\-\(\)]/g, '') || undefined,
          email: formData.email || undefined
        },
        vehicle: {
          rawPlate: formData.licensePlate.trim(),
          make: formData.make || undefined,
          model: formData.model || undefined
        },
        workOrder: {
          problemShortNote: formData.problem.trim()
        }
      }, {
        headers: {
          'Idempotency-Key': crypto.randomUUID()
        }
      })

      showToast('success', t('fastIntake.success'))
      setFormData({ licensePlate: '', customerName: '', phone: '', email: '', make: '', model: '', problem: '' })
      setErrors({})
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t('fastIntake.title')}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6" noValidate>
        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fastIntake.problem')} *
            </label>
            <textarea
              value={formData.problem}
              onChange={(e) => { setFormData({...formData, problem: e.target.value}); setErrors({...errors, problem: ''}) }}
              className={inputClass('problem')}
              rows={3}
              placeholder={t('fastIntake.problemPlaceholder')}
            />
            {errors.problem && <p className="mt-1 text-sm text-red-600">{errors.problem}</p>}
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
                  {t('fastIntake.make')}
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Toyota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fastIntake.model')}
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Corolla"
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
