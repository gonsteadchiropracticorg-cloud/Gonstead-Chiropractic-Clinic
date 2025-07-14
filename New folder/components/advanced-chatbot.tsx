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
import type SpeechRecognition from "speech-recognition"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "voice" | "appointment" | "location"
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
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = "en-US"

        recognitionInstance.onresult = (event) => {
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

  const speakMessage = (text: string) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = voiceCall.isSpeakerOn ? 1 : 0.7
      synthesis.speak(utterance)
    }
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

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (message.includes("appointment") || message.includes("book") || message.includes("schedule")) {
      return "I'd be happy to help you schedule an appointment with Dr. Bashir Khan. Our clinic is open Monday-Saturday, 9 AM to 6 PM. Would you prefer an in-clinic Gonstead adjustment or a video consultation? You can also call us directly at +92 304 699 6267."
    }

    if (message.includes("gonstead") || message.includes("technique")) {
      return "The Gonstead technique is a comprehensive system of analyzing and adjusting the spine. Dr. Bashir Khan specializes in this precise method which focuses on specific spinal analysis and targeted adjustments for optimal results."
    }

    if (message.includes("location") || message.includes("address") || message.includes("where")) {
      return "Our clinic is located near Police Station, Tehsil Road, Nowshera. We're easily accessible and have parking available. Would you like me to share our Google Maps location?"
    }

    if (message.includes("price") || message.includes("cost") || message.includes("fee")) {
      return "Our consultation fees are very reasonable. Initial consultation is PKR 2000, and follow-up sessions are PKR 1500. We accept cash, JazzCash, and EasyPaisa payments. Insurance coverage may apply."
    }

    if (message.includes("doctor") || message.includes("bashir")) {
      return "Dr. Bashir Khan is a certified Gonstead Chiropractic specialist with years of experience in spinal health and adjustment techniques. He's dedicated to providing personalized care for each patient's unique needs."
    }

    if (message.includes("call") || message.includes("phone") || message.includes("talk")) {
      return "Would you like me to connect you with Dr. Bashir Khan for a voice consultation? I can arrange a call right now if he's available."
    }

    if (message.includes("emergency") || message.includes("urgent") || message.includes("pain")) {
      return "For urgent cases or severe pain, please call our emergency line at +92 304 699 6267 immediately. Dr. Bashir Khan provides emergency consultations. Would you like me to try connecting you now?"
    }

    return "I understand you're looking for information about our chiropractic services. Dr. Bashir Khan and our team are here to help with your spinal health needs. Would you like to book an appointment, learn about our treatments, or speak directly with the doctor?"
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
    setInputMessage("")
    setIsTyping(true)

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage)
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
        speakMessage(botResponse)
      }

      // Check if user wants a call
      if (inputMessage.toLowerCase().includes("call") || inputMessage.toLowerCase().includes("talk")) {
        setTimeout(() => {
          simulateIncomingCall()
        }, 2000)
      }
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`h-16 w-16 rounded-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] shadow-lg hover:shadow-xl transition-all duration-300 transform ${
            isHovered ? "scale-110" : "scale-100"
          } border-4 border-white dark:border-gray-800`}
        >
          <div className="relative w-10 h-10">
            <Image
              src="/images/gonstead-logo-new.png"
              alt="Gonstead Chiropractic Assistant"
              fill
              className="object-contain p-1"
            />
          </div>
        </Button>

        {/* Tooltip on hover */}
        {isHovered && (
          <div className="absolute bottom-20 right-0 bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
            Chat with Dr. Bashir's Assistant
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={`w-96 shadow-2xl border-[#0d5c75]/20 transition-all duration-300 ${isMinimized ? "h-16" : "h-[600px]"}`}
      >
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image src="/images/gonstead-logo-new.png" alt="Gonstead Logo" fill className="object-contain" />
              </div>
              <div>
                <CardTitle className="text-lg font-poppins">Gonstead Assistant</CardTitle>
                <p className="text-xs opacity-90">Dr. Bashir Khan's Clinic</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice Call Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={simulateIncomingCall}
                className="text-white hover:bg-white/20 p-1"
                title="Request Voice Call"
              >
                <PhoneCall className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Voice Call Status */}
          {voiceCall.isActive && (
            <div className="mt-2 flex items-center justify-between bg-white/20 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Call Active - {formatCallDuration(voiceCall.duration)}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className={`text-white hover:bg-white/20 p-1 ${voiceCall.isMuted ? "bg-red-500/50" : ""}`}
                >
                  {voiceCall.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleSpeaker}
                  className={`text-white hover:bg-white/20 p-1 ${voiceCall.isSpeakerOn ? "bg-blue-500/50" : ""}`}
                >
                  {voiceCall.isSpeakerOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={endCall} className="text-white hover:bg-red-500/50 p-1">
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

            {/* Messages */}
            <CardContent className="p-0 h-[400px] overflow-y-auto">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "bot" && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/images/gonstead-logo-new.png" />
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === "user" ? "bg-[#0d5c75] text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {message.type === "voice" && (
                          <Badge variant="secondary" className="text-xs">
                            Voice
                          </Badge>
                        )}
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/images/gonstead-logo-new.png" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or use voice..."
                    className="pr-10"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                    className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 ${
                      isListening ? "text-red-500 animate-pulse" : "text-gray-400"
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  className="bg-[#0d5c75] hover:bg-[#0a4a5c]"
                  disabled={!inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputMessage("I want to book an appointment")}
                  className="text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Book Appointment
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputMessage("Where is your clinic located?")}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Location
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputMessage("What are your clinic hours?")}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Hours
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
