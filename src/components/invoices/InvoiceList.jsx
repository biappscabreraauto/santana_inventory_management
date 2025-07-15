import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2,
  Download,
  Calendar,
  DollarSign,
  User,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

const InvoiceList = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  // State
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [sortBy, setSortBy] = useState('invoiceDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)

  // Status options for filtering
  const statusOptions = ['All', 'Draft', 'Finalized', 'Paid', 'Void']
  const dateRangeOptions = [
    'All',
    'Today',
    'This Week',
    'This Month',
    'Last 30 Days',
    'This Quarter',
    'This Year'
  ]

  // Load invoices on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadInvoices()
    }
  }, [isAuthenticated])

  // Apply filters and search when dependencies change
  useEffect(() => {
    applyFiltersAndSearch()
  }, [invoices, searchTerm, statusFilter, dateFilter, sortBy, sortOrder])

  /**
   * Load all invoices from SharePoint
   */
  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await sharePointService.getInvoices({
        expand: ['Buyer'],
        orderBy: 'Created desc',
        top: 1000
      })
      
      // Transform the data to match our component structure
      const transformedInvoices = response.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber, // Use transformed property
        buyer: invoice.buyer, // Use transformed property  
        buyerId: invoice.buyerId, // Use transformed property
        invoiceDate: new Date(invoice.invoiceDate),
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        createdBy: invoice.createdBy,
        createdDate: new Date(invoice.created),
        modifiedDate: new Date(invoice.modified)
      }))

      setInvoices(transformedInvoices)
    } catch (error) {
      console.error('Error loading invoices:', error)
      showToast('Failed to load invoices. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Apply search and filter logic
   */
  const applyFiltersAndSearch = () => {
    let filtered = [...invoices]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.buyer.toLowerCase().includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'All') {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(startOfDay)
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

      filtered = filtered.filter(invoice => {
        const invoiceDate = invoice.invoiceDate
        switch (dateFilter) {
          case 'Today':
            return invoiceDate >= startOfDay
          case 'This Week':
            return invoiceDate >= startOfWeek
          case 'This Month':
            return invoiceDate >= startOfMonth
          case 'Last 30 Days':
            return invoiceDate >= thirtyDaysAgo
          case 'This Quarter':
            return invoiceDate >= startOfQuarter
          case 'This Year':
            return invoiceDate >= startOfYear
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'invoiceNumber':
          aValue = a.invoiceNumber
          bValue = b.invoiceNumber
          break
        case 'buyer':
          aValue = a.buyer
          bValue = b.buyer
          break
        case 'totalAmount':
          aValue = a.totalAmount
          bValue = b.totalAmount
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'invoiceDate':
        default:
          aValue = a.invoiceDate
          bValue = b.invoiceDate
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredInvoices(filtered)
  }

  /**
   * Handle sort changes
   */
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  /**
   * Handle invoice deletion
   */
  const handleDeleteInvoice = async (invoice) => {
    try {
      await sharePointService.deleteInvoice(invoice.id)
      showToast(`Invoice ${invoice.invoiceNumber} deleted successfully`, 'success')
      loadInvoices() // Reload the list
      setDeleteModalOpen(false)
      setInvoiceToDelete(null)
    } catch (error) {
      console.error('Error deleting invoice:', error)
      showToast('Failed to delete invoice. Please try again.', 'error')
    }
  }

  /**
   * Format currency values
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  /**
   * Format dates
   */
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    switch (status) {
      case 'Draft':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'Finalized':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'Paid':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'Void':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  /**
   * Calculate summary statistics
   */
  const getSummaryStats = () => {
    const totalInvoices = filteredInvoices.length
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const draftCount = filteredInvoices.filter(inv => inv.status === 'Draft').length
    const paidCount = filteredInvoices.filter(inv => inv.status === 'Paid').length

    return { totalInvoices, totalAmount, draftCount, paidCount }
  }

  const stats = getSummaryStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer invoices and sales transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate('/invoices/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalInvoices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalAmount)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Edit3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Draft Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.draftCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Paid Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.paidCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {dateRangeOptions.map(range => (
                  <option key={range} value={range}>
                    {range === 'All' ? 'All Dates' : range}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="invoiceDate-desc">Newest First</option>
                <option value="invoiceDate-asc">Oldest First</option>
                <option value="invoiceNumber-asc">Invoice # A-Z</option>
                <option value="invoiceNumber-desc">Invoice # Z-A</option>
                <option value="buyer-asc">Buyer A-Z</option>
                <option value="buyer-desc">Buyer Z-A</option>
                <option value="totalAmount-desc">Highest Amount</option>
                <option value="totalAmount-asc">Lowest Amount</option>
                <option value="status-asc">Status A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'All' || dateFilter !== 'All'
                  ? 'No invoices match your current filters.'
                  : 'Get started by creating your first invoice.'
                }
              </p>
              {(!searchTerm && statusFilter === 'All' && dateFilter === 'All') && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/invoices/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('invoiceNumber')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Invoice #
                      {sortBy === 'invoiceNumber' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('buyer')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Buyer
                      {sortBy === 'buyer' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('invoiceDate')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Date
                      {sortBy === 'invoiceDate' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('totalAmount')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Total Amount
                      {sortBy === 'totalAmount' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Status
                      {sortBy === 'status' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {invoice.buyer}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {formatDate(invoice.invoiceDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {invoice.status === 'Draft' && (
                            <Link
                              to={`/invoices/${invoice.id}/edit`}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Edit Invoice"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setInvoiceToDelete(invoice)
                              setDeleteModalOpen(true)
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && invoiceToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Invoice
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete invoice{' '}
                  <span className="font-medium">{invoiceToDelete.invoiceNumber}</span>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false)
                      setInvoiceToDelete(null)
                    }}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoiceToDelete)}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
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