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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-700">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Stethoscope className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Staff Portal
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Gonstead Chiropractic Clinic
          </p>
          <div className="flex items-center justify-center space-x-2 text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Secure Staff Access</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Staff Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter your staff email"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In to Staff Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start space-x-3 text-sm text-gray-600">
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700 mb-1">Secure Access</p>
                <p className="text-xs leading-relaxed">
                  This portal is restricted to authorized clinic staff only. 
                  All access is logged and monitored for security purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Having trouble accessing your account?</p>
            <p>Contact your clinic administrator for assistance.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 Gonstead Chiropractic Clinic. All rights reserved.</p>
          <p className="mt-1">Secure staff portal powered by Supabase Auth</p>
        </div>
      </div>
    </div>
  )
}
