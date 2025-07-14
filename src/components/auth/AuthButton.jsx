import React from 'react'
import { useIsAuthenticated } from '@azure/msal-react'
import { useAuth } from '../../context/AuthContext'
import { ButtonLoader } from '../shared/LoadingSpinner'

const AuthButton = () => {
  const isAuthenticated = useIsAuthenticated()
  const { signIn, signOut, loading } = useAuth()

  if (isAuthenticated) {
    return (
      <button
        onClick={signOut}
        disabled={loading}
        className="btn btn-outline w-full flex items-center justify-center"
      >
        {loading && <ButtonLoader color="gray" />}
        <span className="mr-2">🚪</span>
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="btn btn-primary w-full flex items-center justify-center text-lg py-3"
    >
      {loading && <ButtonLoader color="white" />}
      <span className="mr-2">🔐</span>
      Sign In with Microsoft 365
    </button>
  )
}

export default AuthButton