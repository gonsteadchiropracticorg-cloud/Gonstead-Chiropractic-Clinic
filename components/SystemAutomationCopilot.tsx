"use client"

import React, { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  Sparkles,
  Command,
  Send,
  X,
  Volume2,
  VolumeX,
  Bot,
  Zap,
  CheckCircle2,
  Cpu,
  ChevronRight,
  ArrowRight,
  Compass,
  Play,
  RotateCcw,
  Activity,
  Layers,
  Terminal,
} from "lucide-react"

interface AutomationStep {
  type: "navigate" | "scroll" | "click" | "back" | "delay" | "type"
  target?: string
  selector?: string
  value?: string
  ms?: number
}

interface PipelineExecution {
  explanation: string
  steps: AutomationStep[]
}

export function SystemAutomationCopilot() {
  const pathname = usePathname()
  const isPatientPortal = pathname?.startsWith("/patient-portal")
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>("Ready for instructions")
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [activeSteps, setActiveSteps] = useState<AutomationStep[]>([])
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [executionLogs, setExecutionLogs] = useState<string[]>([])

  const recognitionRef = useRef<any>(null)
  const isExecutingRef = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = "en-US"

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setIsListening(false)
          if (transcript && transcript.trim()) {
            setInputText(transcript)
            executeInstruction(transcript)
          }
        }

        rec.onerror = () => setIsListening(false)
        rec.onend = () => setIsListening(false)
        recognitionRef.current = rec
      }
    }
  }, [])

  // Auto-close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Check for queued automation after page transitions
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const queuedStr = sessionStorage.getItem("gonstead_automation_pipeline")
      if (queuedStr) {
        const queued = JSON.parse(queuedStr)
        if (queued && queued.steps && queued.steps.length > 0) {
          sessionStorage.removeItem("gonstead_automation_pipeline")
          setIsOpen(true)
          setStatusMessage(queued.explanation || "Resuming automation pipeline...")
          runPipeline(queued.steps, queued.currentIndex || 0, queued.explanation)
        }
      }
    } catch (e) {
      console.error("Queue resume error", e)
    }
  }, [])

  // Text-to-Speech
  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ""))
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    } catch (e) {}
  }

  // Voice toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Google Chrome or Edge.")
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      setInputText("")
      setStatusMessage("Listening to your voice command...")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Element Finder
  const findTargetElement = (targetStr: string): HTMLElement | null => {
    if (!targetStr) return null
    try {
      const direct = document.querySelector(targetStr) as HTMLElement
      if (direct) return direct
    } catch (e) {}

    const clean = targetStr.toLowerCase().replace(/['"#.\[\]]/g, "").trim()

    // 1. Check input fields by id, name, placeholder, type, or label
    const inputs = Array.from(document.querySelectorAll("input, textarea, select")) as (HTMLInputElement | HTMLTextAreaElement)[]
    for (const input of inputs) {
      const id = (input.id || "").toLowerCase()
      const name = (input.name || "").toLowerCase()
      const placeholder = (input.placeholder || "").toLowerCase()
      const type = (input.type || "").toLowerCase()

      if (
        id.includes(clean) ||
        name.includes(clean) ||
        placeholder.includes(clean) ||
        (clean.includes("email") && (type === "email" || id.includes("email") || placeholder.includes("email"))) ||
        (clean.includes("password") && (type === "password" || id.includes("pass") || placeholder.includes("pass"))) ||
        (clean.includes("phone") && (type === "tel" || id.includes("phone") || placeholder.includes("phone"))) ||
        (clean.includes("name") && (id.includes("name") || placeholder.includes("name")))
      ) {
        return input
      }
    }

    // 2. Search by text / role / aria-label for clickable or actionable elements
    const interactables = Array.from(
      document.querySelectorAll("button, a, summary, [role='button'], h2, h3, h4, input, [type='submit']")
    ) as HTMLElement[]

    for (const el of interactables) {
      const text = (el.innerText || el.textContent || "").toLowerCase()
      const aria = (el.getAttribute("aria-label") || "").toLowerCase()
      if (text.includes(clean) || aria.includes(clean)) {
        return el
      }
    }
    return null
  }

  // Step runner
  const runPipeline = async (steps: AutomationStep[], startIndex: number = 0, explanation: string = "") => {
    if (isExecutingRef.current) return
    isExecutingRef.current = true
    setActiveSteps(steps)

    for (let i = startIndex; i < steps.length; i++) {
      setCurrentStepIndex(i)
      const step = steps[i]
      const log = `Step ${i + 1}/${steps.length}: [${step.type.toUpperCase()}] ${step.target || step.selector || ""}`
      setStatusMessage(log)
      setExecutionLogs(prev => [...prev.slice(-6), log])

      if (step.type === "navigate" && step.target) {
        if (step.target.startsWith("#")) {
          const el = document.querySelector(step.target)
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
          await new Promise((r) => setTimeout(r, 1200))
        } else {
          const remaining = steps.slice(i + 1)
          if (remaining.length > 0) {
            sessionStorage.setItem(
              "gonstead_automation_pipeline",
              JSON.stringify({ steps: remaining, currentIndex: 0, explanation })
            )
          }
          await new Promise((r) => setTimeout(r, 600))
          window.location.href = step.target
          return
        }
      } else if (step.type === "scroll") {
        const t = (step.target || "down").toLowerCase()
        if (t === "bottom" || t === "down") {
          window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" })
        } else if (t === "top" || t === "up") {
          window.scrollBy({ top: -window.innerHeight * 0.85, behavior: "smooth" })
        } else {
          const el = findTargetElement(step.target || "")
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" })
          } else {
            window.scrollBy({ top: 400, behavior: "smooth" })
          }
        }
        await new Promise((r) => setTimeout(r, 1200))
      } else if (step.type === "type") {
        const target = step.selector || step.target || "input"
        const val = step.value || ""
        const el = findTargetElement(target) as HTMLInputElement | null
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          el.focus()
          await new Promise((r) => setTimeout(r, 200))

          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, val)
          } else {
            el.value = val
          }
          el.dispatchEvent(new Event("input", { bubbles: true }))
          el.dispatchEvent(new Event("change", { bubbles: true }))
          await new Promise((r) => setTimeout(r, 600))
        } else {
          await new Promise((r) => setTimeout(r, 600))
        }
      } else if (step.type === "click") {
        const target = step.selector || step.target || ""
        const el = findTargetElement(target)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          await new Promise((r) => setTimeout(r, 400))
          el.click()
          await new Promise((r) => setTimeout(r, 1200))
        } else {
          if (target.toLowerCase().includes("faq")) {
            window.location.href = "/faq"
            return
          } else if (target.toLowerCase().includes("education")) {
            window.location.href = "/educational-guide.html"
            return
          }
          await new Promise((r) => setTimeout(r, 800))
        }
      } else if (step.type === "back") {
        window.history.back()
        await new Promise((r) => setTimeout(r, 1200))
      } else if (step.type === "delay") {
        await new Promise((r) => setTimeout(r, step.ms || 1000))
      }
    }

    setStatusMessage("Pipeline execution completed successfully!")
    speak("Automation completed!")
    isExecutingRef.current = false
    setTimeout(() => {
      setCurrentStepIndex(-1)
      setActiveSteps([])
    }, 4000)
  }

  // Parse instruction with Groq
  const executeInstruction = async (text: string) => {
    if (!text.trim() || isProcessing) return
    setIsProcessing(true)
    setStatusMessage("Synthesizing workflow graph with Neural AI...")

    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
    const prompt = `You are the Master Browser & System Automation Copilot for Dr. Bashir Khan's Gonstead Chiropractic Clinic website.
Convert the user request into an array of precise browser execution steps.

Available actions:
- {"type": "navigate", "target": "/path"} (routes: "/", "/faq", "/educational-guide.html", "/patient/auth", "/patient-portal", "/admin/auth", "/admin/dashboard", "/admin/patient-tracking", "/admin/money-management", "/admin/analytics", "/#services", "/#about", "/#doctor", "/#contact", "/#education")
- {"type": "scroll", "target": "down" | "up" | "bottom" | "top" | "#selector"}
- {"type": "type", "target": "email" | "password" | "name" | "phone" | "#selector", "value": "text to enter"}
- {"type": "click", "target": "visible text or selector e.g. Sign In, Login, Submit"}
- {"type": "back"}
- {"type": "delay", "ms": 1000}

Guidelines:
1. When asked to login or enter credentials:
   - If user is not already on an auth page, navigate first (e.g. {"type": "navigate", "target": "/patient/auth"} or {"type": "navigate", "target": "/admin/auth"}).
   - Enter email: {"type": "type", "target": "email", "value": "<email>"}
   - Enter password: {"type": "type", "target": "password", "value": "<password>"}
   - Submit form: {"type": "click", "target": "Sign In"} or {"type": "click", "target": "submit"}
2. If the user tells you credentials or says "enter credentials <email> <password>", fill those into the respective fields.

Respond ONLY with valid JSON with format:
{"explanation": "plain text explanation", "steps": [{"type": "...", "target": "...", "value": "..."}]}`

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
            { role: "system", content: prompt },
            { role: "user", content: text },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const parsed: PipelineExecution = JSON.parse(data.choices[0].message.content)
        setStatusMessage(parsed.explanation)
        speak(parsed.explanation)
        runPipeline(parsed.steps, 0, parsed.explanation)
      } else {
        throw new Error("Failed to parse instruction")
      }
    } catch (e) {
      console.error(e)
      setStatusMessage("Failed to plan automation. Please try rephrasing.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div ref={containerRef}>
      {/* Perplexity-inspired Futuristic Floating Copilot Orb */}
      <div
        className={`fixed z-[99990] flex items-center transition-all duration-300 ${
          isPatientPortal
            ? "bottom-20 left-6"
            : "bottom-18 right-4 md:bottom-20 md:right-6"
        }`}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={`group relative h-13 w-13 sm:h-14 sm:w-14 rounded-2xl shadow-[0_10px_35px_rgba(13,92,117,0.35)] flex items-center justify-center transition-all duration-300 overflow-hidden ${
            isOpen
              ? "bg-[#083344] ring-2 ring-teal-400/80 shadow-[0_0_30px_rgba(42,157,143,0.5)]"
              : "bg-gradient-to-br from-[#0d5c75] via-[#0e7490] to-[#2a9d8f]"
          }`}
          title="Open AI Autonomous Copilot (Voice & Pipeline)"
          aria-label="Open AI Autonomous Copilot"
        >
          {/* Animated Neon Aura Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/30 via-emerald-400/30 to-cyan-400/30 opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
          
          {/* Rotating Holographic Glow Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-4px] rounded-2xl bg-[conic-gradient(from_0deg,#2a9d8f,#06b6d4,#10b981,#2a9d8f)] opacity-35 blur-[2px]"
          />

          {/* Central Glass Core */}
          <div className="relative z-10 w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-[14px] bg-[#072430]/90 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Sparkles className="w-6 h-6 text-teal-300 group-hover:text-cyan-200 transition-colors animate-pulse" />

            {/* Neural activity live indicator */}
            {isExecutingRef.current && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
              </span>
            )}
            
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border border-white"></span>
              </span>
            )}

            {!isExecutingRef.current && !isListening && (
              <span className="absolute bottom-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white"></span>
              </span>
            )}
          </div>
        </motion.button>
      </div>

      {/* Modern Next-Gen Glassmorphism Automation Console */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`fixed w-[420px] max-w-[calc(100vw-1.5rem)] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] z-[99995] overflow-hidden flex flex-col backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-white/10 ${
              isPatientPortal
                ? "bottom-36 left-4 sm:left-6"
                : "bottom-36 right-3 sm:right-6"
            }`}
          >
            {/* Holographic Header Bar */}
            <div className="relative p-4 bg-gradient-to-r from-[#0d5c75] via-[#0f766e] to-[#2a9d8f] text-white overflow-hidden">
              {/* Subtle Animated Shimmer */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-lg flex items-center justify-center border border-white/30 shadow-inner">
                    <Bot className="w-5 h-5 text-teal-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm font-poppins tracking-wide">Autonomous Copilot</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-300/20 text-teal-200 border border-teal-300/30">
                        PRO
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-100/90 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-300" />
                      Neural Browser Automation Engine
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="p-2 rounded-xl hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                    title={voiceEnabled ? "Mute Voice Speech" : "Enable Voice Speech"}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4 text-teal-200" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-rose-300" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/15 text-white/90 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Neural Live Status Banner */}
            <div className="px-4 py-3 bg-slate-900 text-teal-300 border-b border-teal-900/40 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isProcessing || isExecutingRef.current ? "bg-amber-400" : "bg-emerald-400"} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isProcessing || isExecutingRef.current ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                </span>
                <span className="truncate font-mono text-[11px] tracking-tight text-slate-200">
                  {statusMessage}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-teal-400/80 uppercase">
                <Cpu className="w-3 h-3 text-teal-400" />
                <span>AI-Agent</span>
              </div>
            </div>

            {/* Visual Step Pipeline Tree (Active Execution View) */}
            {activeSteps.length > 0 && (
              <div className="p-3 bg-slate-950/95 border-b border-slate-800 space-y-1.5 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 mb-1">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-teal-400" />
                    Execution Graph
                  </span>
                  <span>{currentStepIndex + 1} of {activeSteps.length}</span>
                </div>
                {activeSteps.map((s, idx) => {
                  const isCurrent = idx === currentStepIndex
                  const isCompleted = idx < currentStepIndex
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all text-xs ${
                        isCurrent
                          ? "bg-gradient-to-r from-teal-900/60 to-emerald-900/60 border-teal-500/60 text-teal-200 shadow-[0_0_15px_rgba(42,157,143,0.2)]"
                          : isCompleted
                          ? "bg-slate-900/50 border-slate-800 text-slate-500"
                          : "bg-slate-900/80 border-slate-800/80 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                          isCurrent
                            ? "bg-teal-500 text-slate-900 animate-pulse"
                            : isCompleted
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }`}>
                          {isCompleted ? "✓" : idx + 1}
                        </span>
                        <span className="font-semibold uppercase tracking-wider text-[10px] text-teal-400">
                          {s.type}
                        </span>
                        <span className="truncate font-mono text-[11px] text-slate-300">
                          {s.target || s.selector || s.value || ""}
                        </span>
                      </div>
                      {isCurrent && (
                        <span className="flex items-center text-[10px] font-bold text-teal-300 animate-pulse">
                          Running...
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Interactive Prompt Capsules (Perplexity Style Quick Triggers) */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Instant Autonomous Workflows:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => executeInstruction("scroll down and show clinic services")}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all hover:border-teal-500/40 shadow-xs"
                >
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    Explore Services
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => executeInstruction("go to FAQ page and open the last question")}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all hover:border-teal-500/40 shadow-xs"
                >
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    FAQ Inspection
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => executeInstruction("open patient portal")}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all hover:border-teal-500/40 shadow-xs"
                >
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    Patient Portal
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => executeInstruction("open admin dashboard")}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/80 dark:border-slate-700/80 text-left transition-all hover:border-teal-500/40 shadow-xs"
                >
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    Admin Dashboard
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Neural Voice & Command Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={toggleListening}
                className={`relative p-3 rounded-2xl transition-all shadow-md flex items-center justify-center ${
                  isListening
                    ? "bg-rose-500 text-white ring-4 ring-rose-300/40 shadow-rose-500/30"
                    : "bg-gradient-to-br from-teal-50 to-teal-100/60 dark:from-teal-950/60 dark:to-teal-900/60 text-[#0d5c75] dark:text-teal-300 hover:from-teal-100 hover:to-teal-200/60 border border-teal-200/60 dark:border-teal-800"
                }`}
                title={isListening ? "Listening... click to stop" : "Speak voice automation command"}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 animate-pulse" />
                    <span className="absolute inset-0 rounded-2xl bg-rose-500 animate-ping opacity-25" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeInstruction(inputText)
                    }
                  }}
                  placeholder="Ask anything or command workflow..."
                  className="w-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs px-3.5 py-3 rounded-2xl border border-transparent focus:border-teal-500/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-teal-500/15 outline-none transition-all"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => executeInstruction(inputText)}
                disabled={isProcessing || !inputText.trim()}
                className="p-3 rounded-2xl bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white hover:opacity-95 disabled:opacity-40 transition-all shadow-md shadow-teal-900/20 disabled:shadow-none flex items-center justify-center"
                title="Execute automation"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SystemAutomationCopilot
