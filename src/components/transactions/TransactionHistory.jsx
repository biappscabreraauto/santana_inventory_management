// =================================================================
// REVISED TRANSACTION HISTORY - SIMPLIFIED WITHOUT SUMMARIES
// =================================================================
// Component for viewing all inventory transactions with proper cost/price display
// Shows unit cost for inbound, unit price for outbound

import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useTransactions } from '../../hooks/useSharePoint'
import { exportTransactionsToCSV } from '../../utils/csvExport'

const TransactionHistory = () => {
  const { success, showError, warning } = useToast()
  const { transactions, loading, error, refreshTransactions } = useTransactions()

  // =================================================================
  // LOCAL STATE FOR FILTERING
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'created', direction: 'desc' })

  // =================================================================
  // FILTERING AND SORTING
  // =================================================================
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.partId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.invoice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.buyer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesMovementType = movementTypeFilter === '' || 
        transaction.movementType === movementTypeFilter
      
      let matchesDate = true
      if (dateFilter) {
        const transactionDate = new Date(transaction.created).toISOString().split('T')[0]
        matchesDate = transactionDate === dateFilter
      }
      
      return matchesSearch && matchesMovementType && matchesDate
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (sortConfig.key === 'created') {
          const aDate = new Date(aValue).getTime()
          const bDate = new Date(bValue).getTime()
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [transactions, searchTerm, movementTypeFilter, dateFilter, sortConfig])

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleExportTransactions = () => {
    try {
      if (filteredTransactions.length === 0) {
        warning('No transactions to export')
        return
      }
      
      exportTransactionsToCSV(filteredTransactions, 'transactions-export')
      success(`Exported ${filteredTransactions.length} transactions to CSV`)
    } catch (err) {
      console.error('Export error:', err)
      showError('Failed to export transactions')
    }
  }

  const handleRefreshData = () => {
    refreshTransactions()
    info('Transaction data refreshed!')
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setMovementTypeFilter('')
    setDateFilter('')
    setSortConfig({ key: 'created', direction: 'desc' })
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================

  // Helper function to determine if a movement type increases inventory
  const isInventoryIncrease = (movementType) => {
    return movementType?.includes('In') || 
          movementType === 'Adjustment' || 
          movementType === 'Void adjustment';
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

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

  const getTransactionTotal = (transaction) => {
    if (isInventoryIncrease(transaction.movementType)) {
      const cost = transaction.unitCost || 0
      return transaction.quantity * cost
    } else if (transaction.movementType?.includes('Out')) {
      const price = transaction.unitPrice || 0
      return transaction.quantity * price
    }
    return 0
  }

  const getUnitValue = (transaction) => {
    if (isInventoryIncrease(transaction.movementType)) {
      return transaction.unitCost || 0
    } else if (transaction.movementType?.includes('Out')) {
      return transaction.unitPrice || 0
    }
    return 0
  }

  const getUnitValueLabel = (transaction) => {
    if (isInventoryIncrease(transaction.movementType)) {
      return 'Unit Cost'
    } else if (transaction.movementType?.includes('Out')) {
      return 'Unit Price'
    }
    return ''
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    )
  }

  // =================================================================
  // ERROR STATE
  // =================================================================
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefreshData}
            className="btn btn-primary"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="space-y-6">
      {/* Header - SIMPLIFIED */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
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
            onClick={handleExportTransactions}
            className="btn btn-secondary"
          >
            📊 Export
          </button>
          
          <Link to="/transactions/new" className="btn btn-primary">
            📦 Log New Transaction
          </Link>
        </div>
      </div>

      {/* Filters - KEPT AS IS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by part, supplier, invoice, etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* Movement Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type
            </label>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="In (Received)">In (Received)</option>
              <option value="Out (Sold)">Out (Sold)</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Void adjustment">Void adjustment</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearAllFilters}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table - REVISED COLUMN HEADERS AND CONTENT */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || movementTypeFilter || dateFilter
                ? 'Try adjusting your search criteria.'
                : 'Get started by logging your first transaction.'
              }
            </p>
            <Link to="/transactions/new" className="btn btn-primary">
              Log First Transaction
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created')}
                  >
                    Date {getSortIcon('created')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('partId')}
                  >
                    Part {getSortIcon('partId')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('movementType')}
                  >
                    Type {getSortIcon('movementType')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity {getSortIcon('quantity')}
                  </th>
                  {/* REVISED: Dynamic column header */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Value
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/parts?search=${transaction.partId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {transaction.partId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isInventoryIncrease(transaction.movementType) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.movementType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={isInventoryIncrease(transaction.movementType) ? 'text-green-600' : 'text-red-600'}>
                        {isInventoryIncrease(transaction.movementType) ? '+' : '-'}{transaction.quantity}
                      </span>
                    </td>
                    {/* REVISED: Show appropriate unit value with label */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatCurrency(getUnitValue(transaction))}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getUnitValueLabel(transaction)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(getTransactionTotal(transaction))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.invoice && (
                        <Link 
                          to={`/invoices/${transaction.invoice}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {transaction.invoice}
                        </Link>
                      )}
                      {!transaction.invoice && transaction.supplier && (
                        <span className="text-gray-600">{transaction.supplier}</span>
                      )}
                      {!transaction.invoice && !transaction.supplier && (
                        <span className="text-gray-400">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.createdBy || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Summary - KEPT AS IS */}
      {(searchTerm || movementTypeFilter || dateFilter) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-blue-800 text-sm">
              <span className="font-medium">Active filters:</span> {' '}
              {searchTerm && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-2">Search: {searchTerm}</span>}
              {movementTypeFilter && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-2">Type: {movementTypeFilter}</span>}
              {dateFilter && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-2">Date: {dateFilter}</span>}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory