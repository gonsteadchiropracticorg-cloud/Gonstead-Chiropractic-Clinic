"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, Navigation } from "lucide-react"

interface ScrollToTopButtonProps {
  showAfter?: number
  className?: string
}

export default function ScrollToTopButton({ showAfter = 200, className = "" }: ScrollToTopButtonProps) {
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
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <Button
        onClick={scrollToTop}
        className={`
          relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ease-in-out
          bg-[rgba(40,147,135,0.15)] backdrop-blur-md border border-[rgba(40,147,135,0.3)]
          hover:bg-[rgba(40,147,135,0.25)] hover:border-[rgba(40,147,135,0.5)]
          hover:scale-110 active:scale-95
          ${isAnimating ? 'animate-pulse' : ''}
        `}
        title="Scroll to Top"
      >
        {/* Gradient background overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[rgb(40,147,135)]/20 to-[rgb(40,147,135)]/10 opacity-80" />
        
        {/* Animated ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[rgb(40,147,135)]/30 animate-pulse" style={{ animationDuration: '2s' }} />
        
        {/* Icon with animation */}
        <ChevronUp 
          className={`
            relative z-10 h-6 w-6 text-[rgb(40,147,135)] transition-all duration-300
            ${isAnimating ? 'translate-y-[-2px]' : ''}
          `} 
        />
        
        {/* Professional indicator dot */}
        <div className="absolute top-1 right-1 w-3 h-3 bg-[rgb(40,147,135)] rounded-full animate-ping opacity-60" />
        <div className="absolute top-1 right-1 w-3 h-3 bg-[rgb(40,147,135)] rounded-full opacity-90" />
      </Button>
    </div>
  )
}

// Alternative navigation button with different icon
export function NavigationScrollButton({ showAfter = 200, className = "" }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [showAfter])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <Button
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-16 h-16 rounded-full shadow-2xl transition-all duration-500 ease-in-out group
          bg-[rgba(40,147,135,0.12)] backdrop-blur-lg border-2 border-[rgba(40,147,135,0.25)]
          hover:bg-[rgba(40,147,135,0.22)] hover:border-[rgba(40,147,135,0.45)]
          hover:scale-110 active:scale-95 hover:shadow-[0_0_30px_rgba(40,147,135,0.4)]
        `}
        title="Navigate to Top"
      >
        {/* Glass effect background */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-50" />
        
        {/* Animated navigation icon */}
        <Navigation 
          className={`
            relative z-10 h-6 w-6 text-[rgb(40,147,135)] transition-all duration-300 group-hover:text-[rgb(35,127,117)]
            ${isHovered ? 'rotate-[-15deg] translate-y-[-1px]' : ''}
          `} 
        />
        
        {/* Floating animation elements */}
        <div className="absolute inset-0">
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[rgb(40,147,135)] rounded-full animate-bounce opacity-70" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-3 left-3 w-1 h-1 bg-[rgb(40,147,135)] rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Hover glow effect */}
        <div className={`
          absolute inset-0 rounded-full bg-[rgb(40,147,135)] opacity-0 transition-opacity duration-300
          ${isHovered ? 'opacity-10' : 'opacity-0'}
        `} />
      </Button>
    </div>
  )
}
