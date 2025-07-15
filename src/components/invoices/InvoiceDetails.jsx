import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Download, 
  Printer,
  Send,
  CheckCircle,
  X,
  Calendar,
  User,
  DollarSign,
  Package,
  Hash,
  Clock,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

const InvoiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  // State
  const [invoice, setInvoice] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('invoice')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load invoice data on component mount
  useEffect(() => {
    if (isAuthenticated && id) {
      loadInvoiceData()
    }
  }, [isAuthenticated, id])

  /**
   * Load complete invoice data including line items and transactions
   */
  const loadInvoiceData = async () => {
    try {
      setLoading(true)
      
      // Load invoice with buyer information
      const invoiceData = await sharePointService.getInvoice(id, {
        expand: ['Buyer']
      })

      // Transform invoice data
      const transformedInvoice = {
        id: invoiceData.id,
        invoiceNumber: invoiceData.invoiceNumber,
        buyer: {
          name: invoiceData.buyer || 'Unknown Buyer',
          id: invoiceData.buyerId
        },
        invoiceDate: new Date(invoiceData.invoiceDate),
        totalAmount: invoiceData.totalAmount || 0,
        status: invoiceData.status || 'Draft',
        notes: invoiceData.notes || '',
        createdBy: invoiceData.createdBy,
        createdDate: new Date(invoiceData.created),
        modifiedBy: invoiceData.modifiedBy,
        modifiedDate: new Date(invoiceData.modified)
      }

      setInvoice(transformedInvoice)

      // Load buyer details if available
      if (transformedInvoice.buyer.id) {
        await loadBuyerDetails(transformedInvoice.buyer.id)
      }

      // Load related transactions (line items)
      await loadInvoiceTransactions(invoiceData.fields.Title)

    } catch (error) {
      console.error('Error loading invoice:', error)
      showToast('Failed to load invoice details', 'error')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load buyer details
   */
  const loadBuyerDetails = async (buyerId) => {
    try {
      const buyerData = await sharePointService.getBuyer(buyerId)
      
      setInvoice(prev => ({
        ...prev,
        buyer: {
          ...prev.buyer,
          contactEmail: buyerData.contactEmail,
          phone: buyerData.phone
        }
      }))
    } catch (error) {
      console.error('Error loading buyer details:', error)
    }
  }

  /**
   * Load transactions related to this invoice
   */
  const loadInvoiceTransactions = async (invoiceNumber) => {
    try {
      const transactionsData = await sharePointService.getTransactions({
        filter: `fields/Invoice eq '${invoiceNumber}'`,
        expand: ['Part'],
        orderBy: 'Created asc'
      })

      // Transform transaction data to line items
      const items = transactionsData.map(transaction => ({
        id: transaction.id,
        partId: transaction.partId || 'Unknown Part',
        partDescription: '', // Will be loaded separately if needed
        quantity: transaction.quantity,
        unitPrice: transaction.unitPrice || 0,
        total: transaction.quantity * (transaction.unitPrice || 0),
        notes: transaction.notes,
        createdDate: new Date(transaction.created)
      }))

      setLineItems(items)
      setTransactions(transactionsData)

      // Load part details for each line item
      await loadPartDetails(items)

    } catch (error) {
      console.error('Error loading invoice transactions:', error)
      showToast('Failed to load invoice line items', 'error')
    }
  }

  /**
   * Load part details for line items
   */
  const loadPartDetails = async (items) => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const parts = await sharePointService.getParts({
              filter: `fields/Title eq '${item.partId}'`,
              top: 1
            })
            
            if (parts.length > 0) {
              const part = parts[0]
              return {
                ...item,
                partDescription: part.fields.Description,
                category: part.fields.Category?.lookupValue,
                currentInventory: part.fields.InventoryOnHand
              }
            }
            return item
          } catch (error) {
            console.error(`Error loading part ${item.partId}:`, error)
            return item
          }
        })
      )

      setLineItems(updatedItems)
    } catch (error) {
      console.error('Error loading part details:', error)
    }
  }

  /**
   * Handle invoice deletion
   */
  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      await sharePointService.deleteInvoice(id)
      showToast('Invoice deleted successfully', 'success')
      navigate('/invoices')
      
    } catch (error) {
      console.error('Error deleting invoice:', error)
      showToast('Failed to delete invoice. Please try again.', 'error')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  /**
   * Handle status updates
   */
  const handleStatusUpdate = async (newStatus) => {
    try {
      await sharePointService.updateInvoice(id, { Status: newStatus })
      
      setInvoice(prev => ({
        ...prev,
        status: newStatus
      }))
      
      showToast(`Invoice marked as ${newStatus}`, 'success')
    } catch (error) {
      console.error('Error updating invoice status:', error)
      showToast('Failed to update invoice status', 'error')
    }
  }

  /**
   * Handle print invoice
   */
  const handlePrint = () => {
    window.print()
  }

  /**
   * Handle export invoice
   */
  const handleExport = () => {
    showToast('Export functionality coming soon!', 'info')
  }

  /**
   * Copy invoice number to clipboard
   */
  const copyInvoiceNumber = async () => {
    try {
      await navigator.clipboard.writeText(invoice.invoiceNumber)
      showToast('Invoice number copied to clipboard', 'success')
    } catch (error) {
      showToast('Failed to copy invoice number', 'error')
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
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
    
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
   * Calculate totals
   */
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = 0 // No tax calculation for now
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested invoice could not be found.</p>
        <div className="mt-6">
          <Link
            to="/invoices"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Invoice Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View invoice information and transaction history
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          {invoice.status === 'Draft' && (
            <Link
              to={`/invoices/${id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 no-print">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoice'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Invoice
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔄 Transactions ({transactions.length})
          </button>
        </nav>
      </div>

      {/* Invoice Tab */}
      {activeTab === 'invoice' && (
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Hash className="h-5 w-5 text-blue-600" />
                    {invoice.invoiceNumber}
                    <button
                      onClick={copyInvoiceNumber}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      title="Copy invoice number"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </h2>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(invoice.invoiceDate)}
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {invoice.createdBy}
                    </span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className={getStatusBadge(invoice.status)}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buyer Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Bill To</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">
                        {invoice.buyer.name}
                      </div>
                      {invoice.buyer.contactEmail && (
                        <div className="text-sm text-gray-600">
                          📧 {invoice.buyer.contactEmail}
                        </div>
                      )}
                      {invoice.buyer.phone && (
                        <div className="text-sm text-gray-600">
                          📞 {invoice.buyer.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Invoice Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-600">Items:</dt>
                        <dd className="font-medium">{lineItems.length}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-600">Subtotal:</dt>
                        <dd className="font-medium">{formatCurrency(totals.subtotal)}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-600">Tax:</dt>
                        <dd className="font-medium">{formatCurrency(totals.tax)}</dd>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between">
                          <dt className="text-base font-medium text-gray-900">Total:</dt>
                          <dd className="text-lg font-bold text-gray-900">
                            {formatCurrency(totals.total)}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            </div>
            <div className="overflow-x-auto">
              {lineItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No line items</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No items found for this invoice.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Part
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider no-print">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {item.partId}
                            </div>
                            {item.partDescription && (
                              <div className="text-sm text-gray-500">
                                {item.partDescription}
                              </div>
                            )}
                            {item.category && (
                              <div className="text-xs text-gray-400">
                                {item.category}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(item.total)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center no-print">
                          <Link
                            to={`/parts?search=${item.partId}`}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="View Part"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {invoice.notes}
              </div>
            </div>
          )}

          {/* Status Actions */}
          {invoice.status !== 'Void' && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 no-print">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h3>
              <div className="flex flex-wrap gap-3">
                {invoice.status === 'Finalized' && (
                  <button
                    onClick={() => handleStatusUpdate('Paid')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </button>
                )}
                
                {(invoice.status === 'Draft' || invoice.status === 'Finalized') && (
                  <button
                    onClick={() => handleStatusUpdate('Void')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Void Invoice
                  </button>
                )}

                {invoice.status === 'Draft' && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Invoice
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Audit Information */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Created:</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDateTime(invoice.createdDate)} by {invoice.createdBy}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Last Modified:</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDateTime(invoice.modifiedDate)} by {invoice.modifiedBy}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Related Transactions</h3>
            <div className="text-sm text-gray-500">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">
                No transactions have been created for this invoice yet.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Part
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(new Date(transaction.createdDateTime))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.fields.Part?.lookupValue}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out (Sold)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          -{transaction.fields.Quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(transaction.fields.UnitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.fields.Quantity * transaction.fields.UnitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            to={`/parts?search=${transaction.fields.Part?.lookupValue}`}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="View Part"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                  <span className="font-medium">{invoice.invoiceNumber}</span>?
                  This action cannot be undone.
                </p>
                {invoice.status === 'Finalized' && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Warning: This invoice has been finalized and may have associated transactions.
                    </p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {deleting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Delete'
                    )}
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

export default InvoiceDetails