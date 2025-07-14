import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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
// Simple error boundary to catch React errors during development
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {import.meta.env.VITE_DEBUG_MODE === 'true' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Debug Mode)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
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
// Initialize the React app with all necessary providers
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MsalProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// ================================================================
// DEVELOPMENT HELPERS
// ================================================================
// Add some helpful debugging in development mode
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('🚀 Santana Inventory App Started')
  console.log('Environment:', import.meta.env.VITE_ENVIRONMENT)
  console.log('MSAL Config:', {
    clientId: import.meta.env.VITE_CLIENT_ID,
    tenantId: import.meta.env.VITE_TENANT_ID,
    siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL
  })
  
  // Make MSAL instance available globally for debugging
  window.msalInstance = msalInstance
}