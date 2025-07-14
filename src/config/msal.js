// =================================================================
// MSAL CONFIGURATION - Microsoft Authentication Library
// =================================================================
// This file configures MSAL.js for authenticating with Azure AD
// and accessing Microsoft Graph API for SharePoint integration

import { LogLevel } from '@azure/msal-browser'

// =================================================================
// MSAL CONFIGURATION OBJECT
// =================================================================
export const msalConfig = {
  auth: {
    // Your Azure AD Application (client) ID
    clientId: import.meta.env.VITE_CLIENT_ID,
    
    // Authority URL for your tenant
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    
    // Redirect URI after login (should match your app URL)
    redirectUri: window.location.origin,
    
    // Post logout redirect URI
    postLogoutRedirectUri: window.location.origin,
    
    // Navigate to login request URL after logout
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // Use sessionStorage for better security in shared environments
    cacheLocation: 'sessionStorage',
    
    // Store auth state in cookies for IE11 compatibility (if needed)
    storeAuthStateInCookie: false,
  },
  system: {
    // Logging configuration
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return
        }
        
        // Only log in development mode
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
    
    // Window options for popup login
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
    'User.Read',           // Basic user profile information
    'Sites.ReadWrite.All'  // Read/write access to SharePoint sites
  ],
  prompt: 'select_account' // Allow user to select account if multiple exist
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
 * Extract site ID from SharePoint URL for Graph API calls
 * Converts: https://cabreraautopr.sharepoint.com/sites/DataCollectionSystem
 * To: cabreraautopr.sharepoint.com,<site-id>,<web-id>
 */
function getSiteId() {
  const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteUrl) {
    console.error('VITE_SHAREPOINT_SITE_URL not configured')
    return ''
  }
  
  try {
    const url = new URL(siteUrl)
    const hostname = url.hostname
    const sitePath = url.pathname.replace('/sites/', '')
    
    // Return in format expected by Graph API
    return `${hostname}:/sites/${sitePath}`
  } catch (error) {
    console.error('Invalid SharePoint site URL:', error)
    return ''
  }
}

/**
 * Create a silent request for acquiring tokens
 * @param {string[]} scopes - Array of scopes to request
 * @returns {Object} Silent request configuration
 */
export const createSilentRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  account: null, // Will be set by the calling code with the current account
  forceRefresh: false
})

/**
 * Create an interactive request for acquiring tokens via popup
 * @param {string[]} scopes - Array of scopes to request
 * @returns {Object} Interactive request configuration
 */
export const createInteractiveRequest = (scopes = loginRequest.scopes) => ({
  scopes,
  prompt: 'consent' // Force consent for additional permissions if needed
})

// =================================================================
// SCOPE DEFINITIONS
// =================================================================
export const SCOPES = {
  // Basic user information
  USER_READ: 'User.Read',
  
  // SharePoint permissions
  SITES_READ_ALL: 'Sites.Read.All',
  SITES_READWRITE_ALL: 'Sites.ReadWrite.All',
  
  // Graph API permissions for future use
  MAIL_READ: 'Mail.Read',
  CALENDARS_READ: 'Calendars.Read',
  
  // Offline access for refresh tokens
  OFFLINE_ACCESS: 'offline_access'
}

// =================================================================
// ERROR HANDLING HELPERS
// =================================================================

/**
 * Check if an error is a specific MSAL error type
 * @param {Error} error - The error to check
 * @param {string} errorType - The MSAL error type to check for
 * @returns {boolean} True if the error matches the type
 */
export const isMsalError = (error, errorType) => {
  return error?.errorCode === errorType || error?.name === errorType
}

/**
 * Common MSAL error codes for easier handling
 */
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