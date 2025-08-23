"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, Video, CheckCircle, Loader2, Phone, MessageCircle, CreditCard, Clock, MapPin, AlertTriangle, Info, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "./language-provider"
import { useToast } from "@/hooks/use-toast"
import { createPatient, getPatients, supabase } from "@/lib/supabase"
import { notifyNewAppointment, showBrowserNotification, requestNotificationPermission } from "@/lib/whatsapp-notifications"
import { AppointmentConfirmation } from "./appointment-confirmation"

// Business logic constants
const BUSINESS_HOURS_START = 9 // 9:00 AM
const BUSINESS_HOURS_END = 18 // 6:00 PM
const APPOINTMENT_GAP_MINUTES = 40
const SLOT_DURATION_MINUTES = 30
const LUNCH_BREAK_START = 13 // 1:00 PM
const LUNCH_BREAK_END = 14 // 2:00 PM

// Types
interface TimeSlot {
  time: string
  datetime: string
  available: boolean
  booked?: boolean
}

interface BookedAppointment {
  datetime: string
  duration: number
}

// Bilingual Messages
const messages = {
  slotBooked: {
    en: "This appointment slot is already booked. Please choose a different time.",
    ur: "یہ وقت پہلے ہی کسی مریض کے لیے بک ہو چکا ہے۔ براہ کرم کوئی اور وقت منتخب کریں۔"
  },
  outsideHours: {
    en: "Selected time is outside business hours (9:00 AM - 6:00 PM).",
    ur: "منتخب کردہ وقت کلینک کے اوقات (صبح 9 بجے سے شام 6 بجے) سے باہر ہے۔"
  },
  tooClose: {
    en: "This time is too close to another appointment. Please select a time with at least 40 minutes gap.",
    ur: "یہ وقت دوسری اپائنٹمنٹ سے بہت قریب ہے۔ براہ کرم کم از کم 40 منٹ کا فرق رکھتے ہوئے وقت منتخب کریں۔"
  }
}

