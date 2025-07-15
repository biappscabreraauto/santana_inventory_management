import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'

// Import SharePoint hooks - LIVE MODE ONLY
import { useInvoices, useBuyers } from '../../hooks/useSharePoint'

// =================================================================
// INVOICE LIST COMPONENT - PRODUCTION VERSION (LIVE MODE ONLY)
// =================================================================
const InvoiceList = () => {
  const { success, error, info } = useToast()
  
  // =================================================================
  // SHAREPOINT HOOKS - LIVE DATA ONLY
  // =================================================================
  const { 
    invoices, 
    loading: invoicesLoading, 
    error: invoicesError,
    deleteMultipleInvoices,
    refreshInvoices
  } = useInvoices()
  
  const { 
    buyerNames, 
    loading: buyersLoading 
  } = useBuyers()

  // Use SharePoint data directly
  const loading = invoicesLoading || buyersLoading
  const dataError = invoicesError

  // =================================================================
  // LOCAL STATE FOR UI
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'invoiceDate', direction: 'desc' })
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // =================================================================
  // FILTERING AND SORTING
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
      // Use SharePoint service for real deletions
      const result = await deleteMultipleInvoices(selectedInvoices)
      
      if (result.succeeded > 0) {
        success(`Successfully deleted ${result.succeeded} invoice(s)`)
      }
      
      if (result.failed > 0) {
        error(`Failed to delete ${result.failed} invoice(s)`)
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
    refreshInvoices()
    success('Invoice data refreshed!')
  }

  // =================================================================
  // UTILITY FUNCTIONS
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
  // LOADING STATE
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
              to="/invoices/new"
              className="btn btn-secondary"
            >
              Create Invoice Anyway
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
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
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

      {/* Filters Section */}
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
              {buyerNames.map(buyer => (
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

      {/* Bulk Actions */}
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

      {/* Invoices Table */}
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

      {/* Delete Confirmation Modal */}
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
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteSelected}
                    className="btn btn-danger flex-1"
                  >
                    Delete Invoices
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

export default InvoiceList