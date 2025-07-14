// =================================================================
// SHAREPOINT CONFIGURATION
// =================================================================
// Central configuration for SharePoint integration
// This file defines all SharePoint-related constants and mappings

// =================================================================
// ENVIRONMENT CONFIGURATION
// =================================================================
export const SHAREPOINT_CONFIG = {
  // Site configuration
  siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL,
  graphBaseUrl: import.meta.env.VITE_GRAPH_BASE_URL || 'https://graph.microsoft.com/v1.0',
  
  // List names (from environment variables)
  lists: {
    parts: import.meta.env.VITE_PARTS_LIST_NAME || 'simt_Parts',
    categories: import.meta.env.VITE_CATEGORIES_LIST_NAME || 'simt_Categories',
    buyers: import.meta.env.VITE_BUYERS_LIST_NAME || 'simt_Buyers',
    invoices: import.meta.env.VITE_INVOICES_LIST_NAME || 'simt_Invoices',
    transactions: import.meta.env.VITE_TRANSACTIONS_LIST_NAME || 'simt_Transactions'
  },

  // API configuration
  scopes: (import.meta.env.VITE_GRAPH_SCOPES || 'User.Read,Sites.ReadWrite.All').split(','),
  
  // Performance settings
  cache: {
    defaultTimeout: 5 * 60 * 1000, // 5 minutes
    categoriesTimeout: 15 * 60 * 1000, // 15 minutes (categories change less frequently)
    maxCacheSize: 100 // Maximum number of cached items
  },
  
  // Query defaults
  query: {
    defaultPageSize: 100,
    maxPageSize: 500,
    defaultOrderBy: 'Created desc'
  }
}

// =================================================================
// SHAREPOINT LIST SCHEMA DEFINITIONS
// =================================================================

/**
 * Parts list schema mapping
 */
export const PARTS_SCHEMA = {
  // SharePoint internal names to friendly names
  fieldMapping: {
    'Title': 'partId',
    'Description': 'description',
    'Category': 'category',
    'InventoryOnHand': 'inventoryOnHand',
    'UnitCost': 'unitCost',
    'UnitPrice': 'unitPrice',
    'Status': 'status'
  },
  
  // Field types for validation
  fieldTypes: {
    partId: 'string',
    description: 'string',
    category: 'lookup',
    inventoryOnHand: 'number',
    unitCost: 'currency',
    unitPrice: 'currency',
    status: 'choice'
  },
  
  // Choice field options
  choices: {
    status: ['Active', 'Obsolete', 'Disposed']
  },
  
  // Required fields
  requiredFields: ['partId', 'description', 'category', 'unitCost', 'unitPrice'],
  
  // Fields that can be indexed for search
  searchableFields: ['partId', 'description', 'category'],
  
  // Display fields for lists
  displayFields: ['partId', 'description', 'category', 'inventoryOnHand', 'unitPrice', 'status']
}

/**
 * Categories list schema mapping
 */
export const CATEGORIES_SCHEMA = {
  fieldMapping: {
    'Title': 'category',
    'Family': 'family'
  },
  
  fieldTypes: {
    category: 'string',
    family: 'choice'
  },
  
  choices: {
    family: [
      'Brake & Wheel Hub',
      'Engine & Transmission',
      'Electrical & Lighting',
      'Suspension & Steering',
      'Body & Interior',
      'Filters & Fluids'
    ]
  },
  
  requiredFields: ['category'],
  searchableFields: ['category', 'family'],
  displayFields: ['category', 'family']
}

/**
 * Buyers list schema mapping
 */
export const BUYERS_SCHEMA = {
  fieldMapping: {
    'Title': 'buyerName',
    'ContactEmail': 'contactEmail',
    'Phone': 'phone'
  },
  
  fieldTypes: {
    buyerName: 'string',
    contactEmail: 'email',
    phone: 'string'
  },
  
  requiredFields: ['buyerName'],
  searchableFields: ['buyerName', 'contactEmail'],
  displayFields: ['buyerName', 'contactEmail', 'phone']
}

/**
 * Transactions list schema mapping
 */
export const TRANSACTIONS_SCHEMA = {
  fieldMapping: {
    'Part': 'partId',
    'MovementType': 'movementType',
    'Quantity': 'quantity',
    'UnitCost': 'unitCost',
    'UnitPrice': 'unitPrice',
    'Invoice': 'invoice',
    'Notes': 'notes'
  },
  
  fieldTypes: {
    partId: 'lookup',
    movementType: 'choice',
    quantity: 'number',
    unitCost: 'currency',
    unitPrice: 'currency',
    invoice: 'lookup',
    notes: 'multiline'
  },
  
  choices: {
    movementType: ['In (Received)', 'Out (Sold)', 'Adjustment']
  },
  
  requiredFields: ['partId', 'movementType', 'quantity'],
  searchableFields: ['partId', 'movementType', 'invoice'],
  displayFields: ['partId', 'movementType', 'quantity', 'unitCost', 'unitPrice', 'invoice']
}

/**
 * Invoices list schema mapping
 */
export const INVOICES_SCHEMA = {
  fieldMapping: {
    'Title': 'invoiceNumber',
    'Buyer': 'buyer',
    'InvoiceDate': 'invoiceDate',
    'TotalAmount': 'totalAmount',
    'Status': 'status'
  },
  
  fieldTypes: {
    invoiceNumber: 'string',
    buyer: 'lookup',
    invoiceDate: 'datetime',
    totalAmount: 'currency',
    status: 'choice'
  },
  
  choices: {
    status: ['Draft', 'Finalized', 'Paid', 'Void']
  },
  
  requiredFields: ['invoiceNumber', 'buyer', 'invoiceDate'],
  searchableFields: ['invoiceNumber', 'buyer'],
  displayFields: ['invoiceNumber', 'buyer', 'invoiceDate', 'totalAmount', 'status']
}

// =================================================================
// GRAPH API ENDPOINTS
// =================================================================

/**
 * Generate Graph API endpoints for SharePoint operations
 * @param {string} siteId - SharePoint site identifier
 * @returns {Object} Object containing all API endpoints
 */
