"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type Language = "en" | "ur"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    "doctor.name": "Dr. Bashir",
    "doctor.title": "Gonstead Certified Specialist V",
    "doctor.experience": "Advanced Gonstead Chiropractic Specialist",
    "doctor.expertise": "Precision spinal alignment with cutting-edge technology",
    "clinic.location": "Near Police Station, Tehsil Road, Nowshera",
    "clinic.email": "gonsteadchiropractic.org@gmail.com",
    "book.appointment": "Book Consultation",
    "emergency.consultation": "Emergency Video Consultation",
    "contact.whatsapp": "WhatsApp Consultation",
    "services.title": "Our Specialized Services",
    "technology.showcase": "Advanced Chiropractic Technology",
    "about.title": "About Dr. Bashir",
    "ai.welcome": "Welcome! I'm Dr. Bashir's AI assistant. How can I help you today?",
    "voice.greeting": "Hello! Welcome to our advanced chiropractic care center.",
  },
  ur: {
    "doctor.name": "ڈاکٹر بشیر",
    "doctor.title": "گونسٹیڈ سرٹیفائیڈ اسپیشلسٹ V",
    "doctor.experience": "ایڈوانسڈ گونسٹیڈ کائروپریکٹک اسپیشلسٹ",
    "doctor.expertise": "جدید ٹیکنالوجی کے ساتھ درست ریڑھ کی ہڈی کی درستگی",
    "clinic.location": "پولیس سٹیشن کے قریب، تحصیل روڈ، نوشہرہ",
    "clinic.email": "gonsteadchiropractic.org@gmail.com",
    "book.appointment": "مشاورت بک کریں",
    "emergency.consultation": "ایمرجنسی ویڈیو مشاورت",
    "contact.whatsapp": "واٹس ایپ مشاورت",
    "services.title": "ہماری خصوصی خدمات",
    "technology.showcase": "جدید کائروپریکٹک ٹیکنالوجی",
    "about.title": "ڈاکٹر بشیر کے بارے میں",
    "ai.welcome": "خوش آمدید! میں ڈاکٹر بشیر کا AI اسسٹنٹ ہوں۔ آج میں آپ کی کیسے مدد کر سکتا ہوں؟",
    "voice.greeting": "ہیلو! ہمارے ایڈوانسڈ کائروپریکٹک کیئر سینٹر میں خوش آمدید۔",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)["en"]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
