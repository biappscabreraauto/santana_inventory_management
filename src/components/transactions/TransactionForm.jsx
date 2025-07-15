// =================================================================
// COMPLETE REVISED TRANSACTION FORM - FIXED CALCULATIONS
// =================================================================
// Component for logging inbound inventory movements and adjustments
// Fixed price/cost calculations based on movement type

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useTransactions, useParts } from '../../hooks/useSharePoint'

const TransactionForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, error } = useToast()
  const { createTransaction } = useTransactions()
  const { parts, loading: partsLoading } = useParts()

  // Get pre-selected part ID from URL params (when clicked from parts table)
  const preselectedPartId = searchParams.get('partId')

  // =================================================================
  // FORM STATE
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

  // Get selected part details
  const selectedPart = parts.find(part => part.partId === formData.partId)

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
      
      success(`Transaction logged successfully! ${actionText} ${formData.quantity} units.`)
      navigate('/transactions')
      
    } catch (err) {
      console.error('Error creating transaction:', err)
      error('Failed to log transaction. Please try again.')
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

  const transactionTypeInfo = getTransactionTypeInfo()

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formData.movementType === 'In (Received)' ? 'Log Inbound Parts' :
             formData.movementType === 'Out (Sold)' ? 'Log Outbound Parts' :
             'Log Inventory Adjustment'}
          </h1>
          <p className="text-gray-600">
            {formData.movementType === 'In (Received)' ? 'Record received inventory from suppliers' :
             formData.movementType === 'Out (Sold)' ? 'Record sold inventory to customers' :
             'Record manual inventory adjustments'}
          </p>
        </div>
        
        <button
          onClick={handleCancel}
          className="btn btn-secondary"
        >
          Back to Transactions
        </button>
      </div>

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
          
          {/* Movement Type - UPDATED for better UX */}
          <div>
            <label htmlFor="movementType" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              id="movementType"
              name="movementType"
              value={formData.movementType}
              onChange={handleInputChange}
              className="input"
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

          {/* Part Selection */}
          <div>
            <label htmlFor="partId" className="block text-sm font-medium text-gray-700 mb-1">
              Part *
            </label>
            <select
              id="partId"
              name="partId"
              value={formData.partId}
              onChange={handleInputChange}
              className={`input ${errors.partId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
            >
              <option value="">Select a part...</option>
              {parts
                .filter((part, index, self) => 
                  // Remove duplicates by partId - keep first occurrence
                  index === self.findIndex(p => p.partId === part.partId)
                )
                .map(part => (
                  <option key={`${part.id}-${part.partId}`} value={part.partId}>
                    {part.partId} - {part.description} 
                    (Cost: ${part.unitCost?.toFixed(2) || '0.00'}, 
                     Price: ${part.unitPrice?.toFixed(2) || '0.00'})
                  </option>
                ))
              }
            </select>
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
              <div className="mt-2">
                <span className="text-gray-600 font-medium">Description:</span>
                <div className="text-gray-900">{selectedPart.description}</div>
              </div>
              <div className="mt-2">
                <span className="text-gray-600 font-medium">Category:</span>
                <div className="text-gray-900">{selectedPart.category}</div>
              </div>
            </div>
          )}

          {/* Quantity */}
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
              min="1"
              step="1"
              placeholder="0"
              className={`input ${errors.quantity ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="receiptDate" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Date *
            </label>
            <input
              type="date"
              id="receiptDate"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleInputChange}
              className={`input ${errors.receiptDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
            />
            {errors.receiptDate && (
              <p className="mt-1 text-sm text-red-600">{errors.receiptDate}</p>
            )}
          </div>

          {/* Supplier - CONDITIONAL DISPLAY */}
          {(formData.movementType === 'In (Received)' || formData.movementType === 'Adjustment') && (
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                placeholder="e.g., Parts Warehouse Inc"
                className="input"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes about this transaction..."
              className="input"
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

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
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
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn btn-secondary flex-1 sm:flex-none sm:px-8"
            >
              Cancel
            </button>
          </div>

          {/* Required Fields Note & Information */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 space-y-2">
            <p>* Required fields must be completed before saving</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <h5 className="text-sm font-medium text-blue-900 mb-1">Transaction Processing</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Inbound transactions:</strong> Use unit cost for inventory valuation</p>
                <p>• <strong>Outbound transactions:</strong> Use unit price for revenue calculation</p>
                <p>• <strong>Adjustments:</strong> Use unit cost for inventory correction</p>
                <p>• <strong>Inventory levels:</strong> Updated automatically after transaction</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionForm