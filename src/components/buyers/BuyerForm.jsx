// =================================================================
// BUYER FORM COMPONENT - ROLE-BASED ACCESS CONTROL IMPLEMENTATION
// =================================================================
// Form component for creating and editing buyers/customers
// Handles both create and edit modes with proper validation and role restrictions

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useRoleAccess } from '../../hooks/useRoleAccess'
import RoleProtected from '../auth/RoleProtected'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useBuyers, useBuyer } from '../../hooks/useSharePoint'
import { User, Mail, Phone, Save, X, AlertCircle, Check } from 'lucide-react'

const BuyerForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  
  // Role-based access control
  const { 
    canAccess, 
    canCreate, 
    canEdit, 
    isReadOnly, 
    isUser, 
    isAdmin,
    userRole 
  } = useRoleAccess('User') // Require User+ for form access
  
  const isEditMode = !!id
  
  // Early return if no access to forms (ReadOnly users)
  if (!canAccess) {
    return <RoleProtected requiredRole="User" />
  }
  
  // Check specific permissions for create/edit
  if (isEditMode && !canEdit) {
    return <RoleProtected requiredRole="User" message="Editing buyers requires User access or higher." />
  }
  
  if (!isEditMode && !canCreate) {
    return <RoleProtected requiredRole="User" message="Creating buyers requires User access or higher." />
  }

  // Use different hooks based on mode
  const { buyers, createBuyer } = useBuyers()
  const { 
    buyer: existingBuyer, 
    loading: buyerLoading, 
    updateBuyer: updateExistingBuyer 
  } = useBuyer(isEditMode ? id : null)

  // =================================================================
  // LOCAL STATE
  // =================================================================
  const [formData, setFormData] = useState({
    buyerName: '',
    contactEmail: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  // =================================================================
  // LOAD DATA FOR EDIT MODE
  // =================================================================
  useEffect(() => {
    if (isEditMode && existingBuyer) {
      setFormData({
        buyerName: existingBuyer.buyerName || '',
        contactEmail: existingBuyer.contactEmail || '',
        phone: existingBuyer.phone || ''
      })
    }
  }, [isEditMode, existingBuyer])

  // Handle case where buyer is not found
  useEffect(() => {
    if (isEditMode && !buyerLoading && !existingBuyer) {
      error('Buyer not found')
      navigate('/buyers')
    }
  }, [isEditMode, buyerLoading, existingBuyer, error, navigate])

  // =================================================================
  // ROLE-BASED FIELD ACCESS CONTROL
  // =================================================================
  
  /**
   * Check if user can access a specific form field
   * Based on buyer form access matrix:
   * - All form inputs: User, Admin only
   * - Action buttons: User, Admin only
   */
  const canAccessField = (fieldName) => {
    // All buyer form fields require User+ access
    return isUser || isAdmin
  }

  /**
   * Get field configuration based on role
   */
  const getFieldConfig = (fieldName) => {
    const hasAccess = canAccessField(fieldName)
    return {
      disabled: !hasAccess,
      readonly: !hasAccess,
      accessible: hasAccess
    }
  }

  // =================================================================
  // VALIDATION
  // =================================================================
  const validateField = (field, value) => {
    switch (field) {
      case 'buyerName':
        if (!value || value.trim() === '') {
          return 'Buyer name is required'
        }
        if (value.length < 2) {
          return 'Buyer name must be at least 2 characters'
        }
        if (value.length > 100) {
          return 'Buyer name cannot exceed 100 characters'
        }
        // Check for duplicate names (excluding current buyer in edit mode)
        if (buyers) {
          const existingBuyer = buyers.find(buyer => 
            buyer.buyerName.toLowerCase() === value.toLowerCase() && 
            buyer.id !== id
          )
          if (existingBuyer) {
            return 'A buyer with this name already exists'
          }
        }
        return null

      case 'contactEmail':
        if (value && value.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address'
          }
          if (value.length > 255) {
            return 'Email address cannot exceed 255 characters'
          }
        }
        return null

      case 'phone':
        if (value && value.trim() !== '') {
          // Remove non-digit characters for validation
          const digitsOnly = value.replace(/\D/g, '')
          if (digitsOnly.length < 10) {
            return 'Phone number must be at least 10 digits'
          }
          if (digitsOnly.length > 15) {
            return 'Phone number cannot exceed 15 digits'
          }
        }
        return null

      default:
        return null
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
      }
    })

    // Check that at least one contact method is provided
    if (!formData.contactEmail && !formData.phone) {
      const contactError = 'Please provide at least one contact method (email or phone)'
      newErrors.contactEmail = contactError
      newErrors.phone = contactError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // =================================================================
  // EVENT HANDLERS
  // =================================================================
  const handleInputChange = (field, value) => {
    // Check field access before allowing changes
    if (!canAccessField(field)) {
      return
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }))

    const error = validateField(field, formData[field])
    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Double-check permissions before submit
    if (isEditMode && !canEdit) {
      error('You do not have permission to edit buyers')
      return
    }
    
    if (!isEditMode && !canCreate) {
      error('You do not have permission to create buyers')
      return
    }
    
    if (!validateForm()) {
      error('Please fix the errors in the form')
      return
    }

    setSaving(true)
    
    try {
      const buyerData = {
        buyerName: formData.buyerName.trim(),
        contactEmail: formData.contactEmail.trim() || null,
        phone: formData.phone.trim() || null
      }

      if (isEditMode) {
        await updateExistingBuyer(buyerData)
        success('Buyer updated successfully!')
      } else {
        await createBuyer(buyerData)
        success('Buyer created successfully!')
      }

      navigate('/buyers')
    } catch (err) {
      console.error('Error saving buyer:', err)
      error('Failed to save buyer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/buyers')
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  const formatPhoneNumber = (value) => {
    const digitsOnly = value.replace(/\D/g, '')
    
    if (digitsOnly.length <= 3) {
      return digitsOnly
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phone', formatted)
  }

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (buyerLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading buyer data...</p>
        </div>
      </div>
    )
  }

  // =================================================================
  // MAIN RENDER
  // =================================================================
  const pageTitle = isEditMode ? 'Edit Buyer' : 'Add New Buyer'
  const submitText = isEditMode ? 'Update Buyer' : 'Create Buyer'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Role Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update customer information and contact details' 
              : 'Add a new customer to your database'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Information Card */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Customer Information
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Buyer Name - User+ Access */}
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <div>
                <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Buyer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="buyerName"
                    value={formData.buyerName}
                    onChange={(e) => handleInputChange('buyerName', e.target.value)}
                    onBlur={() => handleBlur('buyerName')}
                    placeholder="Enter buyer name or company name"
                    disabled={!canAccessField('buyerName') || saving}
                    className={`input pl-10 ${errors.buyerName ? 
                      'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${
                      !canAccessField('buyerName') ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                {errors.buyerName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.buyerName}
                  </p>
                )}
              </div>
            </RoleProtected>

            {/* Contact Email - User+ Access */}
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    onBlur={() => handleBlur('contactEmail')}
                    placeholder="Enter email address"
                    disabled={!canAccessField('contactEmail') || saving}
                    className={`input pl-10 ${errors.contactEmail ? 
                      'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${
                      !canAccessField('contactEmail') ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.contactEmail}
                  </p>
                )}
              </div>
            </RoleProtected>

            {/* Phone - User+ Access */}
            <RoleProtected requiredRole="User" hideIfUnauthorized>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="Enter phone number"
                    disabled={!canAccessField('phone') || saving}
                    className={`input pl-10 ${errors.phone ? 
                      'border-red-300 focus:ring-red-500 focus:border-red-500' : ''} ${
                      !canAccessField('phone') ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </RoleProtected>

            {/* Contact Method Requirement Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-2">
                  <p className="text-sm text-blue-800">
                    <strong>Contact Information:</strong> Please provide at least one contact method (email or phone number) to enable communication with this buyer.
                  </p>
                </div>
              </div>
            </div>

            {/* ReadOnly User Message */}
            <RoleProtected requiredRole="ReadOnly" hideIfUnauthorized>
              {isReadOnly && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-yellow-800">
                        <strong>Read-Only Access:</strong> You can view buyer information but cannot create or edit buyers. Contact your administrator to request User access.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </RoleProtected>
          </div>
        </div>

        {/* Form Summary - Available to all roles */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <div className="text-gray-900">
                {formData.buyerName || 'Not provided'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <div className="text-gray-900">
                {formData.contactEmail || 'Not provided'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <div className="text-gray-900">
                {formData.phone || 'Not provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Role-based access */}
        <div className="flex justify-end space-x-3">
          {/* Cancel Button - Available to all users */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="btn btn-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          
          {/* Submit Button - User+ Access Only */}
          <RoleProtected requiredRole="User" hideIfUnauthorized>
            <button
              type="submit"
              disabled={saving || Object.keys(errors).length > 0 || !canAccessField('buyerName')}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {submitText}
                </>
              )}
            </button>
          </RoleProtected>
        </div>

        {/* Form Validation Status */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default BuyerForm