import React from 'react'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * RoleProtected Component - Controls access based on user roles
 * 
 * @param {string} requiredRole - Minimum role required (Admin, User, ReadOnly)
 * @param {React.ReactNode} children - Content to render if authorized
 * @param {React.ReactNode|string} fallback - What to show if unauthorized (default: access denied message)
 * @param {boolean} showLoading - Whether to show loading spinner while checking auth (default: true)
 * @param {string} message - Custom unauthorized message
 * @param {boolean} hideIfUnauthorized - If true, renders null instead of fallback
 */
const RoleProtected = ({
  requiredRole,
  children,
  fallback = null,
  showLoading = true,
  message = null,
  hideIfUnauthorized = false
}) => {
  const { 
    userRole, 
    hasRole, 
    isAuthorized, 
    isAuthLoading,
    authState,
    AUTH_STATES 
  } = useAuth()

  // Show loading spinner while checking authorization
  if (isAuthLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-gray-600">Checking permissions...</span>
      </div>
    )
  }

  // User not authenticated at all
  if (!isAuthorized) {
    if (hideIfUnauthorized) return null
    
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please sign in to access this feature.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has required role
  const hasRequiredRole = hasRole(requiredRole)

  if (!hasRequiredRole) {
    if (hideIfUnauthorized) return null
    
    // Custom fallback provided
    if (fallback !== null) {
      return typeof fallback === 'function' ? fallback() : fallback
    }

    // Default unauthorized message
    const defaultMessage = message || `This feature requires ${requiredRole} access or higher. Your current role: ${userRole || 'Unknown'}.`
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">🚫</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Access Restricted</h3>
            <p className="text-sm text-red-700 mt-1">{defaultMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  // User has required role - render children
  return <>{children}</>
}

/**
 * RoleGate Component - Simpler version that just shows/hides content
 * 
 * @param {string} requiredRole - Minimum role required
 * @param {React.ReactNode} children - Content to render if authorized
 */
export const RoleGate = ({ requiredRole, children }) => {
  return (
    <RoleProtected 
      requiredRole={requiredRole} 
      hideIfUnauthorized={true}
    >
      {children}
    </RoleProtected>
  )
}

/**
 * AdminOnly Component - Shorthand for Admin-only content
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleProtected 
      requiredRole="Admin" 
      fallback={fallback}
      hideIfUnauthorized={!fallback}
    >
      {children}
    </RoleProtected>
  )
}

/**
 * UserAndUp Component - Shorthand for User level and above
 */
export const UserAndUp = ({ children, fallback = null }) => {
  return (
    <RoleProtected 
      requiredRole="User" 
      fallback={fallback}
      hideIfUnauthorized={!fallback}
    >
      {children}
    </RoleProtected>
  )
}

/**
 * HOC for protecting entire components
 * 
 * @param {React.Component} Component - Component to protect
 * @param {string} requiredRole - Minimum role required
 * @param {Object} options - Additional options
 */
export const withRoleProtection = (Component, requiredRole, options = {}) => {
  const ProtectedComponent = (props) => {
    return (
      <RoleProtected 
        requiredRole={requiredRole}
        {...options}
      >
        <Component {...props} />
      </RoleProtected>
    )
  }
  
  ProtectedComponent.displayName = `withRoleProtection(${Component.displayName || Component.name})`
  return ProtectedComponent
}

/**
 * Hook for conditional rendering based on roles
 * 
 * @param {string} requiredRole - Role to check
 * @returns {boolean} Whether user has required role
 */
export const useRoleCheck = (requiredRole) => {
  const { hasRole, isAuthorized } = useAuth()
  
  if (!isAuthorized) return false
  return hasRole(requiredRole)
}

export default RoleProtected