import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { PermissionUtils, FIELD_PERMISSIONS } from '../utils/rolePermissions'

/**
 * Role hierarchy definition
 */
const ROLE_HIERARCHY = {
  'ReadOnly': 1,
  'User': 2, 
  'Admin': 3
}

/**
 * Hook for role-based access control
 * @param {string} requiredRole - Minimum role required
 * @returns {Object} Access control utilities
 */
export const useRoleAccess = (requiredRole = null) => {
  const { 
    userRole, 
    hasRole, 
    hasPermission, 
    isAuthorized, 
    isAuthLoading,
    authState 
  } = useAuth()

  const accessUtils = useMemo(() => {
    // Get numeric role levels
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0
    const requiredRoleLevel = requiredRole ? ROLE_HIERARCHY[requiredRole] || 0 : 0

    // Basic access check
    const canAccess = isAuthorized && (requiredRole ? hasRole(requiredRole) : true)
    
    // Role comparison utilities
    const isExactRole = (role) => userRole === role
    const isAtLeastRole = (role) => userRoleLevel >= (ROLE_HIERARCHY[role] || 0)
    const isHigherThanRole = (role) => userRoleLevel > (ROLE_HIERARCHY[role] || 0)
    
    // Specific role checks
    const isAdmin = userRole === 'Admin'
    const isUser = userRole === 'User'
    const isReadOnly = userRole === 'ReadOnly'
    
    // Access level checks
    const hasAdminAccess = isAtLeastRole('Admin')
    const hasUserAccess = isAtLeastRole('User')
    const hasReadOnlyAccess = isAtLeastRole('ReadOnly')
    
    // Permission utilities
    const canEdit = hasUserAccess
    const canDelete = hasAdminAccess
    const canCreate = hasUserAccess
    const canVoid = hasAdminAccess
    const canExport = hasReadOnlyAccess
    const canView = hasReadOnlyAccess

    // Field-level access checks
    const canAccessField = (formType, fieldName) => {
      return PermissionUtils.canAccessField(userRole, formType, fieldName)
    }

    const getAccessibleFields = (formType) => {
      return PermissionUtils.getAccessibleFields(userRole, formType)
    }

    const getRestrictedFields = (formType) => {
      return PermissionUtils.getRestrictedFields(userRole, formType)
    }

    const isFieldRestricted = (formType, fieldName) => {
      return !PermissionUtils.canAccessField(userRole, formType, fieldName)
    }

    // Bulk operation utilities
    const canBulkSelect = PermissionUtils.canPerformBulkOperation(userRole, 'select')
    const canBulkDelete = PermissionUtils.canPerformBulkOperation(userRole, 'delete')
    const canBulkExport = PermissionUtils.canPerformBulkOperation(userRole, 'export')

    const getBulkPermissions = () => ({
      canSelect: canBulkSelect,
      canDelete: canBulkDelete,
      canExport: canBulkExport
    })

    // Component access utilities
    const canPerformAction = (component, action) => {
      return PermissionUtils.canPerformAction(userRole, component, action)
    }

    const canAccessEditingPoint = (component, editingPoint) => {
      return PermissionUtils.canAccessEditingPoint(userRole, component, editingPoint)
    }

    const getRiskLevel = (component, editingPoint) => {
      return PermissionUtils.getRiskLevel(component, editingPoint)
    }

    return {
      // Basic access
      canAccess,
      userRole,
      userRoleLevel,
      requiredRoleLevel,
      
      // Role checks
      isExactRole,
      isAtLeastRole,
      isHigherThanRole,
      
      // Specific roles
      isAdmin,
      isUser,
      isReadOnly,
      
      // Access levels
      hasAdminAccess,
      hasUserAccess,
      hasReadOnlyAccess,
      
      // Common permissions
      canEdit,
      canDelete,
      canCreate,
      canVoid,
      canExport,
      canView,
      
      // Field-level access
      canAccessField,
      getAccessibleFields,
      getRestrictedFields,
      isFieldRestricted,
      
      // Bulk operations
      canBulkSelect,
      canBulkDelete,
      canBulkExport,
      getBulkPermissions,
      
      // Component access
      canPerformAction,
      canAccessEditingPoint,
      getRiskLevel,
      
      // Auth state
      isAuthorized,
      isAuthLoading
    }
  }, [userRole, requiredRole, hasRole, isAuthorized, isAuthLoading])

  return accessUtils
}

/**
 * Hook for form field access control
 * @param {string} formType - Type of form (partForm, buyerForm, etc.)
 * @returns {Object} Field access utilities
 */
export const useFormFieldAccess = (formType) => {
  const { userRole } = useAuth()
  
  return useMemo(() => {
    const accessibleFields = PermissionUtils.getAccessibleFields(userRole, formType)
    const restrictedFields = PermissionUtils.getRestrictedFields(userRole, formType)
    
    const canAccessField = (fieldName) => {
      return PermissionUtils.canAccessField(userRole, formType, fieldName)
    }
    
    const isFieldRestricted = (fieldName) => {
      return !canAccessField(fieldName)
    }
    
    const shouldDisableField = (fieldName) => {
      return isFieldRestricted(fieldName)
    }
    
    const getFieldConfig = (fieldName) => {
      const canAccess = canAccessField(fieldName)
      return {
        disabled: !canAccess,
        readonly: !canAccess,
        hidden: false, // Fields are shown but disabled if no access
        accessible: canAccess
      }
    }
    
    const filterFieldsByAccess = (fields) => {
      return fields.filter(field => canAccessField(field))
    }
    
    return {
      formType,
      userRole,
      accessibleFields,
      restrictedFields,
      canAccessField,
      isFieldRestricted,
      shouldDisableField,
      getFieldConfig,
      filterFieldsByAccess
    }
  }, [formType, userRole])
}

/**
 * Hook for bulk operations access control
 * @param {string} component - Component name (parts, buyers, etc.)
 * @returns {Object} Bulk operation utilities
 */
export const useBulkOperations = (component = null) => {
  const { userRole } = useAuth()
  
  return useMemo(() => {
    const canSelect = PermissionUtils.canPerformBulkOperation(userRole, 'select')
    const canDelete = PermissionUtils.canPerformBulkOperation(userRole, 'delete')
    const canExport = PermissionUtils.canPerformBulkOperation(userRole, 'export')
    
    const getBulkActions = () => {
      const actions = []
      
      if (canExport) actions.push('export')
      if (canDelete) actions.push('delete')
      
      return actions
    }
    
    const shouldShowSelectionControls = () => {
      return canSelect || canDelete || canExport
    }
    
    const shouldShowBulkActions = () => {
      return canDelete || canExport
    }
    
    const getSelectionConfig = () => ({
      showCheckboxes: canSelect,
      showSelectAll: canSelect,
      enableMultiSelect: canSelect
    })
    
    const getBulkActionConfig = () => ({
      showDeleteButton: canDelete,
      showExportButton: canExport,
      enableBulkDelete: canDelete,
      enableBulkExport: canExport
    })
    
    return {
      component,
      userRole,
      canSelect,
      canDelete,
      canExport,
      getBulkActions,
      shouldShowSelectionControls,
      shouldShowBulkActions,
      getSelectionConfig,
      getBulkActionConfig
    }
  }, [component, userRole])
}

/**
 * Hook for filtering form data based on role permissions
 * @param {Object} formData - Form data object
 * @param {string} formType - Type of form
 * @returns {Object} Filtered form data and utilities
 */
