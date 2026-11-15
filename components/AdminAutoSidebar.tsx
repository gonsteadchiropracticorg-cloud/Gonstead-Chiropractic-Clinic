"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  TrendingUp,
  Settings,
  UserCheck,
  ChevronRight,
  LogOut,
  HelpCircle,
  Activity,
  MapPin,
  Pill as Prescription,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { signOutAdmin } from "@/lib/data-service"

interface NavItem {
  id: string
  title: string
  href: string
  icon: any
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { id: "patient-tracking", title: "Patient Tracking", href: "/admin/patient-tracking", icon: Users },
  { id: "medical-history", title: "Medical History", href: "/medical-history", icon: FileText },
  { id: "prescriptions", title: "Prescriptions", href: "/admin/prescription", icon: Prescription },
  { id: "money-management", title: "Money Management", href: "/admin/money-management", icon: DollarSign },
  { id: "analytics", title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { id: "staff-access", title: "Staff Access", href: "/admin/staff-access", icon: UserCheck },
  { id: "audit-logs", title: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
  { id: "settings", title: "Clinic Settings", href: "/admin/settings", icon: Settings },
  { id: "help", title: "Help & Guides", href: "/admin/help", icon: HelpCircle },
]

export function AdminAutoSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const [isHovered, setIsHovered] = useState(false)
  const [isPinnedOpen, setIsPinnedOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_authenticated") === "true"
    }
    return false
  })

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false)
    setIsPinnedOpen(false)
    setIsHovered(false)
  }, [pathname])

  // Custom events for global toggling
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen(prev => !prev)
    const handleOpen = () => setIsMobileOpen(true)
    const handleClose = () => setIsMobileOpen(false)
    window.addEventListener("toggle-admin-sidebar", handleToggle)
    window.addEventListener("open-admin-sidebar", handleOpen)
    window.addEventListener("close-admin-sidebar", handleClose)
    return () => {
      window.removeEventListener("toggle-admin-sidebar", handleToggle)
      window.removeEventListener("open-admin-sidebar", handleOpen)
      window.removeEventListener("close-admin-sidebar", handleClose)
    }
  }, [])

  // Prefetch all admin subpages into browser cache on mount for instant 0ms page transitions
  useEffect(() => {
    mainNavItems.forEach((item) => {
      if (item.href) {
        try {
          router.prefetch(item.href)
        } catch (e) {}
      }
    })
  }, [router])

  useEffect(() => {
    // Check client-side authentication state
    const checkAuth = () => {
      const auth = localStorage.getItem("admin_authenticated") === "true"
      setIsAuthenticated(auth)
    }
    checkAuth()

    const handleStorage = () => checkAuth()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // Never render on auth/login pages or when not authenticated
  const isLoginPage = pathname === "/admin/auth" || 
                      pathname === "/staff-login" || 
                      pathname?.includes("/auth") || 
                      pathname?.includes("/login")

  if (isLoginPage || !isAuthenticated) {
    return null
  }

  const isExpanded = isHovered || isPinnedOpen

  const handleLogout = async () => {
    try {
      localStorage.removeItem("admin_authenticated")
      localStorage.removeItem("admin_email")
      localStorage.removeItem("admin_auth")
      localStorage.removeItem("admin_token")
      sessionStorage.clear()
      await signOutAdmin()
    } catch (e) {
      console.error("Logout error", e)
    }
    window.location.href = "/admin/auth"
  }

  return (
    <>
      {/* Mobile Drawer Floating Trigger Button (Small screens only) */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-2.5 left-2.5 z-40 p-2 rounded-xl bg-[#0d5c75]/95 hover:bg-[#0a485c] text-white shadow-lg border border-white/20 backdrop-blur-md active:scale-95 transition-all flex items-center gap-1.5"
        title="Open Navigation Menu"
        aria-label="Open Admin Menu"
      >
        <Menu className="w-4 h-4 text-teal-200" />
        <span className="text-[11px] font-semibold tracking-wide">Menu</span>
      </button>

      {/* Mobile Backdrop when drawer is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Touch/Pin Backdrop when pinned open */}
      {isPinnedOpen && (
        <div
          className="hidden md:block fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
          onClick={() => setIsPinnedOpen(false)}
        />
      )}

      {/* Main Admin Sidebar: Collapsible Slide-in Drawer on Mobile (<md), Fixed Icon Rail on Desktop (md+) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out flex flex-col justify-between select-none ${
          // Mobile state: off-screen by default, slides in when open
          isMobileOpen
            ? "translate-x-0 w-72 z-[99999] shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        } ${
          // Desktop state: 16 (64px) narrow rail, expands to 72 (288px) on hover/pin
          isExpanded ? "md:w-72" : "md:w-16"
        } md:z-40 ${
          isDarkMode
            ? "bg-gradient-to-b from-[#061820] via-[#0b2430] to-[#041017] text-white border-r border-[#153e52]"
            : "bg-gradient-to-b from-[#0d5c75] via-[#104859] to-[#0a3a47] text-white border-r border-[#0d5c75]/30"
        }`}
        style={{
          boxShadow: (isExpanded || isMobileOpen) ? "12px 0 36px rgba(13,92,117,0.4)" : "4px 0 18px rgba(13,92,117,0.22)",
        }}
        aria-label="Admin Navigation"
      >
        {/* Top Header / Clinic Branding - Clicking toggles pin open/close */}
        <div 
          onClick={() => setIsPinnedOpen(!isPinnedOpen)}
          className="p-3 border-b border-white/15 flex items-center gap-3 overflow-hidden shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
          title="Click to toggle sidebar pin"
        >
          <div
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md p-1.5 flex items-center justify-center shrink-0 border border-white/25 shadow-md group-hover:scale-105 transition-transform"
          >
            <Image
              src="/images/gonstead-chiropractic-logo-new.png"
              alt="Gonstead Logo"
              width={30}
              height={30}
              className="object-contain drop-shadow"
              priority
            />
          </div>

          {/* Expanded Brand Name */}
          <div
            className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 ${
              isExpanded || isMobileOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
            }`}
          >
            <h2 className="font-bold text-sm text-white tracking-wide leading-tight font-poppins">
              Dr. Bashir Khan
            </h2>
            <p className="text-[11px] text-[#2a9d8f] font-semibold">Gonstead Admin Portal</p>
          </div>

          {/* Close/Toggle icon when expanded or mobile drawer open */}
          {(isExpanded || isMobileOpen) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsPinnedOpen(false)
                setIsHovered(false)
                setIsMobileOpen(false)
              }}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/15 shrink-0 transition-colors"
              title="Close menu"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1.5 no-scrollbar">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  setIsPinnedOpen(false)
                  setIsMobileOpen(false)
                }}
                title={item.title}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 relative group ${
                  isActive
                    ? "bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] text-white shadow-md shadow-teal-950/30 font-semibold"
                    : "text-slate-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-xs" />
                )}

                <div className="shrink-0 flex items-center justify-center w-5 h-5">
                  <Icon
                    className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-teal-100 group-hover:text-white"
                    }`}
                  />
                </div>

                {/* Text Label on Expand or Mobile Drawer */}
                <span
                  className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    isExpanded || isMobileOpen ? "opacity-100 max-w-[180px]" : "opacity-0 max-w-0"
                  }`}
                >
                  {item.title}
                </span>

                {/* Trailing arrow on hover when expanded */}
                {(isExpanded || isMobileOpen) && isActive && (
                  <ChevronRight className="h-4 w-4 ml-auto text-white/90 shrink-0" />
                )}
              </Link>
            )
          })}

          {/* Logout as inline navigation item inside scrollable list */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-rose-200 hover:bg-rose-500/25 hover:text-white transition-all duration-200 group mt-2"
            title="Exit / Logout"
          >
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <LogOut className="h-5 w-5 transition-transform group-hover:scale-110 text-rose-300 group-hover:text-white" />
            </div>
            <span
              className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isExpanded || isMobileOpen ? "opacity-100 max-w-[180px]" : "opacity-0 max-w-0"
              }`}
            >
              Exit / Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
