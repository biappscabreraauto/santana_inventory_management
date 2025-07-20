// =================================================================
// ENHANCED PART FORM - HYBRID SOLUTION WITH ACCESS CONTROL
// =================================================================
// HYBRID SOLUTION: Category field is now text with validation against Categories list
// Enhanced with cascading family/category dropdowns, automatic family display,
// comprehensive duplicate Part ID prevention, and role-based access control

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'
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
  // ACCESS CONTROL - ROLE-BASED PERMISSIONS
  // =================================================================
  const { 
    canAccess, 
    canCreate, 
    canEdit, 
    canView,
    isReadOnly, 
    isUser, 
    isAdmin,
    userRole 
  } = useRoleAccess('User') // Require User level access for part creation/editing

  // Early return if no access - ReadOnly users cannot create/edit parts
  if (!canAccess || (isReadOnly && !isEditMode)) {
    return <RoleProtected requiredRole="User" />
  }

  // For edit mode, ReadOnly users should be redirected to view mode
  if (isEditMode && isReadOnly) {
    navigate(`/parts/${id}`)
    return null
  }

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
    status: 'Active',
    supplier: '',
    notes: ''
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
  // ACCESS POINT HELPER FUNCTIONS
  // =================================================================
  
  // Check if specific field is editable based on role
  const canEditField = (fieldName) => {
    if (isReadOnly) return false
    
    switch (fieldName) {
      case 'partId':
        return (canCreate && !isEditMode) || (canEdit && isEditMode)
      case 'description':
      case 'category':
      case 'unitPrice':
      case 'supplier':
      case 'notes':
        return canEdit || canCreate
      case 'unitCost':
      // Creation mode: both Admin and User can set unit cost
      // Edit mode: only Admin can modify unit cost
        return isAdmin || (!isEditMode && isUser)
      case 'status':
        return isAdmin // Admin only fields
      case 'inventoryOnHand':
        return (canCreate && !isEditMode) // Create only
      default:
        return canEdit || canCreate
    }
  }

  // Check if action button should be available
  const canPerformAction = (actionType) => {
    switch (actionType) {
      case 'create':
        return canCreate && !isEditMode && !isReadOnly
      case 'update':
        return canEdit && isEditMode && !isReadOnly
      case 'cancel':
      case 'viewDetails':
        return true // Available to all users
      case 'automaticTransaction':
        return (canCreate || canEdit) && !isReadOnly
      default:
        return false
    }
  }

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
    if (!isEditMode && formData.inventoryOnHand > 0 && canPerformAction('automaticTransaction')) {
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
          status: partData.status || 'Active',
          supplier: partData.supplier || '',
          notes: partData.notes || ''
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
  // EVENT HANDLERS - HYBRID SOLUTION ENHANCED WITH ACCESS CONTROL
  // =================================================================
  
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    
    // Check if field is editable before allowing changes
    if (!canEditField(name)) {
      return
    }
    
    let processedValue = value
    
    if (type === 'number' && name === 'inventoryOnHand') {
      processedValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0)
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    // Clear any existing error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // HYBRID SOLUTION: Handle family/category cascading with access control
    if (name === 'selectedFamily' && canEditField('category')) {
      setSelectedFamily(value)
      // Clear category when family changes
      setFormData(prev => ({
        ...prev,
        category: ''
      }))
      setDisplayFamily('')
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    // HYBRID SOLUTION: Validate category against Categories list with access control
    if (name === 'category' && value && canEditField('category')) {
      const isValid = validateCategory(value)
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          category: `"${value}" is not in the Categories list. Please select a valid category.`
        }))
      }
    }

    // Real-time Part ID duplicate validation (create mode only)
    if (name === 'partId' && value && !isEditMode && canEditField('partId')) {
      const trimmedValue = value.trim()
      if (trimmedValue.length >= 2) {
        const isDuplicate = allParts && allParts.find(part => 
          part.partId.toLowerCase() === trimmedValue.toLowerCase()
        )
        
        if (isDuplicate) {
          setErrors(prev => ({
            ...prev,
            partId: `Part ID "${trimmedValue}" already exists. Please choose a different ID.`
          }))
        }
      }
    }
  }

  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    
    // Only allow transaction changes if user can create transactions
    if (!canPerformAction('automaticTransaction')) {
      return
    }
    
    setTransactionData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // =================================================================
  // VALIDATION - ENHANCED WITH ACCESS CONTROL
  // =================================================================
  
  const validateForm = () => {
    const newErrors = {}

    // Required field validation (only check editable fields)
    if (canEditField('partId') && !formData.partId.trim()) {
      newErrors.partId = 'Part ID is required'
    }

    if (canEditField('description') && !formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (canEditField('category') && !formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    // Part ID duplicate check (create mode only)
    if (!isEditMode && formData.partId.trim() && canEditField('partId')) {
      const isDuplicate = allParts && allParts.find(part => 
        part.partId.toLowerCase() === formData.partId.trim().toLowerCase()
      )
      if (isDuplicate) {
        newErrors.partId = `Part ID "${formData.partId.trim()}" already exists. Please choose a different ID.`
      }
    }

    // HYBRID SOLUTION: Category validation against Categories list
    if (formData.category && canEditField('category')) {
      const isValid = validateCategory(formData.category)
      if (!isValid) {
        newErrors.category = `"${formData.category}" is not in the Categories list. Please select a valid category.`
      }
    }

    // Numeric field validation (only for editable fields)
    if (canEditField('unitCost') && formData.unitCost) {
      const cost = parseFloat(formData.unitCost)
      if (isNaN(cost) || cost < 0) {
        newErrors.unitCost = 'Unit cost must be a valid positive number'
      }
    }

    if (canEditField('unitPrice') && formData.unitPrice) {
      const price = parseFloat(formData.unitPrice)
      if (isNaN(price) || price < 0) {
        newErrors.unitPrice = 'Unit price must be a valid positive number'
      }
    }

    // Transaction validation (if showing transaction details and user has access)
    if (showTransactionDetails && canPerformAction('automaticTransaction')) {
      if (!transactionData.receiptDate) {
        newErrors.receiptDate = 'Receipt date is required for initial stock'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =================================================================
  // FORM SUBMISSION - ENHANCED WITH ACCESS CONTROL
  // =================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check access before submission
    if (!canPerformAction(isEditMode ? 'update' : 'create')) {
      error('You do not have permission to perform this action')
      return
    }

    if (!validateForm()) {
      error('Please fix the errors before submitting')
      return
    }

    setSaving(true)

    try {
      const partData = {
        partId: formData.partId.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        inventoryOnHand: isEditMode ? formData.inventoryOnHand : parseInt(formData.inventoryOnHand) || 0,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : 0,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
        status: formData.status,
        supplier: formData.supplier?.trim() || '',
        notes: formData.notes?.trim() || ''
      }

      if (isEditMode) {
        await updatePart(id, partData)
        success('Part updated successfully!')
      } else {
        await createPart(partData)
        
        // Create initial transaction if inventory > 0 and user has access
        if (partData.inventoryOnHand > 0 && canPerformAction('automaticTransaction')) {
          try {
            await createTransaction({
              partId: partData.partId,
              movementType: 'In (Received)',
              quantity: partData.inventoryOnHand,
              receiptDate: transactionData.receiptDate,
              supplier: transactionData.supplier?.trim() || '',
              notes: transactionData.notes?.trim() || 'Initial inventory setup'
            })
            success('Part created successfully with initial stock transaction!')
          } catch (transactionError) {
            console.warn('Failed to create initial transaction:', transactionError)
            success('Part created successfully! Please add inventory manually.')
          }
        } else {
          success('Part created successfully!')
        }
      }
      
      navigate('/parts')
    } catch (err) {
      console.error('Form submission error:', err)
      error(err.message || 'An error occurred while saving the part')
    } finally {
      setSaving(false)
    }
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================

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
  // MAIN RENDER - WITH ACCESS CONTROL
  // =================================================================
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600">
            {isEditMode 
              ? `Modify the details for part ${formData.partId || id}` 
              : 'Create a new part in your inventory'
            }
            {isReadOnly && (
              <span className="ml-2 text-amber-600 font-medium">(Read-Only Mode)</span>
            )}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* HYBRID SOLUTION: Family/Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Family Selector (Optional Helper) */}
            <div>
              <label htmlFor="selectedFamily" className="block text-sm font-medium text-gray-700 mb-1">
                Family <span className="text-gray-500">(Optional Filter)</span>
              </label>
              <select
                id="selectedFamily"
                name="selectedFamily"
                value={selectedFamily}
                onChange={handleInputChange}
                disabled={!canEditField('category')}
                className={`input ${!canEditField('category') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">All Families</option>
                {availableFamilies.map(family => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </select>
            </div>

            {/* Category Input/Dropdown - ACCESS CONTROLLED */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
                {!canEditField('category') && <span className="text-amber-600 ml-2">(Read-Only)</span>}
              </label>
              {canEditField('category') ? (
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  className={`input ${errors.category ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                >
                  <option value="">Select a category...</option>
                  {categoriesInSelectedFamily.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              ) : (
                <div className="input bg-gray-100 text-gray-700">
                  {formData.category || 'No category selected'}
                </div>
              )}
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
              {displayFamily && (
                <p className="mt-1 text-sm text-green-600">
                  Family: <strong>{displayFamily}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Part ID - ACCESS CONTROLLED */}
            <div>
              <label htmlFor="partId" className="block text-sm font-medium text-gray-700 mb-1">
                Part ID <span className="text-red-500">*</span>
                {isEditMode && <span className="text-gray-500 ml-2">(Cannot be changed)</span>}
                {!canEditField('partId') && !isEditMode && <span className="text-amber-600 ml-2">(Read-Only)</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="partId"
                  name="partId"
                  value={formData.partId}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder={canEditField('partId') ? "e.g., BRAKE-PAD-001" : "Not editable"}
                  required
                  className={`input ${errors.partId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${!canEditField('partId') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={isEditMode || !canEditField('partId')}
                />
                {/* Availability Indicator - Only show if field is editable */}
                {!isEditMode && canEditField('partId') && formData.partId.trim().length >= 2 && (
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
                  {/* Alternative Part ID Suggestions - Only show if editable */}
                  {canEditField('partId') && errors.partId.includes('already exists') && (
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
              {!isEditMode && !errors.partId && canEditField('partId') && formData.partId.trim().length >= 2 && (
                <p className="mt-1 text-sm text-green-600">Part ID available</p>
              )}
            </div>

            {/* Status - ACCESS CONTROLLED (Admin Only) */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
                {!canEditField('status') && <span className="text-amber-600 ml-2">(Admin Only)</span>}
              </label>
              {canEditField('status') ? (
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
              ) : (
                <div className="input bg-gray-100 text-gray-700">
                  {formData.status}
                </div>
              )}
            </div>
          </div>

          {/* Description - ACCESS CONTROLLED */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
              {!canEditField('description') && <span className="text-amber-600 ml-2">(Read-Only)</span>}
            </label>
            {canEditField('description') ? (
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Brief description of the part"
                required
                className={`input ${errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              />
            ) : (
              <div className="input bg-gray-100 text-gray-700">
                {formData.description || 'No description provided'}
              </div>
            )}
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Unit Cost - ACCESS CONTROLLED (Admin Only) */}
            <div>
              <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost ($)
                {!canEditField('unitCost') && (
                  <span className="text-amber-600 ml-2">
                    {isEditMode ? "(Admin Only)" : "(User+ Required)"}
                  </span>
                )}
              </label>
              {canEditField('unitCost') ? (
                <input
                  type="number"
                  id="unitCost"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`input ${errors.unitCost ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              ) : (
                <div className="input bg-gray-100 text-gray-700">
                  ${formData.unitCost || '0.00'}
                </div>
              )}
              {errors.unitCost && (
                <p className="mt-1 text-sm text-red-600">{errors.unitCost}</p>
              )}
            </div>

            {/* Unit Price - ACCESS CONTROLLED */}
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price ($)
                {!canEditField('unitPrice') && <span className="text-amber-600 ml-2">(Read-Only)</span>}
              </label>
              {canEditField('unitPrice') ? (
                <input
                  type="number"
                  id="unitPrice"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`input ${errors.unitPrice ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                />
              ) : (
                <div className="input bg-gray-100 text-gray-700">
                  ${formData.unitPrice || '0.00'}
                </div>
              )}
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
              )}
            </div>

            {/* Profit Margin (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profit Margin
              </label>
              <div className="input bg-gray-50 text-gray-700">
                {formData.unitCost && formData.unitPrice ? `${calculateMargin()}%` : 'N/A'}
              </div>
              <p className="mt-1 text-sm text-gray-500">Calculated automatically</p>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Inventory On Hand - ACCESS CONTROLLED (Create Only) */}
            <div>
              <label htmlFor="inventoryOnHand" className="block text-sm font-medium text-gray-700 mb-1">
                Inventory On Hand
                {isEditMode && <span className="text-gray-500 ml-2">(Set via transactions)</span>}
                {!canEditField('inventoryOnHand') && !isEditMode && <span className="text-amber-600 ml-2">(Read-Only)</span>}
              </label>
              {canEditField('inventoryOnHand') && !isEditMode ? (
                <input
                  type="number"
                  id="inventoryOnHand"
                  name="inventoryOnHand"
                  value={formData.inventoryOnHand}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className="input"
                />
              ) : (
                <div className="input bg-gray-100 text-gray-700">
                  {formData.inventoryOnHand} units
                </div>
              )}
              {isEditMode && (
                <p className="mt-1 text-sm text-gray-500">
                  Use Transactions to adjust inventory levels
                </p>
              )}
            </div>

            {/* Total Value (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Value (Cost)
              </label>
              <div className="input bg-gray-50 text-gray-700">
                ${calculateValue()}
              </div>
              <p className="mt-1 text-sm text-gray-500">Quantity × Unit Cost</p>
            </div>
          </div>



          {/* Notes - ACCESS CONTROLLED */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
              {!canEditField('notes') && <span className="text-amber-600 ml-2">(Read-Only)</span>}
            </label>
            {canEditField('notes') ? (
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes or specifications..."
                className="input"
              />
            ) : (
              <div className="input bg-gray-100 text-gray-700 min-h-[80px] whitespace-pre-wrap">
                {formData.notes || 'No notes provided'}
              </div>
            )}
          </div>

          {/* Transaction Details (Create Mode Only) - ACCESS CONTROLLED */}
          {showTransactionDetails && canPerformAction('automaticTransaction') && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-blue-900">Initial Stock Transaction</h3>
                <span className="text-sm text-blue-600">Auto-created for audit trail</span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-4">
                  Since you're adding initial inventory, a transaction record will be created automatically for audit purposes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Receipt Date */}
                  <div>
                    <label htmlFor="receiptDate" className="block text-sm font-medium text-blue-700 mb-1">
                      Receipt Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="receiptDate"
                      name="receiptDate"
                      value={transactionData.receiptDate}
                      onChange={handleTransactionChange}
                      required
                      className={`input ${errors.receiptDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.receiptDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.receiptDate}</p>
                    )}
                  </div>

                  {/* Supplier */}
                  <div>
                    <label htmlFor="transactionSupplier" className="block text-sm font-medium text-blue-700 mb-1">
                      Supplier <span className="text-blue-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="transactionSupplier"
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
                    <label htmlFor="transactionNotes" className="block text-sm font-medium text-blue-700 mb-1">
                      Transaction Notes <span className="text-blue-500">(Optional)</span>
                    </label>
                    <textarea
                      id="transactionNotes"
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
            </div>
          )}

          {/* Preview Card */}
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
                  {!isEditMode && formData.inventoryOnHand > 0 && canPerformAction('automaticTransaction') && (
                    <span className="text-blue-600 ml-2">(+ transaction will be created)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions - ACCESS CONTROLLED */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            
            {/* Primary Action Button */}
            {(canPerformAction('create') || canPerformAction('update')) && (
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
                    {!isEditMode && formData.inventoryOnHand > 0 && canPerformAction('automaticTransaction') && ' + Transaction'}
                  </>
                )}
              </button>
            )}
            
            {/* Cancel Button - Available to all users */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn btn-secondary flex-1 sm:flex-none sm:px-8"
            >
              Cancel
            </button>

            {/* View Details Link - Available to all users in edit mode */}
            {isEditMode && canPerformAction('viewDetails') && (
              <Link
                to={`/parts/${id}`}
                className="btn btn-outline flex-1 sm:flex-none sm:px-8 text-center"
              >
                View Details
              </Link>
            )}
          </div>

          {/* Required Fields Note */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200 space-y-2">
            {(canPerformAction('create') || canPerformAction('update')) && (
              <p>* Required fields must be completed before saving</p>
            )}
            {isEditMode && (
              <p>Part ID cannot be changed after creation to maintain data integrity</p>
            )}
            
            {/* Role-based access information */}
            {isReadOnly && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-4">
                <h5 className="text-sm font-medium text-amber-900 mb-1">Read-Only Access</h5>
                <p className="text-sm text-amber-700">
                  You have view-only access to this form. Contact an administrator to request edit permissions.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartForm