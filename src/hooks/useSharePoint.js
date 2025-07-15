import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import sharePointService from '../services/sharepoint'

// =================================================================
// BASE SHAREPOINT HOOK
// =================================================================

/**
 * Base hook for SharePoint operations with authentication
 * @returns {Object} SharePoint operation executor
 */
export const useSharePointBase = () => {
  const { getAccessToken } = useAuth()
  const { error: showError } = useToast()

  /**
   * Execute a SharePoint operation with error handling
   * @param {Function} operation - Operation to execute with access token
   * @param {string} errorMessage - Custom error message
   * @returns {Promise<any>} Operation result
   */
  const executeOperation = useCallback(async (operation, errorMessage = 'Operation failed') => {
    try {
      const accessToken = await getAccessToken()
      
      if (!accessToken) {
        throw new Error('Authentication required. Please sign in.')
      }
      
      return await operation(accessToken)
    } catch (error) {
      console.error('SharePoint operation failed:', error)
      showError(error.message || errorMessage)
      throw error
    }
  }, [getAccessToken, showError])

  return { executeOperation }
}

// =================================================================
// PARTS HOOKS
// =================================================================

/**
 * Hook for managing parts data
 * @param {Object} options - Query options for parts
 * @returns {Object} Parts data and operations
 */
export const useParts = (options = {}) => {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true)

  /**
   * Load parts from SharePoint
   */
  const loadParts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getParts(token, options),
        'Failed to load parts'
      )
      
      if (isMountedRef.current) {
        setParts(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, options])

  /**
   * Create a new part
   * @param {Object} partData - Part data to create
   * @returns {Promise<Object>} Created part
   */
  const createPart = useCallback(async (partData) => {
    const result = await executeOperation(
      (token) => sharePointService.createPart(token, partData),
      'Failed to create part'
    )
    
    success('Part created successfully!')
    
    // Refresh parts list
    await loadParts()
    
    return result
  }, [executeOperation, success, loadParts])

  /**
   * Update an existing part
   * @param {string} partId - Part ID to update
   * @param {Object} partData - Updated part data
   * @returns {Promise<Object>} Updated part
   */
  const updatePart = useCallback(async (partId, partData) => {
    const result = await executeOperation(
      (token) => sharePointService.updatePart(token, partId, partData),
      'Failed to update part'
    )
    
    success('Part updated successfully!')
    
    // Update local state
    setParts(prevParts => 
      prevParts.map(part => 
        part.id === partId ? { ...part, ...result } : part
      )
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete a part
   * @param {string} partId - Part ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const deletePart = useCallback(async (partId) => {
    const result = await executeOperation(
      (token) => sharePointService.deletePart(token, partId),
      'Failed to delete part'
    )
    
    success('Part deleted successfully!')
    
    // Remove from local state
    setParts(prevParts => 
      prevParts.filter(part => part.id !== partId)
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete multiple parts
   * @param {Array<string>} partIds - Array of part IDs to delete
   * @returns {Promise<Object>} Results object
   */
  const deleteMultipleParts = useCallback(async (partIds) => {
    const result = await executeOperation(
      (token) => sharePointService.deleteMultipleParts(token, partIds),
      'Failed to delete parts'
    )
    
    if (result.succeeded > 0) {
      success(`Successfully deleted ${result.succeeded} part(s)`)
    }
    
    if (result.failed > 0) {
      console.warn('Some parts failed to delete:', result.errors)
    }
    
    // Refresh parts list
    await loadParts()
    
    return result
  }, [executeOperation, success, loadParts])

  /**
   * Refresh parts data
   */
  const refreshParts = useCallback(() => {
    loadParts()
  }, [loadParts])

  // Load parts on mount and when options change
  useEffect(() => {
    isMountedRef.current = true
    loadParts()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadParts])

  return {
    parts,
    loading,
    error,
    createPart,
    updatePart,
    deletePart,
    deleteMultipleParts,
    refreshParts
  }
}

/**
 * Hook for managing a single part
 * @param {string} partId - Part ID to manage
 * @returns {Object} Single part data and operations
 */
export const usePart = (partId) => {
  const [part, setPart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  const isMountedRef = useRef(true)

  /**
   * Load single part from SharePoint
   */
  const loadPart = useCallback(async () => {
    if (!partId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getPartById(token, partId),
        'Failed to load part details'
      )
      
      if (isMountedRef.current) {
        setPart(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, partId])

  /**
   * Update the current part
   * @param {Object} partData - Updated part data
   * @returns {Promise<Object>} Updated part
   */
  const updatePart = useCallback(async (partData) => {
    const result = await executeOperation(
      (token) => sharePointService.updatePart(token, partId, partData),
      'Failed to update part'
    )
    
    success('Part updated successfully!')
    setPart(result)
    
    return result
  }, [executeOperation, partId, success])

  /**
   * Delete the current part
   * @returns {Promise<boolean>} Success status
   */
  const deletePart = useCallback(async () => {
    const result = await executeOperation(
      (token) => sharePointService.deletePart(token, partId),
      'Failed to delete part'
    )
    
    success('Part deleted successfully!')
    setPart(null)
    
    return result
  }, [executeOperation, partId, success])

  // Load part on mount and when partId changes
  useEffect(() => {
    isMountedRef.current = true
    loadPart()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadPart])

  return {
    part,
    loading,
    error,
    updatePart,
    deletePart,
    refreshPart: loadPart
  }
}

// =================================================================
// CATEGORIES HOOKS
// =================================================================

/**
 * Hook for managing categories data
 * @returns {Object} Categories data and operations
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [categoryNames, setCategoryNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  const isMountedRef = useRef(true)

  /**
   * Load categories from SharePoint
   */
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [categoriesResult, categoryNamesResult] = await Promise.all([
        executeOperation(
          (token) => sharePointService.getCategories(token),
          'Failed to load categories'
        ),
        executeOperation(
          (token) => sharePointService.getCategoryNames(token),
          'Failed to load category names'
        )
      ])
      
      if (isMountedRef.current) {
        setCategories(categoriesResult)
        setCategoryNames(categoryNamesResult)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation])

  // Load categories on mount
  useEffect(() => {
    isMountedRef.current = true
    loadCategories()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadCategories])

  return {
    categories,
    categoryNames,
    loading,
    error,
    refreshCategories: loadCategories
  }
}

// =================================================================
// BUYERS HOOKS
// =================================================================

/**
 * Hook for managing buyers data
 * @param {Object} options - Query options for buyers
 * @returns {Object} Buyers data and operations
 */
export const useBuyers = (options = {}) => {
  const [buyers, setBuyers] = useState([])
  const [buyerNames, setBuyerNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  const isMountedRef = useRef(true)

  /**
   * Load buyers from SharePoint
   */
  const loadBuyers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [buyersResult, buyerNamesResult] = await Promise.all([
        executeOperation(
          (token) => sharePointService.getBuyers(token, options),
          'Failed to load buyers'
        ),
        executeOperation(
          (token) => sharePointService.getBuyerNames(token),
          'Failed to load buyer names'
        )
      ])
      
      if (isMountedRef.current) {
        setBuyers(buyersResult)
        setBuyerNames(buyerNamesResult)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, options])

  /**
   * Create a new buyer
   * @param {Object} buyerData - Buyer data to create
   * @returns {Promise<Object>} Created buyer
   */
  const createBuyer = useCallback(async (buyerData) => {
    const result = await executeOperation(
      (token) => sharePointService.createBuyer(token, buyerData),
      'Failed to create buyer'
    )
    
    success('Buyer created successfully!')
    
    // Refresh buyers list
    await loadBuyers()
    
    return result
  }, [executeOperation, success, loadBuyers])

  /**
   * Update an existing buyer
   * @param {string} buyerId - Buyer ID to update
   * @param {Object} buyerData - Updated buyer data
   * @returns {Promise<Object>} Updated buyer
   */
  const updateBuyer = useCallback(async (buyerId, buyerData) => {
    const result = await executeOperation(
      (token) => sharePointService.updateBuyer(token, buyerId, buyerData),
      'Failed to update buyer'
    )
    
    success('Buyer updated successfully!')
    
    // Update local state
    setBuyers(prevBuyers => 
      prevBuyers.map(buyer => 
        buyer.id === buyerId ? { ...buyer, ...result } : buyer
      )
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete a buyer
   * @param {string} buyerId - Buyer ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const deleteBuyer = useCallback(async (buyerId) => {
    const result = await executeOperation(
      (token) => sharePointService.deleteBuyer(token, buyerId),
      'Failed to delete buyer'
    )
    
    success('Buyer deleted successfully!')
    
    // Remove from local state
    setBuyers(prevBuyers => 
      prevBuyers.filter(buyer => buyer.id !== buyerId)
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete multiple buyers
   * @param {Array<string>} buyerIds - Array of buyer IDs to delete
   * @returns {Promise<Object>} Results object
   */
  const deleteMultipleBuyers = useCallback(async (buyerIds) => {
    const result = await executeOperation(
      (token) => sharePointService.deleteMultipleBuyers(token, buyerIds),
      'Failed to delete buyers'
    )
    
    if (result.succeeded > 0) {
      success(`Successfully deleted ${result.succeeded} buyer(s)`)
    }
    
    if (result.failed > 0) {
      console.warn('Some buyers failed to delete:', result.errors)
    }
    
    // Refresh buyers list
    await loadBuyers()
    
    return result
  }, [executeOperation, success, loadBuyers])

  /**
   * Refresh buyers data
   */
  const refreshBuyers = useCallback(() => {
    loadBuyers()
  }, [loadBuyers])

  // Load buyers on mount and when options change
  useEffect(() => {
    isMountedRef.current = true
    loadBuyers()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadBuyers])

  return {
    buyers,
    buyerNames,
    loading,
    error,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    deleteMultipleBuyers,
    refreshBuyers
  }
}

/**
 * Hook for managing a single buyer
 * @param {string} buyerId - Buyer ID to manage
 * @returns {Object} Single buyer data and operations
 */
export const useBuyer = (buyerId) => {
  const [buyer, setBuyer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  const isMountedRef = useRef(true)

  /**
   * Load single buyer from SharePoint
   */
  const loadBuyer = useCallback(async () => {
    if (!buyerId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getBuyerById(token, buyerId),
        'Failed to load buyer details'
      )
      
      if (isMountedRef.current) {
        setBuyer(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, buyerId])

  /**
   * Update the current buyer
   * @param {Object} buyerData - Updated buyer data
   * @returns {Promise<Object>} Updated buyer
   */
  const updateBuyer = useCallback(async (buyerData) => {
    const result = await executeOperation(
      (token) => sharePointService.updateBuyer(token, buyerId, buyerData),
      'Failed to update buyer'
    )
    
    success('Buyer updated successfully!')
    setBuyer(result)
    
    return result
  }, [executeOperation, buyerId, success])

  /**
   * Delete the current buyer
   * @returns {Promise<boolean>} Success status
   */
  const deleteBuyer = useCallback(async () => {
    const result = await executeOperation(
      (token) => sharePointService.deleteBuyer(token, buyerId),
      'Failed to delete buyer'
    )
    
    success('Buyer deleted successfully!')
    setBuyer(null)
    
    return result
  }, [executeOperation, buyerId, success])

  // Load buyer on mount and when buyerId changes
  useEffect(() => {
    isMountedRef.current = true
    loadBuyer()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadBuyer])

  return {
    buyer,
    loading,
    error,
    updateBuyer,
    deleteBuyer,
    refreshBuyer: loadBuyer
  }
}

// =================================================================
// INVOICES HOOKS
// =================================================================

/**
 * Hook for managing invoices data
 * @param {Object} options - Query options for invoices
 * @returns {Object} Invoices data and operations
 */
export const useInvoices = (options = {}) => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  const isMountedRef = useRef(true)

  /**
   * Load invoices from SharePoint
   */
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getInvoices(token, options),
        'Failed to load invoices'
      )
      
      if (isMountedRef.current) {
        setInvoices(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, options])

  /**
   * Create a new invoice
   * @param {Object} invoiceData - Invoice data to create
   * @returns {Promise<Object>} Created invoice
   */
  const createInvoice = useCallback(async (invoiceData) => {
    const result = await executeOperation(
      (token) => sharePointService.createInvoice(token, invoiceData),
      'Failed to create invoice'
    )
    
    success('Invoice created successfully!')
    
    // Refresh invoices list
    await loadInvoices()
    
    return result
  }, [executeOperation, success, loadInvoices])

  /**
   * Update an existing invoice
   * @param {string} invoiceId - Invoice ID to update
   * @param {Object} invoiceData - Updated invoice data
   * @returns {Promise<Object>} Updated invoice
   */
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    const result = await executeOperation(
      (token) => sharePointService.updateInvoice(token, invoiceId, invoiceData),
      'Failed to update invoice'
    )
    
    success('Invoice updated successfully!')
    
    // Update local state
    setInvoices(prevInvoices => 
      prevInvoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, ...result } : invoice
      )
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete an invoice
   * @param {string} invoiceId - Invoice ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const deleteInvoice = useCallback(async (invoiceId) => {
    const result = await executeOperation(
      (token) => sharePointService.deleteInvoice(token, invoiceId),
      'Failed to delete invoice'
    )
    
    success('Invoice deleted successfully!')
    
    // Remove from local state
    setInvoices(prevInvoices => 
      prevInvoices.filter(invoice => invoice.id !== invoiceId)
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete multiple invoices
   * @param {Array<string>} invoiceIds - Array of invoice IDs to delete
   * @returns {Promise<Object>} Results object
   */
  const deleteMultipleInvoices = useCallback(async (invoiceIds) => {
    const result = await executeOperation(
      (token) => sharePointService.deleteMultipleInvoices(token, invoiceIds),
      'Failed to delete invoices'
    )
    
    if (result.succeeded > 0) {
      success(`Successfully deleted ${result.succeeded} invoice(s)`)
    }
    
    if (result.failed > 0) {
      console.warn('Some invoices failed to delete:', result.errors)
    }
    
    // Refresh invoices list
    await loadInvoices()
    
    return result
  }, [executeOperation, success, loadInvoices])

  /**
   * Finalize an invoice (convert from Draft to Finalized)
   * @param {string} invoiceId - Invoice ID to finalize
   * @param {Array} lineItems - Array of line items for the invoice
   * @returns {Promise<Object>} Finalized invoice with transaction records
   */
  const finalizeInvoice = useCallback(async (invoiceId, lineItems) => {
    const result = await executeOperation(
      (token) => sharePointService.finalizeInvoice(token, invoiceId, lineItems),
      'Failed to finalize invoice'
    )
    
    success('Invoice finalized successfully!')
    
    // Update local state
    setInvoices(prevInvoices => 
      prevInvoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, status: 'Finalized' } : invoice
      )
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Refresh invoices data
   */
  const refreshInvoices = useCallback(() => {
    loadInvoices()
  }, [loadInvoices])

  // Load invoices on mount and when options change
  useEffect(() => {
    isMountedRef.current = true
    loadInvoices()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadInvoices])

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    deleteMultipleInvoices,
    finalizeInvoice,
    refreshInvoices
  }
}

/**
 * Hook for managing a single invoice
 * @param {string} invoiceId - Invoice ID to manage
 * @returns {Object} Single invoice data and operations
 */
export const useInvoice = (invoiceId) => {
  const [invoice, setInvoice] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  const isMountedRef = useRef(true)

  /**
   * Load single invoice from SharePoint
   */
  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [invoiceResult, lineItemsResult] = await Promise.all([
        executeOperation(
          (token) => sharePointService.getInvoiceById(token, invoiceId),
          'Failed to load invoice details'
        ),
        executeOperation(
          (token) => sharePointService.getInvoiceLineItems(token, invoiceId),
          'Failed to load invoice line items'
        )
      ])
      
      if (isMountedRef.current) {
        setInvoice(invoiceResult)
        setLineItems(lineItemsResult)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, invoiceId])

  /**
   * Update the current invoice
   * @param {Object} invoiceData - Updated invoice data
   * @returns {Promise<Object>} Updated invoice
   */
  const updateInvoice = useCallback(async (invoiceData) => {
    const result = await executeOperation(
      (token) => sharePointService.updateInvoice(token, invoiceId, invoiceData),
      'Failed to update invoice'
    )
    
    success('Invoice updated successfully!')
    setInvoice(result)
    
    return result
  }, [executeOperation, invoiceId, success])

  /**
   * Delete the current invoice
   * @returns {Promise<boolean>} Success status
   */
  const deleteInvoice = useCallback(async () => {
    const result = await executeOperation(
      (token) => sharePointService.deleteInvoice(token, invoiceId),
      'Failed to delete invoice'
    )
    
    success('Invoice deleted successfully!')
    setInvoice(null)
    
    return result
  }, [executeOperation, invoiceId, success])

  /**
   * Finalize the current invoice
   * @returns {Promise<Object>} Finalized invoice with transaction records
   */
  const finalizeInvoice = useCallback(async () => {
    const result = await executeOperation(
      (token) => sharePointService.finalizeInvoice(token, invoiceId, lineItems),
      'Failed to finalize invoice'
    )
    
    success('Invoice finalized successfully!')
    setInvoice(prev => ({ ...prev, status: 'Finalized' }))
    
    return result
  }, [executeOperation, invoiceId, lineItems, success])

  // Load invoice on mount and when invoiceId changes
  useEffect(() => {
    isMountedRef.current = true
    loadInvoice()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadInvoice])

  return {
    invoice,
    lineItems,
    loading,
    error,
    updateInvoice,
    deleteInvoice,
    finalizeInvoice,
    refreshInvoice: loadInvoice
  }
}

// =================================================================
// TRANSACTIONS HOOKS
// =================================================================

/**
 * Hook for managing transactions data
 * @param {Object} options - Query options for transactions
 * @returns {Object} Transactions data and operations
 */
export const useTransactions = (options = {}) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  const isMountedRef = useRef(true)

  /**
   * Load transactions from SharePoint
   */
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getTransactions(token, options),
        'Failed to load transactions'
      )
      
      if (isMountedRef.current) {
        setTransactions(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, options])

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data to create
   * @returns {Promise<Object>} Created transaction
   */
  const createTransaction = useCallback(async (transactionData) => {
    const result = await executeOperation(
      (token) => sharePointService.createTransaction(token, transactionData),
      'Failed to create transaction'
    )
    
    success('Transaction created successfully!')
    
    // Refresh transactions list
    await loadTransactions()
    
    return result
  }, [executeOperation, success, loadTransactions])

  /**
   * Refresh transactions data
   */
  const refreshTransactions = useCallback(() => {
    loadTransactions()
  }, [loadTransactions])

  // Load transactions on mount and when options change
  useEffect(() => {
    isMountedRef.current = true
    loadTransactions()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadTransactions])

  return {
    transactions,
    loading,
    error,
    createTransaction,
    refreshTransactions
  }
}

/**
 * Hook for getting transactions for a specific part
 * @param {string} partId - Part ID to get transactions for
 * @returns {Object} Part transactions data
 */
export const usePartTransactions = (partId) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  const isMountedRef = useRef(true)

  /**
   * Load transactions for specific part
   */
  const loadPartTransactions = useCallback(async () => {
    if (!partId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getPartTransactions(token, partId),
        'Failed to load part transactions'
      )
      
      if (isMountedRef.current) {
        setTransactions(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, partId])

  // Load transactions on mount and when partId changes
  useEffect(() => {
    isMountedRef.current = true
    loadPartTransactions()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadPartTransactions])

  return {
    transactions,
    loading,
    error,
    refreshTransactions: loadPartTransactions
  }
}

// =================================================================
// HEALTH CHECK HOOK
// =================================================================

/**
 * Hook for SharePoint health checks and connection testing
 * @returns {Object} Health check operations
 */
export const useSharePointHealth = () => {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  /**
   * Run SharePoint health check
   */
  const checkHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.healthCheck(token),
        'Health check failed'
      )
      
      setHealthStatus(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [executeOperation])

  return {
    healthStatus,
    loading,
    error,
    checkHealth
  }
}

// =================================================================
// COMBINED DATA HOOK
// =================================================================

/**
 * Hook that combines multiple SharePoint data sources for dashboard/overview
 * @returns {Object} Combined data from multiple sources
 */
export const useSharePointData = () => {
  const { parts, loading: partsLoading, error: partsError } = useParts()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()
  const { buyers, loading: buyersLoading, error: buyersError } = useBuyers()
  const { invoices, loading: invoicesLoading, error: invoicesError } = useInvoices()
  
  const loading = partsLoading || categoriesLoading || buyersLoading || invoicesLoading
  const error = partsError || categoriesError || buyersError || invoicesError
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!parts.length && !invoices.length) return null
    
    const totalParts = parts.length
    const totalValue = parts.reduce((sum, part) => 
      sum + (part.inventoryOnHand * part.unitCost), 0
    )
    const lowStockParts = parts.filter(part => part.inventoryOnHand <= 5).length
    const outOfStockParts = parts.filter(part => part.inventoryOnHand === 0).length
    
    const totalInvoices = invoices.length
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Finalized')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const draftInvoices = invoices.filter(invoice => invoice.status === 'Draft').length
    const paidInvoices = invoices.filter(invoice => invoice.status === 'Paid').length
    
    return {
      totalParts,
      totalValue,
      lowStockParts,
      outOfStockParts,
      categoriesCount: categories.length,
      buyersCount: buyers.length,
      totalInvoices,
      totalRevenue,
      draftInvoices,
      paidInvoices
    }
  }, [parts, categories, buyers, invoices])
  
  return {
    parts,
    categories,
    buyers,
    invoices,
    summary,
    loading,
    error
  }
}

// =================================================================
// UTILITY HOOKS
// =================================================================

/**
 * Hook for debouncing SharePoint operations
 * @param {Function} operation - Operation to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced operation
 */
export const useDebounceSharePoint = (operation, delay = 500) => {
  const timeoutRef = useRef()
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      operation(...args)
    }, delay)
  }, [operation, delay])
}

/**
 * Hook for managing SharePoint cache
 * @returns {Object} Cache management functions
 */
export const useSharePointCache = () => {
  const clearCache = useCallback((key) => {
    sharePointService.clearCache(key)
  }, [])
  
  const clearAllCache = useCallback(() => {
    sharePointService.clearCache()
  }, [])
  
  return {
    clearCache,
    clearAllCache
  }
}

// =================================================================
// ERROR BOUNDARY HOOK
// =================================================================

/**
 * Hook for handling SharePoint errors with fallback
 * @param {Function} fallbackFunction - Function to call on error
 * @returns {Object} Error handling utilities
 */
export const useSharePointErrorBoundary = (fallbackFunction) => {
  const [hasError, setHasError] = useState(false)
  const [errorInfo, setErrorInfo] = useState(null)
  
  const resetError = useCallback(() => {
    setHasError(false)
    setErrorInfo(null)
  }, [])
  
  const handleError = useCallback((error, errorInfo) => {
    setHasError(true)
    setErrorInfo({ error, errorInfo })
    
    if (fallbackFunction) {
      fallbackFunction(error, errorInfo)
    }
  }, [fallbackFunction])
  
  return {
    hasError,
    errorInfo,
    resetError,
    handleError
  }
}

// =================================================================
// SEARCH HOOKS
// =================================================================

/**
 * Hook for searching across multiple SharePoint lists
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options
 * @returns {Object} Search results and operations
 */
export const useSharePointSearch = (searchTerm, options = {}) => {
  const [results, setResults] = useState({
    parts: [],
    buyers: [],
    invoices: [],
    transactions: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  const isMountedRef = useRef(true)

  /**
   * Perform search across all lists
   */
  const performSearch = useCallback(async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults({ parts: [], buyers: [], invoices: [], transactions: [] })
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const searchResults = await executeOperation(
        (token) => sharePointService.searchAll(token, searchTerm, options),
        'Search failed'
      )
      
      if (isMountedRef.current) {
        setResults(searchResults)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [executeOperation, searchTerm, options])

  // Debounce search
  const debouncedSearch = useDebounceSharePoint(performSearch, 300)

  // Trigger search when searchTerm changes
  useEffect(() => {
    isMountedRef.current = true
    debouncedSearch()
    
    return () => {
      isMountedRef.current = false
    }
  }, [debouncedSearch])

  return {
    results,
    loading,
    error,
    performSearch
  }
}

// =================================================================
// EXPORT ALL HOOKS
// =================================================================

export default {
  // Base
  useSharePointBase,
  
  // Parts
  useParts,
  usePart,
  
  // Categories
  useCategories,
  
  // Buyers
  useBuyers,
  useBuyer,
  
  // Invoices
  useInvoices,
  useInvoice,
  
  // Transactions
  useTransactions,
  usePartTransactions,
  
  // Health & Utilities
  useSharePointHealth,
  useSharePointData,
  useSharePointSearch,
  useDebounceSharePoint,
  useSharePointCache,
  useSharePointErrorBoundary
}