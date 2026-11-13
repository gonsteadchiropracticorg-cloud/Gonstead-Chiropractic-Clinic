"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Lock, User, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { signInAdmin } from "@/lib/data-service"
import { getCurrentUser } from "@/lib/data-service"
import Image from "next/image"

export default function AdminAuth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "checking">("checking")

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

    try {
      // Validate input
      if (!email.trim() || !password.trim()) {
        throw new Error("Please enter both email and password")
      }

      console.log("Auth: Attempting sign in with:", email)

      // Attempt authentication
      const { user, error } = await signInAdmin(email.trim(), password.trim())

      if (error) {
        console.error("Auth: Sign in error:", error)
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
    } catch (error: any) {
      console.error("Auth: Sign in failed:", error)

      let errorMessage = "Authentication failed. Please try again."

      if (error.message?.includes("Failed to fetch")) {
        errorMessage = "Connection issue. Please check your internet connection and try again."
        setError(errorMessage)
        return
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
      // Offline authentication has been disabled for security.
      // All admin access must go through proper Supabase authentication.
      setError("Offline access is not available. Please check your internet connection and try again.")
    } catch (error) {
      console.error("Offline auth error:", error)
      setError("Authentication failed - please ensure you have internet connectivity")
    }
  }


  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[rgb(220,230,229)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#0d5c75] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#0d5c75] font-semibold text-base font-poppins">Checking Authentication...</p>
          <p className="text-gray-500 text-xs mt-1">Verifying administrative security credentials</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-[#0d5c75]/20 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="text-center space-y-3 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-6 relative overflow-hidden">
          <div className="w-20 h-20 mx-auto relative rounded-2xl bg-white/95 p-2 shadow-md">
            <Image
              src="/images/gonstead-chiropractic-logo-new.png"
              alt="Gonstead Chiropractic Logo"
              fill
              className="object-contain p-1.5"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/gonstead-logo-new.png";
              }}
            />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold font-poppins tracking-tight">Admin Portal</CardTitle>
            <CardDescription className="text-teal-100 text-xs mt-1">Gonstead Chiropractic Clinical Management System</CardDescription>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-1.5 text-xs">
            {connectionStatus === "online" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-medium">
                <Wifi className="h-3 w-3 text-emerald-300" />
                Secure Live Connection
              </span>
            ) : connectionStatus === "offline" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-[11px] font-medium">
                <WifiOff className="h-3 w-3 text-rose-300" />
                Offline Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-teal-200 text-[11px]">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                Checking connection...
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-4">
          {error && (
            <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#0d5c75] font-semibold text-xs flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#2a9d8f]" />
                Admin Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-xl border-[#0d5c75]/20 focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75] bg-slate-50/50"
                placeholder="admin@gonsteadchiropractic.org"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#0d5c75] font-semibold text-xs flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#2a9d8f]" />
                Admin Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl border-[#0d5c75]/20 focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75] bg-slate-50/50 pr-10"
                  placeholder="Enter administrator password"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0d5c75] hover:bg-[#0a4a5c] text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md text-xs sm:text-sm mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Authenticating Session...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sign In to Dashboard
                </div>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-[11px] text-gray-500 border-t border-gray-100 space-y-0.5">
            <p className="font-medium text-gray-600">Restricted Medical Staff & Practitioner Access</p>
            <p>© Gonstead Chiropractic Clinic • Dr. Bashir Khan</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
