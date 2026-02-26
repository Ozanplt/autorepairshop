import { useAuth } from 'react-oidc-context'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function Login() {
  const auth = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      auth.signinRedirect()
    }
  }, [auth])

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('login.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('app.title')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('login.subtitle')}
          </p>
          <button
            onClick={() => auth.signinRedirect()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('login.button')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
