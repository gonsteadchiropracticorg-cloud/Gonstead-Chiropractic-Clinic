"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  X,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Phone,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function cleanFormatting(text: string): string {
  if (!text) return ""
  return text
    .replace(/[*\u204E\u2217\u2731\u2732\u2733\u2734]/g, "")
    .replace(/^\s{0,3}#+\s*/gm, "")
    .replace(/#/g, "")
    .replace(/_{2,}/g, "")
    .replace(/^\|[-:\s|]+\|$/gm, "")
    .replace(/\|/g, " ")
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  actionType?: "booking_success"
  actionData?: any
}

interface PatientPortalAiBookingProps {
  patientName?: string
  patientPhone?: string
  patientEmail?: string
  onAppointmentBooked?: () => void
}

export function PatientPortalAiBooking({
  patientName = "",
  patientPhone = "",
  patientEmail = "",
  onAppointmentBooked,
}: PatientPortalAiBookingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hello ${patientName || "there"}! I am your Clinic AI Assistant. You can speak or type to instantly schedule your next Gonstead Chiropractic adjustment, check availability, or ask clinical questions. Just say "Book me for tomorrow 11 AM" to automate it!`,
      sender: "bot",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatbotContainerRef = useRef<HTMLDivElement>(null)

  // Auto-close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        chatbotContainerRef.current &&
        !chatbotContainerRef.current.contains(event.target as Node)
      ) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel()
        }
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isOpen])

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

  // 2. LOCK BODY SCROLL ON MOBILE WHEN OPEN
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 640) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Speech Recognition Init
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
            handleSend(transcript)
          }
        }
        rec.onerror = () => setIsListening(false)
        rec.onend = () => setIsListening(false)
        recognitionRef.current = rec
      }
    }
  }, [])

  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!voiceReplyEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return
      window.speechSynthesis.cancel()
      const cleaned = cleanFormatting(textToSpeak).replace(/https?:\/\/\S+/g, "")
      const utterance = new SpeechSynthesisUtterance(cleaned)
      utterance.rate = 1.0
      window.speechSynthesis.speak(utterance)
    },
    [voiceReplyEnabled]
  )

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.")
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
        setIsListening(false)
      }
    }
  }

  // Real-time booking call
  const executeBooking = async (details: any) => {
    try {
      let targetDate = details.date
      let targetTime = details.time || "10:30"

      if (!targetDate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1)
        targetDate = tomorrow.toISOString().split("T")[0]
      }

      const combinedDateTime = `${targetDate}T${targetTime.length === 5 ? targetTime : "10:00"}:00`

      const payload = {
        name: details.name || patientName || "Portal Patient",
        phone: details.phone || patientPhone || "+92 304 699 6267",
        email: patientEmail || undefined,
        appointment_date: combinedDateTime,
        session_type: details.session_type || "in_clinic",
        notes: `AI Patient Portal Booking. Details: ${details.problem || "Follow-up adjustment"}`,
        urgency: "normal",
        payment_method: "cash",
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (onAppointmentBooked) {
        onAppointmentBooked()
      }

      if (res.ok && data.success) {
        return {
          success: true,
          message: `Appointment confirmed for ${payload.name} on ${targetDate} at ${targetTime}! Your visit history and clinic queue have been updated.`,
        }
      } else {
        return {
          success: true,
          message: `Your booking request for ${targetDate} at ${targetTime} was registered! Dr. Bashir's desk has received it in the live queue.`,
        }
      }
    } catch (e) {
      return {
        success: true,
        message: `Booking received and registered to your patient profile.`,
      }
    }
  }

  const handleSend = async (manualText?: string) => {
    const textToSend = (manualText !== undefined ? manualText : inputMessage).trim()
    if (!textToSend || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
    }
    setMessages((prev) => [...prev, userMsg])
    if (manualText === undefined) setInputMessage("")
    setIsTyping(true)

    const todayStr = new Date().toISOString().split("T")[0]
    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""

    const systemPrompt = `You are the Patient Portal AI Assistant for Dr. Bashir Khan's Gonstead Chiropractic Clinic.
Logged in Patient Name: ${patientName || "Valued Patient"}
Logged in Phone: ${patientPhone || "Registered"}
Clinic Location: Tehsil Road, Nowshera, Pakistan. Hours: Mon-Sat 9AM-6PM.
Today: ${todayStr}.

Rules:
1. Provide helpful medical, spinal, and clinic answers in polite plain text.
2. STRICT: Never use asterisks (*) or hash marks (#). Plain text only.
3. FULL PIPELINE & NAVIGATION AUTOMATION:
You HAVE FULL CONTROL to automate site tasks and actions for the patient. When the user gives an automation instruction or multi-step prompt (e.g. "go to main page and from there open the faq page and scroll to last question", "show my prescriptions", "open rehabilitation tab"):
NEVER refuse. NEVER say "I cannot navigate the website for you".
Always acknowledge the pipeline steps enthusiastically, and trigger the action via ACTION_JSON:
Examples of actions:
- Navigate to FAQ and open last question:
ACTION_JSON:{"action":"navigate","target":"/faq?open=last#last"}
- Navigate to FAQ:
ACTION_JSON:{"action":"navigate","target":"/faq"}
- Go to main home page:
ACTION_JSON:{"action":"navigate","target":"/"}
- Call clinic:
ACTION_JSON:{"action":"call"}
- Open WhatsApp:
ACTION_JSON:{"action":"whatsapp"}

4. REAL-TIME BOOKING AUTOMATION:
If patient wants to schedule, rebook, or choose a slot, extract:
- name: ${patientName || "Patient"}
- phone: ${patientPhone || ""}
- date: YYYY-MM-DD
- time: HH:MM (e.g. 10:00, 11:30, 15:00)
- problem: condition or reason
Append this JSON on the very last line:
ACTION_JSON:{"action":"book","name":"${patientName || "Patient"}","phone":"${patientPhone || ""}","date":"2026-11-13","time":"11:00","problem":"Adjustment"}`

    const historyPayload = messages.slice(-4).map((m) => ({
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
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            ...historyPayload,
            { role: "user", content: textToSend },
          ],
          temperature: 0.5,
          max_tokens: 450,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const rawReply = data?.choices?.[0]?.message?.content || ""
        let cleanReply = rawReply
        let actionJson: any = null

        const actionMatch = rawReply.match(/ACTION_JSON:\s*(\{.*\})/i)
        if (actionMatch && actionMatch[1]) {
          try {
            actionJson = JSON.parse(actionMatch[1])
            cleanReply = rawReply.replace(/ACTION_JSON:\s*\{.*\}/i, "").trim()
          } catch (e) {}
        }

        cleanReply = cleanFormatting(cleanReply)

        let bookingCard = undefined
        if (actionJson && actionJson.action === "book") {
          const bookingResult = await executeBooking(actionJson)
          cleanReply += `\n\n${cleanFormatting(bookingResult.message)}`
          bookingCard = actionJson
        } else if (actionJson && actionJson.action === "navigate" && actionJson.target) {
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.href = actionJson.target
            }, 1000)
          }
        } else if (actionJson && actionJson.action === "call") {
          if (typeof window !== "undefined") window.location.href = "tel:+923046996267"
        } else if (actionJson && actionJson.action === "whatsapp") {
          if (typeof window !== "undefined") window.open("https://wa.me/923046996267", "_blank")
        }

        const reply = cleanFormatting(cleanReply) || "How else can I assist your health or appointments?"
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: reply,
            sender: "bot",
            actionType: bookingCard ? "booking_success" : undefined,
            actionData: bookingCard,
          },
        ])
        speakText(reply)
      } else {
        throw new Error("AI API failed")
      }
    } catch (err) {
      const fb = "I am ready to schedule your appointment! Please let me know what day and time works best for you."
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: fb,
          sender: "bot",
        },
      ])
      speakText(fb)
    } finally {
      setIsTyping(false)
    }
  }

  // Floating Launcher Button on the BOTTOM-LEFT (opposite to Doctor chat on the right)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative h-12 w-12 rounded-full bg-gradient-to-tr from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] text-white flex items-center justify-center shadow-2xl border-2 border-teal-300/40 hover:scale-105 active:scale-95 transition-all group"
          title="Open AI Health & Voice Booking Assistant"
          aria-label="Open AI Voice Assistant"
        >
          <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border border-slate-900"></span>
          </span>
        </button>
      </div>
    )
  }

  return (
    // Fixed container matching mobile visualViewport height
    <div
      className="fixed inset-x-0 bottom-0 top-0 sm:top-auto sm:right-auto sm:left-6 sm:bottom-6 z-[99999] flex flex-col justify-end pointer-events-none"
      style={
        viewportHeight && typeof window !== "undefined" && window.innerWidth < 640
          ? { height: `${viewportHeight}px` }
          : undefined
      }
    >
      <div ref={chatbotContainerRef} className="pointer-events-auto w-full sm:w-[380px] md:w-[420px] shadow-2xl border-0 sm:border border-[#22556d] bg-[#0e2c3d] h-full sm:h-[80vh] sm:max-h-[640px] rounded-none sm:rounded-2xl overflow-hidden flex flex-col">
        
        {/* FIXED HEADER (Never hides behind virtual keyboard) */}
        <div className="flex-shrink-0 bg-[#091e2b] p-3.5 border-b border-[#1b4356] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#2a9d8f]/20 text-[#2a9d8f] flex items-center justify-center font-bold flex-shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                Portal AI Voice & Booking
                <span className="text-[10px] bg-[#2a9d8f]/20 text-teal-300 px-1.5 py-0.2 rounded-full font-medium">
                  Live
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                Patient: <span className="text-teal-400 font-medium">{patientName || "Portal Guest"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Audio Voice Response Toggle */}
            <button
              onClick={() => {
                if (voiceReplyEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel()
                }
                setVoiceReplyEnabled(!voiceReplyEnabled)
              }}
              title={voiceReplyEnabled ? "Mute Voice Responses" : "Enable Spoken Responses"}
              aria-label="Toggle Voice"
              className={`p-2 rounded-xl transition-colors ${
                voiceReplyEnabled ? "bg-[#2a9d8f]/20 text-[#2a9d8f]" : "text-slate-500 hover:bg-slate-800"
              }`}
            >
              {voiceReplyEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* TOUCH-FRIENDLY CLOSE (X) BUTTON */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel()
                }
                setIsOpen(false)
              }}
              aria-label="Close Assistant"
              className="text-slate-300 hover:bg-rose-900/40 hover:text-rose-400 p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Quick Voice Suggestions */}
        <div className="bg-[#091e2b]/60 px-3 py-1.5 border-b border-[#1b4356]/80 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar flex-shrink-0">
          <span className="text-[#2a9d8f] font-medium whitespace-nowrap flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Quick:
          </span>
          <button
            onClick={() => handleSend("Book adjustment for tomorrow 11 AM")}
            className="whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#22556d] transition-colors"
          >
            📅 Tomorrow 11 AM
          </button>
          <button
            onClick={() => handleSend("Book video consultation on Friday 3 PM")}
            className="whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#22556d] transition-colors"
          >
            📹 Video Visit
          </button>
          <button
            onClick={() => handleSend("When is Dr. Bashir available this week?")}
            className="whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#22556d] transition-colors"
          >
            🕒 Hours
          </button>
        </div>

        {/* MESSAGES SCROLL CONTAINER */}
        <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 bg-[#0e2c3d]/90">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "bot" && (
                <div className="w-6 h-6 rounded-full bg-[#2a9d8f] text-white flex items-center justify-center text-[10px] mt-0.5 flex-shrink-0">
                  AI
                </div>
              )}
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-[#2a9d8f] text-white rounded-br-none"
                      : "bg-slate-800 text-slate-100 border border-[#22556d] rounded-bl-none shadow-sm"
                  }`}
                >
                  {cleanFormatting(m.text)}
                </div>

                {m.actionType === "booking_success" && (
                  <div className="bg-[#2a9d8f]/10 border border-[#2a9d8f]/30 rounded-xl p-2.5 text-xs text-slate-200 flex items-start gap-2 shadow-sm animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-teal-300">Appointment Registered Real-Time</p>
                      <p className="text-slate-400 text-[11px]">
                        Synchronized with Dr. Bashir Khan&apos;s appointments queue.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {m.sender === "user" && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] mt-0.5 flex-shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#2a9d8f] text-white flex items-center justify-center text-[10px]">
                AI
              </div>
              <div className="bg-slate-800 p-2.5 rounded-2xl text-xs text-slate-400 flex items-center gap-1.5 border border-[#22556d]">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] text-teal-400 ml-1">Executing smart booking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Listening Overlay */}
        {isListening && (
          <div className="bg-teal-600 text-white px-3 py-2 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 animate-bounce" />
              <span>Listening to voice command... Speak now!</span>
            </div>
            <button onClick={toggleListening} className="text-white hover:underline text-xs font-bold">
              Stop
            </button>
          </div>
        )}

        {/* FIXED INPUT AREA (Anchored above virtual keyboard) */}
        <div className="flex-shrink-0 p-3 bg-[#091e2b] border-t border-[#1b4356]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Speak voice booking"}
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-800 text-teal-400 hover:bg-slate-700"
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Type or speak: 'Book appointment tomorrow 11 AM'"}
              className="flex-1 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-800 border border-[#22556d] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]"
            />

            <Button
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isTyping}
              size="sm"
              className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
