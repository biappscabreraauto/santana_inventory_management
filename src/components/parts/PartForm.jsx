// =================================================================
// ENHANCED PART FORM - HYBRID SOLUTION WITH DUPLICATE VALIDATION
// =================================================================
// HYBRID SOLUTION: Category field is now text with validation against Categories list
// Enhanced with cascading family/category dropdowns, automatic family display,
// and comprehensive duplicate Part ID prevention

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useCategories, usePart, useParts, useTransactions } from '../../hooks/useSharePoint'

const PartForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { createPart, updatePart } = useParts()
  const { createTransaction } = useTransactions()
  
  const isEditMode = Boolean(id)
  const pageTitle = isEditMode ? 'Edit Part' : 'Add New Part'

  // =================================================================
  // SHAREPOINT HOOKS - HYBRID SOLUTION ENHANCED
  // =================================================================
  const { 
    categories,
    categoryNames, 
    categoriesByFamily,
    getFamilyByCategory,
    validateCategory,
    loading: categoriesLoading 
  } = useCategories()
  
  const { part: sharePointPart, loading: partLoading } = usePart(isEditMode ? id : null)
  
  // Get all parts for duplicate validation
  const { parts: allParts } = useParts()

  // =================================================================
  // STATE MANAGEMENT - HYBRID SOLUTION ENHANCED
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

  // HYBRID SOLUTION: Family management state
  const [selectedFamily, setSelectedFamily] = useState('')
  const [displayFamily, setDisplayFamily] = useState('')
  const [showFamilyFirst, setShowFamilyFirst] = useState(false)

  // Transaction details for initial stock
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [transactionData, setTransactionData] = useState({
    supplier: '',
    notes: '',
    receiptDate: new Date().toISOString().split('T')[0]
  })

  // =================================================================
  // DATA LOADING AND INITIALIZATION
  // =================================================================
  useEffect(() => {
    if (isEditMode && sharePointPart) {
      loadPartData(sharePointPart)
    }
  }, [isEditMode, sharePointPart])

  // HYBRID SOLUTION: Auto-update family when category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const family = getFamilyByCategory(formData.category)
      setDisplayFamily(family || 'Unknown Family')
    } else {
      setDisplayFamily('')
    }
  }, [formData.category, getFamilyByCategory, categories])

  // Show transaction details when inventory > 0 for new parts
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
          // HYBRID SOLUTION: Category is now direct text value
          category: partData.category || '',
          inventoryOnHand: partData.inventoryOnHand || 0,
          unitCost: partData.unitCost?.toString() || '',
          unitPrice: partData.unitPrice?.toString() || '',
          status: partData.status || 'Active'
        })

        // HYBRID SOLUTION: Set family based on category
        if (partData.category) {
          const family = getFamilyByCategory(partData.category)
          setDisplayFamily(family || 'Unknown Family')
          setSelectedFamily(family || '')
        }
      }
    } catch (err) {
      console.error('Error loading part data:', err)
      error('Failed to load part data')
    }
  }

  const isLoading = loading || categoriesLoading || partLoading

  // =================================================================
  // HYBRID SOLUTION: ENHANCED DROPDOWN DATA
  // =================================================================
  
  // Get available families for dropdown
  const availableFamilies = useMemo(() => {
    return Object.keys(categoriesByFamily).sort()
  }, [categoriesByFamily])

  // Get categories for selected family
  const categoriesInSelectedFamily = useMemo(() => {
    if (!selectedFamily || !categoriesByFamily[selectedFamily]) {
      return categoryNames // Show all categories if no family selected
    }
    return categoriesByFamily[selectedFamily].map(cat => cat.category).sort()
  }, [selectedFamily, categoriesByFamily, categoryNames])

  // =================================================================
  // EVENT HANDLERS - HYBRID SOLUTION ENHANCED WITH DUPLICATE VALIDATION
  // =================================================================
  
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // REAL-TIME DUPLICATE VALIDATION for Part ID
    if (name === 'partId' && !isEditMode && allParts && allParts.length > 0) {
      const trimmedValue = processedValue.trim()
      if (trimmedValue.length >= 2) {
        const duplicatePart = allParts.find(part => 
          part.partId.toLowerCase() === trimmedValue.toLowerCase()
        )
        if (duplicatePart) {
          setErrors(prev => ({ 
            ...prev, 
            partId: `Part ID "${trimmedValue}" already exists. Choose a different Part ID.` 
          }))
        }
      }
    }
  }

  // HYBRID SOLUTION: Handle family selection (filters categories)
  const handleFamilyChange = (e) => {
    const family = e.target.value
    setSelectedFamily(family)
    
    // Clear category when family changes (except if showing family first)
    if (!showFamilyFirst) {
      setFormData(prev => ({ ...prev, category: '' }))
      setDisplayFamily('')
    }
  }

  // HYBRID SOLUTION: Handle category selection with validation
  const handleCategoryChange = async (e) => {
    const category = e.target.value
    
    // Update form data
    setFormData(prev => ({ ...prev, category }))
    setTouched(prev => ({ ...prev, category: true }))

    // Clear category error
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }))
    }

    // HYBRID SOLUTION: Validate category against Categories list
    if (category && categories.length > 0) {
      try {
        const isValid = await validateCategory(category)
        if (!isValid) {
          setErrors(prev => ({ 
            ...prev, 
            category: `"${category}" is not a valid category. Please select from the dropdown.` 
          }))
        } else {
          // Auto-set family when valid category is selected
          const family = getFamilyByCategory(category)
          if (family && family !== selectedFamily) {
            setSelectedFamily(family)
          }
        }
      } catch (err) {
        console.error('Category validation error:', err)
      }
    }
  }

  // Handle transaction data changes
  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    setTransactionData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Toggle between family-first and category-first selection modes
  const toggleSelectionMode = () => {
    setShowFamilyFirst(!showFamilyFirst)
    setSelectedFamily('')
    setFormData(prev => ({ ...prev, category: '' }))
    setDisplayFamily('')
  }

  // =================================================================
  // VALIDATION - HYBRID SOLUTION ENHANCED WITH DUPLICATE CHECK
  // =================================================================
  
  const validateForm = async () => {
    const newErrors = {}

    // Part ID validation
    if (!formData.partId.trim()) {
      newErrors.partId = 'Part ID is required'
    } else if (formData.partId.length < 2) {
      newErrors.partId = 'Part ID must be at least 2 characters'
    } else if (!/^[A-Za-z0-9\-_.]+$/.test(formData.partId)) {
      newErrors.partId = 'Part ID can only contain letters, numbers, dashes (-), underscores (_), and periods (.)'
    } else {
      // DUPLICATE VALIDATION: Check if Part ID already exists (only for new parts)
      if (!isEditMode && allParts && allParts.length > 0) {
        const duplicatePart = allParts.find(part => 
          part.partId.toLowerCase() === formData.partId.toLowerCase().trim()
        )
        if (duplicatePart) {
          newErrors.partId = `Part ID "${formData.partId}" already exists. Part IDs must be unique.`
        }
      }
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters'
    }

    // HYBRID SOLUTION: Enhanced category validation
    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Category is required'
    } else {
      try {
        const isValidCategory = await validateCategory(formData.category)
        if (!isValidCategory) {
          newErrors.category = `"${formData.category}" is not a valid category. Please select from the available categories.`
        }
      } catch (err) {
        newErrors.category = 'Unable to validate category. Please check your selection.'
      }
    }

    // Inventory validation
    if (formData.inventoryOnHand < 0) {
      newErrors.inventoryOnHand = 'Inventory cannot be negative'
    }

    // Cost validation
    if (!formData.unitCost || formData.unitCost === '') {
      newErrors.unitCost = 'Unit cost is required'
    } else {
      const costValue = parseFloat(formData.unitCost)
      if (isNaN(costValue) || costValue < 0) {
        newErrors.unitCost = 'Unit cost must be a valid positive number'
      }
    }

    // Price validation
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

    // Transaction validation for initial stock
    if (!isEditMode && formData.inventoryOnHand > 0) {
      if (!transactionData.receiptDate) {
        newErrors.receiptDate = 'Receipt date is required for initial stock'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =================================================================
  // FORM SUBMISSION - HYBRID SOLUTION READY
  // =================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isValid = await validateForm()
    if (!isValid) {
      error('Please fix the validation errors before submitting')
      return
    }

    try {
      setSaving(true)

      // Convert string values to numbers for submission
      const submissionData = {
        ...formData,
        // HYBRID SOLUTION: Category submitted as direct text value
        category: formData.category.trim(),
        unitCost: parseFloat(formData.unitCost) || 0,
        unitPrice: parseFloat(formData.unitPrice) || 0
      }

      console.log('Saving part data:', submissionData)

      if (isEditMode) {
        await updatePart(id, submissionData)
        success('Part updated successfully!')
      } else {
        await createPart(submissionData)
        
        // Create initial stock transaction if needed
        const willCreateTransaction = formData.inventoryOnHand > 0
        
        if (willCreateTransaction) {
          console.log('Creating initial stock transaction for hybrid solution')
          
          await createTransaction({
            partId: submissionData.partId,
            movementType: 'In (Received)',
            quantity: submissionData.inventoryOnHand,
            unitCost: submissionData.unitCost,
            supplier: transactionData.supplier || 'Initial Stock',
            notes: transactionData.notes || 'Initial inventory setup'
          })
          
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

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  
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

  // Generate alternative Part ID suggestions when there's a duplicate
  const getAlternativePartIds = (basePartId) => {
    if (!allParts || !basePartId) return []
    
    const suggestions = []
    const base = basePartId.trim()
    
    // Try adding numbers
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${base}-${i}`
      const exists = allParts.find(part => 
        part.partId.toLowerCase() === suggestion.toLowerCase()
      )
      if (!exists) {
        suggestions.push(suggestion)
        if (suggestions.length >= 3) break
      }
    }
    
    // Try adding letters
    if (suggestions.length < 3) {
      const letters = ['A', 'B', 'C', 'X', 'Y', 'Z']
      for (const letter of letters) {
        const suggestion = `${base}${letter}`
        const exists = allParts.find(part => 
          part.partId.toLowerCase() === suggestion.toLowerCase()
        )
        if (!exists) {
          suggestions.push(suggestion)
          if (suggestions.length >= 3) break
        }
      }
    }
    
    return suggestions.slice(0, 3)
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading form data...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update part information and inventory details'
              : 'Add a new part to your inventory with enhanced duplicate protection'
            }
          </p>
        </div>
        
        <Link to="/parts" className="btn btn-secondary">
          Back to Parts
        </Link>
      </div>

      {/* HYBRID SOLUTION: Category Selection Mode Toggle */}
      {!isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Category Selection Mode</h3>
              <p className="text-sm text-blue-700">
                Choose how you want to select the category for this part
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSelectionMode}
              className="btn btn-outline"
            >
              {showFamilyFirst ? 'Switch to Category First' : 'Switch to Family First'}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Basic Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Part ID with Duplicate Validation */}
              <div>
                <label htmlFor="partId" className="block text-sm font-medium text-gray-700 mb-1">
                  Part ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="partId"
                    name="partId"
                    value={formData.partId}
                    onChange={handleInputChange}
                    placeholder="e.g., BH001"
                    className={`input pr-10 ${errors.partId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    disabled={isEditMode}
                  />
                  {/* Availability Indicator */}
                  {!isEditMode && formData.partId.trim().length >= 2 && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {allParts && allParts.find(part => 
                        part.partId.toLowerCase() === formData.partId.toLowerCase().trim()
                      ) ? (
                        <span className="text-red-500" title="Part ID already exists">❌</span>
                      ) : (
                        <span className="text-green-500" title="Part ID available">✅</span>
                      )}
                    </div>
                  )}
                </div>
                {errors.partId && (
                  <div className="mt-1">
                    <p className="text-sm text-red-600">{errors.partId}</p>
                    {/* Alternative Part ID Suggestions */}
                    {errors.partId.includes('already exists') && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 font-medium mb-2">Try these available alternatives:</p>
                        <div className="flex flex-wrap gap-2">
                          {getAlternativePartIds(formData.partId).map(suggestion => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, partId: suggestion }))}
                              className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-full text-sm text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!isEditMode && !errors.partId && formData.partId.trim().length >= 2 && (
                  <p className="mt-1 text-sm text-green-600">✅ Part ID available</p>
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

          {/* HYBRID SOLUTION: Enhanced Category Selection Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Category & Family Selection
            </h3>
            
            {showFamilyFirst ? (
              /* Family-First Selection Mode */
              <div className="space-y-4">
                {/* Family Selection */}
                <div>
                  <label htmlFor="family" className="block text-sm font-medium text-gray-700 mb-1">
                    1. Select Family First
                  </label>
                  <select
                    id="family"
                    value={selectedFamily}
                    onChange={handleFamilyChange}
                    className="input"
                  >
                    <option value="">Select a family...</option>
                    {availableFamilies.map(family => (
                      <option key={family} value={family}>{family}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose the automotive system family first to filter categories
                  </p>
                </div>

                {/* Category Selection (Filtered) */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    2. Select Category *
                    {selectedFamily && (
                      <span className="text-blue-600 ml-2">
                        (from {selectedFamily} family)
                      </span>
                    )}
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className={`input ${errors.category ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    disabled={!selectedFamily}
                  >
                    <option value="">
                      {selectedFamily ? 'Select a category...' : 'Please select a family first'}
                    </option>
                    {categoriesInSelectedFamily.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {!selectedFamily && (
                    <p className="mt-1 text-sm text-gray-500">
                      Select a family above to see available categories
                    </p>
                  )}
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Category-First Selection Mode */
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className={`input ${errors.category ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  >
                    <option value="">Select a category...</option>
                    {categoryNames.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Optional Family Filter */}
                {availableFamilies.length > 0 && (
                  <div>
                    <label htmlFor="familyFilter" className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Family (Optional)
                    </label>
                    <select
                      id="familyFilter"
                      value={selectedFamily}
                      onChange={handleFamilyChange}
                      className="input"
                    >
                      <option value="">Show all categories</option>
                      {availableFamilies.map(family => (
                        <option key={family} value={family}>{family}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Optional: Filter categories by automotive system family
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* HYBRID SOLUTION: Family Display */}
            {displayFamily && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <div className="text-green-600 mr-2">✓</div>
                  <div>
                    <span className="text-sm font-medium text-green-800">
                      Family: {displayFamily}
                    </span>
                    <p className="text-sm text-green-700">
                      Category "{formData.category}" belongs to the {displayFamily} family
                    </p>
                  </div>
                </div>
              </div>
            )}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Initial Stock Transaction Details */}
          {!isEditMode && showTransactionDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                Initial Stock Transaction
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

          {/* HYBRID SOLUTION: Preview Card */}
          {(formData.partId || formData.description || formData.category) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Part Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-medium">Part ID:</span> {formData.partId || 'Not set'}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Status:</span> {formData.status}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Category:</span> {formData.category || 'Not selected'}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">Family:</span> 
                  <span className={displayFamily ? 'text-green-600 ml-1' : 'text-gray-400 ml-1'}>
                    {displayFamily || 'Will be determined by category'}
                  </span>
                </div>
                {formData.description && (
                  <div className="md:col-span-2">
                    <span className="text-gray-700 font-medium">Description:</span> {formData.description}
                  </div>
                )}
                <div>
                  <span className="text-gray-700 font-medium">Unit Price:</span> ${formData.unitPrice || '0.00'}
                </div>
                <div>
                  <span className="text-gray-700 font-medium">On Hand:</span> {formData.inventoryOnHand} units
                  {!isEditMode && formData.inventoryOnHand > 0 && (
                    <span className="text-blue-600 ml-2">(+ transaction will be created)</span>
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
                  {isEditMode ? 'Update Part' : 'Create Part'}
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
                View Details
              </Link>
            )}
          </div>

          {/* Required Fields Note & Enhanced Validation Info */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 space-y-2">
            <p>* Required fields must be completed before saving</p>
            {isEditMode && (
              <p>Part ID cannot be changed after creation to maintain data integrity</p>
            )}
            {!isEditMode && (
              <p className="text-blue-600">
                🔒 Part IDs are automatically checked for uniqueness to prevent duplicates
              </p>
            )}
            {!isEditMode && formData.inventoryOnHand > 0 && (
              <p className="text-blue-600">
                📦 An initial stock transaction will be created automatically for audit tracking
              </p>
            )}
            {/* HYBRID SOLUTION: Information note */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <h5 className="text-sm font-medium text-blue-900 mb-1">Enhanced Validation Active</h5>
              <p className="text-sm text-blue-700">
                • Part IDs are validated for uniqueness across your entire inventory
              </p>
              <p className="text-sm text-blue-700">
                • Categories are validated against the master Categories list
              </p>
              <p className="text-sm text-blue-700">
                • Family information is automatically determined based on your category selection
              </p>
              {displayFamily && (
                <p className="text-sm text-blue-600 mt-1">
                  Current selection: <strong>{formData.category}</strong> → <strong>{displayFamily}</strong> family
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartForm