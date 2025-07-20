import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useSharePointBase } from '../../hooks/useSharePoint'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'

// Import SharePoint hooks - CREATE-ONLY MODE
import { useInvoices, useBuyers, useParts } from '../../hooks/useSharePoint'

// Import icons
import { Plus, Minus, Search, Package, User, Calendar, DollarSign, Save, AlertTriangle } from 'lucide-react'

// =================================================================
// INVOICE FORM COMPONENT - UPDATED: CREATE-ONLY MODE WITH RBAC
// =================================================================
const InvoiceForm = () => {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { executeOperation } = useSharePointBase()
  
  // Role-based access control
  const { 
    canAccess, 
    canCreate, 
    isReadOnly, 
    isUser, 
    isAdmin,
    userRole,
    canAccessField 
  } = useRoleAccess('User') // Minimum User role required for invoice creation

  // Early return if insufficient access
  if (!canAccess) {
    return <RoleProtected requiredRole="User" />
  }

  // REMOVED: Edit mode - only create mode supported
  const pageTitle = 'Create Invoice'

  // =================================================================
  // PRICE LOOKUP FUNCTIONALITY - Add this section
  // =================================================================
  const searchPartPrices = useCallback((partId) => {
    if (!partId || !canCreate) return;

    // Search on RockAuto
    const rockautoUrl = `https://www.rockauto.com/en/partsearch/?partnum=${encodeURIComponent(partId)}`;
    
    // Open both in new tabs
    window.open(rockautoUrl, '_blank', 'noopener,noreferrer');
    
    success(`Price search opened for part: ${partId}`);
  }, [canCreate, success]);

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
  // STATE MANAGEMENT - UPDATED: No draft status, RBAC considerations
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

  // Part search for line items - Only enabled for User+ roles
  const [partSearchTerm, setPartSearchTerm] = useState('')
  const [showPartDropdown, setShowPartDropdown] = useState(false)
  const [activeLineItemIndex, setActiveLineItemIndex] = useState(null)

  const generateInvoiceNumber = useCallback(() => {
    // Only Users+ can generate invoice numbers
    if (!canCreate) return ''

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
  }, [canCreate]);

  // =================================================================
  // INITIALIZATION - GENERATE INVOICE NUMBER (RBAC Protected)
  // =================================================================
  useEffect(() => {
    if (!formData.invoiceNumber && canCreate) {
      generateInvoiceNumber();
    }
  }, [formData.invoiceNumber, generateInvoiceNumber, canCreate]);

  // =================================================================
  // MEMOIZED CALCULATIONS - RBAC Aware
  // =================================================================
  const filteredParts = useMemo(() => {
    // ReadOnly users cannot search parts for invoice creation
    if (!canCreate || !partSearchTerm || !parts) return []
    
    return parts.filter(part => 
      part.partId.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
      part.description.toLowerCase().includes(partSearchTerm.toLowerCase())
    ).slice(0, 10)
  }, [parts, partSearchTerm, canCreate])

  const calculateTotals = useCallback(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total) || 0;
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
    
    const total = subtotal; // No tax calculation
    
    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      total: isNaN(total) ? 0 : total
    };
  }, [lineItems]);

  // =================================================================
  // NEW: OVERSELLING VALIDATION - RBAC Protected
  // =================================================================
  const validateInventoryLevels = useCallback(async () => {
    if (!canCreate) return []

    const stockErrors = [];
    
    // FIXED: Aggregate quantities by partId first
    const partQuantityMap = new Map();
    
    lineItems.forEach(item => {
      if (!item.partId) return; // Skip incomplete line items
      
      const currentTotal = partQuantityMap.get(item.partId) || 0;
      partQuantityMap.set(item.partId, currentTotal + (parseFloat(item.quantity) || 0));
    });
    
    // Now validate aggregated quantities against available inventory
    for (const [partId, totalQuantityNeeded] of partQuantityMap) {
      const part = parts.find(p => p.partId === partId);
      if (!part) {
        stockErrors.push(`❌ Part ${partId} not found in system`);
        continue;
      }
      
      // ONLY show errors for insufficient stock - removed depletion warnings
      if (part.inventoryOnHand < totalQuantityNeeded) {
        const shortage = totalQuantityNeeded - part.inventoryOnHand;
        const lineItemsCount = lineItems.filter(item => item.partId === partId).length;
        
        stockErrors.push(
          `⚠️ ${partId}: Insufficient stock (${shortage} units short) - ` +
          `Available: ${part.inventoryOnHand}, Required: ${totalQuantityNeeded} ` +
          `${lineItemsCount > 1 ? `(across ${lineItemsCount} line items)` : ''}`
        );
      }
    }
    
    return stockErrors;
  }, [lineItems, parts, canCreate]);

  // =================================================================
  // EVENT HANDLERS - RBAC Protected
  // =================================================================
  const handleInputChange = useCallback((field, value) => {
    // ReadOnly users cannot modify form data
    if (isReadOnly) return;

    // Check field-level permissions
    if (!canAccessField('invoiceForm', field)) return;

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
  }, [isReadOnly, canAccessField])

  const handleBuyerChange = useCallback((buyerId) => {
    // ReadOnly users cannot change buyer
    if (isReadOnly || !canAccessField('invoiceForm', 'buyer')) return;

    const selectedBuyer = buyers.find(b => b.id === buyerId)
    setFormData(prev => ({
      ...prev,
      buyer: selectedBuyer?.buyerName || '',
      buyerId: selectedBuyer?.id || null
    }))
  }, [buyers, isReadOnly, canAccessField])

  // =================================================================
  // LINE ITEM MANAGEMENT - RBAC Protected
  // =================================================================
  const addLineItem = useCallback((part = null) => {
    // Only User+ can add line items
    if (!canCreate || !canAccessField('invoiceForm', 'lineItems')) return;

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
  }, [canCreate, canAccessField])

  const updateLineItem = useCallback((index, field, value) => {
    // Only User+ can update line items
    if (!canCreate || !canAccessField('invoiceForm', 'lineItems')) return;

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
  }, [canCreate, canAccessField]);

  const removeLineItem = useCallback((index) => {
    // Only User+ can remove line items
    if (!canCreate || !canAccessField('invoiceForm', 'lineItems')) return;

    setLineItems(prev => prev.filter((_, i) => i !== index))
  }, [canCreate, canAccessField])

  const selectPartForLineItem = useCallback((index, part) => {
    // Only User+ can select parts for line items
    if (!canCreate || !canAccessField('invoiceForm', 'lineItems')) return;

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
  }, [canCreate, canAccessField]);

// =================================================================
  // VALIDATION - UPDATED: Added stock validation, RBAC Protected
  // =================================================================
  const validateForm = async () => {
    // Only validate if user can create invoices
    if (!canCreate) {
      error('You do not have permission to create invoices.');
      return false;
    }

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

    // NEW: Validate inventory levels (only for User+ roles)
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
  // FORM SUBMISSION - UPDATED: Direct create as finalized, RBAC Protected
  // =================================================================
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Block submission for ReadOnly users
    if (!canCreate) {
      error('You do not have permission to create invoices.');
      return;
    }

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
  }, [formData, lineItems, error, success, navigate, createInvoice, calculateTotals, validateForm, canCreate])

  // =================================================================
  // RENDER - RBAC Protected UI Elements
  // =================================================================
  if (loading) {
    return <LoadingSpinner message="Loading invoice form..." />
  }

  const totals = calculateTotals()
  const selectedBuyer = buyers.find(b => b.id === formData.buyerId)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Role Badge */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-1">
              {canCreate 
                ? "Create a new invoice (automatically finalized)" 
                : "Invoice creation requires User permissions"
              }
            </p>
          </div>
          <div className="text-right">
            {!canCreate && (
              <div className="mt-1 text-xs text-red-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Insufficient Permissions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permission Warning for ReadOnly Users */}
      {isReadOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-yellow-800 font-medium">Read-Only Access</h3>
              <p className="text-yellow-700 text-sm mt-1">
                You have read-only access and cannot create invoices. Contact your administrator 
                to request User permissions for invoice creation.
              </p>
            </div>
          </div>
        </div>
      )}

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
        {/* Invoice Details - RBAC Protected */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Invoice Number - Display for all, but emphasize permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                disabled={!canCreate}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                } ${!canCreate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={canCreate ? "Auto-generated" : "Requires User permission"}
                required
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
              )}
              {!canCreate && (
                <p className="mt-1 text-xs text-gray-500">Read-only field</p>
              )}
            </div>

            {/* Invoice Date - RBAC Protected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Invoice Date *
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                disabled={!canCreate}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoiceDate ? 'border-red-500' : 'border-gray-300'
                } ${!canCreate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              />
              {errors.invoiceDate && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceDate}</p>
              )}
            </div>

            {/* Buyer Selection - RBAC Protected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Buyer *
              </label>
              <select
                value={formData.buyerId || ''}
                onChange={(e) => handleBuyerChange(e.target.value)}
                disabled={!canCreate}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyer ? 'border-red-500' : 'border-gray-300'
                } ${!canCreate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">{canCreate ? "Select buyer..." : "Buyer selection disabled"}</option>
                {canCreate && buyers.map(buyer => (
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

          {/* Notes - RBAC Protected */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={!canCreate}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !canCreate ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder={canCreate ? "Additional notes..." : "Notes disabled - requires User permission"}
            />
          </div>

          {/* Selected Buyer Info - Available to all users */}
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

        {/* Line Items - RBAC Protected */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <button
                type="button"
                onClick={() => addLineItem()}
                disabled={!canCreate}
                className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </RoleProtected>
          </div>

          {errors.lineItems && (
            <p className="mb-4 text-sm text-red-600">{errors.lineItems}</p>
          )}

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No line items added yet.</p>
              <p className="text-sm">
                {canCreate 
                  ? 'Click "Add Item" to start building your invoice.'
                  : 'User permissions required to add line items.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    {/* Part Selection - RBAC Protected */}
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Part
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={item.partId}
                          onChange={(e) => {
                            if (canCreate) {
                              updateLineItem(index, 'partId', e.target.value)
                              setPartSearchTerm(e.target.value)
                              setActiveLineItemIndex(index)
                              setShowPartDropdown(true)
                            }
                          }}
                          disabled={!canCreate}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !canCreate ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder={canCreate ? "Search parts..." : "Part search disabled"}
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Part Dropdown - Only for User+ */}
                      {canCreate && showPartDropdown && activeLineItemIndex === index && filteredParts.length > 0 && (
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

                    {/* Quantity - RBAC Protected */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => canCreate && updateLineItem(index, 'quantity', e.target.value)}
                        disabled={!canCreate}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !canCreate ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {/* Unit Price - RBAC Protected */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <div className="flex">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            value={item.unitPrice}
                            onChange={(e) => {
                              if (!canCreate) return;
                              const value = e.target.value;
                              // Allow only numbers and decimal point
                              if (/^\d*\.?\d*$/.test(value) || value === '') {
                                updateLineItem(index, 'unitPrice', value);
                              }
                            }}
                            onBlur={(e) => {
                              if (!canCreate) return;
                              // Format the value when user leaves the field
                              const numValue = parseFloat(e.target.value) || 0;
                              updateLineItem(index, 'unitPrice', numValue.toFixed(2));
                            }}
                            disabled={!canCreate}
                            placeholder="0.00"
                            className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              !canCreate ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            pattern="[0-9]*\.?[0-9]*"
                            inputMode="decimal"
                          />
                        </div>
                        
                        {/* Price Lookup Button */}
                        <button
                          type="button"
                          onClick={() => searchPartPrices(item.partId)}
                          disabled={!item.partId || !canCreate}
                          className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Search prices on RockAuto"
                        >
                          <Search className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Total - Display for all */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right">
                        ${(item.total || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Remove Button - RBAC Protected */}
                    <div>
                      <RoleProtected requiredRole="User" hideIfUnauthorized>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          disabled={!canCreate}
                          className="w-full btn btn-danger flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </RoleProtected>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals with Tax Notice - Available to all */}
          {lineItems.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Tax Notice - Professional Version */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm text-blue-700">
                          <strong>Tax Disclaimer:</strong> The amounts shown are pre-tax totals. 
                          Applicable sales tax, use tax, and other governmental fees will be calculated 
                          and added to the final invoice amount as required by applicable law.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions - RBAC Protected */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between">
            <div>
              <RoleProtected requiredRole="User" hideIfUnauthorized>
                <button
                  type="submit"
                  disabled={saving || lineItems.length === 0 || !canCreate}
                  className="btn btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
              </RoleProtected>
            </div>

            <Link to="/invoices" className="btn btn-secondary">
              {canCreate ? 'Cancel' : 'Back to Invoices'}
            </Link>
          </div>

          {/* Help Text - Role-aware */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Note:</strong> {canCreate 
                ? 'Invoices are automatically finalized upon creation. Transactions will be created and inventory updated immediately.'
                : 'Invoice creation requires User-level permissions. Contact your administrator for access.'
              }
            </p>
          </div>
        </div>
      </form>

      {/* Click outside to close dropdown */}
      {showPartDropdown && canCreate && (
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