export const useRoleFormData = (formData = {}, formType) => {
  const { getAccessibleFields, getRestrictedFields, canAccessField } = useFormFieldAccess(formType)
  
  return useMemo(() => {
    const filteredData = {}
    const restrictedData = {}
    
    // Filter form data by field access
    Object.entries(formData).forEach(([key, value]) => {
      if (canAccessField(key)) {
        filteredData[key] = value
      } else {
        restrictedData[key] = value
      }
    })
    
    const getDisplayValue = (fieldName, defaultValue = '') => {
      if (canAccessField(fieldName)) {
        return formData[fieldName] || defaultValue
      }
      return '***' // Masked value for restricted fields
    }
    
    const isFieldVisible = (fieldName) => {
      return canAccessField(fieldName)
    }
    
    const getFieldProps = (fieldName) => ({
      disabled: !canAccessField(fieldName),
      readOnly: !canAccessField(fieldName),
      value: getDisplayValue(fieldName),
      'data-restricted': !canAccessField(fieldName)
    })
    
    return {
      filteredData,
      restrictedData,
      accessibleFields: getAccessibleFields,
      restrictedFields: getRestrictedFields,
      getDisplayValue,
      isFieldVisible,
      getFieldProps,
      hasRestrictedFields: getRestrictedFields.length > 0
    }
  }, [formData, formType, getAccessibleFields, getRestrictedFields, canAccessField])
}

/**
 * Hook for component editing points access
 * @param {string} component - Component name
 * @returns {Object} Editing points access utilities
 */
export const useEditingPoints = (component) => {
  const { userRole } = useAuth()
  
  return useMemo(() => {
    const canAccessPoint = (editingPoint) => {
      return PermissionUtils.canAccessEditingPoint(userRole, component, editingPoint)
    }
    
    const getRiskLevel = (editingPoint) => {
      return PermissionUtils.getRiskLevel(component, editingPoint)
    }
    
    const filterPointsByRisk = (riskLevel) => {
      return PermissionUtils.getEditingPointsByRisk(riskLevel)
        .filter(point => point.component === component)
    }
    
    const getAccessiblePoints = () => {
      const allPoints = PermissionUtils.getEditingPointsByRisk('low')
        .concat(PermissionUtils.getEditingPointsByRisk('medium'))
        .concat(PermissionUtils.getEditingPointsByRisk('high'))
        .filter(point => point.component === component)
      
      return allPoints.filter(point => canAccessPoint(point.point))
    }
    
    const getRestrictedPoints = () => {
      const allPoints = PermissionUtils.getEditingPointsByRisk('low')
        .concat(PermissionUtils.getEditingPointsByRisk('medium'))
        .concat(PermissionUtils.getEditingPointsByRisk('high'))
        .filter(point => point.component === component)
      
      return allPoints.filter(point => !canAccessPoint(point.point))
    }
    
    return {
      component,
      userRole,
      canAccessPoint,
      getRiskLevel,
      filterPointsByRisk,
      getAccessiblePoints,
      getRestrictedPoints
    }
  }, [component, userRole])
}

/**
 * Hook for checking multiple roles at once
 * @param {Array} roles - Array of roles to check
 * @returns {Object} Role check results
 */
export const useMultiRoleCheck = (roles = []) => {
  const { hasRole, userRole } = useAuth()
  
  return useMemo(() => {
    const results = {}
    
    roles.forEach(role => {
      results[role] = hasRole(role)
    })
    
    return {
      ...results,
      hasAnyRole: roles.some(role => hasRole(role)),
      hasAllRoles: roles.every(role => hasRole(role)),
      userRole
    }
  }, [roles, hasRole, userRole])
}

/**
 * Hook for permission-based access (future extension)
 * @param {Array} permissions - Array of permissions to check
 * @returns {Object} Permission check results
 */
export const usePermissionCheck = (permissions = []) => {
  const { hasPermission, userRole } = useAuth()
  
  return useMemo(() => {
    const results = {}
    
    permissions.forEach(permission => {
      results[permission] = hasPermission(permission)
    })
    
    return {
      ...results,
      hasAnyPermission: permissions.some(perm => hasPermission(perm)),
      hasAllPermissions: permissions.every(perm => hasPermission(perm)),
      userRole
    }
  }, [permissions, hasPermission, userRole])
}

/**
 * Hook for component-specific access control
 * @param {string} component - Component name
 * @param {string} action - Action type (view, edit, delete, create)
 * @returns {Object} Component access utilities
 */
export const useComponentAccess = (component, action = 'view') => {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    canCreate, 
    canVoid,
    isAdmin,
    isUser,
    isReadOnly 
  } = useRoleAccess()

  return useMemo(() => {
    // Component-specific access rules
    const accessRules = {
      dashboard: {
        view: canView,
        export: canView
      },
      parts: {
        view: canView,
        create: canCreate,
        edit: canEdit,
        delete: canDelete,
        export: canView
      },
      buyers: {
        view: canView,
        create: canCreate,
        edit: canEdit,
        delete: canDelete,
        export: canView
      },
      invoices: {
        view: canView,
        create: canCreate,
        void: canVoid,
        export: canView
      },
      transactions: {
        view: canView,
        create: canCreate,
        export: canView
      },
      external: {
        view: canView,
        search: canView
      }
    }

    const componentRules = accessRules[component] || {}
    const hasAccess = componentRules[action] || false

    return {
      hasAccess,
      component,
      action,
      isAdmin,
      isUser,
      isReadOnly,
      allActions: componentRules
    }
  }, [component, action, canView, canEdit, canDelete, canCreate, canVoid, isAdmin, isUser, isReadOnly])
}

/**
 * Hook for filtering data based on role
 * @param {Array} data - Data to filter
 * @param {Function} filterFn - Filter function that receives (item, roleUtils)
 * @returns {Array} Filtered data
 */
export const useRoleFilteredData = (data = [], filterFn = null) => {
  const roleUtils = useRoleAccess()
  
  return useMemo(() => {
    if (!filterFn || !Array.isArray(data)) return data
    
    return data.filter(item => filterFn(item, roleUtils))
  }, [data, filterFn, roleUtils])
}

/**
 * Hook for role-based navigation filtering
 * @param {Array} navItems - Navigation items
 * @returns {Array} Filtered navigation items
 */
export const useRoleNavigation = (navItems = []) => {
  const { isAdmin, isUser, isReadOnly, canAccess } = useRoleAccess()
  
  return useMemo(() => {
    return navItems.filter(item => {
      if (!item.requiredRole) return true
      
      switch (item.requiredRole) {
        case 'Admin':
          return isAdmin
        case 'User':
          return isUser || isAdmin
        case 'ReadOnly':
          return isReadOnly || isUser || isAdmin
        default:
          return canAccess
      }
    })
  }, [navItems, isAdmin, isUser, isReadOnly, canAccess])
}

/**
 * Utility functions for role management
 */
export const roleUtils = {
  /**
   * Get all available roles
   */
  getAllRoles: () => Object.keys(ROLE_HIERARCHY),
  
  /**
   * Get role hierarchy
   */
  getRoleHierarchy: () => ROLE_HIERARCHY,
  
  /**
   * Compare two roles
   */
  compareRoles: (role1, role2) => {
    const level1 = ROLE_HIERARCHY[role1] || 0
    const level2 = ROLE_HIERARCHY[role2] || 0
    return level1 - level2
  },
  
  /**
   * Check if role1 is higher than role2
   */
  isHigherRole: (role1, role2) => {
    return roleUtils.compareRoles(role1, role2) > 0
  },
  
  /**
   * Get minimum role from array
   */
  getMinimumRole: (roles) => {
    return roles.reduce((min, current) => 
      roleUtils.compareRoles(current, min) < 0 ? current : min
    )
  },
  
  /**
   * Get maximum role from array
   */
  getMaximumRole: (roles) => {
    return roles.reduce((max, current) => 
      roleUtils.compareRoles(current, max) > 0 ? current : max
    )
  }
}

export default useRoleAccess