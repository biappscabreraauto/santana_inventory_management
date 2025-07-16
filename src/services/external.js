// =================================================================
// EXTERNAL SEARCH SERVICE
// =================================================================
// Service for handling external automotive parts lookup functionality

/**
 * External search providers configuration
 */
export const SEARCH_PROVIDERS = {
  ROCKAUTO: {
    id: 'rockauto',
    name: 'RockAuto',
    baseUrl: import.meta.env.VITE_ROCKAUTO_SEARCH_URL || 'https://www.rockauto.com/en/catalog',
    searchParam: 'keyword',
    category: 'automotive'
  },
  GOOGLE: {
    id: 'google',
    name: 'Google Search',
    baseUrl: import.meta.env.VITE_GOOGLE_SEARCH_URL || 'https://www.google.com/search',
    searchParam: 'q',
    category: 'general'
  },
  AMAZON: {
    id: 'amazon',
    name: 'Amazon',
    baseUrl: 'https://www.amazon.com/s',
    searchParam: 'k',
    category: 'marketplace'
  },
  EBAY: {
    id: 'ebay',
    name: 'eBay',
    baseUrl: 'https://www.ebay.com/sch/i.html',
    searchParam: '_nkw',
    category: 'marketplace'
  }
}

/**
 * External search service class
 */
class ExternalSearchService {
  /**
   * Build search URL for a specific provider
   * @param {string} providerId - Provider identifier
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional search options
   * @returns {string} Complete search URL
   */
  buildSearchUrl(providerId, searchTerm, options = {}) {
    const provider = Object.values(SEARCH_PROVIDERS).find(p => p.id === providerId)
    
    if (!provider || !searchTerm.trim()) {
      return null
    }

    let enhancedTerm = searchTerm.trim()
    
    // Enhance search term based on provider type
    if (provider.category === 'general' && !options.exactSearch) {
      enhancedTerm = `${enhancedTerm} automotive parts`
    }
    
    // Add vehicle information if provided
    if (options.vehicle) {
      const { year, make, model } = options.vehicle
      if (year || make || model) {
        enhancedTerm = `${enhancedTerm} ${year || ''} ${make || ''} ${model || ''}`.trim()
      }
    }

    return `${provider.baseUrl}?${provider.searchParam}=${encodeURIComponent(enhancedTerm)}`
  }

  /**
   * Open search in new tab
   * @param {string} providerId - Provider identifier
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional search options
   */
  openSearch(providerId, searchTerm, options = {}) {
    const url = this.buildSearchUrl(providerId, searchTerm, options)
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return true
    }
    
    return false
  }

  /**
   * Open search on all providers
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional search options
   */
  openSearchAll(searchTerm, options = {}) {
    const results = []
    
    Object.values(SEARCH_PROVIDERS).forEach(provider => {
      const success = this.openSearch(provider.id, searchTerm, options)
      results.push({ provider: provider.id, success })
    })
    
    return results
  }

  /**
   * Get provider information
   * @param {string} providerId - Provider identifier
   * @returns {Object|null} Provider configuration
   */
  getProvider(providerId) {
    return Object.values(SEARCH_PROVIDERS).find(p => p.id === providerId) || null
  }

  /**
   * Get all providers
   * @returns {Array} Array of provider configurations
   */
  getAllProviders() {
    return Object.values(SEARCH_PROVIDERS)
  }

  /**
   * Generate smart search suggestions based on part data
   * @param {Object} part - Part object with properties like partId, description, category
   * @returns {Array} Array of suggested search terms
   */
  generateSearchSuggestions(part) {
    const suggestions = []
    
    if (part.partId) {
      suggestions.push({
        term: part.partId,
        label: `Part Number: ${part.partId}`,
        type: 'exact'
      })
    }
    
    if (part.description) {
      suggestions.push({
        term: part.description,
        label: `Description: ${part.description}`,
        type: 'description'
      })
    }
    
    if (part.category) {
      suggestions.push({
        term: part.category,
        label: `Category: ${part.category}`,
        type: 'category'
      })
    }
    
    // Combine part number and category for enhanced search
    if (part.partId && part.category) {
      suggestions.push({
        term: `${part.partId} ${part.category}`,
        label: `Enhanced: ${part.partId} ${part.category}`,
        type: 'enhanced'
      })
    }
    
    return suggestions
  }

  /**
   * Validate search term
   * @param {string} searchTerm - Search term to validate
   * @returns {Object} Validation result
   */
  validateSearchTerm(searchTerm) {
    const trimmed = searchTerm.trim()
    
    return {
      valid: trimmed.length > 0,
      term: trimmed,
      suggestions: trimmed.length === 0 ? ['Enter a part number or description'] : []
    }
  }
}

// Export singleton instance
export const externalSearchService = new ExternalSearchService()

// Export default
export default externalSearchService