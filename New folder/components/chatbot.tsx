"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import { useLanguage } from "./language-provider"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t, language } = useLanguage()

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
            : "Gonstead Chiropractic Clinic\nNear Police Station, Tehsil Road, Nowshera\nPhone: +92 304 6996267"
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
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let botResponse = ""
      const input = inputValue.toLowerCase()

      if (input.includes("appointment") || input.includes("book") || input.includes("اپائنٹمنٹ")) {
        botResponse =
          language === "ur"
            ? "آپ کی اپائنٹمنٹ کے لیے درخواست موصول ہوئی۔ ڈاکٹر باہر جلد ہی آپ سے رابطہ کریں گے۔"
            : "Your appointment request has been received. Dr. Bahir will contact you shortly."
      } else if (input.includes("pain") || input.includes("درد")) {
        botResponse =
          language === "ur"
            ? "درد کے لیے فوری مدد چاہیے؟ گونسٹیڈ تکنیک سے ہم مؤثر علاج فراہم کرتے ہیں۔"
            : "Need immediate help with pain? We provide effective treatment using Gonstead technique."
      } else {
        botResponse =
          language === "ur"
            ? "شکریہ آپ کے پیغام کا۔ مزید معلومات کے لیے +92 304 6996267 پر رابطہ کریں۔"
            : "Thank you for your message. For more information, contact +92 304 6996267."
      }

      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, response])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-[#2a9d8f] hover:bg-[#238a7a] shadow-lg"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-40 w-80 h-96 shadow-xl border-2 border-[#2a9d8f]">
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
                      message.sender === "user" ? "bg-[#2a9d8f] text-white" : "bg-white border shadow-sm"
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
              <div className="flex gap-2">
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
