"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { ArrowLeft, Stethoscope, ExternalLink, RefreshCw, UserCheck } from "lucide-react"

// Floating Chatbot dynamically imported
const AdvancedChatbot = dynamic(
  () => import("@/components/advanced-chatbot").then(mod => mod.AdvancedChatbot),
  { ssr: false }
)

export default function AssessmentPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeKey, setIframeKey] = useState(1)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f8f5f0] text-slate-800 dark:text-slate-100">
      {/* Assessment Platform Header Bar */}
      <header className="shrink-0 z-30 bg-[#0d5c75] text-white shadow-md border-b border-[#0d5c75]/30">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-13 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Branding & Back Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 shrink-0"
              title="Return to Home"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Home</span>
            </Link>

            <div className="hidden sm:block h-6 w-px bg-white/20 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-white/10 p-0.5 border border-white/20 shrink-0">
                <Image
                  src="/images/gonstead-chiropractic-logo-new.png"
                  alt="Gonstead Chiropractic Clinic"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="leading-tight min-w-0">
                <h1 className="text-xs sm:text-base font-bold text-white flex items-center gap-1 truncate font-poppins">
                  <Stethoscope className="h-3.5 w-3.5 text-[#2a9d8f] shrink-0 hidden xs:inline" />
                  <span className="truncate">Spinal Assessment</span>
                </h1>
                <p className="text-[10px] text-teal-200 hidden md:block truncate">
                  Groq AI 120B Biomechanical Analysis & Clinical Report
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                setIframeLoaded(false)
                setIframeKey(k => k + 1)
              }}
              title="Restart Assessment"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1"
              aria-label="Restart"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline font-medium">Restart</span>
            </button>

            <a
              href="/assessment.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Open full page view in new tab"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1"
              aria-label="Fullscreen"
            >
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline font-medium">Fullscreen</span>
            </a>

            <Link
              href="/patient-portal"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2a9d8f] hover:bg-[#238276] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm border border-white/20 flex items-center gap-1 shrink-0"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Assessment Frame Container */}
      <main className="flex-1 relative w-full h-full min-h-0 bg-[#f8f5f0] overflow-hidden">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f5f0] dark:bg-gray-900 z-10 transition-opacity">
            <div className="w-10 h-10 border-4 border-[#0d5c75]/20 border-t-[#0d5c75] rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-[#0d5c75] dark:text-teal-300">
              Loading Spinal Health Assessment...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Preparing diagnostic questions, Groq AI engine & PDF generator
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="/assessment.html"
          title="Gonstead Spinal Health Assessment"
          className="absolute inset-0 w-full h-full border-0 block"
          onLoad={() => setIframeLoaded(true)}
        />
      </main>

      {/* Advanced AI Medical Chatbot active on this page */}
      <AdvancedChatbot />
    </div>
  )
}
