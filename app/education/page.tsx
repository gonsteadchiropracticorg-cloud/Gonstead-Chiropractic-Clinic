"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EducationRedirect() {
  const router = useRouter()
  useEffect(() => {
    window.location.href = "/educational-guide.html"
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#0d5c75] mb-2 font-poppins">Patient Education Hub</h2>
        <p className="text-gray-600">Loading educational guide and resources...</p>
      </div>
    </div>
  )
}
