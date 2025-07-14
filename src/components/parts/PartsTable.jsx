import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'

// Import SharePoint hooks
import { useParts, useCategories } from '../../hooks/useSharePoint'

// Import the SharePoint test component
import SharePointConnectionTest from './SharePointConnectionTest'

// =================================================================
// PARTS TABLE COMPONENT - FULL SHAREPOINT INTEGRATION
// =================================================================
const PartsTable = () => {
  const { success, error, info } = useToast()
  
  // =================================================================
  // INTEGRATION MODE TOGGLE
  // =================================================================
  const [integrationMode, setIntegrationMode] = useState('mock') // Start with mock, then test, then live
  
  // =================================================================
  // SHAREPOINT HOOKS
  // =================================================================
  const { 
    parts: sharePointParts, 
    loading: sharePointLoading, 
    error: sharePointError,
    deleteMultipleParts,
    refreshParts
  } = useParts()
  
  const { 
    categoryNames: sharePointCategories, 
    loading: categoriesLoading 
  } = useCategories()

  // =================================================================
  // MOCK DATA (FALLBACK)
  // =================================================================
  const [mockParts] = useState([
    {
      id: '1',
      partId: 'BH001',
      description: 'Brake Hose - Front Left',
      category: 'Brake Hose',
      inventoryOnHand: 5,
      unitCost: 25.99,
      unitPrice: 45.99,
      status: 'Active',
      created: '2024-01-15',
      modified: '2024-07-10'
    },
    {
      id: '2',
      partId: 'BP002',
      description: 'Brake Pad Set - Premium',
      category: 'Brake Pads',
      inventoryOnHand: 12,
      unitCost: 89.99,
      unitPrice: 149.99,
      status: 'Active',
      created: '2024-02-20',
      modified: '2024-07-12'
    },
    {
      id: '3',
      partId: 'WB003',
      description: 'Wheel Bearing - Rear',
      category: 'Wheel Bearing',
      inventoryOnHand: 0,
      unitCost: 65.50,
      unitPrice: 119.99,
      status: 'Active',
      created: '2024-03-10',
      modified: '2024-06-28'
    },
    {
      id: '4',
      partId: 'OL004',
      description: 'Oil Filter - Standard',
      category: 'Oil Filter',
      inventoryOnHand: 25,
      unitCost: 8.99,
      unitPrice: 16.99,
      status: 'Active',
      created: '2024-04-05',
      modified: '2024-07-08'
    }
  ])

  const mockCategories = [
    'Brake Hose',
    'Brake Pads', 
    'Wheel Bearing',
    'Oil Filter',
    'Air Filter',
    'Spark Plug'
  ]

  // =================================================================
  // DATA SOURCE SELECTION
  // =================================================================
  const parts = integrationMode === 'live' ? sharePointParts : mockParts
  const categories = integrationMode === 'live' ? sharePointCategories : mockCategories
  const loading = integrationMode === 'live' ? sharePointLoading : false
  const dataError = integrationMode === 'live' ? sharePointError : null

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
      if (integrationMode === 'live') {
        // Use SharePoint service for real deletions
        const result = await deleteMultipleParts(selectedParts)
        
        if (result.succeeded > 0) {
          success(`Successfully deleted ${result.succeeded} part(s)`)
        }
        
        if (result.failed > 0) {
          error(`Failed to delete ${result.failed} part(s)`)
        }
      } else {
        // Mock deletion for testing
        await new Promise(resolve => setTimeout(resolve, 1000))
        success(`Mock deletion: ${selectedParts.length} part(s) would be deleted`)
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
    if (integrationMode === 'live') {
      refreshParts()
      success('Parts data refreshed!')
    } else {
      info('Refresh only works in live mode')
    }
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
  // INTEGRATION MODE DISPLAY
  // =================================================================
  if (integrationMode === 'test') {
    return <SharePointConnectionTest />
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
              onClick={() => setIntegrationMode('mock')}
              className="btn btn-secondary"
            >
              Use Mock Data
            </button>
            <button
              onClick={() => setIntegrationMode('test')}
              className="btn btn-primary"
            >
              Test Connection
            </button>
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
      {/* Integration Mode Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Integration Mode</h4>
            <p className="text-sm text-blue-700">
              {integrationMode === 'mock' && 'Using mock data for development'}
              {integrationMode === 'test' && 'Testing SharePoint connection'}
              {integrationMode === 'live' && 'Connected to live SharePoint data'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIntegrationMode('test')}
              className={`px-3 py-1 text-xs rounded ${
                integrationMode === 'test' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-300'
              }`}
            >
              🧪 Test
            </button>
            <button
              onClick={() => setIntegrationMode('mock')}
              className={`px-3 py-1 text-xs rounded ${
                integrationMode === 'mock' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-300'
              }`}
            >
              🔧 Mock
            </button>
            <button
              onClick={() => setIntegrationMode('live')}
              className={`px-3 py-1 text-xs rounded ${
                integrationMode === 'live' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-600 border border-green-300'
              }`}
            >
              🚀 Live
            </button>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600">
            Showing {filteredParts.length} of {parts.length} parts
            {integrationMode === 'live' && <span className="text-green-600 ml-2">• Live Data</span>}
            {integrationMode === 'mock' && <span className="text-blue-600 ml-2">• Mock Data</span>}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {integrationMode === 'live' && (
            <button
              onClick={handleRefreshData}
              className="btn btn-outline"
            >
              🔄 Refresh
            </button>
          )}
          
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
                {integrationMode === 'mock' && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-600">
                      ℹ️ Mock mode: No actual data will be deleted
                    </p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteSelected}
                    className="btn btn-danger flex-1"
                  >
                    {integrationMode === 'mock' ? 'Mock Delete' : 'Delete'}
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

      {/* Debug Info (only in dev mode) */}
      {import.meta.env.VITE_DEV_MODE === 'true' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <h4 className="font-medium mb-2">Debug Info</h4>
          <div className="space-y-1">
            <p>Integration Mode: {integrationMode}</p>
            <p>Parts Count: {parts.length}</p>
            <p>Categories Count: {categories.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {dataError || 'None'}</p>
            <p>SharePoint Loading: {sharePointLoading ? 'Yes' : 'No'}</p>
            <p>Categories Loading: {categoriesLoading ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartsTable