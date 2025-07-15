import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

// =================================================================
// LOOKUP FIELD TEST COMPONENT
// =================================================================
const LookupFieldTest = () => {
  const { getAccessToken } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [currentTest, setCurrentTest] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // =================================================================
  // TEST FUNCTIONS
  // =================================================================

  /**
   * Test 1: Raw API Response Structure
   */
  const testRawAPIResponse = async () => {
    setCurrentTest('raw-api')
    
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available. Please sign in.')
      }

      // Call the diagnostic function
      const result = await sharePointService.testLookupFieldResponse(accessToken)
      
      setTestResults(prev => ({
        ...prev,
        rawAPI: {
          success: true,
          result,
          timestamp: new Date().toISOString()
        }
      }))
      
    } catch (error) {
      console.error('Raw API test failed:', error)
      setTestResults(prev => ({
        ...prev,
        rawAPI: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setCurrentTest(null)
    }
  }

  /**
   * Test 2: Categories List Verification
   */
  const testCategoriesList = async () => {
    setCurrentTest('categories')
    
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available. Please sign in.')
      }

      const categories = await sharePointService.getCategories(accessToken)
      
      setTestResults(prev => ({
        ...prev,
        categories: {
          success: true,
          count: categories.length,
          categories: categories.slice(0, 10).map(cat => ({
            id: cat.id,
            category: cat.category,
            family: cat.family
          })),
          timestamp: new Date().toISOString()
        }
      }))
      
    } catch (error) {
      console.error('Categories test failed:', error)
      setTestResults(prev => ({
        ...prev,
        categories: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setCurrentTest(null)
    }
  }

  /**
   * Test 3: Simple Parts List Test
   */
  const testSimplePartsList = async () => {
    setCurrentTest('simple-parts')
    
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available. Please sign in.')
      }

      const parts = await sharePointService.getParts(accessToken, { top: 5 })
      
      setTestResults(prev => ({
        ...prev,
        simpleParts: {
          success: true,
          count: parts.length,
          sampleParts: parts.map(part => ({
            id: part.id,
            partId: part.partId,
            description: part.description?.substring(0, 50) + '...',
            category: part.category,
            categoryId: part.categoryId,
            status: part.status
          })),
          timestamp: new Date().toISOString()
        }
      }))
      
    } catch (error) {
      console.error('Simple parts test failed:', error)
      setTestResults(prev => ({
        ...prev,
        simpleParts: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setCurrentTest(null)
    }
  }

  /**
   * Run basic tests
   */
  const runBasicTests = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    
    try {
      await testCategoriesList()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testSimplePartsList()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await testRawAPIResponse()
      
    } catch (error) {
      console.error('Error running tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  /**
   * Clear all test results
   */
  const clearResults = () => {
    if (isRunning) return
    setTestResults({})
    setCurrentTest(null)
  }

  // =================================================================
  // HELPER FUNCTIONS
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Lookup Field Test & Diagnosis
        </h1>
        <p className="text-gray-600">
          Test and diagnose SharePoint lookup field handling
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Tests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={testCategoriesList}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'categories' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '📂 Categories'
            )}
          </button>

          <button
            onClick={testSimplePartsList}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'simple-parts' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '🔧 Parts List'
            )}
          </button>

          <button
            onClick={testRawAPIResponse}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'raw-api' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '🔍 Raw Data'
            )}
          </button>

          <button
            onClick={runBasicTests}
            disabled={isRunning}
            className="btn btn-secondary"
          >
            {isRunning ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Running...
              </>
            ) : (
              '🚀 Run All'
            )}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="btn btn-outline"
          >
            🗑️ Clear Results
          </button>
          
          <div className="text-sm text-gray-500">
            Open browser console (F12) to see detailed logs
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {/* Categories Test */}
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
              <div className="space-y-3">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Found {testResults.categories.count} categories!
                </p>
                
                {testResults.categories.categories?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Categories:</strong>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {testResults.categories.categories.map((cat, index) => (
                        <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded">
                          <div className="font-medium">{cat.category}</div>
                          {cat.family && <div className="text-gray-600">{cat.family}</div>}
                        </div>
                      ))}
                    </div>
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

        {/* Simple Parts Test */}
        {testResults.simpleParts && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.simpleParts.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.simpleParts.success)} Parts List Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.simpleParts.timestamp)}
              </span>
            </div>

            {testResults.simpleParts.success ? (
              <div className="space-y-3">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Retrieved {testResults.simpleParts.count} parts!
                </p>
                
                {testResults.simpleParts.sampleParts?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Parts:</strong>
                    <div className="mt-2 space-y-2">
                      {testResults.simpleParts.sampleParts.map((part, index) => (
                        <div key={index} className="border border-gray-200 rounded p-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><strong>Part:</strong> {part.partId}</div>
                            <div><strong>Category:</strong> {part.category || 'None'}</div>
                            <div><strong>Category ID:</strong> {part.categoryId || 'None'}</div>
                            <div><strong>Status:</strong> {part.status}</div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {part.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.simpleParts.error}
              </p>
            )}
          </div>
        )}

        {/* Raw API Test */}
        {testResults.rawAPI && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.rawAPI.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.rawAPI.success)} Raw API Response Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.rawAPI.timestamp)}
              </span>
            </div>

            {testResults.rawAPI.success ? (
              <div className="space-y-3">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Raw API test completed!
                </p>
                
                {testResults.rawAPI.result && (
                  <div className="bg-white rounded p-3 text-sm space-y-2">
                    <div>
                      <strong>Category-related fields found:</strong>
                      <div className="ml-4 mt-1">
                        {testResults.rawAPI.result.categoryFields?.map((field, index) => (
                          <div key={index} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mr-2 mb-1">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Check browser console for complete raw data structure</strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.rawAPI.error}
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
            Click the test buttons above to diagnose lookup field handling
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What This Tests</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Categories:</strong> Verifies the categories list is accessible</p>
          <p>• <strong>Parts List:</strong> Tests parts retrieval with category lookup values</p>
          <p>• <strong>Raw Data:</strong> Shows the actual SharePoint field structure</p>
          <p>• <strong>Console:</strong> Open F12 to see detailed technical information</p>
        </div>
      </div>
    </div>
  )
}

export default LookupFieldTest