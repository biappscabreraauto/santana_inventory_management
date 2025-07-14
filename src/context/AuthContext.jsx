import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest, createSilentRequest, MSAL_ERRORS, isMsalError } from '../config/msal'

// =================================================================
// AUTH CONTEXT CREATION
// =================================================================
const AuthContext = createContext(null)

// =================================================================
// AUTH CONTEXT PROVIDER
// =================================================================
export const AuthProvider = ({ children }) => {
  // MSAL hooks
  const { instance, accounts } = useMsal()
  const account = useAccount(accounts[0] || {})
  const isAuthenticated = useIsAuthenticated()

  // Local state
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissions, setPermissions] = useState([])

  // =================================================================
  // AUTHENTICATION FUNCTIONS
  // =================================================================

  /**
   * Sign in using popup
   */
  const signIn = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await instance.loginPopup(loginRequest)
      
      if (response) {
        console.log('✅ Login successful:', response.account.name)
        await acquireToken()
      }
    } catch (error) {
      console.error('❌ Login failed:', error)
      handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }, [instance])

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      
      // Clear local state
      setUser(null)
      setAccessToken(null)
      setPermissions([])
      setError(null)
      
      // Sign out from MSAL
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        mainWindowRedirectUri: window.location.origin
      })
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Force page reload if logout fails
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }, [instance])

  /**
   * Acquire access token silently or via popup
   */
  const acquireToken = useCallback(async (forceRefresh = false) => {
    if (!account) {
      console.warn('⚠️ No account available for token acquisition')
      return null
    }

    try {
      setError(null)
      
      // Try silent token acquisition first
      const silentRequest = createSilentRequest()
      silentRequest.account = account
      silentRequest.forceRefresh = forceRefresh

      const response = await instance.acquireTokenSilent(silentRequest)
      
      if (response?.accessToken) {
        setAccessToken(response.accessToken)
        console.log('🔐 Token acquired silently')
        return response.accessToken
      }
    } catch (error) {
      console.warn('⚠️ Silent token acquisition failed:', error.message)
      
      // If silent fails, try interactive popup
      if (isMsalError(error, MSAL_ERRORS.INTERACTION_REQUIRED) || 
          isMsalError(error, MSAL_ERRORS.CONSENT_REQUIRED)) {
        try {
          const response = await instance.acquireTokenPopup(loginRequest)
          if (response?.accessToken) {
            setAccessToken(response.accessToken)
            console.log('🔐 Token acquired via popup')
            return response.accessToken
          }
        } catch (popupError) {
          console.error('❌ Interactive token acquisition failed:', popupError)
          handleAuthError(popupError)
        }
      } else {
        handleAuthError(error)
      }
    }

    return null
  }, [instance, account])

  /**
   * Get a fresh access token (with automatic retry)
   */
  const getAccessToken = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      throw new Error('User is not authenticated')
    }

    // Return existing token if not forcing refresh and token exists
    if (!forceRefresh && accessToken) {
      return accessToken
    }

    return await acquireToken(forceRefresh)
  }, [isAuthenticated, accessToken, acquireToken])

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission)
  }, [permissions])

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error) => {
    let errorMessage = 'An authentication error occurred'

    if (isMsalError(error, MSAL_ERRORS.USER_CANCELLED)) {
      errorMessage = 'Login was cancelled by user'
    } else if (isMsalError(error, MSAL_ERRORS.POPUP_BLOCKED)) {
      errorMessage = 'Popup was blocked by browser. Please allow popups and try again.'
    } else if (isMsalError(error, MSAL_ERRORS.NETWORK_ERROR)) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error?.message) {
      errorMessage = error.message
    }

    setError(errorMessage)
    console.error('🔐 Auth Error:', errorMessage, error)
  }, [])

  // =================================================================
  // EFFECTS
  // =================================================================

  /**
   * Initialize user data when account changes
   */
  useEffect(() => {
    if (isAuthenticated && account) {
      setUser({
        id: account.localAccountId,
        name: account.name,
        email: account.username,
        tenantId: account.tenantId,
        homeAccountId: account.homeAccountId
      })

      // Extract permissions from account (if available)
      const accountPermissions = account.idTokenClaims?.roles || []
      setPermissions(accountPermissions)

      // Acquire initial token
      acquireToken()
    } else {
      setUser(null)
      setAccessToken(null)
      setPermissions([])
    }
  }, [isAuthenticated, account, acquireToken])

  /**
   * Handle initial loading state
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000) // Give MSAL time to initialize

    return () => clearTimeout(timer)
  }, [])

  // =================================================================
  // CONTEXT VALUE
  // =================================================================
  const contextValue = {
    // User state
    user,
    isAuthenticated,
    loading,
    error,
    permissions,
    
    // Token management
    accessToken,
    getAccessToken,
    
    // Authentication actions
    signIn,
    signOut,
    acquireToken,
    
    // Utility functions
    hasPermission,
    
    // MSAL instance and account (for advanced usage)
    instance,
    account
  }

  // =================================================================
  // DEBUG LOGGING
  // =================================================================
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    useEffect(() => {
      console.log('🔐 Auth State Changed:', {
        isAuthenticated,
        user: user?.name,
        hasToken: !!accessToken,
        permissions: permissions.length,
        loading,
        error
      })
    }, [isAuthenticated, user, accessToken, permissions, loading, error])
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// =================================================================
// CUSTOM HOOK
// =================================================================
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// =================================================================
// HELPER HOOKS
// =================================================================

/**
 * Hook to get authenticated user information
 */
export const useAuthUser = () => {
  const { user, isAuthenticated, loading } = useAuth()
  return { user, isAuthenticated, loading }
}

/**
 * Hook to handle authentication actions
 */
export const useAuthActions = () => {
  const { signIn, signOut, getAccessToken } = useAuth()
  return { signIn, signOut, getAccessToken }
}

/**
 * Hook to check permissions
 */
export const usePermissions = () => {
  const { permissions, hasPermission } = useAuth()
  return { permissions, hasPermission }
}