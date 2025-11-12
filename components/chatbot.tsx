"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, X, Send, Bot, User, Calendar, Volume2, VolumeX } from "lucide-react"
import { useLanguage } from "./language-provider"
import { EnhancedAppointmentBooking } from "./enhanced-appointment-booking"
import Image from "next/image"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "quick-action"
  actions?: Array<{ label: string; action: string }>
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t, language } = useLanguage()
  
  // Voice service integration
  const voiceService = typeof window !== 'undefined' ? require('@/lib/voice-service').voiceService : null
  
  const speakMessage = async (text: string) => {
    if (!isVoiceEnabled || !voiceService) return
    
    try {
      await voiceService.speak(text, 'patient')
    } catch (error) {
      console.error('Voice synthesis error:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting message
      const welcomeMessage: Message = {
        id: "1",
        text:
          language === "ur"
            ? "السلام علیکم! میں ڈاکٹر باہر کا AI اسسٹنٹ ہوں۔ آپ کی کیا مدد کر سکتا ہوں؟"
            : "Welcome! I'm Dr. Bahir's AI assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
        type: "quick-action",
        actions: [
          { label: language === "ur" ? "اپائنٹمنٹ بک کریں" : "Book Appointment", action: "book" },
          { label: language === "ur" ? "ایمرجنسی کال" : "Emergency Call", action: "emergency" },
          { label: language === "ur" ? "کلینک کا پتہ" : "Clinic Location", action: "location" },
          { label: language === "ur" ? "خدمات" : "Services", action: "services" },
        ],
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, language])

  const handleQuickAction = (action: string) => {
    let responseText = ""

    switch (action) {
      case "book":
        responseText =
          language === "ur"
            ? "اپائنٹمنٹ بک کرنے کے لیے براہ کرم اپنا نام اور فون نمبر بھیجیں۔ مثال: احمد علی - 03001234567"
            : "To book an appointment, please send your name and phone number. Example: Ahmad Ali - 03001234567"
        break
      case "emergency":
        responseText =
          language === "ur"
            ? "ایمرجنسی کے لیے فوری طور پر +92 304 6996267 پر کال کریں یا واٹس ایپ پر رابطہ کریں۔"
            : "For emergency, immediately call +92 304 6996267 or contact via WhatsApp."
        break
      case "location":
        responseText =
          language === "ur"
            ? "گونسٹیڈ کائروپریکٹک کلینک\nپولیس سٹیشن کے قریب، تحصیل روڈ، نوشہرہ\nفون: +92 304 6996267"
            : "Gonstead Chiropractic Clinic\nNear Peshawar Model School, Tehsil Road, Nowshera\nPhone: +92 304 6996267"
        break
      case "services":
        responseText =
          language === "ur"
            ? "🔹 گونسٹیڈ ایڈجسٹمنٹ (مشین کی مدد سے)\n🔹 ریڑھ کی ہڈی کی درستگی\n🔹 ایمرجنسی ویڈیو مشاورت\n🔹 درد کا علاج"
            : "🔹 Gonstead Adjustments (Machine-assisted)\n🔹 Spinal Alignment Correction\n🔹 Emergency Video Consultations\n🔹 Pain Management"
        break
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: action,
      sender: "user",
      timestamp: new Date(),
    }

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: "bot",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, botResponse])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = inputValue
    setInputValue("")
    setIsTyping(true)

    try {
      // Check for appointment keywords and open form
      if (messageText.toLowerCase().includes("appointment") || 
          messageText.toLowerCase().includes("book") || 
          messageText.includes("اپائنٹمنٹ")) {
        setShowBookingForm(true)
      }

      // Call real API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          stream: true,
          history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Handle streaming response
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/plain')) {
        // Streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let botResponse = ""
        
        const botMessageId = (Date.now() + 1).toString()
        setIsTyping(false)
        
        // Add initial empty bot message
        setMessages((prev) => [...prev, {
          id: botMessageId,
          text: "",
          sender: "bot",
          timestamp: new Date(),
        }])

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            botResponse += chunk
            
            // Update the bot message in real-time
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === botMessageId 
                  ? { ...msg, text: botResponse }
                  : msg
              )
            )
          }
        }
        
        // Speak the complete response if voice is enabled
        if (isVoiceEnabled && botResponse) {
          setTimeout(() => speakMessage(botResponse), 500)
        }
      } else {
        // Non-streaming response (fallback)
        const data = await response.json()
        const botResponse = data.text || 'No response received'
        
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: "bot",
          timestamp: new Date(),
        }])
        setIsTyping(false)
        
        if (isVoiceEnabled) {
          setTimeout(() => speakMessage(botResponse), 500)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response'
      
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: language === "ur" 
          ? `خرابی: ${errorMessage}. براہ کرم دوبارہ کوشش کریں۔`
          : `Error: ${errorMessage}. Please try again.`,
        sender: "bot",
        timestamp: new Date(),
      }])
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Appointment Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
            <Button
              onClick={() => setShowBookingForm(false)}
              className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white p-2 h-8 w-8"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="p-4">
              <EnhancedAppointmentBooking />
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-7 w-7 bg-[#2a9d8f] hover:bg-[#238a7a] shadow-lg flex items-center justify-center p-1"
        size="icon"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Image
            src="/images/gonstead-logo.png"
            alt="Chat"
            width={16}
            height={16}
            className="object-contain"
          />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-40 w-80 h-96 shadow-xl border-2 border-[#2a9d8f] overflow-hidden relative" style={{backgroundColor: 'rgb(173,192,190)', backgroundImage: 'url(/images/medical-background-professional.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'multiply'}}>
          {/* Background Images */}
          <div className="absolute inset-0 opacity-5 overflow-hidden rounded-lg">
            <Image src="/images/muscle-anatomy.jpeg" alt="Anatomy Background" fill className="object-cover" />
          </div>

          <CardHeader className="relative bg-[#2a9d8f] text-white p-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Image
                src="/images/gonstead-logo.png"
                alt="Gonstead Logo"
                width={24}
                height={24}
                className="bg-white rounded-full p-1"
              />
              Dr. Bahir's AI Assistant
            </CardTitle>
          </CardHeader>

          <CardContent className="relative p-0 flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-xs ${
                      message.sender === "user" ? "bg-[#2a9d8f]/90 text-white" : "text-gray-800 font-medium"
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      {message.sender === "bot" && <Bot className="h-3 w-3 mt-0.5 text-[#2a9d8f]" />}
                      {message.sender === "user" && <User className="h-3 w-3 mt-0.5" />}
                      <span className="whitespace-pre-line">{message.text}</span>
                    </div>

                    {message.actions && (
                      <div className="mt-2 space-y-1">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-6 border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
                            onClick={() => handleQuickAction(action.action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-2 rounded-lg text-xs">
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3 text-[#2a9d8f]" />
                      <span>Typing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-2 bg-white">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`px-2 ${isVoiceEnabled ? 'bg-green-100 text-green-600' : ''}`}
                  title={isVoiceEnabled ? 'Voice enabled' : 'Voice disabled'}
                >
                  {isVoiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBookingForm(true)}
                  className="px-2"
                  title="Book Appointment"
                >
                  <Calendar className="h-3 w-3" />
                </Button>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === "ur" ? "پیغام لکھیں..." : "Type a message..."}
                  className="text-xs"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="sm" onClick={handleSendMessage} className="bg-[#2a9d8f] hover:bg-[#238a7a]">
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