export const getGraphEndpoints = (siteId) => ({
  // Site endpoints
  site: `/sites/${siteId}`,
  lists: `/sites/${siteId}/lists`,
  
  // List-specific endpoints
  parts: {
    list: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}`,
    items: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`,
    itemById: (id) => `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${id}`
  },
  
  categories: {
    list: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.categories}`,
    items: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.categories}/items`,
    itemById: (id) => `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.categories}/items/${id}`
  },
  
  buyers: {
    list: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}`,
    items: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items`,
    itemById: (id) => `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items/${id}`
  },
  
  transactions: {
    list: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}`,
    items: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items`,
    itemById: (id) => `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items/${id}`
  },
  
  invoices: {
    list: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}`,
    items: `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items`,
    itemById: (id) => `/sites/${siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items/${id}`
  }
})

// =================================================================
// ODATA QUERY BUILDERS
// =================================================================

/**
 * Build OData filter expressions for SharePoint queries
 */
export const ODataFilters = {
  /**
   * Filter parts by status
   * @param {string} status - Status to filter by
   * @returns {string} OData filter expression
   */
  partsByStatus: (status) => `fields/Status eq '${status}'`,
  
  /**
   * Filter parts by category
   * @param {string} category - Category to filter by
   * @returns {string} OData filter expression
   */
  partsByCategory: (category) => `fields/Category eq '${category}'`,
  
  /**
   * Filter parts with low inventory
   * @param {number} threshold - Inventory threshold (default: 5)
   * @returns {string} OData filter expression
   */
  lowInventoryParts: (threshold = 5) => `fields/InventoryOnHand le ${threshold}`,
  
  /**
   * Filter parts out of stock
   * @returns {string} OData filter expression
   */
  outOfStockParts: () => `fields/InventoryOnHand eq 0`,
  
  /**
   * Filter transactions by part ID
   * @param {string} partId - Part ID to filter by
   * @returns {string} OData filter expression
   */
  transactionsByPart: (partId) => `fields/Part eq '${partId}'`,
  
  /**
   * Filter transactions by type
   * @param {string} type - Movement type to filter by
   * @returns {string} OData filter expression
   */
  transactionsByType: (type) => `fields/MovementType eq '${type}'`,
  
  /**
   * Filter transactions by date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {string} OData filter expression
   */
  transactionsByDateRange: (startDate, endDate) => 
    `fields/Created ge '${startDate}' and fields/Created le '${endDate}'`,
  
  /**
   * Search parts by text (part ID or description)
   * @param {string} searchTerm - Search term
   * @returns {string} OData filter expression
   */
  searchParts: (searchTerm) => 
    `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/Description))`
}

/**
 * Build OData orderby expressions
 */
export const ODataOrderBy = {
  // Parts ordering
  partsByTitle: 'fields/Title',
  partsByCreated: 'fields/Created desc',
  partsByModified: 'fields/Modified desc',
  partsByInventory: 'fields/InventoryOnHand desc',
  partsByPrice: 'fields/UnitPrice desc',
  
  // Categories ordering
  categoriesByTitle: 'fields/Title',
  
  // Transactions ordering
  transactionsByCreated: 'fields/Created desc',
  transactionsByDate: 'fields/Created desc',
  
  // Generic ordering
  byTitle: 'fields/Title',
  byCreated: 'fields/Created desc',
  byModified: 'fields/Modified desc'
}

// =================================================================
// VALIDATION RULES
// =================================================================

/**
 * Validation rules for SharePoint data
 */
export const VALIDATION_RULES = {
  parts: {
    partId: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z0-9_-]+$/,
      message: 'Part ID must be 2-50 characters, letters, numbers, dashes and underscores only'
    },
    description: {
      required: true,
      minLength: 5,
      maxLength: 255,
      message: 'Description must be 5-255 characters'
    },
    category: {
      required: true,
      message: 'Category is required'
    },
    inventoryOnHand: {
      type: 'number',
      min: 0,
      message: 'Inventory must be 0 or greater'
    },
    unitCost: {
      required: true,
      type: 'number',
      min: 0,
      message: 'Unit cost must be 0 or greater'
    },
    unitPrice: {
      required: true,
      type: 'number',
      min: 0,
      message: 'Unit price must be 0 or greater'
    }
  },
  
  categories: {
    category: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Category name must be 2-100 characters'
    }
  },
  
  buyers: {
    buyerName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'Buyer name must be 2-100 characters'
    },
    contactEmail: {
      type: 'email',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    phone: {
      maxLength: 20,
      message: 'Phone number must be 20 characters or less'
    }
  }
}

// =================================================================
// DEVELOPMENT HELPERS
// =================================================================

/**
 * Validate SharePoint configuration
 * @returns {Object} Validation results
 */
export const validateSharePointConfig = () => {
  const issues = []
  
  if (!SHAREPOINT_CONFIG.siteUrl) {
    issues.push('VITE_SHAREPOINT_SITE_URL not configured')
  }
  
  if (!import.meta.env.VITE_CLIENT_ID) {
    issues.push('VITE_CLIENT_ID not configured')
  }
  
  if (!import.meta.env.VITE_TENANT_ID) {
    issues.push('VITE_TENANT_ID not configured')
  }
  
  // Validate required list names
  Object.entries(SHAREPOINT_CONFIG.lists).forEach(([key, listName]) => {
    if (!listName) {
      issues.push(`List name for ${key} not configured`)
    }
  })
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

// Log configuration status in development
if (import.meta.env.VITE_DEV_MODE === 'true') {
  const validation = validateSharePointConfig()
  
  if (validation.isValid) {
    console.log('✅ SharePoint configuration is valid')
  } else {
    console.warn('⚠️ SharePoint configuration issues:', validation.issues)
  }
  
  console.log('📋 SharePoint Lists:', SHAREPOINT_CONFIG.lists)
}