// =================================================================
// FIXED MSAL CONFIGURATION - Updated getSiteId function
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
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  }
}

// =================================================================
// LOGIN REQUEST CONFIGURATION
// =================================================================
export const loginRequest = {
  scopes: [
    'User.Read',
    'Sites.ReadWrite.All'
  ],
  prompt: 'select_account'
}

// =================================================================
// GRAPH API REQUEST CONFIGURATION
// =================================================================
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphSiteEndpoint: `https://graph.microsoft.com/v1.0/sites/${getSiteId()}`,
}

// =================================================================
// FIXED HELPER FUNCTIONS
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
// OTHER HELPER FUNCTIONS (unchanged)
// =================================================================

export const createSilentRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  account: null,
  forceRefresh: false
})

export const createInteractiveRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  prompt: 'consent'
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
  POPUP_BLOCKED: 'popup_blocked'
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
}