import React, { useState } from 'react'
// Fixed import path - should be relative to src/components/parts/
import { useSharePointHealth, useCategories, useParts } from '../../hooks/useSharePoint'
import LoadingSpinner from '../shared/LoadingSpinner'

// =================================================================
// SHAREPOINT CONNECTION TEST COMPONENT
// =================================================================
const SharePointConnectionTest = () => {
  const [testResults, setTestResults] = useState({})
  const [currentTest, setCurrentTest] = useState(null)
  
  // Hooks for testing different aspects
  const { healthStatus, checkHealth, loading: healthLoading } = useSharePointHealth()
  const { categories, categoryNames, loading: categoriesLoading, error: categoriesError } = useCategories()
  const { parts, loading: partsLoading, error: partsError } = useParts({ top: 5 }) // Only get 5 parts for testing

  // =================================================================
  // TEST FUNCTIONS
  // =================================================================

  /**
   * Test 1: Basic Health Check
   */
  const runHealthCheck = async () => {
    setCurrentTest('health')
    try {
      const result = await checkHealth()
      setTestResults(prev => ({
        ...prev,
        health: {
          success: true,
          result,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        health: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    }
    setCurrentTest(null)
  }

  /**
   * Test 2: Categories Connection
   */
  const testCategoriesConnection = async () => {
    setCurrentTest('categories')
    // Categories will load automatically via useCategories hook
    // We just need to wait and check the results
    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        categories: {
          success: !categoriesError,
          count: categories?.length || 0,
          categoryNames: categoryNames?.slice(0, 5), // First 5 for display
          error: categoriesError,
          timestamp: new Date().toISOString()
        }
      }))
      setCurrentTest(null)
    }, 2000)
  }

  /**
   * Test 3: Parts Connection
   */
  const testPartsConnection = async () => {
    setCurrentTest('parts')
    // Parts will load automatically via useParts hook
    // We just need to wait and check the results
    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        parts: {
          success: !partsError,
          count: parts?.length || 0,
          sampleParts: parts?.slice(0, 3)?.map(part => ({
            partId: part.partId,
            description: part.description,
            inventoryOnHand: part.inventoryOnHand
          })), // First 3 parts with limited fields
          error: partsError,
          timestamp: new Date().toISOString()
        }
      }))
      setCurrentTest(null)
    }, 2000)
  }

  /**
   * Run all tests in sequence
   */
  const runAllTests = async () => {
    await runHealthCheck()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testCategoriesConnection()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await testPartsConnection()
  }

  /**
   * Clear all test results
   */
  const clearResults = () => {
    setTestResults({})
    setCurrentTest(null)
  }

  // =================================================================
  // RESULT DISPLAY HELPERS
  // =================================================================

  const getStatusIcon = (success) => success ? '✅' : '❌'
  const getStatusColor = (success) => success ? 'text-green-600' : 'text-red-600'
  const getStatusBg = (success) => success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          SharePoint Connection Test
        </h1>
        <p className="text-gray-600">
          Test connectivity to your SharePoint environment before full integration
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Test Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={runHealthCheck}
            disabled={currentTest === 'health' || healthLoading}
            className="btn btn-primary"
          >
            {currentTest === 'health' || healthLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '🏥 Health Check'
            )}
          </button>

          <button
            onClick={testCategoriesConnection}
            disabled={currentTest === 'categories' || categoriesLoading}
            className="btn btn-primary"
          >
            {currentTest === 'categories' || categoriesLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '📂 Test Categories'
            )}
          </button>

          <button
            onClick={testPartsConnection}
            disabled={currentTest === 'parts' || partsLoading}
            className="btn btn-primary"
          >
            {currentTest === 'parts' || partsLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '🔧 Test Parts'
            )}
          </button>

          <button
            onClick={runAllTests}
            disabled={currentTest !== null}
            className="btn btn-secondary"
          >
            {currentTest ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Running...
              </>
            ) : (
              '🚀 Run All Tests'
            )}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={clearResults}
            className="btn btn-outline"
          >
            🗑️ Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {/* Health Check Results */}
        {testResults.health && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.health.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.health.success)} Health Check
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.health.timestamp)}
              </span>
            </div>

            {testResults.health.success ? (
              <div className="space-y-2">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Connection successful!
                </p>
                {testResults.health.result && (
                  <div className="bg-white rounded p-3 text-sm">
                    <p><strong>Site Access:</strong> {testResults.health.result.siteAccess ? '✅' : '❌'}</p>
                    <div className="mt-2">
                      <strong>List Access:</strong>
                      <ul className="ml-4 mt-1">
                        {Object.entries(testResults.health.result.listsAccess || {}).map(([listKey, hasAccess]) => (
                          <li key={listKey}>
                            {hasAccess ? '✅' : '❌'} {listKey} ({hasAccess ? 'accessible' : 'not accessible'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.health.error}
              </p>
            )}
          </div>
        )}

        {/* Categories Results */}
        {testResults.categories && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.categories.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.categories.success)} Categories Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.categories.timestamp)}
              </span>
            </div>

            {testResults.categories.success ? (
              <div className="space-y-2">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Found {testResults.categories.count} categories!
                </p>
                {testResults.categories.categoryNames?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Categories:</strong>
                    <ul className="ml-4 mt-1">
                      {testResults.categories.categoryNames.map((category, index) => (
                        <li key={index}>• {category}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.categories.error}
              </p>
            )}
          </div>
        )}

        {/* Parts Results */}
        {testResults.parts && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.parts.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.parts.success)} Parts Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.parts.timestamp)}
              </span>
            </div>

            {testResults.parts.success ? (
              <div className="space-y-2">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Found {testResults.parts.count} parts!
                </p>
                {testResults.parts.sampleParts?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Parts:</strong>
                    <div className="mt-2 space-y-1">
                      {testResults.parts.sampleParts.map((part, index) => (
                        <div key={index} className="flex justify-between">
                          <span><strong>{part.partId}:</strong> {part.description}</span>
                          <span className="text-gray-600">Stock: {part.inventoryOnHand}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.parts.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* No Results Message */}
      {Object.keys(testResults).length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-4">🧪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
          <p className="text-gray-600">
            Click the test buttons above to verify SharePoint connectivity
          </p>
        </div>
      )}

      {/* Configuration Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Site URL:</strong> {import.meta.env.VITE_SHAREPOINT_SITE_URL}</p>
          <p><strong>Client ID:</strong> {import.meta.env.VITE_CLIENT_ID?.substring(0, 8)}...</p>
          <p><strong>Lists:</strong> {Object.values({
            parts: import.meta.env.VITE_PARTS_LIST_NAME,
            categories: import.meta.env.VITE_CATEGORIES_LIST_NAME,
            buyers: import.meta.env.VITE_BUYERS_LIST_NAME,
            invoices: import.meta.env.VITE_INVOICES_LIST_NAME,
            transactions: import.meta.env.VITE_TRANSACTIONS_LIST_NAME
          }).join(', ')}</p>
        </div>
      </div>
    </div>
  )
}

export default SharePointConnectionTest