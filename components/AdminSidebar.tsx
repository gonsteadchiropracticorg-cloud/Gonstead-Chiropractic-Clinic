"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Database,
  UserCheck,
  PillIcon as Prescription,
  Activity,
  X,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  Clock,
  TrendingUp,
  Eye,
  DollarSign,
  Star,
  MapPin
} from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPath?: string
}

interface MenuItem {
  id: string
  title: string
  href?: string
  icon: any
  description?: string
  badge?: string
  children?: MenuItem[]
  category?: string
}

const sidebarItems: MenuItem[] = [
  {
    id: "overview",
    title: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Main dashboard",
    category: "main"
  },
  {
    id: "patients",
    title: "Patient Management",
    icon: Users,
    description: "Manage patients",
    category: "core",
    children: [
      { id: "patient-tracking", title: "Patient Tracking", href: "/admin/patient-tracking", icon: Activity },
    ]
  },
  {
    id: "appointments",
    title: "Appointments",
    icon: Calendar,
    description: "Schedule & manage",
    category: "core",
    children: [
      { id: "calendar", title: "Calendar View", href: "/admin/calendar", icon: Calendar },
    ]
  },
  {
    id: "medical",
    title: "Medical History",
    href: "/medical-history",
    icon: FileText,
    description: "Patient health records",
    category: "core"
  },
  {
    id: "prescriptions",
    title: "Prescriptions",
    href: "/admin/prescription",
    icon: Prescription,
    description: "Digital prescriptions",
    category: "core"
  },
  {
    id: "money-management",
    title: "Money Management",
    href: "/admin/money-management",
    icon: DollarSign,
    description: "Financial records & payments",
    category: "core",
    badge: "Secure"
  },
  {
    id: "reviews",
    title: "Reviews & Ratings",
    href: "/admin/reviews",
    icon: Star,
    description: "Manage patient reviews & feedback",
    category: "core",
    badge: "New"
  },
  {
    id: "analytics",
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Performance data",
    category: "insights"
  },
  {
    id: "website-analytics",
    title: "Website Visitor Analytics",
    href: "/admin/website-analytics",
    icon: TrendingUp,
    description: "Real-time website tracking",
    badge: "Live",
    category: "insights"
  },
  {
    id: "administration",
    title: "Administration",
    icon: Settings,
    description: "System management",
    category: "admin",
    children: [
      { id: "settings", title: "Basic Settings", href: "/admin/settings", icon: Settings },
      { id: "location-settings", title: "Location & Maps", href: "/admin/location-settings", icon: MapPin },
      { id: "import-export", title: "Import/Export", href: "/admin/import-export", icon: Database },
    ]
  },
  {
    id: "staff",
    title: "Staff Management",
    href: "/staff-dashboard",
    icon: UserCheck,
    description: "Manage staff",
    category: "admin"
  }
]

