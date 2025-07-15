import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ArrowLeft,
  Calendar,
  User,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Search,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

const InvoiceForm = () => {
  const navigate = useNavigate()
  const { id: invoiceId } = useParams()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()

  // Determine mode
  const isEdit = Boolean(invoiceId)
  const isNew = !isEdit
  const preselectedPartId = searchParams.get('partId')

  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [buyers, setBuyers] = useState([])
  const [parts, setParts] = useState([])
  const [partSearchTerm, setPartSearchTerm] = useState('')
  const [filteredParts, setFilteredParts] = useState([])
  const [showPartDropdown, setShowPartDropdown] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    buyer: '',
    buyerId: null,
    invoiceDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    notes: ''
  })

  // Line items
  const [lineItems, setLineItems] = useState([])
  const [activeLineItemIndex, setActiveLineItemIndex] = useState(null)

  // Validation errors
  const [errors, setErrors] = useState({})

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData()
    }
  }, [isAuthenticated, invoiceId])

  // Filter parts based on search term
  useEffect(() => {
    if (partSearchTerm.trim()) {
      const filtered = parts.filter(part =>
        part.partId.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(partSearchTerm.toLowerCase())
      ).slice(0, 10) // Limit to 10 results
      setFilteredParts(filtered)
    } else {
      setFilteredParts([])
    }
  }, [partSearchTerm, parts])

  // Add preselected part if provided
  useEffect(() => {
    if (preselectedPartId && parts.length > 0 && lineItems.length === 0) {
      const preselectedPart = parts.find(p => p.partId === preselectedPartId)
      if (preselectedPart) {
        addLineItem(preselectedPart)
      }
    }
  }, [preselectedPartId, parts, lineItems.length])

  /**
   * Load initial data including buyers, parts, and existing invoice if editing
   */
  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load buyers and parts in parallel
      const [buyersResponse, partsResponse] = await Promise.all([
        sharePointService.getBuyers({ top: 1000 }),
        sharePointService.getParts({ 
          filter: "fields/Status eq 'Active'",
          top: 1000 
        })
      ])

      // Transform buyers data
      const transformedBuyers = buyersResponse.map(buyer => ({
        id: buyer.id,
        buyerName: buyer.buyerName,
        contactEmail: buyer.contactEmail,
        phone: buyer.phone
      }))

      // Transform parts data
      const transformedParts = partsResponse.map(part => ({
        id: part.id,
        partId: part.partId,
        description: part.description,
        category: part.category,
        inventoryOnHand: part.inventoryOnHand,
        unitCost: part.unitCost,
        unitPrice: part.unitPrice,
        status: part.status
      }))

      setBuyers(transformedBuyers)
      setParts(transformedParts)

      // If editing, load existing invoice
      if (isEdit && invoiceId) {
        await loadExistingInvoice(invoiceId)
      } else {
        // Generate new invoice number for new invoices
        generateInvoiceNumber()
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast('Failed to load data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load existing invoice data for editing
   */
  const loadExistingInvoice = async (id) => {
    try {
      const invoice = await sharePointService.getInvoice(id, {
        expand: ['Buyer']
      })

      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        buyer: invoice.buyer || '',
        buyerId: invoice.buyerId,
        invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
        status: invoice.status || 'Draft',
        notes: invoice.notes || ''
      })

      // Load line items (transactions) for this invoice
      await loadLineItems(id)

    } catch (error) {
      console.error('Error loading invoice:', error)
      showToast('Failed to load invoice. Please try again.', 'error')
      navigate('/invoices')
    }
  }

  /**
   * Load line items from transactions
   */
  const loadLineItems = async (invoiceId) => {
    try {
      const transactions = await sharePointService.getTransactions({
        filter: `fields/Invoice eq '${invoiceId}'`,
        expand: ['Part']
      })

      const items = transactions.map(transaction => ({
        id: transaction.id,
        partId: transaction.fields.Part?.lookupValue,
        partData: parts.find(p => p.partId === transaction.fields.Part?.lookupValue),
        quantity: transaction.fields.Quantity,
        unitPrice: transaction.fields.UnitPrice || 0,
        total: transaction.fields.Quantity * (transaction.fields.UnitPrice || 0)
      }))

      setLineItems(items)
    } catch (error) {
      console.error('Error loading line items:', error)
      showToast('Failed to load invoice items.', 'error')
    }
  }

  /**
   * Generate a new invoice number
   */
  const generateInvoiceNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
    
    const invoiceNumber = `INV-${year}${month}${day}-${time}`
    
    setFormData(prev => ({
      ...prev,
      invoiceNumber
    }))
  }

  /**
   * Handle form field changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  /**
   * Handle buyer selection
   */
  const handleBuyerChange = (buyerId) => {
    const selectedBuyer = buyers.find(b => b.id === parseInt(buyerId))
    setFormData(prev => ({
      ...prev,
      buyer: selectedBuyer?.buyerName || '',
      buyerId: selectedBuyer?.id || null
    }))
  }

  /**
   * Add a new line item
   */
  const addLineItem = (part = null) => {
    const newItem = {
      id: Date.now(), // Temporary ID for new items
      partId: part?.partId || '',
      partData: part || null,
      quantity: 1,
      unitPrice: part?.unitPrice || 0,
      total: part?.unitPrice || 0
    }

    setLineItems(prev => [...prev, newItem])
    setActiveLineItemIndex(lineItems.length)
    
    if (!part) {
      setPartSearchTerm('')
      setShowPartDropdown(true)
    }
  }

  /**
   * Update line item
   */
  const updateLineItem = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }

      // Recalculate total
      if (field === 'quantity' || field === 'unitPrice') {
        updated[index].total = updated[index].quantity * updated[index].unitPrice
      }

      return updated
    })
  }

  /**
   * Select part for line item
   */
  const selectPartForLineItem = (index, part) => {
    updateLineItem(index, 'partId', part.partId)
    updateLineItem(index, 'partData', part)
    updateLineItem(index, 'unitPrice', part.unitPrice)
    updateLineItem(index, 'total', lineItems[index]?.quantity * part.unitPrice)
    
    setShowPartDropdown(false)
    setPartSearchTerm('')
    setActiveLineItemIndex(null)
  }

  /**
   * Remove line item
   */
  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
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

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required'
    }

    if (!formData.buyerId) {
      newErrors.buyer = 'Buyer selection is required'
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required'
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required'
    }

    // Validate line items
    const lineItemErrors = lineItems.map((item, index) => {
      const itemErrors = {}
      
      if (!item.partId) {
        itemErrors.partId = 'Part selection is required'
      }
      
      if (!item.quantity || item.quantity <= 0) {
        itemErrors.quantity = 'Quantity must be greater than 0'
      }
      
      if (!item.unitPrice || item.unitPrice < 0) {
        itemErrors.unitPrice = 'Unit price must be 0 or greater'
      }

      // Check inventory availability
      if (item.partData && item.quantity > item.partData.inventoryOnHand) {
        itemErrors.quantity = `Only ${item.partData.inventoryOnHand} units available`
      }

      return Object.keys(itemErrors).length > 0 ? itemErrors : null
    })

    if (lineItemErrors.some(e => e !== null)) {
      newErrors.lineItems = lineItemErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Save invoice as draft
   */
  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors before saving.', 'error')
      return
    }

    try {
      setSaving(true)

      const invoiceData = {
        Title: formData.invoiceNumber,
        Buyer: formData.buyerId,
        InvoiceDate: new Date(formData.invoiceDate).toISOString(),
        TotalAmount: calculateTotals().total,
        Status: 'Draft',
        Notes: formData.notes
      }

      if (isEdit) {
        await sharePointService.updateInvoice(invoiceId, invoiceData)
        showToast('Invoice updated successfully', 'success')
      } else {
        const newInvoice = await sharePointService.createInvoice(invoiceData)
        showToast('Invoice saved as draft', 'success')
        navigate(`/invoices/${newInvoice.id}/edit`)
      }

    } catch (error) {
      console.error('Error saving invoice:', error)
      showToast('Failed to save invoice. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Finalize invoice and create transactions
   */
  const handleFinalize = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors before finalizing.', 'error')
      return
    }

    try {
      setFinalizing(true)

      // First, save/update the invoice with finalized status
      const invoiceData = {
        Title: formData.invoiceNumber,
        Buyer: formData.buyerId,
        InvoiceDate: new Date(formData.invoiceDate).toISOString(),
        TotalAmount: calculateTotals().total,
        Status: 'Finalized',
        Notes: formData.notes
      }

      let finalInvoiceId = invoiceId

      if (isEdit) {
        await sharePointService.updateInvoice(invoiceId, invoiceData)
      } else {
        const newInvoice = await sharePointService.createInvoice(invoiceData)
        finalInvoiceId = newInvoice.id
      }

      // Create transactions for each line item and update inventory
      for (const item of lineItems) {
        // Create transaction record
        const transactionData = {
          Part: item.partData.id, // SharePoint lookup expects the ID
          MovementType: 'Out (Sold)',
          Quantity: item.quantity,
          UnitPrice: item.unitPrice,
          Invoice: finalInvoiceId,
          Notes: `Sale via invoice ${formData.invoiceNumber}`
        }

        await sharePointService.createTransaction(transactionData)

        // Update part inventory
        const currentPart = await sharePointService.getPart(item.partData.id)
        const newInventory = Math.max(0, currentPart.fields.InventoryOnHand - item.quantity)
        
        await sharePointService.updatePart(item.partData.id, {
          InventoryOnHand: newInventory
        })
      }

      showToast('Invoice finalized successfully! Inventory updated.', 'success')
      navigate('/invoices')

    } catch (error) {
      console.error('Error finalizing invoice:', error)
      showToast('Failed to finalize invoice. Please try again.', 'error')
    } finally {
      setFinalizing(false)
    }
  }

  const totals = calculateTotals()

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
              {isEdit ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? 'Modify existing invoice details' : 'Create a new customer invoice with line items'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.invoiceNumber ? 'border-red-300' : ''
                    }`}
                    placeholder="INV-2024-001"
                  />
                  {errors.invoiceNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
                  )}
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.invoiceDate ? 'border-red-300' : ''
                      }`}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.invoiceDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.invoiceDate}</p>
                  )}
                </div>
              </div>

              {/* Buyer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buyer *
                </label>
                <div className="relative">
                  <select
                    value={formData.buyerId || ''}
                    onChange={(e) => handleBuyerChange(e.target.value)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.buyer ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select a buyer...</option>
                    {buyers.map(buyer => (
                      <option key={buyer.id} value={buyer.id}>
                        {buyer.buyerName}
                        {buyer.contactEmail && ` (${buyer.contactEmail})`}
                      </option>
                    ))}
                  </select>
                  <User className="absolute right-8 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.buyer && (
                  <p className="mt-1 text-sm text-red-600">{errors.buyer}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Additional notes or comments..."
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
              <button
                onClick={() => addLineItem()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
            <div className="p-6">
              {errors.lineItems && typeof errors.lineItems === 'string' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.lineItems}</p>
                </div>
              )}

              {lineItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No items added</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first line item.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => addLineItem()}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        {/* Part Selection */}
                        <div className="sm:col-span-5 relative">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Part *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.partId}
                              onChange={(e) => {
                                updateLineItem(index, 'partId', e.target.value)
                                setPartSearchTerm(e.target.value)
                                setActiveLineItemIndex(index)
                                setShowPartDropdown(true)
                              }}
                              onFocus={() => {
                                setActiveLineItemIndex(index)
                                setShowPartDropdown(true)
                                setPartSearchTerm(item.partId)
                              }}
                              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm ${
                                errors.lineItems?.[index]?.partId ? 'border-red-300' : ''
                              }`}
                              placeholder="Search parts..."
                            />
                            <Search className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                          </div>
                          
                          {/* Part Dropdown */}
                          {showPartDropdown && activeLineItemIndex === index && filteredParts.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                              {filteredParts.map((part) => (
                                <div
                                  key={part.id}
                                  onClick={() => selectPartForLineItem(index, part)}
                                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{part.partId}</span>
                                    <span className="text-sm text-gray-500 truncate">{part.description}</span>
                                    <span className="text-xs text-gray-400">
                                      {part.inventoryOnHand} in stock • ${part.unitPrice}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {errors.lineItems?.[index]?.partId && (
                            <p className="mt-1 text-xs text-red-600">{errors.lineItems[index].partId}</p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Qty *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm ${
                              errors.lineItems?.[index]?.quantity ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.lineItems?.[index]?.quantity && (
                            <p className="mt-1 text-xs text-red-600">{errors.lineItems[index].quantity}</p>
                          )}
                        </div>

                        {/* Unit Price */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit Price *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className={`block w-full pl-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm ${
                                errors.lineItems?.[index]?.unitPrice ? 'border-red-300' : ''
                              }`}
                            />
                          </div>
                          {errors.lineItems?.[index]?.unitPrice && (
                            <p className="mt-1 text-xs text-red-600">{errors.lineItems[index].unitPrice}</p>
                          )}
                        </div>

                        {/* Total */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="text-sm font-medium text-gray-900 py-2">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{lineItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${totals.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Status & Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Current Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <div className="flex items-center space-x-2">
                  {formData.status === 'Draft' && (
                    <>
                      <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Draft</span>
                    </>
                  )}
                  {formData.status === 'Finalized' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Finalized</span>
                    </>
                  )}
                  {formData.status === 'Paid' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-600">Paid</span>
                    </>
                  )}
                  {formData.status === 'Void' && (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Void</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Save as Draft */}
                <button
                  onClick={handleSave}
                  disabled={saving || finalizing}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save as Draft
                </button>

                {/* Finalize Invoice */}
                {formData.status === 'Draft' && (
                  <button
                    onClick={handleFinalize}
                    disabled={saving || finalizing || lineItems.length === 0}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {finalizing ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Finalize Invoice
                  </button>
                )}
              </div>

              {/* Finalization Warning */}
              {formData.status === 'Draft' && lineItems.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Before finalizing:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Review all line items carefully</li>
                        <li>Verify inventory availability</li>
                        <li>Confirm buyer information</li>
                        <li>This will create transactions and update inventory</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Warnings */}
              {lineItems.some(item => item.partData && item.quantity > item.partData.inventoryOnHand) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium">Inventory Issues:</p>
                      <ul className="mt-1 space-y-1">
                        {lineItems
                          .filter(item => item.partData && item.quantity > item.partData.inventoryOnHand)
                          .map((item, index) => (
                            <li key={index}>
                              {item.partId}: Requesting {item.quantity}, only {item.partData.inventoryOnHand} available
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buyer Information */}
          {formData.buyerId && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Buyer Information</h3>
              </div>
              <div className="p-6">
                {(() => {
                  const selectedBuyer = buyers.find(b => b.id === formData.buyerId)
                  return selectedBuyer ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{selectedBuyer.buyerName}</span>
                      </div>
                      {selectedBuyer.contactEmail && (
                        <div className="text-sm text-gray-600">
                          📧 {selectedBuyer.contactEmail}
                        </div>
                      )}
                      {selectedBuyer.phone && (
                        <div className="text-sm text-gray-600">
                          📞 {selectedBuyer.phone}
                        </div>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showPartDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setShowPartDropdown(false)
            setActiveLineItemIndex(null)
            setPartSearchTerm('')
          }}
        />
      )}
    </div>
  )
}

export default InvoiceForm