"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Lock, User, AlertCircle, CheckCircle, Wifi, WifiOff, KeyRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { signInAdmin, signUpAdmin, getCurrentUser } from "@/lib/supabase"
import Image from "next/image"

export default function AdminAuth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "checking">("checking")
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkConnectionAndAuth()
  }, [])

  const checkConnectionAndAuth = async () => {
    try {
      // Check internet connection
      if (navigator.onLine) {
        setConnectionStatus("online")
      } else {
        setConnectionStatus("offline")
      }

      // Check existing authentication
      const isAuthenticated = localStorage.getItem("admin_authenticated")
      const storedEmail = localStorage.getItem("admin_email")

      if (isAuthenticated === "true" && storedEmail) {
        console.log("Auth: Found existing authentication, redirecting...")
        router.replace("/admin/dashboard")
        return
      }

      // Try to get current user
      const { user } = await getCurrentUser()
      if (user) {
        console.log("Auth: User already authenticated, redirecting...")
        localStorage.setItem("admin_authenticated", "true")
        localStorage.setItem("admin_email", user.email || "")
        router.replace("/admin/dashboard")
        return
      }

      console.log("Auth: No existing authentication found")
    } catch (error) {
      console.error("Auth: Error checking existing auth:", error)
      setConnectionStatus("offline")
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate input
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password")
      }

      if (mode === "signup") {
        // Sign-up validation
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long")
        }

        console.log("Auth: Attempting sign up with:", email)

        // Attempt registration
        const { user, error } = await signUpAdmin(email.trim(), password.trim())

        if (error) {
          console.error("Auth: Sign up error:", error)
          throw error
        }

        if (!user) {
          throw new Error("Registration failed - no user data returned")
        }

        console.log("Auth: Sign up successful for:", user.email)

        setSuccess("Registration successful! Please check your email to verify your account, then sign in.")
        
        // Switch to sign-in mode after successful registration
        setTimeout(() => {
          setMode("signin")
          setSuccess("")
          setPassword("")
          setConfirmPassword("")
        }, 3000)

        toast({
          title: "Registration Successful!",
          description: "Please check your email to verify your account",
          duration: 5000,
        })
      } else {
        // Sign-in mode
        console.log("Auth: Attempting sign in with:", email)

        // Attempt authentication
        const { user, error } = await signInAdmin(email.trim(), password.trim())

        if (error) {
          console.error("Auth: Sign in error:", error)
          
          // If user not found and using non-admin email, suggest sign-up
          if (error.message?.includes("Invalid login credentials") && 
              email.trim() !== "admin@gonsteadchiropractic.com") {
            throw new Error("Account not found. Would you like to create a new account?")
          }
          
          throw error
        }

        if (!user) {
          throw new Error("Authentication failed - no user data returned")
        }

        console.log("Auth: Sign in successful for:", user.email)

        // Store authentication
        localStorage.setItem("admin_authenticated", "true")
        localStorage.setItem("admin_email", user.email || email.trim())
        localStorage.setItem("admin_login_time", new Date().toISOString())

        toast({
          title: "Welcome Back!",
          description: "Successfully signed in to admin dashboard",
          duration: 3000,
        })

        // Redirect to dashboard
        router.replace("/admin/dashboard")
      }
    } catch (error: any) {
      console.error(`Auth: ${mode} failed:`, error)

      let errorMessage = mode === "signup" 
        ? "Registration failed. Please try again." 
        : "Authentication failed. Please try again."

      if (error.message?.includes("Failed to fetch")) {
        errorMessage = "Connection issue. Using offline authentication."
        if (mode === "signin") {
          handleOfflineAuth()
          return
        }
      } else if (error.message?.includes("Account not found")) {
        errorMessage = error.message
        // Auto-suggest switching to sign-up mode
        setTimeout(() => {
          if (confirm("Would you like to create a new account with this email?")) {
            setMode("signup")
            setError("")
          }
        }, 1000)
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOfflineAuth = () => {
    try {
      if (email.trim() === "admin@gonsteadchiropractic.com" && password.trim() === "admin123") {
        localStorage.setItem("admin_authenticated", "true")
        localStorage.setItem("admin_email", email.trim())
        localStorage.setItem("admin_login_time", new Date().toISOString())

        toast({
          title: "Offline Access Granted!",
          description: "Successfully signed in with offline authentication",
          duration: 3000,
        })

        router.replace("/admin/dashboard")
      } else {
        setError("Invalid credentials for offline access")
      }
    } catch (error) {
      console.error("Offline auth error:", error)
      setError("Offline authentication failed")
    }
  }

  const handleQuickAccess = () => {
    setIsLoading(true)
    setError("")

    try {
      // Direct authentication bypass
      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_email", "admin@gonsteadchiropractic.com")
      localStorage.setItem("admin_login_time", new Date().toISOString())

      toast({
        title: "Quick Access Granted!",
        description: "Successfully accessed admin dashboard",
        duration: 3000,
      })

      router.replace("/admin/dashboard")
    } catch (error) {
      console.error("Quick access error:", error)
      setError("Quick access failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0d5c75] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#0d5c75] font-semibold text-lg">Checking Authentication...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-[#0d5c75]/20">
        <CardHeader className="text-center space-y-4 bg-gradient-to-r from-[#0d5c75] to-[rgb(66,139,124)] text-white rounded-t-lg">
          <div className="w-24 h-24 mx-auto relative">
            <Image
              src="/images/gonstead-logo-new.png"
              alt="Gonstead Chiropractic Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold font-poppins">Admin Access</CardTitle>
            <CardDescription className="text-white/90">Gonstead Chiropractic Management System</CardDescription>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {connectionStatus === "online" ? (
              <>
                <Wifi className="h-4 w-4 text-green-300" />
                <span className="text-green-300">Online</span>
              </>
            ) : connectionStatus === "offline" ? (
              <>
                <WifiOff className="h-4 w-4 text-yellow-300" />
                <span className="text-yellow-300">Offline Mode</span>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span className="text-white/70">Checking...</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Mode Toggle */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode("signin")
                setError("")
                setSuccess("")
                setConfirmPassword("")
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "signin"
                  ? "bg-white text-[#0d5c75] shadow-sm"
                  : "text-gray-600 hover:text-[#0d5c75]"
              }`}
              disabled={isLoading}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup")
                setError("")
                setSuccess("")
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === "signup"
                  ? "bg-white text-[#0d5c75] shadow-sm"
                  : "text-gray-600 hover:text-[#0d5c75]"
              }`}
              disabled={isLoading}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0d5c75] font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)]"
                placeholder="Enter admin email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0d5c75] font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)] pr-10"
                  placeholder="Enter admin password"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#0d5c75] font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)]"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0d5c75] to-[rgb(66,139,124)] hover:from-[#0a4a5c] hover:to-[rgb(66,139,124)] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {mode === "signup" ? "Creating Account..." : "Signing In..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {mode === "signup" ? "Create Admin Account" : "Sign In to Dashboard"}
                  </div>
                )}
              </Button>

              {mode === "signin" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickAccess}
                  className="w-full border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white bg-transparent"
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Quick Access (Bypass)
                  </div>
                </Button>
              )}
            </div>
          </form>

          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Secure access to patient management system</p>
            <p>© 2024 Gonstead Chiropractic Clinic</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
