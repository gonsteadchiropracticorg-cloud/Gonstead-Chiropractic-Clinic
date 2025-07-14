"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "./language-provider"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "ur" : "en")}
      className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
    >
      {language === "en" ? "اردو" : "English"}
    </Button>
  )
}
