// =================================================================
// ENHANCED PART DETAILS - HYBRID SOLUTION WITH FAMILY SUPPORT
// =================================================================
// HYBRID SOLUTION: Category field is now text with family information
// Enhanced with family context, family-based insights, and comprehensive part analysis
// ACCESS CONTROL: Implemented role-based access control according to partdetails_access_matrix.md

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import LoadingSpinner from '../shared/LoadingSpinner'
import { usePart, usePartTransactions, useCategories, useParts } from '../../hooks/useSharePoint'

// =================================================================
// PART DETAILS COMPONENT - HYBRID SOLUTION ENHANCED WITH ACCESS CONTROL
// =================================================================
const PartDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error, info } = useToast()
  const { userRole } = useAuth()
  const { canAccess, canEdit, canDelete, canCreate, isAdmin, isUser, isReadOnly } = useRoleAccess('ReadOnly')

  // =================================================================
  // SHAREPOINT HOOKS - HYBRID SOLUTION ENHANCED
  // =================================================================
  const { 
    part, 
    loading: partLoading, 
    error: partError,
    deletePart 
  } = usePart(id)
  
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError
  } = usePartTransactions(part?.partId)

  const {
    getFamilyByCategory,
    categoriesByFamily,
    loading: categoriesLoading
  } = useCategories()

  // HYBRID SOLUTION: Get related parts in same family
  const { parts: allParts } = useParts()

  // =================================================================
  // STATE MANAGEMENT
  // =================================================================
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Combined loading and error states
  const loading = partLoading || transactionsLoading || categoriesLoading
  const dataError = partError || transactionsError

  // =================================================================
  // HYBRID SOLUTION: ENHANCED DATA PROCESSING
  // =================================================================
  
  // Get family information for the current part
  const partFamily = useMemo(() => {
    if (!part?.category) return null
    return getFamilyByCategory(part.category)
  }, [part?.category, getFamilyByCategory])

  // Get related parts in the same family
  const relatedPartsInFamily = useMemo(() => {
    if (!partFamily || !allParts.length) return []
    
    return allParts
      .filter(p => {
        const pFamily = getFamilyByCategory(p.category)
        return pFamily === partFamily && p.partId !== part?.partId
      })
      .sort((a, b) => a.partId.localeCompare(b.partId))
  }, [partFamily, allParts, getFamilyByCategory, part?.partId])

  // Get related parts in the same category (but different family)
  const relatedPartsInCategory = useMemo(() => {
    if (!part?.category || !allParts.length) return []
    
    return allParts
      .filter(p => {
        const pFamily = getFamilyByCategory(p.category)
        return p.category === part.category && pFamily !== partFamily && p.partId !== part?.partId
      })
      .sort((a, b) => a.partId.localeCompare(b.partId))
  }, [part?.category, allParts, getFamilyByCategory, partFamily, part?.partId])

  // Calculate family-level statistics
  const familyStats = useMemo(() => {
    if (!partFamily || !allParts.length) return null
    
    const familyParts = allParts.filter(p => {
      const pFamily = getFamilyByCategory(p.category)
      return pFamily === partFamily
    })
    
    if (familyParts.length === 0) return null
    
    const totalParts = familyParts.length
    const categories = new Set(familyParts.map(p => p.category)).size
    const totalInventory = familyParts.reduce((sum, p) => sum + (p.inventoryOnHand || 0), 0)
    const totalValue = familyParts.reduce((sum, p) => sum + ((p.inventoryOnHand || 0) * (p.unitCost || 0)), 0)
    const averageValue = totalParts > 0 ? totalValue / totalParts : 0
    const lowStockParts = familyParts.filter(p => (p.inventoryOnHand || 0) <= 5 && (p.inventoryOnHand || 0) > 0).length
    const outOfStockParts = familyParts.filter(p => (p.inventoryOnHand || 0) === 0).length
    
    return {
      totalParts,
      categories,
      totalInventory,
      totalValue,
      averageValue,
      lowStockParts,
      outOfStockParts
    }
  }, [partFamily, allParts, getFamilyByCategory])

  // =================================================================
  // ACCESS CONTROL HANDLERS
  // =================================================================
  
  // Handle delete operation (Admin only)
  const handleDeletePart = async () => {
    if (!canDelete) {
      error('You do not have permission to delete parts')
      return
    }

    setDeleting(true)
    try {
      await deletePart(part.id)
      success('Part deleted successfully')
      navigate('/parts')
    } catch (err) {
      error('Failed to delete part: ' + err.message)
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Handle create transaction (User+ only)
  const handleCreateTransaction = () => {
    if (!canCreate) {
      error('You do not have permission to create transactions')
      return
    }
    navigate(`/transactions/new?partId=${part.partId}`)
  }

  // Handle edit part (User+ only)
  const handleEditPart = () => {
    if (!canEdit) {
      error('You do not have permission to edit parts')
      return
    }
    navigate(`/parts/${part.id}/edit`)
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTotalValue = () => {
    return (part?.inventoryOnHand || 0) * (part?.unitCost || 0)
  }

  const getInventoryStatus = () => {
    const inventory = part?.inventoryOnHand || 0
    if (inventory === 0) return { color: 'text-red-600', text: 'Out of Stock', icon: '🔴' }
    if (inventory <= 5) return { color: 'text-yellow-600', text: 'Low Stock', icon: '🟡' }
    return { color: 'text-green-600', text: 'In Stock', icon: '🟢' }
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Stock In':
      case 'Purchase':
        return 'bg-green-100 text-green-800'
      case 'Stock Out':
      case 'Sale':
        return 'bg-red-100 text-red-800'
      case 'Adjustment':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTotal = (transaction) => {
    const isInventoryIncrease = (movementType) => {
      return movementType?.includes('In') || 
            movementType === 'Adjustment' || 
            movementType === 'Void adjustment';
    };

    if (isInventoryIncrease(transaction.movementType || transaction.MovementType)) {
      const cost = transaction.unitCost || transaction.UnitCost || 0
      const quantity = transaction.quantity || transaction.Quantity || 0
      return quantity * cost
    } else if ((transaction.movementType || transaction.MovementType)?.includes('Out')) {
      const price = transaction.unitPrice || transaction.UnitPrice || 0
      const quantity = transaction.quantity || transaction.Quantity || 0
      return quantity * price
    }
    return 0
  }


  // =================================================================
  // EARLY RETURNS
  // =================================================================
  
  // Check access first
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-700">You do not have permission to view part details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading part details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-2">Error Loading Part</h1>
            <p className="text-red-700">{dataError}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!part) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-yellow-800 mb-2">Part Not Found</h1>
            <p className="text-yellow-700">The requested part could not be found.</p>
          </div>
        </div>
      </div>
    )
  }

  const inventoryStatus = getInventoryStatus()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Role Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Part Details: {part.partId}
              </h1>
              <p className="text-gray-600 mt-1">{part.description}</p>
            </div>
          </div>

          {/* ACTION BUTTONS - Role-based access control */}
          <div className="flex space-x-3">
            {/* Edit Part button - User+ only */}
            {canEdit && (
              <button
                onClick={handleEditPart}
                className="btn btn-primary flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Edit Part</span>
              </button>
            )}

            {/* Create Transaction button - User+ only */}
            {canCreate && (
              <button
                onClick={handleCreateTransaction}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <span>📦</span>
                <span>Create Transaction</span>
              </button>
            )}

            {/* Delete Part button - Admin only */}
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Delete Part</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">{inventoryStatus.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">{part.inventoryOnHand || 0}</p>
                <p className={`text-xs font-medium ${inventoryStatus.color}`}>
                  {inventoryStatus.text}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unit Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(part.unitPrice)}
                </p>
                <p className="text-xs text-gray-500">
                  Cost: {formatCurrency(part.unitCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Margin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {part.unitCost && part.unitPrice ? 
                    `${(((part.unitPrice - part.unitCost) / part.unitCost) * 100).toFixed(1)}%` : 
                    'N/A'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Profit: {formatCurrency((part.unitPrice || 0) - (part.unitCost || 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💼</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculateTotalValue())}
                </p>
                <p className="text-xs text-gray-500">
                  At cost price
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* HYBRID SOLUTION: Family Context Section */}
        {partFamily && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  {partFamily} Family Context
                </h3>
                <p className="text-blue-700 text-sm">
                  This part belongs to the {partFamily} automotive system
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/parts?family=${encodeURIComponent(partFamily)}`}
                  className="btn btn-outline text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  View All {partFamily} Parts
                </Link>
              </div>
            </div>

            {familyStats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">{familyStats.totalParts}</div>
                  <div className="text-blue-700">Total Parts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">{familyStats.categories}</div>
                  <div className="text-blue-700">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">{formatCurrency(familyStats.totalValue)}</div>
                  <div className="text-blue-700">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-900">{familyStats.totalInventory}</div>
                  <div className="text-blue-700">Total Units</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-700">{familyStats.lowStockParts}</div>
                  <div className="text-blue-700">Low Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-700">{familyStats.outOfStockParts}</div>
                  <div className="text-blue-700">Out of Stock</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TABS - All users can access all tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {/* Overview tab button - All users */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Overview
              </button>
              
              {/* Transaction History tab button - All users */}
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Transaction History ({transactions?.length || 0})
              </button>
              
              {/* Related Parts tab button - All users */}
              <button
                onClick={() => setActiveTab('related')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'related'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔗 Related Parts ({relatedPartsInFamily.length + relatedPartsInCategory.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Part Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Part Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Part ID:</dt>
                        <dd className="text-sm text-gray-900 font-mono">{part.partId}</dd>
                      </div>
                      {/* HYBRID SOLUTION: Enhanced category display with family */}
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Family:</dt>
                        <dd className="text-sm text-gray-900">
                          <Link 
                            to={`/parts?family=${encodeURIComponent(partFamily || '')}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {partFamily || 'Unknown Family'}
                          </Link>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Category:</dt>
                        <dd className="text-sm text-gray-900">
                          <Link 
                            to={`/parts?category=${encodeURIComponent(part.category)}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {part.category}
                          </Link>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Status:</dt>
                        <dd className="text-sm text-gray-900">{part.status}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Description:</dt>
                        <dd className="text-sm text-gray-900">{part.description}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Pricing Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Total Value:</dt>
                        <dd className="text-sm text-gray-900 font-medium">{formatCurrency(calculateTotalValue())}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Unit Cost:</dt>
                        <dd className="text-sm text-gray-900 font-medium">{formatCurrency(part.unitCost)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Unit Price:</dt>
                        <dd className="text-sm text-gray-900 font-medium">{formatCurrency(part.unitPrice)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Profit per Unit:</dt>
                        <dd className="text-sm text-gray-900 font-medium">
                          {formatCurrency((part.unitPrice || 0) - (part.unitCost || 0))}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Margin:</dt>
                        <dd className="text-sm text-gray-900 font-medium">
                          {part.unitCost && part.unitPrice ? 
                            `${(((part.unitPrice - part.unitCost) / part.unitCost) * 100).toFixed(1)}%` : 
                            'N/A'
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Audit Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Created:</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDate(part.created)} by {part.createdBy}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Last Modified:</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDate(part.modified)} by {part.modifiedBy}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="text-lg font-medium text-gray-900 mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
                </div>

                {!transactions || transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transactions found for this part.</p>
                    {canCreate && (
                      <button
                        onClick={handleCreateTransaction}
                        className="mt-4 btn btn-primary"
                      >
                        Create First Transaction
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reference
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(transaction.created || transaction.Created)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  (transaction.movementType || transaction.MovementType)?.includes('In') 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.movementType || transaction.MovementType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(transaction.movementType || transaction.MovementType)?.includes('In') ? '+' : '-'}{transaction.quantity || transaction.Quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency((transaction.unitPrice || transaction.UnitPrice) || (transaction.unitCost || transaction.UnitCost))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(getTransactionTotal(transaction))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(transaction.invoice || transaction.Invoice) && (
                                  <Link 
                                    to={`/invoices/${transaction.invoice || transaction.Invoice}`}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {transaction.invoice || transaction.Invoice}
                                  </Link>
                                )}
                                {!(transaction.invoice || transaction.Invoice) && (transaction.supplier || transaction.Supplier) && (
                                  <span className="text-gray-600">{transaction.supplier || transaction.Supplier}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {transaction.notes || transaction.Notes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Transaction Summary - NOW INSIDE THE CONDITIONAL */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Transactions:</span>
                          <span className="ml-2 font-medium">{transactions.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total In:</span>
                          <span className="ml-2 font-medium text-green-600">
                            +{transactions
                              .filter(t => (t.movementType || t.MovementType)?.includes('In'))
                              .reduce((sum, t) => sum + (t.quantity || t.Quantity || 0), 0)
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Out:</span>
                          <span className="ml-2 font-medium text-red-600">
                            -{transactions
                              .filter(t => (t.movementType || t.MovementType)?.includes('Out'))
                              .reduce((sum, t) => sum + (t.quantity || t.Quantity || 0), 0)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Related Parts Tab */}
            {activeTab === 'related' && (
              <div className="space-y-6">
                <div className="text-lg font-medium text-gray-900 mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Related Parts</h3>
                </div>

                {/* Same Family Parts */}
                {relatedPartsInFamily.length > 0 && (
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-3">
                      Other {partFamily} Parts ({relatedPartsInFamily.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relatedPartsInFamily.map((relatedPart) => (
                        <div key={relatedPart.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Link
                              to={`/parts/${relatedPart.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {relatedPart.partId}
                            </Link>
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                              relatedPart.status === 'Active' ? 'bg-green-100 text-green-800' :
                              relatedPart.status === 'Obsolete' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {relatedPart.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 truncate" title={relatedPart.description}>
                            {relatedPart.description}
                          </p>
                          <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                            <div>Stock: {relatedPart.inventoryOnHand || 0}</div>
                            <div>Price: {formatCurrency(relatedPart.unitPrice)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Same Category, Different Family Parts */}
                {relatedPartsInCategory.length > 0 && (
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-3">
                      Other {part.category} Parts ({relatedPartsInCategory.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relatedPartsInCategory.map((relatedPart) => (
                        <div key={relatedPart.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Link
                              to={`/parts/${relatedPart.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {relatedPart.partId}
                            </Link>
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                              relatedPart.status === 'Active' ? 'bg-green-100 text-green-800' :
                              relatedPart.status === 'Obsolete' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {relatedPart.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 truncate" title={relatedPart.description}>
                            {relatedPart.description}
                          </p>
                          <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                            <div>Family: {getFamilyByCategory(relatedPart.category) || 'Unknown'}</div>
                            <div>Stock: {relatedPart.inventoryOnHand || 0}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Related Parts */}
                {relatedPartsInFamily.length === 0 && relatedPartsInCategory.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No related parts found.</p>
                    <p className="text-gray-400 text-sm mt-2">
                      This part doesn't have any related parts in the same family or category.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL - Admin only */}
        {showDeleteModal && canDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Delete Part
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete part "{part.partId}"? This action cannot be undone.
                All associated transactions will remain in the system for audit purposes.
              </p>
              <div className="flex justify-end space-x-3">
                {/* Cancel Delete button - Admin only */}
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                  disabled={deleting}
                >
                  Cancel
                </button>
                {/* Confirm Delete button - Admin only */}
                <button
                  onClick={handleDeletePart}
                  className="btn btn-danger"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Part'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =================================================================
// RENDER
// =================================================================

export default PartDetails