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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Branding & Back Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <div className="hidden sm:block h-6 w-px bg-white/20" />

            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/10 p-0.5 border border-white/20 shrink-0">
                <Image
                  src="/images/gonstead-chiropractic-logo-new.png"
                  alt="Gonstead Chiropractic Clinic"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="leading-tight">
                <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-[#2a9d8f]" />
                  <span>Spinal Health Assessment</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-white/70 hidden md:block">
                  Groq AI 120B Biomechanical Analysis & Clinical Report
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIframeLoaded(false)
                setIframeKey(k => k + 1)
              }}
              title="Restart Assessment"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Restart</span>
            </button>

            <a
              href="/assessment.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Open full page view"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Fullscreen</span>
            </a>

            <Link
              href="/patient-portal"
              className="px-3 py-1.5 rounded-xl bg-[#2a9d8f] hover:bg-[#238276] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm border border-white/20 flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4" />
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
