"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)

    // Get stored theme or default to light
    const stored = (typeof window !== "undefined" ? localStorage.getItem("gonstead-theme") : null) as Theme | null
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setTheme(stored)
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

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      setActualTheme(systemTheme)
    } else {
      root.classList.add(theme)
      setActualTheme(theme)
    }
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light"
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
      setActualTheme(systemTheme)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, mounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", setTheme: () => {}, actualTheme: "light" }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
