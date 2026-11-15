"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function WhatsAppFloat() {
  const [isHovered, setIsHovered] = useState(false)

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/923046996267?text=Hello Gonstead Chiropractic Clinic, I would like to book an appointment.", "_blank")
  }

  return (
    <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50">
      <Button
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="h-11 w-11 sm:h-12 sm:w-12 rounded-full p-0 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#207a6f] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden border border-white/20"
        size="icon"
        title="Chat on WhatsApp"
      >
        {/* WhatsApp icon on top */}
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white filter drop-shadow-sm relative z-10" />
        {/* Subtle glow border */}
        <div className="absolute inset-0 rounded-full border border-white/30"></div>
      </Button>

      {/* Enhanced Tooltip */}
      {isHovered && (
        <div className="absolute bottom-16 md:bottom-20 left-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs md:text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200 backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Chat on WhatsApp
          </div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  )
}
