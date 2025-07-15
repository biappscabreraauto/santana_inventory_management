import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated } from '@azure/msal-react'

// Import contexts (we'll create these next)
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Import layout components (we'll create these next)
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'

// Import auth component
import AuthButton from './components/auth/AuthButton'

// ================================================================
// LAZY LOADED COMPONENTS
// ================================================================
// Lazy load main feature components for better performance
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
// LOADING FALLBACK COMPONENT
// ================================================================
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
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
// AUTHENTICATED ROUTES
// ================================================================
const AuthenticatedRoutes = () => (
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
        <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
        
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
)

// ================================================================
// MAIN APP COMPONENT
// ================================================================
function App() {
  const isAuthenticated = useIsAuthenticated()

  return (
    <AuthProvider>
      <ToastProvider>
        {/* Show different views based on authentication status */}
        <AuthenticatedTemplate>
          <AuthenticatedRoutes />
        </AuthenticatedTemplate>
        
        <UnauthenticatedTemplate>
          <UnauthenticatedView />
        </UnauthenticatedTemplate>
        
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