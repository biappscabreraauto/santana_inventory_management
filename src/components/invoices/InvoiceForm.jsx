import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useSharePointBase } from '../../hooks/useSharePoint'

// Import SharePoint hooks - CREATE-ONLY MODE
import { useInvoices, useBuyers, useParts } from '../../hooks/useSharePoint'

// Import icons
import { Plus, Minus, Search, Package, User, Calendar, DollarSign, Save } from 'lucide-react'

// =================================================================
// INVOICE FORM COMPONENT - UPDATED: CREATE-ONLY MODE
// =================================================================
const InvoiceForm = () => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { executeOperation } = useSharePointBase()
  
  // REMOVED: Edit mode - only create mode supported
  const pageTitle = 'Create Invoice'

  // =================================================================
  // SHAREPOINT HOOKS - CREATE-ONLY MODE
  // =================================================================
  const { 
    createInvoice,
    loading: createLoading 
  } = useInvoices()
  
  const { 
    buyers,
    loading: buyersLoading 
  } = useBuyers()
  
  const { 
    parts,
    loading: partsLoading 
  } = useParts()

  const loading = buyersLoading || partsLoading || createLoading

  // =================================================================
  // STATE MANAGEMENT - UPDATED: No draft status
  // =================================================================
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    buyer: '',
    buyerId: null,
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [lineItems, setLineItems] = useState([])
  const [errors, setErrors] = useState({})
  const [validationErrors, setValidationErrors] = useState([])

  // Part search for line items
  const [partSearchTerm, setPartSearchTerm] = useState('')
  const [showPartDropdown, setShowPartDropdown] = useState(false)
  const [activeLineItemIndex, setActiveLineItemIndex] = useState(null)

  const generateInvoiceNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const invoiceNumber = `INV-${year}${month}${day}-${hours}${minutes}`;
    
    setFormData(prev => ({
      ...prev,
      invoiceNumber
    }));
    
    return invoiceNumber;
  }, []);

  // =================================================================
  // INITIALIZATION - GENERATE INVOICE NUMBER
  // =================================================================
  useEffect(() => {
    if (!formData.invoiceNumber) {
      generateInvoiceNumber();
    }
  }, [formData.invoiceNumber, generateInvoiceNumber]);

  // =================================================================
  // MEMOIZED CALCULATIONS
  // =================================================================
  const filteredParts = useMemo(() => {
    if (!partSearchTerm || !parts) return []
    return parts.filter(part => 
      part.partId.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
      part.description.toLowerCase().includes(partSearchTerm.toLowerCase())
    ).slice(0, 10)
  }, [parts, partSearchTerm])

  const calculateTotals = useCallback(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total) || 0;
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
    
    const tax = 0;
    const total = subtotal + tax;
    
    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      tax: isNaN(tax) ? 0 : tax,
      total: isNaN(total) ? 0 : total
    };
  }, [lineItems]);

  // =================================================================
  // NEW: OVERSELLING VALIDATION
  // =================================================================
  const validateInventoryLevels = useCallback(async () => {
    const stockErrors = [];
    
    for (const item of lineItems) {
      const part = parts.find(p => p.partId === item.partId);
      if (!part) {
        stockErrors.push(`Part ${item.partId} not found`);
        continue;
      }
      
      if (part.inventoryOnHand < item.quantity) {
        stockErrors.push(
          `${item.partId}: Stock ${part.inventoryOnHand}, Required ${item.quantity}`
        );
      }
    }
    
    return stockErrors;
  }, [lineItems, parts]);

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

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
  // LINE ITEM MANAGEMENT
  // =================================================================
  const addLineItem = useCallback((part = null) => {
    const newItem = {
      id: Date.now(),
      partId: part?.partId || '',
      partData: part || null,
      quantity: 1,
      unitPrice: part?.unitPrice || 0,
      total: part?.unitPrice || 0
    }

    setLineItems(prev => [...prev, newItem])
    setActiveLineItemIndex(prev => prev === null ? 0 : prev)
    
    if (!part) {
      setPartSearchTerm('')
      setShowPartDropdown(true)
    }
  }, [])

  const updateLineItem = useCallback((index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev];
      
      if (!updated[index]) {
        return prev;
      }
      
      updated[index] = {
        ...updated[index],
        [field]: value
      };

      if (field === 'quantity' || field === 'unitPrice') {
        const currentItem = updated[index];
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(currentItem.quantity) || 0;
        const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(currentItem.unitPrice) || 0;
        const calculatedTotal = quantity * unitPrice;
        updated[index].total = isNaN(calculatedTotal) ? 0 : calculatedTotal;
      }

      return updated;
    });
  }, []);

  const removeLineItem = useCallback((index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const selectPartForLineItem = useCallback((index, part) => {
    setLineItems(prev => {
      const updated = [...prev];
      const currentQuantity = parseFloat(updated[index]?.quantity) || 1;
      const partUnitPrice = parseFloat(part.unitPrice) || 0;
      
      updated[index] = {
        ...updated[index],
        partId: part.partId,
        partData: part,
        unitPrice: partUnitPrice,
        total: currentQuantity * partUnitPrice
      };
      
      return updated;
    });
    
    setShowPartDropdown(false);
    setPartSearchTerm('');
    setActiveLineItemIndex(null);
  }, []);

  // =================================================================
  // VALIDATION - UPDATED: Added stock validation
  // =================================================================
  const validateForm = async () => {
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

    // NEW: Validate inventory levels
    const stockErrors = await validateInventoryLevels();
    if (stockErrors.length > 0) {
      setValidationErrors(stockErrors);
      newErrors.inventory = 'Insufficient stock for one or more items';
    } else {
      setValidationErrors([]);
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =================================================================
  // FORM SUBMISSION - UPDATED: Direct create as finalized
  // =================================================================
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    const isValid = await validateForm();
    if (!isValid) {
      error('Please correct the errors before saving.');
      return;
    }

    try {
      setSaving(true)
      const totals = calculateTotals()

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        buyer: formData.buyer,
        buyerId: formData.buyerId,
        invoiceDate: formData.invoiceDate,
        totalAmount: totals.total,
        notes: formData.notes,
        lineItems: lineItems
      }

      // Create invoice (automatically finalized in service)
      await createInvoice(invoiceData)
      
      success('Invoice created and finalized successfully! Transactions created and inventory updated.')
      navigate('/invoices')
      
    } catch (err) {
      console.error('Error creating invoice:', err)
      error(err.message || 'Failed to create invoice. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [formData, lineItems, error, success, navigate, createInvoice, calculateTotals, validateForm])

  // =================================================================
  // RENDER
  // =================================================================
  if (loading) {
    return <LoadingSpinner message="Loading invoice form..." />
  }

  const totals = calculateTotals()
  const selectedBuyer = buyers.find(b => b.id === formData.buyerId)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-1">
              Create a new invoice (automatically finalized)
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Insufficient Stock:</h3>
          <ul className="text-red-700 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Auto-generated"
                required
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
              )}
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Invoice Date *
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceDate ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.invoiceDate && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceDate}</p>
              )}
            </div>

            {/* Buyer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Buyer *
              </label>
              <select
                value={formData.buyerId || ''}
                onChange={(e) => handleBuyerChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyer ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select buyer...</option>
                {buyers.map(buyer => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.buyerName}
                  </option>
                ))}
              </select>
              {errors.buyer && (
                <p className="mt-1 text-sm text-red-600">{errors.buyer}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Selected Buyer Info */}
          {selectedBuyer && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="space-y-2 text-sm">
                <div className="font-medium">{selectedBuyer.buyerName}</div>
                {selectedBuyer.contactEmail && (
                  <div className="text-gray-600">📧 {selectedBuyer.contactEmail}</div>
                )}
                {selectedBuyer.phone && (
                  <div className="text-gray-600">📞 {selectedBuyer.phone}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={() => addLineItem()}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>

          {errors.lineItems && (
            <p className="mb-4 text-sm text-red-600">{errors.lineItems}</p>
          )}

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No line items added yet.</p>
              <p className="text-sm">Click "Add Item" to start building your invoice.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    {/* Part Selection */}
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Part
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Search parts..."
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Part Dropdown */}
                      {showPartDropdown && activeLineItemIndex === index && filteredParts.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredParts.map(part => (
                            <div
                              key={part.id}
                              onClick={() => selectPartForLineItem(index, part)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{part.partId}</div>
                              <div className="text-sm text-gray-600">{part.description}</div>
                              <div className="text-sm text-gray-500">
                                Stock: {part.inventoryOnHand} | ${part.unitPrice}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Total */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right">
                        ${(item.total || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="w-full btn btn-danger flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {lineItems.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between">
            <div>
              <button
                type="submit"
                disabled={saving || lineItems.length === 0}
                className="btn btn-primary flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create & Finalize Invoice
                  </>
                )}
              </button>
            </div>

            <Link to="/invoices" className="btn btn-secondary">
              Cancel
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Note:</strong> Invoices are automatically finalized upon creation. 
              Transactions will be created and inventory updated immediately.
            </p>
          </div>
        </div>
      </form>

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