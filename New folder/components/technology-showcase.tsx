"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, Activity, Target, Zap } from "lucide-react"
import { useLanguage } from "./language-provider"

export function TechnologyShowcase() {
  const { t, language } = useLanguage()

  const technologies = [
    {
      icon: <Cpu className="h-8 w-8 text-[#2a9d8f]" />,
      title: language === "ur" ? "ایڈجسٹو آرتھروسٹم™" : "Adjustive Arthrostim™",
      description:
        language === "ur" ? "جدید مشین سے ریڑھ کی ہڈی کی درست پوزیشن" : "Advanced machine-assisted spinal positioning",
    },
    {
      icon: <Activity className="h-8 w-8 text-[#2a9d8f]" />,
      title: language === "ur" ? "سرویکل ڈراپ ٹیبل" : "Cervical Drop Table",
      description: language === "ur" ? "گردن کی ہڈیوں کا محفوظ علاج" : "Safe cervical spine treatment",
    },
    {
      icon: <Target className="h-8 w-8 text-[#2a9d8f]" />,
      title: language === "ur" ? "پریسیژن ایڈجسٹمنٹ" : "Precision Adjustment",
      description: language === "ur" ? "بالکل درست جگہ پر علاج" : "Targeted treatment with accuracy",
    },
    {
      icon: <Zap className="h-8 w-8 text-[#2a9d8f]" />,
      title: language === "ur" ? "فوری نتائج" : "Immediate Results",
      description: language === "ur" ? "پہلے سیشن میں بہتری" : "Improvement from first session",
    },
  ]

  return (
    <div className="py-12 bg-gradient-to-br from-[#f4f1de] to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-[#2a9d8f] mb-8">{t("technology.showcase")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <Card key={index} className="border-[#2a9d8f] hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{tech.icon}</div>
                <CardTitle className="text-lg text-[#2a9d8f]">{tech.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">{tech.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
