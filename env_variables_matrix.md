# Environment Variables Usage Matrix

## Critical Variables (App Won't Work Without These)

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_CLIENT_ID** | `src/config/msal.js` | `clientId: import.meta.env.VITE_CLIENT_ID` | ❌ Authentication fails completely | ✅ YES |
| **VITE_CLIENT_ID** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_CLIENT_ID** | `src/components/auth/UnauthorizedPage.jsx` | Debug info display | 🟡 Debug info missing | ❌ NO |
| **VITE_TENANT_ID** | `src/config/msal.js` | `authority: https://login.microsoftonline.com/${VITE_TENANT_ID}` | ❌ Authentication fails completely | ✅ YES |
| **VITE_TENANT_ID** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |

## SharePoint Configuration (Data Access Won't Work)

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_SHAREPOINT_SITE_URL** | `src/config/sharepoint.js` | `siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL` | ❌ No SharePoint access | ✅ YES |
| **VITE_SHAREPOINT_SITE_URL** | `src/config/msal.js` | Site ID resolution fallback | 🟡 Fallback method unavailable | ❌ NO |
| **VITE_SHAREPOINT_SITE_URL** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.siteUrl` | ❌ No SharePoint access | ✅ YES |
| **VITE_SHAREPOINT_SITE_URL** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |

## SharePoint List Names (Core Functionality)

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_PARTS_LIST_NAME** | `src/config/sharepoint.js` | `lists.parts: import.meta.env.VITE_PARTS_LIST_NAME` | ❌ Parts management broken | ✅ YES |
| **VITE_PARTS_LIST_NAME** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.lists.parts` | ❌ Parts CRUD operations fail | ✅ YES |
| **VITE_PARTS_LIST_NAME** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_CATEGORIES_LIST_NAME** | `src/config/sharepoint.js` | `lists.categories: import.meta.env.VITE_CATEGORIES_LIST_NAME` | ❌ Category system broken | ✅ YES |
| **VITE_CATEGORIES_LIST_NAME** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.lists.categories` | ❌ Category operations fail | ✅ YES |
| **VITE_CATEGORIES_LIST_NAME** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_BUYERS_LIST_NAME** | `src/config/sharepoint.js` | `lists.buyers: import.meta.env.VITE_BUYERS_LIST_NAME` | ❌ Customer management broken | ✅ YES |
| **VITE_BUYERS_LIST_NAME** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.lists.buyers` | ❌ Buyer CRUD operations fail | ✅ YES |
| **VITE_BUYERS_LIST_NAME** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_INVOICES_LIST_NAME** | `src/config/sharepoint.js` | `lists.invoices: import.meta.env.VITE_INVOICES_LIST_NAME` | ❌ Invoice system broken | ✅ YES |
| **VITE_INVOICES_LIST_NAME** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.lists.invoices` | ❌ Invoice operations fail | ✅ YES |
| **VITE_INVOICES_LIST_NAME** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_TRANSACTIONS_LIST_NAME** | `src/config/sharepoint.js` | `lists.transactions: import.meta.env.VITE_TRANSACTIONS_LIST_NAME` | ❌ Transaction tracking broken | ✅ YES |
| **VITE_TRANSACTIONS_LIST_NAME** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.lists.transactions` | ❌ Transaction operations fail | ✅ YES |
| **VITE_TRANSACTIONS_LIST_NAME** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_AUTHORIZED_USERS_LIST_NAME** | `src/config/sharepoint.js` | `lists.authorizedUsers: import.meta.env.VITE_AUTHORIZED_USERS_LIST_NAME` | ❌ User authorization broken | ✅ YES |
| **VITE_AUTHORIZED_USERS_LIST_NAME** | `src/services/sharepoint.js` | `SHAREPOINT_CONFIG.lists.authorizedUsers` | ❌ User auth checks fail | ✅ YES |
| **VITE_AUTHORIZED_USERS_LIST_NAME** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |

## Optional Variables (Have Defaults)

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_GRAPH_BASE_URL** | `src/config/sharepoint.js` | `graphBaseUrl: import.meta.env.VITE_GRAPH_BASE_URL \|\| 'https://graph.microsoft.com/v1.0'` | ✅ Uses default | ❌ NO |
| **VITE_GRAPH_SCOPES** | `src/config/sharepoint.js` | `scopes: (import.meta.env.VITE_GRAPH_SCOPES \|\| 'User.Read,Sites.ReadWrite.All').split(',')` | ✅ Uses default | ❌ NO |

## UI/Branding Variables (Nice to Have)

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_APP_NAME** | `src/App.jsx` | `{import.meta.env.VITE_APP_NAME}` in UnauthenticatedView | 🟡 Shows undefined in UI | ❌ NO |
| **VITE_COMPANY_NAME** | Not used in provided files | Not found in codebase | ✅ No impact | ❌ NO |

## Debug/Development Variables

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_DEBUG_MODE** | `src/config/msal.js` | Controls MSAL logging level | 🟡 Less verbose logging | ❌ NO |
| **VITE_DEBUG_MODE** | `src/config/sharepoint.js` | Controls debug console logs | 🟡 No debug output | ❌ NO |
| **VITE_DEBUG_MODE** | `src/main.jsx` | Controls development helpers | 🟡 No debug helpers | ❌ NO |
| **VITE_DEBUG_MODE** | `src/App.jsx` | Shows "DEV MODE" indicator | 🟡 No dev indicator | ❌ NO |
| **VITE_DEBUG_MODE** | `src/components/auth/UnauthorizedPage.jsx` | Shows debug error details | 🟡 No debug details | ❌ NO |
| **VITE_ENVIRONMENT** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_ENVIRONMENT** | `src/components/auth/UnauthorizedPage.jsx` | Debug info display | 🟡 Debug info missing | ❌ NO |
| **VITE_APP_VERSION** | `src/main.jsx` | Debug logging only | 🟡 Debug info missing | ❌ NO |
| **VITE_ENABLE_LOGGING** | `src/services/sharepoint.js` | Controls operation success logging | 🟡 Less verbose logging | ❌ NO |

## External Services (Optional Features)

| Variable | File | Line/Usage | Impact if Missing | Required |
|----------|------|------------|-------------------|----------|
| **VITE_ROCKAUTO_SEARCH_URL** | `src/services/external.js` | `baseUrl: import.meta.env.VITE_ROCKAUTO_SEARCH_URL \|\| 'https://www.rockauto.com/en/catalog'` | ✅ Uses default | ❌ NO |
| **VITE_GOOGLE_SEARCH_URL** | `src/services/external.js` | `baseUrl: import.meta.env.VITE_GOOGLE_SEARCH_URL \|\| 'https://www.google.com/search'` | ✅ Uses default | ❌ NO |

## Variables from .env.example NOT USED in Code

These variables are in the example but **NOT actually used** in the current codebase:

- `VITE_DEV_MODE` - Not found in any files
- `VITE_COMPANY_NAME` - Not found in provided files  
- Many external service URLs - Have hardcoded defaults

## FINAL RECOMMENDATION

### **Absolutely Required (8 variables):**
```bash
VITE_CLIENT_ID                    # Authentication fails without it
VITE_TENANT_ID                    # Authentication fails without it  
VITE_SHAREPOINT_SITE_URL          # No data access without it
VITE_PARTS_LIST_NAME              # Parts system broken
VITE_CATEGORIES_LIST_NAME         # Category system broken
VITE_BUYERS_LIST_NAME             # Customer system broken
VITE_INVOICES_LIST_NAME           # Invoice system broken
VITE_TRANSACTIONS_LIST_NAME       # Transaction system broken
VITE_AUTHORIZED_USERS_LIST_NAME   # User authorization broken
```

### **Optional but Recommended (2 variables):**
```bash
VITE_APP_NAME                     # For UI branding
VITE_DEBUG_MODE                   # For development/troubleshooting
```

### **Not Needed (have defaults or unused):**
- All other variables from .env.example