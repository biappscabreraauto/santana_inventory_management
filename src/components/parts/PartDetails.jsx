import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'

// =================================================================
// PART DETAILS COMPONENT
// =================================================================
const PartDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error, info } = useToast()

  // =================================================================
  // STATE MANAGEMENT
  // =================================================================
  const [part, setPart] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // =================================================================
  // DATA FETCHING
  // =================================================================
  useEffect(() => {
    loadPartDetails()
    loadTransactionHistory()
  }, [id])

  const loadPartDetails = async () => {
    try {
      setLoading(true)
      
      // TODO: Replace with actual SharePoint API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Mock part data
      const mockPart = {
        id: id,
        partId: 'BH001',
        description: 'Brake Hose - Front Left',
        category: 'Brake Hose',
        inventoryOnHand: 5,
        unitCost: 25.99,
        unitPrice: 45.99,
        status: 'Active',
        created: '2024-01-15T10:30:00Z',
        modified: '2024-07-10T14:22:00Z',
        createdBy: 'John Doe',
        modifiedBy: 'Jane Smith'
      }
      
      setPart(mockPart)
    } catch (err) {
      console.error('Error loading part details:', err)
      error('Failed to load part details')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactionHistory = async () => {
    try {
      // TODO: Replace with actual SharePoint API call
      // Mock transaction history
      const mockTransactions = [
        {
          id: '1',
          date: '2024-07-12T09:15:00Z',
          type: 'Out (Sold)',
          quantity: 2,
          unitPrice: 45.99,
          invoice: 'INV-2024-001',
          buyer: 'ABC Auto Shop',
          notes: 'Regular customer order',
          user: 'Jane Smith'
        },
        {
          id: '2',
          date: '2024-07-10T14:22:00Z',
          type: 'In (Received)',
          quantity: 10,
          unitCost: 25.99,
          supplier: 'Parts Warehouse Inc',
          notes: 'Weekly inventory restock',
          user: 'John Doe'
        },
        {
          id: '3',
          date: '2024-07-05T11:45:00Z',
          type: 'Out (Sold)',
          quantity: 3,
          unitPrice: 45.99,
          invoice: 'INV-2024-002',
          buyer: 'Quick Fix Garage',
          notes: 'Emergency order',
          user: 'Mike Johnson'
        },
        {
          id: '4',
          date: '2024-06-28T16:30:00Z',
          type: 'In (Received)',
          quantity: 5,
          unitCost: 24.50,
          supplier: 'AutoParts Direct',
          notes: 'Special bulk order discount',
          user: 'Jane Smith'
        }
      ]
      
      setTransactions(mockTransactions)
    } catch (err) {
      console.error('Error loading transaction history:', err)
      error('Failed to load transaction history')
    }
  }

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      // TODO: Replace with actual SharePoint API call
      console.log('Deleting part:', id)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      success('Part deleted successfully')
      navigate('/parts')
      
    } catch (err) {
      console.error('Error deleting part:', err)
      error('Failed to delete part. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleExportHistory = () => {
    info('Export functionality coming soon!')
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getInventoryStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: '🔴' }
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', icon: '🟢' }
  }

  const calculateTotalValue = () => {
    if (!part) return 0
    return part.inventoryOnHand * part.unitCost
  }

  const calculateProfitMargin = () => {
    if (!part || part.unitCost === 0) return 0
    return ((part.unitPrice - part.unitCost) / part.unitCost * 100)
  }

  const getTransactionTotal = (transaction) => {
    const price = transaction.unitPrice || transaction.unitCost || 0
    return transaction.quantity * price
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!part) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Part not found</h3>
        <p className="text-gray-600 mb-4">The requested part could not be found.</p>
        <Link to="/parts" className="btn btn-primary">
          Back to Parts
        </Link>
      </div>
    )
  }

  const inventoryStatus = getInventoryStatus(part.inventoryOnHand)

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {part.partId}
            </h1>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              part.status === 'Active' ? 'bg-green-100 text-green-800' :
              part.status === 'Obsolete' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {part.status}
            </span>
          </div>
          <p className="text-gray-600">{part.description}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/parts" className="btn btn-secondary">
            ← Back to Parts
          </Link>
          <Link to={`/parts/${id}/edit`} className="btn btn-primary">
            ✏️ Edit Part
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">{inventoryStatus.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Status</p>
              <p className="text-lg font-bold text-gray-900">{part.inventoryOnHand} units</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${inventoryStatus.color}`}>
                {inventoryStatus.text}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unit Price</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(part.unitPrice)}</p>
              <p className="text-xs text-gray-500">
                Cost: {formatCurrency(part.unitCost)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-lg font-bold text-gray-900">
                {calculateProfitMargin().toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                Profit: {formatCurrency(part.unitPrice - part.unitCost)}
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
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
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Transaction History
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
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Category:</dt>
                      <dd className="text-sm text-gray-900">{part.category}</dd>
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
                      <dt className="text-sm font-medium text-gray-600">Unit Cost:</dt>
                      <dd className="text-sm text-gray-900 font-semibold">{formatCurrency(part.unitCost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Unit Price:</dt>
                      <dd className="text-sm text-gray-900 font-semibold">{formatCurrency(part.unitPrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Profit per Unit:</dt>
                      <dd className="text-sm text-green-600 font-semibold">
                        {formatCurrency(part.unitPrice - part.unitCost)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Margin:</dt>
                      <dd className="text-sm text-green-600 font-semibold">
                        {calculateProfitMargin().toFixed(1)}%
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
                <button
                  onClick={handleExportHistory}
                  className="btn btn-secondary"
                >
                  📊 Export History
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-3xl mb-3">📝</div>
                  <p className="text-gray-600">No transaction history available</p>
                </div>
              ) : (
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
                          User
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.type.includes('In') 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.type.includes('In') ? '+' : '-'}{transaction.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.unitPrice || transaction.unitCost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(getTransactionTotal(transaction))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.invoice && (
                              <Link 
                                to={`/invoices/${transaction.invoice}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {transaction.invoice}
                              </Link>
                            )}
                            {transaction.supplier && (
                              <span className="text-gray-600">{transaction.supplier}</span>
                            )}
                            {transaction.buyer && (
                              <span className="text-gray-600">{transaction.buyer}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.user}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transaction Summary */}
              {transactions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
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
                          .filter(t => t.type.includes('In'))
                          .reduce((sum, t) => sum + t.quantity, 0)
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Out:</span>
                      <span className="ml-2 font-medium text-red-600">
                        -{transactions
                          .filter(t => t.type.includes('Out'))
                          .reduce((sum, t) => sum + t.quantity, 0)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={`/transactions/new?partId=${part.partId}`}
            className="btn btn-outline w-full"
          >
            📦 Log Inbound Stock
          </Link>
          <Link
            to={`/invoices/new?partId=${part.partId}`}
            className="btn btn-outline w-full"
          >
            🧾 Create Invoice
          </Link>
          <Link
            to={`/external-lookup?search=${part.partId}`}
            className="btn btn-outline w-full"
          >
            🔍 External Lookup
          </Link>
        </div>
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
                Delete Part
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{part.partId}</strong>? 
                  This action cannot be undone and will remove all associated transaction history.
                </p>
                {part.inventoryOnHand > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Warning: This part has {part.inventoryOnHand} units in stock
                    </p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn btn-danger flex-1"
                  >
                    {deleting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Part'
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
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

export default PartDetails