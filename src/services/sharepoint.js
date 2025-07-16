// =================================================================
// SHAREPOINT SERVICE LAYER - HYBRID SOLUTION IMPLEMENTATION
// =================================================================
// This service handles all SharePoint operations using Microsoft Graph API
// HYBRID SOLUTION: Category field converted from Lookup to Text field
// to work around Microsoft Graph API bug with custom lookup fields

import { Client } from '@microsoft/microsoft-graph-client';

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
    transactions: import.meta.env.VITE_TRANSACTIONS_LIST_NAME,
  },
};

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Extract site identifier from SharePoint URL for Graph API
 */
const getSiteId = () => {
  // Using the hardcoded site ID is the most reliable method
  const SITE_ID =
    'cabreraautopr.sharepoint.com,7e2124f9-e554-4d2a-9e16-d4da5a00f314,ddb94a9e-35b4-41b2-b94c-9a8bc90c5098';
  if (SITE_ID) {
    return SITE_ID;
  }
  // Fallback for path-based, though less reliable
  try {
    const url = new URL(SHAREPOINT_CONFIG.siteUrl);
    const hostname = url.hostname;
    const pathname = url.pathname;
    return `${hostname}:${pathname}`;
  } catch (error) {
    console.error('Invalid SharePoint URL:', error);
    throw new Error('Invalid SharePoint site URL configuration');
  }
};

/**
 * Create authenticated Graph client
 */
const createGraphClient = (accessToken) => {
  if (!accessToken) {
    throw new Error('Access token is required for SharePoint operations');
  }

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
};

/**
 * Transform SharePoint list item to clean object
 * HYBRID SOLUTION: Category field handled as simple text
 */
const transformSharePointItem = (sharePointItem, listType) => {
  if (!sharePointItem) return null;

  const baseItem = {
    id: sharePointItem.id,
    created: sharePointItem.createdDateTime,
    modified: sharePointItem.lastModifiedDateTime,
    createdBy: sharePointItem.createdBy?.user?.displayName || 'Unknown',
    modifiedBy: sharePointItem.lastModifiedBy?.user?.displayName || 'Unknown',
  };

  const fields = sharePointItem.fields || sharePointItem;

  switch (listType) {
    case 'parts':
      return {
        ...baseItem,
        partId: fields.Title,
        description: fields.Description,
        // HYBRID SOLUTION: Category is now a simple text field
        category: fields.Category || 'Uncategorized',
        inventoryOnHand: fields.InventoryOnHand || 0,
        unitCost: fields.UnitCost || 0,
        unitPrice: fields.UnitPrice || 0,
        status: fields.Status || 'Active',
      };

    case 'categories':
      return {
        ...baseItem,
        category: fields.Title,
        family: fields.Family || '',
      };

    case 'buyers':
      return {
        ...baseItem,
        buyerName: fields.Title,
        contactEmail: fields.ContactEmail || '',
        phone: fields.Phone || '',
      };

    case 'transactions':
      return {
        ...baseItem,
        partId: fields.Part || '', // Simple text field
        movementType: fields.MovementType,
        quantity: fields.Quantity || 0,
        unitCost: fields.UnitCost || 0,
        unitPrice: fields.UnitPrice || 0,
        invoice: fields.Invoice || '', // Now simple text field
        buyer: fields.Buyer || '', // Now simple text field (Buyer Name)
        notes: fields.Notes || '',
        supplier: fields.Supplier || '',
      };

    case 'invoices':
      return {
        ...baseItem,
        invoiceNumber: fields.Title,
        buyer: fields.Buyer || 'Unknown Buyer', // Now simple text field
        invoiceDate: fields.InvoiceDate,
        totalAmount: fields.TotalAmount || 0,
        status: fields.Status || 'Draft',
        notes: fields.Notes || '',
      };

    default:
      return { ...baseItem, ...fields };
  }
};

