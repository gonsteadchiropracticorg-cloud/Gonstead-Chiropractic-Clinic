"use client"

import { usePathname } from "next/navigation"
import { AdminAutoSidebar } from "@/components/AdminAutoSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/admin/auth" || pathname === "/staff-login"

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-gray-950 overflow-x-hidden">
      {!isAuthPage && <AdminAutoSidebar />}
      <div className={`transition-all duration-300 ${isAuthPage ? "pl-0" : "pl-14 sm:pl-16"} max-w-full overflow-x-hidden`}>
        {children}
      </div>
    </div>
  )
}
