import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { exportInvoicesToCSV } from '../../utils/csvExport'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'

// Import SharePoint hooks - UPDATED: Removed delete methods
import { useInvoices, useBuyers } from '../../hooks/useSharePoint'

// Icons
import { Plus, Search, Filter, MoreVertical, Download, RefreshCw, AlertTriangle, Eye } from 'lucide-react'

// =================================================================
// INVOICE LIST COMPONENT - UPDATED: Removed edit/delete, added void, RBAC
// =================================================================
const InvoiceList = () => {
  const { success, error, info } = useToast()
  
  // Role-based access control
  const { 
    canAccess, 
    canCreate, 
    canVoid, 
    canExport,
    isReadOnly, 
    isUser, 
    isAdmin,
    userRole 
  } = useRoleAccess('ReadOnly') // Minimum ReadOnly access required

  // Early return if no access
  if (!canAccess) {
    return <RoleProtected requiredRole="ReadOnly" />
  }
  
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
  // EVENT HANDLERS - RBAC Protected
  // =================================================================
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleVoidInvoice = async () => {
    // Only Admin can void invoices
    if (!canVoid) {
      error('You do not have permission to void invoices.');
      return;
    }

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
    // Check export permissions
    if (!canExport) {
      error('You do not have permission to export data.');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Invoice Number', 'Buyer', 'Date', 'Status', 'Total Amount', 'Notes']
      const csvContent = [
        headers.join(','),
        ...filteredInvoices.map(invoice => [
          `"${invoice.invoiceNumber}"`,
          `"${invoice.buyer}"`,
          `"${formatDate(invoice.invoiceDate)}"`,
          `"${invoice.status}"`,
          invoice.totalAmount,
          `"${(invoice.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      success('Invoices exported successfully!')
    } catch (err) {
      console.error('Export failed:', err)
      error('Failed to export invoices')
    }
  }

  const handleRefreshData = () => {
    refreshInvoices()
    success('Invoice data refreshed!')
  }

  const handleVoidClick = (invoiceId) => {
    if (!canVoid) {
      error('You do not have permission to void invoices.');
      return;
    }
    setVoidInvoiceId(invoiceId)
    setShowVoidModal(true)
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  const getStatusBadge = (status) => {
    const statusConfig = {
      // REMOVED: 'Draft' status
      'Finalized': { text: 'Finalized', color: 'bg-blue-100 text-blue-800' },
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
    const finalizedCount = filteredInvoices.filter(inv => inv.status === 'Finalized').length
    const voidCount = filteredInvoices.filter(inv => inv.status === 'Void').length

    return { totalInvoices, totalAmount, finalizedCount, voidCount }
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
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <Link
                to="/invoices/new"
                className="btn btn-secondary"
              >
                Create Invoice Anyway
              </Link>
            </RoleProtected>
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
      {/* Header with Role Badge */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage customer invoices and sales</p>
        </div>
        <div className="flex items-center space-x-3">
          
          {/* Action Buttons - RBAC Protected */}
          <button
            onClick={handleRefreshData}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          
          <RoleProtected requiredRole="User" hideIfUnauthorized>
            <Link
              to="/invoices/new"
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </RoleProtected>
          
          {/* Show disabled create button for ReadOnly with tooltip */}
          {isReadOnly && (
            <div className="relative group">
              <button
                disabled
                className="btn btn-primary flex items-center opacity-50 cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Requires User permission
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permission Info for ReadOnly Users */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-blue-800 font-medium">Read-Only Access</h3>
              <p className="text-blue-700 text-sm mt-1">
                You can view and search invoices, but cannot create new invoices or void existing ones. 
                Contact your administrator for User permissions.
              </p>
            </div>
          </div>
        </div>
      )}

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
          <div className="text-sm font-medium text-gray-500 mb-1">Void</div>
          <div className="text-2xl font-bold text-red-600">{summaryStats.voidCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalAmount)}</div>
        </div>
      </div>

      {/* Filters Section - Available to all users */}
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

      {/* Actions Bar - RBAC Protected */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {filteredInvoices.length} invoices
            </span>
            {!canCreate && (
              <span className="text-xs text-gray-500">
                (View-only access)
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <RoleProtected requiredRole="ReadOnly" fallback={
              <button
                disabled
                className="btn btn-secondary flex items-center opacity-50 cursor-not-allowed"
                title="Export requires ReadOnly permission"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            }>
              <button
                onClick={handleExportInvoices}
                className="btn btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </RoleProtected>
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
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <Link
                to="/invoices/new"
                className="btn btn-primary"
              >
                Create First Invoice
              </Link>
            </RoleProtected>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                          {/* View Details - Available to all */}
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          {/* Void button for Finalized invoices - Admin only */}
                          {(invoice.status === 'Finalized') && (
                            <RoleProtected requiredRole="Admin" fallback={
                              <button
                                disabled
                                className="text-gray-400 cursor-not-allowed"
                                title="Void operation requires Admin permission"
                              >
                                ❌
                              </button>
                            }>
                              <button
                                onClick={() => handleVoidClick(invoice.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Void Invoice"
                              >
                                ❌
                              </button>
                            </RoleProtected>
                          )}
                          
                          {/* Show permission indicator for ReadOnly users */}
                          {isReadOnly && invoice.status === 'Finalized' && (
                            <span 
                              className="text-xs text-gray-400"
                              title="Admin permission required to void"
                            >
                              🔒
                            </span>
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

      {/* Void Confirmation Modal - Admin Only */}
      {showVoidModal && canVoid && (
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
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Admin Action:</strong> Only administrators can perform this operation.
                  </p>
                </div>
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