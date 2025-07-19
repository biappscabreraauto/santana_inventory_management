import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  const [isAcquiringToken, setIsAcquiringToken] = useState(false)
  const [tokenRequestQueue, setTokenRequestQueue] = useState([])

  // Authorization state - NEW
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING)
  const [userRole, setUserRole] = useState(null)
  const [authorizationChecked, setAuthorizationChecked] = useState(false)
  const [authorizationError, setAuthorizationError] = useState(null)

  // INTERACTION TRACKING - NEW
  const [isInteractionInProgress, setIsInteractionInProgress] = useState(false)
  const interactionTimeoutRef = useRef(null)

  // =================================================================
  // AUTHENTICATION FUNCTIONS
  // =================================================================

  /**
   * Check if interaction is currently in progress
   */
  const checkInteractionStatus = useCallback(async () => {
    try {
      const inProgress = await instance.getActiveAccount() !== null && 
                        await instance.getAllAccounts().length > 0 &&
                        isInteractionInProgress
      return inProgress
    } catch (error) {
      return false
    }
  }, [instance, isInteractionInProgress])

  /**
   * Clear any existing interaction state
   */
  const clearInteractionState = useCallback(() => {
    setIsInteractionInProgress(false)
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current)
      interactionTimeoutRef.current = null
    }
  }, [])

  /**
   * Handle interaction in progress error
   */
  const handleInteractionInProgress = useCallback(async () => {
    console.warn('⚠️ Interaction already in progress, waiting for completion...')
    
    // Wait for existing interaction to complete (max 30 seconds)
    let attempts = 0
    const maxAttempts = 30
    
    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        
        const stillInProgress = await checkInteractionStatus()
        if (!stillInProgress) {
          console.log('✅ Previous interaction completed, can proceed')
          clearInteractionState()
          return true
        }
        
        attempts++
      } catch (error) {
        console.error('Error checking interaction status:', error)
        break
      }
    }
    
    // If we get here, force clear the interaction state
    console.warn('⚠️ Forcing interaction state clear after timeout')
    clearInteractionState()
    
    // Try to clear any pending interactions
    try {
      await instance.clearCache()
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
    
    return false
  }, [checkInteractionStatus, clearInteractionState, instance])

  /**
   * Sign in using popup - IMPROVED VERSION
   */
  const signIn = useCallback(async () => {
    if (isInteractionInProgress) {
      console.warn('⚠️ Sign-in already in progress')
      return
    }

    try {
      setIsInteractionInProgress(true)
      setLoading(true)
      setError(null)
      setAuthState(AUTH_STATES.LOADING)

      console.log('🔐 Starting login popup...')
      const response = await instance.loginPopup(loginRequest)
      
      if (response?.account) {
        console.log('✅ Login successful:', response.account.name)
        
        // Set the active account immediately
        instance.setActiveAccount(response.account)
        
        // Small delay to ensure MSAL state is fully updated
        setTimeout(() => {
          // This will trigger the useEffect above
          setLoading(false)
        }, 100)
      }
    } catch (error) {
      console.error('❌ Login failed:', error)
      handleAuthError(error)
      setAuthState(AUTH_STATES.UNAUTHORIZED)
      setLoading(false)
    } finally {
      setIsInteractionInProgress(false)
    }
  }, [instance, isInteractionInProgress])

  /**
   * Sign out with proper cleanup - ENHANCED VERSION
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      
      // Clear interaction state first
      clearInteractionState()
      
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
      
      // Clear MSAL cache
      await instance.clearCache()
      
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
  }, [instance, user?.email, clearInteractionState])

    /**
   * Acquire access token with improved timing and deduplication
   */
  const acquireToken = useCallback(async (forceRefresh = false) => {
    // Return existing token if valid and not forcing refresh
    if (!forceRefresh && accessToken) {
      return accessToken
    }

    // Prevent multiple simultaneous requests
    if (isAcquiringToken && !forceRefresh) {
      console.log('🔐 Token acquisition in progress, waiting for completion...')
      
      // Wait for current acquisition to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isAcquiringToken) {
            clearInterval(checkInterval)
            resolve(accessToken)
          }
        }, 100)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve(null)
        }, 10000)
      })
    }

    setIsAcquiringToken(true)
    
    try {
      // Get account from MSAL directly (more reliable than React state)
      const currentAccount = instance.getActiveAccount() || 
                            (accounts.length > 0 ? accounts[0] : null)

      if (!currentAccount) {
        // Wait briefly for MSAL to update its internal state
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const retryAccount = instance.getActiveAccount() || 
                            (accounts.length > 0 ? accounts[0] : null)
        
        if (!retryAccount) {
          console.warn('⚠️ No account available for token acquisition')
          return null
        }
        
        console.log('🔐 Account found after retry')
      }

      const targetAccount = currentAccount || instance.getActiveAccount() || accounts[0]
      setError(null)
      
      // Try silent token acquisition
      const silentRequest = createSilentRequest()
      silentRequest.account = targetAccount
      silentRequest.forceRefresh = forceRefresh

      const response = await instance.acquireTokenSilent(silentRequest)
      
      if (response?.accessToken) {
        setAccessToken(response.accessToken)
        console.log('🔐 Token acquired successfully')
        return response.accessToken
      }
    } catch (error) {
      console.warn('⚠️ Token acquisition failed:', error.message)
      handleAuthError(error)
    } finally {
      setIsAcquiringToken(false)
    }

    return null
  }, [instance, accounts, accessToken, isAcquiringToken])

  /**
   * Get a fresh access token (with automatic retry) - ENHANCED VERSION
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
   * Handle authentication errors - ENHANCED VERSION
   */
  const handleAuthError = useCallback((error) => {
    let errorMessage = 'An authentication error occurred'

    if (isMsalError(error, MSAL_ERRORS.USER_CANCELLED)) {
      errorMessage = 'Login was cancelled by user'
    } else if (isMsalError(error, MSAL_ERRORS.POPUP_BLOCKED)) {
      errorMessage = 'Popup was blocked by browser. Please allow popups and try again.'
    } else if (isMsalError(error, MSAL_ERRORS.NETWORK_ERROR)) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error?.errorCode === 'interaction_in_progress') {
      errorMessage = 'Authentication is already in progress. Please wait and try again.'
    } else if (error?.message) {
      errorMessage = error.message
    }

    setError(errorMessage)
    console.error('🔐 Auth Error:', errorMessage, error)
  }, [])

  // =================================================================
  // AUTHORIZATION FUNCTIONS - ENHANCED
  // =================================================================

  /**
   * Validate user against SharePoint whitelist with retry logic - ENHANCED VERSION
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
  // EFFECTS - ENHANCED
  // =================================================================

  /**
   * Initialize user data when account changes - IMPROVED VERSION
   */
  useEffect(() => {
    let timeoutId
    
    const initializeUserData = async () => {
      if (isAuthenticated) {
        // Get the most current account
        const currentAccount = instance.getActiveAccount() || 
                              (accounts.length > 0 ? accounts[0] : null)
        
        if (currentAccount && currentAccount !== account) {
          console.log('👤 Setting user data for:', currentAccount.name)
          
          setUser({
            id: currentAccount.localAccountId,
            name: currentAccount.name,
            email: currentAccount.username,
            tenantId: currentAccount.tenantId,
            homeAccountId: currentAccount.homeAccountId
          })

          // Extract permissions from account
          const accountPermissions = currentAccount.idTokenClaims?.roles || []
          setPermissions(accountPermissions)

          // Acquire token with a small delay to ensure account is fully set
          timeoutId = setTimeout(() => {
            acquireToken()
          }, 500)
        }
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
    }

    initializeUserData()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isAuthenticated, instance, accounts, acquireToken])

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

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearInteractionState()
    }
  }, [clearInteractionState])

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
    AUTH_STATES,

    // Interaction state - NEW
    isInteractionInProgress
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
        error: error || authorizationError,
        isInteractionInProgress
      })
    }, [isAuthenticated, authState, user, userRole, accessToken, permissions, loading, error, authorizationError, isInteractionInProgress])
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