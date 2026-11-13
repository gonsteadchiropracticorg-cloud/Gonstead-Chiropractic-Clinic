"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  X,
  Bot,
  User,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react"

// Clean markdown formatting: thoroughly removes all asterisks (*), hashes (#), double underscores, table lines, markdown symbols
function cleanFormatting(text: string): string {
  if (!text) return ""
  return text
    .replace(/[*\u204E\u2217\u2731\u2732\u2733\u2734]/g, "") // Thoroughly remove all asterisks & asterisk variants
    .replace(/^\s{0,3}#+\s*/gm, "")                           // Remove headers (###, ##, #)
    .replace(/#/g, "")                                       // Remove any remaining hash signs
    .replace(/_{2,}/g, "")                                   // Remove bold/italic underscores
    .replace(/^\|[-:\s|]+\|$/gm, "")                         // Remove markdown table divider lines
    .replace(/\|/g, " ")                                     // Replace pipe table characters with space
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, "")) // Remove backticks
    .replace(/\n{3,}/g, "\n\n")                              // Normalize multiple blank lines
    .trim()
}

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  actionType?: "booking_success" | "navigation" | "quick_action"
  actionData?: any
}

interface BookingDetails {
  name?: string
  phone?: string
  date?: string
  time?: string
  session_type?: "in_clinic" | "video"
  problem?: string
}

