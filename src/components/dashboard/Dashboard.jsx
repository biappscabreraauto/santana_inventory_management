import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const Dashboard = () => {
  const { user } = useAuth()
  const { success } = useToast()

  React.useEffect(() => {
    success(`Welcome back, ${user?.name || 'User'}!`)
  }, [user?.name, success])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <p className="text-gray-600">
          Welcome to Santana Inventory Management! This is a placeholder dashboard.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900">Total Parts</h3>
            <p className="text-2xl font-bold text-blue-600">1,234</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900">Active Invoices</h3>
            <p className="text-2xl font-bold text-green-600">56</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900">Total Buyers</h3>
            <p className="text-2xl font-bold text-purple-600">78</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard