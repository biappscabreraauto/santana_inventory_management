import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from './LoadingSpinner'

// =================================================================
// NAVIGATION CONFIGURATION
// =================================================================
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: '📊',
    description: 'Overview and analytics'
  },
  {
    name: 'Parts',
    href: '/parts',
    icon: '🔧',
    description: 'Manage inventory parts',
    submenu: [
      { name: 'All Parts', href: '/parts' },
      { name: 'Add New Part', href: '/parts/new' }
    ]
  },
  {
    name: 'Invoices',
    href: '/invoices',
    icon: '📄',
    description: 'Sales and billing',
    submenu: [
      { name: 'All Invoices', href: '/invoices' },
      { name: 'Create Invoice', href: '/invoices/new' }
    ]
  },
  {
    name: 'Buyers',
    href: '/buyers',
    icon: '👥',
    description: 'Customer management',
    submenu: [
      { name: 'All Buyers', href: '/buyers' },
      { name: 'Add New Buyer', href: '/buyers/new' }
    ]
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: '📦',
    description: 'Inventory movements',
    submenu: [
      { name: 'Transaction History', href: '/transactions' },
      { name: 'Log Inbound Parts', href: '/transactions/new' }
    ]
  },
  {
    name: 'External Lookup',
    href: '/external-lookup',
    icon: '🔍',
    description: 'RockAuto & Google search'
  }
]

// =================================================================
// LAYOUT COMPONENT
// =================================================================
const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, loading: authLoading } = useAuth()
  const { info } = useToast()
  
  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [pageLoading, setPageLoading] = useState(false)

  // =================================================================
  // NAVIGATION HELPERS
  // =================================================================
  
  /**
   * Check if current route matches navigation item
   */
  const isActiveRoute = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  /**
   * Handle navigation with loading state
   */
  const handleNavigation = (href) => {
    if (href !== location.pathname) {
      setPageLoading(true)
      navigate(href)
      setSidebarOpen(false) // Close mobile sidebar
      setActiveSubmenu(null) // Close submenus
    }
  }

  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    try {
      info('Signing out...', { duration: 2000 })
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  /**
   * Toggle submenu visibility
   */
  const toggleSubmenu = (menuName) => {
    setActiveSubmenu(activeSubmenu === menuName ? null : menuName)
  }

  // =================================================================
  // EFFECTS
  // =================================================================
  
  /**
   * Clear page loading state on route change
   */
  useEffect(() => {
    setPageLoading(false)
  }, [location])

  /**
   * Close sidebar on route change (mobile)
   */
  useEffect(() => {
    setSidebarOpen(false)
    setActiveSubmenu(null)
  }, [location])

  // =================================================================
  // RENDER LOADING STATE
  // =================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" message="Loading application..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* =================================================================
          SIDEBAR OVERLAY (Mobile)
          ================================================================= */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* =================================================================
          SIDEBAR
          ================================================================= */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white">
            <div className="flex items-center">
              <div className="text-xl font-bold">
                {import.meta.env.VITE_APP_NAME?.split(' ')[0] || 'Santana'}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {/* Main navigation item */}
                  <div
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors
                      ${isActiveRoute(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => {
                      if (item.submenu) {
                        toggleSubmenu(item.name)
                      } else {
                        handleNavigation(item.href)
                      }
                    }}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {item.submenu && (
                      <span className={`
                        transition-transform duration-200
                        ${activeSubmenu === item.name ? 'rotate-180' : ''}
                      `}>
                        ▼
                      </span>
                    )}
                  </div>

                  {/* Submenu */}
                  {item.submenu && activeSubmenu === item.name && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <div
                          key={subItem.href}
                          className={`
                            block px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors
                            ${location.pathname === subItem.href
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                            }
                          `}
                          onClick={() => handleNavigation(subItem.href)}
                        >
                          {subItem.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* User Info & Sign Out */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full btn btn-outline text-left text-sm"
            >
              <span className="mr-2">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================
          MAIN CONTENT AREA
          ================================================================= */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <span className="text-xl">☰</span>
          </button>

          {/* Page title */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-xl font-semibold text-gray-900">
              {getCurrentPageTitle()}
            </h1>
          </div>

          {/* Header actions */}
          <div className="flex items-center space-x-4">
            {/* Quick add button */}
            <div className="relative group">
              <button className="btn btn-primary">
                <span className="mr-1">+</span>
                Quick Add
              </button>
              
              {/* Quick add dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <button 
                    onClick={() => handleNavigation('/parts/new')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    🔧 Add Part
                  </button>
                  <button 
                    onClick={() => handleNavigation('/invoices/new')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    📄 Create Invoice
                  </button>
                  <button 
                    onClick={() => handleNavigation('/buyers/new')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    👥 Add Buyer
                  </button>
                  <button 
                    onClick={() => handleNavigation('/transactions/new')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    📦 Log Inbound Parts
                  </button>
                </div>
              </div>
            </div>

            {/* Environment indicator */}
            {import.meta.env.VITE_ENVIRONMENT !== 'production' && (
              <div className="hidden sm:block">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {import.meta.env.VITE_ENVIRONMENT?.toUpperCase() || 'DEV'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-8xl mx-auto px-6 py-8">
            {pageLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" message="Loading page..." />
              </div>
            ) : (
              <div className="page-content">
                {children}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2025 Cabrera Auto. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <span>v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
              {import.meta.env.VITE_DEBUG_MODE === 'true' && (
                <span className="text-yellow-600">Debug Mode</span>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )

  // =================================================================
  // HELPER FUNCTIONS
  // =================================================================
  
  /**
   * Get current page title based on route
   */
  function getCurrentPageTitle() {
    const path = location.pathname
    
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/parts')) {
      if (path.includes('/new')) return 'Add New Part'
      if (path.includes('/edit')) return 'Edit Part'
      if (path.match(/\/parts\/[^/]+$/)) return 'Part Details'
      return 'Parts Inventory'
    }
    if (path.startsWith('/invoices')) {
      if (path.includes('/new')) return 'Create Invoice'
      if (path.includes('/edit')) return 'Edit Invoice'
      if (path.match(/\/invoices\/[^/]+$/)) return 'Invoice Details'
      return 'Invoices'
    }
    if (path.startsWith('/buyers')) {
      if (path.includes('/new')) return 'Add New Buyer'
      if (path.includes('/edit')) return 'Edit Buyer'
      return 'Buyers'
    }
    if (path.startsWith('/transactions')) {
      if (path.includes('/new')) return 'Log Inbound Parts'
      return 'Transaction History'
    }
    if (path === '/external-lookup') return 'External Lookup'
    
    return 'Santana Inventory'
  }
}

export default Layout