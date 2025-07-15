// =================================================================
// ENHANCED PART FORM - AUTOMATIC TRANSACTION CREATION
// =================================================================
// When creating a new part with inventory > 0, automatically create
// an "Initial Stock" transaction for proper audit trail

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useCategories, usePart } from '../../hooks/useSharePoint'

const PartForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  
  const isEditMode = Boolean(id)
  const pageTitle = isEditMode ? 'Edit Part' : 'Add New Part'

  // SharePoint hooks
  const { categoryNames: categories, loading: categoriesLoading } = useCategories()
  const { part: sharePointPart, loading: partLoading } = usePart(isEditMode ? id : null)

  // State management
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    partId: '',
    description: '',
    category: '',
    inventoryOnHand: 0,
    unitCost: '',
    unitPrice: '',
    status: 'Active'
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // NEW: Transaction details for initial stock
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [transactionData, setTransactionData] = useState({
    supplier: '',
    notes: '',
    receiptDate: new Date().toISOString().split('T')[0]
  })

  // Data loading
  useEffect(() => {
    if (isEditMode && sharePointPart) {
      loadPartData(sharePointPart)
    }
  }, [isEditMode, sharePointPart])

  // NEW: Show transaction details when inventory > 0
  useEffect(() => {
    if (!isEditMode && formData.inventoryOnHand > 0) {
      setShowTransactionDetails(true)
    } else if (!isEditMode && formData.inventoryOnHand === 0) {
      setShowTransactionDetails(false)
    }
  }, [formData.inventoryOnHand, isEditMode])

  const loadPartData = (partData) => {
    try {
      if (partData) {
        setFormData({
          partId: partData.partId || '',
          description: partData.description || '',
          category: partData.category || '',
          inventoryOnHand: partData.inventoryOnHand || 0,
          unitCost: partData.unitCost?.toString() || '',
          unitPrice: partData.unitPrice?.toString() || '',
          status: partData.status || 'Active'
        })
      }
    } catch (err) {
      console.error('Error loading part data:', err)
      error('Failed to load part data')
    }
  }

  const isLoading = loading || categoriesLoading || partLoading

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    
    let processedValue = value
    
    if (type === 'number' && name === 'inventoryOnHand') {
      processedValue = value === '' ? 0 : parseInt(value, 10) || 0
    } else if (name === 'unitCost' || name === 'unitPrice') {
      processedValue = value
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
        return
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    setTouched(prev => ({ ...prev, [name]: true }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // NEW: Handle transaction data changes
  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    setTransactionData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Enhanced validation
  const validateForm = () => {
    const newErrors = {}

    // Part validation (same as before)
    if (!formData.partId.trim()) {
      newErrors.partId = 'Part ID is required'
    } else if (formData.partId.length < 2) {
      newErrors.partId = 'Part ID must be at least 2 characters'
    } else if (!/^[A-Z0-9]+$/i.test(formData.partId)) {
      newErrors.partId = 'Part ID can only contain letters and numbers'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.inventoryOnHand < 0) {
      newErrors.inventoryOnHand = 'Inventory cannot be negative'
    }

    if (!formData.unitCost || formData.unitCost === '') {
      newErrors.unitCost = 'Unit cost is required'
    } else {
      const costValue = parseFloat(formData.unitCost)
      if (isNaN(costValue) || costValue < 0) {
        newErrors.unitCost = 'Unit cost must be a valid positive number'
      }
    }

    if (!formData.unitPrice || formData.unitPrice === '') {
      newErrors.unitPrice = 'Unit price is required'
    } else {
      const priceValue = parseFloat(formData.unitPrice)
      const costValue = parseFloat(formData.unitCost)
      
      if (isNaN(priceValue) || priceValue < 0) {
        newErrors.unitPrice = 'Unit price must be a valid positive number'
      } else if (!isNaN(costValue) && priceValue < costValue) {
        newErrors.unitPrice = 'Unit price should not be less than unit cost'
      }
    }

    // NEW: Transaction validation for initial stock
    if (!isEditMode && formData.inventoryOnHand > 0) {
      if (!transactionData.receiptDate) {
        newErrors.receiptDate = 'Receipt date is required for initial stock'
      }
      // Supplier and notes are optional but recommended
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enhanced form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      error('Please fix the validation errors before submitting')
      return
    }

    try {
      setSaving(true)

      // Convert string values to numbers for submission
      const submissionData = {
        ...formData,
        unitCost: parseFloat(formData.unitCost) || 0,
        unitPrice: parseFloat(formData.unitPrice) || 0
      }

      console.log('Saving part data:', submissionData)

      // NEW: Check if we need to create initial stock transaction
      const willCreateTransaction = !isEditMode && formData.inventoryOnHand > 0

      if (willCreateTransaction) {
        console.log('Will create initial stock transaction:', {
          partId: submissionData.partId,
          quantity: submissionData.inventoryOnHand,
          unitCost: submissionData.unitCost,
          movementType: 'In (Received)',
          supplier: transactionData.supplier || 'Initial Stock',
          notes: transactionData.notes || 'Initial inventory setup',
          receiptDate: transactionData.receiptDate
        })
      }
      
      // TODO: In real implementation, this would:
      // 1. Create the part in SharePoint
      // 2. If inventoryOnHand > 0, create transaction record
      // 3. Both operations should be atomic (succeed together or fail together)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (isEditMode) {
        success('Part updated successfully!')
      } else {
        if (willCreateTransaction) {
          success(`Part created successfully! Initial stock transaction recorded for ${formData.inventoryOnHand} units.`)
        } else {
          success('Part created successfully!')
        }
      }

      navigate('/parts')
      
    } catch (err) {
      console.error('Error saving part:', err)
      error('Failed to save part. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/parts')
  }

  // Utility functions
  const calculateMargin = () => {
    const cost = parseFloat(formData.unitCost) || 0
    const price = parseFloat(formData.unitPrice) || 0
    
    if (cost === 0) return 0
    return ((price - cost) / cost * 100).toFixed(1)
  }

  const calculateValue = () => {
    const quantity = formData.inventoryOnHand || 0
    const cost = parseFloat(formData.unitCost) || 0
    return (quantity * cost).toFixed(2)
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update part information and inventory details'
              : 'Add a new part to your inventory'
            }
          </p>
        </div>
        
        <Link to="/parts" className="btn btn-secondary">
          ← Back to Parts
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Part ID */}
              <div>
                <label htmlFor="partId" className="block text-sm font-medium text-gray-700 mb-1">
                  Part ID *
                </label>
                <input
                  type="text"
                  id="partId"
                  name="partId"
                  value={formData.partId}
                  onChange={handleInputChange}
                  placeholder="e.g., BH001"
                  className={`input ${errors.partId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isEditMode}
                />
                {errors.partId && (
                  <p className="mt-1 text-sm text-red-600">{errors.partId}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`input ${errors.category ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Description - Full Width */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Detailed description of the part..."
                  className={`input ${errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pricing Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unit Cost */}
              <div>
                <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    id="unitCost"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`input pl-8 ${errors.unitCost ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    pattern="[0-9]*\.?[0-9]*"
                    inputMode="decimal"
                  />
                </div>
                {errors.unitCost && (
                  <p className="mt-1 text-sm text-red-600">{errors.unitCost}</p>
                )}
              </div>

              {/* Unit Price */}
              <div>
                <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    id="unitPrice"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`input pl-8 ${errors.unitPrice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    pattern="[0-9]*\.?[0-9]*"
                    inputMode="decimal"
                  />
                </div>
                {errors.unitPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
                )}
              </div>

              {/* Margin Calculation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit Margin
                </label>
                <div className="input bg-gray-50 text-gray-700 font-medium">
                  {calculateMargin()}%
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Calculated automatically
                </p>
              </div>
            </div>
          </div>

          {/* Inventory Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Inventory Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Inventory On Hand */}
              <div>
                <label htmlFor="inventoryOnHand" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Quantity {!isEditMode && <span className="text-blue-600">(Optional)</span>}
                </label>
                <input
                  type="number"
                  id="inventoryOnHand"
                  name="inventoryOnHand"
                  value={formData.inventoryOnHand}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className={`input ${errors.inventoryOnHand ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
                {errors.inventoryOnHand && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventoryOnHand}</p>
                )}
                {!isEditMode && (
                  <p className="mt-1 text-xs text-gray-500">
                    Set to 0 if you'll receive inventory later
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="Active">Active</option>
                  <option value="Obsolete">Obsolete</option>
                  <option value="Disposed">Disposed</option>
                </select>
              </div>

              {/* Total Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Inventory Value
                </label>
                <div className="input bg-gray-50 text-gray-700 font-medium">
                  ${calculateValue()}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Quantity × Unit Cost
                </p>
              </div>
            </div>
          </div>

          {/* NEW: Initial Stock Transaction Details */}
          {!isEditMode && showTransactionDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                📦 Initial Stock Transaction
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Since you're adding {formData.inventoryOnHand} units, we'll create an initial stock transaction for audit tracking.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Receipt Date */}
                <div>
                  <label htmlFor="receiptDate" className="block text-sm font-medium text-blue-700 mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    id="receiptDate"
                    name="receiptDate"
                    value={transactionData.receiptDate}
                    onChange={handleTransactionChange}
                    className={`input ${errors.receiptDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  />
                  {errors.receiptDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.receiptDate}</p>
                  )}
                </div>

                {/* Supplier */}
                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-blue-700 mb-1">
                    Supplier <span className="text-blue-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={transactionData.supplier}
                    onChange={handleTransactionChange}
                    placeholder="e.g., Parts Warehouse Inc"
                    className="input"
                  />
                </div>

                {/* Transaction Type (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Transaction Type
                  </label>
                  <div className="input bg-blue-100 text-blue-800 font-medium">
                    In (Received)
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-3">
                  <label htmlFor="notes" className="block text-sm font-medium text-blue-700 mb-1">
                    Notes <span className="text-blue-500">(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={transactionData.notes}
                    onChange={handleTransactionChange}
                    rows={2}
                    placeholder="e.g., Initial inventory setup, Opening stock count..."
                    className="input"
                  />
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Transaction Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Part:</span> {formData.partId || 'TBD'}
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Quantity:</span> +{formData.inventoryOnHand}
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Unit Cost:</span> ${formData.unitCost || '0.00'}
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Total Value:</span> ${calculateValue()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Card */}
          {(formData.partId || formData.description) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-medium">Part:</span> {formData.partId || 'Not set'}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Category:</span> {formData.category || 'Not selected'}
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-700 font-medium">Description:</span> {formData.description || 'Not set'}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Price:</span> ${formData.unitPrice || '0.00'}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">On Hand:</span> {formData.inventoryOnHand} units
                  {!isEditMode && formData.inventoryOnHand > 0 && (
                    <span className="text-blue-600 ml-2">(+ transaction)</span>
                  )}
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
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? '💾 Update Part' : '➕ Create Part'}
                  {!isEditMode && formData.inventoryOnHand > 0 && ' + Transaction'}
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

            {isEditMode && (
              <Link
                to={`/parts/${id}`}
                className="btn btn-outline flex-1 sm:flex-none sm:px-8 text-center"
              >
                👁️ View Details
              </Link>
            )}
          </div>

          {/* Required Fields Note */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>* Required fields must be completed before saving</p>
            {isEditMode && (
              <p className="mt-1">Part ID cannot be changed after creation</p>
            )}
            {!isEditMode && formData.inventoryOnHand > 0 && (
              <p className="mt-1 text-blue-600">💡 An initial stock transaction will be created automatically</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartForm