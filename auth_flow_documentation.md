# Authentication & Authorization Flow Documentation

## Overview

This document outlines the complete authentication and authorization flow for the Santana Inventory Management Application. The system implements a **two-layer security model** with Azure AD authentication and SharePoint-based authorization.

## Architecture

### Security Layers

1. **Azure AD Authentication** - Verifies organizational identity
2. **SharePoint Authorization** - Validates application-specific permissions

### Core Components

```
main.jsx (MSAL Setup)
    ↓
App.jsx (AuthProvider + ToastProvider)
    ↓
AuthenticatedTemplate / UnauthenticatedTemplate
    ↓
AuthorizedApp (Authorization State Handler)
    ↓
BrowserRouter + Routes (Authorized Users Only)
```

## Detailed Flow

### 1. Application Initialization

**File: `main.jsx`**

```javascript
// MSAL instance creation
const msalInstance = new PublicClientApplication(msalConfig)
await msalInstance.handleRedirectPromise()

// App rendering
<MsalProvider instance={msalInstance}>
  <App />
</MsalProvider>
```

**Responsibilities:**
- Initialize MSAL with configuration
- Handle redirect promises from login
- Provide MSAL context to entire app
- Enhanced error boundary for React errors
- Development debugging helpers

### 2. Authentication Context Setup

**File: `src/context/AuthContext.jsx`**

```javascript
const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING)
  const [userRole, setUserRole] = useState(null)
  const [authorizationChecked, setAuthorizationChecked] = useState(false)
  
  // Authentication + Authorization logic
}
```

**Key States:**
- `AUTH_STATES.LOADING` - Checking authentication/authorization
- `AUTH_STATES.AUTHORIZED` - User has access to the application
- `AUTH_STATES.UNAUTHORIZED` - User denied access

**Functions:**
- `signIn()` - Initiates Azure AD login
- `signOut()` - Logs out with cache cleanup
- `validateUserAuthorization()` - Checks SharePoint whitelist
- `retryAuthorization()` - Manual retry for failed authorization

### 3. App-Level State Management

**File: `src/App.jsx`**

```javascript
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthenticatedTemplate>
          <AuthorizedApp />
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <UnauthenticatedView />
        </UnauthenticatedTemplate>
      </ToastProvider>
    </AuthProvider>
  )
}
```

**AuthorizedApp Component:**
```javascript
const AuthorizedApp = () => {
  const { authState, isAuthorized, isUnauthorized, isAuthLoading } = useAuth()
  
  if (isAuthLoading) return <AppLoader />
  if (isUnauthorized) return <UnauthorizedPage />
  if (isAuthorized) return <AuthorizedAppRoutes />
  
  return <AppLoader />
}
```

## State Flow Diagram

```
┌─────────────────┐
│   App Starts    │
│   (Loading)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  MSAL Checks    │
│  Authentication │
└─────────┬───────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼
┌─────────┐ ┌─────────────┐
│  Not    │ │ Authenticated│
│  Auth   │ │             │
└─────────┘ └─────────────┘
     │             │
     ▼             ▼
┌─────────┐ ┌─────────────┐
│ Login   │ │ SharePoint  │
│ Screen  │ │ Auth Check  │
└─────────┘ └─────────────┘
                   │
              ┌────┴────┐
              │         │
              ▼         ▼
      ┌─────────┐ ┌─────────┐
      │ Denied  │ │Authorized│
      │ Access  │ │         │
      └─────────┘ └─────────┘
              │         │
              ▼         ▼
      ┌─────────┐ ┌─────────┐
      │Unauthorized│ Main   │
      │   Page   │  App    │
      └─────────┘ └─────────┘
```

## User Experience Flow

### 1. Unauthenticated User
```
Landing Page → Sign In Button → Azure AD Login → Authorization Check
```

### 2. Authenticated but Unauthorized User
```
Azure AD Success → SharePoint Check → Access Denied → UnauthorizedPage
```

### 3. Authorized User
```
Azure AD Success → SharePoint Check → Authorized → Main Application
```

## Component Details

### AuthProvider (`src/context/AuthContext.jsx`)

**Purpose:** Manages authentication and authorization state

**Key Features:**
- MSAL integration for Azure AD authentication
- SharePoint authorization validation
- Retry logic for failed authorization
- Role-based access control
- Token management

**State Management:**
```javascript
// Authentication State
const [user, setUser] = useState(null)
const [accessToken, setAccessToken] = useState(null)
const [isAuthenticated, setIsAuthenticated] = useState(false)

// Authorization State
const [authState, setAuthState] = useState(AUTH_STATES.LOADING)
const [userRole, setUserRole] = useState(null)
const [authorizationChecked, setAuthorizationChecked] = useState(false)
```

### AuthorizedApp (`src/App.jsx`)

**Purpose:** Routes users based on authorization state

**Logic:**
```javascript
if (isAuthLoading) return <AppLoader message="Verifying permissions..." />
if (isUnauthorized) return <UnauthorizedPage />
if (isAuthorized) return <AuthorizedAppRoutes />
```

### UnauthorizedPage (`src/components/auth/UnauthorizedPage.jsx`)

**Purpose:** Handles denied access scenarios

**Features:**
- Clear error messaging
- Manual retry authorization
- Secure logout with cache cleanup
- User information display
- Debug information (development mode)

