import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'

// Import SharePoint hooks (NOW AVAILABLE)
import { useInvoices, useBuyers } from '../../hooks/useSharePoint'

// Import the SharePoint test component
import SharePointConnectionTest from './SharePointConnectionTest'

// =================================================================
// INVOICE LIST COMPONENT - FULL SHAREPOINT INTEGRATION
// =================================================================
const InvoiceList = () => {
  const { success, error, info } = useToast()
  
  // =================================================================
  // INTEGRATION MODE TOGGLE (Same as Parts)
  // =================================================================
  const [integrationMode, setIntegrationMode] = useState('mock') // Start with mock, then test, then live
  
  // =================================================================
  // SHAREPOINT HOOKS
  // =================================================================
  const { 
    invoices: sharePointInvoices, 
    loading: sharePointLoading, 
    error: sharePointError,
    deleteMultipleInvoices,
    refreshInvoices
  } = useInvoices()
  
  const { 
    buyerNames: sharePointBuyers, 
    loading: buyersLoading 
  } = useBuyers()

  // =================================================================
  // MOCK DATA (FALLBACK - Same Pattern as Parts)
  // =================================================================
  const [mockInvoices] = useState([
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      buyer: 'AutoZone Distribution',
      buyerId: '1',
      invoiceDate: '2025-01-10',
      totalAmount: 1250.75,
      status: 'Finalized',
      created: '2025-01-10',
      modified: '2025-01-12'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-002',
      buyer: 'O\'Reilly Auto Parts',
      buyerId: '2',
      invoiceDate: '2025-01-12',
      totalAmount: 875.50,
      status: 'Draft',
      created: '2025-01-12',
      modified: '2025-01-12'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2025-003',
      buyer: 'NAPA Auto Parts',
      buyerId: '3',
      invoiceDate: '2025-01-14',
      totalAmount: 2100.25,
      status: 'Paid',
      created: '2025-01-14',
      modified: '2025-01-14'
    },
    {
      id: '4',
      invoiceNumber: 'INV-2025-004',
      buyer: 'Advance Auto Parts',
      buyerId: '4',
      invoiceDate: '2025-01-15',
      totalAmount: 450.00,
      status: 'Void',
      created: '2025-01-15',
      modified: '2025-01-15'
    }
  ])

  const mockBuyers = ['AutoZone Distribution', 'O\'Reilly Auto Parts', 'NAPA Auto Parts', 'Advance Auto Parts']

  // =================================================================
  // DATA SOURCE SELECTION (Same as Parts)
  // =================================================================
  const invoices = integrationMode === 'live' ? sharePointInvoices : mockInvoices
  const buyers = integrationMode === 'live' ? sharePointBuyers : mockBuyers
  const loading = integrationMode === 'live' ? sharePointLoading || buyersLoading : false
  const dataError = integrationMode === 'live' ? sharePointError : null

  // =================================================================
  // LOCAL STATE FOR UI (Same as Parts)
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'invoiceDate', direction: 'desc' })
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // =================================================================
  // FILTERING AND SORTING (Same Pattern as Parts)
  // =================================================================
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = searchTerm === '' || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.buyer.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === '' || invoice.status === statusFilter
      const matchesBuyer = buyerFilter === '' || invoice.buyer === buyerFilter
      
      return matchesSearch && matchesStatus && matchesBuyer
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
  }, [invoices, searchTerm, statusFilter, buyerFilter, sortConfig])

  // =================================================================
  // EVENT HANDLERS (Same Pattern as Parts)
  // =================================================================
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id))
    } else {
      setSelectedInvoices([])
    }
  }

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const handleDeleteSelected = async () => {
    try {
      if (integrationMode === 'live') {
        // Use SharePoint service for real deletions
        const result = await deleteMultipleInvoices(selectedInvoices)
        
        if (result.succeeded > 0) {
          success(`Successfully deleted ${result.succeeded} invoice(s)`)
        }
        
        if (result.failed > 0) {
          error(`Failed to delete ${result.failed} invoice(s)`)
        }
      } else {
        // Mock deletion for testing
        await new Promise(resolve => setTimeout(resolve, 1000))
        success(`Mock deletion: ${selectedInvoices.length} invoice(s) would be deleted`)
      }
      
      setSelectedInvoices([])
      setShowDeleteModal(false)
      
    } catch (err) {
      console.error('Error deleting invoices:', err)
      error('Failed to delete invoices. Please try again.')
    }
  }

  const handleExportInvoices = () => {
    info('Export functionality coming soon!')
  }

  const handleRefreshData = () => {
    if (integrationMode === 'live') {
      refreshInvoices()
      success('Invoice data refreshed!')
    } else {
      info('Refresh only works in live mode')
    }
  }

  // =================================================================
  // UTILITY FUNCTIONS (Same as Parts)
  // =================================================================
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Draft': { text: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
      'Finalized': { text: 'Finalized', color: 'bg-blue-100 text-blue-800' },
      'Paid': { text: 'Paid', color: 'bg-green-100 text-green-800' },
      'Void': { text: 'Void', color: 'bg-red-100 text-red-800' }
    }
    
    return statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalInvoices = filteredInvoices.length
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const draftCount = filteredInvoices.filter(inv => inv.status === 'Draft').length
    const paidCount = filteredInvoices.filter(inv => inv.status === 'Paid').length
    const finalizedCount = filteredInvoices.filter(inv => inv.status === 'Finalized').length

    return { totalInvoices, totalAmount, draftCount, paidCount, finalizedCount }
  }, [filteredInvoices])

  // =================================================================
  // INTEGRATION MODE DISPLAY (Same as Parts)
  // =================================================================
  if (integrationMode === 'test') {
    return <SharePointConnectionTest />
  }

  // =================================================================
  // LOADING STATE (Same as Parts)
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading invoices from SharePoint...</p>
        </div>
      </div>
    )
  }

  // =================================================================
  // ERROR STATE (Same as Parts)
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
      {/* Integration Mode Toggle (Same as Parts) */}
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

      {/* Header Section (Same Pattern as Parts) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
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
            onClick={handleExportInvoices}
            className="btn btn-secondary"
          >
            📊 Export
          </button>
          
          <Link to="/invoices/new" className="btn btn-primary">
            ➕ Create Invoice
          </Link>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{summaryStats.totalInvoices}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalAmount)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Draft</div>
          <div className="text-2xl font-bold text-yellow-600">{summaryStats.draftCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Finalized</div>
          <div className="text-2xl font-bold text-blue-600">{summaryStats.finalizedCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-600">{summaryStats.paidCount}</div>
        </div>
      </div>

      {/* Filters Section (Same Pattern as Parts) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Invoices
            </label>
            <input
              type="text"
              placeholder="Search by invoice # or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
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
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Finalized">Finalized</option>
              <option value="Paid">Paid</option>
              <option value="Void">Void</option>
            </select>
          </div>

          {/* Buyer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer
            </label>
            <select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              className="input"
            >
              <option value="">All Buyers</option>
              {buyers.map(buyer => (
                <option key={buyer} value={buyer}>{buyer}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setBuyerFilter('')
                setSortConfig({ key: 'invoiceDate', direction: 'desc' })
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions (Same Pattern as Parts) */}
      {selectedInvoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedInvoices.length} invoice(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger"
              >
                🗑️ Delete Selected
              </button>
              <button
                onClick={() => setSelectedInvoices([])}
                className="btn btn-secondary"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table (Same Pattern as Parts) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || buyerFilter
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating your first invoice.'
              }
            </p>
            <Link to="/invoices/new" className="btn btn-primary">
              Create First Invoice
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
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    Invoice # {getSortIcon('invoiceNumber')}
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('buyer')}
                  >
                    Buyer {getSortIcon('buyer')}
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('invoiceDate')}
                  >
                    Date {getSortIcon('invoiceDate')}
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total Amount {getSortIcon('totalAmount')}
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status)
                  
                  return (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-gray-50 ${selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.buyer}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                          {statusBadge.text}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            👁️
                          </Link>
                          {invoice.status === 'Draft' && (
                            <Link
                              to={`/invoices/${invoice.id}/edit`}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Edit Invoice"
                            >
                              ✏️
                            </Link>
                          )}
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

      {/* Delete Confirmation Modal (Same as Parts) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Selected Invoices
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedInvoices.length} selected invoice(s)? 
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

      {/* Debug Info (only in dev mode) - Same as Parts */}
      {import.meta.env.VITE_DEV_MODE === 'true' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <h4 className="font-medium mb-2">Debug Info</h4>
          <div className="space-y-1">
            <p>Integration Mode: {integrationMode}</p>
            <p>Invoices Count: {invoices.length}</p>
            <p>Buyers Count: {buyers.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {dataError || 'None'}</p>
            <p>SharePoint Loading: {sharePointLoading ? 'Yes' : 'No'}</p>
            <p>Buyers Loading: {buyersLoading ? 'Yes' : 'No'}</p>
            <p>Selected: {selectedInvoices.length}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceList