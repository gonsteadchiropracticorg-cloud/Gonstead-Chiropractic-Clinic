"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminAutoSidebar } from "@/components/AdminAutoSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuth, setIsAuth] = useState<boolean | null>(null)

  const isAuthPage = pathname === "/admin/auth" || 
                     pathname === "/staff-login" || 
                     pathname?.includes("/auth") || 
                     pathname?.includes("/login")

  useEffect(() => {
    if (typeof window === "undefined") return

    // Allow auth pages immediately
    if (isAuthPage) {
      setIsAuth(false)
      return
    }

    // Verify admin authentication flag
    const authenticated = localStorage.getItem("admin_authenticated") === "true"
    const adminEmail = localStorage.getItem("admin_email")

    if (!authenticated || !adminEmail) {
      setIsAuth(false)
      router.replace("/admin/auth")
    } else {
      setIsAuth(true)
    }
  }, [pathname, isAuthPage, router])

  // While checking auth on protected admin pages, render clean loading backdrop
  if (!isAuthPage && isAuth !== true) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[rgb(174,193,192)] flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60 text-center max-w-sm w-full mx-4">
          <div className="w-12 h-12 border-4 border-[#0d5c75]/20 border-t-[#0d5c75] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-[#0d5c75] font-bold text-base font-poppins">Securing Admin Session</h2>
          <p className="text-gray-500 text-xs mt-1">Verifying administrator credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-gray-950 overflow-x-hidden">
      {!isAuthPage && isAuth && <AdminAutoSidebar />}
      <div className={`transition-all duration-300 ${isAuthPage || !isAuth ? "pl-0" : "pl-14 sm:pl-16"} max-w-full overflow-x-hidden`}>
        {children}
      </div>
    </div>
  )
}
