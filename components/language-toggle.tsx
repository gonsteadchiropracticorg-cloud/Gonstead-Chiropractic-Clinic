"use client"

import { useLanguage } from "./language-provider"

export function LanguageToggle() {
  const { language, setLanguage, mounted } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ur" : "en")
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={language === "en" ? "اردو میں دیکھیں" : "Switch to English"}
      aria-label="Toggle language"
      className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
    >
      {mounted && language === "en" ? "اردو" : "ENG"}
    </button>
  )
}

