import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useMsal, useAccount, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest, createSilentRequest, MSAL_ERRORS, isMsalError } from '../config/msal'
import sharePointService from '../services/sharepoint'

// =================================================================
// AUTH CONTEXT CREATION
// =================================================================
const AuthContext = createContext(null)

// =================================================================
// AUTHORIZATION STATES
// =================================================================
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHORIZED: 'authorized',
  UNAUTHORIZED: 'unauthorized'
}

// =================================================================
// AUTH CONTEXT PROVIDER
// =================================================================
export const AuthProvider = ({ children }) => {
  // MSAL hooks
  const { instance, accounts } = useMsal()
  const account = useAccount(accounts[0] || {})
  const isAuthenticated = useIsAuthenticated()

  // Authentication state
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissions, setPermissions] = useState([])

  // Authorization state - NEW
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING)
  const [userRole, setUserRole] = useState(null)
  const [authorizationChecked, setAuthorizationChecked] = useState(false)
  const [authorizationError, setAuthorizationError] = useState(null)

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
      setAuthState(AUTH_STATES.LOADING)
      
      const response = await instance.loginPopup(loginRequest)
      
      if (response) {
        console.log('✅ Login successful:', response.account.name)
        await acquireToken()
      }
    } catch (error) {
      console.error('❌ Login failed:', error)
      handleAuthError(error)
      setAuthState(AUTH_STATES.UNAUTHORIZED)
    } finally {
      setLoading(false)
    }
  }, [instance])

  /**
   * Sign out with proper cleanup
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      
      // Clear all local state
      setUser(null)
      setAccessToken(null)
      setPermissions([])
      setUserRole(null)
      setAuthorizationChecked(false)
      setAuthorizationError(null)
      setError(null)
      setAuthState(AUTH_STATES.LOADING)
      
      // Clear cached data
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
      console.error('❌ Logout failed:', error)
      // Force full page reload as fallback
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }, [instance, user?.email])

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
  // AUTHORIZATION FUNCTIONS - NEW/ENHANCED
  // =================================================================

  /**
   * Validate user against SharePoint whitelist with retry logic
   */
  const validateUserAuthorization = useCallback(async (retryCount = 0) => {
    if (!isAuthenticated || !accessToken || !user?.email) {
      console.warn('⚠️ Cannot validate authorization - missing prerequisites')
      setAuthState(AUTH_STATES.UNAUTHORIZED)
      return false
    }

    try {
      console.log(`🔍 Validating authorization for: ${user.email} (attempt ${retryCount + 1})`)
      
      // Set loading state
      setAuthState(AUTH_STATES.LOADING)
      setAuthorizationError(null)
      setAuthorizationChecked(false)

      // Check SharePoint authorization
      const authResult = await sharePointService.isUserAuthorized(accessToken, user.email)
      
      if (!authResult.isAuthorized) {
        const errorMsg = `Access denied. You are not authorized to use this application. Please contact your administrator to request access.`
        console.warn('❌ User not authorized:', user.email)
        
        setAuthorizationError(errorMsg)
        setAuthState(AUTH_STATES.UNAUTHORIZED)
        setAuthorizationChecked(true)
        return false
      }

      // User is authorized
      console.log(`✅ User authorized with role: ${authResult.role}`)
      setUserRole(authResult.role)
      setAuthState(AUTH_STATES.AUTHORIZED)
      setAuthorizationChecked(true)
      setAuthorizationError(null)
      
      return true
      
    } catch (error) {
      console.error('❌ Authorization check failed:', error)
      
      // Retry logic for transient errors
      if (retryCount < 2 && (
        error.message?.includes('network') || 
        error.message?.includes('timeout') ||
        error.message?.includes('500')
      )) {
        console.log(`🔄 Retrying authorization check in ${(retryCount + 1) * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
        return validateUserAuthorization(retryCount + 1)
      }
      
      // Final failure
      const errorMsg = retryCount > 0 
        ? 'Unable to verify access permissions after multiple attempts. Please try again or contact your administrator.'
        : 'Unable to verify access permissions. Please try again or contact your administrator.'
      
      setAuthorizationError(errorMsg)
      setAuthState(AUTH_STATES.UNAUTHORIZED)
      setAuthorizationChecked(true)
      return false
    }
  }, [isAuthenticated, accessToken, user?.email])

  /**
   * Manual retry for authorization
   */
  const retryAuthorization = useCallback(async () => {
    console.log('🔄 Manual authorization retry requested')
    await validateUserAuthorization(0)
  }, [validateUserAuthorization])

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission)
  }, [permissions])

  /**
   * Check if user has specific role or higher
   */
  const hasRole = useCallback((requiredRole) => {
    const roleHierarchy = { 
      'ReadOnly': 1, 
      'User': 2, 
      'Admin': 3 
    }
    
    const userRoleLevel = roleHierarchy[userRole] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0
    
    return userRoleLevel >= requiredRoleLevel
  }, [userRole])

  // =================================================================
  // EFFECTS
  // =================================================================

  /**
   * Initialize user data when account changes
   */
  useEffect(() => {
    if (isAuthenticated && account) {
      console.log('👤 Setting user data for:', account.name)
      
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
      console.log('👤 Clearing user data - not authenticated')
      setUser(null)
      setAccessToken(null)
      setPermissions([])
      setUserRole(null)
      setAuthorizationChecked(false)
      setAuthorizationError(null)
      setAuthState(AUTH_STATES.LOADING)
    }
  }, [isAuthenticated, account, acquireToken])

  /**
   * Handle initial loading state
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setLoading(false)
        setAuthState(AUTH_STATES.UNAUTHORIZED)
      }
    }, 2000) // Give MSAL time to initialize

    return () => clearTimeout(timer)
  }, [isAuthenticated])

  /**
   * Trigger authorization validation when prerequisites are met
   */
  useEffect(() => {
    if (isAuthenticated && accessToken && user?.email && !authorizationChecked && authState === AUTH_STATES.LOADING) {
      console.log('🔍 Prerequisites met, starting authorization validation')
      validateUserAuthorization()
    }
  }, [isAuthenticated, accessToken, user?.email, authorizationChecked, authState, validateUserAuthorization])

  /**
   * Handle loading state when authentication changes
   */
  useEffect(() => {
    if (isAuthenticated && accessToken && user) {
      setLoading(false)
    }
  }, [isAuthenticated, accessToken, user])

  // =================================================================
  // COMPUTED VALUES
  // =================================================================
  const isAuthorized = authState === AUTH_STATES.AUTHORIZED
  const isUnauthorized = authState === AUTH_STATES.UNAUTHORIZED
  const isAuthLoading = authState === AUTH_STATES.LOADING || loading

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

    // Authorization state - NEW
    authState,
    isAuthorized,
    isUnauthorized,
    isAuthLoading,
    userRole,
    authorizationChecked,
    authorizationError,
    
    // Token management
    accessToken,
    getAccessToken,
    
    // Authentication actions
    signIn,
    signOut,
    acquireToken,
    
    // Authorization actions - NEW
    validateUserAuthorization,
    retryAuthorization,
    
    // Utility functions
    hasPermission,
    hasRole,
    
    // MSAL instance and account (for advanced usage)
    instance,
    account,

    // Constants
    AUTH_STATES
  }

  // =================================================================
  // DEBUG LOGGING
  // =================================================================
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    useEffect(() => {
      console.log('🔐 Auth State Changed:', {
        isAuthenticated,
        authState,
        user: user?.name,
        userRole,
        hasToken: !!accessToken,
        permissions: permissions.length,
        loading,
        error: error || authorizationError
      })
    }, [isAuthenticated, authState, user, userRole, accessToken, permissions, loading, error, authorizationError])
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
  const { signIn, signOut, getAccessToken, retryAuthorization } = useAuth()
  return { signIn, signOut, getAccessToken, retryAuthorization }
}

/**
 * Hook to check permissions and authorization
 */
export const usePermissions = () => {
  const { 
    permissions, 
    hasPermission, 
    hasRole, 
    userRole, 
    isAuthorized, 
    isUnauthorized,
    authorizationError 
  } = useAuth()
  
  return { 
    permissions, 
    hasPermission, 
    hasRole, 
    userRole, 
    isAuthorized, 
    isUnauthorized,
    authorizationError 
  }
}

/**
 * Hook to get authorization state
 */
export const useAuthorizationState = () => {
  const { 
    authState, 
    isAuthorized, 
    isUnauthorized, 
    isAuthLoading,
    authorizationChecked,
    authorizationError,
    retryAuthorization 
  } = useAuth()
  
  return { 
    authState, 
    isAuthorized, 
    isUnauthorized, 
    isAuthLoading,
    authorizationChecked,
    authorizationError,
    retryAuthorization 
  }
}