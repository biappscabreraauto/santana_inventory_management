import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft, 
  Printer,
  Calendar,
  User,
  DollarSign,
  Package,
  Hash,
  AlertTriangle,
  Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

const InvoiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessToken } = useAuth()
  const { success, error, warning } = useToast()

  // Role-based access control
  const { 
    canAccess, 
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

  // State
  const [invoice, setInvoice] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voiding, setVoiding] = useState(false)

  // Load invoice data on component mount
  useEffect(() => {
    if (id) {
      loadInvoiceData()
    }
  }, [id])

  /**
   * Load complete invoice data including line items
   */
  const loadInvoiceData = async () => {
    try {
      setLoading(true)
      const accessToken = await getAccessToken()
      
      // Load invoice details
      let invoiceData
      
      // Check if id is a SharePoint item ID (number) or invoice number (string)
      if (/^\d+$/.test(id)) {
        // It's a SharePoint item ID
        invoiceData = await sharePointService.getInvoiceById(accessToken, id)
      } else {
        // It's an invoice number
        invoiceData = await sharePointService.getInvoiceByNumber(accessToken, id)
      }

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
      await loadInvoiceTransactions(accessToken, invoiceData.invoiceNumber || invoiceData.id)

    } catch (err) {
      console.error('Error loading invoice:', err)
      
      if (err.message.includes('not found') || err.message.includes('404')) {
        setInvoice(null)
      } else {
        error('Failed to load invoice details')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load invoice transactions (line items)
   */
  const loadInvoiceTransactions = async (accessToken, invoiceRef) => {
    try {
      // Get transactions for this invoice
      const transactionsData = await sharePointService.getTransactions(accessToken, {
        filter: `fields/Invoice eq '${invoiceRef}'`,
        orderBy: 'fields/Created asc'
      })

      // Transform to line items - FIXED: Include movementType for proper identification
      const items = transactionsData.map(transaction => ({
        id: transaction.id,
        partId: transaction.partId,
        quantity: transaction.quantity,
        unitPrice: transaction.unitPrice || 0,
        total: transaction.quantity * (transaction.unitPrice || 0),
        notes: transaction.notes || '',
        movementType: transaction.movementType, // Include transaction type
        isVoidAdjustment: transaction.movementType === 'Void adjustment' // Flag for styling
      }))

      setLineItems(items)

    } catch (err) {
      console.error('Error loading transactions:', err)
      // Don't show error for missing transactions - they might not exist yet
    }
  }

  /**
   * Handle void invoice - RBAC Protected
   */
  const handleVoidInvoice = async () => {
    // Check permissions before proceeding
    if (!canVoid) {
      error('You do not have permission to void invoices.')
      return
    }

    if (!invoice || invoice.status !== 'Finalized') {
      error('Only finalized invoices can be voided.')
      return
    }

    try {
      setVoiding(true)
      const accessToken = await getAccessToken()
      
      // Call the void service
      await sharePointService.voidInvoice(accessToken, invoice.id)
      
      // Update local state
      setInvoice(prev => ({
        ...prev,
        status: 'Void'
      }))
      
      success('Invoice voided successfully! Inventory has been restored.')
      setShowVoidModal(false)
      
      // Reload the invoice data to get void transactions
      await loadInvoiceData()
      
    } catch (err) {
      console.error('Error voiding invoice:', err)
      error('Failed to void invoice. Please try again.')
    } finally {
      setVoiding(false)
    }
  }

  /**
   * Handle print invoice - Available to all users
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
          <div className="mt-4">
            <Link
              to="/invoices"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Invoices
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header with Role Badge and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link
                to="/invoices"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Invoice {invoice.invoiceNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  Created on {formatDate(invoice.created)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Role Badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {userRole} Access
            </span>

            {/* Status Badge */}
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              invoice.status === 'Finalized' ? 'bg-green-100 text-green-800' :
              invoice.status === 'Void' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {invoice.status}
            </span>

            {/* Action Buttons - RBAC Protected */}
            <button
              onClick={handlePrint}
              className="btn btn-outline flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>

            {/* Void Button - Admin Only */}
            {invoice.status === 'Finalized' && (
              <RoleProtected requiredRole="Admin" fallback={
                <div className="relative group">
                  <button
                    disabled
                    className="btn btn-danger flex items-center opacity-50 cursor-not-allowed"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Void Invoice
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Admin permission required
                  </div>
                </div>
              }>
                <button
                  onClick={() => setShowVoidModal(true)}
                  className="btn btn-danger flex items-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Void Invoice
                </button>
              </RoleProtected>
            )}
          </div>
        </div>
      </div>

      {/* Permission Info for ReadOnly Users */}
      {isReadOnly && invoice.status === 'Finalized' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-blue-800 font-medium">Read-Only Access</h3>
              <p className="text-blue-700 text-sm mt-1">
                You can view and print this invoice, but cannot void it. 
                Only administrators can void finalized invoices.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Void Status Notice */}
      {invoice.status === 'Void' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Voided Invoice</h3>
              <p className="text-red-700 text-sm mt-1">
                This invoice has been voided. Inventory adjustments have been created to restore stock levels.
                Voided transactions are shown with red highlighting below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Hash className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Invoice Number</p>
              <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Buyer</p>
              <p className="text-lg font-semibold text-gray-900">{invoice.buyer.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Invoice Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <div className="flex items-center space-x-2">
              {/* Line items count */}
              <span className="text-sm text-gray-500">
                {lineItems.filter(item => !item.isVoidAdjustment).length} items
                {lineItems.some(item => item.isVoidAdjustment) && (
                  <span className="text-red-600 ml-1">
                    (+{lineItems.filter(item => item.isVoidAdjustment).length} void adjustments)
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* Legend for voided items */}
          {lineItems.some(item => item.isVoidAdjustment) && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="inline-block w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></span>
              Items with red background represent void adjustments that restored inventory.
            </p>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part ID
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
                  <tr 
                    key={item.id} 
                    className={item.isVoidAdjustment ? "bg-red-50 border-l-4 border-red-200" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Link
                          to={`/parts/${item.partId}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {item.partId}
                        </Link>
                        {/* Visual indicator for void adjustments */}
                        {item.isVoidAdjustment && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            VOIDED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.partDescription || 'No description'}</div>
                      {item.category && (
                        <div className="text-xs text-gray-500">{item.category}</div>
                      )}
                      {/* Show movement type for clarity */}
                      {item.isVoidAdjustment && (
                        <div className="text-xs text-red-600 font-medium">Void Adjustment</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* Show negative quantity for void adjustments */}
                      <span className={item.isVoidAdjustment ? "text-red-600" : ""}>
                        {item.isVoidAdjustment ? `+${item.quantity}` : item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={item.isVoidAdjustment ? "text-red-600" : ""}>
                        {formatCurrency(item.unitPrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {/* Show negative total for void adjustments */}
                      <span className={item.isVoidAdjustment ? "text-red-600" : ""}>
                        {item.isVoidAdjustment ? `-${formatCurrency(item.total)}` : formatCurrency(item.total)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      {invoice.notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Void Confirmation Modal - Admin Only */}
      {showVoidModal && canVoid && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Void Invoice
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-3">
                  Are you sure you want to void invoice <strong>{invoice.invoiceNumber}</strong>? 
                  This will create offsetting transactions and restore inventory levels.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Administrator Action:</strong> This operation requires Admin permissions 
                    and cannot be undone. Inventory will be restored automatically.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-xs text-red-800">
                    <strong>Warning:</strong> This action is permanent and will affect inventory levels.
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleVoidInvoice}
                  disabled={voiding}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {voiding ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Voiding Invoice...
                    </div>
                  ) : (
                    'Void Invoice'
                  )}
                </button>
                <button
                  onClick={() => setShowVoidModal(false)}
                  disabled={voiding}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
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