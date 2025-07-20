// =================================================================
// COMPLETE REVISED TRANSACTION FORM - WITH SEARCH/AUTOCOMPLETE
// =================================================================
// Component for logging inbound inventory movements and adjustments
// Fixed price/cost calculations based on movement type
// Enhanced with role-based access control and search-based part selection

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react' // Added for search icon
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useTransactions, useParts } from '../../hooks/useSharePoint'

const TransactionForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, error } = useToast()
  const { userRole } = useAuth()
  const { 
    canCreate, 
    canView, 
    isReadOnly, 
    isUser, 
    isAdmin,
    canAccess 
  } = useRoleAccess('ReadOnly')
  const { createTransaction } = useTransactions()
  const { parts, loading: partsLoading } = useParts()

  // Early return if no access
  if (!canAccess) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/transactions')}
            className="btn btn-primary"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    )
  }

  // Get pre-selected part ID from URL params (when clicked from parts table)
  const preselectedPartId = searchParams.get('partId')

  // =================================================================
  // FORM STATE - ENHANCED WITH SEARCH
  // =================================================================
  const [formData, setFormData] = useState({
    partId: preselectedPartId || '',
    movementType: 'In (Received)',
    quantity: '',
    supplier: '',
    notes: '',
    receiptDate: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // SEARCH STATE - NEW
  const [partSearch, setPartSearch] = useState('')
  const [showPartDropdown, setShowPartDropdown] = useState(false)
  const [filteredParts, setFilteredParts] = useState([])

  // Get selected part details
  const selectedPart = parts.find(part => part.partId === formData.partId)

  // =================================================================
  // SEARCH FUNCTIONALITY - NEW
  // =================================================================
  
  // Handle part search input
  const handlePartSearch = (searchValue) => {
    setPartSearch(searchValue)
    
    if (searchValue.length >= 1) {
      const filtered = parts
        .filter((part, index, self) => 
          // Remove duplicates by partId - keep first occurrence
          index === self.findIndex(p => p.partId === part.partId)
        )
        .filter(part => 
          part.partId.toLowerCase().includes(searchValue.toLowerCase()) ||
          part.description.toLowerCase().includes(searchValue.toLowerCase())
        )
        .slice(0, 10) // Limit results for performance
      
      setFilteredParts(filtered)
      setShowPartDropdown(filtered.length > 0)
    } else {
      setFilteredParts([])
      setShowPartDropdown(false)
    }
  }

  // Select a part from search results
  const selectPart = (part) => {
    setFormData(prev => ({
      ...prev,
      partId: part.partId
    }))
    setPartSearch(`${part.partId} - ${part.description}`)
    setShowPartDropdown(false)
    
    // Clear any existing errors
    if (errors.partId) {
      setErrors(prev => ({ ...prev, partId: '' }))
    }
  }

  // Initialize search field with preselected part
  useEffect(() => {
    if (preselectedPartId && parts.length > 0) {
      const preselectedPart = parts.find(part => part.partId === preselectedPartId)
      if (preselectedPart) {
        setPartSearch(`${preselectedPart.partId} - ${preselectedPart.description}`)
      }
    }
  }, [preselectedPartId, parts])

  // =================================================================
  // CALCULATED VALUES - FIXED FOR DIFFERENT MOVEMENT TYPES
  // =================================================================
  
  // Calculate total value based on movement type
  const totalValue = useMemo(() => {
    if (!selectedPart || !formData.quantity) return '0.00'
    
    const quantity = parseFloat(formData.quantity) || 0
    
    if (formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment') {
      // For inbound: Use unit cost
      return (quantity * (selectedPart.unitCost || 0)).toFixed(2)
    } else if (formData.movementType === 'Out (Sold)') {
      // For outbound: Use unit price (selling price)
      return (quantity * (selectedPart.unitPrice || 0)).toFixed(2)
    }
    
    return '0.00'
  }, [selectedPart, formData.quantity, formData.movementType])

  // Get transaction type information for UI display
  const getTransactionTypeInfo = () => {
    if (formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment') {
      return {
        priceLabel: 'Unit Cost',
        priceValue: selectedPart?.unitCost || 0,
        totalLabel: 'Total Cost',
        description: 'Cost to acquire/receive',
        quantityPrefix: '+',
        quantityColor: 'text-green-600'
      }
    } else if (formData.movementType === 'Out (Sold)') {
      return {
        priceLabel: 'Unit Price',
        priceValue: selectedPart?.unitPrice || 0,
        totalLabel: 'Total Revenue',
        description: 'Selling price to customer',
        quantityPrefix: '-',
        quantityColor: 'text-red-600'
      }
    }
    return {
      priceLabel: 'Unit Value',
      priceValue: 0,
      totalLabel: 'Total Value',
      description: 'Transaction value',
      quantityPrefix: '',
      quantityColor: 'text-gray-600'
    }
  }

  const transactionTypeInfo = getTransactionTypeInfo()

  // =================================================================
  // HANDLERS
  // =================================================================
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    
    let processedValue = value
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value) || ''
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.partId) {
      newErrors.partId = 'Part selection is required'
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = 'Date is required'
    }

    // Check if selected part exists and has appropriate pricing
    if (formData.partId && selectedPart) {
      if (formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment') {
        if (!selectedPart.unitCost || selectedPart.unitCost <= 0) {
          newErrors.partId = 'Selected part must have a valid unit cost for inbound transactions'
        }
      } else if (formData.movementType === 'Out (Sold)') {
        if (!selectedPart.unitPrice || selectedPart.unitPrice <= 0) {
          newErrors.partId = 'Selected part must have a valid unit price for outbound transactions'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      error('Please fix the validation errors before submitting')
      return
    }

    try {
      setSaving(true)

      // FIXED: Properly structure transaction data based on movement type
      const transactionData = {
        partId: formData.partId,
        movementType: formData.movementType,
        quantity: parseFloat(formData.quantity),
        supplier: formData.supplier || '',
        notes: formData.notes || `${formData.movementType} - ${formData.quantity} units`
      }

      // FIXED: Set cost/price based on movement type
      if (formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment') {
        // For INBOUND: Only set unitCost, do NOT set unitPrice
        transactionData.unitCost = selectedPart.unitCost
        // Explicitly do NOT set unitPrice - it should remain undefined
      } else if (formData.movementType === 'Out (Sold)') {
        // For OUTBOUND: Set unitPrice (selling price), optionally unitCost
        transactionData.unitPrice = selectedPart.unitPrice
        transactionData.unitCost = selectedPart.unitCost // Optional for reference
      }

      console.log('Transaction data being sent:', transactionData)

      await createTransaction(transactionData)
      
      const actionText = formData.movementType === 'In (Received)' ? 'Added' : 
                        formData.movementType === 'Out (Sold)' ? 'Removed' : 'Adjusted'
      
      success(`Transaction logged successfully! ${actionText} ${formData.quantity} units of ${formData.partId}.`)
      navigate('/transactions')
    } catch (err) {
      console.error('Transaction creation error:', err)
      error(err.message || 'An error occurred while logging the transaction')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/transactions')
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (partsLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading parts data...</p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Transaction</h1>
          <p className="text-gray-600">Record inventory movements and adjustments</p>
        </div>
      </div>

      {/* Access Denied Notice for ReadOnly */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-amber-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-amber-900">Read-Only Access</h3>
              <p className="text-sm text-amber-700">
                You can view this form but cannot create transactions. 
                Contact an administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pre-selected Part Notice */}
      {preselectedPartId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 mr-2">ℹ️</div>
            <div>
              <span className="text-sm font-medium text-blue-800">
                Pre-selected Part: {preselectedPartId}
              </span>
              <p className="text-sm text-blue-700">
                You can change the part selection if needed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Movement Type - RBAC: ReadOnly can see but not modify */}
          <div>
            <label htmlFor="movementType" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              id="movementType"
              name="movementType"
              value={formData.movementType}
              onChange={handleInputChange}
              disabled={isReadOnly}
              className={`input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="In (Received)">📦 In (Received) - Add inventory</option>
              <option value="Out (Sold)">📤 Out (Sold) - Remove inventory</option>
              <option value="Adjustment">⚖️ Adjustment - Correct inventory</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.movementType === 'In (Received)' && 'Use this for receiving new stock from suppliers'}
              {formData.movementType === 'Out (Sold)' && 'Use this for sales transactions (usually auto-generated from invoices)'}
              {formData.movementType === 'Adjustment' && 'Use this for manual corrections or inventory counts'}
            </p>
          </div>

          {/* Part Selection - ENHANCED WITH SEARCH/AUTOCOMPLETE */}
          <div>
            <label htmlFor="partId" className="block text-sm font-medium text-gray-700 mb-1">
              Part *
            </label>
            
            <div className="relative">
              {/* Search Input */}
              <input
                type="text"
                id="partId"
                value={partSearch}
                onChange={(e) => !isReadOnly && handlePartSearch(e.target.value)}
                onFocus={() => !isReadOnly && partSearch.length >= 1 && setShowPartDropdown(filteredParts.length > 0)}
                onBlur={() => setTimeout(() => setShowPartDropdown(false), 200)} // Delay to allow click
                disabled={isReadOnly}
                className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.partId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder={isReadOnly ? "Part search disabled" : "Search by Part ID or description..."}
              />
              
              {/* Search Icon */}
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              
              {/* Dropdown Results */}
              {!isReadOnly && showPartDropdown && filteredParts.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredParts.map(part => (
                    <div
                      key={`${part.id}-${part.partId}`}
                      onClick={() => selectPart(part)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="font-medium">{part.partId}</div>
                      <div className="text-sm text-gray-600">{part.description}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {part.inventoryOnHand} | 
                        Cost: ${part.unitCost?.toFixed(2) || '0.00'} | 
                        Price: ${part.unitPrice?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show message if search has results but they're limited */}
                  {parts.filter(p => 
                    p.partId.toLowerCase().includes(partSearch.toLowerCase()) ||
                    p.description.toLowerCase().includes(partSearch.toLowerCase())
                  ).length > 10 && (
                    <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                      Showing first 10 results. Type more to narrow search.
                    </div>
                  )}
                </div>
              )}
              
              {/* No Results Message */}
              {!isReadOnly && showPartDropdown && filteredParts.length === 0 && partSearch.length >= 1 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No parts found matching "{partSearch}"
                  </div>
                </div>
              )}
            </div>
            
            {errors.partId && (
              <p className="mt-1 text-sm text-red-600">{errors.partId}</p>
            )}
          </div>

          {/* Selected Part Details - ENHANCED */}
          {selectedPart && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Part Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Part ID:</span>
                  <div className="text-gray-900">{selectedPart.partId}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Unit Cost:</span>
                  <div className="text-gray-900 font-bold">${selectedPart.unitCost?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Unit Price:</span>
                  <div className="text-gray-900 font-bold">${selectedPart.unitPrice?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Current Stock:</span>
                  <div className={`font-medium ${
                    selectedPart.inventoryOnHand === 0 ? 'text-red-600' :
                    selectedPart.inventoryOnHand <= 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedPart.inventoryOnHand} units
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Input - RBAC: ReadOnly can see but not modify */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              disabled={isReadOnly}
              min="1"
              step="1"
              placeholder="Enter quantity"
              className={`input ${errors.quantity ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Receipt Date - RBAC: ReadOnly can see but not modify */}
          <div>
            <label htmlFor="receiptDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              id="receiptDate"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleInputChange}
              disabled={isReadOnly}
              className={`input ${errors.receiptDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            {errors.receiptDate && (
              <p className="mt-1 text-sm text-red-600">{errors.receiptDate}</p>
            )}
          </div>

          {/* Supplier Input - Only for In transactions, RBAC: ReadOnly can see but not modify */}
          {(formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment') && (
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier {formData.movementType === 'In (Received)' ? '' : '(Optional)'}
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                disabled={isReadOnly}
                placeholder="Enter supplier name"
                className={`input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
            </div>
          )}

          {/* Notes - RBAC: ReadOnly can see but not modify */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              disabled={isReadOnly}
              rows={3}
              placeholder="Add any additional notes about this transaction"
              className={`input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Transaction Summary - ENHANCED WITH PROPER CALCULATIONS */}
          {formData.quantity && selectedPart && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Part:</span>
                  <div className="text-gray-900">{formData.partId}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Quantity:</span>
                  <div className={`font-medium ${transactionTypeInfo.quantityColor}`}>
                    {transactionTypeInfo.quantityPrefix}{formData.quantity}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">
                    {transactionTypeInfo.priceLabel}:
                  </span>
                  <div className="text-gray-900">
                    ${transactionTypeInfo.priceValue?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">
                    {transactionTypeInfo.totalLabel}:
                  </span>
                  <div className="text-gray-900 font-bold">${totalValue}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {transactionTypeInfo.description}
              </div>
              
              {/* Stock Impact Preview */}
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <h5 className="text-xs font-medium text-gray-700 mb-1">Stock Impact Preview</h5>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-medium">{selectedPart.inventoryOnHand} units</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Transaction:</span>
                  <span className={`font-medium ${transactionTypeInfo.quantityColor}`}>
                    {transactionTypeInfo.quantityPrefix}{formData.quantity} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-700 font-medium">New Stock Level:</span>
                  <span className="font-bold">
                    {formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment' ?
                      selectedPart.inventoryOnHand + parseFloat(formData.quantity || 0) :
                      selectedPart.inventoryOnHand - parseFloat(formData.quantity || 0)
                    } units
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions - RBAC: ReadOnly cannot submit */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            {/* Log Transaction Button - RBAC: Only Admin/User can submit */}
            {canCreate && (
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1 sm:flex-none sm:px-8"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Logging Transaction...
                  </>
                ) : (
                  <>
                    Log {formData.movementType === 'In (Received)' ? 'Inbound' :
                         formData.movementType === 'Out (Sold)' ? 'Outbound' : 'Adjustment'} Transaction
                  </>
                )}
              </button>
            )}
            
            {/* Cancel Button - RBAC: Available to all users */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn btn-secondary flex-1 sm:flex-none sm:px-8"
            >
              {isReadOnly ? 'Back to Transactions' : 'Cancel'}
            </button>
          </div>

          {/* Required Fields Note & Information */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 space-y-2">
            {canCreate && <p>* Required fields must be completed before saving</p>}
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <h5 className="text-sm font-medium text-blue-900 mb-1">Transaction Processing</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Inbound transactions:</strong> Use unit cost for inventory valuation</p>
                <p>• <strong>Outbound transactions:</strong> Use unit price for revenue calculation</p>
                <p>• <strong>Adjustments:</strong> Use unit cost for inventory correction</p>
                <p>• <strong>Inventory levels:</strong> Updated automatically after transaction</p>
                <p>• <strong>Search tip:</strong> Type part ID or description to quickly find parts</p>
                {isReadOnly && (
                  <p>• <strong>View Only:</strong> You can view transaction details but cannot create new transactions</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionForm