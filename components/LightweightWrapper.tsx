"use client"

import React, { memo, useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

interface LightweightWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number
  triggerOnScroll?: boolean
  triggerOnInteraction?: boolean
  preserveFeatures?: boolean
}

// Smart lazy loading that maintains all functionality
export const LightweightWrapper = memo<LightweightWrapperProps>(({
  children,
  fallback = null,
  delay = 0,
  triggerOnScroll = false,
  triggerOnInteraction = false,
  preserveFeatures = true,
}) => {
  const [shouldLoad, setShouldLoad] = useState(!triggerOnScroll && !triggerOnInteraction && delay === 0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldLoad) return

    let timeoutId: any
    let observer: IntersectionObserver | null = null

    const enableLoad = () => {
      setShouldLoad(true)
    }

    // Load after delay or idle
    if (delay > 0 && !triggerOnScroll && !triggerOnInteraction) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        timeoutId = (window as any).requestIdleCallback(enableLoad, { timeout: delay })
      } else {
        timeoutId = setTimeout(enableLoad, delay)
      }
    }

    // Load on scroll into view using container element
    if (triggerOnScroll && containerRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            enableLoad()
            if (observer) observer.disconnect()
          }
        },
        { threshold: 0.05, rootMargin: '100px' }
      )
      observer.observe(containerRef.current)
    }

    // Load on user interaction
    if (triggerOnInteraction) {
      const handleInteraction = () => {
        enableLoad()
      }

      const events = ['click', 'scroll', 'keydown', 'touchstart']
      events.forEach((evt) => {
        window.addEventListener(evt, handleInteraction, { once: true, passive: true })
      })

      return () => {
        events.forEach((evt) => {
          window.removeEventListener(evt, handleInteraction)
        })
      }
    }

    return () => {
      if (timeoutId) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          try { (window as any).cancelIdleCallback(timeoutId) } catch {}
        }
        clearTimeout(timeoutId)
      }
      if (observer) observer.disconnect()
    }
  }, [triggerOnScroll, triggerOnInteraction, delay, shouldLoad])

  if (!shouldLoad) {
    return (
      <div ref={containerRef} className="w-full">
        {fallback}
      </div>
    )
  }

  return <>{children}</>
})

LightweightWrapper.displayName = 'LightweightWrapper'

// Smart dynamic import that loads cleanly
export const createLightweightDynamic = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: {
    fallback?: React.ComponentType<any>
    delay?: number
    ssr?: boolean
  } = {}
) => {
  const { fallback: Fallback, ssr = false } = options

  return dynamic(importFn, {
    loading: () =>
      Fallback ? (
        <Fallback />
      ) : (
        <div className="animate-pulse bg-gray-200/50 dark:bg-gray-800/50 rounded-xl h-24 w-full flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ),
    ssr,
  })
}

// Lightweight fallback components that maintain visual consistency without layout shifts
export const LightweightFallback = {
  Chatbot: () => (
    <div className="fixed bottom-4 right-4 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[rgb(70,146,138)] to-[rgb(30,96,118)] shadow-lg flex items-center justify-center pointer-events-none opacity-80">
      <div className="w-6 h-6 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),

  SportsFloat: () => null,

  Technology: () => (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-6 bg-teal-600/10 dark:bg-teal-400/10 rounded-full w-40 mx-auto mb-3"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-80 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  ),

  WeatherWidget: () => (
    <div className="w-20 h-14 bg-white/10 rounded-xl animate-pulse flex items-center justify-center">
      <div className="w-4 h-4 bg-white/20 rounded-full"></div>
    </div>
  ),
}

export default LightweightWrapper
