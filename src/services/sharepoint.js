// =================================================================
// SHAREPOINT SERVICE LAYER - CORRECTED GRAPH API SYNTAX
// =================================================================
// This service handles all SharePoint operations using Microsoft Graph API
// It integrates with MSAL for authentication and provides clean CRUD operations

import { Client } from '@microsoft/microsoft-graph-client'

// =================================================================
// CONFIGURATION
// =================================================================
const SHAREPOINT_CONFIG = {
  siteUrl: import.meta.env.VITE_SHAREPOINT_SITE_URL,
  graphBaseUrl: import.meta.env.VITE_GRAPH_BASE_URL,
  lists: {
    parts: import.meta.env.VITE_PARTS_LIST_NAME,
    categories: import.meta.env.VITE_CATEGORIES_LIST_NAME,
    buyers: import.meta.env.VITE_BUYERS_LIST_NAME,
    invoices: import.meta.env.VITE_INVOICES_LIST_NAME,
    transactions: import.meta.env.VITE_TRANSACTIONS_LIST_NAME
  }
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Extract site identifier from SharePoint URL for Graph API
 * Converts: https://cabreraautopr.sharepoint.com/sites/DataCollectionSystem
 * To: cabreraautopr.sharepoint.com:/sites/DataCollectionSystem
 */
const getSiteId = () => {
  try {
    const url = new URL(SHAREPOINT_CONFIG.siteUrl)
    const hostname = url.hostname
    const pathname = url.pathname
    return `${hostname}:${pathname}`
  } catch (error) {
    console.error('❌ Invalid SharePoint URL:', error)
    throw new Error('Invalid SharePoint site URL configuration')
  }
}

/**
 * Create authenticated Graph client
 * @param {string} accessToken - MSAL access token
 * @returns {Client} Graph API client
 */
const createGraphClient = (accessToken) => {
  if (!accessToken) {
    throw new Error('Access token is required for SharePoint operations')
  }

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    }
  })
}

/**
 * Transform SharePoint list item to clean object
 * @param {Object} sharePointItem - Raw SharePoint item
 * @param {string} listType - Type of list (parts, categories, etc.)
 * @returns {Object} Clean object for components
 */
const transformSharePointItem = (sharePointItem, listType) => {
  if (!sharePointItem) return null

  const baseItem = {
    id: sharePointItem.id,
    created: sharePointItem.createdDateTime,
    modified: sharePointItem.lastModifiedDateTime,
    createdBy: sharePointItem.createdBy?.user?.displayName || 'Unknown',
    modifiedBy: sharePointItem.lastModifiedBy?.user?.displayName || 'Unknown'
  }

  // SharePoint fields are now directly on the item object, not nested in 'fields'
  const fields = sharePointItem.fields || sharePointItem

  switch (listType) {
    case 'parts':
      return {
        ...baseItem,
        partId: fields.Title,
        description: fields.Description,
        category: fields.Category?.LookupValue || fields.Category,
        inventoryOnHand: fields.InventoryOnHand || 0,
        unitCost: fields.UnitCost || 0,
        unitPrice: fields.UnitPrice || 0,
        status: fields.Status || 'Active'
      }

    case 'categories':
      return {
        ...baseItem,
        category: fields.Title,
        family: fields.Family || ''
      }

    case 'buyers':
      return {
        ...baseItem,
        buyerName: fields.Title,
        contactEmail: fields.ContactEmail || '',
        phone: fields.Phone || ''
      }

    case 'transactions':
      return {
        ...baseItem,
        partId: fields.Part?.LookupValue || fields.Part,
        movementType: fields.MovementType,
        quantity: fields.Quantity || 0,
        unitCost: fields.UnitCost || 0,
        unitPrice: fields.UnitPrice || 0,
        invoice: fields.Invoice?.LookupValue || fields.Invoice,
        notes: fields.Notes || ''
      }

    case 'invoices':
      return {
        ...baseItem,
        invoiceNumber: fields.Title,
        buyer: fields.Buyer?.LookupValue || fields.Buyer,
        invoiceDate: fields.InvoiceDate,
        totalAmount: fields.TotalAmount || 0,
        status: fields.Status || 'Draft'
      }

    default:
      return { ...baseItem, ...fields }
  }
}

/**
 * Transform component data to SharePoint format
 * @param {Object} data - Clean data from components
 * @param {string} listType - Type of list
 * @returns {Object} SharePoint-formatted data
 */
