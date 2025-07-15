// =================================================================
// TRANSACTION FORM - LOG INBOUND PARTS (REVISED)
// =================================================================
// Component for logging inbound inventory movements and adjustments
// Uses the unit cost already defined in the part (no duplicate entry)

import React, { useState, useEffect } from 'react'
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
      newErrors.receiptDate = 'Receipt date is required'
    }

    // Check if selected part exists and has unit cost
    if (formData.partId && selectedPart && (!selectedPart.unitCost || selectedPart.unitCost <= 0)) {
      newErrors.partId = 'Selected part must have a valid unit cost set in the Parts catalog'
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

      const transactionData = {
        partId: formData.partId,
        movementType: formData.movementType,
        quantity: parseFloat(formData.quantity),
        unitCost: selectedPart.unitCost, // Use the unit cost from the part
        // Store supplier info in notes since supplier field doesn't exist in SharePoint
        notes: formData.supplier 
          ? `${formData.notes ? formData.notes + ' | ' : ''}Supplier: ${formData.supplier}`
          : formData.notes || `${formData.movementType} - ${formData.quantity} units`
      }

      await createTransaction(transactionData)
      success(`Transaction logged successfully! Added ${formData.quantity} units to inventory.`)
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
  // CALCULATED VALUES
  // =================================================================
  const totalValue = selectedPart && formData.quantity 
    ? (formData.quantity * selectedPart.unitCost).toFixed(2)
    : '0.00'

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
  // RENDER
  // =================================================================
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Inbound Parts</h1>
          <p className="text-gray-600">
            Record received inventory from suppliers or manual adjustments
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
                    {part.partId} - {part.description} (Cost: ${part.unitCost?.toFixed(2) || '0.00'})
                  </option>
                ))
              }
            </select>
            {errors.partId && (
              <p className="mt-1 text-sm text-red-600">{errors.partId}</p>
            )}
          </div>

          {/* Selected Part Details */}
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
                  <span className="text-gray-600 font-medium">Current Stock:</span>
                  <div className="text-gray-900">{selectedPart.inventoryOnHand} units</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Category:</span>
                  <div className="text-gray-900">{selectedPart.category}</div>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-gray-600 font-medium">Description:</span>
                <div className="text-gray-900">{selectedPart.description}</div>
              </div>
            </div>
          )}

          {/* Movement Type */}
          <div>
            <label htmlFor="movementType" className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type
            </label>
            <select
              id="movementType"
              name="movementType"
              value={formData.movementType}
              onChange={handleInputChange}
              className="input"
            >
              <option value="In (Received)">In (Received)</option>
              <option value="Adjustment">Adjustment</option>
            </select>
          </div>

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

          {/* Receipt Date */}
          <div>
            <label htmlFor="receiptDate" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Date *
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

          {/* Supplier */}
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

          {/* Transaction Summary */}
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
                  <div className="text-green-600 font-medium">+{formData.quantity}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Unit Cost:</span>
                  <div className="text-gray-900">${selectedPart.unitCost?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Total Value:</span>
                  <div className="text-gray-900 font-bold">${totalValue}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Unit cost is automatically taken from the part's catalog entry
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
                'Log Transaction'
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

          {/* Required Fields Note */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>* Required fields must be completed before saving</p>
            <p className="text-blue-600 mt-1">
              This transaction will automatically update the part's inventory quantity using the unit cost from the part catalog
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionForm