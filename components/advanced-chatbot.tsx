"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Send,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Calendar,
  MapPin,
  Clock,
  PhoneCall,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { voiceService } from "../lib/voice-service"
import { googleAIService } from "../lib/google-ai-service"
// Speech recognition types will be handled inline

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "voice" | "appointment" | "location" | "booking"
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

interface VoiceCallState {
  isActive: boolean
  isIncoming: boolean
  duration: number
  isMuted: boolean
  isSpeakerOn: boolean
}

export function AdvancedChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
const [isHovered, setIsHovered] = useState(false)
  const chatbotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatbotRef.current &&
        !chatbotRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [chatbotRef])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Gonstead Chiropractic assistant. I can help you book appointments, answer questions about treatments, or connect you with Dr. Bashir Khan. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [voiceCall, setVoiceCall] = useState<VoiceCallState>({
    isActive: false,
    isIncoming: false,
    duration: 0,
    isMuted: false,
    isSpeakerOn: false,
  })
  const [isListening, setIsListening] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [recognition, setRecognition] = useState<any | null>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [voiceSettings, setVoiceSettings] = useState({
    autoSpeak: false,
    voiceSpeed: 1,
    voiceVolume: 0.8
  })
  const [appointmentBooking, setAppointmentBooking] = useState<AppointmentData | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputMessage(transcript)
          setIsListening(false)
        }

        recognitionInstance.onerror = () => {
          setIsListening(false)
          toast({
            title: "Voice Recognition Error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive",
          })
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      }

      // Speech Synthesis
      if (window.speechSynthesis) {
        setSynthesis(window.speechSynthesis)
      }
    }
  }, [toast])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Call timer
  useEffect(() => {
    if (voiceCall.isActive) {
      callTimerRef.current = setInterval(() => {
        setVoiceCall((prev) => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [voiceCall.isActive])

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

const speakMessage = async (text: string) => {
  try {
    // Stop any currently playing audio first
    voiceService.stopCurrentAudio()
    
    // Clean text for speech
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/•/g, '')
      .replace(/📋|👤|📞|🏥|📅|📝|✅|📄|💼|🎉/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (cleanText && cleanText.length > 0) {
      const success = await voiceService.speak(cleanText, 'doctor')
      if (!success) {
        // Fallback to browser TTS
        await speakWithBrowserTTS(cleanText)
      }
    }
  } catch (error) {
    console.error('Error speaking message:', error)
    // Try browser TTS as fallback
    try {
      await speakWithBrowserTTS(text)
    } catch (fallbackError) {
      console.error('Fallback TTS also failed:', fallbackError)
    }
  }
}

// Browser TTS fallback for chatbot
const speakWithBrowserTTS = (text: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.log('Browser TTS not available')
        resolve(false)
        return
      }

      // Cancel any existing speech
      window.speechSynthesis.cancel()
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 0.8
        utterance.lang = 'en-US'
        
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          const englishVoices = voices.filter(voice => voice.lang.startsWith('en'))
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0]
          } else {
            utterance.voice = voices[0]
          }
        }
        
        utterance.onend = () => resolve(true)
        utterance.onerror = () => resolve(false)
        
        try {
          window.speechSynthesis.speak(utterance)
          resolve(true)
        } catch (error) {
          resolve(false)
        }
      }, 100)
    } catch (error) {
      resolve(false)
    }
  })
}

  const startVoiceRecognition = () => {
    if (recognition && !isListening) {
      setIsListening(true)
      recognition.start()
    }
  }

  const stopVoiceRecognition = () => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const simulateIncomingCall = () => {
    setVoiceCall({
      isActive: false,
      isIncoming: true,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
    })

    toast({
      title: "Incoming Call",
      description: "Dr. Bashir Khan is calling you",
    })
  }

  const acceptCall = () => {
    setVoiceCall((prev) => ({
      ...prev,
      isActive: true,
      isIncoming: false,
      duration: 0,
    }))

    const callMessage: Message = {
      id: Date.now().toString(),
      text: "Voice call connected with Dr. Bashir Khan",
      sender: "bot",
      timestamp: new Date(),
      type: "voice",
    }
    setMessages((prev) => [...prev, callMessage])

    toast({
      title: "Call Connected",
      description: "You are now connected with Dr. Bashir Khan",
    })
  }

  const declineCall = () => {
    setVoiceCall({
      isActive: false,
      isIncoming: false,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
    })

    toast({
      title: "Call Declined",
      description: "Call has been declined",
    })
  }

  const endCall = () => {
    setVoiceCall({
      isActive: false,
      isIncoming: false,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
    })

    const endCallMessage: Message = {
      id: Date.now().toString(),
      text: `Call ended. Duration: ${formatCallDuration(voiceCall.duration)}`,
      sender: "bot",
      timestamp: new Date(),
      type: "voice",
    }
    setMessages((prev) => [...prev, endCallMessage])

    toast({
      title: "Call Ended",
      description: `Call duration: ${formatCallDuration(voiceCall.duration)}`,
    })
  }

  const toggleMute = () => {
    setVoiceCall((prev) => ({ ...prev, isMuted: !prev.isMuted }))
    toast({
      title: voiceCall.isMuted ? "Unmuted" : "Muted",
      description: voiceCall.isMuted ? "Microphone is now on" : "Microphone is now off",
    })
  }

  const toggleSpeaker = () => {
    setVoiceCall((prev) => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }))
    toast({
      title: voiceCall.isSpeakerOn ? "Speaker Off" : "Speaker On",
      description: voiceCall.isSpeakerOn ? "Audio through earpiece" : "Audio through speaker",
    })
  }

  const processAppointmentBooking = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    if (!appointmentBooking) {
      // Start booking process
      setAppointmentBooking({ step: 1 })
      return "Great! I'll help you book an appointment with Dr. Bashir Khan. Let's start with your full name. What's your name?"
    }

    switch (appointmentBooking.step) {
      case 1: // Getting name
        setAppointmentBooking(prev => ({ ...prev!, name: userMessage, step: 2 }))
        return `Thank you, ${userMessage}! Now I need your phone number for appointment confirmation. Please provide your mobile number.`

      case 2: // Getting phone
        const phoneRegex = /^(\+92|0)?3[0-9]{9}$/
        if (!phoneRegex.test(userMessage.replace(/\s/g, ''))) {
          return "Please provide a valid Pakistani mobile number (e.g., 03001234567 or +923001234567)."
        }
        setAppointmentBooking(prev => ({ ...prev!, phone: userMessage, step: 3 }))
        return "Perfect! Would you prefer an in-clinic Gonstead adjustment or a video consultation? Please type 'clinic' or 'video'."

      case 3: // Getting session type
        if (message.includes('clinic') || message.includes('office') || message.includes('visit')) {
          setAppointmentBooking(prev => ({ ...prev!, sessionType: 'in_clinic', step: 4 }))
          return "Excellent choice! In-clinic Gonstead adjustments provide the most comprehensive treatment. When would you like to schedule your appointment? Please provide your preferred date and time (e.g., 'Tomorrow 2 PM' or 'Monday 10 AM')."
        } else if (message.includes('video') || message.includes('online') || message.includes('virtual')) {
          setAppointmentBooking(prev => ({ ...prev!, sessionType: 'video', step: 4 }))
          return "Good choice for quick consultation! Video consultations are great for follow-ups and initial assessments. When would you like to schedule your video consultation? Please provide your preferred date and time."
        } else {
          return "Please choose either 'clinic' for in-person visit or 'video' for online consultation."
        }

      case 4: // Getting preferred time
        setAppointmentBooking(prev => ({ ...prev!, preferredTime: userMessage, step: 5 }))
        return "Great! Do you have any specific concerns or notes about your condition that you'd like Dr. Bashir Khan to know beforehand? (You can type 'none' if no specific notes)"

      case 5: // Getting notes and confirmation
        const notes = message === 'none' ? '' : userMessage
        setAppointmentBooking(prev => ({ ...prev!, notes, step: 6 }))
        
        const appointmentSummary = `
📋 APPOINTMENT SUMMARY:
👤 Name: ${appointmentBooking.name}
📞 Phone: ${appointmentBooking.phone}
🏥 Type: ${appointmentBooking.sessionType === 'in_clinic' ? 'In-Clinic Gonstead Adjustment' : 'Video Consultation'}
📅 Preferred Time: ${appointmentBooking.preferredTime}
📝 Notes: ${notes || 'None'}

Shall I confirm and book this appointment for you? Please type 'yes' to confirm or 'no' to cancel.`
        
        return appointmentSummary

      case 6: // Final confirmation
        if (message.includes('yes') || message.includes('confirm') || message.includes('book')) {
          // Reset booking state
          const bookingData = { ...appointmentBooking }
          setAppointmentBooking(null)
          
          // Here you would typically send the data to your backend
          console.log('Appointment booked:', bookingData)
          
          return `🎉 APPOINTMENT CONFIRMED! 

Dear ${bookingData.name}, your appointment has been successfully booked!

📅 Appointment Details:
• Type: ${bookingData.sessionType === 'in_clinic' ? 'In-Clinic Treatment' : 'Video Consultation'}
• Time: ${bookingData.preferredTime}
• Phone: ${bookingData.phone}

✅ What's Next:
• You'll receive a WhatsApp confirmation shortly
• Our team will contact you to confirm the exact time
• For clinic visits: Near Police Station, Tehsil Road, Nowshera

📞 Contact: +92 304 699 6267

Thank you for choosing Gonstead Chiropractic Clinic!`
        } else {
          setAppointmentBooking(null)
          return "Appointment booking cancelled. No worries! Feel free to start over anytime or contact us directly at +92 304 699 6267."
        }

      default:
        setAppointmentBooking(null)
        return "Let's start fresh. How can I help you today?"
    }
  }

  const getBotResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase()

    // Handle appointment booking flow first
    if (appointmentBooking || message.includes("appointment") || message.includes("book") || message.includes("schedule")) {
      return processAppointmentBooking(userMessage)
    }

    // Use Google AI for intelligent responses
    try {
      const aiResponse = await googleAIService.generateMedicalResponse(userMessage, 'doctor')
      
      if (aiResponse.success && aiResponse.response) {
        return aiResponse.response
      } else {
        console.warn('Google AI failed, using fallback response:', aiResponse.error)
        return getFallbackResponse(message)
      }
    } catch (error) {
      console.error('Error calling Google AI:', error)
      return getFallbackResponse(message)
    }
  }

  const getFallbackResponse = (message: string): string => {
    if (message.includes("gonstead") || message.includes("technique")) {
      return "The Gonstead technique is a comprehensive system of analyzing and adjusting the spine. Dr. Bashir Khan specializes in this precise method which focuses on specific spinal analysis and targeted adjustments for optimal results. Would you like to book an appointment?"
    }

    if (message.includes("location") || message.includes("address") || message.includes("where")) {
      return "Our clinic is located near Peshawar Model School, Tehsil Road, Nowshera. We're easily accessible and have parking available. Our clinic hours are Monday-Saturday, 9 AM to 6 PM. Would you like to book an appointment?"
    }

    if (message.includes("price") || message.includes("cost") || message.includes("fee")) {
      return "Our consultation fees are very reasonable. Initial consultation is PKR 2000, and follow-up sessions are PKR 1500. We accept cash, JazzCash, and EasyPaisa payments. Insurance coverage may apply. Would you like to book an appointment?"
    }

    if (message.includes("doctor") || message.includes("bashir")) {
      return "Dr. Bashir Khan is a certified Gonstead Chiropractic specialist with 15+ years of experience in spinal health and adjustment techniques. He's dedicated to providing personalized care for each patient's unique needs. Would you like to book a consultation with him?"
    }

    if (message.includes("call") || message.includes("phone") || message.includes("talk")) {
      return "Would you like me to connect you with Dr. Bashir Khan for a voice consultation? I can arrange a call right now if he's available, or you can book an appointment for a more detailed consultation."
    }

    if (message.includes("emergency") || message.includes("urgent") || message.includes("pain")) {
      return "For urgent cases or severe pain, please call our emergency line at +92 304 699 6267 immediately. Dr. Bashir Khan provides emergency consultations. Would you like me to help you book an urgent appointment?"
    }

    if (message.includes("hours") || message.includes("time") || message.includes("open") || message.includes("timing") || message.includes("schedule")) {
      return `📅 CLINIC HOURS & SCHEDULE:\n\n🕘 REGULAR HOURS:\n• Monday - Friday: 9:00 AM - 6:00 PM\n• Saturday: 9:00 AM - 3:00 PM\n• Sunday: Emergency appointments only\n\n⏰ BEST APPOINTMENT TIMES:\n• Morning: 9:00 AM - 12:00 PM (Less crowded)\n• Afternoon: 2:00 PM - 5:00 PM (Popular times)\n• Evening: 5:00 PM - 6:00 PM (Last appointments)\n\n🏥 APPOINTMENT AVAILABILITY:\n• Same-day appointments: Available (subject to availability)\n• Advance booking: Recommended (1-3 days ahead)\n• Emergency care: Available 24/7\n\n📞 To book your preferred time slot, call +92 304 699 6267 or use our online booking system. Which day and time would work best for you?`
    }

    if (message.includes("available") || message.includes("slot") || message.includes("booking")) {
      return `📋 APPOINTMENT AVAILABILITY:\n\n✅ SAME DAY SLOTS:\n• 9:00 AM - 10:00 AM\n• 11:00 AM - 12:00 PM\n• 2:00 PM - 3:00 PM\n• 4:00 PM - 5:00 PM\n\n📅 WEEKLY SCHEDULE:\n• Monday-Friday: Full availability\n• Saturday: Morning slots only\n• Sunday: Emergency only\n\n🕐 POPULAR TIME SLOTS:\n• 10:00 AM (Most requested)\n• 2:00 PM (Afternoon preferred)\n• 4:00 PM (Evening convenient)\n\nWhich specific day and time would you prefer for your appointment?`
    }

    return "I understand you're looking for information about our chiropractic services. Our Gonstead Chiropractic Clinic team is here to help with your spinal health needs. Would you like to book an appointment, learn about our treatments, or speak directly with our specialists?"
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage("")
    setIsTyping(true)

    try {
      // Get AI-powered response
      const botResponse = await getBotResponse(currentMessage)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)

      // Speak the response if voice is enabled
      if (voiceCall.isActive || voiceCall.isSpeakerOn) {
        await speakMessage(botResponse)
      }

      // Check if user wants a call
      if (currentMessage.toLowerCase().includes("call") || currentMessage.toLowerCase().includes("talk")) {
        setTimeout(() => {
          simulateIncomingCall()
        }, 2000)
      }
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again or contact us directly at +92 304 699 6267.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`h-14 w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 rounded-full bg-gradient-to-br from-[rgb(66,139,124)] via-[rgb(72,145,130)] to-[rgb(58,133,118)] hover:from-[rgb(72,145,130)] hover:via-[rgb(78,151,136)] hover:to-[rgb(64,139,124)] shadow-lg hover:shadow-2xl transition-all duration-300 transform ${
            isHovered ? "scale-110" : "scale-100"
          } border-4 border-white/30 ring-4 ring-white/20 backdrop-blur-sm`}
        >
          <div className="relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
            <Image
              src="/images/gonstead-logo-new.png"
              alt="Bashir Khan Chiropractic Assistant"
              fill
              className="object-contain p-0.5 md:p-1 filter drop-shadow-sm"
            />
          </div>
          {/* Pulse animation for active state */}
          <div className="absolute inset-0 rounded-full bg-[rgb(66,139,124)]/30 animate-ping"></div>
        </Button>

        {/* Enhanced Tooltip */}
        {isHovered && (
          <div className="absolute bottom-16 md:bottom-20 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs md:text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Chat with Gonstead Chiropractic Assistant
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    )
  }

  return (
<div ref={chatbotRef} className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <Card
        className={`w-[calc(100vw-2rem)] sm:w-[400px] md:w-[450px] lg:w-[500px] xl:w-[520px] max-w-[95vw] shadow-2xl border-[rgb(66,139,124)]/20 transition-all duration-300 backdrop-blur-md bg-white/95 dark:bg-gray-900/95 ${isMinimized ? "h-16" : "h-[85vh] max-h-[600px] min-h-[500px]"} rounded-2xl overflow-hidden`}
      >
        {/* Enhanced Header */}
        <CardHeader className="bg-gradient-to-br from-[rgb(66,139,124)] via-[rgb(72,145,130)] to-[rgb(58,133,118)] text-white p-3 md:p-4 rounded-t-2xl relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 relative flex-shrink-0">
                <Image src="/images/gonstead-logo-new.png" alt="Gonstead Logo" fill className="object-contain filter drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-lg font-poppins font-semibold truncate">Dr. Bashir Khan Assistant</CardTitle>
                <p className="text-xs opacity-90 truncate">Gonstead Chiropractic Clinic</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs opacity-75">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              {/* Voice Call Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={simulateIncomingCall}
                className="text-white hover:bg-white/20 p-1.5 md:p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                title="Request Voice Call"
              >
                <PhoneCall className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1.5 md:p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Minimize2 className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 hover:bg-red-500/20 p-1.5 md:p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Voice Call Status */}
          {voiceCall.isActive && (
            <div className="mt-2 flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs md:text-sm font-medium">Call Active - {formatCallDuration(voiceCall.duration)}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className={`text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200 ${voiceCall.isMuted ? "bg-red-500/50" : ""}`}
                >
                  {voiceCall.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleSpeaker}
                  className={`text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200 ${voiceCall.isSpeakerOn ? "bg-blue-500/50" : ""}`}
                >
                  {voiceCall.isSpeakerOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={endCall} className="text-white hover:bg-red-500/50 p-1.5 rounded-lg transition-all duration-200">
                  <PhoneOff className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Incoming Call Overlay */}
            {voiceCall.isIncoming && (
              <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center rounded-lg">
                <div className="text-center text-white p-6">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <Image
                      src="/images/dr-bashir-photo.jpeg"
                      alt="Dr. Bashir Khan"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Dr. Bashir Khan</h3>
                  <p className="text-sm opacity-75 mb-6">Incoming Voice Call</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={acceptCall} className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14">
                      <Phone className="h-6 w-6" />
                    </Button>
                    <Button onClick={declineCall} className="bg-red-600 hover:bg-red-700 rounded-full w-14 h-14">
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Messages Area */}
            <CardContent className="p-0 h-[320px] md:h-[350px] lg:h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 md:gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {message.sender === "bot" && (
                      <Avatar className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 ring-2 ring-[rgb(66,139,124)]/20">
                        <AvatarImage src="/images/gonstead-logo-new.png" className="object-contain p-1" />
                        <AvatarFallback className="bg-[rgb(66,139,124)]/10">
                          <Bot className="h-3 w-3 md:h-4 md:w-4 text-[rgb(66,139,124)]" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[75%] md:max-w-[80%] p-2.5 md:p-3 rounded-2xl shadow-sm transition-all duration-200 ${
                        message.sender === "user" 
                          ? "bg-gradient-to-br from-[rgb(66,139,124)] to-[rgb(58,133,118)] text-white rounded-br-md" 
                          : "bg-[rgb(189,204,202)] dark:bg-[rgb(189,204,202)] text-gray-800 dark:text-gray-800 border border-gray-100 dark:border-gray-300 rounded-bl-md"
                      }`}
                    >
                      <p className="text-xs md:text-sm leading-relaxed">{message.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs ${
                          message.sender === "user" ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {message.type === "voice" && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            <Volume2 className="h-2.5 w-2.5 mr-1" />
                            Voice
                          </Badge>
                        )}
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 ring-2 ring-blue-500/20">
                        <AvatarFallback className="bg-blue-500/10">
                          <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 md:gap-3 justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <Avatar className="w-7 h-7 md:w-8 md:h-8 ring-2 ring-[rgb(66,139,124)]/20">
                      <AvatarImage src="/images/gonstead-logo-new.png" className="object-contain p-1" />
                      <AvatarFallback className="bg-[rgb(66,139,124)]/10">
                        <Bot className="h-3 w-3 md:h-4 md:w-4 text-[rgb(66,139,124)]" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-gray-800 p-2.5 md:p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[rgb(66,139,124)] rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-[rgb(66,139,124)] rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[rgb(66,139,124)] rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Enhanced Input Area */}
            <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or use voice..."
                    className="pr-12 pl-4 py-2.5 md:py-3 rounded-xl border-gray-200 dark:border-gray-700 focus:border-[rgb(66,139,124)] focus:ring-[rgb(66,139,124)]/20 bg-white dark:bg-gray-800 text-sm transition-all duration-200"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 ${
                      isListening ? "text-red-500 animate-pulse bg-red-50 dark:bg-red-900/20" : "text-gray-400 hover:text-[rgb(66,139,124)] hover:bg-[rgb(66,139,124)]/10"
                    }`}
                    title={isListening ? "Stop listening" : "Use voice input"}
                  >
                    <Mic className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-[rgb(66,139,124)] to-[rgb(58,133,118)] hover:from-[rgb(72,145,130)] hover:to-[rgb(64,139,124)] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!inputMessage.trim()}
                  title="Send message"
                >
                  <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputMessage("I want to book an appointment")}
                  className="text-xs flex-1 md:flex-none border-[rgb(66,139,124)]/20 text-[rgb(66,139,124)] hover:bg-[rgb(66,139,124)]/10 hover:border-[rgb(66,139,124)]/40 rounded-lg transition-all duration-200 min-w-0"
                >
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Book</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputMessage("Where is your clinic located?")}
                  className="text-xs flex-1 md:flex-none border-[rgb(66,139,124)]/20 text-[rgb(66,139,124)] hover:bg-[rgb(66,139,124)]/10 hover:border-[rgb(66,139,124)]/40 rounded-lg transition-all duration-200 min-w-0"
                >
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Location</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputMessage("What are your clinic hours?")}
                  className="text-xs flex-1 md:flex-none border-[rgb(66,139,124)]/20 text-[rgb(66,139,124)] hover:bg-[rgb(66,139,124)]/10 hover:border-[rgb(66,139,124)]/40 rounded-lg transition-all duration-200 min-w-0"
                >
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Hours</span>
                </Button>
              </div>
            </div>
        </>
        )}
      </Card>
    </div>
  )
}
