"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Video, CheckCircle, Loader2, Phone, MessageCircle, CreditCard, Clock, MapPin } from "lucide-react"
import { useLanguage } from "./language-provider"
import { useToast } from "@/hooks/use-toast"
import { createPatient } from "@/lib/supabase"

export function EnhancedAppointmentBooking() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    sessionType: "in_clinic" as "in_clinic" | "video",
    preferredTime: "",
    notes: "",
    paymentMethod: "cash" as "cash" | "jazzcash" | "easypaisa",
    urgency: "normal" as "normal" | "urgent" | "emergency",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string>("")
  const { t, language } = useLanguage()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate Pakistani phone number
      const phoneRegex = /^(\+92|0)?3[0-9]{9}$/
      if (!phoneRegex.test(formData.phone)) {
        throw new Error(language === "ur" ? "غلط فون نمبر" : "Invalid Pakistani phone number")
      }

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error(language === "ur" ? "نام درج کریں" : "Name is required")
      }

      if (!formData.preferredTime) {
        throw new Error(language === "ur" ? "تاریخ اور وقت منتخب کریں" : "Please select date and time")
      }

      // Create patient record in Supabase
      const patientData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        session_type: formData.sessionType,
        appointment_date: formData.preferredTime,
        status: "pending" as const,
        urgency: formData.urgency,
        payment_method: formData.paymentMethod,
        notes: formData.notes,
        sessions_completed: 0,
      }

      const newPatient = await createPatient(patientData)
      const appointmentId = newPatient.id

      setAppointmentId(appointmentId)
      setIsSubmitted(true)

      toast({
        title: language === "ur" ? "اپائنٹمنٹ بک ہو گئی" : "Appointment Booked",
        description:
          language === "ur" ? "آپ کی اپائنٹمنٹ کامیابی سے بک ہو گئی" : "Your appointment has been successfully booked",
      })
    } catch (error) {
      console.error("Booking error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: language === "ur" ? "خرابی" : "Error",
        description:
          errorMessage.includes("Invalid") || errorMessage.includes("غلط")
            ? errorMessage
            : language === "ur"
              ? "اپائنٹمنٹ بک کرنے میں مسئلہ ہے۔ براہ کرم دوبارہ کوشش کریں۔"
              : "Failed to book appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-2xl">
        <CardContent className="text-center p-6 md:p-8">
          <div className="animate-bounce mb-6">
            <CheckCircle className="h-16 w-16 md:h-24 md:w-24 text-green-500 mx-auto" />
          </div>
          <h3 className="text-2xl md:text-4xl font-bold text-green-700 dark:text-green-400 mb-4">
            {language === "ur" ? "کامیابی!" : "Success!"}
          </h3>
          <p className="text-green-600 dark:text-green-300 mb-6 text-base md:text-lg">
            {language === "ur"
              ? "آپ کی اپائنٹمنٹ کامیابی سے بک ہو گئی ہے۔"
              : "Your appointment has been successfully booked."}
          </p>

          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-inner mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <strong>Appointment ID:</strong> {appointmentId}
            </p>
            <p className="text-xs text-gray-500">
              {language === "ur" ? "یہ ID محفوظ رکھیں" : "Please save this ID for your records"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] hover:from-[#238a7a] hover:to-[#1f7a6b] flex-1 sm:flex-none"
            >
              <a href="tel:+923046996267" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {language === "ur" ? "ڈاکٹر کو کال کریں" : "Call Dr. Bahir"}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 flex-1 sm:flex-none"
            >
              <a href="https://wa.me/923046996267" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#2a9d8f] shadow-2xl bg-gradient-to-br from-white to-[#f4f1de] dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] text-white p-4 md:p-6">
        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
          <Calendar className="h-6 w-6 md:h-7 md:w-7" />
          {t("book.appointment")}
        </CardTitle>
        <p className="text-[#f4f1de] text-sm">
          {language === "ur" ? "آسان اور تیز اپائنٹمنٹ بکنگ" : "Quick and easy appointment booking"}
        </p>
      </CardHeader>
      <CardContent className="p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Personal Information */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-[#2a9d8f] dark:text-[#3fb3a3] border-b-2 border-[#2a9d8f]/20 pb-3">
              {language === "ur" ? "ذاتی معلومات" : "Personal Information"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {language === "ur" ? "مکمل نام" : "Full Name"} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={language === "ur" ? "اپنا مکمل نام درج کریں" : "Enter your full name"}
                  className="border-[#2a9d8f]/30 focus:border-[#2a9d8f] h-10 md:h-12 text-sm md:text-base"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {language === "ur" ? "فون نمبر" : "Phone Number"} *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="03001234567"
                  className="border-[#2a9d8f]/30 focus:border-[#2a9d8f] h-10 md:h-12 text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {language === "ur" ? "ای میل (اختیاری)" : "Email (Optional)"}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={language === "ur" ? "آپ کا ای میل ایڈریس" : "your.email@example.com"}
                className="border-[#2a9d8f]/30 focus:border-[#2a9d8f] h-10 md:h-12 text-sm md:text-base"
              />
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-[#2a9d8f] dark:text-[#3fb3a3] border-b-2 border-[#2a9d8f]/20 pb-3">
              {language === "ur" ? "فوریت کی سطح" : "Urgency Level"}
            </h3>
            <RadioGroup
              value={formData.urgency}
              onValueChange={(value: "normal" | "urgent" | "emergency") =>
                setFormData((prev) => ({ ...prev, urgency: value }))
              }
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
            >
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl hover:border-[#2a9d8f] transition-all">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-sm md:text-base">{language === "ur" ? "عام" : "Normal"}</div>
                    <div className="text-xs text-gray-500">{language === "ur" ? "1-2 دن" : "1-2 days"}</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-yellow-200 rounded-xl hover:border-yellow-400 transition-all">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-sm md:text-base">{language === "ur" ? "فوری" : "Urgent"}</div>
                    <div className="text-xs text-gray-500">{language === "ur" ? "آج ہی" : "Same day"}</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-red-200 rounded-xl hover:border-red-400 transition-all">
                <RadioGroupItem value="emergency" id="emergency" />
                <Label htmlFor="emergency" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-sm md:text-base">
                      {language === "ur" ? "ایمرجنسی" : "Emergency"}
                    </div>
                    <div className="text-xs text-gray-500">{language === "ur" ? "فوری" : "Immediate"}</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Session Type */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-[#2a9d8f] dark:text-[#3fb3a3] border-b-2 border-[#2a9d8f]/20 pb-3">
              {language === "ur" ? "سیشن کی قسم" : "Session Type"} *
            </h3>
            <RadioGroup
              value={formData.sessionType}
              onValueChange={(value: "in_clinic" | "video") => setFormData((prev) => ({ ...prev, sessionType: value }))}
              className="space-y-3 md:space-y-4"
            >
              <div className="flex items-center space-x-4 p-4 md:p-6 border-2 border-[#2a9d8f]/20 rounded-2xl hover:border-[#2a9d8f]/50 hover:bg-[#2a9d8f]/5 transition-all duration-300 cursor-pointer">
                <RadioGroupItem value="in_clinic" id="clinic" className="border-[#2a9d8f] w-5 h-5" />
                <Label htmlFor="clinic" className="flex items-center gap-3 md:gap-4 cursor-pointer flex-1">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-[#2a9d8f]" />
                  <div>
                    <div className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200">
                      {language === "ur" ? "کلینک میں گونسٹیڈ ایڈجسٹمنٹ" : "In-clinic Gonstead Adjustment"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === "ur" ? "جدید مشینری کی مدد سے علاج" : "Advanced machine-assisted treatment"}
                    </div>
                    <div className="text-xs text-[#2a9d8f] font-medium mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {language === "ur" ? "تحصیل روڈ، نوشہرہ" : "Tehsil Road, Nowshera"}
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-4 p-4 md:p-6 border-2 border-red-200 rounded-2xl hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-300 cursor-pointer">
                <RadioGroupItem value="video" id="video" className="border-red-500 w-5 h-5" />
                <Label htmlFor="video" className="flex items-center gap-3 md:gap-4 cursor-pointer flex-1">
                  <Video className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
                  <div>
                    <div className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200">
                      {language === "ur" ? "ایمرجنسی ویڈیو مشاورت" : "Emergency Video Consultation"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === "ur" ? "فوری مدد - 15 منٹ تک" : "Immediate help - 15 minutes max"}
                    </div>
                    <div className="text-xs text-red-500 font-medium mt-1">
                      {language === "ur" ? "24/7 دستیاب" : "Available 24/7"}
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-[#2a9d8f] dark:text-[#3fb3a3] border-b-2 border-[#2a9d8f]/20 pb-3">
              {language === "ur" ? "ادائیگی کا طریقہ" : "Payment Method"}
            </h3>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value: "cash" | "jazzcash" | "easypaisa") =>
                setFormData((prev) => ({ ...prev, paymentMethod: value }))
              }
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
            >
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl hover:border-[#2a9d8f] transition-all">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                  <span className="text-sm md:text-base">{language === "ur" ? "نقد" : "Cash"}</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl hover:border-[#2a9d8f] transition-all">
                <RadioGroupItem value="jazzcash" id="jazzcash" />
                <Label htmlFor="jazzcash" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-purple-600 rounded"></div>
                  <span className="text-sm md:text-base">JazzCash</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl hover:border-[#2a9d8f] transition-all">
                <RadioGroupItem value="easypaisa" id="easypaisa" />
                <Label htmlFor="easypaisa" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-green-600 rounded"></div>
                  <span className="text-sm md:text-base">EasyPaisa</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preferred Time */}
          <div className="space-y-3">
            <Label htmlFor="time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {language === "ur" ? "ترجیحی تاریخ اور وقت" : "Preferred Date & Time"} *
            </Label>
            <Input
              id="time"
              type="datetime-local"
              value={formData.preferredTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, preferredTime: e.target.value }))}
              className="border-[#2a9d8f]/30 focus:border-[#2a9d8f] h-10 md:h-12 text-sm md:text-base"
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {language === "ur" ? "اضافی معلومات" : "Additional Notes"}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder={
                language === "ur"
                  ? "اپنی تکلیف، درد کی جگہ، یا خاص ضروریات بتائیں..."
                  : "Describe your pain, problem area, or specific requirements..."
              }
              className="border-[#2a9d8f]/30 focus:border-[#2a9d8f] min-h-[100px] md:min-h-[120px] text-sm md:text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] hover:from-[#238a7a] hover:to-[#1f7a6b] text-white font-bold py-4 md:py-6 text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                {language === "ur" ? "بک ہو رہا ہے..." : "Booking Appointment..."}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                {t("book.appointment")}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
