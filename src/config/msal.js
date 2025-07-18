// =================================================================
// MSAL CONFIGURATION WITH DEBUG LOGGING
// =================================================================

import { LogLevel } from '@azure/msal-browser'

// =================================================================
// DEBUG: Log all environment variables (temporarily)
// =================================================================
console.log('🔍 Environment Variables Debug:')
console.log('VITE_CLIENT_ID:', import.meta.env.VITE_CLIENT_ID ? 'SET' : 'UNDEFINED')
console.log('VITE_TENANT_ID:', import.meta.env.VITE_TENANT_ID ? 'SET' : 'UNDEFINED')
console.log('VITE_SHAREPOINT_SITE_URL:', import.meta.env.VITE_SHAREPOINT_SITE_URL ? 'SET' : 'UNDEFINED')
console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))

// =================================================================
// MSAL CONFIGURATION OBJECT
// =================================================================
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/52ae8d25-07f3-4012-8a6f-1410c83ce9a8`,
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
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    allowNativeBroker: false,
    asyncPopups: false,
  }
}

// =================================================================
// DEBUG: Log the actual authority URL being used
// =================================================================
console.log('🔍 MSAL Authority URL:', msalConfig.auth.authority)

// =================================================================
// VALIDATION: Check for undefined values
// =================================================================
if (!import.meta.env.VITE_CLIENT_ID) {
  console.error('❌ VITE_CLIENT_ID is undefined!')
}
if (!import.meta.env.VITE_TENANT_ID) {
  console.error('❌ VITE_TENANT_ID is undefined!')
}

// =================================================================
// LOGIN REQUEST CONFIGURATION
// =================================================================
export const loginRequest = {
  scopes: [
    'User.Read',
    'Sites.ReadWrite.All'
  ],
  prompt: 'select_account',
  timeout: 60000,
  forceRefresh: false,
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
// HELPER FUNCTIONS
// =================================================================

/**
 * Get the SharePoint site ID for Graph API calls
 */
function getSiteId() {
  const SITE_ID = 'cabreraautopr.sharepoint.com,7e2124f9-e554-4d2a-9e16-d4da5a00f314,ddb94a9e-35b4-41b2-b94c-9a8bc90c5098'
  
  if (SITE_ID) {
    console.log('✅ Using hardcoded site ID:', SITE_ID)
    return SITE_ID
  }
  
  const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteUrl) {
    console.error('VITE_SHAREPOINT_SITE_URL not configured')
    return ''
  }
  
  try {
    const url = new URL(siteUrl)
    const hostname = url.hostname
    const sitePath = url.pathname.replace('/sites/', '')
    
    const pathFormat = `${hostname}:/sites/${sitePath}`
    console.log('⚠️ Using path-based site ID:', pathFormat)
    return pathFormat
  } catch (error) {
    console.error('Invalid SharePoint site URL:', error)
    return ''
  }
}

export async function resolveSiteId(graphClient) {
  try {
    const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
    if (!siteUrl) throw new Error('Site URL not configured')
    
    const url = new URL(siteUrl)
    const hostname = url.hostname
    const sitePath = url.pathname
    
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
// REQUEST BUILDERS
// =================================================================

export const createSilentRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  account: null,
  forceRefresh: false,
  timeout: 30000,
})

export const createInteractiveRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  prompt: 'consent',
  timeout: 60000,
  forceRefresh: false,
})

export const createRetryRequest = (scopes = loginRequest.scopes, retryCount = 0) => ({
  scopes,
  prompt: retryCount > 0 ? 'login' : 'select_account',
  timeout: 60000 + (retryCount * 10000),
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
  INTERACTION_IN_PROGRESS: 'interaction_in_progress',
  TIMEOUT_ERROR: 'timeout_error',
}

// =================================================================
// ERROR HANDLING UTILITIES
// =================================================================

export const isInteractionError = (error) => {
  return error?.errorCode === 'interaction_in_progress' ||
         error?.message?.includes('interaction_in_progress') ||
         error?.name === 'BrowserAuthError' && error?.message?.includes('Interaction is currently in progress')
}

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