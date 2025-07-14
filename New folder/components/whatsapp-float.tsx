"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WhatsAppFloat() {
  const [isHovered, setIsHovered] = useState(false)

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/923046996267?text=Hello Dr. Bashir Khan, I would like to book an appointment.", "_blank")
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-14 w-14 rounded-full bg-[#25d366] hover:bg-[#20b858] shadow-lg hover:shadow-xl transition-all duration-300 transform ${
          isHovered ? "scale-110" : "scale-100"
        } border-4 border-white dark:border-gray-800`}
        size="icon"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-20 left-0 bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
          Chat on WhatsApp
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  )
}
