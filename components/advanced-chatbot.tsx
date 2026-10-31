"use client"

import React, { useState, useRef, useEffect, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Languages,
  Calendar,
  Phone,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "appointment" | "location" | "booking"
}

interface AppointmentData {
  name?: string
  phone?: string
  email?: string
  preferredTime?: string
  sessionType?: "in_clinic" | "video"
  notes?: string
  step: number
}

export const AdvancedChatbot = memo(() => {
  const [isOpen, setIsOpen] = useState(false)
  const chatbotRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { language, setLanguage } = useLanguage()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      text:
        language === "ur"
          ? "السلام علیکم! میں گونسٹیڈ کائروپریکٹک کا اسسٹنٹ ہوں۔ میں اپائنٹمنٹ بک کرنے، علاج کے سوالات، یا ڈاکٹر بشیر خان سے رہنمائی میں آپ کی مدد کر سکتا ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟"
          : "Hello! I'm your Gonstead Chiropractic assistant. I can help you book appointments, answer questions about treatments, or connect you with Bashir Khan Chiropractic Clinic. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [appointmentBooking, setAppointmentBooking] = useState<AppointmentData | null>(null)

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isTyping])

  // Close on outside click on desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatbotRef.current &&
        !chatbotRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        // Only close if screen is desktop width to avoid accidental taps on mobile
        if (typeof window !== "undefined" && window.innerWidth > 768) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Conversational appointment booking logic
  const processAppointmentBooking = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (!appointmentBooking) {
      setAppointmentBooking({ step: 1 })
      return language === "ur"
        ? "بہترین! میں اپائنٹمنٹ بک کرنے میں آپ کی مدد کروں گا۔ براہ کرم اپنا پورا نام بتائیے۔"
        : "Great! I'll help you book an appointment with Bashir Khan Chiropractic. Let's start with your full name. What's your name?"
    }

    switch (appointmentBooking.step) {
      case 1:
        setAppointmentBooking((prev) => ({ ...prev!, name: userMessage, step: 2 }))
        return language === "ur"
          ? `شکریہ، ${userMessage}! اب براہ کرم اپنا موبائل نمبر فراہم کریں۔`
          : `Thank you, ${userMessage}! Please provide your mobile number for appointment confirmation.`

      case 2:
        const phoneClean = userMessage.replace(/\s+/g, "")
        if (phoneClean.length < 10) {
          return language === "ur"
            ? "براہ کرم ایک درست موبائل نمبر فراہم کریں (مثلاً 03046996267)۔"
            : "Please provide a valid phone number (e.g., 0304 699 6267)."
        }
        setAppointmentBooking((prev) => ({ ...prev!, phone: userMessage, step: 3 }))
        return language === "ur"
          ? "آپ کلینک وزٹ کو ترجیح دیں گے یا ویڈیو کنسلٹیشن؟ براہ کرم 'clinic' یا 'video' لکھیں۔"
          : "Would you prefer an in-clinic Gonstead adjustment or a video consultation? Please type 'clinic' or 'video'."

      case 3:
        if (message.includes("clinic") || message.includes("کلینک") || message.includes("office") || message.includes("visit")) {
          setAppointmentBooking((prev) => ({ ...prev!, sessionType: "in_clinic", step: 4 }))
          return language === "ur"
            ? "کلینک وزٹ بہترین انتخاب ہے! آپ کس دن اور وقت پر تشریف لانا پسند کریں گے؟ (مثلاً: کل دوپہر 2 بجے)"
            : "In-clinic adjustment selected! What preferred date and time would work best for you? (e.g., 'Tomorrow at 2 PM')"
        } else if (message.includes("video") || message.includes("ویڈیو") || message.includes("online")) {
          setAppointmentBooking((prev) => ({ ...prev!, sessionType: "video", step: 4 }))
          return language === "ur"
            ? "ویڈیو کنسلٹیشن منتخب ہو گئی۔ آپ کس دن اور وقت پر دستیاب ہوں گے؟"
            : "Video consultation selected! Please specify your preferred date and time."
        } else {
          return language === "ur"
            ? "براہ کرم 'clinic' یا 'video' منتخب فرمائیں۔"
            : "Please reply with either 'clinic' or 'video'."
        }

      case 4:
        setAppointmentBooking((prev) => ({ ...prev!, preferredTime: userMessage, step: 5 }))
        return language === "ur"
          ? "کیا آپ کی تکلیف کے متعلق کوئی خاص نوٹس یا علامات ہیں جو آپ شیئر کرنا چاہتے ہیں؟ (اگر نہیں تو 'none' لکھیں)"
          : "Do you have any specific concerns or pain symptoms Dr. Bashir should know beforehand? (Or reply 'none')"

      case 5:
        const notes = message === "none" || message === "کوئی نہیں" ? "" : userMessage
        setAppointmentBooking((prev) => ({ ...prev!, notes, step: 6 }))

        return language === "ur"
          ? `📋 اپائنٹمنٹ کی تفصیلات:
👤 نام: ${appointmentBooking.name}
📞 فون: ${appointmentBooking.phone}
🏥 قسم: ${appointmentBooking.sessionType === "in_clinic" ? "کلینک وزٹ" : "ویڈیو کنسلٹیشن"}
📅 وقت: ${appointmentBooking.preferredTime}
📝 نوٹس: ${notes || "کوئی نہیں"}

کیا میں یہ اپائنٹمنٹ کنفرم کر دوں؟ تصدیق کے لیے 'yes' یا 'جی ہاں' لکھیں۔`
          : `📋 APPOINTMENT SUMMARY:
👤 Name: ${appointmentBooking.name}
📞 Phone: ${appointmentBooking.phone}
🏥 Type: ${appointmentBooking.sessionType === "in_clinic" ? "In-Clinic Gonstead Adjustment" : "Video Consultation"}
📅 Time: ${appointmentBooking.preferredTime}
📝 Notes: ${notes || "None"}

Shall I confirm this booking? Type 'yes' to confirm or 'no' to cancel.`

      case 6:
        if (message.includes("yes") || message.includes("جی") || message.includes("confirm") || message.includes("ہاں")) {
          const bookingData = { ...appointmentBooking }
          setAppointmentBooking(null)
          return language === "ur"
            ? `🎉 اپائنٹمنٹ کامیابی سے بک ہو گئی ہے!

محترم ${bookingData.name}، آپ کی اپائنٹمنٹ کی درخواست موصول ہو گئی ہے۔
ہمارا عملہ جلد واٹس ایپ یا فون پر آپ سے حتمی وقت کی تصدیق کرے گا۔

📍 کلینک: پشاور ماڈل اسکول کے قریب، تحصیل روڈ، نوشہرہ
📞 رابطہ: +92 304 699 6267`
            : `🎉 APPOINTMENT REQUEST SUBMITTED!

Dear ${bookingData.name}, your request has been logged.
Our clinic staff will confirm your slot via WhatsApp or phone shortly.

📍 Clinic: Near Peshawar Model School, Tehsil Road, Nowshera
📞 Contact: +92 304 699 6267`
        } else {
          setAppointmentBooking(null)
          return language === "ur"
            ? "بکنگ منسوخ کر دی گئی ہے۔ آپ جب چاہیں دوبارہ شروع کر سکتے ہیں!"
            : "Booking cancelled. Feel free to start again or contact us directly at +92 304 699 6267."
        }

      default:
        setAppointmentBooking(null)
        return language === "ur" ? "میں آپ کی مزید کیا مدد کر سکتا ہوں؟" : "How else may I help you today?"
    }
  }

  const getBotResponse = async (userMessage: string): Promise<string> => {
    const text = userMessage.toLowerCase()

    // 1. Direct appointment intent
    if (
      appointmentBooking ||
      /(book|appointment|schedule|اپائنٹمنٹ|بک)/.test(text)
    ) {
      return processAppointmentBooking(userMessage)
    }

    // 2. Direct FAQ inquiry
    if (/(faq|frequently asked|سوالات|سوال)/.test(text)) {
      return language === "ur"
        ? "ہمارے پاس گونسٹیڈ تکنیک، سائیٹکا، فیس، اور اوقات کے تمام تفصیلی جوابات ہمارے نئے FAQ پیج پر موجود ہیں۔ آپ اوپر دیے گئے 'FAQ پیج' لنک پر کلک کر کے یا www.gonsteadchiropractic.org/faq دیکھ سکتے ہیں!"
        : "We have created a comprehensive dedicated FAQ page covering all questions about Gonstead technique, sciatica, disc issues, fees, and clinic hours! You can visit it directly at our FAQ page link above."
    }

    // 3. Clinic location intent
    if (/(location|address|where|پتہ|کہاں|کلینک کہاں)/.test(text)) {
      return language === "ur"
        ? "کلینک کا پتہ: پشاور ماڈل اسکول کے قریب، تحصیل روڈ، نوشہرہ، خیبر پختونخوا۔ سامنے کشادہ مفت پارکنگ موجود ہے۔ فون: +92 304 699 6267"
        : "Clinic Location: Near Peshawar Model School, Tehsil Road, Nowshera, Khyber Pakhtunkhwa. Free parking available in front. Call +92 304 699 6267."
    }

    // 4. Hours intent
    if (/(hours|timing|time|اوقات|کھلنے|ٹائم)/.test(text)) {
      return language === "ur"
        ? "کلینک کے اوقات: پیر تا ہفتہ صبح 9:00 بجے سے شام 6:00 بجے تک۔ اتوار کو ایمرجنسی کیسز پیشگی رابطے پر دیکھے جاتے ہیں۔"
        : "Clinic Hours: Monday – Saturday from 9:00 AM to 6:00 PM. Sundays are reserved for acute emergency consultations by phone appointment."
    }

    // 5. Try backend API or helpful fallback
    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }))

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: historyPayload }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.text) return String(data.text)
      }
    } catch {
      // Fallback
    }

    return language === "ur"
      ? "ڈاکٹر بشیر خان گونسٹیڈ کائروپریکٹک اسپائنل کیئر کے سند یافتہ ماہر ہیں۔ ریڑھ کی ہڈی، مہروں، یا سائیٹکا کے تفصیلی مشورے کے لیے آپ کلینک وزٹ کریں یا ہمارے تفصیلی FAQ پیج کو ملاحظہ فرمائیں۔ فون: +92 304 699 6267"
      : "Dr. Bashir Khan is a certified Gonstead specialist providing precision spinal adjustments. For comprehensive details on specific conditions or fees, please check our FAQ page or contact our team directly at +92 304 699 6267."
  }

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputMessage
    if (!textToSend.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    }

    setInputMessage("")
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const botReply = await getBotResponse(textToSend)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botReply,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text:
          language === "ur"
            ? "معذرت، رابطہ نہیں ہو سکا۔ براہ کرم ہمیں واٹس ایپ +92 304 699 6267 پر رابطہ کریں۔"
            : "Could not deliver message. Please contact us on WhatsApp at +92 304 699 6267.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div ref={chatbotRef} className="fixed bottom-4 right-4 z-[9999]">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[rgb(70,146,138)] to-[rgb(30,96,118)] text-white shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/30"
          aria-label="Open Chat Assistant"
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-40 blur-md group-hover:opacity-75 transition-opacity animate-pulse"></div>
          <div className="relative z-10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          {/* Online status indicator dot */}
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[92vw] max-w-[390px] sm:w-[390px] h-[550px] max-h-[82vh] flex flex-col rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header */}
          <CardHeader className="p-3.5 bg-gradient-to-r from-[rgb(70,146,138)] via-[rgb(50,126,128)] to-[rgb(30,96,118)] text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 relative rounded-full bg-white/15 p-1 border border-white/20 flex-shrink-0">
                  <Image
                    src="/images/gonstead-logo-new.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-bold font-poppins text-white truncate">
                    Gonstead Assistant
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Dr. Bashir Clinic</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Dedicated FAQ Page Link */}
                <Link
                  href="/faq"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm transition-colors border border-white/20"
                  title="View Dedicated FAQ Page"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>FAQ Page</span>
                </Link>

                {/* Language Toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLanguage(language === "ur" ? "en" : "ur")}
                  className="text-white hover:bg-white/20 h-7 w-7 p-0 rounded-lg"
                  aria-label="Switch Language"
                  title={language === "ur" ? "Switch to English" : "اردو"}
                >
                  <Languages className="h-4 w-4" />
                </Button>

                {/* Close Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-red-500/20 h-7 w-7 p-0 rounded-lg"
                  aria-label="Close Chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Quick FAQ Announcement Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-900 dark:text-emerald-300">
            <span className="flex items-center gap-1 font-medium truncate">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Looking for FAQs? Explore our dedicated page!</span>
            </span>
            <Link
              href="/faq"
              onClick={() => setIsOpen(false)}
              className="font-bold underline ml-1 hover:text-emerald-700 flex-shrink-0"
            >
              Open FAQ →
            </Link>
          </div>

          {/* Messages Area */}
          <CardContent className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-teal-500/20">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2 ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "bot" && (
                  <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-[rgb(70,146,138)]/30">
                    <AvatarImage src="/images/gonstead-logo-new.png" className="p-0.5 object-contain" />
                    <AvatarFallback className="bg-[rgb(70,146,138)]/10 text-[10px]">
                      <Bot className="h-3.5 w-3.5 text-[rgb(70,146,138)]" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[rgb(70,146,138)] text-white rounded-br-none shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === "user" ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {m.sender === "user" && (
                  <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-cyan-500/30">
                    <AvatarFallback className="bg-cyan-600/10 text-cyan-700 text-[10px]">
                      <User className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Avatar className="w-6 h-6 ring-1 ring-teal-500/20">
                  <AvatarFallback className="bg-teal-500/10">
                    <Bot className="h-3 w-3 text-teal-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"></span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Action Suggestion Buttons */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend(language === "ur" ? "میں اپائنٹمنٹ بک کرنا چاہتا ہوں" : "I want to book an appointment")}
              className="text-[11px] whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-medium transition-colors"
            >
              📅 {language === "ur" ? "اپائنٹمنٹ بک کریں" : "Book Appointment"}
            </button>
            <Link
              href="/faq"
              onClick={() => setIsOpen(false)}
              className="text-[11px] whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-[rgb(70,146,138)] dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800 font-medium transition-colors flex items-center gap-1"
            >
              <HelpCircle className="h-3 w-3" />
              <span>{language === "ur" ? "تمام سوالات (FAQ)" : "Browse All FAQs"}</span>
            </Link>
            <button
              onClick={() => handleSend(language === "ur" ? "کلینک کے اوقات اور پتہ بتائیں" : "What are your hours and clinic location?")}
              className="text-[11px] whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-medium transition-colors"
            >
              📍 {language === "ur" ? "کلینک کا پتہ اور وقت" : "Hours & Location"}
            </button>
          </div>

          {/* Input Footer */}
          <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  language === "ur" ? "پیغام لکھیں یا سوال پوچھیں..." : "Type a message or question..."
                }
                className="text-xs sm:text-sm h-9 bg-slate-50 dark:bg-slate-800 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-teal-500"
                aria-label="Chat input"
              />
              <Button
                size="sm"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim()}
                className="h-9 px-3 bg-[rgb(70,146,138)] hover:bg-[rgb(60,136,128)] text-white rounded-xl shadow-sm disabled:opacity-40"
                aria-label="Send Message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
})

AdvancedChatbot.displayName = "AdvancedChatbot"
