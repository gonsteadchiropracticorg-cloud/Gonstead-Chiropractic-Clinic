"use client"

import React, { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  Mic,
  MicOff,
  Sparkles,
  Command,
  Send,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Compass,
  Layers,
  Volume2,
  VolumeX,
} from "lucide-react"

interface AutomationStep {
  type: "navigate" | "scroll" | "click" | "back" | "delay"
  target?: string
  selector?: string
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

  const recognitionRef = useRef<any>(null)
  const isExecutingRef = useRef<boolean>(false)

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

    // Search by text / role / aria-label
    const clean = targetStr.toLowerCase().replace(/['"#.\[\]]/g, "").trim()
    const interactables = Array.from(
      document.querySelectorAll("button, a, summary, [role='button'], h2, h3, h4, input")
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
      setStatusMessage(`Step ${i + 1}/${steps.length}: ${step.type} ${step.target || ""}`)

      if (step.type === "navigate" && step.target) {
        if (step.target.startsWith("#")) {
          const el = document.querySelector(step.target)
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
          await new Promise((r) => setTimeout(r, 1200))
        } else {
          // If navigating to another page, store remaining steps to resume
          const remaining = steps.slice(i + 1)
          if (remaining.length > 0) {
            sessionStorage.setItem(
              "gonstead_automation_pipeline",
              JSON.stringify({ steps: remaining, currentIndex: 0, explanation })
            )
          }
          await new Promise((r) => setTimeout(r, 500))
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
      } else if (step.type === "click") {
        const target = step.selector || step.target || ""
        const el = findTargetElement(target)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          await new Promise((r) => setTimeout(r, 400))
          el.click()
          await new Promise((r) => setTimeout(r, 1200))
        } else {
          // Fallback if click is a route keyword like FAQ or Education
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
    setStatusMessage("Planning automation pipeline with AI...")

    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
    const prompt = `You are the Master Browser & System Automation Copilot for Dr. Bashir Khan's Gonstead Chiropractic Clinic website.
Convert the user request into an array of precise browser execution steps.

Available actions:
- {"type": "navigate", "target": "/path"} (routes: "/", "/faq", "/educational-guide.html", "/patient/auth", "/patient-portal", "/admin/dashboard", "/admin/patient-tracking", "/#services", "/#about", "/#doctor", "/#contact", "/#education")
- {"type": "scroll", "target": "down" | "up" | "bottom" | "top" | "#selector"}
- {"type": "click", "target": "visible text or selector"}
- {"type": "back"}
- {"type": "delay", "ms": 1000}

Respond ONLY with valid JSON with format:
{"explanation": "plain text explanation", "steps": [{"type": "...", "target": "..."}]}`

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
    <>
      {/* Floating System-Wide Copilot Trigger Button (Perfect Rounded Icon Stacked on top of Chatbot) */}
      <div
        className={`fixed z-[99990] flex items-center transition-all duration-300 ${
          isPatientPortal
            ? "bottom-20 left-6"
            : "bottom-22 right-5 md:bottom-24 md:right-7"
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-teal-300/40 ${
            isOpen
              ? "bg-[#0d5c75] text-white ring-4 ring-[#2a9d8f]/40"
              : "bg-gradient-to-tr from-[#0d5c75] via-[#15728a] to-[#2a9d8f] text-white hover:brightness-110"
          }`}
          title="Open AI System Automation Copilot (Voice & Text)"
          aria-label="Open AI System Automation Copilot"
        >
          <Sparkles className="w-5 h-5 text-teal-200 animate-pulse" />
          {isListening && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping border border-white" />
          )}
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
        </button>
      </div>

      {/* Floating Copilot Modal/Console */}
      {isOpen && (
        <div
          className={`fixed w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-teal-600/30 dark:border-teal-500/30 rounded-2xl shadow-2xl z-[99995] overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isPatientPortal
              ? "bottom-34 left-6"
              : "bottom-36 right-4 md:right-6"
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#0d5c75] to-[#1a758e] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Command className="w-4 h-4 text-teal-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">System Automation Copilot</h3>
                <p className="text-[11px] text-teal-100">Direct Voice & Text Browser Control</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title={voiceEnabled ? "Mute Voice Feedback" : "Enable Voice Feedback"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Display */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isExecutingRef.current ? "bg-amber-500 animate-ping" : "bg-teal-500"}`} />
            <span className="truncate font-medium">{statusMessage}</span>
          </div>

          {/* Step Progress List (When pipeline is running) */}
          {activeSteps.length > 0 && (
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto space-y-1 text-xs">
              {activeSteps.map((s, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                    idx === currentStepIndex
                      ? "bg-teal-600 text-white font-semibold"
                      : idx < currentStepIndex
                      ? "text-slate-400 line-through"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="w-4 text-center">{idx + 1}.</span>
                  <span className="uppercase text-[10px] tracking-wider">{s.type}</span>
                  <span className="truncate">{s.target || s.selector || ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preset Quick Actions */}
          <div className="p-2.5 flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => executeInstruction("scroll down and show clinic services")}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => executeInstruction("go to FAQ page and open the last question")}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
            >
              Open FAQ Last Question
            </button>
            <button
              onClick={() => executeInstruction("open patient portal")}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
            >
              Patient Portal
            </button>
            <button
              onClick={() => executeInstruction("open admin dashboard")}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
            >
              Admin Dashboard
            </button>
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-white dark:bg-slate-900 flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all shadow-sm ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100"
              }`}
              title={isListening ? "Listening... click to stop" : "Start speaking voice command"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  executeInstruction(inputText)
                }
              }}
              placeholder="Give automation command or speak..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-xl border-0 focus:ring-2 focus:ring-[#0d5c75] outline-none"
            />

            <button
              onClick={() => executeInstruction(inputText)}
              disabled={isProcessing || !inputText.trim()}
              className="p-2.5 rounded-xl bg-[#0d5c75] text-white hover:bg-[#116e8c] disabled:opacity-40 transition-colors shadow-sm"
              title="Run automation command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
