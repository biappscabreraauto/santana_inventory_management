import React from 'react'

// =================================================================
// LOADING SPINNER COMPONENT
// =================================================================

/**
 * Flexible loading spinner component with multiple variants
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.variant - Style variant: 'spinner', 'dots', 'bars', 'pulse'
 * @param {string} props.message - Optional loading message
 * @param {string} props.color - Color theme: 'blue', 'gray', 'white'
 * @param {boolean} props.overlay - Whether to show as overlay
 * @param {string} props.className - Additional CSS classes
 */
const LoadingSpinner = ({
  size = 'md',
  variant = 'spinner',
  message = '',
  color = 'blue',
  overlay = false,
  className = ''
}) => {
  
  // =================================================================
  // SIZE CONFIGURATIONS
  // =================================================================
  const sizeClasses = {
    sm: {
      spinner: 'w-4 h-4',
      dots: 'w-1 h-1',
      bars: 'w-1 h-3',
      text: 'text-xs',
      gap: 'gap-1'
    },
    md: {
      spinner: 'w-6 h-6',
      dots: 'w-1.5 h-1.5',
      bars: 'w-1.5 h-4',
      text: 'text-sm',
      gap: 'gap-1.5'
    },
    lg: {
      spinner: 'w-8 h-8',
      dots: 'w-2 h-2',
      bars: 'w-2 h-5',
      text: 'text-base',
      gap: 'gap-2'
    },
    xl: {
      spinner: 'w-12 h-12',
      dots: 'w-3 h-3',
      bars: 'w-3 h-6',
      text: 'text-lg',
      gap: 'gap-3'
    }
  }

  // =================================================================
  // COLOR CONFIGURATIONS
  // =================================================================
  const colorClasses = {
    blue: {
      spinner: 'text-blue-600',
      dots: 'bg-blue-600',
      bars: 'bg-blue-600',
      text: 'text-blue-700'
    },
    gray: {
      spinner: 'text-gray-600',
      dots: 'bg-gray-600',
      bars: 'bg-gray-600',
      text: 'text-gray-700'
    },
    white: {
      spinner: 'text-white',
      dots: 'bg-white',
      bars: 'bg-white',
      text: 'text-white'
    }
  }

  const currentSize = sizeClasses[size] || sizeClasses.md
  const currentColor = colorClasses[color] || colorClasses.blue

  // =================================================================
  // SPINNER VARIANTS
  // =================================================================
  
  /**
   * Classic spinning circle
   */
  const SpinnerVariant = () => (
    <svg
      className={`animate-spin ${currentSize.spinner} ${currentColor.spinner}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  /**
   * Three bouncing dots
   */
  const DotsVariant = () => (
    <div className={`flex ${currentSize.gap}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${currentSize.dots} ${currentColor.dots} rounded-full
            animate-bounce
          `}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )

  /**
   * Three animated bars
   */
  const BarsVariant = () => (
    <div className={`flex items-end ${currentSize.gap}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${currentSize.bars} ${currentColor.bars} rounded-sm
          `}
          style={{
            animation: `bar-scale 1.2s ease-in-out ${index * 0.1}s infinite`
          }}
        />
      ))}
    </div>
  )

  /**
   * Pulsing circle
   */
  const PulseVariant = () => (
    <div
      className={`
        ${currentSize.spinner} ${currentColor.dots} rounded-full
        animate-pulse
      `}
    />
  )

  // =================================================================
  // VARIANT SELECTOR
  // =================================================================
  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return <DotsVariant />
      case 'bars':
        return <BarsVariant />
      case 'pulse':
        return <PulseVariant />
      case 'spinner':
      default:
        return <SpinnerVariant />
    }
  }

  // =================================================================
  // MAIN COMPONENT
  // =================================================================
  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center ${currentSize.gap} ${className}`}>
      {renderVariant()}
      {message && (
        <div className={`${currentSize.text} ${currentColor.text} font-medium text-center mt-2`}>
          {message}
        </div>
      )}
    </div>
  )

  // =================================================================
  // OVERLAY VARIANT
  // =================================================================
  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />
        
        {/* Content */}
        <div className="relative bg-white rounded-xl shadow-xl p-8 max-w-sm mx-4">
          <LoadingContent />
        </div>
      </div>
    )
  }

  // =================================================================
  // STANDARD VARIANT
  // =================================================================
  return <LoadingContent />
}

// =================================================================
// SPECIALIZED LOADING COMPONENTS
// =================================================================

/**
 * Page loading spinner - large and centered
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <LoadingSpinner 
      size="lg" 
      variant="spinner" 
      message={message}
      color="blue"
    />
  </div>
)

/**
 * Button loading spinner - small and inline
 */
export const ButtonLoader = ({ color = 'white' }) => (
  <LoadingSpinner 
    size="sm" 
    variant="spinner" 
    color={color}
    className="mr-2"
  />
)

/**
 * Table loading spinner - medium with skeleton effect
 */
export const TableLoader = ({ rows = 5, message = 'Loading data...' }) => (
  <div className="space-y-4 p-4">
    <div className="text-center mb-6">
      <LoadingSpinner 
        size="md" 
        variant="dots" 
        message={message}
        color="gray"
      />
    </div>
    
    {/* Skeleton rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex space-x-4">
            <div className="rounded bg-gray-200 h-4 w-4"></div>
            <div className="flex-1 space-y-2">
              <div className="bg-gray-200 rounded h-4 w-3/4"></div>
              <div className="bg-gray-200 rounded h-4 w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

/**
 * Card loading spinner - with border
 */
export const CardLoader = ({ message = 'Loading...' }) => (
  <div className="border border-gray-200 rounded-xl p-8 text-center bg-white">
    <LoadingSpinner 
      size="lg" 
      variant="spinner" 
      message={message}
      color="blue"
    />
  </div>
)

/**
 * Overlay loading spinner - full screen
 */
export const OverlayLoader = ({ message = 'Processing...' }) => (
  <LoadingSpinner 
    overlay 
    size="lg" 
    variant="spinner" 
    message={message}
    color="blue"
  />
)

/**
 * Inline loading spinner - for text content
 */
export const InlineLoader = ({ message = 'Loading' }) => (
  <span className="inline-flex items-center">
    <LoadingSpinner 
      size="sm" 
      variant="dots" 
      color="gray"
      className="mr-2"
    />
    <span className="text-sm text-gray-600">{message}</span>
  </span>
)

// =================================================================
// DEFAULT EXPORT
// =================================================================
export default LoadingSpinner