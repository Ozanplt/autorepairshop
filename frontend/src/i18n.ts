import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'app.title': 'AutoRepairShop Management System',
          'login.loading': 'Redirecting to login...',
          'login.subtitle': 'Sign in to manage your auto repair shop',
          'login.button': 'Sign In',
          'logout': 'Logout',
          'fastIntake.title': 'Fast Intake',
          'fastIntake.licensePlate': 'License Plate',
          'fastIntake.customer': 'Customer Name',
          'fastIntake.phone': 'Phone (optional)',
          'fastIntake.problem': 'Problem Description',
          'fastIntake.problemPlaceholder': 'Describe the issue...',
          'fastIntake.showAdvanced': 'Show Advanced Fields',
          'fastIntake.make': 'Make',
          'fastIntake.model': 'Model',
          'fastIntake.createButton': 'Create Work Order',
          'fastIntake.creating': 'Creating...',
          'fastIntake.success': 'Work order created successfully!',
          'fastIntake.error': 'Failed to create work order',
          'workOrders.title': 'Work Orders',
          'workOrders.createNew': 'New Work Order',
          'customers.title': 'Customers',
          'customers.search': 'Search',
          'customers.searchPlaceholder': 'Search by name or phone...',
          'vehicles.title': 'Vehicles',
          'vehicles.search': 'Search',
          'vehicles.searching': 'Searching...',
          'vehicles.searchPlaceholder': 'Search by license plate...',
          'invoices.title': 'Invoices',
          'admin.title': 'Administration'
        }
      },
      tr: {
        translation: {
          'app.title': 'Oto Tamir Yonetim Sistemi',
          'login.loading': 'Giris sayfasina yonlendiriliyor...',
          'login.subtitle': 'Oto tamir dukkani yonetimi icin giris yapin',
          'login.button': 'Giris Yap',
          'logout': 'Cikis',
          'fastIntake.title': 'Hizli Kayit',
          'fastIntake.licensePlate': 'Plaka',
          'fastIntake.customer': 'Musteri Adi',
          'fastIntake.phone': 'Telefon (opsiyonel)',
          'fastIntake.problem': 'Sorun Aciklamasi',
          'fastIntake.problemPlaceholder': 'Sorunu aciklayiniz...',
          'fastIntake.showAdvanced': 'Gelismis Alanlari Goster',
          'fastIntake.make': 'Marka',
          'fastIntake.model': 'Model',
          'fastIntake.createButton': 'Is Emri Olustur',
          'fastIntake.creating': 'Olusturuluyor...',
          'fastIntake.success': 'Is emri basariyla olusturuldu!',
          'fastIntake.error': 'Is emri olusturulamadi',
          'workOrders.title': 'Is Emirleri',
          'workOrders.createNew': 'Yeni Is Emri',
          'customers.title': 'Musteriler',
          'customers.search': 'Ara',
          'customers.searchPlaceholder': 'Isim veya telefon ile ara...',
          'vehicles.title': 'Araclar',
          'vehicles.search': 'Ara',
          'vehicles.searching': 'Araniyor...',
          'vehicles.searchPlaceholder': 'Plaka ile ara...',
          'invoices.title': 'Faturalar',
          'admin.title': 'Yonetim'
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
