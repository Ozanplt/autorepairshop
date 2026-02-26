import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'app.title': 'AutoRepairShop Management System',
          'fastIntake.title': 'Fast Intake',
          'fastIntake.licensePlate': 'License Plate',
          'fastIntake.customer': 'Customer',
          'fastIntake.phone': 'Phone (optional)',
          'fastIntake.problem': 'Problem',
          'fastIntake.showAdvanced': 'Show Advanced',
          'fastIntake.createButton': 'Create Work Order',
          'workOrders.title': 'Work Orders',
          'customers.title': 'Customers',
          'vehicles.title': 'Vehicles',
          'invoices.title': 'Invoices',
          'admin.title': 'Administration'
        }
      },
      tr: {
        translation: {
          'app.title': 'Oto Tamir Yönetim Sistemi',
          'fastIntake.title': 'Hızlı Kayıt',
          'fastIntake.licensePlate': 'Plaka',
          'fastIntake.customer': 'Müşteri',
          'fastIntake.phone': 'Telefon (opsiyonel)',
          'fastIntake.problem': 'Sorun',
          'fastIntake.showAdvanced': 'Gelişmiş Göster',
          'fastIntake.createButton': 'İş Emri Oluştur',
          'workOrders.title': 'İş Emirleri',
          'customers.title': 'Müşteriler',
          'vehicles.title': 'Araçlar',
          'invoices.title': 'Faturalar',
          'admin.title': 'Yönetim'
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