export function EnhancedAppointmentBooking() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    sessionType: "in_clinic" as "in_clinic" | "video",
    selectedDate: "",
    selectedTime: "",
    preferredTime: "", // Combined datetime-local value
    notes: "",
    paymentMethod: "cash" as "cash" | "jazzcash" | "easypaisa",
    urgency: "normal" as "normal" | "urgent" | "emergency",
    bookingType: "direct" as "direct" | "request",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string>("") 
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isSundaySelected, setIsSundaySelected] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([])
  const [validationError, setValidationError] = useState<string>("")
  const [timeValidationMessage, setTimeValidationMessage] = useState<string>("")
  const { t, language } = useLanguage()
  const { toast } = useToast()

  // Sunday closure detection
  const isSunday = (date: Date) => {
    return date.getDay() === 0 // Sunday = 0
  }

  const isToday = () => {
    const today = new Date()
    return today.getDay() === 0 // Check if today is Sunday
  }

  // Generate validation message based on selected time
  const generateValidationMessage = (selectedDateTime: Date): string => {
    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      return ""
    }

    // Check if Sunday
    if (isSunday(selectedDateTime)) {
      return language === "ur" 
        ? "⚠️ اتوار کو کلینک بند ہے۔ پیر سے ہفتہ تک کوئی دن منتخب کریں۔"
        : "⚠️ Clinic is closed on Sundays. Please select Monday through Saturday."
    }

    const hour = selectedDateTime.getHours()
    const minutes = selectedDateTime.getMinutes()
    const now = new Date()

    // Check if time is in the past
    if (selectedDateTime < now) {
      return language === "ur"
        ? "⏰ یہ وقت گزر چکا ہے۔ براہ کرم آنے والا وقت منتخب کریں۔"
        : "⏰ This time has already passed. Please select a future time."
    }

    // Check business hours
    if (hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END) {
      return language === "ur"
        ? `🕘 کلینک کے اوقات: صبح ${BUSINESS_HOURS_START}:00 سے شام ${BUSINESS_HOURS_END}:00 تک`
        : `🕘 Clinic hours: ${BUSINESS_HOURS_START}:00 AM - ${BUSINESS_HOURS_END}:00 PM`
    }

    // Check lunch break
    if (hour >= LUNCH_BREAK_START && hour < LUNCH_BREAK_END) {
      return language === "ur"
        ? "🍽️ دوپہر کا وقفہ (1:00 PM - 2:00 PM)۔ براہ کرم کوئی اور وقت منتخب کریں۔"
        : "🍽️ Lunch break (1:00 PM - 2:00 PM). Please choose a different time."
    }

    // Check if too close to other appointments (simplified check)
    // In a real app, this would check against actual booked appointments
    const conflictFound = bookedAppointments.some(appointment => {
      const appointmentTime = new Date(appointment.datetime).getTime()
      const selectedTime = selectedDateTime.getTime()
      const timeDiff = Math.abs(selectedTime - appointmentTime) / (1000 * 60)
      return timeDiff < APPOINTMENT_GAP_MINUTES
    })

    if (conflictFound) {
      return language === "ur"
        ? "⚡ یہ وقت دوسری اپائنٹمنٹ سے بہت قریب ہے۔ کم از کم 40 منٹ کا فرق رکھیں۔"
        : "⚡ This time is too close to another appointment. Please allow at least 40 minutes gap."
    }

    // If all validations pass, show a positive message
    const timeStr = selectedDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
    const dateStr = selectedDateTime.toLocaleDateString()
    
    return language === "ur"
      ? `✅ ${dateStr} کو ${timeStr} بجے اپائنٹمنٹ دستیاب ہے۔`
      : `✅ Appointment available on ${dateStr} at ${timeStr}.`
  }

  // Fix hydration mismatch by ensuring client-only rendering for dynamic content
  useEffect(() => {
    setIsMounted(true)
    // Request notification permission only on client
    requestNotificationPermission()
  }, [])

  // Fetch existing appointments to prevent double-booking
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data: appointments, error } = await supabase
          .from('patients')
          .select('appointment_date')
          .not('appointment_date', 'is', null)
          .order('appointment_date', { ascending: true })

        if (error) {
          console.error('Error fetching appointments:', error)
          return
        }

        const formattedAppointments = appointments.map(appointment => ({
          datetime: appointment.appointment_date,
          duration: 30 // Default duration in minutes
        }))
        
        setBookedAppointments(formattedAppointments)
      } catch (error) {
        console.error('Error fetching appointments:', error)
      }
    }

    if (isMounted) {
      fetchAppointments()
    }
  }, [isMounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate phone number (support Pakistani and international numbers)
      const cleanPhone = formData.phone.replace(/[\s-()]/g, '')
      const phoneRegex = /^(\+92|0)?3[0-9]{9}$|^(\+\d{1,3})?\d{10,14}$/
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error(language === "ur" ? "غلط فون نمبر - پاکستانی نمبر (03xxxxxxxxx) یا بین الاقوامی نمبر درج کریں" : "Invalid phone number - Please enter Pakistani (03xxxxxxxxx) or international format")
      }

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error(language === "ur" ? "نام درج کریں" : "Name is required")
      }

      if (!formData.selectedDate || !formData.selectedTime) {
        throw new Error(language === "ur" ? "تاریخ اور وقت منتخب کریں" : "Please select date and time")
      }

      // Validate appointment slot
      const selectedDateTime = new Date(`${formData.selectedDate}T${formData.selectedTime}`)
      
      // Check if Sunday
      if (isSunday(selectedDateTime)) {
        throw new Error(language === "ur" 
          ? "اتوار کو کلینک بند ہے۔ براہ کرم پیر سے ہفتہ تک کوئی دن منتخب کریں۔" 
          : "Clinic is closed on Sundays. Please select Monday through Saturday.")
      }
      
      // Validate business hours
      const hour = selectedDateTime.getHours()
      if (hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END) {
        throw new Error(messages.outsideHours[language])
      }
      
      // Validate lunch break
      if (hour >= LUNCH_BREAK_START && hour < LUNCH_BREAK_END) {
        throw new Error(language === "ur" 
          ? "دوپہر کے کھانے کا وقت (1:00 PM - 2:00 PM) میں اپائنٹمنٹ دستیاب نہیں۔" 
          : "Appointments not available during lunch break (1:00 PM - 2:00 PM).")
      }
      
      // Check for conflicts with existing appointments
      const selectedTime = selectedDateTime.getTime()
      for (const appointment of bookedAppointments) {
        const appointmentTime = new Date(appointment.datetime).getTime()
        const timeDiff = Math.abs(selectedTime - appointmentTime) / (1000 * 60) // in minutes
        
        if (timeDiff < APPOINTMENT_GAP_MINUTES) {
          throw new Error(messages.tooClose[language])
        }
      }

      // Create patient record in Supabase
      const patientData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        session_type: formData.sessionType,
        appointment_date: `${formData.selectedDate}T${formData.selectedTime}`,
        status: "pending" as const,
        urgency: formData.urgency,
        payment_method: formData.paymentMethod,
        notes: formData.notes,
        sessions_completed: 0,
      }

      const newPatient = await createPatient(patientData)
      const appointmentId = newPatient.id

      // Update local state with the new appointment to prevent double booking
      const newBookedAppointment: BookedAppointment = {
        datetime: `${formData.selectedDate}T${formData.selectedTime}`,
        duration: 30 // Default duration in minutes
      }
      setBookedAppointments(prev => [...prev, newBookedAppointment])

      setAppointmentId(appointmentId)
      setIsSubmitted(true)

      // Create patient data that matches the admin dashboard structure
      const patientForLocalStorage = {
        id: appointmentId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        session_type: formData.sessionType,
        appointment_date: `${formData.selectedDate}T${formData.selectedTime}`,
        status: "pending" as const,
        urgency: formData.urgency,
        payment_method: formData.paymentMethod || "cash" as const,
        notes: formData.notes,
        sessions_completed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_visit: null,
        medical_history: null,
        demographics: {
          age: null,
          gender: null,
          occupation: null,
          emergency_contact: null,
        },
        treatment_plan: {
          diagnosis: null,
          goals: null,
          progress: null,
        },
        prescription: {
          medications: null,
          instructions: null,
          follow_up_date: null,
        },
      }

      // Trigger real-time admin notification
      try {
        // Show browser notification
        showBrowserNotification({
          patientName: formData.name,
          phone: formData.phone,
          email: formData.email,
          appointmentDate: `${formData.selectedDate}T${formData.selectedTime}`,
          sessionType: formData.sessionType,
          urgency: formData.urgency,
          notes: formData.notes
        })
        
        // Trigger real-time update for admin page with correct data structure
        const adminEvent = new CustomEvent('newAppointment', {
          detail: {
            ...patientForLocalStorage,
            // Ensure correct field mapping for admin dashboard
            appointmentDate: `${formData.selectedDate}T${formData.selectedTime}`,
            sessionType: formData.sessionType,
          }
        })
        window.dispatchEvent(adminEvent)
        
      } catch (error) {
        console.error('Notification error:', error)
      }

      toast({
        title: language === "ur" ? "اپائنٹمنٹ بک ہو گئی" : "Appointment Booked Successfully! 🎉",
        description:
          language === "ur" ? "آپ کی اپائنٹمنٹ کامیابی سے بک ہو گئی" : "Dr. Bashir has been notified via WhatsApp. You will receive confirmation shortly.",
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

  // Priority rendering: Show confirmation section first when submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <AppointmentConfirmation 
          appointmentData={{
            name: formData.name,
            phone: formData.phone,
            sessionType: formData.sessionType,
            preferredTime: `${formData.selectedDate}T${formData.selectedTime}`,
            appointmentId: appointmentId
          }}
          onBackToHome={() => {
            setIsSubmitted(false)
            setFormData({
              name: "",
              phone: "",
              email: "",
              sessionType: "in_clinic",
              selectedDate: "",
              selectedTime: "",
              preferredTime: "",
              notes: "",
              paymentMethod: "cash",
              urgency: "normal",
              bookingType: "direct",
            })
          }}
          onNewAppointment={() => {
            setIsSubmitted(false)
            setFormData({
              name: "",
              phone: "",
              email: "",
              sessionType: "in_clinic",
              selectedDate: "",
              selectedTime: "",
              preferredTime: "",
              notes: "",
              paymentMethod: "cash",
              urgency: "normal",
              bookingType: "direct",
            })
          }}
        />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 sm:border-4 border-[rgb(66,139,124)]/20 shadow-xl sm:shadow-2xl bg-gradient-to-br from-white via-[rgb(66,139,124)]/5 to-[rgb(66,139,124)]/10 dark:from-gray-900 dark:to-gray-800 overflow-hidden relative">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[rgb(66,139,124)] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[rgb(76,157,144)] rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[rgb(56,137,124)] rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
      </div>
      
      <CardHeader className="bg-gradient-to-r from-[rgb(66,139,124)] via-[rgb(76,157,144)] to-[rgb(66,139,124)] text-white p-4 md:p-6 relative overflow-hidden">
        {/* Enhanced Aesthetic Background */}
        <div className="absolute inset-0 opacity-15">
          {/* Animated geometric patterns */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white/30 rotate-45 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-2 border-white/20 rotate-12 animate-pulse animation-delay-1000"></div>
            <div className="absolute bottom-2 left-4 w-4 h-4 border-2 border-white/25 rotate-90 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-4 right-2 w-10 h-10 border-2 border-white/15 rotate-180 animate-pulse animation-delay-3000"></div>
          </div>
          
          {/* Floating orbs with enhanced styling */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-lg animate-pulse"></div>
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/15 to-transparent rounded-full blur-lg animate-pulse animation-delay-1000"></div>
          
          {/* Medical cross pattern */}
          <div className="absolute top-1/2 left-1/4 w-3 h-12 bg-white/10 rounded-full animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-3 bg-white/10 rounded-full animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-8 bg-white/8 rounded-full animate-pulse animation-delay-3000"></div>
          <div className="absolute top-1/3 right-1/4 w-8 h-2 bg-white/8 rounded-full animate-pulse animation-delay-3000"></div>
        </div>
        
        <div className="relative z-10 text-center">
          {/* Compact Clinic Logo with aesthetic frame */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              {/* Aesthetic logo frame */}
              <div className="absolute -inset-2 bg-white/10 rounded-full animate-pulse"></div>
              <div className="absolute -inset-1 bg-white/5 rounded-full animate-pulse animation-delay-500"></div>
              
              <div className="w-12 h-12 md:w-16 md:h-16 relative bg-white/10 rounded-full p-2 backdrop-blur-sm">
                <img
                  src="/images/gonstead-logo-new.png"
                  alt="Gonstead Chiropractic Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Glowing dots around logo */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse animation-delay-1000"></div>
            </div>
          </div>
          
          {/* Elegant title with enhanced typography */}
          <CardTitle className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-white drop-shadow-lg tracking-wide">
            <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
              {t("book.appointment")}
            </span>
          </CardTitle>
          
          {/* Stylized subtitle */}
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
            {language === "ur" ? "پیشہ ورانہ اور آسان اپائنٹمنٹ بکنگ" : "Professional & Streamlined Booking"}
          </p>
          
          {/* Clinic Schedule Notice */}
          <div className="mt-4 p-3 bg-orange-400/20 border border-orange-400/30 rounded-lg backdrop-blur-sm">
            <div className="text-sm text-white">
              <strong>CLINIC SCHEDULE NOTICE</strong>
              <p className="mt-1">{language === "ur" ? "براہ کرم نوٹ کریں: ہمارا کلینک اتوار کو بند رہتا ہے۔ اپائنٹمنٹ کے لیے پیر سے ہفتہ تک کا دن منتخب کریں۔" : "Please note: Our clinic is closed on Sundays. Kindly schedule your appointments for Monday through Saturday."}</p>
              <p className="mt-1"><strong>{language === "ur" ? "کھلنے کے اوقات:" : "Operating Hours:"}  </strong>{language === "ur" ? "پیر سے ہفتہ" : "Monday - Saturday"} | <strong>{language === "ur" ? "بند:" : "Closed:"}</strong> {language === "ur" ? "اتوار اور عوامی تعطیلات" : "Sundays & Public Holidays"}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 md:p-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Personal Information */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[rgb(66,139,124)] dark:text-[rgb(66,139,124)] border-b-2 border-[rgb(66,139,124)]/20 pb-2 sm:pb-3">
              {language === "ur" ? "ذاتی معلومات" : "Personal Information"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {language === "ur" ? "مکمل نام" : "Full Name"} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={language === "ur" ? "اپنا مکمل نام درج کریں" : "Enter your full name"}
                  className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] h-10 md:h-12 text-sm md:text-base"
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
                  className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] h-10 md:h-12 text-sm md:text-base"
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
                className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)] h-10 md:h-12 text-sm md:text-base"
              />
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-[rgb(66,139,124)] dark:text-[rgb(66,139,124)] border-b-2 border-[rgb(66,139,124)]/20 pb-3">
              {language === "ur" ? "فوریت کی سطح" : "Urgency Level"}
            </h3>
            <RadioGroup
              value={formData.urgency}
              onValueChange={(value: "normal" | "urgent" | "emergency") =>
                setFormData((prev) => ({ ...prev, urgency: value }))
              }
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
            >
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl hover:border-[rgb(66,139,124)] transition-all">
                <RadioGroupItem value="normal" id="normal" className="border-[rgb(50,106,122)] data-[state=checked]:bg-[rgb(50,106,122)] data-[state=checked]:border-[rgb(50,106,122)] text-[rgb(50,106,122)]" />
                <Label htmlFor="normal" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-sm md:text-base">{language === "ur" ? "عام" : "Normal"}</div>
                    <div className="text-xs text-gray-500">{language === "ur" ? "1-2 دن" : "1-2 days"}</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-[rgb(228,253,237)]/50 rounded-xl hover:border-[rgb(228,253,237)] transition-all">
                <RadioGroupItem value="urgent" id="urgent" className="border-[rgb(50,106,122)] data-[state=checked]:bg-[rgb(50,106,122)] data-[state=checked]:border-[rgb(50,106,122)] text-[rgb(50,106,122)]" />
                <Label htmlFor="urgent" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-[rgb(138,176,141)]" />
                  <div>
                    <div className="font-medium text-sm md:text-base">{language === "ur" ? "فوری" : "Urgent"}</div>
                    <div className="text-xs text-gray-500">{language === "ur" ? "آج ہی" : "Same day"}</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 md:p-4 border-2 border-red-200 rounded-xl hover:border-red-400 transition-all">
                <RadioGroupItem value="emergency" id="emergency" className="border-[rgb(50,106,122)] data-[state=checked]:bg-[rgb(50,106,122)] data-[state=checked]:border-[rgb(50,106,122)] text-[rgb(50,106,122)]" />
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
            <h3 className="text-lg md:text-xl font-semibold text-[rgb(66,139,124)] dark:text-[rgb(66,139,124)] border-b-2 border-[rgb(66,139,124)]/20 pb-3">
              {language === "ur" ? "سیشن کی قسم" : "Session Type"} *
            </h3>
            <RadioGroup
              value={formData.sessionType}
              onValueChange={(value: "in_clinic" | "video") => setFormData((prev) => ({ ...prev, sessionType: value }))}
              className="space-y-3 md:space-y-4"
            >
              <div className="flex items-center space-x-4 p-4 md:p-6 border-2 border-[rgb(66,139,124)]/20 rounded-2xl hover:border-[rgb(66,139,124)]/50 hover:bg-[rgb(66,139,124)]/5 transition-all duration-300 cursor-pointer">
                <RadioGroupItem value="in_clinic" id="clinic" className="border-[rgb(50,106,122)] data-[state=checked]:bg-[rgb(50,106,122)] data-[state=checked]:border-[rgb(50,106,122)] text-[rgb(50,106,122)] w-5 h-5" />
                <Label htmlFor="clinic" className="flex items-center gap-3 md:gap-4 cursor-pointer flex-1">
                  <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-[rgb(66,139,124)]" />
                  <div>
                    <div className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200">
                      {language === "ur" ? "کلینک میں گونسٹیڈ ایڈجسٹمنٹ" : "In-clinic Gonstead Adjustment"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === "ur" ? "جدید مشینری کی مدد سے علاج" : "Advanced machine-assisted treatment"}
                    </div>
                    <div className="text-xs text-[rgb(66,139,124)] font-medium mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {language === "ur" ? "تحصیل روڈ، نوشہرہ" : "Tehsil Road, Nowshera"}
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-4 p-4 md:p-6 border-2 border-red-200 rounded-2xl hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-300 cursor-pointer">
                <RadioGroupItem value="video" id="video" className="border-[rgb(50,106,122)] data-[state=checked]:bg-[rgb(50,106,122)] data-[state=checked]:border-[rgb(50,106,122)] text-[rgb(50,106,122)] w-5 h-5" />
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


          {/* Sunday Closure Notice */}
          {(isToday() || isSundaySelected) && (
            <Alert className={`border-2 ${
              isToday() 
                ? 'border-red-500 bg-red-50 text-red-800' 
                : 'border-amber-500 bg-amber-50 text-amber-800'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                isToday() ? 'text-red-600' : 'text-amber-600'
              }`} />
              <AlertDescription className="font-medium text-sm">
                <div className="flex items-start gap-2">
                  <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    isToday() ? 'text-red-600' : 'text-amber-600'
                  }`} />
                  <div>
                    <p className="font-bold mb-1">
                      {isToday() ? '🚫 CLINIC CLOSED TODAY' : '📅 SUNDAY SELECTED - CLINIC CLOSED'}
                    </p>
                    <p>
                      {isToday() 
                        ? (language === "ur" 
                            ? "ہمارا کلینک آج (اتوار) بند ہے۔ براہ کرم اپنی اپائنٹمنٹ کے لیے کوئی اور دن منتخب کریں۔"
                            : "Our clinic is closed today (Sunday). Please select another day for your appointment booking.")
                        : (language === "ur"
                            ? "آپ نے اتوار کا دن منتخب کیا ہے۔ ہمارا کلینک اتوار کو بند رہتا ہے۔ براہ کرم پیر سے ہفتہ تک کوئی دن منتخب کریں۔"
                            : "You have selected Sunday. Our clinic is closed on Sundays. Please choose Monday through Saturday for your appointment.")}
                    </p>
                    {!isToday() && (
                      <p className="mt-2 text-xs font-medium">
                        <strong>{language === "ur" ? "کھلنے کے اوقات:" : "Operating Hours:"}</strong> {language === "ur" ? "پیر - ہفتہ" : "Monday - Saturday"} | 
                        <strong> {language === "ur" ? "بند:" : "Closed:"}</strong> {language === "ur" ? "اتوار اور عوامی تعطیلات" : "Sundays & Public Holidays"}
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preferred Time */}
          <div className="space-y-3">
            <Label htmlFor="time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {language === "ur" ? "ترجیحی تاریخ اور وقت" : "Preferred Date & Time"} *
            </Label>
            <Input
              id="time"
              type="datetime-local"
              value={formData.preferredTime}
              onChange={(e) => {
                const selectedDateTime = new Date(e.target.value)
                setSelectedDate(selectedDateTime)
                setIsSundaySelected(isSunday(selectedDateTime))
                
                // Generate validation message
                const validationMsg = generateValidationMessage(selectedDateTime)
                setTimeValidationMessage(validationMsg)
                
                // Split datetime-local value into date and time components
                const [dateStr, timeStr] = e.target.value.split('T')
                
                setFormData((prev) => ({ 
                  ...prev, 
                  preferredTime: e.target.value,
                  selectedDate: dateStr || '',
                  selectedTime: timeStr || ''
                }))
              }}
              className={`border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)] h-10 md:h-12 text-sm md:text-base ${
                isSundaySelected ? 'border-red-500 bg-red-50' : ''
              }`}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
            {/* Dynamic validation message */}
            {timeValidationMessage && (
              <div className={`mt-2 p-2 rounded-md text-xs font-medium flex items-start gap-2 ${
                timeValidationMessage.includes('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <div className="flex-1">
                  {timeValidationMessage}
                </div>
              </div>
            )}
            
            {isSundaySelected && (
              <p className="text-red-600 text-xs font-medium">
                ⚠️ {language === "ur" ? "اتوار منتخب کیا گیا - کلینک بند" : "Sunday selected - Clinic closed"}
              </p>
            )}
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
              className="border-[rgb(66,139,124)]/30 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)] min-h-[100px] md:min-h-[120px] text-sm md:text-base"
            />
          </div>

          <Button
            type="submit"
            className={`w-full font-bold py-4 md:py-6 text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${
              isSundaySelected 
                ? 'bg-red-500 hover:bg-red-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[rgb(66,139,124)] to-[rgb(66,139,124)] hover:from-[rgb(66,139,124)] hover:to-[rgb(66,139,124)]'
            } text-white`}
            disabled={isSubmitting || isSundaySelected}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                {language === "ur" ? "بک ہو رہا ہے..." : "Booking Appointment..."}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 md:h-6 md:w-6" />
                {t("book.appointment")}
              </div>
            )}
          </Button>
        </form>
      </CardContent>
      
      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .gradient-bg {
          background: linear-gradient(-45deg, #428b7c, #4c9d90, #428b7c, #66b3a7);
          background-size: 400% 400%;
          animation: gradient-shift 4s ease infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </Card>
  )
}
