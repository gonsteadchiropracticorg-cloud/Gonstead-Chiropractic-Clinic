"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] flex items-center justify-center">
      <div className="text-white text-lg">Redirecting to dashboard...</div>
    </div>
  )
}

