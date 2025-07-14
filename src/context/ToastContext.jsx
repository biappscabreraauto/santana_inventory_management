import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// =================================================================
// TOAST TYPES AND CONFIGURATION
// =================================================================
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

const TOAST_DEFAULTS = {
  duration: 5000, // 5 seconds
  position: 'top-right',
  maxToasts: 5
}

// =================================================================
// TOAST CONTEXT CREATION
// =================================================================
const ToastContext = createContext(null)

// =================================================================
// TOAST CONTEXT PROVIDER
// =================================================================
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  // =================================================================
  // TOAST MANAGEMENT FUNCTIONS
  // =================================================================

  /**
   * Generate unique ID for each toast
   */
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }, [])

  /**
   * Add a new toast
   */
  const addToast = useCallback((message, type = TOAST_TYPES.INFO, options = {}) => {
    const id = generateId()
    const duration = options.duration ?? TOAST_DEFAULTS.duration
    
    const newToast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now(),
      ...options
    }

    setToasts(prevToasts => {
      // Remove oldest toasts if we exceed the maximum
      const updatedToasts = prevToasts.slice(-(TOAST_DEFAULTS.maxToasts - 1))
      return [...updatedToasts, newToast]
    })

    // Auto-remove toast after duration (if duration > 0)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [generateId])

  /**
   * Remove a specific toast
   */
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  /**
   * Update an existing toast
   */
  const updateToast = useCallback((id, updates) => {
    setToasts(prevToasts => 
      prevToasts.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    )
  }, [])

  // =================================================================
  // CONVENIENCE METHODS
  // =================================================================

  /**
   * Show success toast
   */
  const success = useCallback((message, options = {}) => {
    return addToast(message, TOAST_TYPES.SUCCESS, {
      duration: 4000,
      ...options
    })
  }, [addToast])

  /**
   * Show error toast
   */
  const error = useCallback((message, options = {}) => {
    return addToast(message, TOAST_TYPES.ERROR, {
      duration: 8000, // Errors stay longer
      ...options
    })
  }, [addToast])

  /**
   * Show warning toast
   */
  const warning = useCallback((message, options = {}) => {
    return addToast(message, TOAST_TYPES.WARNING, {
      duration: 6000,
      ...options
    })
  }, [addToast])

  /**
   * Show info toast
   */
  const info = useCallback((message, options = {}) => {
    return addToast(message, TOAST_TYPES.INFO, {
      duration: 5000,
      ...options
    })
  }, [addToast])

  /**
   * Show loading toast (persistent until manually removed)
   */
  const loading = useCallback((message, options = {}) => {
    return addToast(message, TOAST_TYPES.INFO, {
      duration: 0, // Persistent
      loading: true,
      ...options
    })
  }, [addToast])

  /**
   * Show operation result toast
   */
  const operationResult = useCallback((operation, success, errorMessage = null) => {
    if (success) {
      return addToast(`${operation} completed successfully`, TOAST_TYPES.SUCCESS)
    } else {
      const message = errorMessage || `${operation} failed`
      return addToast(message, TOAST_TYPES.ERROR)
    }
  }, [addToast])

  /**
   * Show SharePoint operation result
   */
  const sharePointResult = useCallback((operation, result, itemName = '') => {
    const itemText = itemName ? ` "${itemName}"` : ''
    
    if (result.success) {
      const message = `${operation}${itemText} completed successfully`
      return success(message)
    } else {
      const message = result.error || `Failed to ${operation.toLowerCase()}${itemText}`
      return error(message)
    }
  }, [success, error])

  // =================================================================
  // TOAST COMPONENT
  // =================================================================
  const ToastContainer = () => {
    if (toasts.length === 0) return null

    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    )
  }

  // =================================================================
  // CONTEXT VALUE
  // =================================================================
  const contextValue = {
    // Toast state
    toasts,
    
    // Core methods
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,
    
    // Convenience methods
    success,
    error,
    warning,
    info,
    loading,
    
    // Specialized methods
    operationResult,
    sharePointResult,
    
    // Toast component
    ToastContainer
  }

  // =================================================================
  // DEBUG LOGGING
  // =================================================================
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    useEffect(() => {
      if (toasts.length > 0) {
        console.log('🍞 Active Toasts:', toasts.length, toasts.map(t => ({
          type: t.type,
          message: t.message.substring(0, 50)
        })))
      }
    }, [toasts])
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// =================================================================
// TOAST ITEM COMPONENT
// =================================================================
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Handle removal with animation
  const handleRemove = useCallback(() => {
    setIsRemoving(true)
    setTimeout(() => onRemove(toast.id), 300) // Match animation duration
  }, [toast.id, onRemove])

  // Auto-remove on click
  const handleClick = useCallback(() => {
    if (!toast.loading) {
      handleRemove()
    }
  }, [toast.loading, handleRemove])

  // Get toast styling based on type
  const getToastStyles = () => {
    const baseStyles = `
      relative overflow-hidden rounded-lg p-4 shadow-lg cursor-pointer
      transform transition-all duration-300 ease-in-out max-w-sm
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${isRemoving ? 'translate-x-full opacity-0 scale-95' : ''}
    `

    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return `${baseStyles} bg-green-500 text-white`
      case TOAST_TYPES.ERROR:
        return `${baseStyles} bg-red-500 text-white`
      case TOAST_TYPES.WARNING:
        return `${baseStyles} bg-yellow-500 text-white`
      case TOAST_TYPES.INFO:
      default:
        return `${baseStyles} bg-blue-500 text-white`
    }
  }

  // Get toast icon
  const getToastIcon = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return '✅'
      case TOAST_TYPES.ERROR:
        return '❌'
      case TOAST_TYPES.WARNING:
        return '⚠️'
      case TOAST_TYPES.INFO:
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={getToastStyles()} onClick={handleClick}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 text-lg">
          {toast.loading ? (
            <div className="animate-spin text-lg">⏳</div>
          ) : (
            getToastIcon()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {toast.message}
          </p>
          
          {toast.description && (
            <p className="mt-1 text-xs opacity-90">
              {toast.description}
            </p>
          )}
        </div>
        
        {!toast.loading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemove()
            }}
            className="ml-3 flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Progress bar for timed toasts */}
      {toast.duration > 0 && !toast.loading && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/20 w-full">
          <div 
            className="h-full bg-white/50 transition-all ease-linear toast-progress-bar"
            style={{
              animationDuration: `${toast.duration}ms`
            }}
          />
        </div>
      )}
    </div>
  )
}

// =================================================================
// CUSTOM HOOK
// =================================================================
export const useToast = () => {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
}

// =================================================================
// HELPER HOOKS
// =================================================================

/**
 * Hook for basic toast operations
 */
export const useToastActions = () => {
  const { success, error, warning, info, loading } = useToast()
  return { success, error, warning, info, loading }
}

/**
 * Hook for SharePoint-specific toasts
 */
export const useSharePointToasts = () => {
  const { sharePointResult, operationResult } = useToast()
  return { sharePointResult, operationResult }
}