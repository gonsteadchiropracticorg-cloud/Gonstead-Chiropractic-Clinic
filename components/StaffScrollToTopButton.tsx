"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"

interface StaffScrollToTopButtonProps {
  showAfter?: number
  className?: string
}

export default function StaffScrollToTopButton({ showAfter = 200, className = "" }: StaffScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Add scroll listener
    window.addEventListener("scroll", toggleVisibility)

    // Cleanup
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [showAfter])

  const scrollToTop = () => {
    setIsAnimating(true)
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
    
    // Reset animation state after scroll
    setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-20 right-4 z-[9997] ${className}`}>
      <Button
        onClick={scrollToTop}
        className={`
          relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0 shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center
          bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800
          border border-[#0d5c75]/25 dark:border-teal-500/30 backdrop-blur-md
          hover:scale-105 active:scale-95
          ${isAnimating ? 'animate-pulse' : ''}
        `}
        title="Scroll to Top"
      >
        <ChevronUp 
          className={`
            relative z-10 h-5 w-5 sm:h-6 sm:w-6 text-[#0d5c75] dark:text-teal-300 transition-all duration-300
            ${isAnimating ? 'translate-y-[-2px]' : ''}
          `} 
        />
      </Button>
    </div>
  )
}
