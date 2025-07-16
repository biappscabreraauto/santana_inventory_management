import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = 'User' }) => {
  const { isAuthenticated, authorizationChecked, hasRole, loading, error } = useAuth();

  // Show loading while checking authorization
  if (!authorizationChecked || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if authorization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (!hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-yellow-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Insufficient Permissions</h2>
          <p className="text-gray-600">You don't have the required permissions to access this area.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;