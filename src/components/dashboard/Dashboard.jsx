import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useSharePointData, useTransactions } from '../../hooks/useSharePoint'
import LoadingSpinner from '../shared/LoadingSpinner'

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

const Dashboard = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const [viewMode, setViewMode] = useState('value') // 'value' or 'quantity'
  const [chartType, setChartType] = useState('family') // 'family' or 'category'

  // Load SharePoint data - Now includes categories for family mapping
  const { 
    parts, 
    categoriesByFamily,
    categoryMap,
    loading: partsLoading, 
    error: partsError 
  } = useSharePointData()

  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions({ top: 20 }) // Get recent transactions

  const loading = partsLoading || transactionsLoading
  const error = partsError || transactionsError

  React.useEffect(() => {
    if (user?.name && !loading) {
      success(`Welcome back, ${user.name}!`)
    }
  }, [user?.name, success, loading])

  // Calculate top selling parts based on transaction data - Fixed to match TransactionHistory logic
  const topSellingParts = useMemo(() => {
    if (!transactions || !parts) return []
    
    const salesData = {}
    
    transactions
      .filter(transaction => transaction.movementType === 'Out (Sold)' || transaction.MovementType === 'Out (Sold)')
      .forEach(transaction => {
        const partTitle = transaction.partId || transaction.Part || transaction.part
        const part = parts.find(p => p.Title === partTitle || p.partId === partTitle)
        if (part) {
          const partKey = part.Title || part.partId
          if (!salesData[partKey]) {
            salesData[partKey] = {
              partId: partKey,
              description: part.Description || part.description,
              totalSold: 0,
              totalValue: 0
            }
          }
          
          const quantity = transaction.quantity || transaction.Quantity || 0
          salesData[partKey].totalSold += quantity
          
          // Use same logic as TransactionHistory: unitPrice for outbound transactions
          const unitPrice = transaction.unitPrice || transaction.UnitPrice || 0
          salesData[partKey].totalValue += quantity * unitPrice
        }
      })
    
    return Object.values(salesData)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
  }, [transactions, parts])

  // Get recent transactions with part details - Fixed to match TransactionHistory logic
  const recentTransactions = useMemo(() => {
    if (!transactions || !parts) return []
    
    // Helper function from TransactionHistory
    const isInventoryIncrease = (movementType) => {
      return movementType?.includes('In') || 
            movementType === 'Adjustment' || 
            movementType === 'Void adjustment';
    };

    const getTransactionTotal = (transaction) => {
      if (isInventoryIncrease(transaction.movementType)) {
        const cost = transaction.unitCost || 0
        return transaction.quantity * cost
      } else if (transaction.movementType?.includes('Out')) {
        const price = transaction.unitPrice || 0
        return transaction.quantity * price
      }
      return 0
    }
    
    return transactions
      .sort((a, b) => new Date(b.created || b.Created || new Date()) - new Date(a.created || a.Created || new Date()))
      .slice(0, 8)
      .map(transaction => {
        const partTitle = transaction.partId || transaction.Part || transaction.part
        const part = parts.find(p => p.Title === partTitle || p.partId === partTitle)
        
        return {
          ...transaction,
          partId: partTitle,
          partDescription: part?.Description || part?.description || 'Unknown Part',
          type: transaction.movementType || transaction.MovementType || transaction.type,
          date: transaction.created || transaction.Created || transaction.date || transaction.transactionDate,
          quantity: transaction.quantity || transaction.Quantity || 0,
          value: getTransactionTotal(transaction)
        }
      })
  }, [transactions, parts])

  // Calculate inventory data by family and category using the categories mapping
  const inventoryData = useMemo(() => {
    if (!parts) return { family: [], category: [] }
    
    const familyData = {}
    const categoryData = {}
    
    parts.forEach(part => {
      const inventoryValue = (part.InventoryOnHand || part.inventoryOnHand || 0) * (part.UnitCost || part.unitCost || 0)
      const category = part.Category || part.category || 'Unknown Category'
      
      // Get family from category mapping (if available)
      let family = 'Unknown Family'
      if (categoryMap && categoryMap.has && categoryMap.has(category)) {
        family = categoryMap.get(category).family || 'Unknown Family'
      } else if (part.family) {
        family = part.family
      }
      
      // Group by family
      if (!familyData[family]) {
        familyData[family] = {
          name: family,
          quantity: 0,
          value: 0
        }
      }
      familyData[family].quantity += part.InventoryOnHand || part.inventoryOnHand || 0
      familyData[family].value += inventoryValue
      
      // Group by category
      if (!categoryData[category]) {
        categoryData[category] = {
          name: category,
          quantity: 0,
          value: 0
        }
      }
      categoryData[category].quantity += part.InventoryOnHand || part.inventoryOnHand || 0
      categoryData[category].value += inventoryValue
    })
    
    return {
      family: Object.values(familyData).sort((a, b) => b.value - a.value),
      category: Object.values(categoryData).sort((a, b) => b.value - a.value)
    }
  }, [parts, categoryMap])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Out (Sold)':
        return 'bg-blue-100 text-blue-800'
      case 'In (Received)':
        return 'bg-green-100 text-green-800'
      case 'Adjustment':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentData = inventoryData[chartType]
  const dataKey = viewMode === 'value' ? 'value' : 'quantity'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your inventory management system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Parts</p>
                <p className="text-3xl font-bold text-blue-600">{parts?.length || 0}</p>
              </div>
              <div className="text-blue-500 text-3xl">📦</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory Value</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(parts?.reduce((sum, part) => 
                    sum + ((part.InventoryOnHand || part.inventoryOnHand || 0) * (part.UnitCost || part.unitCost || 0)), 0
                  ) || 0)}
                </p>
              </div>
              <div className="text-green-500 text-3xl">💰</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-red-600">
                  {parts?.filter(part => (part.InventoryOnHand || part.inventoryOnHand || 0) <= 5 && (part.InventoryOnHand || part.inventoryOnHand || 0) > 0).length || 0}
                </p>
              </div>
              <div className="text-red-500 text-3xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-3xl font-bold text-orange-600">
                  {parts?.filter(part => (part.InventoryOnHand || part.inventoryOnHand || 0) === 0).length || 0}
                </p>
              </div>
              <div className="text-orange-500 text-3xl">🚫</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Selling Parts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Selling Parts</h2>
            {topSellingParts.length > 0 ? (
              <div className="space-y-4">
                {topSellingParts.map((part, index) => (
                  <div key={part.partId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{part.partId}</p>
                        <p className="text-xs text-gray-500 truncate max-w-32" title={part.description}>
                          {part.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(part.totalValue)}</p>
                      <p className="text-xs text-gray-500">{part.totalSold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales data available yet</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-900">Part</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-900">Type</th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-900">Qty</th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-900">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentTransactions.map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                        <td className="py-3">
                          <button 
                            onClick={() => alert(`View details for ${transaction.partId}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {transaction.partId}
                          </button>
                          <p className="text-xs text-gray-500 truncate max-w-40" title={transaction.partDescription}>
                            {transaction.partDescription}
                          </p>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 text-right text-sm text-gray-900">{transaction.quantity || 0}</td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.value || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions available yet</p>
            )}
          </div>
        </div>

        {/* Inventory Analytics Chart */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Inventory Analytics</h2>
            <div className="flex items-center space-x-4">
              {/* Chart Type Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setChartType('family')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    chartType === 'family' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  By Family
                </button>
                <button
                  onClick={() => setChartType('category')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    chartType === 'category' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  By Category
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('value')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'value' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Value
                </button>
                <button
                  onClick={() => setViewMode('quantity')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'quantity' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Quantity
                </button>
              </div>
            </div>
          </div>

          {currentData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Inventory {viewMode === 'value' ? 'Value' : 'Quantity'} by {chartType === 'family' ? 'Family' : 'Category'}
                </h3>
                {chartType === 'family' && !categoryMap && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Loading:</strong> Family grouping data is being loaded from Categories list...
                    </p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={viewMode === 'value' ? (value) => `${value}` : undefined}
                    />
                    <Tooltip 
                      formatter={viewMode === 'value' 
                        ? (value) => [formatCurrency(value), 'Value']
                        : (value) => [value, 'Quantity']
                      }
                    />
                    <Bar dataKey={dataKey} fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Distribution by {chartType === 'family' ? 'Family' : 'Category'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={currentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey={dataKey}
                    >
                      {currentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={viewMode === 'value' 
                        ? (value) => [formatCurrency(value), 'Value']
                        : (value) => [value, 'Quantity']
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No inventory data available yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard