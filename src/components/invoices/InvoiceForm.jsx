import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'

// Import SharePoint hooks (NOW AVAILABLE)
import { useInvoice, useInvoices, useBuyers, useParts } from '../../hooks/useSharePoint'

// Import icons
import { Plus, Minus, Search, Package, User, Calendar, DollarSign, Save, Send } from 'lucide-react'

// =================================================================
// MOCK DATA MOVED OUTSIDE COMPONENT TO PREVENT RE-RENDERS
// =================================================================
const mockBuyers = [
  { id: '1', buyerName: 'AutoZone Distribution', contactEmail: 'orders@autozone.com', phone: '555-0101' },
  { id: '2', buyerName: 'O\'Reilly Auto Parts', contactEmail: 'purchasing@oreillyauto.com', phone: '555-0102' },
  { id: '3', buyerName: 'NAPA Auto Parts', contactEmail: 'wholesale@napaonline.com', phone: '555-0103' }
]

const mockParts = [
  { id: '1', partId: 'BH001', description: 'Brake Hose - Front Left', unitPrice: 45.99, inventoryOnHand: 5 },
  { id: '2', partId: 'BP002', description: 'Brake Pad Set - Premium', unitPrice: 129.99, inventoryOnHand: 12 },
  { id: '3', partId: 'WB003', description: 'Wheel Bearing - Rear', unitPrice: 89.99, inventoryOnHand: 8 },
  { id: '4', partId: 'OF004', description: 'Oil Filter - Standard', unitPrice: 16.99, inventoryOnHand: 25 },
  { id: '5', partId: 'AF005', description: 'Air Filter - High Flow', unitPrice: 24.99, inventoryOnHand: 15 }
]

// =================================================================
// INVOICE FORM COMPONENT - FIXED INFINITE LOOP
// =================================================================
const InvoiceForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error, info } = useToast()
  
  const isEditMode = Boolean(id)
  const pageTitle = isEditMode ? 'Edit Invoice' : 'Create Invoice'

  // =================================================================
  // INTEGRATION MODE TOGGLE
  // =================================================================
  const [integrationMode, setIntegrationMode] = useState('mock') // Start with mock

  // =================================================================
  // SHAREPOINT HOOKS
  // =================================================================
  const { 
    invoice: sharePointInvoice,
    lineItems: sharePointLineItems,
    loading: invoiceLoading,
    error: invoiceError,
    updateInvoice,
    deleteInvoice,
    finalizeInvoice
  } = useInvoice(id)
  
  const { 
    createInvoice,
    loading: createLoading 
  } = useInvoices()
  
  const { 
    buyers: sharePointBuyers,
    buyerNames: sharePointBuyerNames,
    loading: buyersLoading 
  } = useBuyers()
  
  const { 
    parts: sharePointParts,
    loading: partsLoading 
  } = useParts()

  // =================================================================
  // MOCK DATA FOR EDIT MODE (STATIC TO PREVENT RE-RENDERS)
  // =================================================================
  const mockInvoiceStatic = useMemo(() => {
    if (!isEditMode) return null
    return {
      id: id,
      invoiceNumber: 'INV-2025-001',
      buyer: 'AutoZone Distribution',
      buyerId: '1',
      invoiceDate: '2025-01-14',
      totalAmount: 350.97,
      status: 'Draft',
      notes: 'Sample invoice for testing'
    }
  }, [id, isEditMode])

  const mockLineItemsStatic = useMemo(() => {
    if (!isEditMode) return []
    return [
      { id: '1', partId: 'BH001', partData: mockParts[0], quantity: 2, unitPrice: 45.99, total: 91.98 },
      { id: '2', partId: 'BP002', partData: mockParts[1], quantity: 2, unitPrice: 129.99, total: 259.98 }
    ]
  }, [isEditMode])

  // =================================================================
  // DATA SELECTION LOGIC (FIXED)
  // =================================================================
  const {
    currentInvoice,
    currentLineItems,
    buyers,
    parts,
    loading,
    dataError
  } = useMemo(() => {
    if (integrationMode === 'live') {
      return {
        currentInvoice: sharePointInvoice,
        currentLineItems: sharePointLineItems,
        buyers: sharePointBuyers || [],
        parts: sharePointParts || [],
        loading: invoiceLoading || buyersLoading || partsLoading || createLoading,
        dataError: invoiceError
      }
    } else {
      return {
        currentInvoice: mockInvoiceStatic,
        currentLineItems: mockLineItemsStatic,
        buyers: mockBuyers,
        parts: mockParts,
        loading: false,
        dataError: null
      }
    }
  }, [
    integrationMode, 
    sharePointInvoice, 
    sharePointLineItems, 
    sharePointBuyers, 
    sharePointParts, 
    invoiceLoading, 
    buyersLoading, 
    partsLoading, 
    createLoading, 
    invoiceError, 
    mockInvoiceStatic, 
    mockLineItemsStatic
  ])

  // =================================================================
  // STATE MANAGEMENT
  // =================================================================
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    buyer: '',
    buyerId: null,
    invoiceDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    notes: '',
    totalAmount: 0
  })
  const [lineItems, setLineItems] = useState([])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Part search for line items
  const [partSearchTerm, setPartSearchTerm] = useState('')
  const [showPartDropdown, setShowPartDropdown] = useState(false)
  const [activeLineItemIndex, setActiveLineItemIndex] = useState(null)

  // =================================================================
  // DATA LOADING AND INITIALIZATION
  // =================================================================
  useEffect(() => {
    if (isEditMode && currentInvoice) {
      setFormData({
        invoiceNumber: currentInvoice.invoiceNumber || '',
        buyer: currentInvoice.buyer || '',
        buyerId: currentInvoice.buyerId || null,
        invoiceDate: currentInvoice.invoiceDate ? currentInvoice.invoiceDate.split('T')[0] : '',
        status: currentInvoice.status || 'Draft',
        notes: currentInvoice.notes || '',
        totalAmount: currentInvoice.totalAmount || 0
      })
    } else if (!isEditMode) {
      generateInvoiceNumber()
    }
  }, [isEditMode, currentInvoice])

  useEffect(() => {
    if (currentLineItems) {
      setLineItems(currentLineItems)
    }
  }, [currentLineItems])

  // Recalculate total when line items change
  useEffect(() => {
    const totals = calculateTotals()
    setFormData(prev => ({
      ...prev,
      totalAmount: totals.total
    }))
  }, [lineItems])

  // =================================================================
  // HELPER FUNCTIONS (MEMOIZED TO PREVENT RE-RENDERS)
  // =================================================================
  const generateInvoiceNumber = useCallback(() => {
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
  }, [])

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }, [])

  const calculateTotals = useCallback(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const tax = 0 // No tax calculation for now
    const total = subtotal + tax

    return { subtotal, tax, total }
  }, [lineItems])

  // =================================================================
  // EVENT HANDLERS (MEMOIZED)
  // =================================================================
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    setTouched(prev => ({
      ...prev,
      [field]: true
    }))

    // Clear error for this field
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      }
      return prev
    })
  }, [])

  const handleBuyerChange = useCallback((buyerId) => {
    const selectedBuyer = buyers.find(b => b.id === buyerId)
    setFormData(prev => ({
      ...prev,
      buyer: selectedBuyer?.buyerName || '',
      buyerId: selectedBuyer?.id || null
    }))
  }, [buyers])

  // =================================================================
  // LINE ITEM MANAGEMENT (MEMOIZED)
  // =================================================================
  const addLineItem = useCallback((part = null) => {
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
  }, [lineItems.length])

  const updateLineItem = useCallback((index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }

      // Recalculate total
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : updated[index].quantity
        const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : updated[index].unitPrice
        updated[index].total = quantity * unitPrice
      }

      return updated
    })
  }, [])

  const selectPartForLineItem = useCallback((index, part) => {
    updateLineItem(index, 'partId', part.partId)
    updateLineItem(index, 'partData', part)
    updateLineItem(index, 'unitPrice', part.unitPrice)
    
    // Recalculate total with current quantity
    const currentQuantity = lineItems[index]?.quantity || 1
    updateLineItem(index, 'total', currentQuantity * part.unitPrice)
    
    setShowPartDropdown(false)
    setPartSearchTerm('')
    setActiveLineItemIndex(null)
  }, [lineItems, updateLineItem])

  const removeLineItem = useCallback((index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  // =================================================================
  // VALIDATION
  // =================================================================
  const validateForm = useCallback(() => {
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
      
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        itemErrors.unitPrice = 'Unit price must be 0 or greater'
      }

      // Check inventory availability
      if (item.partData && item.quantity > item.partData.inventoryOnHand) {
        itemErrors.quantity = `Only ${item.partData.inventoryOnHand} units available`
      }

      return Object.keys(itemErrors).length > 0 ? itemErrors : null
    })

    if (lineItemErrors.some(errors => errors !== null)) {
      newErrors.lineItemsValidation = lineItemErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, lineItems])

  // =================================================================
  // FORM SUBMISSION (MEMOIZED)
  // =================================================================
  const handleSubmit = useCallback(async (e, actionType = 'save') => {
    e.preventDefault()
    
    if (!validateForm()) {
      error('Please correct the errors before saving.')
      return
    }

    try {
      setSaving(true)

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        buyer: formData.buyer,
        buyerId: formData.buyerId,
        invoiceDate: formData.invoiceDate,
        totalAmount: calculateTotals().total,
        status: actionType === 'finalize' ? 'Finalized' : formData.status,
        notes: formData.notes,
        lineItems: lineItems
      }

      let result
      if (isEditMode) {
        if (integrationMode === 'live') {
          result = await updateInvoice(invoiceData)
        } else {
          // Mock update
          result = { ...invoiceData, id: id }
          info('Mock: Invoice updated successfully')
        }
      } else {
        if (integrationMode === 'live') {
          result = await createInvoice(invoiceData)
        } else {
          // Mock create
          result = { ...invoiceData, id: 'mock-' + Date.now() }
          info('Mock: Invoice created successfully')
        }
      }

      // Handle finalization if requested
      if (actionType === 'finalize' && result.id) {
        if (integrationMode === 'live') {
          await finalizeInvoice()
          success('Invoice finalized successfully! Transactions created and inventory updated.')
        } else {
          info('Mock: Invoice would be finalized and transactions created')
        }
      } else {
        success(`Invoice ${isEditMode ? 'updated' : 'created'} successfully!`)
      }

      navigate('/invoices')
      
    } catch (err) {
      console.error('Error saving invoice:', err)
      error('Failed to save invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [
    validateForm, 
    error, 
    formData, 
    calculateTotals, 
    lineItems, 
    isEditMode, 
    integrationMode, 
    updateInvoice, 
    id, 
    info, 
    createInvoice, 
    finalizeInvoice, 
    success, 
    navigate
  ])

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      
      if (integrationMode === 'live') {
        await deleteInvoice()
      } else {
        info('Mock: Invoice would be deleted')
      }
      
      success('Invoice deleted successfully')
      navigate('/invoices')
      
    } catch (err) {
      console.error('Error deleting invoice:', err)
      error('Failed to delete invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [integrationMode, deleteInvoice, info, success, navigate, error])

  // =================================================================
  // FILTERED PARTS FOR SEARCH (MEMOIZED)
  // =================================================================
  const filteredParts = useMemo(() => {
    if (!partSearchTerm.trim()) return []
    
    return parts.filter(part => 
      part.partId.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
      part.description.toLowerCase().includes(partSearchTerm.toLowerCase())
    ).slice(0, 10) // Limit to 10 results
  }, [parts, partSearchTerm])

  // =================================================================
  // INTEGRATION MODE DISPLAY
  // =================================================================
  if (integrationMode === 'test') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-400 text-4xl mb-4">🧪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Test Mode</h3>
          <p className="text-gray-600 mb-4">SharePoint connection testing is not available in form mode.</p>
          <button
            onClick={() => setIntegrationMode('mock')}
            className="btn btn-primary"
          >
            Switch to Mock Mode
          </button>
        </div>
      </div>
    )
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isEditMode ? 'Loading invoice details...' : 'Loading form data...'}
          </p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <div className="space-x-3">
            <button
              onClick={() => setIntegrationMode('mock')}
              className="btn btn-secondary"
            >
              Use Mock Data
            </button>
            <Link to="/invoices" className="btn btn-primary">
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
    <div className="space-y-6">
      {/* Integration Mode Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Integration Mode</h4>
            <p className="text-sm text-blue-700">
              {integrationMode === 'mock' && 'Using mock data for development'}
              {integrationMode === 'live' && 'Connected to live SharePoint data'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIntegrationMode('mock')}
              className={`px-3 py-1 text-xs rounded ${
                integrationMode === 'mock' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-600'
              }`}
            >
              🔧 Mock
            </button>
            <button
              onClick={() => setIntegrationMode('live')}
              className={`px-3 py-1 text-xs rounded ${
                integrationMode === 'live' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-600 border border-green-600'
              }`}
            >
              🚀 Live
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Modify existing invoice details' : 'Create a new customer invoice with line items'}
          </p>
        </div>
        <Link
          to="/invoices"
          className="btn btn-secondary"
        >
          ← Back to Invoices
        </Link>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <div className="bg-white rounded-lg border border-gray-200">
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
                      className={`input ${errors.invoiceNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="INV-2025-001"
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
                        className={`input ${errors.invoiceDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
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
                      className={`input ${errors.buyer ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
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
                    className="input"
                    placeholder="Additional notes or comments..."
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
                <button
                  type="button"
                  onClick={() => addLineItem()}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
              <div className="p-6">
                {errors.lineItems && (
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
                    <button
                      type="button"
                      onClick={() => addLineItem()}
                      className="mt-4 btn btn-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          {/* Part Selection */}
                          <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Part
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={item.partId}
                                onChange={(e) => {
                                  setPartSearchTerm(e.target.value)
                                  setActiveLineItemIndex(index)
                                  setShowPartDropdown(true)
                                  updateLineItem(index, 'partId', e.target.value)
                                }}
                                className="input"
                                placeholder="Search parts..."
                              />
                              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                              
                              {/* Part Dropdown */}
                              {showPartDropdown && activeLineItemIndex === index && filteredParts.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {filteredParts.map(part => (
                                    <button
                                      key={part.id}
                                      type="button"
                                      onClick={() => selectPartForLineItem(index, part)}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium">{part.partId}</div>
                                      <div className="text-sm text-gray-600">{part.description}</div>
                                      <div className="text-sm text-gray-500">
                                        {formatCurrency(part.unitPrice)} • {part.inventoryOnHand} in stock
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {item.partData && (
                              <p className="mt-1 text-xs text-gray-500">
                                {item.partData.description} • {item.partData.inventoryOnHand} in stock
                              </p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="input"
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="input pl-10"
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="input bg-gray-100 text-gray-700 font-medium">
                              {formatCurrency(item.total)}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <div className="md:col-span-2 flex items-end">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="btn btn-danger btn-sm w-full"
                            >
                              <Minus className="h-4 w-4" />
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

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateTotals().subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(calculateTotals().tax)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(calculateTotals().total)}</span>
                  </div>
                </div>

                {/* Line Items Count */}
                <div className="text-sm text-gray-600">
                  {lineItems.length} item{lineItems.length !== 1 ? 's' : ''} • {lineItems.reduce((sum, item) => sum + item.quantity, 0)} total units
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Current Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        formData.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                        formData.status === 'Finalized' ? 'bg-blue-100 text-blue-800' :
                        formData.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formData.status}
                      </span>
                    </div>
                  </div>
                  
                  {isEditMode && currentInvoice && (
                    <div className="text-sm text-gray-600">
                      <div>Created: {new Date(currentInvoice.created || currentInvoice.invoiceDate).toLocaleDateString()}</div>
                      {currentInvoice.modified && (
                        <div>Modified: {new Date(currentInvoice.modified).toLocaleDateString()}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Add Parts */}
            {parts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Add</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-3">Popular parts:</p>
                  <div className="space-y-2">
                    {parts.slice(0, 3).map(part => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => addLineItem(part)}
                        className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm">{part.partId}</div>
                        <div className="text-xs text-gray-600 truncate">{part.description}</div>
                        <div className="text-xs text-blue-600">{formatCurrency(part.unitPrice)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Buyer Information */}
            {formData.buyerId && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Buyer Info</h3>
                </div>
                <div className="p-6">
                  {(() => {
                    const selectedBuyer = buyers.find(b => b.id === formData.buyerId)
                    return selectedBuyer ? (
                      <div className="space-y-2 text-sm">
                        <div className="font-medium">{selectedBuyer.buyerName}</div>
                        {selectedBuyer.contactEmail && (
                          <div className="text-gray-600">📧 {selectedBuyer.contactEmail}</div>
                        )}
                        {selectedBuyer.phone && (
                          <div className="text-gray-600">📞 {selectedBuyer.phone}</div>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Save as Draft */}
              <button
                type="submit"
                disabled={saving}
                className="btn btn-secondary flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </button>

              {/* Finalize Invoice */}
              {formData.status === 'Draft' && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'finalize')}
                  disabled={saving || lineItems.length === 0}
                  className="btn btn-primary flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Finalize Invoice
                    </>
                  )}
                </button>
              )}

              {/* Delete Invoice (Edit Mode Only) */}
              {isEditMode && formData.status === 'Draft' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="btn btn-danger"
                >
                  Delete Invoice
                </button>
              )}
            </div>

            {/* Cancel */}
            <Link
              to="/invoices"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Save as draft to continue editing later, or finalize to create transactions and update inventory.
              {formData.status === 'Finalized' && ' Finalized invoices cannot be edited.'}
            </p>
          </div>

          {/* Integration Status */}
          {integrationMode === 'mock' && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-700">
                ⚠️ Mock mode: Changes won't be saved to SharePoint
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Debug Info (Development Only) */}
      {import.meta.env.VITE_DEV_MODE === 'true' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Debug Info (Development)</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Integration Mode: {integrationMode}</div>
            <div>Is Edit Mode: {isEditMode ? 'Yes' : 'No'}</div>
            <div>Form Valid: {validateForm() ? 'Yes' : 'No'}</div>
            <div>Line Items: {lineItems.length}</div>
            <div>Total Amount: {formatCurrency(formData.totalAmount)}</div>
            <div>Buyers Loaded: {buyers.length}</div>
            <div>Parts Loaded: {parts.length}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showPartDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setShowPartDropdown(false)
            setActiveLineItemIndex(null)
          }}
        />
      )}
    </div>
  )
}

export default InvoiceForm