export default function AdminSidebar({ isOpen, onClose, currentPath }: AdminSidebarProps) {
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
  }, [])

  // Update time every minute
  useEffect(() => {
    if (!mounted) return
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [mounted])

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleNavigation = (href: string) => {
    if (href) {
      console.log('AdminSidebar: Navigating to:', href)
      router.push(href)
      onClose()
    }
  }

  const handleLogout = () => {
    // Add logout logic here
    router.push('/staff-login')
    onClose()
  }

  const isActiveItem = (item: MenuItem): boolean => {
    if (item.href === currentPath) return true
    if (item.children) {
      return item.children.some(child => child.href === currentPath)
    }
    return false
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar with smooth slide animation */}
      <div className={`fixed top-0 left-0 h-screen w-80 bg-white shadow-2xl z-50 border-r border-gray-200 transform transition-transform duration-300 ease-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ maxHeight: '100vh', overflowY: 'hidden' }}>
        {/* Professional Header - Fixed height */}
        <div className="flex-shrink-0 bg-gradient-to-br from-[#0d5c75] via-[#1a6b7d] to-[#2a9d8f] text-white relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-4 -translate-x-4"></div>
          </div>
          
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Image
                    src="/images/gonstead-chiropractic-logo-new.png"
                    alt="Gonstead Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                    priority
                    onError={(e) => {
                      console.log('Image failed to load, showing fallback');
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div className="text-white font-bold text-sm" style={{ display: 'none' }}>
                    GC
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold font-poppins tracking-wide">Admin Portal</h2>
                  <p className="text-sm text-white/90 font-medium">Management System</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Doctor Info Card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-inner">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Dr. Bashir Khan</p>
                  <p className="text-xs text-white/80">Gonstead Specialist</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="bg-green-500/30 px-2 py-1 rounded-full text-green-100 font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* Scrollable Navigation Menu - Takes remaining space */}
        <div className="admin-sidebar-scroll">
          <div className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveItem(item)
              const isExpanded = expandedItems.has(item.id)
              const hasChildren = item.children && item.children.length > 0
              
              return (
                <div key={item.id} className="space-y-1">
                  {/* Main Menu Item */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      if (hasChildren) {
                        console.log('AdminSidebar: Toggling expansion for:', item.id)
                        toggleExpanded(item.id)
                      } else if (item.href) {
                        console.log('AdminSidebar: Direct navigation to:', item.href)
                        handleNavigation(item.href)
                      }
                    }}
                    className={`
                      w-full text-left p-3 rounded-xl transition-all duration-200 group relative
                      ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white shadow-lg border-l-4 border-white/30' 
                          : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
                          ${
                            isActive 
                              ? 'bg-white/25 shadow-sm' 
                              : 'bg-gray-100 group-hover:bg-[#0d5c75]/10'
                          }
                        `}>
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#0d5c75]'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-sm ${
                              isActive ? 'text-white' : 'text-gray-800'
                            }`}>
                              {item.title}
                            </h3>
                            {item.badge && (
                              <Badge variant={isActive ? 'secondary' : 'default'} className="text-xs px-1.5 py-0.5">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className={`text-xs mt-0.5 ${
                              isActive ? 'text-white/80' : 'text-gray-500'
                            }`}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {hasChildren && (
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        } ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </button>
                  
                  {/* Submenu Items */}
                  {hasChildren && (
                    <div className={`overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon
                          const isChildActive = child.href === currentPath
                          
                          return (
                            <button
                              key={child.id}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('AdminSidebar: Child navigation to:', child.href)
                                if (child.href) {
                                  handleNavigation(child.href)
                                }
                              }}
                              className={`
                                w-full text-left p-2.5 rounded-lg transition-all duration-200 group
                                ${
                                  isChildActive 
                                    ? 'bg-[#0d5c75]/10 text-[#0d5c75] border-l-2 border-[#0d5c75]' 
                                    : 'hover:bg-gray-50 text-gray-600'
                                }
                              `}
                            >
                              <div className="flex items-center gap-2.5">
                                <ChildIcon className={`h-3.5 w-3.5 ${
                                  isChildActive ? 'text-[#0d5c75]' : 'text-gray-500'
                                }`} />
                                <span className={`text-sm font-medium ${
                                  isChildActive ? 'text-[#0d5c75]' : 'text-gray-700'
                                }`}>
                                  {child.title}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Extra padding at the bottom to ensure last items are accessible */}
          <div className="h-16"></div>
        </div>

        {/* Professional Footer - Fixed at bottom */}
        <div className="flex-shrink-0 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200">
          <div className="p-4">
            {/* Help and Logout */}
            <div className="flex gap-2 mb-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleNavigation('/admin/help')}
                className="flex-1 text-gray-600 hover:text-[#0d5c75] hover:bg-[#0d5c75]/5 transition-all duration-200"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Help</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Logout</span>
              </Button>
            </div>
            
            {/* Clinic Info */}
            <div className="text-center border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-600 font-semibold">
                Gonstead Chiropractic Management
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Professional Healthcare System v2.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