/**
 * Transform component data to SharePoint format
 * HYBRID SOLUTION: Category field handled as simple text
 * FIXED: Removed baseItem references that were causing errors
 */
  const transformToSharePoint = (data, listType) => {
    switch (listType) {
      case 'parts':
        // Build the base parts data WITHOUT inventory
        const partsData = {
          Title: data.partId,
          Description: data.description || '',
          Category: data.category || 'Uncategorized',
          UnitCost: data.unitCost || 0,
          UnitPrice: data.unitPrice || 0,
          Status: data.status || 'Active'
        };

        // ✅ FIXED: Only include InventoryOnHand for NEW parts with initial stock
        // Never include it for updates to prevent inventory reset
        if (data.inventoryOnHand !== undefined && 
            data.inventoryOnHand !== null && 
            data.inventoryOnHand > 0 &&
            data.isNewPart === true) {
          partsData.InventoryOnHand = data.inventoryOnHand;
          console.log('Including InventoryOnHand for new part:', data.inventoryOnHand);
        } else {
          console.log('Excluding InventoryOnHand to preserve existing inventory');
        }

        return partsData;

      case 'categories':
        return {
          Title: data.category,
          Family: data.family || ''
        };

      case 'buyers':
        return {
          Title: data.buyerName,
          ContactEmail: data.contactEmail || '',
          Phone: data.phone || ''
        };

      case 'transactions':
        // Start with base transaction data
        const transactionData = {
          Part: data.partId, // Text field (hybrid solution)
          MovementType: data.movementType,
          Quantity: data.quantity || 0,
          Notes: data.notes || '',
          Supplier: data.supplier || ''
        };

        // CRITICAL FIX: Only set the relevant price field based on movement type
        if (data.movementType === 'In (Received)' || data.movementType === 'Adjustment' || data.movementType === 'Void adjustment') {
          // For INBOUND: Only set UnitCost, explicitly DO NOT set UnitPrice
          if (data.unitCost !== undefined && data.unitCost !== null) {
            transactionData.UnitCost = data.unitCost;
          }
                  
        } else if (data.movementType === 'Out (Sold)') {
          // For OUTBOUND: Set UnitPrice (selling price)
          if (data.unitPrice !== undefined && data.unitPrice !== null) {
            transactionData.UnitPrice = data.unitPrice;
          }
          // Optionally include UnitCost for reference
          if (data.unitCost !== undefined && data.unitCost !== null) {
            transactionData.UnitCost = data.unitCost;
          }
          // Include invoice and buyer references for sales
          if (data.invoice) {
            transactionData.Invoice = data.invoice;
          }
          if (data.buyer) {
            transactionData.Buyer = data.buyer;
          }
        }

        // FIX: Include invoice and buyer references for VOID ADJUSTMENTS
        // MOVED OUTSIDE the movement type conditions
        if (data.movementType === 'Void adjustment') {
          if (data.invoice) {
            transactionData.Invoice = data.invoice;
          }
          if (data.buyer) {
            transactionData.Buyer = data.buyer;
          }
        }

        return transactionData;

      case 'invoices':
        return {
          Title: data.invoiceNumber,
          Buyer: data.buyer || 'Unknown Buyer', // Now simple text field
          InvoiceDate: data.invoiceDate,
          TotalAmount: data.totalAmount || 0,
          Status: data.status || 'Draft',
          Notes: data.notes || ''
        };

      default:
        console.warn(`Unknown list type for transformation: ${listType}`);
        return data;
    }
  };

