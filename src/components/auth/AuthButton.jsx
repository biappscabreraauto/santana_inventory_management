import React from 'react'
import { useIsAuthenticated } from '@azure/msal-react'
import { useAuth } from '../../context/AuthContext'
import { ButtonLoader } from '../shared/LoadingSpinner'

const AuthButton = () => {
  const isAuthenticated = useIsAuthenticated()
  const { signIn, signOut, loading, isInteractionInProgress, error } = useAuth()

  // Show current error if present
  const currentError = error
  const isSignInDisabled = loading || isInteractionInProgress

  if (isAuthenticated) {
    return (
      <div className="w-full">
        <button
          onClick={signOut}
          disabled={loading}
          className="btn btn-outline w-full flex items-center justify-center"
        >
          {loading && <ButtonLoader color="gray" />}
          <span className="mr-2">🚪</span>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={signIn}
        disabled={isSignInDisabled}
        className={`btn btn-primary w-full flex items-center justify-center text-lg py-3 ${
          isSignInDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={isSignInDisabled ? 'Sign in is in progress...' : 'Sign in with Microsoft 365'}
      >
        {loading && <ButtonLoader color="white" />}
        <span className="mr-2">🔐</span>
        {isInteractionInProgress 
          ? 'Signing In...' 
          : loading 
            ? 'Loading...' 
            : 'Sign In with Microsoft 365'
        }
      </button>
      
      {/* Show error message if present */}
      {currentError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-red-600 mr-2 text-sm">⚠️</div>
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Sign In Error</p>
              <p className="text-xs text-red-700 mt-1">{currentError}</p>
              {currentError.includes('interaction_in_progress') && (
                <p className="text-xs text-red-600 mt-2">
                  Please wait a moment and try again, or refresh the page.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Show interaction in progress status */}
      {isInteractionInProgress && !currentError && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin mr-2">⏳</div>
            <p className="text-sm text-blue-800">
              Authentication in progress... Please wait.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthButton