// =================================================================
// ROLE PERMISSIONS CONFIGURATION
// =================================================================
// Central configuration for role-based access control

/**
 * Role hierarchy levels (higher number = more permissions)
 */
export const ROLE_LEVELS = {
  'ReadOnly': 1,
  'User': 2,
  'Admin': 3
}

/**
 * Base permissions by role
 */
export const ROLE_PERMISSIONS = {
  ReadOnly: [
    'view_dashboard',
    'view_parts',
    'view_buyers', 
    'view_invoices',
    'view_transactions',
    'view_external',
    'export_data',
    'search_parts',
    'view_reports'
  ],
  User: [
    // Inherit ReadOnly permissions
    ...['view_dashboard', 'view_parts', 'view_buyers', 'view_invoices', 'view_transactions', 'view_external', 'export_data', 'search_parts', 'view_reports'],
    // Add User-specific permissions
    'create_parts',
    'edit_parts',
    'edit_part_description',
    'edit_part_category',
    'edit_part_unit_price',
    'edit_part_supplier',
    'edit_part_notes',
    'create_buyers',
    'edit_buyers',
    'create_invoices',
    'create_transactions',
    'bulk_select',
    'advanced_search'
  ],
  Admin: [
    // Inherit User permissions
    ...['view_dashboard', 'view_parts', 'view_buyers', 'view_invoices', 'view_transactions', 'view_external', 'export_data', 'search_parts', 'view_reports', 'create_parts', 'edit_parts', 'edit_part_description', 'edit_part_category', 'edit_part_unit_price', 'edit_part_supplier', 'edit_part_notes', 'create_buyers', 'edit_buyers', 'create_invoices', 'create_transactions', 'bulk_select', 'advanced_search'],
    // Add Admin-specific permissions
    'edit_part_unit_cost',
    'edit_part_status',
    'delete_parts',
    'delete_buyers',
    'void_invoices',
    'bulk_delete',
    'system_admin',
    'user_management',
    'configure_system'
  ]
}

/**
 * Component-specific permission mappings
 */
export const COMPONENT_PERMISSIONS = {
  dashboard: {
    view: ['view_dashboard'],
    export: ['export_data'],
    refresh: ['view_dashboard'],
    chart_toggles: ['view_dashboard'],
    view_details: ['view_dashboard']
  },
  
  parts: {
    view: ['view_parts'],
    create: ['create_parts'],
    edit: ['edit_parts'],
    delete: ['delete_parts'],
    export: ['export_data'],
    search: ['search_parts'],
    bulk_select: ['bulk_select'],
    bulk_delete: ['bulk_delete'],
    view_details: ['view_parts'],
    view_transactions: ['view_transactions']
  },
  
  buyers: {
    view: ['view_buyers'],
    create: ['create_buyers'],
    edit: ['edit_buyers'],
    delete: ['delete_buyers'],
    export: ['export_data'],
    search: ['search_parts'],
    bulk_select: ['bulk_select'],
    bulk_delete: ['bulk_delete']
  },
  
  invoices: {
    view: ['view_invoices'],
    create: ['create_invoices'],
    void: ['void_invoices'],
    export: ['export_data'],
    search: ['search_parts'],
    view_details: ['view_invoices'],
    print: ['view_invoices']
  },
  
  transactions: {
    view: ['view_transactions'],
    create: ['create_transactions'],
    export: ['export_data'],
    search: ['search_parts'],
    view_history: ['view_transactions']
  },
  
  external: {
    view: ['view_external'],
    search: ['search_parts'],
    advanced_search: ['advanced_search']
  },

  layout: {
    view_nav: ['view_dashboard'],
    create_shortcuts: ['create_parts', 'create_buyers', 'create_invoices', 'create_transactions'],
    mobile_menu: ['view_dashboard']
  }
}

/**
 * Action-based permission requirements
 */
export const ACTION_PERMISSIONS = {
  // CRUD Operations
  create: ['create_parts', 'create_buyers', 'create_invoices', 'create_transactions'],
  read: ['view_dashboard', 'view_parts', 'view_buyers', 'view_invoices', 'view_transactions'],
  update: ['edit_parts', 'edit_buyers'],
  delete: ['delete_parts', 'delete_buyers', 'void_invoices'],
  
  // Bulk Operations
  bulk_select: ['bulk_select'],
  bulk_delete: ['bulk_delete'],
  bulk_export: ['export_data'],
  
  // System Operations
  export: ['export_data'],
  search: ['search_parts'],
  advanced_search: ['advanced_search'],
  system_config: ['configure_system'],
  user_admin: ['user_management']
}

/**
 * Field-level permissions for forms
 */
export const FIELD_PERMISSIONS = {
  // Part Form Fields
  partForm: {
    partId: ['create_parts', 'edit_parts'],
    description: ['edit_part_description'],
    category: ['edit_part_category'],
    unitCostCreate: ['create_parts'], // User can set during creation
    unitCostEdit: ['edit_part_unit_cost'], // Admin only for editing
    unitPrice: ['edit_part_unit_price'],
    inventoryOnHand: ['create_parts'], // Create only
    status: ['edit_part_status'], // Admin only
    supplier: ['edit_part_supplier'],
    notes: ['edit_part_notes']
  },

  // Buyer Form Fields
  buyerForm: {
    buyerName: ['create_buyers', 'edit_buyers'],
    contactEmail: ['create_buyers', 'edit_buyers'],
    phone: ['create_buyers', 'edit_buyers']
  },

  // Invoice Form Fields
  invoiceForm: {
    invoiceNumber: ['view_invoices'], // Display only
    buyer: ['create_invoices'],
    invoiceDate: ['create_invoices'],
    notes: ['create_invoices'],
    lineItems: ['create_invoices'],
    finalizeInvoice: ['create_invoices']
  },

  // Transaction Form Fields
  transactionForm: {
    transactionType: ['create_transactions'],
    partSelection: ['create_transactions'],
    quantity: ['create_transactions'],
    receiptDate: ['create_transactions'],
    supplier: ['create_transactions'],
    notes: ['create_transactions']
  }
}

/**
 * Risk level classifications for editing points
 */
export const RISK_LEVELS = {
  LOW: 'low',        // Read-only, view operations
  MEDIUM: 'medium',  // Standard CRUD operations
  HIGH: 'high'       // Destructive operations, system admin
}

/**
 * Editing points access matrix from documentation
 */
export const EDITING_POINTS_ACCESS = {
  // Dashboard - All users have full access
  dashboard: {
    chart_toggles: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    view_details: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    data_refresh: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  },
  
  // Parts Management
  partsTable: {
    add_new_part: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    search_input: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    filters: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    select_all: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    row_checkboxes: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    bulk_delete: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    export_selected: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    edit_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    view_part_link: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  },

  partForm: {
    part_id_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    description_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    category_dropdown: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    unit_cost_input: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    unit_price_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    inventory_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    status_dropdown: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    supplier_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    notes_textarea: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    create_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    update_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM }
  },

  partDetails: {
    edit_part: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    delete_part: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    create_transaction: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    view_tabs: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  },
  
  // Buyers Management
  buyersTable: {
    add_buyer: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    search_input: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    filters: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    select_all: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    row_checkboxes: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    delete_selected: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    edit_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    communication_links: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  },

  buyerForm: {
    buyer_name: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    contact_email: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    phone: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    create_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    update_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM }
  },
  
  // Invoice Management
  invoiceList: {
    create_invoice: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    search_input: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    filters: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    void_invoice: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    view_invoice_link: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  },

  invoiceForm: {
    invoice_number: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    buyer_dropdown: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    invoice_date: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    notes: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    line_items: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    finalize_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.HIGH }
  },

  invoiceDetails: {
    void_invoice: { roles: ['Admin'], risk: RISK_LEVELS.HIGH },
    print_invoice: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    status_update: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM }
  },
  
  // Transaction Management
  transactionHistory: {
    log_inbound: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    search_input: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    filters: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    export_button: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    part_links: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  },

  transactionForm: {
    transaction_type: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    part_selection: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    quantity_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    date_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    supplier_input: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    notes_textarea: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    log_button: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM }
  },

  // Layout Navigation
  layout: {
    dashboard_link: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    view_links: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW },
    create_shortcuts: { roles: ['User', 'Admin'], risk: RISK_LEVELS.MEDIUM },
    mobile_menu: { roles: ['ReadOnly', 'User', 'Admin'], risk: RISK_LEVELS.LOW }
  }
}

/**
 * Permission checking utilities
 */
export const PermissionUtils = {
  /**
   * Check if role has specific permission
   */
  hasPermission: (userRole, permission) => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.includes(permission)
  },

  /**
   * Check if role can perform action on component
   */
  canPerformAction: (userRole, component, action) => {
    const componentPerms = COMPONENT_PERMISSIONS[component]
    if (!componentPerms || !componentPerms[action]) return false
    
    const requiredPermissions = componentPerms[action]
    const userPermissions = ROLE_PERMISSIONS[userRole] || []
    
    return requiredPermissions.some(perm => userPermissions.includes(perm))
  },

  /**
   * Check if role can access specific form field
   */
  canAccessField: (userRole, formType, fieldName) => {
    const fieldPerms = FIELD_PERMISSIONS[formType]?.[fieldName]
    if (!fieldPerms) return true // Default to accessible if not specified
    
    const userPermissions = ROLE_PERMISSIONS[userRole] || []
    return fieldPerms.some(perm => userPermissions.includes(perm))
  },

  /**
   * Get accessible fields for a form
   */
  getAccessibleFields: (userRole, formType) => {
    const formFields = FIELD_PERMISSIONS[formType] || {}
    const accessible = []
    
    for (const [fieldName, requiredPerms] of Object.entries(formFields)) {
      if (PermissionUtils.canAccessField(userRole, formType, fieldName)) {
        accessible.push(fieldName)
      }
    }
    
    return accessible
  },

  /**
   * Get restricted fields for a form
   */
  getRestrictedFields: (userRole, formType) => {
    const formFields = FIELD_PERMISSIONS[formType] || {}
    const restricted = []
    
    for (const [fieldName, requiredPerms] of Object.entries(formFields)) {
      if (!PermissionUtils.canAccessField(userRole, formType, fieldName)) {
        restricted.push(fieldName)
      }
    }
    
    return restricted
  },

  /**
   * Check access to editing point
   */
  canAccessEditingPoint: (userRole, component, editingPoint) => {
    const access = EDITING_POINTS_ACCESS[component]?.[editingPoint]
    if (!access) return false
    
    return access.roles.includes(userRole)
  },

  /**
   * Check bulk operation permissions
   */
  canPerformBulkOperation: (userRole, operationType) => {
    const userPermissions = ROLE_PERMISSIONS[userRole] || []
    
    switch (operationType) {
      case 'select':
        return userPermissions.includes('bulk_select')
      case 'delete':
        return userPermissions.includes('bulk_delete')
      case 'export':
        return userPermissions.includes('export_data')
      default:
        return false
    }
  },

  /**
   * Get risk level for action
   */
  getRiskLevel: (component, editingPoint) => {
    return EDITING_POINTS_ACCESS[component]?.[editingPoint]?.risk || RISK_LEVELS.LOW
  },

  /**
   * Get all permissions for role
   */
  getRolePermissions: (userRole) => {
    return ROLE_PERMISSIONS[userRole] || []
  },

  /**
   * Check if role is at least minimum level
   */
  isAtLeastRole: (userRole, minimumRole) => {
    const userLevel = ROLE_LEVELS[userRole] || 0
    const minimumLevel = ROLE_LEVELS[minimumRole] || 0
    return userLevel >= minimumLevel
  },

  /**
   * Get accessible components for role
   */
  getAccessibleComponents: (userRole) => {
    const accessible = []
    
    for (const [component, actions] of Object.entries(COMPONENT_PERMISSIONS)) {
      const hasAnyAccess = Object.keys(actions).some(action =>
        PermissionUtils.canPerformAction(userRole, component, action)
      )
      
      if (hasAnyAccess) {
        accessible.push(component)
      }
    }
    
    return accessible
  },

  /**
   * Filter actions by role permissions
   */
  filterActionsByRole: (userRole, component) => {
    const componentPerms = COMPONENT_PERMISSIONS[component] || {}
    const allowedActions = []
    
    for (const [action, requiredPerms] of Object.entries(componentPerms)) {
      if (PermissionUtils.canPerformAction(userRole, component, action)) {
        allowedActions.push(action)
      }
    }
    
    return allowedActions
  },

  /**
   * Get editing points by risk level
   */
  getEditingPointsByRisk: (riskLevel) => {
    const points = []
    
    for (const [component, editingPoints] of Object.entries(EDITING_POINTS_ACCESS)) {
      for (const [point, config] of Object.entries(editingPoints)) {
        if (config.risk === riskLevel) {
          points.push({ component, point, ...config })
        }
      }
    }
    
    return points
  }
}

/**
 * Navigation permissions
 */
export const NAVIGATION_PERMISSIONS = {
  dashboard: { requiredRole: 'ReadOnly', permission: 'view_dashboard' },
  parts: { requiredRole: 'ReadOnly', permission: 'view_parts' },
  'parts/new': { requiredRole: 'User', permission: 'create_parts' },
  buyers: { requiredRole: 'ReadOnly', permission: 'view_buyers' },
  'buyers/new': { requiredRole: 'User', permission: 'create_buyers' },
  invoices: { requiredRole: 'ReadOnly', permission: 'view_invoices' },
  'invoices/new': { requiredRole: 'User', permission: 'create_invoices' },
  transactions: { requiredRole: 'ReadOnly', permission: 'view_transactions' },
  'transactions/new': { requiredRole: 'User', permission: 'create_transactions' },
  'external-lookup': { requiredRole: 'ReadOnly', permission: 'view_external' }
}

/**
 * Feature flags by role
 */
export const FEATURE_FLAGS = {
  ReadOnly: {
    showCreateButtons: false,
    showEditButtons: false,
    showDeleteButtons: false,
    showBulkOperations: false,
    showExportButtons: true,
    showAdvancedSearch: false
  },
  User: {
    showCreateButtons: true,
    showEditButtons: true,
    showDeleteButtons: false,
    showBulkOperations: false,
    showExportButtons: true,
    showAdvancedSearch: true
  },
  Admin: {
    showCreateButtons: true,
    showEditButtons: true,
    showDeleteButtons: true,
    showBulkOperations: true,
    showExportButtons: true,
    showAdvancedSearch: true
  }
}

export default {
  ROLE_LEVELS,
  ROLE_PERMISSIONS,
  COMPONENT_PERMISSIONS,
  ACTION_PERMISSIONS,
  RISK_LEVELS,
  EDITING_POINTS_ACCESS,
  NAVIGATION_PERMISSIONS,
  FEATURE_FLAGS,
  PermissionUtils
}