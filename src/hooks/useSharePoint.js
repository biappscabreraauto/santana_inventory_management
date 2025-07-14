// =================================================================
// SHAREPOINT REACT HOOKS
// =================================================================
// Custom hooks for integrating SharePoint service with React components
// These hooks handle state management, error handling, and loading states

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import sharePointService from '../services/sharepoint'

// =================================================================
// BASE SHAREPOINT HOOK
// =================================================================

/**
 * Base hook for SharePoint operations with common functionality
 * @returns {Object} Common SharePoint hook utilities
 */
export const useSharePointBase = () => {
  const { getAccessToken } = useAuth()
  const { error: showError } = useToast()

  /**
   * Execute SharePoint operation with error handling
   * @param {Function} operation - SharePoint operation to execute
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
// TRANSACTIONS HOOKS
// =================================================================

/**
 * Hook for managing transaction history for a specific part
 * @param {string} partId - Part ID to get transactions for
 * @returns {Object} Transaction data and operations
 */
export const usePartTransactions = (partId) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { executeOperation } = useSharePointBase()
  
  const isMountedRef = useRef(true)

  /**
   * Load transactions for the specified part
   */
  const loadTransactions = useCallback(async () => {
    if (!partId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await executeOperation(
        (token) => sharePointService.getPartTransactions(token, partId),
        'Failed to load transaction history'
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
    loadTransactions()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadTransactions])

  return {
    transactions,
    loading,
    error,
    refreshTransactions: loadTransactions
  }
}

// =================================================================
// HEALTH CHECK HOOK
// =================================================================

/**
 * Hook for checking SharePoint connection health
 * @returns {Object} Health check data and operations
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
  
  const loading = partsLoading || categoriesLoading
  const error = partsError || categoriesError
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!parts.length) return null
    
    const totalParts = parts.length
    const totalValue = parts.reduce((sum, part) => 
      sum + (part.inventoryOnHand * part.unitCost), 0
    )
    const lowStockParts = parts.filter(part => part.inventoryOnHand <= 5).length
    const outOfStockParts = parts.filter(part => part.inventoryOnHand === 0).length
    
    return {
      totalParts,
      totalValue,
      lowStockParts,
      outOfStockParts,
      categoriesCount: categories.length
    }
  }, [parts, categories])
  
  return {
    parts,
    categories,
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
// DEFAULT EXPORT
// =================================================================
export default {
  useSharePointBase,
  useParts,
  usePart,
  useCategories,
  usePartTransactions,
  useSharePointHealth,
  useSharePointData,
  useDebounceSharePoint,
  useSharePointCache,
  useSharePointErrorBoundary
}