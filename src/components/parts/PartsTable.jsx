import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'

// Import SharePoint hooks - LIVE MODE ONLY
import { useParts, useCategories } from '../../hooks/useSharePoint'

// =================================================================
// PARTS TABLE COMPONENT - PRODUCTION VERSION (LIVE MODE ONLY)
// =================================================================
const PartsTable = () => {
  const { success, error, info } = useToast()
  
  // =================================================================
  // SHAREPOINT HOOKS - LIVE DATA ONLY
  // =================================================================
  const { 
    parts, 
    loading: partsLoading, 
    error: partsError,
    deleteMultipleParts,
    refreshParts
  } = useParts()
  
  const { 
    categoryNames: categories, 
    loading: categoriesLoading 
  } = useCategories()

  // Use SharePoint data directly
  const loading = partsLoading || categoriesLoading
  const dataError = partsError

  // =================================================================
  // LOCAL STATE FOR UI
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedParts, setSelectedParts] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // =================================================================
  // FILTERING AND SORTING
  // =================================================================
  const filteredParts = useMemo(() => {
    let filtered = parts.filter(part => {
      const matchesSearch = searchTerm === '' || 
        part.partId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === '' || part.category === categoryFilter
      const matchesStatus = statusFilter === '' || part.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
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
  }, [parts, searchTerm, categoryFilter, statusFilter, sortConfig])

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

  const handleDeleteSelected = async () => {
    try {
      // Use SharePoint service for real deletions
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
    info('Export functionality coming soon!')
  }

  const handleRefreshData = () => {
    refreshParts()
    success('Parts data refreshed!')
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  const getInventoryStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Parts</div>
          <div className="text-2xl font-bold text-gray-900">{parts.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Categories</div>
          <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-600">
            {parts.filter(part => part.inventoryOnHand <= 5 && part.inventoryOnHand > 0).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">
            {parts.filter(part => part.inventoryOnHand === 0).length}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Parts
            </label>
            <input
              type="text"
              placeholder="Search by Part ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
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

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('')
                setStatusFilter('')
                setSortConfig({ key: null, direction: 'asc' })
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
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

      {/* Parts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredParts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter || statusFilter
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
                {filteredParts.map((part) => {
                  const inventoryStatus = getInventoryStatus(part.inventoryOnHand)
                  
                  return (
                    <tr
                      key={part.id}
                      className={`hover:bg-gray-50 ${selectedParts.includes(part.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedParts.includes(part.id)}
                          onChange={() => handleSelectPart(part.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/parts/${part.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {part.partId}
                        </Link>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{part.description}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{part.category}</span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {part.inventoryOnHand}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${inventoryStatus.color}`}>
                            {inventoryStatus.text}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          ${part.unitPrice.toFixed(2)}
                        </span>
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
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            👁️
                          </Link>
                          <Link
                            to={`/parts/${part.id}/edit`}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Edit Part"
                          >
                            ✏️
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default PartsTable