// =================================================================
// SHAREPOINT SERVICE CLASS
// =================================================================
class SharePointService {
  constructor() {
    this.siteId = getSiteId();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached data if available and not expired
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set data in cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for specific key or all cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Execute Graph API request with error handling
   */
  async executeGraphRequest(graphClient, operation, operationName) {
    try {
      const result = await operation();

      if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
        console.log(`✅ ${operationName} successful`);
      }

      return result;
    } catch (error) {
      console.error(`❌ ${operationName} failed:`, error);

      // Handle specific Graph API errors
      if (error.statusCode === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.statusCode === 403) {
        throw new Error(
          'Access denied. You may not have permission to perform this operation.'
        );
      } else if (error.statusCode === 404) {
        throw new Error(
          'Resource not found. The SharePoint list or item may not exist.'
        );
      } else if (error.statusCode === 429) {
        throw new Error(
          'Too many requests. Please wait a moment and try again.'
        );
      } else if (error.statusCode >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`Operation failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // =================================================================
  // PARTS OPERATIONS
  // =================================================================

  /**
   * Get all parts from SharePoint
   */
  async getParts(accessToken, options = {}) {
    const cacheKey = `parts_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        let query = graphClient.api(
          `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items?$expand=fields`
        );

        if (options.filter) {
          query = query.filter(options.filter);
        }

        if (options.orderBy) {
          query = query.orderby(options.orderBy);
        }

        if (options.top) {
          query = query.top(options.top);
        }

        const response = await query.get();
        return response.value.map((item) =>
          transformSharePointItem(item, 'parts')
        );
      },
      'Get Parts'
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get single part by SharePoint item ID (not Part ID)
   * This method gets parts using the SharePoint item ID directly
   */
  async getPartByItemId(accessToken, itemId) {
    const cacheKey = `part_item_${itemId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${itemId}?$expand=fields`)
          .get();

        return transformSharePointItem(response, 'parts');
      },
      `Get Part by Item ID ${itemId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  // Also update your existing getPartById method to have better error handling
  /**
   * Get single part by Part ID (Title field) - EXISTING METHOD WITH BETTER ERROR HANDLING
   */
  async getPartById(accessToken, partId) {
    const cacheKey = `part_${partId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`)
          .filter(`fields/Title eq '${partId}'`)
          .expand('fields')
          .top(1)
          .get();

        if (response.value && response.value.length > 0) {
          return transformSharePointItem(response.value[0], 'parts');
        }

        // Return null instead of throwing error - let components handle "not found"
        return null;
      },
      `Get Part by ID ${partId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Create new part in SharePoint
   * HYBRID SOLUTION: Category validation handled in application layer
   */
  async createPart(accessToken, partData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(partData, 'parts');

        console.log('Creating part with data:', sharePointData);

        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`)
          .post({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'parts');
      },
      'Create Part'
    );

    this.clearCache();
    return result;
  }

  /**
   * Update existing part in SharePoint
   * HYBRID SOLUTION: Category validation handled in application layer
   */
  async updatePart(accessToken, partId, partData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(partData, 'parts');

        console.log('Updating part with data:', sharePointData);

        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}`)
          .patch({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'parts');
      },
      `Update Part ${partId}`
    );

    this.clearCache(`part_${partId}`);
    this.clearCache();
    return result;
  }

  /**
   * Delete part from SharePoint
   */
  async deletePart(accessToken, partId) {
    const graphClient = createGraphClient(accessToken);

    await this.executeGraphRequest(
      graphClient,
      async () => {
        await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}`
          )
          .delete();
      },
      `Delete Part ${partId}`
    );

    this.clearCache(`part_${partId}`);
    this.clearCache();
    return true;
  }

  /**
   * Delete multiple parts from SharePoint
   */
  async deleteMultipleParts(accessToken, partIds) {
    const results = { succeeded: 0, failed: 0, errors: [] };

    const deletePromises = partIds.map(async (partId) => {
      try {
        await this.deletePart(accessToken, partId);
        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push({ partId, error: error.message });
      }
    });

    await Promise.all(deletePromises);
    return results;
  }

  // =================================================================
  // CATEGORIES OPERATIONS
  // =================================================================

  /**
   * Get all categories from SharePoint
   */
  async getCategories(accessToken) {
    const cacheKey = 'categories';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.categories}/items?$expand=fields`
          )
          .orderby('fields/Title')
          .get();

        return response.value.map((item) =>
          transformSharePointItem(item, 'categories')
        );
      },
      'Get Categories'
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get simple array of category names for dropdowns
   */
  async getCategoryNames(accessToken) {
    const categories = await this.getCategories(accessToken);
    return categories.map((cat) => cat.category);
  }

  /**
   * Get category lookup map for quick family resolution
   * HYBRID SOLUTION: Returns map of category name to family
   */
  async getCategoryMap(accessToken) {
    const categories = await this.getCategories(accessToken);
    const categoryMap = new Map();
    
    categories.forEach(cat => {
      categoryMap.set(cat.category, {
        id: cat.id,
        category: cat.category,
        family: cat.family,
        created: cat.created,
        modified: cat.modified
      });
    });
    
    return categoryMap;
  }

  /**
   * Get family for a specific category
   * HYBRID SOLUTION: Quick lookup without needing ID resolution
   */
  async getFamilyByCategory(accessToken, categoryName) {
    if (!categoryName) return null;
    
    const categoryMap = await this.getCategoryMap(accessToken);
    const categoryInfo = categoryMap.get(categoryName);
    
    return categoryInfo ? categoryInfo.family : null;
  }

  /**
   * Validate category name against Categories list
   * HYBRID SOLUTION: Application-level validation
   */
  async validateCategory(accessToken, categoryName) {
    if (!categoryName) return false;
    
    const categoryNames = await this.getCategoryNames(accessToken);
    return categoryNames.includes(categoryName);
  }

  /**
   * Get categories grouped by family
   * HYBRID SOLUTION: Enhanced category organization
   */
  async getCategoriesByFamily(accessToken) {
    const categories = await this.getCategories(accessToken);
    const familyMap = new Map();
    
    categories.forEach(cat => {
      const family = cat.family || 'Uncategorized';
      if (!familyMap.has(family)) {
        familyMap.set(family, []);
      }
      familyMap.get(family).push(cat);
    });
    
    return Object.fromEntries(familyMap);
  }

  // =================================================================
  // BUYERS OPERATIONS
  // =================================================================

  /**
   * Get all buyers from SharePoint
   */
  async getBuyers(accessToken, options = {}) {
    const cacheKey = `buyers_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        let query = graphClient.api(
          `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items?$expand=fields`
        );

        if (options.filter) {
          query = query.filter(options.filter);
        }

        if (options.orderBy) {
          query = query.orderby(options.orderBy);
        } else {
          query = query.orderby('fields/Title');
        }

        if (options.top) {
          query = query.top(options.top);
        }

        const response = await query.get();
        return response.value.map((item) =>
          transformSharePointItem(item, 'buyers')
        );
      },
      'Get Buyers'
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get simple array of buyer names for dropdowns
   */
  async getBuyerNames(accessToken) {
    const buyers = await this.getBuyers(accessToken);
    return buyers.map((buyer) => buyer.buyerName);
  }

  /**
   * Get single buyer by ID
   */
  async getBuyerById(accessToken, buyerId) {
    const cacheKey = `buyer_${buyerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items/${buyerId}?$expand=fields`
          )
          .get();

        return transformSharePointItem(response, 'buyers');
      },
      `Get Buyer ${buyerId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Create new buyer in SharePoint
   */
  async createBuyer(accessToken, buyerData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(buyerData, 'buyers');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items`
          )
          .post({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'buyers');
      },
      'Create Buyer'
    );

    this.clearCache();
    return result;
  }

  /**
   * Update existing buyer in SharePoint
   */
  async updateBuyer(accessToken, buyerId, buyerData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(buyerData, 'buyers');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items/${buyerId}`
          )
          .patch({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'buyers');
      },
      `Update Buyer ${buyerId}`
    );

    this.clearCache(`buyer_${buyerId}`);
    this.clearCache();
    return result;
  }

  /**
   * Delete buyer from SharePoint
   */
  async deleteBuyer(accessToken, buyerId) {
    const graphClient = createGraphClient(accessToken);

    await this.executeGraphRequest(
      graphClient,
      async () => {
        await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.buyers}/items/${buyerId}`
          )
          .delete();
      },
      `Delete Buyer ${buyerId}`
    );

    this.clearCache(`buyer_${buyerId}`);
    this.clearCache();
    return true;
  }

  /**
   * Delete multiple buyers from SharePoint
   */
  async deleteMultipleBuyers(accessToken, buyerIds) {
    const results = { succeeded: 0, failed: 0, errors: [] };

    const deletePromises = buyerIds.map(async (buyerId) => {
      try {
        await this.deleteBuyer(accessToken, buyerId);
        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push({ buyerId, error: error.message });
      }
    });

    await Promise.all(deletePromises);
    return results;
  }

  // =================================================================
  // INVOICES OPERATIONS
  // =================================================================

  /**
   * Get all invoices from SharePoint
   */
  async getInvoices(accessToken, options = {}) {
    const cacheKey = `invoices_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        let query = graphClient.api(
          `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items?$expand=fields`
        );

        if (options.filter) {
          query = query.filter(options.filter);
        }

        if (options.orderBy) {
          query = query.orderby(options.orderBy);
        } else {
          query = query.orderby('fields/Created desc');
        }

        if (options.top) {
          query = query.top(options.top);
        }

        const response = await query.get();
        return response.value.map((item) =>
          transformSharePointItem(item, 'invoices')
        );
      },
      'Get Invoices'
    );

    this.setCache(cacheKey, result);
    return result;
  }

/**
   * Get single invoice by ID from SharePoint
   * MISSING METHOD - Add this to your SharePoint service
   */
  async getInvoice(accessToken, invoiceId, options = {}) {
    const cacheKey = `invoice_${invoiceId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        let query = graphClient.api(
          `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items/${invoiceId}`
        ).expand('fields');

        // Add expand options if provided
        if (options.expand && options.expand.includes('Buyer')) {
          query = query.expand('fields($expand=Buyer)');
        }

        const response = await query.get();
        return transformSharePointItem(response, 'invoices');
      },
      `Get Invoice ${invoiceId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get invoice by invoice number (not SharePoint ID)
   * Useful for looking up invoices by their business ID
   */
  async getInvoiceByNumber(accessToken, invoiceNumber) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items`)
          .filter(`fields/Title eq '${invoiceNumber}'`)
          .expand('fields')
          .top(1)
          .get();

        if (response.value && response.value.length > 0) {
          return transformSharePointItem(response.value[0], 'invoices');
        }

        return null;
      },
      `Get Invoice by Number ${invoiceNumber}`
    );

    return result;
  }

  /**
   * Get single invoice by ID
   */
  async getInvoiceById(accessToken, invoiceId) {
    const cacheKey = `invoice_${invoiceId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items/${invoiceId}?$expand=fields`
          )
          .get();

        return transformSharePointItem(response, 'invoices');
      },
      `Get Invoice ${invoiceId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Create new invoice in SharePoint and automatically create transactions
   * COMPLETE FIXED VERSION - includes transaction creation and proper part validation
   */
  async createInvoice(accessToken, invoiceData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        console.log('🔍 Starting createInvoice with data:', invoiceData);

        // 1. VALIDATE: Check inventory levels for each line item FIRST
        if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
          console.log(`📦 Validating inventory for ${invoiceData.lineItems.length} line items`);
          
          for (const item of invoiceData.lineItems) {
            console.log(`🔍 Checking inventory for part: ${item.partId}`);
            
            // Use the fixed getPartById method (with filter)
            const part = await this.getPartById(accessToken, item.partId);
            if (!part) {
              throw new Error(`Part ${item.partId} not found`);
            }
            
            console.log(`📊 Part ${item.partId}: Available=${part.inventoryOnHand}, Required=${item.quantity}`);
            
            if (part.inventoryOnHand < item.quantity) {
              throw new Error(
                `Insufficient stock for ${item.partId}. Available: ${part.inventoryOnHand}, Required: ${item.quantity}`
              );
            }
          }
          console.log('✅ All inventory validations passed');
        }

        // 2. Create the invoice record with status 'Finalized'
        console.log('📝 Creating invoice record...');
        const finalizedInvoiceData = {
          ...invoiceData,
          status: 'Finalized'
        };

        const sharePointData = transformToSharePoint(finalizedInvoiceData, 'invoices');
        console.log('📄 SharePoint invoice data:', sharePointData);

        const invoiceResponse = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items`
          )
          .post({
            fields: sharePointData,
          });

        const createdInvoice = transformSharePointItem(invoiceResponse, 'invoices');
        console.log('✅ Invoice created successfully:', createdInvoice.id);

        // 3. Create "Out (Sold)" transactions for each line item
        const transactions = [];
        if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
          console.log(`🔄 Creating ${invoiceData.lineItems.length} transactions...`);
          
          for (const item of invoiceData.lineItems) {
            const transactionData = {
              partId: item.partId,
              movementType: 'Out (Sold)',
              quantity: item.quantity,
              unitCost: item.unitCost || 0,
              unitPrice: item.unitPrice || 0,
              invoice: createdInvoice.invoiceNumber || createdInvoice.id.toString(),
              buyer: invoiceData.buyer || '',
              notes: `Sale - Invoice ${createdInvoice.invoiceNumber || createdInvoice.id}`
            };

            console.log('📝 Creating transaction:', transactionData);
            
            // Create the transaction (this also updates part inventory via createTransaction method)
            const transaction = await this.createTransaction(accessToken, transactionData);
            transactions.push(transaction);
            
            console.log('✅ Transaction created:', transaction.id);
          }
        }

        console.log(`✅ Successfully created invoice with ${transactions.length} transactions`);

        return {
          ...createdInvoice,
          transactions
        };
      },
      'Create Invoice with Transactions'
    );

    this.clearCache();
    return result;
  }

  /**
   * Void an invoice - FIXED: Uses invoice number to find transactions
   */
  async voidInvoice(accessToken, invoiceId) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        // 1. Get invoice details to ensure it can be voided
        const invoice = await this.getInvoiceById(accessToken, invoiceId);
        if (!invoice) {
          throw new Error(`Invoice ${invoiceId} not found`);
        }
        
        if (invoice.status === 'Void') {
          throw new Error('Invoice is already voided');
        }

        if (invoice.status !== 'Finalized' && invoice.status !== 'Paid') {
          throw new Error('Only Finalized or Paid invoices can be voided');
        }

        console.log(`🔍 Looking for transactions for invoice number: ${invoice.invoiceNumber}`);

        // 2. FIXED: Get original "Out" transactions using invoice number, not SharePoint ID
        const originalTransactions = await this.getTransactions(accessToken, {
          filter: `fields/Invoice eq '${invoice.invoiceNumber}' and fields/MovementType eq 'Out (Sold)'`
        });

        console.log(`📦 Found ${originalTransactions.length} transactions to void`);

        if (originalTransactions.length === 0) {
          throw new Error(`No transactions found for invoice ${invoice.invoiceNumber}`);
        }

        // 3. Create offsetting "In" transactions
        const voidTransactions = [];
        for (const transaction of originalTransactions) {
          const voidTransactionData = {
            partId: transaction.partId,
            movementType: 'Void adjustment', // ← Change from 'In (Received)'
            quantity: transaction.quantity,
            unitCost: transaction.unitCost || 0,
            unitPrice: transaction.unitPrice || 0,
            invoice: invoice.invoiceNumber, // Use invoice number consistently
            buyer: transaction.buyer,
            notes: `Void adjustment - Invoice ${invoice.invoiceNumber} voided`
          };

          console.log(`📝 Creating void transaction for part ${transaction.partId}`);
          const voidTransaction = await this.createTransaction(accessToken, voidTransactionData);
          voidTransactions.push(voidTransaction);
        }

        // 4. Update invoice status to "Void"
        const sharePointData = transformToSharePoint({
          invoiceNumber: invoice.invoiceNumber,
          buyer: invoice.buyer,
          invoiceDate: invoice.invoiceDate,
          totalAmount: invoice.totalAmount,
          notes: invoice.notes,
          status: 'Void'
        }, 'invoices');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items/${invoiceId}`
          )
          .patch({
            fields: sharePointData,
          });

        console.log(`✅ Invoice ${invoice.invoiceNumber} successfully voided with ${voidTransactions.length} offsetting transactions`);

        return {
          invoice: transformSharePointItem(response, 'invoices'),
          voidTransactions
        };
      },
      `Void Invoice ${invoiceId}`
    );

    this.clearCache(`invoice_${invoiceId}`);
    this.clearCache();
    return result;
  }

  /**
   * Get line items for an invoice (transactions with this invoice reference)
   * FIXED: Ensure method is properly within SharePointService class
   */
  async getInvoiceLineItems(accessToken, invoiceId) {
    return await this.getTransactions(accessToken, {
      filter: `fields/Invoice eq '${invoiceId}'`,
      orderBy: 'fields/Created asc',
    });
  }

  // =================================================================
  // TRANSACTIONS OPERATIONS
  // =================================================================

  /**
   * Get transactions from SharePoint
   */
  async getTransactions(accessToken, options = {}) {
    const cacheKey = `transactions_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        let query = graphClient.api(
          `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items?$expand=fields`
        );

        if (options.filter) {
          query = query.filter(options.filter);
        }

        if (options.orderBy) {
          query = query.orderby(options.orderBy);
        } else {
          query = query.orderby('fields/Created desc');
        }

        if (options.top) {
          query = query.top(options.top);
        }

        const response = await query.get();
        return response.value.map((item) =>
          transformSharePointItem(item, 'transactions')
        );
      },
      'Get Transactions'
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Resolve Part ID to SharePoint item ID for lookup fields
   * ADD THIS METHOD to your SharePointService class
   */
  async resolvePartIdToItemId(accessToken, partId) {
    try {
      const graphClient = createGraphClient(accessToken);
      
      const response = await graphClient
        .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`)
        .filter(`fields/Title eq '${partId}'`)
        .select('id')
        .top(1)
        .get();
      
      if (response.value && response.value.length > 0) {
        console.log(`✅ Resolved Part ID "${partId}" to SharePoint item ID: ${response.value[0].id}`);
        return response.value[0].id;
      }
      
      console.warn(`⚠️ Could not resolve Part ID "${partId}" to SharePoint item ID`);
      return null;
    } catch (error) {
      console.error('Failed to resolve Part ID to item ID:', error);
      return null;
    }
  }

  /**
   * Create new transaction in SharePoint and update inventory levels
   * FIXED: Now properly updates part inventory after transaction creation
   */
  async createTransaction(accessToken, transactionData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        console.log('Creating transaction with data:', transactionData);

        // Step 1: Create the transaction record
        const sharePointData = transformToSharePoint(transactionData, 'transactions');
        const transactionResponse = await graphClient
          .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items`)
          .post({
            fields: sharePointData,
          });

        console.log('✅ Transaction created successfully:', transactionResponse.id);

        // Step 2: Update the part's inventory level
        await this.updatePartInventory(accessToken, transactionData.partId, transactionData.movementType, transactionData.quantity);

        return transformSharePointItem(transactionResponse, 'transactions');
      },
      'Create Transaction and Update Inventory'
    );

    this.clearCache();
    return result;
  }

  /**
   * Update part inventory levels based on transaction
   * CRITICAL METHOD: Updates InventoryOnHand field in Parts list
   */
  async updatePartInventory(accessToken, partId, movementType, quantity) {
    const graphClient = createGraphClient(accessToken);

    try {
      console.log(`🔄 Updating inventory for part ${partId}: ${movementType} ${quantity} units`);

      // Step 1: Get current part data
      const currentPart = await this.getPartByPartId(accessToken, partId);
      if (!currentPart) {
        throw new Error(`Part ${partId} not found`);
      }

      const currentInventory = currentPart.inventoryOnHand || 0;
      console.log(`📦 Current inventory for ${partId}: ${currentInventory} units`);

      // Step 2: Calculate new inventory level
      let newInventory;
      if (movementType === 'In (Received)' || movementType === 'Adjustment' || movementType === 'Void adjustment') {
        newInventory = currentInventory + quantity;
        console.log(`➕ Adding ${quantity} units: ${currentInventory} + ${quantity} = ${newInventory}`);
      } else if (movementType === 'Out (Sold)') {
        newInventory = currentInventory - quantity;
        console.log(`➖ Removing ${quantity} units: ${currentInventory} - ${quantity} = ${newInventory}`);
      } else {
        throw new Error(`Unknown movement type: ${movementType}`);
      }

      // Prevent negative inventory
      if (newInventory < 0) {
        console.warn(`⚠️ Inventory would go negative for ${partId}: ${newInventory}. Setting to 0.`);
        newInventory = 0;
      }

      // Step 3: Update the part's inventory in SharePoint
      const updateData = {
        InventoryOnHand: newInventory
      };

      await graphClient
        .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${currentPart.id}`)
        .patch({
          fields: updateData
        });

      console.log(`✅ Inventory updated successfully for ${partId}: ${currentInventory} → ${newInventory}`);

      // Clear cache to ensure fresh data on next load
      this.clearCache();

      return {
        partId,
        previousInventory: currentInventory,
        newInventory,
        changeAmount: newInventory - currentInventory
      };

    } catch (error) {
      console.error(`❌ Failed to update inventory for part ${partId}:`, error);
      throw new Error(`Failed to update inventory for part ${partId}: ${error.message}`);
    }
  }

  /**
   * Get part by Part ID (not SharePoint item ID)
   * Helper method for inventory updates
   */
  async getPartByPartId(accessToken, partId) {
    const graphClient = createGraphClient(accessToken);

    try {
      const response = await graphClient
        .api(`/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`)
        .filter(`fields/Title eq '${partId}'`)
        .expand('fields')
        .top(1)
        .get();

      if (response.value && response.value.length > 0) {
        return transformSharePointItem(response.value[0], 'parts');
      }

      return null;
    } catch (error) {
      console.error(`Failed to get part by ID ${partId}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction history for a specific part
   */
  async getPartTransactions(accessToken, partId) {
    const cacheKey = `part_transactions_${partId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items?$expand=fields`
          )
          .filter(`fields/Part eq '${partId}'`)
          .orderby('fields/Created desc')
          .get();

        return response.value.map((item) =>
          transformSharePointItem(item, 'transactions')
        );
      },
      `Get Transactions for Part ${partId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  // =================================================================
  // SEARCH OPERATIONS
  // =================================================================

  /**
   * Search across all lists
   * HYBRID SOLUTION: Enhanced search includes family information
   */
  async searchAll(accessToken, searchTerm, options = {}) {
    const results = {
      parts: [],
      buyers: [],
      invoices: [],
      transactions: [],
    };

    try {
      // Search parts by Part ID, Description, or Category
      const partsFilter = `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/Description) or substringof('${searchTerm}', fields/Category))`;
      results.parts = await this.getParts(accessToken, { filter: partsFilter, top: 10 });

      // Search buyers
      const buyersFilter = `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/ContactEmail))`;
      results.buyers = await this.getBuyers(accessToken, { filter: buyersFilter, top: 10 });

      // Search invoices
      const invoicesFilter = `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/Buyer))`;
      results.invoices = await this.getInvoices(accessToken, { filter: invoicesFilter, top: 10 });

      // Search transactions
      const transactionsFilter = `(substringof('${searchTerm}', fields/Part) or substringof('${searchTerm}', fields/Invoice))`;
      results.transactions = await this.getTransactions(accessToken, { filter: transactionsFilter, top: 10 });

    } catch (error) {
      console.error('Search failed:', error);
    }

    return results;
  }

  /**
   * Search parts with family information
   * HYBRID SOLUTION: Enhanced search includes family context
   */
  async searchPartsWithFamily(accessToken, searchTerm, options = {}) {
    // Get basic search results
    const partsFilter = `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/Description) or substringof('${searchTerm}', fields/Category))`;
    const parts = await this.getParts(accessToken, { filter: partsFilter, top: options.top || 20 });

    // Get category map for family lookups
    const categoryMap = await this.getCategoryMap(accessToken);

    // Enhance results with family information
    const enhancedParts = parts.map(part => ({
      ...part,
      family: categoryMap.get(part.category)?.family || 'Unknown'
    }));

    return enhancedParts;
  }

  // =================================================================
  // HEALTH CHECK & UTILITIES
  // =================================================================

  /**
   * Test SharePoint connection and permissions
   */
  async healthCheck(accessToken) {
    const graphClient = createGraphClient(accessToken);
    const results = {
      siteAccess: false,
      listsAccess: {},
      hybridSolutionStatus: {
        categoriesListWorking: false,
        categoryFieldType: 'unknown',
        categoryValidation: false
      },
      timestamp: new Date().toISOString(),
    };

    try {
      // Test site access
      await graphClient.api(`/sites/${this.siteId}`).get();
      results.siteAccess = true;

      // Test each list access
      for (const [listKey, listName] of Object.entries(SHAREPOINT_CONFIG.lists)) {
        try {
          await graphClient.api(`/sites/${this.siteId}/lists/${listName}`).get();
          results.listsAccess[listKey] = true;
        } catch (error) {
          results.listsAccess[listKey] = false;
        }
      }

      // Test hybrid solution components
      try {
        // Test categories list
        const categories = await this.getCategories(accessToken);
        results.hybridSolutionStatus.categoriesListWorking = categories.length > 0;

        // Test category field type (should be text now)
        const samplePart = await this.getParts(accessToken, { top: 1 });
        if (samplePart.length > 0) {
          results.hybridSolutionStatus.categoryFieldType = typeof samplePart[0].category === 'string' ? 'text' : 'lookup';
        }

        // Test category validation
        if (categories.length > 0) {
          const firstCategory = categories[0].category;
          results.hybridSolutionStatus.categoryValidation = await this.validateCategory(accessToken, firstCategory);
        }

      } catch (error) {
        console.error('Hybrid solution health check failed:', error);
      }

    } catch (error) {
      console.error('SharePoint health check failed:', error);
    }

    return results;
  }

  /**
   * Get comprehensive statistics for dashboard
   * HYBRID SOLUTION: Enhanced stats with family breakdowns
   */
  async getInventoryStats(accessToken) {
    try {
      const [parts, categories, buyers, invoices, transactions] = await Promise.all([
        this.getParts(accessToken),
        this.getCategories(accessToken),
        this.getBuyers(accessToken),
        this.getInvoices(accessToken),
        this.getTransactions(accessToken, { top: 100 })
      ]);

      // Calculate basic stats
      const totalParts = parts.length;
      const totalValue = parts.reduce((sum, part) => sum + (part.inventoryOnHand * part.unitCost), 0);
      const lowStockParts = parts.filter(part => part.inventoryOnHand <= 5 && part.inventoryOnHand > 0).length;
      const outOfStockParts = parts.filter(part => part.inventoryOnHand === 0).length;

      // Calculate family stats
      const categoryMap = await this.getCategoryMap(accessToken);
      const familyStats = {};
      
      parts.forEach(part => {
        const categoryInfo = categoryMap.get(part.category);
        const family = categoryInfo?.family || 'Unknown';
        
        if (!familyStats[family]) {
          familyStats[family] = {
            totalParts: 0,
            totalValue: 0,
            lowStockParts: 0,
            outOfStockParts: 0
          };
        }
        
        familyStats[family].totalParts++;
        familyStats[family].totalValue += (part.inventoryOnHand * part.unitCost);
        
        if (part.inventoryOnHand <= 5 && part.inventoryOnHand > 0) {
          familyStats[family].lowStockParts++;
        } else if (part.inventoryOnHand === 0) {
          familyStats[family].outOfStockParts++;
        }
      });

      // Calculate invoice stats
      const totalInvoices = invoices.length;
      const totalRevenue = invoices
        .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Finalized')
        .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

      return {
        overview: {
          totalParts,
          totalValue,
          lowStockParts,
          outOfStockParts,
          totalCategories: categories.length,
          totalFamilies: Object.keys(familyStats).length,
          totalBuyers: buyers.length,
          totalInvoices,
          totalRevenue,
          recentTransactions: transactions.length
        },
        familyBreakdown: familyStats,
        categoryBreakdown: categories.reduce((acc, cat) => {
          acc[cat.category] = {
            family: cat.family,
            partsCount: parts.filter(part => part.category === cat.category).length
          };
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get inventory stats:', error);
      throw error;
    }
  }

  // =================================================================
  // HYBRID SOLUTION SPECIFIC METHODS
  // =================================================================

  /**
   * Get enriched parts with family information
   * HYBRID SOLUTION: Automatically includes family data
   */
  async getPartsWithFamily(accessToken, options = {}) {
    const parts = await this.getParts(accessToken, options);
    const categoryMap = await this.getCategoryMap(accessToken);

    return parts.map(part => ({
      ...part,
      family: categoryMap.get(part.category)?.family || 'Unknown'
    }));
  }

  /**
   * Get parts grouped by family
   * HYBRID SOLUTION: Enhanced organization
   */
  async getPartsGroupedByFamily(accessToken) {
    const partsWithFamily = await this.getPartsWithFamily(accessToken);
    const familyGroups = {};

    partsWithFamily.forEach(part => {
      const family = part.family || 'Unknown';
      if (!familyGroups[family]) {
        familyGroups[family] = [];
      }
      familyGroups[family].push(part);
    });

    return familyGroups;
  }

  /**
   * Create part with category validation
   * HYBRID SOLUTION: Enhanced validation
   */
  async createPartWithValidation(accessToken, partData) {
    // Validate category against Categories list
    if (partData.category) {
      const isValidCategory = await this.validateCategory(accessToken, partData.category);
      if (!isValidCategory) {
        throw new Error(`Invalid category: "${partData.category}". Please select a valid category from the list.`);
      }
    }

    return await this.createPart(accessToken, partData);
  }

  /**
   * Update part with category validation
   * HYBRID SOLUTION: Enhanced validation
   */
  async updatePartWithValidation(accessToken, partId, partData) {
    // Validate category against Categories list
    if (partData.category) {
      const isValidCategory = await this.validateCategory(accessToken, partData.category);
      if (!isValidCategory) {
        throw new Error(`Invalid category: "${partData.category}". Please select a valid category from the list.`);
      }
    }

    return await this.updatePart(accessToken, partId, partData);
  }

  /**
   * Sync category data (for maintenance)
   * HYBRID SOLUTION: Utility for data consistency
   */
  async syncCategoryData(accessToken) {
    const results = {
      categoriesProcessed: 0,
      partsUpdated: 0,
      errors: []
    };

    try {
      const [categories, parts] = await Promise.all([
        this.getCategories(accessToken),
        this.getParts(accessToken)
      ]);

      const validCategoryNames = categories.map(cat => cat.category);
      results.categoriesProcessed = validCategoryNames.length;

      // Find parts with invalid categories
      const partsToUpdate = parts.filter(part => 
        part.category && !validCategoryNames.includes(part.category)
      );

      // Update parts with invalid categories to "Uncategorized"
      for (const part of partsToUpdate) {
        try {
          await this.updatePart(accessToken, part.id, {
            ...part,
            category: 'Uncategorized'
          });
          results.partsUpdated++;
        } catch (error) {
          results.errors.push({
            partId: part.partId,
            error: error.message
          });
        }
      }

    } catch (error) {
      results.errors.push({
        general: error.message
      });
    }

    return results;
  }
}

// =================================================================
// SINGLETON INSTANCE
// =================================================================
const sharePointService = new SharePointService();

export default sharePointService;

// =================================================================
// CONVENIENCE EXPORTS
// =================================================================
export {
  SharePointService,
  SHAREPOINT_CONFIG,
  getSiteId,
  transformSharePointItem,
  transformToSharePoint,
};