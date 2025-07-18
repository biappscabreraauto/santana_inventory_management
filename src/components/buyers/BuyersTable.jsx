// =================================================================
// BUYERS TABLE COMPONENT - ROLE-BASED ACCESS CONTROL IMPLEMENTATION
// =================================================================
// Main table component for displaying and managing buyers/customers
// Features: Search, filtering, sorting, bulk actions, and CRUD operations with role restrictions

import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useBuyers } from '../../hooks/useSharePoint'
import { Search, Plus, Edit, Trash2, User, Mail, Phone, Users, Filter, X } from 'lucide-react'

const BuyersTable = () => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { 
    canAccess, 
    canCreate, 
    canEdit, 
    canDelete,
    canBulkSelect,
    canBulkDelete,
    canExport,
    isReadOnly, 
    isUser, 
    isAdmin,
    userRole 
  } = useRoleAccess('ReadOnly') // Minimum ReadOnly access for viewing
  
  const { buyers, loading, deleteBuyer, refreshBuyers, deleteMultipleBuyers } = useBuyers()

  // Early return if no access
  if (!canAccess) {
    return <RoleProtected requiredRole="ReadOnly" />
  }

  // =================================================================
  // LOCAL STATE
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBuyers, setSelectedBuyers] = useState([])
  const [sortField, setSortField] = useState('buyerName')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filters, setFilters] = useState({
    hasEmail: 'all',
    hasPhone: 'all'
  })

  // =================================================================
  // ROLE-BASED ACCESS CONTROL FUNCTIONS
  // =================================================================
  
  /**
   * Check if user can perform bulk operations
   */
  const canPerformBulkOperations = () => {
    return canBulkSelect || canBulkDelete || canExport
  }

  /**
   * Check if user can access specific editing point
   */
  const canAccessEditingPoint = (editingPoint) => {
    switch (editingPoint) {
      case 'add_buyer':
        return canCreate
      case 'search_input':
      case 'filters':
      case 'communication_links':
        return true // Available to all users (ReadOnly+)
      case 'select_all':
      case 'row_checkboxes':
      case 'clear_selection':
        return canBulkSelect
      case 'delete_selected':
        return canBulkDelete
      case 'edit_button':
        return canEdit
      default:
        return false
    }
  }

  /**
   * Get bulk operation permissions
   */
  const getBulkPermissions = () => ({
    canSelect: canBulkSelect,
    canDelete: canBulkDelete,
    canExport: canExport,
    showControls: canPerformBulkOperations()
  })

  // =================================================================
  // COMPUTED VALUES
  // =================================================================
  const filteredAndSortedBuyers = useMemo(() => {
    let filtered = buyers || []

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(buyer =>
        buyer.buyerName?.toLowerCase().includes(searchLower) ||
        buyer.contactEmail?.toLowerCase().includes(searchLower) ||
        buyer.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Apply additional filters
    if (filters.hasEmail !== 'all') {
      filtered = filtered.filter(buyer => 
        filters.hasEmail === 'yes' ? buyer.contactEmail : !buyer.contactEmail
      )
    }

    if (filters.hasPhone !== 'all') {
      filtered = filtered.filter(buyer => 
        filters.hasPhone === 'yes' ? buyer.phone : !buyer.phone
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      const multiplier = sortDirection === 'asc' ? 1 : -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * multiplier
      }
      
      return (aValue - bValue) * multiplier
    })

    return filtered
  }, [buyers, searchTerm, filters, sortField, sortDirection])

  const stats = useMemo(() => {
    const total = buyers?.length || 0
    const withEmail = buyers?.filter(b => b.contactEmail).length || 0
    const withPhone = buyers?.filter(b => b.phone).length || 0
    const withBoth = buyers?.filter(b => b.contactEmail && b.phone).length || 0
    
    return { total, withEmail, withPhone, withBoth }
  }, [buyers])

  const bulkPermissions = getBulkPermissions()

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked) => {
    // Check permission before allowing selection
    if (!canAccessEditingPoint('select_all')) {
      return
    }

    if (checked) {
      setSelectedBuyers(filteredAndSortedBuyers.map(buyer => buyer.id))
    } else {
      setSelectedBuyers([])
    }
  }

  const handleSelectBuyer = (buyerId) => {
    // Check permission before allowing selection
    if (!canAccessEditingPoint('row_checkboxes')) {
      return
    }

    setSelectedBuyers(prev => 
      prev.includes(buyerId) 
        ? prev.filter(id => id !== buyerId)
        : [...prev, buyerId]
    )
  }

  const handleDeleteSelected = async () => {
    // Double-check permissions
    if (!canAccessEditingPoint('delete_selected')) {
      error('You do not have permission to delete buyers')
      return
    }

    try {
      const result = await deleteMultipleBuyers(selectedBuyers)
      
      if (result.succeeded > 0) {
        success(`Successfully deleted ${result.succeeded} buyer(s)`)
      }
      
      if (result.failed > 0) {
        error(`Failed to delete ${result.failed} buyer(s)`)
      }
      
      setSelectedBuyers([])
      setShowDeleteModal(false)
      refreshBuyers()
    } catch (err) {
      console.error('Error deleting buyers:', err)
      error('Failed to delete buyers. Please try again.')
    }
  }

  const clearFilters = () => {
    setFilters({
      hasEmail: 'all',
      hasPhone: 'all'
    })
    setSearchTerm('')
  }

  const handleClearSelection = () => {
    if (canAccessEditingPoint('clear_selection')) {
      setSelectedBuyers([])
    }
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading buyers...</p>
        </div>
      </div>
    )
  }

  // =================================================================
  // MAIN RENDER
  // =================================================================
  return (
    <div className="space-y-6">
      {/* Header with Role Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyers Management</h1>
          <p className="text-gray-600">
            Manage your customer database and contact information
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {userRole} Access
            </span>
            {isAdmin && (
              <div className="mt-1 text-xs text-gray-500">Full Buyer Management + Bulk Delete</div>
            )}
            {isUser && (
              <div className="mt-1 text-xs text-gray-500">Create, Edit, Search & Filter</div>
            )}
            {isReadOnly && (
              <div className="mt-1 text-xs text-gray-500">View, Search & Communication Only</div>
            )}
          </div>
          
          {/* Add Buyer Button - User+ Access */}
          <RoleProtected requiredRole="User" hideIfUnauthorized>
            {canAccessEditingPoint('add_buyer') && (
              <Link
                to="/buyers/new"
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Buyer
              </Link>
            )}
          </RoleProtected>
        </div>
      </div>

      {/* Stats Cards - Available to all users */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Buyers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">With Email</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">With Phone</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withPhone}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <User className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Complete Info</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withBoth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar - Available to all users */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input - Available to all users */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search buyers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle - Available to all users */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>

          {/* Clear Filters - Available to all users */}
          {(searchTerm || filters.hasEmail !== 'all' || filters.hasPhone !== 'all') && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Options - Available to all users */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Email
                </label>
                <select
                  value={filters.hasEmail}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasEmail: e.target.value }))}
                  className="w-full input"
                >
                  <option value="all">All Buyers</option>
                  <option value="yes">With Email</option>
                  <option value="no">Without Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Phone
                </label>
                <select
                  value={filters.hasPhone}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.value }))}
                  className="w-full input"
                >
                  <option value="all">All Buyers</option>
                  <option value="yes">With Phone</option>
                  <option value="no">Without Phone</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions - Role-based visibility */}
      {selectedBuyers.length > 0 && bulkPermissions.showControls && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedBuyers.length} buyer(s) selected
            </p>
            <div className="flex space-x-2">
              {/* Delete Selected - Admin Only */}
              <RoleProtected requiredRole="Admin" hideIfUnauthorized>
                {canAccessEditingPoint('delete_selected') && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </button>
                )}
              </RoleProtected>
              
              {/* Clear Selection - User+ Access */}
              <RoleProtected requiredRole="User" hideIfUnauthorized>
                {canAccessEditingPoint('clear_selection') && (
                  <button
                    onClick={handleClearSelection}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear Selection
                  </button>
                )}
              </RoleProtected>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Selection Column - Only show if user can select */}
                {bulkPermissions.canSelect && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedBuyers.length === filteredAndSortedBuyers.length && filteredAndSortedBuyers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('buyerName')}
                >
                  Buyer Name
                  {sortField === 'buyerName' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('contactEmail')}
                >
                  Email
                  {sortField === 'contactEmail' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('phone')}
                >
                  Phone
                  {sortField === 'phone' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedBuyers.length === 0 ? (
                <tr>
                  <td colSpan={bulkPermissions.canSelect ? "5" : "4"} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm || filters.hasEmail !== 'all' || filters.hasPhone !== 'all' 
                        ? 'No buyers found' 
                        : 'No buyers yet'
                      }
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filters.hasEmail !== 'all' || filters.hasPhone !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first buyer'
                      }
                    </p>
                    {!searchTerm && filters.hasEmail === 'all' && filters.hasPhone === 'all' && (
                      <RoleProtected requiredRole="User" hideIfUnauthorized>
                        {canAccessEditingPoint('add_buyer') && (
                          <div className="mt-6">
                            <Link
                              to="/buyers/new"
                              className="btn btn-primary"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Buyer
                            </Link>
                          </div>
                        )}
                      </RoleProtected>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedBuyers.map((buyer) => (
                  <BuyerTableRow
                    key={buyer.id}
                    buyer={buyer}
                    isSelected={selectedBuyers.includes(buyer.id)}
                    onSelect={handleSelectBuyer}
                    canSelect={bulkPermissions.canSelect}
                    canEdit={canAccessEditingPoint('edit_button')}
                    showCheckbox={bulkPermissions.canSelect}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary - Available to all users */}
      {filteredAndSortedBuyers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>
            Showing {filteredAndSortedBuyers.length} of {buyers?.length || 0} buyers
          </p>
          {selectedBuyers.length > 0 && bulkPermissions.showControls && (
            <p>
              {selectedBuyers.length} selected
            </p>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal - Admin Only */}
      {showDeleteModal && canAccessEditingPoint('delete_selected') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Buyers
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete {selectedBuyers.length} buyer(s)? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteSelected}
                  className="btn btn-danger flex-1"
                >
                  Delete Buyers
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
      )}

      {/* ReadOnly User Information */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Read-Only Access</h3>
              <p className="text-sm text-blue-700 mt-1">
                You can view and search buyer information, and use communication links. 
                To create, edit, or delete buyers, contact your administrator to request User access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =================================================================
// BUYER TABLE ROW COMPONENT
// =================================================================
const BuyerTableRow = ({ buyer, isSelected, onSelect, canSelect, canEdit, showCheckbox }) => {
  return (
    <tr className={`hover:bg-gray-50 transition-colors duration-150 ${isSelected ? 'bg-blue-50' : ''}`}>
      {/* Selection Column - Only show if user can select */}
      {showCheckbox && (
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(buyer.id)}
            disabled={!canSelect}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
        </td>
      )}
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {buyer.buyerName}
            </div>
          </div>
        </div>
      </td>
      
      {/* Email - Communication link available to all users */}
      <td className="px-6 py-4 whitespace-nowrap">
        {buyer.contactEmail ? (
          <a
            href={`mailto:${buyer.contactEmail}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {buyer.contactEmail}
          </a>
        ) : (
          <span className="text-sm text-gray-400">No email</span>
        )}
      </td>
      
      {/* Phone - Communication link available to all users */}
      <td className="px-6 py-4 whitespace-nowrap">
        {buyer.phone ? (
          <a
            href={`tel:${buyer.phone}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {buyer.phone}
          </a>
        ) : (
          <span className="text-sm text-gray-400">No phone</span>
        )}
      </td>
      
      {/* Actions - Role-based access */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-2">
          {/* Edit Button - User+ Access */}
          <RoleProtected requiredRole="User" hideIfUnauthorized>
            {canEdit && (
              <Link
                to={`/buyers/${buyer.id}/edit`}
                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                title="Edit Buyer"
              >
                <Edit className="h-4 w-4" />
              </Link>
            )}
          </RoleProtected>
        </div>
      </td>
    </tr>
  )
}

export default BuyersTable