"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
    
    // Only access localStorage on client side
    const stored = localStorage.getItem("gonstead-theme") as Theme | null
    if (stored && ["light", "dark"].includes(stored)) {
      setTheme(stored)
    } else {
      setTheme("dark")
    }
  }, [])

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Save to localStorage
    localStorage.setItem("gonstead-theme", theme)

    // Remove existing theme classes
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme, mounted])

  return <ThemeContext.Provider value={{ theme, setTheme, actualTheme: theme, mounted }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
