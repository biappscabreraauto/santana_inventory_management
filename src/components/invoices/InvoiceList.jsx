import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { exportInvoicesToCSV } from '../../utils/csvExport'

// Import SharePoint hooks - UPDATED: Removed delete methods
import { useInvoices, useBuyers } from '../../hooks/useSharePoint'

// Icons
import { Plus, Search, Filter, MoreVertical, Download, RefreshCw } from 'lucide-react'

// =================================================================
// INVOICE LIST COMPONENT - UPDATED: Removed edit/delete, added void
// =================================================================
const InvoiceList = () => {
  const { success, error, info } = useToast()
  
  // SharePoint hooks - UPDATED: Removed delete methods
  const { 
    invoices, 
    loading, 
    error: dataError, 
    voidInvoice,
    refreshInvoices 
  } = useInvoices()
  
  const { buyers } = useBuyers()

  // =================================================================
  // LOCAL STATE
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'invoiceDate', direction: 'desc' })
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voidInvoiceId, setVoidInvoiceId] = useState(null)

  // =================================================================
  // FILTERED AND SORTED DATA
  // =================================================================
  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.buyer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter - UPDATED: Removed 'Draft' option
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Buyer filter
    if (buyerFilter) {
      filtered = filtered.filter(invoice => invoice.buyer === buyerFilter)
    }

    // Sort
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

  // REMOVED: handleSelectAll, handleSelectInvoice, handleDeleteSelected

  const handleVoidInvoice = async () => {
    try {
      await voidInvoice(voidInvoiceId)
      success('Invoice voided successfully! Inventory restored.')
      setShowVoidModal(false)
      setVoidInvoiceId(null)
      
    } catch (err) {
      console.error('Error voiding invoice:', err)
      error('Failed to void invoice. Please try again.')
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
      // REMOVED: 'Draft' status
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

  // Calculate summary stats - UPDATED: Removed draft count
  const summaryStats = useMemo(() => {
    const totalInvoices = filteredInvoices.length
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const paidCount = filteredInvoices.filter(inv => inv.status === 'Paid').length
    const finalizedCount = filteredInvoices.filter(inv => inv.status === 'Finalized').length
    const voidCount = filteredInvoices.filter(inv => inv.status === 'Void').length

    return { totalInvoices, totalAmount, paidCount, finalizedCount, voidCount }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage customer invoices and sales</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefreshData}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <Link
            to="/invoices/new"
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Summary Stats - UPDATED: Removed draft count */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{summaryStats.totalInvoices}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Finalized</div>
          <div className="text-2xl font-bold text-blue-600">{summaryStats.finalizedCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-600">{summaryStats.paidCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Void</div>
          <div className="text-2xl font-bold text-red-600">{summaryStats.voidCount}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Status Filter - UPDATED: Removed 'Draft' option */}
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
                <option key={buyer.id} value={buyer.buyerName}>
                  {buyer.buyerName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions Bar - UPDATED: Removed bulk delete */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {filteredInvoices.length} invoices
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleExportInvoices}
              className="btn btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter || buyerFilter
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first invoice.'
              }
            </p>
            <Link
              to="/invoices/new"
              className="btn btn-primary"
            >
              Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* REMOVED: Select All checkbox */}
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
                    Amount {getSortIcon('totalAmount')}
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
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      {/* REMOVED: Select checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.buyer}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatDate(invoice.invoiceDate)}
                        </span>
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
                          {/* REMOVED: Edit links */}
                          {/* ADD: Void button for Finalized/Paid invoices */}
                          {(invoice.status === 'Finalized' || invoice.status === 'Paid') && (
                            <button
                              onClick={() => {
                                setVoidInvoiceId(invoice.id)
                                setShowVoidModal(true)
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Void Invoice"
                            >
                              ❌
                            </button>
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

      {/* Void Confirmation Modal - NEW */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Void Invoice
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to void this invoice? This will create 
                  offsetting transactions and restore inventory levels. This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleVoidInvoice}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Void Invoice
                </button>
                <button
                  onClick={() => {
                    setShowVoidModal(false)
                    setVoidInvoiceId(null)
                  }}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceList