import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useCategories, usePart } from '../../hooks/useSharePoint'

// =================================================================
// PART FORM COMPONENT
// =================================================================
const PartForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  
  const isEditMode = Boolean(id)
  const pageTitle = isEditMode ? 'Edit Part' : 'Add New Part'

  // =================================================================
  // SHAREPOINT HOOKS (ADD AFTER OTHER HOOKS)
  // =================================================================
  const { categoryNames: categories, loading: categoriesLoading } = useCategories()
  const { part: sharePointPart, loading: partLoading } = usePart(isEditMode ? id : null)

  // =================================================================
  // STATE MANAGEMENT
  // =================================================================
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

  // =================================================================
  // DATA FETCHING (REVISED)
  // =================================================================
  useEffect(() => {
    if (isEditMode && sharePointPart) {
      loadPartData(sharePointPart)
    }
  }, [isEditMode, sharePointPart])


  const loadPartData = (partData) => {
    try {
      if (partData) {
        // Use real SharePoint data
        setFormData({
          partId: partData.partId || '',
          description: partData.description || '',
          category: partData.category || '',
          inventoryOnHand: partData.inventoryOnHand || 0,
          unitCost: partData.unitCost?.toString() || '',
          unitPrice: partData.unitPrice?.toString() || '',
          status: partData.status || 'Active'
        })
      } else {
        // Mock data fallback for testing
        const mockPartData = {
          partId: 'BH001',
          description: 'Brake Hose - Front Left',
          category: 'Brake Hose',
          inventoryOnHand: 5,
          unitCost: '25.99',
          unitPrice: '45.99',
          status: 'Active'
        }
        setFormData(mockPartData)
      }
    } catch (err) {
      console.error('Error loading part data:', err)
      error('Failed to load part data')
    }
  }

  // Use combined loading state
  const isLoading = loading || categoriesLoading || partLoading

  // =================================================================
  // FORM VALIDATION
  // =================================================================
  const validateForm = () => {
    const newErrors = {}

    // Part ID validation
    if (!formData.partId.trim()) {
      newErrors.partId = 'Part ID is required'
    } else if (formData.partId.length < 2) {
      newErrors.partId = 'Part ID must be at least 2 characters'
    } else if (!/^[A-Z0-9]+$/i.test(formData.partId)) {
      newErrors.partId = 'Part ID can only contain letters and numbers'
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters'
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    // Inventory validation
    if (formData.inventoryOnHand < 0) {
      newErrors.inventoryOnHand = 'Inventory cannot be negative'
    }

    // Unit cost validation
    if (!formData.unitCost) {
      newErrors.unitCost = 'Unit cost is required'
    } else if (isNaN(formData.unitCost) || parseFloat(formData.unitCost) < 0) {
      newErrors.unitCost = 'Unit cost must be a valid positive number'
    }

    // Unit price validation
    if (!formData.unitPrice) {
      newErrors.unitPrice = 'Unit price is required'
    } else if (isNaN(formData.unitPrice) || parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Unit price must be a valid positive number'
    } else if (parseFloat(formData.unitPrice) < parseFloat(formData.unitCost)) {
      newErrors.unitPrice = 'Unit price should not be less than unit cost'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value)) : value
    }))

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }))

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      error('Please fix the validation errors before submitting')
      return
    }

    try {
      setSaving(true)

      // TODO: Replace with actual SharePoint API call
      console.log('Saving part data:', formData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (isEditMode) {
        success('Part updated successfully!')
      } else {
        success('Part created successfully!')
      }

      // Navigate back to parts list
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

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // =================================================================
  // RENDER
  // =================================================================
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
                  disabled={isEditMode} // Don't allow editing Part ID
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
                    type="number"
                    id="unitCost"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`input pl-8 ${errors.unitCost ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
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
                    type="number"
                    id="unitPrice"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`input pl-8 ${errors.unitPrice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
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
                  Quantity On Hand
                </label>
                <input
                  type="number"
                  id="inventoryOnHand"
                  name="inventoryOnHand"
                  value={formData.inventoryOnHand}
                  onChange={handleInputChange}
                  min="0"
                  className={`input ${errors.inventoryOnHand ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
                {errors.inventoryOnHand && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventoryOnHand}</p>
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

          {/* Summary Card */}
          {(formData.partId || formData.description) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Part:</span> {formData.partId || 'Not set'}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Category:</span> {formData.category || 'Not selected'}
                </div>
                <div className="md:col-span-2">
                  <span className="text-blue-700 font-medium">Description:</span> {formData.description || 'Not set'}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Price:</span> ${formData.unitPrice || '0.00'}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">On Hand:</span> {formData.inventoryOnHand} units
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
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartForm