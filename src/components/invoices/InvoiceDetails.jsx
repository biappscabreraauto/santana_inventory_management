import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Printer,
  Calendar,
  User,
  DollarSign,
  Package,
  Hash
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

const InvoiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessToken } = useAuth()
  
  // FIXED: Hooks called at component level only
  const { success, error, warning } = useToast()

  // State
  const [invoice, setInvoice] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load invoice data on component mount
  useEffect(() => {
    if (id) {
      loadInvoiceData()
    }
  }, [id])

  /**
   * Load complete invoice data including line items and transactions
   * FIXED: Proper access token handling without hook calls in async functions
   */
  const loadInvoiceData = async () => {
    try {
      setLoading(true)
      
      // FIXED: Get access token from auth hook (not service)
      const accessToken = await getAccessToken()
      
      // Load invoice with buyer information
      const invoiceData = await sharePointService.getInvoice(accessToken, id)

      if (!invoiceData) {
        setInvoice(null)
        setLoading(false)
        return
      }

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
        created: new Date(invoiceData.created),
        modified: new Date(invoiceData.modified || invoiceData.created)
      }

      setInvoice(transformedInvoice)

      // Load related transactions (line items)
      await loadInvoiceTransactions(accessToken, id)

    } catch (err) {
      console.error('Error loading invoice:', err)
      
      // FIXED: Error handling without hook calls in catch blocks
      if (err.message.includes('not found') || err.message.includes('404')) {
        setInvoice(null) // This will trigger the "Invoice not found" UI
      } else {
        // Error is already destructured at component level
        error('Failed to load invoice details')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load invoice transactions (line items)
   */
  const loadInvoiceTransactions = async (accessToken, invoiceId) => {
    try {
      // Get transactions for this invoice
      const transactionsData = await sharePointService.getTransactions(accessToken, {
        filter: `fields/Invoice eq '${invoiceId}'`,
        orderBy: 'fields/Created asc'
      })

      // Transform to line items
      const items = transactionsData.map(transaction => ({
        id: transaction.id,
        partId: transaction.partId,
        quantity: transaction.quantity,
        unitPrice: transaction.unitPrice || 0,
        total: transaction.quantity * (transaction.unitPrice || 0),
        notes: transaction.notes,
        createdDate: new Date(transaction.created)
      }))

      setLineItems(items)
      setTransactions(transactionsData)

      // Load part details for each line item
      await loadPartDetails(accessToken, items)

    } catch (err) {
      console.error('Error loading invoice transactions:', err)
      warning('Could not load invoice line items')
    }
  }

  /**
   * Load part details for line items
   */
  const loadPartDetails = async (accessToken, items) => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const parts = await sharePointService.getParts(accessToken, {
              filter: `fields/Title eq '${item.partId}'`,
              top: 1
            })
            
            if (parts.length > 0) {
              const part = parts[0]
              return {
                ...item,
                partDescription: part.description,
                category: part.category,
                currentInventory: part.inventoryOnHand
              }
            }
            return item
          } catch (err) {
            console.error(`Error loading part ${item.partId}:`, err)
            return item
          }
        })
      )

      setLineItems(updatedItems)
    } catch (err) {
      console.error('Error loading part details:', err)
    }
  }

  /**
   * Handle invoice deletion
   */
  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      const accessToken = await getAccessToken()
      await sharePointService.deleteInvoice(accessToken, id)
      
      success('Invoice deleted successfully')
      navigate('/invoices')
      
    } catch (err) {
      console.error('Error deleting invoice:', err)
      error('Failed to delete invoice. Please try again.')
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
      const accessToken = await getAccessToken()
      await sharePointService.updateInvoice(accessToken, id, { status: newStatus })
      
      setInvoice(prev => ({
        ...prev,
        status: newStatus
      }))
      
      success(`Invoice marked as ${newStatus}`)
    } catch (err) {
      console.error('Error updating invoice status:', err)
      error('Failed to update invoice status')
    }
  }

  /**
   * Handle print invoice
   */
  const handlePrint = () => {
    window.print()
  }

  /**
   * Format currency for display
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  // =================================================================
  // INVOICE NOT FOUND STATE
  // =================================================================
  if (!invoice) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested invoice could not be found.
          </p>
          <div className="mt-6">
            <Link
              to="/invoices"
              className="btn btn-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/invoices"
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600">
              Created {formatDate(invoice.created)}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/invoices/${id}/edit`}
            className="btn btn-secondary"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Invoice Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Invoice Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Hash className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Number:</span>
                <span className="text-sm font-medium ml-2">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium ml-2">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-medium ml-2">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Buyer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium">{invoice.buyer.name}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
            <div className="space-y-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                invoice.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                invoice.status === 'Finalized' ? 'bg-blue-100 text-blue-800' :
                invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No line items</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This invoice doesn't have any line items yet.
                    </p>
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/parts/${item.partId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {item.partId}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.partDescription || 'No description'}</div>
                      {item.category && (
                        <div className="text-xs text-gray-500">{item.category}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                  Delete Invoice
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete invoice {invoice.invoiceNumber}? 
                  This action cannot be undone.
                </p>
              </div>
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
                    'Delete Invoice'
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
      )}
    </div>
  )
}

export default InvoiceDetails