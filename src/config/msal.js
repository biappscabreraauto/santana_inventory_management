// =================================================================
// FIXED MSAL CONFIGURATION - Enhanced Interaction Handling
// =================================================================

import { LogLevel } from '@azure/msal-browser'

// =================================================================
// MSAL CONFIGURATION OBJECT
// =================================================================
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          switch (level) {
            case LogLevel.Error:
              console.error(`[MSAL Error] ${message}`)
              break
            case LogLevel.Warning:
              console.warn(`[MSAL Warning] ${message}`)
              break
            case LogLevel.Info:
              console.info(`[MSAL Info] ${message}`)
              break
            case LogLevel.Verbose:
              console.debug(`[MSAL Debug] ${message}`)
              break
            default:
              console.log(`[MSAL] ${message}`)
          }
        }
      },
      piiLoggingEnabled: false,
      logLevel: import.meta.env.VITE_DEBUG_MODE === 'true' ? LogLevel.Verbose : LogLevel.Warning,
    },
    // ENHANCED: Better timeout handling
    windowHashTimeout: 60000, // Increased from 60000
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    // ENHANCED: Allow multiple concurrent interactions to be handled better
    allowNativeBroker: false, // Disable native broker for web apps
    asyncPopups: false, // Use synchronous popups for better control
  }
}

// =================================================================
// LOGIN REQUEST CONFIGURATION - ENHANCED
// =================================================================
export const loginRequest = {
  scopes: [
    'User.Read',
    'Sites.ReadWrite.All'
  ],
  prompt: 'select_account',
  // ENHANCED: Add timeout and interaction handling
  timeout: 60000, // 60 seconds timeout
  forceRefresh: false,
  // Add claims if needed for conditional access
  extraQueryParameters: {},
}

// =================================================================
// GRAPH API REQUEST CONFIGURATION
// =================================================================
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphSiteEndpoint: `https://graph.microsoft.com/v1.0/sites/${getSiteId()}`,
}

// =================================================================
// HELPER FUNCTIONS - ENHANCED
// =================================================================

/**
 * Get the SharePoint site ID for Graph API calls
 * FIXED: Now uses the actual site ID instead of path-based approach
 */
function getSiteId() {
  // Option 1: Use the exact site ID from your Graph API response
  // This is the most reliable method
  const SITE_ID = 'cabreraautopr.sharepoint.com,7e2124f9-e554-4d2a-9e16-d4da5a00f314,ddb94a9e-35b4-41b2-b94c-9a8bc90c5098'
  
  if (SITE_ID) {
    console.log('✅ Using hardcoded site ID:', SITE_ID)
    return SITE_ID
  }
  
  // Option 2: Fallback to path-based (if hardcoded doesn't work)
  const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteUrl) {
    console.error('VITE_SHAREPOINT_SITE_URL not configured')
    return ''
  }
  
  try {
    const url = new URL(siteUrl)
    const hostname = url.hostname
    const sitePath = url.pathname.replace('/sites/', '')
    
    // Try different formats that Graph API accepts
    const pathFormat = `${hostname}:/sites/${sitePath}`
    console.log('⚠️ Using path-based site ID:', pathFormat)
    return pathFormat
  } catch (error) {
    console.error('Invalid SharePoint site URL:', error)
    return ''
  }
}

/**
 * Alternative function to get site ID dynamically (for advanced usage)
 * This would require an additional API call to resolve the site
 */
export async function resolveSiteId(graphClient) {
  try {
    const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
    if (!siteUrl) throw new Error('Site URL not configured')
    
    const url = new URL(siteUrl)
    const hostname = url.hostname
    const sitePath = url.pathname
    
    // Use Graph API to get the site by path
    const response = await graphClient
      .api(`/sites/${hostname}:${sitePath}`)
      .get()
    
    console.log('✅ Dynamically resolved site ID:', response.id)
    return response.id
  } catch (error) {
    console.error('❌ Failed to resolve site ID:', error)
    return null
  }
}

// =================================================================
// ENHANCED REQUEST BUILDERS
// =================================================================

export const createSilentRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  account: null,
  forceRefresh: false,
  timeout: 30000, // 30 seconds for silent requests
})

export const createInteractiveRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  prompt: 'consent',
  timeout: 60000, // 60 seconds for interactive requests
  forceRefresh: false,
})

// ENHANCED: Request with retry logic
export const createRetryRequest = (scopes = loginRequest.scopes, retryCount = 0) => ({
  scopes,
  prompt: retryCount > 0 ? 'login' : 'select_account',
  timeout: 60000 + (retryCount * 10000), // Increase timeout with retries
  forceRefresh: retryCount > 0,
  extraQueryParameters: retryCount > 0 ? { 'max_age': '0' } : {},
})

export const SCOPES = {
  USER_READ: 'User.Read',
  SITES_READ_ALL: 'Sites.Read.All',
  SITES_READWRITE_ALL: 'Sites.ReadWrite.All',
  MAIL_READ: 'Mail.Read',
  CALENDARS_READ: 'Calendars.Read',
  OFFLINE_ACCESS: 'offline_access'
}

export const isMsalError = (error, errorType) => {
  return error?.errorCode === errorType || error?.name === errorType
}

export const MSAL_ERRORS = {
  USER_CANCELLED: 'user_cancelled',
  CONSENT_REQUIRED: 'consent_required',
  INTERACTION_REQUIRED: 'interaction_required',
  LOGIN_REQUIRED: 'login_required',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  POPUP_BLOCKED: 'popup_blocked',
  INTERACTION_IN_PROGRESS: 'interaction_in_progress', // ADDED
  TIMEOUT_ERROR: 'timeout_error', // ADDED
}

// =================================================================
// INTERACTION HANDLING UTILITIES - NEW
// =================================================================

/**
 * Check if error is related to interaction issues
 */
export const isInteractionError = (error) => {
  return error?.errorCode === 'interaction_in_progress' ||
         error?.message?.includes('interaction_in_progress') ||
         error?.name === 'BrowserAuthError' && error?.message?.includes('Interaction is currently in progress')
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  const retryableErrors = [
    'network_error',
    'timeout_error',
    'server_error',
    'temporary_unavailable',
    'interaction_in_progress'
  ]
  
  return retryableErrors.some(errorType => 
    error?.errorCode === errorType || 
    error?.message?.includes(errorType)
  )
}

/**
 * Get error handling strategy
 */
export const getErrorHandlingStrategy = (error) => {
  if (isInteractionError(error)) {
    return {
      strategy: 'wait_and_retry',
      waitTime: 2000,
      maxRetries: 3,
      clearCache: true
    }
  }
  
  if (isMsalError(error, MSAL_ERRORS.USER_CANCELLED)) {
    return {
      strategy: 'user_cancelled',
      waitTime: 0,
      maxRetries: 0,
      clearCache: false
    }
  }
  
  if (isRetryableError(error)) {
    return {
      strategy: 'retry',
      waitTime: 1000,
      maxRetries: 2,
      clearCache: false
    }
  }
  
  return {
    strategy: 'fail',
    waitTime: 0,
    maxRetries: 0,
    clearCache: false
  }
}

// =================================================================
// DEVELOPMENT HELPERS
// =================================================================
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('🔐 MSAL Configuration Loaded')
  console.log('Client ID:', import.meta.env.VITE_CLIENT_ID)
  console.log('Tenant ID:', import.meta.env.VITE_TENANT_ID)
  console.log('Site URL:', import.meta.env.VITE_SHAREPOINT_SITE_URL)
  console.log('Site ID for Graph:', getSiteId())
  console.log('🔧 Enhanced interaction handling enabled')
}