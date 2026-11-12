import type { Metadata, Viewport } from "next"
import { AdminAutoSidebar } from "@/components/AdminAutoSidebar"

export const metadata: Metadata = {
  title: "Admin Dashboard - Gonstead Chiropractic",
  description: "Admin dashboard for patient management and clinic operations",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    title: "GC Admin",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d5c75",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-gray-950">
      <AdminAutoSidebar />
      <div className="pl-16 transition-all duration-300">
        {children}
      </div>
    </div>
  )
}

