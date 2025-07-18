import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'

// =================================================================
// EXTERNAL SEARCH PROVIDERS
// =================================================================
const searchProviders = [
  {
    id: 'rockauto',
    name: 'RockAuto',
    icon: '🚗',
    description: 'Automotive parts catalog with competitive pricing',
    baseUrl: import.meta.env.VITE_ROCKAUTO_SEARCH_URL || 'https://www.rockauto.com/en/partsearch',
    searchParam: 'partnum',
    color: 'bg-red-500',
    features: ['OEM & Aftermarket Parts', 'Detailed Fitment', 'Bulk Pricing', 'Technical Specs']
  },
  {
    id: 'google',
    name: 'Google Search',
    icon: '🔍',
    description: 'Comprehensive web search for parts and technical information',
    baseUrl: import.meta.env.VITE_GOOGLE_SEARCH_URL || 'https://www.google.com/search',
    searchParam: 'q',
    color: 'bg-blue-500',
    features: ['Technical Documentation', 'Cross-Reference', 'Images & Diagrams', 'Forums & Reviews']
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    description: 'Quick delivery options and customer reviews',
    baseUrl: 'https://www.amazon.com/s',
    searchParam: 'k',
    color: 'bg-orange-500',
    features: ['Fast Shipping', 'Customer Reviews', 'Prime Eligible', 'Easy Returns']
  },
  {
    id: 'ebay',
    name: 'eBay',
    icon: '🛒',
    description: 'New and used parts marketplace',
    baseUrl: 'https://www.ebay.com/sch/i.html',
    searchParam: '_nkw',
    color: 'bg-yellow-500',
    features: ['Used & New Parts', 'Auction Format', 'Global Sellers', 'Rare Parts']
  }
]

// =================================================================
// SEARCH HISTORY MANAGEMENT
// =================================================================
const SEARCH_HISTORY_KEY = 'external_lookup_history'
const MAX_HISTORY_ITEMS = 10

const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

const addToSearchHistory = (term) => {
  try {
    const history = getSearchHistory()
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // Ignore localStorage errors
  }
}

// =================================================================
// EXTERNAL LOOKUP COMPONENT
// =================================================================
const ExternalLookup = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { success, info } = useToast()
  const { canAccess, isReadOnly, userRole, isAdmin, isUser } = useRoleAccess('ReadOnly')
  
  // Early return if no access
  if (!canAccess) {
    return <RoleProtected requiredRole="ReadOnly" />
  }
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHistory, setSearchHistory] = useState([])
  const [selectedProvider, setSelectedProvider] = useState('rockauto')
  const [recentSearches, setRecentSearches] = useState([])

  // Pre-populate search from URL params (e.g., from part details page)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const prefilledSearch = urlParams.get('search')
    
    if (prefilledSearch) {
      setSearchTerm(prefilledSearch)
      info(`Search pre-filled with: ${prefilledSearch}`)
    }
  }, [location.search, info])

  // Load search history on component mount
  useEffect(() => {
    const history = getSearchHistory()
    setSearchHistory(history)
    setRecentSearches(history.slice(0, 5))
  }, [])

  // =================================================================
  // SEARCH FUNCTIONALITY - ALL USERS CAN SEARCH
  // =================================================================
  
  /**
   * Execute search on selected external provider
   */
  const handleSearch = (term = searchTerm, providerId = selectedProvider) => {
    if (!term.trim()) {
      return
    }

    const provider = searchProviders.find(p => p.id === providerId)
    if (!provider) {
      return
    }

    // Build search URL
    const searchUrl = `${provider.baseUrl}?${provider.searchParam}=${encodeURIComponent(term.trim())}`
    
    // Add automotive context for better results
    const enhancedTerm = providerId === 'google' ? `${term} automotive parts` : term
    const enhancedUrl = `${provider.baseUrl}?${provider.searchParam}=${encodeURIComponent(enhancedTerm)}`
    
    // Open in new tab
    window.open(enhancedUrl, '_blank', 'noopener,noreferrer')
    
    // Update search history
    addToSearchHistory(term.trim())
    setSearchHistory(getSearchHistory())
    setRecentSearches(getSearchHistory().slice(0, 5))
    
    success(`Search opened on ${provider.name}`)
  }

  /**
   * Search all providers simultaneously
   */
  const handleSearchAll = () => {
    if (!searchTerm.trim()) {
      return
    }

    searchProviders.forEach(provider => {
      handleSearch(searchTerm, provider.id)
    })
    
    info(`Opened search on all ${searchProviders.length} providers`)
  }

  /**
   * Clear search history - Available to User+ roles only
   */
  const clearHistory = () => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
      setSearchHistory([])
      setRecentSearches([])
      success('Search history cleared')
    } catch {
      // Ignore errors
    }
  }

  // =================================================================
  // QUICK SEARCH SUGGESTIONS
  // =================================================================
  const quickSearchSuggestions = [
    { label: 'Oil Filter', search: 'oil filter' },
    { label: 'Brake Pads', search: 'brake pads' },
    { label: 'Air Filter', search: 'air filter' },
    { label: 'Spark Plugs', search: 'spark plugs' },
    { label: 'Alternator', search: 'alternator' },
    { label: 'Water Pump', search: 'water pump' }
  ]

  // =================================================================
  // RENDER COMPONENT
  // =================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">External Parts Lookup</h1>
            <p className="text-gray-600 mt-1">
              Search for automotive parts across multiple external providers
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">🔍</div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {userRole} Access
            </span>
            {isAdmin && (
              <div className="mt-1 text-xs text-gray-500">Full System Access</div>
            )}
            {isUser && (
              <div className="mt-1 text-xs text-gray-500">Standard User Access</div>
            )}
            {isReadOnly && (
              <div className="mt-1 text-xs text-gray-500">Full External Search Access</div>
            )}
          </div>
        </div>

        {/* Main Search Form - Available to ALL users */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search Term
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter part number, description, or keywords..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={!searchTerm.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Search
            </button>
          </div>

          {/* Provider Selection - Available to ALL users */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 py-2">Search on:</span>
            {searchProviders.map(provider => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedProvider === provider.id
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {provider.icon} {provider.name}
              </button>
            ))}
            <button
              onClick={handleSearchAll}
              disabled={!searchTerm.trim()}
              className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              🚀 Search All
            </button>
          </div>
        </div>
      </div>

      {/* Recent Searches - Available to ALL users */}
      {recentSearches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <button
                onClick={clearHistory}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </RoleProtected>
          </div>
          <div className="space-y-2">
            {recentSearches.map((term, index) => (
              <button
                key={index}
                onClick={() => handleSearch(term)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                🕒 {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Search Suggestions - Available to ALL users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Search Suggestions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickSearchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSearch(suggestion.search)}
              className="p-3 rounded-lg border border-gray-200 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-sm">{suggestion.label}</div>
              <div className="text-xs text-gray-500 mt-1">{suggestion.search}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Information - Available to ALL users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchProviders.map(provider => (
            <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">{provider.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                  <p className="text-sm text-gray-600">{provider.description}</p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1">
                {provider.features.map((feature, idx) => (
                  <li key={idx}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExternalLookup