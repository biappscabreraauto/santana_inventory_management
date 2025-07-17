import React, { Suspense } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'

// Import contexts
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Import layout components
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'

// Import auth components
import AuthButton from './components/auth/AuthButton'
import UnauthorizedPage from './components/auth/UnauthorizedPage'

// ================================================================
// LAZY LOADED COMPONENTS
// ================================================================
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'))
const PartsTable = React.lazy(() => import('./components/parts/PartsTable'))
const PartForm = React.lazy(() => import('./components/parts/PartForm'))
const PartDetails = React.lazy(() => import('./components/parts/PartDetails'))
const BuyersTable = React.lazy(() => import('./components/buyers/BuyersTable'))
const BuyerForm = React.lazy(() => import('./components/buyers/BuyerForm'))
const InvoiceList = React.lazy(() => import('./components/invoices/InvoiceList'))
const InvoiceForm = React.lazy(() => import('./components/invoices/InvoiceForm'))
const InvoiceDetails = React.lazy(() => import('./components/invoices/InvoiceDetails'))
const TransactionForm = React.lazy(() => import('./components/transactions/TransactionForm'))
const TransactionHistory = React.lazy(() => import('./components/transactions/TransactionHistory'))
const ExternalLookup = React.lazy(() => import('./components/external/ExternalLookup'))
const TestPage = React.lazy(() => import('./components/parts/TestPage'))

// ================================================================
// LOADING COMPONENTS
// ================================================================
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
)

const AppLoader = ({ message = "Loading application..." }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
    </div>
  </div>
)

// ================================================================
// UNAUTHENTICATED VIEW
// ================================================================
const UnauthenticatedView = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {import.meta.env.VITE_APP_NAME}
          </h1>
          <p className="text-gray-600">
            SharePoint-powered inventory management for auto parts
          </p>
        </div>
        
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Santana Inventory
          </h2>
          <p className="text-gray-600 text-sm">
            Please sign in with your company Microsoft 365 account to access the inventory management system.
          </p>
        </div>

        <div className="space-y-4">
          <AuthButton />
          
          <div className="text-xs text-gray-500 mt-4">
            <p>✓ Secure Microsoft 365 authentication</p>
            <p>✓ Real-time inventory tracking</p>
            <p>✓ Invoice generation and management</p>
          </div>
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-500 mt-6">
        © 2025 Cabrera Auto. All rights reserved.
      </p>
    </div>
  </div>
)

// ================================================================
// AUTHORIZED APP ROUTES
// ================================================================
const AuthorizedAppRoutes = () => (
  <BrowserRouter>
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Dashboard - Default route */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Parts Management */}
          <Route path="/parts" element={<PartsTable />} />
          <Route path="/parts/new" element={<PartForm />} />
          <Route path="/parts/test-page" element={<TestPage />} />
          <Route path="/parts/:id" element={<PartDetails />} />
          <Route path="/parts/:id/edit" element={<PartForm />} />
          
          {/* Buyers Management */}
          <Route path="/buyers" element={<BuyersTable />} />
          <Route path="/buyers/new" element={<BuyerForm />} />
          <Route path="/buyers/:id/edit" element={<BuyerForm />} />
          
          {/* Invoice Management */}
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          
          {/* Transaction Management */}
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/transactions/new" element={<TransactionForm />} />
          
          {/* External Lookup */}
          <Route path="/external-lookup" element={<ExternalLookup />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  </BrowserRouter>
)

// ================================================================
// AUTHORIZED APP COMPONENT
// ================================================================
const AuthorizedApp = () => {
  const { 
    authState, 
    isAuthorized, 
    isUnauthorized, 
    isAuthLoading,
    authorizationError,
    retryAuthorization,
    AUTH_STATES 
  } = useAuth()
  
  // Show loading while checking authorization
  if (isAuthLoading) {
    let loadingMessage = "Loading application..."
    
    if (authState === AUTH_STATES.LOADING) {
      loadingMessage = "Verifying access permissions..."
    }
    
    return <AppLoader message={loadingMessage} />
  }

  // Show unauthorized page if not authorized
  if (isUnauthorized) {
    return <UnauthorizedPage />
  }

  // Show main app if authorized
  if (isAuthorized) {
    return <AuthorizedAppRoutes />
  }

  // Fallback loading state (should rarely be reached)
  return <AppLoader message="Initializing application..." />
}

// ================================================================
// ERROR BOUNDARY FOR AUTHORIZATION ERRORS
// ================================================================
class AuthorizationErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Authorization Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Authorization Error
              </h1>
              <p className="text-gray-600 mb-6">
                There was an error checking your permissions. Please try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Application
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
              
              {import.meta.env.VITE_DEBUG_MODE === 'true' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Debug Mode)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ================================================================
// MAIN APP COMPONENT
// ================================================================
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthorizationErrorBoundary>
          {/* Show different views based on authentication status */}
          <AuthenticatedTemplate>
            <AuthorizedApp />
          </AuthenticatedTemplate>
          
          <UnauthenticatedTemplate>
            <UnauthenticatedView />
          </UnauthenticatedTemplate>
        </AuthorizationErrorBoundary>
        
        {/* Development indicator */}
        {import.meta.env.VITE_DEBUG_MODE === 'true' && (
          <div className="fixed bottom-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50">
            DEV MODE
          </div>
        )}
      </ToastProvider>
    </AuthProvider>
  )
}

export default App