// =================================================================
// ENHANCED PARTS TABLE - HYBRID SOLUTION WITH FAMILY SUPPORT
// =================================================================
// HYBRID SOLUTION: Category field is now text with family information
// Enhanced with family column, family-based filtering, and advanced search

import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { exportPartsToCSV } from '../../utils/csvExport'

// Import SharePoint hooks - LIVE MODE ONLY
import { useParts, useCategories } from '../../hooks/useSharePoint'

// =================================================================
// PARTS TABLE COMPONENT - HYBRID SOLUTION ENHANCED
// =================================================================
const PartsTable = () => {
  const { success, error, info } = useToast()
  
  // =================================================================
  // SHAREPOINT HOOKS - HYBRID SOLUTION ENHANCED
  // =================================================================
  const { 
    parts, 
    loading: partsLoading, 
    error: partsError,
    deleteMultipleParts,
    refreshParts
  } = useParts()
  
  const { 
    categories,
    categoryNames,
    categoriesByFamily,
    getFamilyByCategory,
    loading: categoriesLoading 
  } = useCategories()

  // Use SharePoint data directly
  const loading = partsLoading || categoriesLoading
  const dataError = partsError

  // =================================================================
  // LOCAL STATE FOR UI - HYBRID SOLUTION ENHANCED
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [familyFilter, setFamilyFilter] = useState('') // HYBRID SOLUTION: New family filter
  const [statusFilter, setStatusFilter] = useState('')
  const [inventoryFilter, setInventoryFilter] = useState('') // New inventory status filter
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedParts, setSelectedParts] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [viewMode, setViewMode] = useState('all') // 'all', 'family', 'category'

  // =================================================================
  // HYBRID SOLUTION: ENHANCED DATA PROCESSING
  // =================================================================
  
  // Enhance parts with family information
  const partsWithFamily = useMemo(() => {
    return parts.map(part => ({
      ...part,
      family: getFamilyByCategory(part.category) || 'Unknown Family'
    }))
  }, [parts, getFamilyByCategory])

  // Get available families for filtering
  const availableFamilies = useMemo(() => {
    const families = new Set(partsWithFamily.map(part => part.family))
    return Array.from(families).sort()
  }, [partsWithFamily])

  // Get categories for selected family (for cascading filter)
  const categoriesInSelectedFamily = useMemo(() => {
    if (!familyFilter || !categoriesByFamily[familyFilter]) {
      return categoryNames
    }
    return categoriesByFamily[familyFilter].map(cat => cat.category).sort()
  }, [familyFilter, categoriesByFamily, categoryNames])

  // =================================================================
  // FILTERING AND SORTING - HYBRID SOLUTION ENHANCED
  // =================================================================
  const filteredParts = useMemo(() => {
    let filtered = partsWithFamily.filter(part => {
      // Search filter - HYBRID SOLUTION: includes family search
      const matchesSearch = searchTerm === '' || 
        part.partId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.family.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Family filter - HYBRID SOLUTION: New filter
      const matchesFamily = familyFilter === '' || part.family === familyFilter
      
      // Category filter
      const matchesCategory = categoryFilter === '' || part.category === categoryFilter
      
      // Status filter
      const matchesStatus = statusFilter === '' || part.status === statusFilter
      
      // Inventory filter - New filter
      let matchesInventory = true
      if (inventoryFilter === 'out-of-stock') {
        matchesInventory = part.inventoryOnHand === 0
      } else if (inventoryFilter === 'low-stock') {
        matchesInventory = part.inventoryOnHand > 0 && part.inventoryOnHand <= 5
      } else if (inventoryFilter === 'in-stock') {
        matchesInventory = part.inventoryOnHand > 5
      }
      
      return matchesSearch && matchesFamily && matchesCategory && matchesStatus && matchesInventory
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        } else {
          const aStr = String(aValue).toLowerCase()
          const bStr = String(bValue).toLowerCase()
          if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
          if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
          return 0
        }
      })
    }

    return filtered
  }, [partsWithFamily, searchTerm, familyFilter, categoryFilter, statusFilter, inventoryFilter, sortConfig])

  // =================================================================
  // HYBRID SOLUTION: FAMILY GROUPING
  // =================================================================
  const partsGroupedByFamily = useMemo(() => {
    if (viewMode !== 'family') return null
    
    const grouped = {}
    filteredParts.forEach(part => {
      const family = part.family || 'Unknown Family'
      if (!grouped[family]) {
        grouped[family] = []
      }
      grouped[family].push(part)
    })
    
    return grouped
  }, [filteredParts, viewMode])

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedParts(filteredParts.map(part => part.id))
    } else {
      setSelectedParts([])
    }
  }

  const handleSelectPart = (partId) => {
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    )
  }

  // HYBRID SOLUTION: Handle family filter changes
  const handleFamilyFilterChange = (family) => {
    setFamilyFilter(family)
    // Clear category filter when family changes to avoid conflicts
    if (family !== familyFilter) {
      setCategoryFilter('')
    }
  }

  const handleDeleteSelected = async () => {
    try {
      const result = await deleteMultipleParts(selectedParts)
      
      if (result.succeeded > 0) {
        success(`Successfully deleted ${result.succeeded} part(s)`)
      }
      
      if (result.failed > 0) {
        error(`Failed to delete ${result.failed} part(s)`)
      }
      
      setSelectedParts([])
      setShowDeleteModal(false)
      
    } catch (err) {
      console.error('Error deleting parts:', err)
      error('Failed to delete parts. Please try again.')
    }
  }

  const handleExportParts = () => {
    try {
      if (filteredParts.length === 0) {
        warning('No parts to export')
        return
      }
      
      exportPartsToCSV(filteredParts, 'parts-export')
      success(`Exported ${filteredParts.length} parts to CSV`)
    } catch (err) {
      console.error('Export error:', err)
      error('Failed to export parts')
    }
  }

  const handleRefreshData = () => {
    refreshParts()
    success('Parts data refreshed!')
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setFamilyFilter('')
    setStatusFilter('')
    setInventoryFilter('')
    setSortConfig({ key: null, direction: 'asc' })
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  const getInventoryStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: '🔴' }
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', icon: '🟢' }
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // =================================================================
  // SUMMARY CALCULATIONS - HYBRID SOLUTION ENHANCED
  // =================================================================
  const summaryStats = useMemo(() => {
    const totalParts = filteredParts.length
    const totalValue = filteredParts.reduce((sum, part) => sum + (part.inventoryOnHand * part.unitCost), 0)
    const lowStockParts = filteredParts.filter(part => part.inventoryOnHand <= 5 && part.inventoryOnHand > 0).length
    const outOfStockParts = filteredParts.filter(part => part.inventoryOnHand === 0).length
    
    // HYBRID SOLUTION: Family-based stats
    const familyStats = {}
    filteredParts.forEach(part => {
      const family = part.family
      if (!familyStats[family]) {
        familyStats[family] = { count: 0, value: 0 }
      }
      familyStats[family].count++
      familyStats[family].value += (part.inventoryOnHand * part.unitCost)
    })
    
    return {
      totalParts,
      totalValue,
      lowStockParts,
      outOfStockParts,
      totalFamilies: Object.keys(familyStats).length,
      familyStats
    }
  }, [filteredParts])

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading parts from SharePoint...</p>
        </div>
      </div>
    )
  }

  // =================================================================
  // ERROR STATE
  // =================================================================
  if (dataError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">SharePoint Connection Error</h3>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <div className="space-x-3">
            <button
              onClick={handleRefreshData}
              className="btn btn-primary"
            >
              🔄 Retry Connection
            </button>
            <Link
              to="/parts/new"
              className="btn btn-secondary"
            >
              Add Part Anyway
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // =================================================================
  // MAIN RENDER
  // =================================================================
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600">
            Showing {filteredParts.length} of {parts.length} parts
            {familyFilter && ` in ${familyFilter} family`}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRefreshData}
            className="btn btn-outline"
          >
            🔄 Refresh
          </button>
          
          <button
            onClick={handleExportParts}
            className="btn btn-secondary"
          >
            📊 Export
          </button>
          
          <Link to="/parts/new" className="btn btn-primary">
            ➕ Add New Part
          </Link>
        </div>
      </div>

      {/* HYBRID SOLUTION: Enhanced Summary Cards with Family Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Parts</div>
          <div className="text-2xl font-bold text-gray-900">{summaryStats.totalParts}</div>
          <div className="text-xs text-gray-500">
            {parts.length > filteredParts.length && `${parts.length} total`}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalValue)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Families</div>
          <div className="text-2xl font-bold text-blue-600">{summaryStats.totalFamilies}</div>
          <div className="text-xs text-gray-500">{availableFamilies.length} total</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-600">{summaryStats.lowStockParts}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">{summaryStats.outOfStockParts}</div>
        </div>
      </div>

      {/* HYBRID SOLUTION: View Mode Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">View & Filter Options</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Parts</option>
              <option value="family">Grouped by Family</option>
              <option value="category">Grouped by Category</option>
            </select>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Parts
            </label>
            <input
              type="text"
              placeholder="Search by Part ID, description, category, or family..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* HYBRID SOLUTION: Family Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Family
            </label>
            <select
              value={familyFilter}
              onChange={(e) => handleFamilyFilterChange(e.target.value)}
              className="input"
            >
              <option value="">All Families</option>
              {availableFamilies.map(family => (
                <option key={family} value={family}>{family}</option>
              ))}
            </select>
          </div>

          {/* Category Filter - HYBRID SOLUTION: Filtered by family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">
                {familyFilter ? `All in ${familyFilter}` : 'All Categories'}
              </option>
              {categoriesInSelectedFamily.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Obsolete">Obsolete</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          {/* Inventory Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Level
            </label>
            <select
              value={inventoryFilter}
              onChange={(e) => setInventoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Levels</option>
              <option value="in-stock">In Stock (&gt;5)</option>
              <option value="low-stock">Low Stock (1-5)</option>
              <option value="out-of-stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {(searchTerm || familyFilter || categoryFilter || statusFilter || inventoryFilter) && (
              <span>
                Filters active: {[searchTerm && 'search', familyFilter && 'family', categoryFilter && 'category', statusFilter && 'status', inventoryFilter && 'inventory'].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <button
            onClick={clearAllFilters}
            className="btn btn-outline btn-sm"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedParts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedParts.length} part(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
              >
                🗑️ Delete Selected
              </button>
              <button
                onClick={() => setSelectedParts([])}
                className="btn btn-secondary"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HYBRID SOLUTION: Conditional Rendering Based on View Mode */}
      {viewMode === 'family' && partsGroupedByFamily ? (
        /* Family Grouped View */
        <div className="space-y-6">
          {Object.entries(partsGroupedByFamily).map(([family, familyParts]) => (
            <div key={family} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-blue-900">
                    {family}
                  </h3>
                  <div className="text-sm text-blue-700">
                    {familyParts.length} part{familyParts.length !== 1 ? 's' : ''} • 
                    {formatCurrency(familyParts.reduce((sum, part) => sum + (part.inventoryOnHand * part.unitCost), 0))} value
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={familyParts.every(part => selectedParts.includes(part.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParts(prev => [...new Set([...prev, ...familyParts.map(p => p.id)])])
                            } else {
                              setSelectedParts(prev => prev.filter(id => !familyParts.map(p => p.id).includes(id)))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Part ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        On Hand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {familyParts.map((part) => (
                      <PartTableRow 
                        key={part.id} 
                        part={part} 
                        isSelected={selectedParts.includes(part.id)}
                        onSelect={handleSelectPart}
                        showFamily={false}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredParts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || familyFilter || categoryFilter || statusFilter || inventoryFilter
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding your first part.'
                }
              </p>
              <Link to="/parts/new" className="btn btn-primary">
                Add First Part
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedParts.length === filteredParts.length && filteredParts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('partId')}
                    >
                      Part ID {getSortIcon('partId')}
                    </th>
                    
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('description')}
                    >
                      Description {getSortIcon('description')}
                    </th>
                    
                    {/* HYBRID SOLUTION: Family Column */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('family')}
                    >
                      Family {getSortIcon('family')}
                    </th>
                    
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      Category {getSortIcon('category')}
                    </th>
                    
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('inventoryOnHand')}
                    >
                      On Hand {getSortIcon('inventoryOnHand')}
                    </th>
                    
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('unitPrice')}
                    >
                      Unit Price {getSortIcon('unitPrice')}
                    </th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParts.map((part) => (
                    <PartTableRow 
                      key={part.id} 
                      part={part} 
                      isSelected={selectedParts.includes(part.id)}
                      onSelect={handleSelectPart}
                      showFamily={true}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Selected Parts
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedParts.length} selected part(s)? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteSelected}
                    className="btn btn-danger flex-1"
                  >
                    Delete Parts
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =================================================================
// PART TABLE ROW COMPONENT - HYBRID SOLUTION
// =================================================================
const PartTableRow = ({ part, isSelected, onSelect, showFamily = true }) => {
  // Move function definitions BEFORE they are used
  const getInventoryStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: '🔴' }
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', icon: '🟢' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Now we can safely call getInventoryStatus
  const inventoryStatus = getInventoryStatus(part.inventoryOnHand)

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors duration-150 ${isSelected ? 'bg-blue-50' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(part.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          to={`/parts/${part.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {part.partId}
        </Link>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-xs truncate" title={part.description}>
          {part.description}
        </div>
      </td>
      
      {/* HYBRID SOLUTION: Family Column */}
      {showFamily && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm">
            <div className="text-gray-900 font-medium">{part.family}</div>
            <div className="text-gray-500 text-xs">
              {part.family === 'Unknown Family' ? 
                'No family assigned' : 'Automotive system'}
            </div>
          </div>
        </td>
      )}
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{part.category}</span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {part.inventoryOnHand}
          </span>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${inventoryStatus.color}`}>
            <span className="mr-1">{inventoryStatus.icon}</span>
            {inventoryStatus.text}
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 font-medium">
          {formatCurrency(part.unitPrice)}
        </span>
        <div className="text-xs text-gray-500">
          Cost: {formatCurrency(part.unitCost)}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          part.status === 'Active' ? 'bg-green-100 text-green-800' :
          part.status === 'Obsolete' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {part.status}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-2">
          <Link
            to={`/parts/${part.id}`}
            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
            title="View Details"
          >
            👁️
          </Link>
          <Link
            to={`/parts/${part.id}/edit`}
            className="text-yellow-600 hover:text-yellow-800 p-1 rounded transition-colors"
            title="Edit Part"
          >
            ✏️
          </Link>
          <Link
            to={`/transactions/new?partId=${part.partId}`}
            className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
            title="Log Transaction"
          >
            📦
          </Link>
        </div>
      </td>
    </tr>
  )
}

export default PartsTable