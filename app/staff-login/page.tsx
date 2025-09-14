'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Shield, Stethoscope, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { signInStaff, getCurrentUser } from '@/lib/supabase'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await getCurrentUser()
        if (user) {
          router.push('/staff-dashboard')
          return
        }
      } catch (error) {
        console.log('No existing session')
      } finally {
        setIsChecking(false)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password')
      }

      const { user, error: signInError } = await signInStaff(email, password)

      if (signInError) {
        throw signInError
      }

      if (user) {
        // Store authentication state
        localStorage.setItem('staff_authenticated', 'true')
        localStorage.setItem('staff_email', user.email || '')
        localStorage.setItem('staff_user_id', user.id)
        
        // Redirect to staff dashboard
        router.push('/staff-dashboard')
      } else {
        throw new Error('Sign in failed - no user returned')
      }
    } catch (error: any) {
      console.error('Staff login error:', error)
      setError(error.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Professional Header */}
          <div className="bg-emerald-600 px-6 py-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Staff Portal</h1>
                <p className="text-xs text-emerald-100">Gonstead Chiropractic</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Enter staff email"
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="Enter password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Staff Access Information */}
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-1 text-emerald-600" />
                Staff Access Information:
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></span>
                  Read-only access to patient data
                </li>
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></span>
                  Real-time appointment updates
                </li>
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></span>
                  Contact admin for password changes
                </li>
                <li className="flex items-center">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></span>
                  Session expires after inactivity
                </li>
              </ul>
            </div>

            {/* Compact Footer */}
            <div className="text-center text-xs text-gray-500 pt-1">
              <p>Need help? Contact clinic administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
