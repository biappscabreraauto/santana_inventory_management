// =================================================================
// SHAREPOINT CONFIGURATION - HYBRID SOLUTION IMPLEMENTATION
// =================================================================
// Central configuration for SharePoint integration with enhanced hybrid solution support
// HYBRID SOLUTION: Category field converted from Lookup to Text field to work around
// Microsoft Graph API bug with custom lookup fields

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
    categoryMapTimeout: 15 * 60 * 1000, // 15 minutes for category map
    maxCacheSize: 100 // Maximum number of cached items
  },
  
  // Query defaults
  query: {
    defaultPageSize: 100,
    maxPageSize: 500,
    defaultOrderBy: 'Created desc'
  },

  // HYBRID SOLUTION: Enhanced configuration
  hybridSolution: {
    enabled: true,
    categoryValidation: true,
    autoFamilyLookup: true,
    cacheStrategy: 'aggressive', // 'conservative' | 'aggressive'
    fallbackCategory: 'Uncategorized'
  }
}

// =================================================================
// SHAREPOINT LIST SCHEMA DEFINITIONS - HYBRID SOLUTION ENHANCED
// =================================================================

/**
 * Parts list schema mapping - HYBRID SOLUTION UPDATED
 * Category field changed from Lookup to Text field
 */
export const PARTS_SCHEMA = {
  // SharePoint internal names to friendly names
  fieldMapping: {
    'Title': 'partId',
    'Description': 'description',
    // HYBRID SOLUTION: Category is now a simple text field
    'Category': 'category',
    'InventoryOnHand': 'inventoryOnHand',
    'UnitCost': 'unitCost',
    'UnitPrice': 'unitPrice',
    'Status': 'status'
  },
  
  // Field types for validation - HYBRID SOLUTION UPDATED
  fieldTypes: {
    partId: 'string',
    description: 'string',
    // HYBRID SOLUTION: Changed from 'lookup' to 'text'
    category: 'text',
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
  
  // Display fields for lists - HYBRID SOLUTION: Added family support
  displayFields: ['partId', 'description', 'category', 'family', 'inventoryOnHand', 'unitPrice', 'status'],

  // HYBRID SOLUTION: Enhanced validation rules
  validation: {
    category: {
      required: true,
      validateAgainstList: true,
      autoCorrect: false,
      caseSensitive: false
    }
  }
}

/**
 * Categories list schema mapping - HYBRID SOLUTION ENHANCED
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
      'Belt Drive',
      'Body & Lamp Assembly',
      'Brake & Wheel Hub',
      'Cooling System',
      'Drivetrain',
      'Electrical',
      'Electrical-Switch & Relay',
      'Engine',
      'Exhaust & Emission',
      'Fuel & Air',
      'Heat & Air Conditioning',
      'Ignition',
      'Interior',
      'Steering',
      'Suspension',
      'Transmission-Automatic',
      'Transmission-Manual'
    ]
  },
  
  requiredFields: ['category'],
  searchableFields: ['category', 'family'],
  displayFields: ['category', 'family'],

  // HYBRID SOLUTION: Category management settings
  management: {
    allowDuplicates: false,
    autoCreateFamily: false,
    sortByFamily: true,
    groupByFamily: true
  }
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
 * Transactions list schema mapping - HYBRID SOLUTION READY
 */
export const TRANSACTIONS_SCHEMA = {
  fieldMapping: {
    'Part': 'partId',
    'MovementType': 'movementType',
    'Quantity': 'quantity',
    'UnitCost': 'unitCost',
    'UnitPrice': 'unitPrice',
    'Invoice': 'invoice',
    'Buyer': 'buyer',
    'Supplier': 'supplier',
    'Notes': 'notes'
  },
  
  fieldTypes: {
    // HYBRID SOLUTION: Changed from 'lookup' to 'text' 
    partId: 'text', // Was 'lookup', now 'text' due to Graph API bug
    movementType: 'choice',
    quantity: 'number',
    unitCost: 'currency',
    unitPrice: 'currency',
    // May need to convert these to text in future if Graph API issues persist
    invoice: 'lookup',
    buyer: 'lookup',
    supplier: 'text',
    notes: 'multiline'
  },
  
  choices: {
    movementType: ['In (Received)', 'Out (Sold)', 'Adjustment']
  },
  
  requiredFields: ['partId', 'movementType', 'quantity'],
  searchableFields: ['partId', 'movementType', 'invoice', 'buyer', 'supplier'],
  displayFields: ['partId', 'movementType', 'quantity', 'unitCost', 'unitPrice', 'invoice', 'buyer', 'supplier', 'notes'],

  // HYBRID SOLUTION: Part field validation
  validation: {
    partId: {
      required: true,
      validateAgainstList: true, // Can validate against Parts list in application
      caseSensitive: false,
      trimWhitespace: true,
      message: 'Part ID is required and must exist in the Parts catalog'
    }
  }
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
// ODATA QUERY BUILDERS - HYBRID SOLUTION ENHANCED
// =================================================================

/**
 * Build OData filter expressions for SharePoint queries
 * HYBRID SOLUTION: Enhanced with text-based category filtering
 */
export const ODataFilters = {
  /**
   * Filter parts by status
   * @param {string} status - Status to filter by
   * @returns {string} OData filter expression
   */
  partsByStatus: (status) => `fields/Status eq '${status}'`,
  
  /**
   * Filter parts by category - HYBRID SOLUTION: Text field filtering
   * @param {string} category - Category to filter by
   * @returns {string} OData filter expression
   */
  partsByCategory: (category) => `fields/Category eq '${category}'`,

  /**
   * Filter parts by family - HYBRID SOLUTION: Requires category lookup
   * @param {string} family - Family to filter by
   * @param {Array} categoriesInFamily - Array of category names in the family
   * @returns {string} OData filter expression
   */
  partsByFamily: (family, categoriesInFamily) => {
    if (!categoriesInFamily || categoriesInFamily.length === 0) {
      return "fields/Category eq 'NonExistentCategory'" // Return no results
    }
    const categoryFilters = categoriesInFamily.map(cat => `fields/Category eq '${cat}'`).join(' or ')
    return `(${categoryFilters})`
  },
  
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
   * Search parts by text - HYBRID SOLUTION: Enhanced search including category
   * @param {string} searchTerm - Search term
   * @returns {string} OData filter expression
   */
  searchParts: (searchTerm) => 
    `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/Description) or substringof('${searchTerm}', fields/Category))`,

  /**
   * HYBRID SOLUTION: Search parts within specific family
   * @param {string} searchTerm - Search term
   * @param {Array} categoriesInFamily - Categories in the family
   * @returns {string} OData filter expression
   */
  searchPartsInFamily: (searchTerm, categoriesInFamily) => {
    const searchFilter = ODataFilters.searchParts(searchTerm)
    const familyFilter = ODataFilters.partsByFamily('', categoriesInFamily)
    return `(${searchFilter}) and (${familyFilter})`
  }
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
  partsByCategory: 'fields/Category', // HYBRID SOLUTION: Direct text field ordering
  
  // Categories ordering
  categoriesByTitle: 'fields/Title',
  categoriesByFamily: 'fields/Family',
  
  // Transactions ordering
  transactionsByCreated: 'fields/Created desc',
  transactionsByDate: 'fields/Created desc',
  
  // Generic ordering
  byTitle: 'fields/Title',
  byCreated: 'fields/Created desc',
  byModified: 'fields/Modified desc'
}

// =================================================================
// VALIDATION RULES - HYBRID SOLUTION ENHANCED
// =================================================================

/**
 * Validation rules for SharePoint data
 * HYBRID SOLUTION: Enhanced category validation
 */
export const VALIDATION_RULES = {
  parts: {
    partId: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z0-9_.-]+$/,
      message: 'Part ID must be 2-50 characters, letters, numbers, dashes, underscores, and periods only'
    },
    description: {
      required: true,
      minLength: 5,
      maxLength: 255,
      message: 'Description must be 5-255 characters'
    },
    // HYBRID SOLUTION: Enhanced category validation
    category: {
      required: true,
      validateAgainstList: true,
      caseSensitive: false,
      trimWhitespace: true,
      message: 'Category is required and must be selected from the valid categories list'
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
      unique: true,
      trimWhitespace: true,
      message: 'Category name must be 2-100 characters and unique'
    },
    family: {
      required: true,
      validateAgainstChoices: true,
      message: 'Family must be selected from the available options'
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
// HYBRID SOLUTION UTILITIES
// =================================================================

/**
 * HYBRID SOLUTION: Category management utilities
 */
export const CATEGORY_UTILS = {
  /**
   * Default fallback category for invalid entries
   */
  FALLBACK_CATEGORY: 'Uncategorized',

  /**
   * Normalize category name for comparison
   * @param {string} category - Category name to normalize
   * @returns {string} Normalized category name
   */
  normalizeCategory: (category) => {
    if (!category) return '';
    return category.trim();
  },

  /**
   * Validate category name format
   * @param {string} category - Category name to validate
   * @returns {boolean} Whether the category name is valid format
   */
  isValidCategoryFormat: (category) => {
    if (!category || typeof category !== 'string') return false;
    const normalized = CATEGORY_UTILS.normalizeCategory(category);
    return normalized.length >= 2 && normalized.length <= 100;
  },

  /**
   * Generate category validation error message
   * @param {string} category - Invalid category name
   * @param {Array} validCategories - Array of valid category names
   * @returns {string} Error message
   */
  getCategoryValidationError: (category, validCategories = []) => {
    if (!category) return 'Category is required';
    if (!CATEGORY_UTILS.isValidCategoryFormat(category)) {
      return 'Category name must be between 2-100 characters';
    }
    if (validCategories.length > 0 && !validCategories.includes(category)) {
      return `Invalid category "${category}". Please select from the available categories.`;
    }
    return '';
  }
}

/**
 * HYBRID SOLUTION: Family management utilities
 */
export const FAMILY_UTILS = {
  /**
   * Get all available families from choices
   * @returns {Array} Array of family names
   */
  getAvailableFamilies: () => {
    return [...CATEGORIES_SCHEMA.choices.family];
  },

  /**
   * Group categories by family
   * @param {Array} categories - Array of category objects
   * @returns {Object} Object with family names as keys and arrays of categories as values
   */
  groupCategoriesByFamily: (categories) => {
    const grouped = {};
    
    categories.forEach(cat => {
      const family = cat.family || 'Uncategorized';
      if (!grouped[family]) {
        grouped[family] = [];
      }
      grouped[family].push(cat);
    });
    
    return grouped;
  },

  /**
   * Get categories for a specific family
   * @param {Array} categories - Array of all categories
   * @param {string} familyName - Family name to filter by
   * @returns {Array} Array of categories in the specified family
   */
  getCategoriesInFamily: (categories, familyName) => {
    return categories.filter(cat => cat.family === familyName);
  }
}

// =================================================================
// DEVELOPMENT HELPERS
// =================================================================

/**
 * Validate SharePoint configuration
 * HYBRID SOLUTION: Enhanced validation with hybrid solution checks
 * @returns {Object} Validation results
 */
export const validateSharePointConfig = () => {
  const issues = []
  const warnings = []
  
  // Basic configuration validation
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

  // HYBRID SOLUTION: Validate hybrid solution configuration
  if (!SHAREPOINT_CONFIG.hybridSolution.enabled) {
    warnings.push('Hybrid solution is disabled - may cause issues with category fields')
  }

  // Validate Parts schema for hybrid solution
  if (PARTS_SCHEMA.fieldTypes.category !== 'text') {
    warnings.push('Parts category field type should be "text" for hybrid solution')
  }

  // Validate Categories schema
  if (!CATEGORIES_SCHEMA.choices.family || CATEGORIES_SCHEMA.choices.family.length === 0) {
    warnings.push('No family choices configured for categories')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    hybridSolutionStatus: {
      enabled: SHAREPOINT_CONFIG.hybridSolution.enabled,
      categoryValidation: SHAREPOINT_CONFIG.hybridSolution.categoryValidation,
      autoFamilyLookup: SHAREPOINT_CONFIG.hybridSolution.autoFamilyLookup
    }
  }
}

/**
 * HYBRID SOLUTION: Get hybrid solution status
 * @returns {Object} Current hybrid solution configuration
 */
export const getHybridSolutionStatus = () => {
  return {
    enabled: SHAREPOINT_CONFIG.hybridSolution.enabled,
    categoryFieldType: PARTS_SCHEMA.fieldTypes.category,
    categoryValidation: SHAREPOINT_CONFIG.hybridSolution.categoryValidation,
    autoFamilyLookup: SHAREPOINT_CONFIG.hybridSolution.autoFamilyLookup,
    cacheStrategy: SHAREPOINT_CONFIG.hybridSolution.cacheStrategy,
    fallbackCategory: SHAREPOINT_CONFIG.hybridSolution.fallbackCategory,
    availableFamilies: FAMILY_UTILS.getAvailableFamilies(),
    configurationValid: validateSharePointConfig().isValid
  }
}

// =================================================================
// DEVELOPMENT LOGGING
// =================================================================

// Log configuration status in development
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  const validation = validateSharePointConfig()
  const hybridStatus = getHybridSolutionStatus()
  
  if (validation.isValid) {
    console.log('✅ SharePoint configuration is valid')
  } else {
    console.warn('⚠️ SharePoint configuration issues:', validation.issues)
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ SharePoint configuration warnings:', validation.warnings)
  }
  
  console.log('📋 SharePoint Lists:', SHAREPOINT_CONFIG.lists)
  console.log('🔀 Hybrid Solution Status:', hybridStatus)
  
  // HYBRID SOLUTION: Log category configuration
  console.log('📂 Available Families:', FAMILY_UTILS.getAvailableFamilies())
  console.log('🏷️ Category Field Type:', PARTS_SCHEMA.fieldTypes.category)
}

// =================================================================
// EXPORTS
// =================================================================
export default {
  SHAREPOINT_CONFIG,
  PARTS_SCHEMA,
  CATEGORIES_SCHEMA,
  BUYERS_SCHEMA,
  TRANSACTIONS_SCHEMA,
  INVOICES_SCHEMA,
  getGraphEndpoints,
  ODataFilters,
  ODataOrderBy,
  VALIDATION_RULES,
  CATEGORY_UTILS,
  FAMILY_UTILS,
  validateSharePointConfig,
  getHybridSolutionStatus
}