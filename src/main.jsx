import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'

import App from './App.jsx'
import { msalConfig } from './config/msal.js'
import './styles/globals.css'

// ================================================================
// MSAL INSTANCE CREATION
// ================================================================
// Create the MSAL instance that will be used throughout the app
const msalInstance = new PublicClientApplication(msalConfig)

// Handle redirect promise if returning from login
await msalInstance.handleRedirectPromise()

// ================================================================
// ERROR BOUNDARY FOR DEVELOPMENT
// ================================================================
// Enhanced error boundary to catch React errors during development
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application Error
              </h1>
              <p className="text-gray-600 mb-6">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
                
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
              
              {import.meta.env.VITE_DEBUG_MODE === 'true' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Debug Mode)
                  </summary>
                  <div className="mt-2 text-xs bg-red-50 p-3 rounded overflow-auto max-h-48">
                    <div className="mb-2">
                      <strong className="text-red-800">Error:</strong>
                      <pre className="text-red-600 whitespace-pre-wrap">
                        {this.state.error?.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong className="text-red-800">Component Stack:</strong>
                        <pre className="text-red-600 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              © 2025 Cabrera Auto. All rights reserved.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ================================================================
// APP INITIALIZATION
// ================================================================
// Initialize the React app with necessary providers
// Note: BrowserRouter is now handled inside AuthorizedApp for security
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// ================================================================
// DEVELOPMENT HELPERS
// ================================================================
// Add helpful debugging in development mode
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('🚀 Santana Inventory App Started')
  console.log('📅 Build Date:', new Date().toISOString())
  console.log('🌍 Environment:', import.meta.env.VITE_ENVIRONMENT || 'development')
  console.log('🔧 App Version:', import.meta.env.VITE_APP_VERSION || '1.0.0')
  
  console.log('🔐 MSAL Configuration:', {
    clientId: import.meta.env.VITE_CLIENT_ID,
    tenantId: import.meta.env.VITE_TENANT_ID,
    siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL,
    authority: msalConfig.auth.authority
  })
  
  console.log('📋 SharePoint Lists:', {
    parts: import.meta.env.VITE_PARTS_LIST_NAME,
    categories: import.meta.env.VITE_CATEGORIES_LIST_NAME,
    buyers: import.meta.env.VITE_BUYERS_LIST_NAME,
    invoices: import.meta.env.VITE_INVOICES_LIST_NAME,
    transactions: import.meta.env.VITE_TRANSACTIONS_LIST_NAME,
    authorizedUsers: import.meta.env.VITE_AUTHORIZED_USERS_LIST_NAME
  })
  
  // Make MSAL instance available globally for debugging
  window.msalInstance = msalInstance
  
  // Add auth state debugging
  window.debugAuth = () => {
    console.log('🔍 Current Auth State:', {
      accounts: msalInstance.getAllAccounts(),
      activeAccount: msalInstance.getActiveAccount(),
      cache: msalInstance.getTokenCache()
    })
  }
  
  console.log('💡 Debug Helper: Run window.debugAuth() to see current auth state')
}

// ================================================================
// PERFORMANCE MONITORING
// ================================================================
// Add performance monitoring in development
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  // Track app initialization time
  const appStartTime = performance.now()
  
  window.addEventListener('load', () => {
    const loadTime = performance.now() - appStartTime
    console.log(`⚡ App fully loaded in ${loadTime.toFixed(2)}ms`)
  })
  
  // Track authentication performance
  window.addEventListener('msal:loginSuccess', (event) => {
    console.log('🔐 Login completed:', event.detail)
  })
  
  window.addEventListener('msal:loginFailure', (event) => {
    console.error('❌ Login failed:', event.detail)
  })
}