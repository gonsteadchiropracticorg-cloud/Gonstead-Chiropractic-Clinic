import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Staff Dashboard - Gonstead Chiropractic",
  description:
    "Read-only staff dashboard for viewing clinic appointments and patient schedules.",
  manifest: "/staff-manifest.json",
  appleWebApp: {
    capable: true,
    title: "GC Staff",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d5c75",
}

import { AdminAutoSidebar } from "@/components/AdminAutoSidebar"

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <AdminAutoSidebar />
      <div className="pl-16 transition-all duration-300">
        {children}
      </div>
    </div>
  )
}

