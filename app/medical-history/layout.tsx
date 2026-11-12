import type { Metadata, Viewport } from "next"
import { AdminAutoSidebar } from "@/components/AdminAutoSidebar"

export const metadata: Metadata = {
  title: "Medical History - Gonstead Chiropractic",
  description: "Patient health records and spinal adjustment history",
}

export default function MedicalHistoryLayout({
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
