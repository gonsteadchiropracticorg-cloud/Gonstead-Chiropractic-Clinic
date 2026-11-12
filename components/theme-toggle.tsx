"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"
import { useState, useEffect } from "react"

export function ThemeToggle() {
  const { theme, setTheme, mounted: themeProviderMounted } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (setTheme && typeof setTheme === "function") {
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
    >
      {mounted && themeProviderMounted && isDark ? (
        <Moon className="w-4 h-4 text-cyan-200" />
      ) : (
        <Sun className="w-4 h-4 text-white" />
      )}
    </button>
  )
}

