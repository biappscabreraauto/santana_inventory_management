import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import sharePointService from '../../services/sharepoint'
import LoadingSpinner from '../shared/LoadingSpinner'

// =================================================================
// PROPER SHAREPOINT CONNECTION TEST COMPONENT
// =================================================================
const SharePointConnectionTest = () => {
  const { getAccessToken } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [currentTest, setCurrentTest] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // =================================================================
  // ACTUAL SHAREPOINT TEST FUNCTIONS (Like Parts Test)
  // =================================================================

  /**
     * Test 1: SharePoint Health Check - Tests actual connection
     */
    const runHealthCheck = async () => {
      setCurrentTest('health')
      
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('No access token available. Please sign in.')
        }

        const result = await sharePointService.healthCheck(accessToken)
        
        setTestResults(prev => ({
          ...prev,
          health: {
            success: result.siteAccess,
            result,
            timestamp: new Date().toISOString()
          }
        }))
        
      } catch (error) {
        console.error('Health check failed:', error)
        setTestResults(prev => ({
          ...prev,
          health: {
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
     * Test 2: Buyers Connection - Tests actual buyers list
     */
    const testBuyersConnection = async () => {
      setCurrentTest('buyers')
      
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('No access token available. Please sign in.')
        }

        // Test getting buyers data
        const buyers = await sharePointService.getBuyers(accessToken, { top: 5 })
        const buyerNames = await sharePointService.getBuyerNames(accessToken)
        
        setTestResults(prev => ({
          ...prev,
          buyers: {
            success: true,
            count: buyers.length,
            totalBuyerNames: buyerNames.length,
            sampleBuyers: buyers.slice(0, 3).map(buyer => ({
              id: buyer.id,
              buyerName: buyer.buyerName,
              contactEmail: buyer.contactEmail,
              phone: buyer.phone
            })),
            sampleBuyerNames: buyerNames.slice(0, 5),
            timestamp: new Date().toISOString()
          }
        }))
        
      } catch (error) {
        console.error('Buyers test failed:', error)
        setTestResults(prev => ({
          ...prev,
          buyers: {
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
     * Test 3: Invoices Connection - Tests actual invoices list
     */
    const testInvoicesConnection = async () => {
      setCurrentTest('invoices')
      
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('No access token available. Please sign in.')
        }

        // Test getting invoices data
        const invoices = await sharePointService.getInvoices(accessToken, { top: 5 })
        
        setTestResults(prev => ({
          ...prev,
          invoices: {
            success: true,
            count: invoices.length,
            sampleInvoices: invoices.slice(0, 3).map(invoice => ({
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              buyer: invoice.buyer,
              totalAmount: invoice.totalAmount,
              status: invoice.status,
              invoiceDate: invoice.invoiceDate
            })),
            timestamp: new Date().toISOString()
          }
        }))
        
      } catch (error) {
        console.error('Invoices test failed:', error)
        setTestResults(prev => ({
          ...prev,
          invoices: {
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
     * Test 4: Transactions Connection - Tests actual transactions list
     */
    const testTransactionsConnection = async () => {
      setCurrentTest('transactions')
      
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('No access token available. Please sign in.')
        }

        // Test getting transactions data
        const transactions = await sharePointService.getTransactions(accessToken, { top: 5 })
        
        setTestResults(prev => ({
          ...prev,
          transactions: {
            success: true,
            count: transactions.length,
            sampleTransactions: transactions.slice(0, 3).map(transaction => ({
              id: transaction.id,
              partId: transaction.partId,
              movementType: transaction.movementType,
              quantity: transaction.quantity,
              unitPrice: transaction.unitPrice || transaction.unitCost,
              invoice: transaction.invoice
            })),
            timestamp: new Date().toISOString()
          }
        }))
        
      } catch (error) {
        console.error('Transactions test failed:', error)
        setTestResults(prev => ({
          ...prev,
          transactions: {
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
     * Run all tests in sequence
     */
    const runAllTests = async () => {
      if (isRunning) return
      
      setIsRunning(true)
      
      try {
        await runHealthCheck()
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await testBuyersConnection()
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await testInvoicesConnection()
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await testTransactionsConnection()
        
      } catch (error) {
        console.error('Error running all tests:', error)
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
  // RESULT DISPLAY HELPERS
  // =================================================================

  const getStatusIcon = (success) => success ? '✅' : '❌'
  const getStatusColor = (success) => success ? 'text-green-600' : 'text-red-600'
  const getStatusBg = (success) => success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          SharePoint Integration Test
        </h1>
        <p className="text-gray-600">
          Test live connectivity and data retrieval from SharePoint lists
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Live SharePoint Tests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={runHealthCheck}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'health' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '🏥 Health Check'
            )}
          </button>

          <button
            onClick={testBuyersConnection}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'buyers' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '👥 Buyers'
            )}
          </button>

          <button
            onClick={testInvoicesConnection}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'invoices' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '📋 Invoices'
            )}
          </button>

          <button
            onClick={testTransactionsConnection}
            disabled={isRunning}
            className="btn btn-primary"
          >
            {currentTest === 'transactions' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              '🔄 Transactions'
            )}
          </button>

          <button
            onClick={runAllTests}
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
            {isRunning ? (
              <span className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Test in progress...
              </span>
            ) : (
              'Ready to test'
            )}
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {/* Health Check Results */}
        {testResults.health && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.health.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.health.success)} SharePoint Health Check
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.health.timestamp)}
              </span>
            </div>

            {testResults.health.success ? (
              <div className="space-y-2">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  SharePoint connection successful!
                </p>
                {testResults.health.result && (
                  <div className="bg-white rounded p-3 text-sm">
                    <p><strong>Site Access:</strong> {testResults.health.result.siteAccess ? '✅' : '❌'}</p>
                    <div className="mt-2">
                      <strong>List Access:</strong>
                      <ul className="ml-4 mt-1 grid grid-cols-2 gap-1">
                        {Object.entries(testResults.health.result.listsAccess || {}).map(([listKey, hasAccess]) => (
                          <li key={listKey}>
                            {hasAccess ? '✅' : '❌'} {listKey}
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

        {/* Buyers Results */}
        {testResults.buyers && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.buyers.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.buyers.success)} Buyers List Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.buyers.timestamp)}
              </span>
            </div>

            {testResults.buyers.success ? (
              <div className="space-y-3">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Found {testResults.buyers.count} buyers in sample (Total names: {testResults.buyers.totalBuyerNames})
                </p>
                
                {testResults.buyers.sampleBuyers?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Buyers:</strong>
                    <div className="mt-2 space-y-2">
                      {testResults.buyers.sampleBuyers.map((buyer, index) => (
                        <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                          <div className="font-medium">{buyer.buyerName}</div>
                          {buyer.contactEmail && (
                            <div className="text-gray-600">📧 {buyer.contactEmail}</div>
                          )}
                          {buyer.phone && (
                            <div className="text-gray-600">📞 {buyer.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.buyers.sampleBuyerNames?.length > 0 && (
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <strong>Buyer Names (for dropdowns):</strong>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {testResults.buyers.sampleBuyerNames.map((name, index) => (
                        <span key={index} className="bg-white px-2 py-1 rounded text-xs border">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.buyers.error}
              </p>
            )}
          </div>
        )}

        {/* Invoices Results */}
        {testResults.invoices && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.invoices.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.invoices.success)} Invoices List Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.invoices.timestamp)}
              </span>
            </div>

            {testResults.invoices.success ? (
              <div className="space-y-3">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Found {testResults.invoices.count} invoices in sample
                </p>
                
                {testResults.invoices.sampleInvoices?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Invoices:</strong>
                    <div className="mt-2 space-y-2">
                      {testResults.invoices.sampleInvoices.map((invoice, index) => (
                        <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-gray-600">Buyer: {invoice.buyer || 'N/A'}</div>
                              <div className="text-gray-600">Date: {formatDate(invoice.invoiceDate)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                              <div className={`text-xs px-2 py-1 rounded ${
                                invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'Finalized' ? 'bg-blue-100 text-blue-800' :
                                invoice.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {invoice.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.invoices.error}
              </p>
            )}
          </div>
        )}

        {/* Transactions Results */}
        {testResults.transactions && (
          <div className={`rounded-lg border p-4 ${getStatusBg(testResults.transactions.success)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusIcon(testResults.transactions.success)} Transactions List Test
              </h3>
              <span className="text-sm text-gray-500">
                {formatTimestamp(testResults.transactions.timestamp)}
              </span>
            </div>

            {testResults.transactions.success ? (
              <div className="space-y-3">
                <p className={`font-medium ${getStatusColor(true)}`}>
                  Found {testResults.transactions.count} transactions in sample
                </p>
                
                {testResults.transactions.sampleTransactions?.length > 0 && (
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>Sample Transactions:</strong>
                    <div className="mt-2 space-y-2">
                      {testResults.transactions.sampleTransactions.map((transaction, index) => (
                        <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">Part: {transaction.partId || 'N/A'}</div>
                              <div className="text-gray-600">Type: {transaction.movementType || 'N/A'}</div>
                              {transaction.invoice && (
                                <div className="text-gray-600">Invoice: {transaction.invoice}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">Qty: {transaction.quantity || 0}</div>
                              <div className="text-gray-600">{formatCurrency(transaction.unitPrice)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`font-medium ${getStatusColor(false)}`}>
                Error: {testResults.transactions.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* No Results Message */}
      {Object.keys(testResults).length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-4">🧪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test SharePoint Integration</h3>
          <p className="text-gray-600">
            Click the test buttons above to verify live connectivity and data retrieval
          </p>
        </div>
      )}

      {/* Configuration Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">SharePoint Configuration</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Site URL:</strong> {import.meta.env.VITE_SHAREPOINT_SITE_URL}</p>
          <p><strong>Client ID:</strong> {import.meta.env.VITE_CLIENT_ID?.substring(0, 8)}...</p>
          <p><strong>Lists Being Tested:</strong></p>
          <ul className="ml-4 mt-1 grid grid-cols-2 gap-1">
            <li>• Buyers: {import.meta.env.VITE_BUYERS_LIST_NAME}</li>
            <li>• Invoices: {import.meta.env.VITE_INVOICES_LIST_NAME}</li>
            <li>• Transactions: {import.meta.env.VITE_TRANSACTIONS_LIST_NAME}</li>
            <li>• Parts: {import.meta.env.VITE_PARTS_LIST_NAME}</li>
          </ul>
        </div>
      </div>

      {/* Return to Application */}
      <div className="text-center">
        <button 
          onClick={() => window.history.back()}
          className="btn btn-secondary"
        >
          ← Back to Invoice List
        </button>
      </div>
    </div>
  )
}

export default SharePointConnectionTest