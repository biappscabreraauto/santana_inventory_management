// =================================================================
// SHAREPOINT SERVICE LAYER - COMPLETE WITH ALL CRUD OPERATIONS
// =================================================================
// This service handles all SharePoint operations using Microsoft Graph API
// It integrates with MSAL for authentication and provides clean CRUD operations

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
    console.error('❌ Invalid SharePoint URL:', error);
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

  // SharePoint fields are now directly on the item object, not nested in 'fields'
  const fields = sharePointItem.fields || sharePointItem;

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
        partId: fields.Part?.LookupValue || fields.Part,
        movementType: fields.MovementType,
        quantity: fields.Quantity || 0,
        unitCost: fields.UnitCost || 0,
        unitPrice: fields.UnitPrice || 0,
        invoice: fields.Invoice?.LookupValue || fields.Invoice,
        notes: fields.Notes || '',
      };

    case 'invoices':
      return {
        ...baseItem,
        invoiceNumber: fields.Title,
        buyer: fields.Buyer?.LookupValue || fields.Buyer,
        buyerId: fields.Buyer?.LookupId || null,
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
 */
const transformToSharePoint = (data, listType) => {
  switch (listType) {
    case 'parts':
      return {
        Title: data.partId,
        Description: data.description,
        Category: data.category,
        InventoryOnHand: data.inventoryOnHand,
        UnitCost: data.unitCost,
        UnitPrice: data.unitPrice,
        Status: data.status,
      };

    case 'categories':
      return {
        Title: data.category,
        Family: data.family,
      };

    case 'buyers':
      return {
        Title: data.buyerName,
        ContactEmail: data.contactEmail,
        Phone: data.phone,
      };

    case 'transactions':
      return {
        Part: data.partId,
        MovementType: data.movementType,
        Quantity: data.quantity,
        UnitCost: data.unitCost,
        UnitPrice: data.unitPrice,
        Invoice: data.invoice,
        Notes: data.notes,
      };

    case 'invoices':
      return {
        Title: data.invoiceNumber,
        Buyer: data.buyer,
        InvoiceDate: data.invoiceDate,
        TotalAmount: data.totalAmount,
        Status: data.status,
        Notes: data.notes,
      };

    default:
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
   * Get single part by ID
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
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}?$expand=fields`
          )
          .get();

        return transformSharePointItem(response, 'parts');
      },
      `Get Part ${partId}`
    );

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Create new part in SharePoint
   */
  async createPart(accessToken, partData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(partData, 'parts');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items`
          )
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
   */
  async updatePart(accessToken, partId, partData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(partData, 'parts');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.parts}/items/${partId}`
          )
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
   * Create new invoice in SharePoint
   */
  async createInvoice(accessToken, invoiceData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(invoiceData, 'invoices');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items`
          )
          .post({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'invoices');
      },
      'Create Invoice'
    );

    this.clearCache();
    return result;
  }

  /**
   * Update existing invoice in SharePoint
   */
  async updateInvoice(accessToken, invoiceId, invoiceData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(invoiceData, 'invoices');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items/${invoiceId}`
          )
          .patch({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'invoices');
      },
      `Update Invoice ${invoiceId}`
    );

    this.clearCache(`invoice_${invoiceId}`);
    this.clearCache();
    return result;
  }

  /**
   * Delete invoice from SharePoint
   */
  async deleteInvoice(accessToken, invoiceId) {
    const graphClient = createGraphClient(accessToken);

    await this.executeGraphRequest(
      graphClient,
      async () => {
        await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.invoices}/items/${invoiceId}`
          )
          .delete();
      },
      `Delete Invoice ${invoiceId}`
    );

    this.clearCache(`invoice_${invoiceId}`);
    this.clearCache();
    return true;
  }

  /**
   * Delete multiple invoices from SharePoint
   */
  async deleteMultipleInvoices(accessToken, invoiceIds) {
    const results = { succeeded: 0, failed: 0, errors: [] };

    const deletePromises = invoiceIds.map(async (invoiceId) => {
      try {
        await this.deleteInvoice(accessToken, invoiceId);
        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push({ invoiceId, error: error.message });
      }
    });

    await Promise.all(deletePromises);
    return results;
  }

  /**
   * Finalize an invoice (create transactions and update inventory)
   */
  async finalizeInvoice(accessToken, invoiceId, lineItems) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        // First, update the invoice status to 'Finalized'
        await this.updateInvoice(accessToken, invoiceId, { status: 'Finalized' });

        // Create transactions for each line item
        const transactionPromises = lineItems.map(async (item) => {
          const transactionData = {
            partId: item.partId,
            movementType: 'Out (Sold)',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            invoice: invoiceId,
            notes: `Invoice ${invoiceId} finalization`,
          };

          return await this.createTransaction(accessToken, transactionData);
        });

        const transactions = await Promise.all(transactionPromises);

        return {
          invoiceId,
          status: 'Finalized',
          transactions,
        };
      },
      `Finalize Invoice ${invoiceId}`
    );

    this.clearCache();
    return result;
  }

  /**
   * Get line items for an invoice (transactions with this invoice reference)
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
   * Create new transaction in SharePoint
   */
  async createTransaction(accessToken, transactionData) {
    const graphClient = createGraphClient(accessToken);

    const result = await this.executeGraphRequest(
      graphClient,
      async () => {
        const sharePointData = transformToSharePoint(transactionData, 'transactions');

        const response = await graphClient
          .api(
            `/sites/${this.siteId}/lists/${SHAREPOINT_CONFIG.lists.transactions}/items`
          )
          .post({
            fields: sharePointData,
          });

        return transformSharePointItem(response, 'transactions');
      },
      'Create Transaction'
    );

    this.clearCache();
    return result;
  }

  /**
   * Get transaction history for a specific part
   */
  async getPartTransactions(accessToken, partId) {
    const cacheKey = `transactions_${partId}`;
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
   */
  async searchAll(accessToken, searchTerm, options = {}) {
    const results = {
      parts: [],
      buyers: [],
      invoices: [],
      transactions: [],
    };

    try {
      // Search parts
      const partsFilter = `(substringof('${searchTerm}', fields/Title) or substringof('${searchTerm}', fields/Description))`;
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
      timestamp: new Date().toISOString(),
    };

    try {
      // Test site access
      await graphClient.api(`/sites/${this.siteId}`).get();
      results.siteAccess = true;

      // Test each list access
      for (const [listKey, listName] of Object.entries(
        SHAREPOINT_CONFIG.lists
      )) {
        try {
          await graphClient.api(`/sites/${this.siteId}/lists/${listName}`).get();
          results.listsAccess[listKey] = true;
        } catch (error) {
          results.listsAccess[listKey] = false;
        }
      }
    } catch (error) {
      console.error('❌ SharePoint health check failed:', error);
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