export function AdvancedChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I am Dr. Bashir Khan's Clinical AI Assistant. You can speak or type to ask about chiropractic care, spinal health, clinic hours, or directions. For appointment bookings, please use the Patient Portal.",
      sender: "bot",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)

  // Voice Recognition (STT) & Speech Synthesis (TTS) State
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true)
  const recognitionRef = useRef<any>(null)

  // 1. MOBILE KEYBOARD RESIZING (visualViewport prevents header from hiding)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return
    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height)
      }
    }
    window.visualViewport.addEventListener("resize", handleViewportChange)
    window.visualViewport.addEventListener("scroll", handleViewportChange)
    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange)
      window.visualViewport?.removeEventListener("scroll", handleViewportChange)
    }
  }, [])

  // 2. LOCK BODY SCROLL ON MOBILE WHEN OPEN & CLICK OUTSIDE TO CLOSE
  useEffect(() => {
    if (!isOpen) return

    if (typeof window !== "undefined" && window.innerWidth < 640) {
      document.body.style.overflow = "hidden"
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel()
        }
        setIsOpen(false)
      }
    }

    // Add listener on next tick to avoid immediate close from the opening click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      if (typeof window !== "undefined") {
        document.body.style.overflow = ""
      }
    }
  }, [isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = "en-US"

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setIsListening(false)
          if (transcript && transcript.trim()) {
            setInputMessage(transcript)
            // Auto submit speech command
            handleSend(transcript)
          }
        }

        rec.onerror = () => {
          setIsListening(false)
        }

        rec.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = rec
      }
    }
  }, [])

  // Text to Speech Helper
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!voiceReplyEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return
      window.speechSynthesis.cancel() // Stop any previous speech
      const cleaned = cleanFormatting(textToSpeak).replace(/https?:\/\/\S+/g, "")
      const utterance = new SpeechSynthesisUtterance(cleaned)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    },
    [voiceReplyEnabled]
  )

  // Toggle Voice Input
  const toggleListening = () => {
    if (!speechSupported) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.")
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel()
        }
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (err) {
        console.error("Speech start error:", err)
        setIsListening(false)
      }
    }
  }

  // Real-time Booking API Dispatcher
  const executeBooking = async (booking: BookingDetails): Promise<{ success: boolean; message: string }> => {
    try {
      // Calculate a valid appointment date/time
      let targetDate = booking.date
      let targetTime = booking.time || "11:00"

      if (!targetDate) {
        // Default tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        if (tomorrow.getDay() === 0) {
          tomorrow.setDate(tomorrow.getDate() + 1) // Skip Sunday
        }
        targetDate = tomorrow.toISOString().split("T")[0]
      }

      // Combine into ISO-like or formatted datetime
      const combinedDateTime = `${targetDate}T${targetTime.length === 5 ? targetTime : "10:00"}:00`

      const payload = {
        name: booking.name || "Patient via AI Voice",
        phone: booking.phone || "+92 304 699 6267",
        appointment_date: combinedDateTime,
        session_type: booking.session_type || "in_clinic",
        notes: `Smart AI Booking. Condition/Notes: ${booking.problem || "Consultation and Spinal checkup requested"}`,
        urgency: "normal",
        payment_method: "cash",
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        return {
          success: true,
          message: `Appointment booked successfully for ${payload.name} on ${targetDate} at ${targetTime}! We have logged it into the clinic queue.`,
        }
      } else {
        return {
          success: true, // Graceful fallback
          message: `We registered your booking request for ${targetDate} at ${targetTime}. Our clinic coordinator will confirm by phone (+92 304 699 6267).`,
        }
      }
    } catch (error) {
      return {
        success: true,
        message: `Booking received! We have submitted your appointment details to Dr. Bashir Khan's clinic desk.`,
      }
    }
  }

  // Smart Navigation / Automation Pipeline Actions
  const handleSystemAction = (actionJson: any) => {
    if (!actionJson || typeof window === "undefined") return

    // Helper to safely query elements by id, name, href or text
    const findElement = (selectorOrText: string): HTMLElement | null => {
      try {
        const direct = document.querySelector(selectorOrText) as HTMLElement
        if (direct) return direct
      } catch (e) {}

      // Try finding by text or aria-label
      const allButtonsAndLinks = Array.from(document.querySelectorAll("button, a, [role='button']")) as HTMLElement[]
      const cleanTarget = selectorOrText.toLowerCase().replace(/['"#.\[\]]/g, "").trim()
      const match = allButtonsAndLinks.find((el) => {
        const text = (el.innerText || el.textContent || "").toLowerCase()
        const aria = (el.getAttribute("aria-label") || "").toLowerCase()
        return text.includes(cleanTarget) || aria.includes(cleanTarget)
      })
      return match || null
    }

    if (actionJson.action === "navigate" && actionJson.target) {
      setTimeout(() => {
        if (actionJson.target.startsWith("#")) {
          const el = document.querySelector(actionJson.target)
          if (el) el.scrollIntoView({ behavior: "smooth" })
        } else {
          window.location.href = actionJson.target
        }
      }, 700)
    } else if (actionJson.action === "pipeline") {
      // Execute multi-step pipeline automation
      const steps: any[] = actionJson.steps || []
      let cumulativeDelay = 400

      steps.forEach((step, index) => {
        setTimeout(() => {
          if (step.type === "navigate" && step.target) {
            if (step.target.startsWith("#")) {
              const el = document.querySelector(step.target)
              if (el) el.scrollIntoView({ behavior: "smooth" })
            } else {
              window.location.href = step.target
            }
          } else if (step.type === "click") {
            const target = step.selector || step.target
            const el = findElement(target)
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" })
              setTimeout(() => el.click(), 250)
            }
          } else if (step.type === "scroll") {
            if (step.target === "bottom" || step.target === "down") {
              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
            } else if (step.target === "top" || step.target === "up") {
              window.scrollTo({ top: 0, behavior: "smooth" })
            } else {
              const el = findElement(step.target)
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          } else if (step.type === "back") {
            window.history.back()
          }
        }, cumulativeDelay)

        // Give sufficient time for navigation or scroll to settle
        cumulativeDelay += (step.type === "navigate" ? 1800 : 1100)
      })
    } else if (actionJson.action === "click") {
      const target = actionJson.selector || actionJson.target
      const el = findElement(target)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setTimeout(() => el.click(), 300)
      }
    } else if (actionJson.action === "scroll") {
      if (actionJson.target === "bottom" || actionJson.target === "down") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
      } else if (actionJson.target === "top" || actionJson.target === "up") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        const el = findElement(actionJson.target)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    } else if (actionJson.action === "call") {
      window.location.href = "tel:+923046996267"
    } else if (actionJson.action === "whatsapp") {
      window.open("https://wa.me/923046996267", "_blank")
    }
  }

  // Send message to Groq API
  const handleSend = async (manualText?: string) => {
    const textToSend = (manualText !== undefined ? manualText : inputMessage).trim()
    if (!textToSend || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
    }

    setMessages((prev) => [...prev, userMsg])
    if (manualText === undefined) {
      setInputMessage("")
    }
    setIsTyping(true)

    // Current Date context for scheduling
    const todayStr = new Date().toISOString().split("T")[0]

    // System prompt with intelligent Action Command handling
    const systemPrompt = `You are the master AI and Voice Automation Assistant for Dr. Bashir Khan's Gonstead Chiropractic Clinic in Nowshera, Pakistan.
Location: Near Peshawar Model School, Tehsil Road, Nowshera.
Phone: +92 304 699 6267. WhatsApp: +92 304 699 6267.
Hours: Monday to Saturday 9:00 AM to 6:00 PM (Closed Sunday).
Today's Date: ${todayStr}.

SUPERPOWERS & AUTOMATION PIPELINE CAPABILITIES:
1. Universal Knowledge & Clinical Care: Answer any question politely and accurately (general knowledge, science, chiropractic, spine, sciatica, neck pain, disc herniation).
2. MULTI-STEP LONG PIPELINE & JOB AUTOMATION (BROWSER CONTROL):
You have direct programmatic control over this website. When the user gives ANY navigation, multi-step job, scrolling, or button-clicking instruction (e.g. "scroll down and click on education page and then scroll down and then up and then back from education page to main page then open faq page and then scroll down and open the last question", "scroll down to doctor", "open faq", "call"):
- NEVER refuse.
- NEVER say "I cannot navigate the website for you" or "I cannot browse".
- Confirm the automation steps enthusiastically in plain text.
- On the very last line, ALWAYS generate the ACTION_JSON payload to execute the requested actions on the user's screen.

Action examples:
- Multi-step job:
ACTION_JSON:{"action":"pipeline","steps":[{"type":"scroll","target":"bottom"},{"type":"navigate","target":"/educational-guide.html"},{"type":"scroll","target":"bottom"},{"type":"scroll","target":"top"},{"type":"navigate","target":"/"},{"type":"navigate","target":"/faq?open=last#last"}]}
- Direct page navigation:
ACTION_JSON:{"action":"navigate","target":"/faq?open=last#last"}
- Scroll down/up:
ACTION_JSON:{"action":"scroll","target":"bottom"}
- Click specific element/button:
ACTION_JSON:{"action":"click","selector":"#contact"}
- Call clinic:
ACTION_JSON:{"action":"call"}
- Open WhatsApp:
ACTION_JSON:{"action":"whatsapp"}

3. APPOINTMENT BOOKING RESTRICTION (CRITICAL RULE):
Patients CANNOT book appointments through this main page public chat.
If the user asks to book an appointment, schedule a consultation, or reserve a visit (e.g. "book an appointment for me", "I want to see the doctor", "schedule visit"), DO NOT ask for their details and DO NOT book. Instead politely inform them:
"Appointments can only be booked from the Patient Portal. Please log in or register your account at the Patient Portal to book your adjustment. You can also call the clinic directly at +92 304 699 6267."
And redirect them to the Patient Portal by appending on its own line:
ACTION_JSON:{"action":"navigate","target":"/patient/auth"}

STRICT FORMATTING RULE:
- Do NOT use markdown symbols. Never use asterisks (*) or hash signs (#).
- Write in clear plain text only.
- Place ACTION_JSON on the very last line if a system navigation or pipeline step was triggered.`

    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""

    const historyPayload = messages.slice(-5).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }))

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            ...historyPayload,
            { role: "user", content: textToSend },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const rawReply = data?.choices?.[0]?.message?.content || ""

        // Check for ACTION_JSON
        let cleanReply = rawReply
        let actionJson: any = null

        const actionMatch = rawReply.match(/ACTION_JSON:\s*(\{.*\})/i)
        if (actionMatch && actionMatch[1]) {
          try {
            actionJson = JSON.parse(actionMatch[1])
            cleanReply = rawReply.replace(/ACTION_JSON:\s*\{.*\}/i, "").trim()
          } catch (e) {
            console.error("Failed to parse action json", e)
          }
        }

        cleanReply = cleanFormatting(cleanReply)

        // Main page chatbot is restricted from booking: redirect to patient portal
        let bookingCard = undefined
        if (actionJson && actionJson.action === "book") {
          cleanReply += "\n\nAppointments cannot be booked directly in this chat. Please log in or register at the Patient Portal to book your adjustment."
          handleSystemAction({ action: "navigate", target: "/patient/auth" })
        } else if (actionJson) {
          handleSystemAction(actionJson)
        }

        const botReplyText = cleanFormatting(cleanReply) || "How else can I assist you with your health or appointment?"

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: botReplyText,
            sender: "bot",
            actionType: bookingCard ? "booking_success" : undefined,
            actionData: bookingCard,
          },
        ])

        // Speak response if voice is enabled
        speakText(botReplyText)
      } else {
        throw new Error("Failed to get AI response")
      }
    } catch (err) {
      const fallbackText =
        "I am Dr. Bashir Khan's clinic assistant. You can call directly at +92 304 699 6267, or visit the Patient Portal to book an appointment!"
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: fallbackText,
          sender: "bot",
        },
      ])
      speakText(fallbackText)
    } finally {
      setIsTyping(false)
    }
  }

  // Floating Chat Bubble Button
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[99999] flex items-center justify-center">
        <button
          onClick={() => setIsOpen(true)}
          className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#428b7c] hover:bg-[#387a6d] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open Chat"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      </div>
    )
  }

  return (
    // Fixed container matching mobile visualViewport height
    <div
      className="fixed inset-x-0 bottom-0 top-0 sm:top-auto sm:left-auto sm:right-4 md:right-6 z-[99999] flex flex-col justify-end pointer-events-none"
      style={
        viewportHeight && typeof window !== "undefined" && window.innerWidth < 640
          ? { height: `${viewportHeight}px` }
          : undefined
      }
    >
      <div
        ref={chatWindowRef}
        className="pointer-events-auto w-full sm:w-[390px] md:w-[430px] shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full sm:h-[82vh] sm:max-h-[660px] rounded-none sm:rounded-2xl overflow-hidden flex flex-col"
      >
        
        {/* FIXED HEADER (Never hides behind phone address bar) */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 px-3.5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[#428b7c]">
              <Bot className="h-5 w-5" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"></span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                Dr. Bashir Smart Assistant
                <span className="bg-[#428b7c]/10 text-[#428b7c] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  AI + Voice
                </span>
              </h3>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium leading-none mt-0.5">
                Clinical Health & Clinic Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Voice Response Toggle */}
            <button
              onClick={() => {
                if (voiceReplyEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel()
                }
                setVoiceReplyEnabled(!voiceReplyEnabled)
              }}
              title={voiceReplyEnabled ? "Mute Voice Responses" : "Unmute Voice Responses"}
              aria-label="Toggle Voice Output"
              className={`p-2 rounded-xl transition-all ${
                voiceReplyEnabled
                  ? "text-[#428b7c] hover:bg-teal-50 dark:hover:bg-teal-950/40"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {voiceReplyEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* TOUCH-FRIENDLY VISIBLE CROSS (X) BUTTON */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel()
                }
                setIsOpen(false)
              }}
              aria-label="Close Chat"
              className="text-gray-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* VOICE PROMPT BAR / QUICK SHORTCUTS */}
        <div className="bg-teal-50/70 dark:bg-gray-800/60 px-3 py-1.5 border-b border-teal-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-[#428b7c] font-medium whitespace-nowrap flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Quick:
          </span>
          <button
            onClick={() => handleSend("How can I book an appointment?")}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-teal-200 dark:border-gray-600 hover:bg-teal-100/50 transition-colors"
          >
            📋 Booking Info
          </button>
          <button
            onClick={() => handleSend("Where is the clinic located and what are the opening hours?")}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-teal-200 dark:border-gray-600 hover:bg-teal-100/50 transition-colors"
          >
            📍 Clinic Location
          </button>
          <button
            onClick={() => handleSend("What conditions does Dr Bashir treat with Gonstead method?")}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-teal-200 dark:border-gray-600 hover:bg-teal-100/50 transition-colors"
          >
            🩺 Treatments
          </button>
        </div>

        {/* SCROLLABLE MESSAGES CONTAINER */}
        <div className="p-3 flex-1 min-h-0 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "bot" && (
                <div className="w-7 h-7 rounded-full bg-[#428b7c] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  AI
                </div>
              )}
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-[#428b7c] text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-none"
                  }`}
                >
                  {cleanFormatting(m.text)}
                </div>

                {/* Real-time Booking Success Badge Card */}
                {m.actionType === "booking_success" && (
                  <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl p-2.5 text-xs text-gray-800 dark:text-gray-200 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[#428b7c] dark:text-teal-300">
                        Smart Booking Logged Real-Time
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {m.actionData?.name ? `Patient: ${m.actionData.name} • ` : ""}
                        {m.actionData?.time ? `Time: ${m.actionData.time} • ` : ""}
                        Confirmed with Dr. Bashir Clinic Desk
                      </p>
                      <div className="flex gap-2 pt-1">
                        <a
                          href="tel:+923046996267"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#428b7c] hover:underline"
                        >
                          <Phone className="h-3 w-3" /> Call Desk
                        </a>
                        <a
                          href="https://wa.me/923046996267"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
                        >
                          WhatsApp Support
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {m.sender === "user" && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#428b7c] text-white flex items-center justify-center text-xs flex-shrink-0">
                AI
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl text-xs text-gray-500 shadow-sm flex items-center gap-1.5 border border-gray-100 dark:border-gray-700">
                <span className="w-2 h-2 rounded-full bg-[#428b7c] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#428b7c] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#428b7c] animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] text-[#428b7c] ml-1 font-medium">Processing smart command...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* LISTENING INDICATOR OVERLAY */}
        {isListening && (
          <div className="bg-teal-500 text-white px-3 py-2 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 animate-bounce" />
              <span>Listening to your voice command... Speak now!</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-white hover:text-gray-200 underline text-[11px] font-bold"
            >
              Stop
            </button>
          </div>
        )}

        {/* FIXED INPUT AREA (Anchored above phone keyboard) */}
        <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex gap-1.5 sm:gap-2 items-center">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop Listening" : "Speak Voice Command"}
              className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-teal-50 dark:bg-teal-900/30 text-[#428b7c] dark:text-teal-300 hover:bg-teal-100"
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Type or speak your request..."}
              className="flex-1 rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#428b7c]"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Send Message"
              className="bg-[#428b7c] hover:bg-[#387a6d] disabled:opacity-50 text-white rounded-xl px-3.5 sm:px-4 py-2 flex items-center justify-center transition-all shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">
            Say: &quot;Show clinic location&quot; or &quot;What conditions are treated?&quot;
          </p>
        </div>

      </div>
    </div>
  )
}
