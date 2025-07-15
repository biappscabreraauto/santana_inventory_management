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
// PARTS HOOKS - ENHANCED FOR HYBRID SOLUTION
// =================================================================

/**
 * Hook for managing parts data with family information
 * HYBRID SOLUTION: Enhanced with family support
 * @param {Object} options - Query options for parts
 * @returns {Object} Parts data and operations
 */
export const useParts = (options = {}) => {
  const [parts, setParts] = useState([])
  const [partsWithFamily, setPartsWithFamily] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  const { success } = useToast()
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true)

  /**
   * Load parts from SharePoint with family information
   * HYBRID SOLUTION: Automatically includes family data
   */
  const loadParts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get parts with family information
      const result = await executeOperation(
        (token) => sharePointService.getPartsWithFamily(token, options),
        'Failed to load parts'
      )
      
      if (isMountedRef.current) {
        setPartsWithFamily(result)
        // Also maintain backward compatibility
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
  }, [executeOperation, JSON.stringify(options)])

  /**
   * Create a new part with validation
   * HYBRID SOLUTION: Includes category validation
   */
  const createPart = useCallback(async (partData) => {
    const result = await executeOperation(
      (token) => sharePointService.createPartWithValidation(token, partData),
      'Failed to create part'
    )
    
    success('Part created successfully!')
    
    // Refresh parts list
    await loadParts()
    
    return result
  }, [executeOperation, success, loadParts])

  /**
   * Update an existing part with validation
   * HYBRID SOLUTION: Includes category validation
   */
  const updatePart = useCallback(async (partId, partData) => {
    const result = await executeOperation(
      (token) => sharePointService.updatePartWithValidation(token, partId, partData),
      'Failed to update part'
    )
    
    success('Part updated successfully!')
    
    // Update local state with family information
    setPartsWithFamily(prevParts => 
      prevParts.map(part => 
        part.id === partId ? { ...part, ...result } : part
      )
    )
    setParts(prevParts => 
      prevParts.map(part => 
        part.id === partId ? { ...part, ...result } : part
      )
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete a part
   */
  const deletePart = useCallback(async (partId) => {
    const result = await executeOperation(
      (token) => sharePointService.deletePart(token, partId),
      'Failed to delete part'
    )
    
    success('Part deleted successfully!')
    
    // Remove from local state
    setPartsWithFamily(prevParts => 
      prevParts.filter(part => part.id !== partId)
    )
    setParts(prevParts => 
      prevParts.filter(part => part.id !== partId)
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete multiple parts
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
   * Get parts grouped by family
   * HYBRID SOLUTION: Enhanced organization
   */
  const getPartsGroupedByFamily = useCallback(async () => {
    return await executeOperation(
      (token) => sharePointService.getPartsGroupedByFamily(token),
      'Failed to get parts grouped by family'
    )
  }, [executeOperation])

  /**
   * Search parts with family context
   * HYBRID SOLUTION: Enhanced search
   */
  const searchPartsWithFamily = useCallback(async (searchTerm, searchOptions = {}) => {
    return await executeOperation(
      (token) => sharePointService.searchPartsWithFamily(token, searchTerm, searchOptions),
      'Failed to search parts'
    )
  }, [executeOperation])

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
    partsWithFamily, // HYBRID SOLUTION: New property with family data
    loading,
    error,
    createPart,
    updatePart,
    deletePart,
    deleteMultipleParts,
    getPartsGroupedByFamily, // HYBRID SOLUTION: New method
    searchPartsWithFamily, // HYBRID SOLUTION: New method
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
   * Update the current part with validation
   * HYBRID SOLUTION: Includes category validation
   */
  const updatePart = useCallback(async (partData) => {
    const result = await executeOperation(
      (token) => sharePointService.updatePartWithValidation(token, partId, partData),
      'Failed to update part'
    )
    
    success('Part updated successfully!')
    setPart(result)
    
    return result
  }, [executeOperation, partId, success])

  /**
   * Delete the current part
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
// CATEGORIES HOOKS - ENHANCED FOR HYBRID SOLUTION
// =================================================================

/**
 * Hook for managing categories data with enhanced hybrid features
 * HYBRID SOLUTION: Enhanced with family mapping and validation
 * @returns {Object} Categories data and operations
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [categoryNames, setCategoryNames] = useState([])
  const [categoryMap, setCategoryMap] = useState(new Map())
  const [categoriesByFamily, setCategoriesByFamily] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  const isMountedRef = useRef(true)

  /**
   * Load categories from SharePoint with enhanced processing
   * HYBRID SOLUTION: Builds category map and family groupings
   */
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [categoriesResult, categoryNamesResult, categoryMapResult, categoriesByFamilyResult] = await Promise.all([
        executeOperation(
          (token) => sharePointService.getCategories(token),
          'Failed to load categories'
        ),
        executeOperation(
          (token) => sharePointService.getCategoryNames(token),
          'Failed to load category names'
        ),
        executeOperation(
          (token) => sharePointService.getCategoryMap(token),
          'Failed to load category map'
        ),
        executeOperation(
          (token) => sharePointService.getCategoriesByFamily(token),
          'Failed to load categories by family'
        )
      ])
      
      if (isMountedRef.current) {
        setCategories(categoriesResult)
        setCategoryNames(categoryNamesResult)
        setCategoryMap(categoryMapResult)
        setCategoriesByFamily(categoriesByFamilyResult)
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

  /**
   * Get family for a specific category
   * HYBRID SOLUTION: Quick lookup using category map
   */
  const getFamilyByCategory = useCallback((categoryName) => {
    return categoryMap.get(categoryName)?.family || null
  }, [categoryMap])

  /**
   * Validate category name
   * HYBRID SOLUTION: Application-level validation
   */
  const validateCategory = useCallback(async (categoryName) => {
    return await executeOperation(
      (token) => sharePointService.validateCategory(token, categoryName),
      'Failed to validate category'
    )
  }, [executeOperation])

  /**
   * Get categories for a specific family
   * HYBRID SOLUTION: Enhanced filtering
   */
  const getCategoriesForFamily = useCallback((familyName) => {
    return categoriesByFamily[familyName] || []
  }, [categoriesByFamily])

  /**
   * Get unique family names
   * HYBRID SOLUTION: Helper for dropdowns
   */
  const getFamilyNames = useCallback(() => {
    return Object.keys(categoriesByFamily).sort()
  }, [categoriesByFamily])

  /**
   * Refresh categories data
   */
  const refreshCategories = useCallback(() => {
    loadCategories()
  }, [loadCategories])

  // Load categories on mount
  useEffect(() => {
    isMountedRef.current = true
    loadCategories()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadCategories])

  // Memoized computed values for performance
  const computedValues = useMemo(() => ({
    totalCategories: categories.length,
    totalFamilies: Object.keys(categoriesByFamily).length,
    familyNames: getFamilyNames(),
    categoryValidationMap: categoryNames.reduce((map, name) => {
      map[name] = true
      return map
    }, {})
  }), [categories, categoriesByFamily, categoryNames, getFamilyNames])

  return {
    categories,
    categoryNames,
    categoryMap,
    categoriesByFamily,
    loading,
    error,
    // HYBRID SOLUTION: New methods
    getFamilyByCategory,
    validateCategory,
    getCategoriesForFamily,
    getFamilyNames,
    refreshCategories,
    // HYBRID SOLUTION: Computed values
    ...computedValues
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
  }, [executeOperation, JSON.stringify(options)])

  /**
   * Create a new buyer
   */
  const createBuyer = useCallback(async (buyerData) => {
    const result = await executeOperation(
      (token) => sharePointService.createBuyer(token, buyerData),
      'Failed to create buyer'
    )
    
    success('Buyer created successfully!')
    await loadBuyers()
    
    return result
  }, [executeOperation, success, loadBuyers])

  /**
   * Update an existing buyer
   */
  const updateBuyer = useCallback(async (buyerId, buyerData) => {
    const result = await executeOperation(
      (token) => sharePointService.updateBuyer(token, buyerId, buyerData),
      'Failed to update buyer'
    )
    
    success('Buyer updated successfully!')
    
    setBuyers(prevBuyers => 
      prevBuyers.map(buyer => 
        buyer.id === buyerId ? { ...buyer, ...result } : buyer
      )
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete a buyer
   */
  const deleteBuyer = useCallback(async (buyerId) => {
    const result = await executeOperation(
      (token) => sharePointService.deleteBuyer(token, buyerId),
      'Failed to delete buyer'
    )
    
    success('Buyer deleted successfully!')
    
    setBuyers(prevBuyers => 
      prevBuyers.filter(buyer => buyer.id !== buyerId)
    )
    
    return result
  }, [executeOperation, success])

  /**
   * Delete multiple buyers
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
 * Hook for managing invoices data - UPDATED: Removed edit/delete, added void
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
  }, [executeOperation, JSON.stringify(options)])

  /**
   * Create a new invoice - UPDATED: Always creates as 'Finalized'
   */
  const createInvoice = useCallback(async (invoiceData) => {
    const result = await executeOperation(
      (token) => sharePointService.createInvoice(token, invoiceData),
      'Failed to create invoice'
    )
    
    success('Invoice created and finalized successfully!')
    await loadInvoices()
    
    return result
  }, [executeOperation, success, loadInvoices])

  // REMOVED: updateInvoice() - no longer supported
  // REMOVED: deleteInvoice() - no longer supported  
  // REMOVED: deleteMultipleInvoices() - no longer supported
  // REMOVED: finalizeInvoice() - handled in createInvoice()

  /**
   * Void an invoice - NEW: Create offsetting transactions
   */
  const voidInvoice = useCallback(async (invoiceId) => {
    const result = await executeOperation(
      (token) => sharePointService.voidInvoice(token, invoiceId),
      'Failed to void invoice'
    )
    
    success('Invoice voided successfully! Inventory restored.')
    
    setInvoices(prevInvoices => 
      prevInvoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, status: 'Void' } : invoice
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
    voidInvoice,
    refreshInvoices
  }
}

/**
 * Hook for managing a single invoice - UPDATED: Removed edit/delete, added void
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

  // REMOVED: updateInvoice() - no longer supported
  // REMOVED: deleteInvoice() - no longer supported
  // REMOVED: finalizeInvoice() - handled in creation

  /**
   * Void the current invoice - NEW: Create offsetting transactions
   */
  const voidInvoice = useCallback(async () => {
    const result = await executeOperation(
      (token) => sharePointService.voidInvoice(token, invoiceId),
      'Failed to void invoice'
    )
    
    success('Invoice voided successfully! Inventory restored.')
    setInvoice(prev => ({ ...prev, status: 'Void' }))
    
    return result
  }, [executeOperation, invoiceId, success])

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
    voidInvoice,
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
  }, [executeOperation, JSON.stringify(options)])

  /**
   * Create a new transaction
   */
  const createTransaction = useCallback(async (transactionData) => {
    const result = await executeOperation(
      (token) => sharePointService.createTransaction(token, transactionData),
      'Failed to create transaction'
    )
    
    success('Transaction created successfully!')
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
 * HYBRID SOLUTION: Enhanced with hybrid solution status
 * @returns {Object} Health check operations
 */
export const useSharePointHealth = () => {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  /**
   * Run SharePoint health check
   * HYBRID SOLUTION: Includes hybrid solution validation
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

  /**
   * Get inventory statistics
   * HYBRID SOLUTION: Enhanced stats with family breakdowns
   */
  const getInventoryStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getInventoryStats(token),
        'Failed to get inventory statistics'
      )
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [executeOperation])

  /**
   * Sync category data (maintenance operation)
   * HYBRID SOLUTION: Data consistency utility
   */
  const syncCategoryData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.syncCategoryData(token),
        'Failed to sync category data'
      )
      
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
    checkHealth,
    getInventoryStats, // HYBRID SOLUTION: Enhanced stats
    syncCategoryData // HYBRID SOLUTION: Maintenance utility
  }
}

// =================================================================
// COMBINED DATA HOOK - ENHANCED FOR HYBRID SOLUTION
// =================================================================

/**
 * Hook that combines multiple SharePoint data sources for dashboard/overview
 * HYBRID SOLUTION: Enhanced with family information and improved statistics
 * @returns {Object} Combined data from multiple sources
 */
export const useSharePointData = () => {
  const { partsWithFamily, loading: partsLoading, error: partsError } = useParts()
  const { 
    categories, 
    categoriesByFamily, 
    categoryMap,
    totalFamilies,
    loading: categoriesLoading, 
    error: categoriesError 
  } = useCategories()
  const { buyers, loading: buyersLoading, error: buyersError } = useBuyers()
  const { invoices, loading: invoicesLoading, error: invoicesError } = useInvoices()
  
  const loading = partsLoading || categoriesLoading || buyersLoading || invoicesLoading
  const error = partsError || categoriesError || buyersError || invoicesError
  
  // Calculate enhanced summary statistics with family breakdowns
  const summary = useMemo(() => {
    if (!partsWithFamily.length && !invoices.length) return null
    
    const totalParts = partsWithFamily.length
    const totalValue = partsWithFamily.reduce((sum, part) => 
      sum + (part.inventoryOnHand * part.unitCost), 0
    )
    const lowStockParts = partsWithFamily.filter(part => part.inventoryOnHand <= 5 && part.inventoryOnHand > 0).length
    const outOfStockParts = partsWithFamily.filter(part => part.inventoryOnHand === 0).length
    
    const totalInvoices = invoices.length
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Finalized')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0)
    const draftInvoices = invoices.filter(invoice => invoice.status === 'Draft').length
    const paidInvoices = invoices.filter(invoice => invoice.status === 'Paid').length

    // HYBRID SOLUTION: Enhanced family-based statistics
    const familyStats = {}
    partsWithFamily.forEach(part => {
      const family = part.family || 'Unknown'
      if (!familyStats[family]) {
        familyStats[family] = {
          totalParts: 0,
          totalValue: 0,
          lowStockParts: 0,
          outOfStockParts: 0
        }
      }
      
      familyStats[family].totalParts++
      familyStats[family].totalValue += (part.inventoryOnHand * part.unitCost)
      
      if (part.inventoryOnHand <= 5 && part.inventoryOnHand > 0) {
        familyStats[family].lowStockParts++
      } else if (part.inventoryOnHand === 0) {
        familyStats[family].outOfStockParts++
      }
    })
    
    return {
      totalParts,
      totalValue,
      lowStockParts,
      outOfStockParts,
      categoriesCount: categories.length,
      familiesCount: totalFamilies,
      buyersCount: buyers.length,
      totalInvoices,
      totalRevenue,
      draftInvoices,
      paidInvoices,
      familyStats // HYBRID SOLUTION: Enhanced family statistics
    }
  }, [partsWithFamily, categories, buyers, invoices, totalFamilies])

  // HYBRID SOLUTION: Enhanced category insights
  const categoryInsights = useMemo(() => {
    if (!partsWithFamily.length || !categories.length) return null
    
    const categoryStats = {}
    categories.forEach(cat => {
      const categoryParts = partsWithFamily.filter(part => part.category === cat.category)
      categoryStats[cat.category] = {
        family: cat.family,
        totalParts: categoryParts.length,
        totalValue: categoryParts.reduce((sum, part) => sum + (part.inventoryOnHand * part.unitCost), 0),
        avgInventory: categoryParts.length > 0 ? 
          categoryParts.reduce((sum, part) => sum + part.inventoryOnHand, 0) / categoryParts.length : 0
      }
    })
    
    return categoryStats
  }, [partsWithFamily, categories])
  
  return {
    parts: partsWithFamily, // HYBRID SOLUTION: Return enhanced parts with family
    categories,
    categoriesByFamily, // HYBRID SOLUTION: Enhanced category organization
    categoryMap, // HYBRID SOLUTION: Quick lookup map
    buyers,
    invoices,
    summary,
    categoryInsights, // HYBRID SOLUTION: Enhanced insights
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
// SEARCH HOOKS - ENHANCED FOR HYBRID SOLUTION
// =================================================================

/**
 * Hook for searching across multiple SharePoint lists
 * HYBRID SOLUTION: Enhanced search with family context
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
   * HYBRID SOLUTION: Enhanced with family information
   */
  const performSearch = useCallback(async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults({ parts: [], buyers: [], invoices: [], transactions: [] })
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [searchResults, partsWithFamily] = await Promise.all([
        executeOperation(
          (token) => sharePointService.searchAll(token, searchTerm, options),
          'Search failed'
        ),
        executeOperation(
          (token) => sharePointService.searchPartsWithFamily(token, searchTerm, options),
          'Parts search failed'
        )
      ])
      
      if (isMountedRef.current) {
        setResults({
          ...searchResults,
          parts: partsWithFamily // HYBRID SOLUTION: Enhanced parts with family
        })
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
// FAMILY-SPECIFIC HOOKS (HYBRID SOLUTION)
// =================================================================

/**
 * Hook for family-based operations
 * HYBRID SOLUTION: New functionality for family management
 * @returns {Object} Family operations and data
 */
export const useFamilyOperations = () => {
  const { 
    categoriesByFamily, 
    getFamilyByCategory, 
    getCategoriesForFamily,
    getFamilyNames,
    loading: categoriesLoading,
    error: categoriesError
  } = useCategories()
  
  const { 
    getPartsGroupedByFamily, 
    searchPartsWithFamily,
    loading: partsLoading,
    error: partsError
  } = useParts()
  
  const loading = categoriesLoading || partsLoading
  const error = categoriesError || partsError
  
  /**
   * Get comprehensive family statistics
   * HYBRID SOLUTION: Enhanced family analytics
   */
  const getFamilyStats = useCallback(async () => {
    try {
      const partsGroupedByFamily = await getPartsGroupedByFamily()
      const familyStats = {}
      
      Object.entries(partsGroupedByFamily).forEach(([family, parts]) => {
        const totalParts = parts.length
        const totalValue = parts.reduce((sum, part) => sum + (part.inventoryOnHand * part.unitCost), 0)
        const totalInventory = parts.reduce((sum, part) => sum + part.inventoryOnHand, 0)
        const lowStockParts = parts.filter(part => part.inventoryOnHand <= 5 && part.inventoryOnHand > 0).length
        const outOfStockParts = parts.filter(part => part.inventoryOnHand === 0).length
        
        familyStats[family] = {
          totalParts,
          totalValue,
          totalInventory,
          lowStockParts,
          outOfStockParts,
          averageInventory: totalParts > 0 ? totalInventory / totalParts : 0,
          categories: categoriesByFamily[family] || []
        }
      })
      
      return familyStats
    } catch (error) {
      console.error('Failed to get family stats:', error)
      return {}
    }
  }, [getPartsGroupedByFamily, categoriesByFamily])
  
  /**
   * Search parts within a specific family
   * HYBRID SOLUTION: Family-scoped search
   */
  const searchPartsInFamily = useCallback(async (familyName, searchTerm) => {
    try {
      const allResults = await searchPartsWithFamily(searchTerm)
      return allResults.filter(part => part.family === familyName)
    } catch (error) {
      console.error('Failed to search parts in family:', error)
      return []
    }
  }, [searchPartsWithFamily])
  
  return {
    categoriesByFamily,
    getFamilyByCategory,
    getCategoriesForFamily,
    getFamilyNames,
    getFamilyStats,
    searchPartsInFamily,
    loading,
    error
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
  
  // Categories (Enhanced)
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
  
  // HYBRID SOLUTION: New family-specific hooks
  useFamilyOperations
}