import React, { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../shared/LoadingSpinner'

const UnauthorizedPage = () => {
  const { instance } = useMsal()
  const { 
    user, 
    authorizationError, 
    retryAuthorization,
    isAuthLoading 
  } = useAuth()
  
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  /**
   * Handle manual logout with proper cleanup
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Clear any cached data
      sessionStorage.clear()
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('msal.cache')
      }
      
      // Use redirect for better security
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
        logoutHint: user?.email // Helps with faster logout
      })
    } catch (error) {
      console.error('Logout failed:', error)
      // Force full page reload as fallback
      window.location.href = '/'
    }
  }

  /**
   * Handle retry authorization
   */
  const handleRetry = async () => {
    try {
      setIsRetrying(true)
      await retryAuthorization()
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  // Show loading state during retry
  if (isRetrying || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">
              {isRetrying ? 'Retrying authorization...' : 'Checking permissions...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          {/* Error Details */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              {authorizationError || 'You are not authorized to access this application. Please contact your administrator to request access.'}
            </p>
            
            {/* User Info */}
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>User:</strong> {user.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {user.email}
                </p>
              </div>
            )}
            
            {/* Help Text */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Need access?</strong> Contact your system administrator and provide the email address above.
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Retry Button */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Retrying...
                </>
              ) : (
                'Retry Authorization'
              )}
            </button>
            
            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <LoadingSpinner size="sm" color="gray" className="mr-2" />
                  Signing Out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact your system administrator.
            </p>
            
            {/* Debug Information */}
            {import.meta.env.VITE_DEBUG_MODE === 'true' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Debug Information
                </summary>
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <p><strong>Environment:</strong> {import.meta.env.VITE_ENVIRONMENT}</p>
                  <p><strong>Client ID:</strong> {import.meta.env.VITE_CLIENT_ID}</p>
                  <p><strong>Tenant:</strong> {user?.tenantId}</p>
                  <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                </div>
              </details>
            )}
          </div>
        </div>
        
        {/* Company Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Cabrera Auto. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default UnauthorizedPage