const transformToSharePoint = (data, listType) => {
  switch (listType) {
    case 'parts':
      return {
        Title: data.partId,
        Description: data.description,
        Category: data.category, // Will be handled as lookup
        InventoryOnHand: data.inventoryOnHand,
        UnitCost: data.unitCost,
        UnitPrice: data.unitPrice,
        Status: data.status
      }

    case 'categories':
      return {
        Title: data.category,
        Family: data.family
      }

    case 'buyers':
      return {
        Title: data.buyerName,
        ContactEmail: data.contactEmail,
        Phone: data.phone
      }

    case 'transactions':
      return {
        Part: data.partId, // Will be handled as lookup
        MovementType: data.movementType,
        Quantity: data.quantity,
        UnitCost: data.unitCost,
        UnitPrice: data.unitPrice,
        Invoice: data.invoice, // Will be handled as lookup
        Notes: data.notes
      }

    case 'invoices':
      return {
        Title: data.invoiceNumber,
        Buyer: data.buyer, // Will be handled as lookup
        InvoiceDate: data.invoiceDate,
        TotalAmount: data.totalAmount,
        Status: data.status
      }

    default:
      return data
  }
}

// =================================================================
// SHAREPOINT SERVICE CLASS
// =================================================================
class SharePointService {
  constructor() {
    this.siteId = getSiteId()
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Get cached data if available and not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear cache for specific key or all cache
   * @param {string} [key] - Specific key to clear, or clear all if not provided
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Execute Graph API request with error handling
   * @param {Client} graphClient - Graph client instance
   * @param {Function} operation - Operation to execute
   * @param {string} operationName - Name for logging
   * @returns {Promise<any>} Operation result
   */
  async executeGraphRequest(graphClient, operation, operationName) {
    try {
      const result = await operation()
      
      if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
        console.log(`✅ ${operationName} successful`)
      }
      
      return result
    } catch (error) {
      console.error(`❌ ${operationName} failed:`, error)
      
      // Handle specific Graph API errors
      if (error.status === 401) {
        throw new Error('Authentication failed. Please sign in again.')
      } else if (error.status === 403) {
        throw new Error('Access denied. You may not have permission to perform this operation.')
      } else if (error.status === 404) {
        throw new Error('Resource not found. The SharePoint list or item may not exist.')
      } else if (error.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.')
      } else if (error.status >= 500) {
        throw new Error('Server error. Please try again later.')
      } else {
        throw new Error(`Operation failed: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // =================================================================
  // PARTS OPERATIONS
  // =================================================================

  /**
   * Get all parts from SharePoint
   * @param {string} accessToken - MSAL access token
   * @param {Object} options - Query options (filter, orderBy, etc.)
   * @returns {Promise<Array>} Array of parts
   */
  async getParts(accessToken, options = {}) {
    const cacheKey = `parts_${JSON.stringify(options)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const graphClient = createGraphClient(accessToken)
    
    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        let query = graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`)
          // Remove the problematic $expand=fields - SharePoint list items include fields by default

        // Apply filters if provided
        if (options.filter) {
          query = query.filter(options.filter)
        }

        // Apply ordering if provided
        if (options.orderBy) {
          query = query.orderby(options.orderBy)
        }

        // Apply top/limit if provided
        if (options.top) {
          query = query.top(options.top)
        }

        const response = await query.get()
        return response.value.map(item => transformSharePointItem(item, 'parts'))
      },
      'Get Parts'
    )

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Get single part by ID
   * @param {string} accessToken - MSAL access token
   * @param {string} partId - Part ID to retrieve
   * @returns {Promise<Object|null>} Part object or null if not found
   */
  async getPartById(accessToken, partId) {
    const cacheKey = `part_${partId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const graphClient = createGraphClient(accessToken)
    
    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}`)
          // Remove $expand=fields
          .get()
        
        return transformSharePointItem(response, 'parts')
      },
      `Get Part ${partId}`
    )

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Create new part in SharePoint
   * @param {string} accessToken - MSAL access token
   * @param {Object} partData - Part data to create
   * @returns {Promise<Object>} Created part object
   */
  async createPart(accessToken, partData) {
    const graphClient = createGraphClient(accessToken)
    
    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(partData, 'parts')
        
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`)
          .post({
            fields: sharePointData
          })
        
        return transformSharePointItem(response, 'parts')
      },
      'Create Part'
    )

    // Clear parts cache since we added a new item
    this.clearCache()
    return result
  }

  /**
   * Update existing part in SharePoint
   * @param {string} accessToken - MSAL access token
   * @param {string} partId - Part ID to update
   * @param {Object} partData - Updated part data
   * @returns {Promise<Object>} Updated part object
   */
  async updatePart(accessToken, partId, partData) {
    const graphClient = createGraphClient(accessToken)
    
    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(partData, 'parts')
        
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}`)
          .patch({
            fields: sharePointData
          })
        
        return transformSharePointItem(response, 'parts')
      },
      `Update Part ${partId}`
    )

    // Clear relevant cache
    this.clearCache(`part_${partId}`)
    this.clearCache() // Clear all parts cache
    return result
  }

  /**
   * Delete part from SharePoint
   * @param {string} accessToken - MSAL access token
   * @param {string} partId - Part ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePart(accessToken, partId) {
    const graphClient = createGraphClient(accessToken)
    
    await this.executeGraphRequest(
      graphClient,
      async () => {
        await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}`)
          .delete()
      },
      `Delete Part ${partId}`
    )

    // Clear relevant cache
    this.clearCache(`part_${partId}`)
    this.clearCache() // Clear all parts cache
    return true
  }

  /**
   * Delete multiple parts from SharePoint
   * @param {string} accessToken - MSAL access token
   * @param {Array<string>} partIds - Array of part IDs to delete
   * @returns {Promise<Object>} Results object with success/failure counts
   */
  async deleteMultipleParts(accessToken, partIds) {
    const results = { succeeded: 0, failed: 0, errors: [] }
    
    // Process deletions in parallel with error handling
    const deletePromises = partIds.map(async (partId) => {
      try {
        await this.deletePart(accessToken, partId)
        results.succeeded++
      } catch (error) {
        results.failed++
        results.errors.push({ partId, error: error.message })
      }
    })

    await Promise.all(deletePromises)
    return results
  }

  // =================================================================
  // CATEGORIES OPERATIONS
  // =================================================================

  /**
   * Get all categories from SharePoint
   * @param {string} accessToken - MSAL access token
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories(accessToken) {
    const cacheKey = 'categories'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const graphClient = createGraphClient(accessToken)
    
    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.categories}/items`)
          // Remove $expand=fields
          .orderby('fields/Title')
          .get()
        
        return response.value.map(item => transformSharePointItem(item, 'categories'))
      },
      'Get Categories'
    )

    // Cache categories longer since they change less frequently
    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Get simple array of category names for dropdowns
   * @param {string} accessToken - MSAL access token
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCategoryNames(accessToken) {
    const categories = await this.getCategories(accessToken)
    return categories.map(cat => cat.category)
  }

  // =================================================================
  // TRANSACTIONS OPERATIONS
  // =================================================================

  /**
   * Get transaction history for a specific part
   * @param {string} accessToken - MSAL access token
   * @param {string} partId - Part ID to get transactions for
   * @returns {Promise<Array>} Array of transactions
   */
  async getPartTransactions(accessToken, partId) {
    const cacheKey = `transactions_${partId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const graphClient = createGraphClient(accessToken)
    
    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items`)
          // Remove $expand=fields
          .filter(`fields/Part eq '${partId}'`)
          .orderby('fields/Created desc')
          .get()
        
        return response.value.map(item => transformSharePointItem(item, 'transactions'))
      },
      `Get Transactions for Part ${partId}`
    )

    this.setCache(cacheKey, result)
    return result
  }

  // =================================================================
  // HEALTH CHECK & UTILITIES
  // =================================================================

  /**
   * Test SharePoint connection and permissions
   * @param {string} accessToken - MSAL access token
   * @returns {Promise<Object>} Health check results
   */
  async healthCheck(accessToken) {
    const graphClient = createGraphClient(accessToken)
    const results = {
      siteAccess: false,
      listsAccess: {},
      timestamp: new Date().toISOString()
    }

    try {
      // Test site access
      await graphClient.api(`/sites/${this.siteId}`).get()
      results.siteAccess = true

      // Test each list access
      for (const [listKey, listName] of Object.entries(SHAREPOINT_CONFIG.lists)) {
        try {
          await graphClient
            .api(`/sites/${this.siteId}/lists/${listName}`)
            .get()
          results.listsAccess[listKey] = true
        } catch (error) {
          results.listsAccess[listKey] = false
        }
      }
    } catch (error) {
      console.error('❌ SharePoint health check failed:', error)
    }

    return results
  }
}

// =================================================================
// SINGLETON INSTANCE
// =================================================================
const sharePointService = new SharePointService()

export default sharePointService

// =================================================================
// CONVENIENCE EXPORTS
// =================================================================
export {
  SharePointService,
  SHAREPOINT_CONFIG,
  getSiteId,
  transformSharePointItem,
  transformToSharePoint
}