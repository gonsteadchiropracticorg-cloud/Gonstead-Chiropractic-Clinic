import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard - Gonstead Chiropractic",
  description: "Admin dashboard for patient management and clinic operations",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    title: "GC Admin",
    statusBarStyle: "default",
  },
  themeColor: "#0d5c75",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