### AuthorizedAppRoutes (`src/App.jsx`)

**Purpose:** Main application routing (authorized users only)

**Security:** 
- Only renders for authorized users
- Contains all application routes
- Wrapped in BrowserRouter for routing

## Security Considerations

### 1. Route Protection
- **No route exposure**: Unauthorized users never reach React Router
- **State isolation**: Authorization state separate from authentication
- **Router containment**: BrowserRouter only wraps authorized application

### 2. Token Management
- **Silent token refresh**: Automatic token renewal
- **Secure logout**: Clears all caches and redirects
- **Token validation**: Checks token before SharePoint operations

### 3. Error Handling
- **Authorization errors**: Separate from authentication errors
- **Retry mechanism**: Automatic retry for transient failures
- **Graceful degradation**: Fallback UI for error states

## Development Guidelines

### Adding New Protected Routes

```javascript
// In AuthorizedAppRoutes component
<Route path="/new-feature" element={<NewFeatureComponent />} />
```

### Role-Based Access Control

```javascript
// In any component
const { hasRole } = useAuth()

if (hasRole('Admin')) {
  return <AdminOnlyFeature />
}
```

### Checking Authorization State

```javascript
// Using authorization-specific hook
const { isAuthorized, isUnauthorized, authorizationError } = useAuthorizationState()

// Using main auth hook
const { authState, AUTH_STATES } = useAuth()
```

## Error Scenarios

### 1. Authentication Failures
- **User cancels login**: Returns to login screen
- **Network error**: Shows retry option
- **Invalid credentials**: Azure AD handles error display

### 2. Authorization Failures
- **User not in whitelist**: Shows UnauthorizedPage
- **SharePoint unavailable**: Shows retry option with error message
- **Permission changes**: User automatically logged out

### 3. Application Errors
- **React errors**: Caught by ErrorBoundary in main.jsx
- **Authorization errors**: Caught by AuthorizationErrorBoundary in App.jsx

## Configuration

### Environment Variables

```bash
# Azure AD Configuration
VITE_CLIENT_ID=your-client-id
VITE_TENANT_ID=your-tenant-id

# SharePoint Configuration
VITE_SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/yoursite
VITE_AUTHORIZED_USERS_LIST_NAME=simt_AuthorizedUsers

# Development
VITE_DEBUG_MODE=true
VITE_ENVIRONMENT=development
```

### MSAL Configuration

```javascript
// src/config/msal.js
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
}
```

## Debugging

### Development Mode Features

1. **Console Logging**: Detailed auth state changes
2. **Debug Helpers**: `window.debugAuth()` function
3. **Performance Monitoring**: App load time tracking
4. **Error Details**: Component stacks and error information

### Debug Commands

```javascript
// In browser console (development mode)
window.debugAuth()         // Shows current auth state
window.msalInstance        // Direct MSAL instance access
```

## Testing Considerations

### Unit Testing

```javascript
// Mock auth context for testing
const mockAuthContext = {
  authState: AUTH_STATES.AUTHORIZED,
  isAuthorized: true,
  userRole: 'User',
  hasRole: jest.fn()
}
```

### Integration Testing

```javascript
// Test authorization flow
test('unauthorized user sees denied page', () => {
  render(<App />, { wrapper: mockUnauthorizedProvider })
  expect(screen.getByText('Access Denied')).toBeInTheDocument()
})
```

## Performance Considerations

### 1. Loading States
- **Progressive loading**: Different messages for different states
- **Optimistic updates**: Immediate feedback for user actions
- **Skeleton screens**: Loading placeholders where appropriate

### 2. Caching Strategy
- **Authorization cache**: 10-minute cache for authorization checks
- **Token cache**: MSAL handles token caching automatically
- **Component lazy loading**: Routes are lazy-loaded

## Maintenance

### Adding New Users

1. Navigate to SharePoint `simt_AuthorizedUsers` list
2. Add new item with:
   - **Title**: User's email address
   - **DisplayName**: User's full name
   - **Role**: Admin/User/ReadOnly
   - **IsActive**: Yes

### Removing User Access

1. Edit user record in `simt_AuthorizedUsers` list
2. Set **IsActive** to "No"
3. User will be denied access on next login

### Monitoring

- **Authentication failures**: Check Azure AD logs
- **Authorization failures**: Check SharePoint access logs
- **Application errors**: Check browser console and error boundaries

## Future Enhancements

### Potential Improvements

1. **Department-based access**: Filter by organizational units
2. **Time-based access**: Temporary access with expiration
3. **Audit logging**: Detailed access logs for compliance
4. **Self-service**: User access request workflow
5. **Multi-factor authentication**: Enhanced security requirements

### Technical Debt

- **Error recovery**: Enhanced retry mechanisms
- **Testing coverage**: Comprehensive auth flow testing
- **Performance optimization**: Reduce authorization check frequency
- **Accessibility**: Improved screen reader support

## Conclusion

This authentication and authorization flow provides:

- **Security**: Multi-layer protection with Azure AD and SharePoint
- **User Experience**: Clear feedback and graceful error handling
- **Maintainability**: Clear separation of concerns and well-documented code
- **Scalability**: Easy to extend with new roles and permissions
- **Debugging**: Comprehensive development tools and logging

The system successfully addresses the original security gap while providing a robust, user-friendly, and maintainable authentication solution.