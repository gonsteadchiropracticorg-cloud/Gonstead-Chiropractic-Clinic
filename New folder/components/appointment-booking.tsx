"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Video, Clock, CheckCircle } from "lucide-react"
import { useLanguage } from "./language-provider"
import { useToast } from "@/hooks/use-toast"

export function AppointmentBooking() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    sessionType: "clinic",
    preferredTime: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { t, language } = useLanguage()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate Pakistani phone number
    const phoneRegex = /^(\+92|0)?3[0-9]{9}$/
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: language === "ur" ? "غلط فون نمبر" : "Invalid Phone Number",
        description:
          language === "ur"
            ? "براہ کرم پاکستانی فون نمبر درج کریں (مثال: 03001234567)"
            : "Please enter a valid Pakistani phone number (e.g., 03001234567)",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitted(true)
    setIsSubmitting(false)

    toast({
      title: language === "ur" ? "اپائنٹمنٹ بک ہو گئی" : "Appointment Booked",
      description: language === "ur" ? "ڈاکٹر باہر جلد ہی آپ سے رابطہ کریں گے" : "Dr. Bahir will contact you shortly",
    })
  }

  if (isSubmitted) {
    return (
      <Card className="border-green-500 bg-green-50">
        <CardContent className="text-center p-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">{language === "ur" ? "کامیابی!" : "Success!"}</h3>
          <p className="text-green-600">
            {language === "ur"
              ? "آپ کی اپائنٹمنٹ کامیابی سے بک ہو گئی ہے۔ ڈاکٹر باہر جلد ہی آپ سے رابطہ کریں گے۔"
              : "Your appointment has been successfully booked. Dr. Bahir will contact you shortly."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#2a9d8f]">
      <CardHeader className="bg-[#2a9d8f] text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t("book.appointment")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">{language === "ur" ? "نام" : "Name"} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={language === "ur" ? "اپنا نام درج کریں" : "Enter your name"}
              required
            />
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">{language === "ur" ? "فون نمبر" : "Phone Number"} *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="03001234567"
              required
            />
          </div>

          {/* Session Type */}
          <div className="space-y-3">
            <Label>{language === "ur" ? "سیشن کی قسم" : "Session Type"} *</Label>
            <RadioGroup
              value={formData.sessionType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, sessionType: value }))}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="clinic" id="clinic" />
                <Label htmlFor="clinic" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Calendar className="h-4 w-4 text-[#2a9d8f]" />
                  <div>
                    <div className="font-medium">
                      {language === "ur" ? "کلینک میں گونسٹیڈ ایڈجسٹمنٹ" : "In-clinic Gonstead Adjustment"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language === "ur" ? "مشین کی مدد سے" : "Machine-assisted treatment"}
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Video className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-medium">
                      {language === "ur" ? "ایمرجنسی ویڈیو مشاورت" : "Emergency Video Consultation"}
                    </div>
                    <div className="text-sm text-gray-500">{language === "ur" ? "15 منٹ تک" : "15 minutes max"}</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preferred Time */}
          <div className="space-y-2">
            <Label htmlFor="time">{language === "ur" ? "ترجیحی وقت" : "Preferred Time"}</Label>
            <Input
              id="time"
              type="datetime-local"
              value={formData.preferredTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, preferredTime: e.target.value }))}
            />
          </div>

          <Button type="submit" className="w-full bg-[#2a9d8f] hover:bg-[#238a7a]" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                {language === "ur" ? "بک ہو رہا ہے..." : "Booking..."}
              </div>
            ) : (
              t("book.appointment")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
