"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Home,
  Stethoscope,
  LogOut,
  PlusCircle,
  Activity,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Search,
  Printer,
  XCircle,
  Edit3,
  Thermometer,
  Smartphone,
  BellRing,
  CheckSquare,
  Square,
  FileCheck,
  Pill,
  ShieldCheck,
  MapPin,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { logoutPatient, getPatientAppointmentsFromFirestore } from "@/lib/patient-auth"
import { updatePatientFirestore, getPrescriptionsFirestore, type Patient } from "@/lib/firebase-db"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AppointmentConfirmation } from "@/components/appointment-confirmation"
import { checkUpcomingPreAppointmentReminders, type AppointmentReminder } from "@/lib/patient-reminder-service"
import { registerPatientServiceWorker } from "@/lib/pwa-service-worker"

const EnhancedAppointmentBooking = dynamic(
  () => import("@/components/enhanced-appointment-booking").then((mod) => mod.EnhancedAppointmentBooking),
  { ssr: false, loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading booking system...</div> }
)
const PatientChatWidget = dynamic(
  () => import("@/components/PatientChatWidget").then((mod) => mod.PatientChatWidget),
  { ssr: false }
)
const PatientPortalAiBooking = dynamic(
  () => import("@/components/PatientPortalAiBooking").then((mod) => mod.PatientPortalAiBooking),
  { ssr: false }
)

export default function PatientPortalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === "dark"

  const [isLoading, setIsLoading] = useState(true)
  const [patientName, setPatientName] = useState("Patient")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientUid, setPatientUid] = useState("")
  const [patientId, setPatientId] = useState("")

  // Profile Edit State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editDob, setEditDob] = useState("")
  const [editGender, setEditGender] = useState("Male")
  const [editEmergency, setEditEmergency] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Appointments State
  const [appointments, setAppointments] = useState<Patient[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)

  // Reschedule & Print State
  const [rescheduleApt, setRescheduleApt] = useState<Patient | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState<string>("")
  const [rescheduleTime, setRescheduleTime] = useState<string>("10:00 AM")
  const [isUpdatingApt, setIsUpdatingApt] = useState(false)
  const [printSlipApt, setPrintSlipApt] = useState<Patient | null>(null)
  const [viewConfirmationApt, setViewConfirmationApt] = useState<Patient | null>(null)

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null)
  const [prescriptionSearch, setPrescriptionSearch] = useState("")

  // Symptom Intake State
  const [painLevel, setPainLevel] = useState<number>(5)
  const [affectedRegion, setAffectedRegion] = useState<string>("Lumbar Spine (L4-L5)")
  const [symptomDescription, setSymptomDescription] = useState<string>("")
  const [isLoggingSymptom, setIsLoggingSymptom] = useState(false)

  // Daily Rehab Checklist
  const [rehabTasks, setRehabTasks] = useState([
    { id: 1, title: "Morning Cat-Cow Decompression (10 mins)", region: "Lumbar", done: false, desc: "Gentle spinal flexion and extension to lubricate intervertebral discs." },
    { id: 2, title: "Prone Cobra Cervical Extension (5 mins)", region: "Neck & Upper Back", done: false, desc: "Restores cervical lordotic curve and counteracts forward head posture." },
    { id: 3, title: "15-Min Ice Therapy on Affected Joint", region: "Lower Back / SI", done: false, desc: "Reduces localized inflammatory edema following Gonstead adjustment." },
    { id: 4, title: "Ergonomic Walk & Posture Break (30 mins)", region: "Full Spine", done: false, desc: "Engages core spinal stabilizers and promotes fluid exchange." },
    { id: 5, title: "Hydration Goal: 2.5 Liters Water", region: "Disc Health", done: false, desc: "Rehydrates nucleus pulposus inside spinal discs overnight." },
  ])

  // PWA & Reminders
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [reminders, setReminders] = useState<AppointmentReminder[]>([])

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      }
    }
  }, [])

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Install Patient App",
        description: "Tap browser menu (⋮ or Share) and choose 'Add to Home Screen'.",
      })
      return
    }
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === "accepted") {
      toast({ title: "App Installed!", description: "Patient portal added to your home screen." })
      setDeferredPrompt(null)
    }
  }

  // Auth Check & Initial Data Load
  useEffect(() => {
    if (typeof window !== "undefined") {
      registerPatientServiceWorker()

      const isAuth = localStorage.getItem("patient_authenticated")
      if (isAuth !== "true") {
        router.replace("/patient/auth")
        return
      }

      const uName = localStorage.getItem("patient_name") || "Patient"
      const uEmail = localStorage.getItem("patient_email") || ""
      const uPhone = localStorage.getItem("patient_phone") || ""
      const uUid = localStorage.getItem("patient_uid") || ""
      const uId = localStorage.getItem("patient_id") || ""

      setPatientName(uName)
      setPatientEmail(uEmail)
      setPatientPhone(uPhone)
      setPatientUid(uUid)
      setPatientId(uId)

      setEditName(uName)
      setEditEmail(uEmail)
      setEditPhone(uPhone)

      loadData(uEmail, uPhone, uUid, uName)
    }
  }, [router])

  const loadData = async (email?: string, phone?: string, uid?: string, name?: string) => {
    setIsLoading(true)
    const em = email || patientEmail
    const ph = phone || patientPhone
    const uu = uid || patientUid
    const nm = name || patientName

    try {
      // Load Appointments with timeout guarantee
      const list = await getPatientAppointmentsFromFirestore(em, ph, uu, nm)
      setAppointments(list)

      // Load Reminders
      const rems = checkUpcomingPreAppointmentReminders(list, nm)
      setReminders(rems)

      // Fill profile extra details if patient object found
      if (list.length > 0) {
        const p = list[0] as any
        if (p.dob) setEditDob(p.dob)
        if (p.gender) setEditGender(p.gender)
        if (p.address) setEditAddress(p.address)
        if (p.demographics?.emergency_contact) setEditEmergency(p.demographics.emergency_contact)
      }

      // Load Prescriptions
      setIsLoadingPrescriptions(true)
      try {
        const allRx = await getPrescriptionsFirestore()
        const cEmail = em.trim().toLowerCase()
        const cPhone = ph.replace(/\D/g, "")
        const cName = nm.trim().toLowerCase()

        const userRx = allRx.filter((rx) => {
          const rxEmail = (rx.patient_email || "").toLowerCase()
          const rxPhone = (rx.patient_phone || "").replace(/\D/g, "")
          const rxName = (rx.patient_name || "").toLowerCase()
          const rxPatientId = rx.patient_id || ""

          return (
            (cEmail && rxEmail === cEmail) ||
            (cPhone && rxPhone && (rxPhone.includes(cPhone) || cPhone.includes(rxPhone))) ||
            (cName && rxName && (rxName.includes(cName) || cName.includes(rxName))) ||
            (patientId && rxPatientId === patientId)
          )
        })

        setPrescriptions(userRx)
      } catch (e) {
        console.warn("Load Prescriptions note:", e)
      } finally {
        setIsLoadingPrescriptions(false)
      }
    } catch (loadErr) {
      console.warn("loadData error note:", loadErr)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logoutPatient()
    toast({ title: "Signed Out", description: "You have been logged out safely." })
    router.replace("/patient/auth")
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)

    try {
      // 1. Update local storage
      localStorage.setItem("patient_name", editName)
      localStorage.setItem("patient_email", editEmail)
      localStorage.setItem("patient_phone", editPhone)
      setPatientName(editName)
      setPatientEmail(editEmail)
      setPatientPhone(editPhone)

      // 2. Update Firestore patient record
      if (appointments.length > 0) {
        await updatePatientFirestore(appointments[0].id, {
          name: editName,
          email: editEmail,
          phone: editPhone,
          demographics: {
            emergency_contact: editEmergency,
            gender: editGender,
            address: editAddress,
          },
        } as any)
      }

      // 3. Update Firestore account document if UID exists
      if (patientUid && db) {
        try {
          const accRef = doc(db, "patient_accounts", patientUid)
          await updateDoc(accRef, {
            name: editName,
            email: editEmail,
            phone: editPhone,
            dob: editDob,
            gender: editGender,
            emergency_contact: editEmergency,
            address: editAddress,
          })
        } catch (e) {
          // Skip if missing doc
        }
      }

      toast({ title: "Profile Updated", description: "Your patient account details were saved to Firestore." })
      setIsEditProfileOpen(false)
      loadData()
    } catch (err) {
      toast({ title: "Update Failed", description: "Could not save profile updates.", variant: "destructive" })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancelAppointment = async (aptId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return
    setIsUpdatingApt(true)
    const res = await updatePatientFirestore(aptId, { status: "cancelled" })
    setIsUpdatingApt(false)

    if (res) {
      toast({ title: "Appointment Cancelled", description: "Your appointment status was set to cancelled." })
      loadData()
    } else {
      toast({ title: "Cancel Failed", description: "Could not update appointment.", variant: "destructive" })
    }
  }

  const handleSaveReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate) {
      toast({ title: "Select Date", description: "Please enter a valid date.", variant: "destructive" })
      return
    }

    setIsUpdatingApt(true)
    const res = await updatePatientFirestore(rescheduleApt.id, {
      appointment_date: rescheduleDate,
      appointment_time: rescheduleTime,
      status: "scheduled",
    })
    setIsUpdatingApt(false)

    if (res) {
      toast({ title: "Rescheduled!", description: `Updated to ${rescheduleDate} at ${rescheduleTime}.` })
      setRescheduleApt(null)
      loadData()
    } else {
      toast({ title: "Reschedule Failed", description: "Could not update date.", variant: "destructive" })
    }
  }

  const handleLogSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (appointments.length === 0) {
      toast({ title: "No Active Record", description: "Please schedule an appointment first.", variant: "destructive" })
      return
    }

    setIsLoggingSymptom(true)
    const res = await updatePatientFirestore(appointments[0].id, {
      chief_complaint: `[Pre-Visit Log] Pain Level ${painLevel}/10 in ${affectedRegion}: ${symptomDescription || "No notes"}`,
    })
    setIsLoggingSymptom(false)

    if (res) {
      toast({ title: "Symptom Note Saved!", description: "Pre-visit note forwarded to Dr. Bashir Khan." })
      setSymptomDescription("")
      loadData()
    } else {
      toast({ title: "Submission Failed", description: "Could not record symptom note.", variant: "destructive" })
    }
  }

  const toggleRehabTask = (id: number) => {
    setRehabTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const completedRehabCount = rehabTasks.filter((t) => t.done).length

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus === "all" || apt.status?.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointment_date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.session_type?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!prescriptionSearch) return true
    const term = prescriptionSearch.toLowerCase()
    return (
      rx.id?.toLowerCase().includes(term) ||
      rx.treatment_plan?.toLowerCase().includes(term) ||
      rx.prescribed_medicine?.toLowerCase().includes(term)
    )
  })

  const upcomingAppointment = appointments.find(
    (a) => a.status?.toLowerCase() === "confirmed" || a.status?.toLowerCase() === "scheduled"
  )
  const completedCount = appointments.filter((a) => a.status?.toLowerCase() === "completed").length

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900 text-slate-100" : "bg-[rgb(220,230,229)] text-[#0d5c75]"
    }`}>
      {/* TOP NAVBAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-900/95 border-gray-800 text-white"
          : "bg-white/85 border-[#0d5c75]/15 text-[#0d5c75] shadow-[0_4px_16px_rgba(13,92,117,0.06)]"
      }`}>
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-[#0d5c75] to-[#2a9d8f] flex items-center justify-center font-bold text-white shadow-md shrink-0 text-sm sm:text-base">
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className={`text-sm sm:text-lg font-bold font-poppins tracking-tight truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`} title={patientName}>
                  {patientName}
                </h1>
                <Badge className="bg-[#2a9d8f]/15 text-[#0d5c75] dark:text-[#2a9d8f] border-[#2a9d8f]/30 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0 shrink-0">
                  Patient Portal
                </Badge>
              </div>
              <p className={`text-[11px] sm:text-xs truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                {patientEmail || "Gonstead Chiropractic Patient"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              onClick={handleInstallPwa}
              size="sm"
              className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 text-xs hidden lg:flex rounded-xl h-8 sm:h-9 px-2.5"
            >
              <Smartphone className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              <span>App</span>
            </Button>

            <Button
              onClick={() => setIsBookModalOpen(true)}
              size="sm"
              className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white text-xs font-semibold shadow-md rounded-xl h-8 sm:h-9 px-2.5 sm:px-3"
            >
              <PlusCircle className="h-3.5 w-3.5 sm:mr-1.5 shrink-0" />
              <span>Book<span className="hidden sm:inline"> Adjustment</span></span>
            </Button>

            <Button
              onClick={() => router.push("/")}
              size="sm"
              className={isDarkMode ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 text-slate-200 hidden md:flex text-xs rounded-xl h-8 sm:h-9" : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hidden md:flex text-xs rounded-xl h-8 sm:h-9"}
            >
              <Home className="h-3.5 w-3.5 mr-1" />
              Site
            </Button>

            {/* Rounded Theme Switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDarkMode ? "light" : "dark")}
              className={`w-8 h-8 rounded-full border transition-all duration-300 shadow-sm shrink-0 flex items-center justify-center ${
                isDarkMode
                  ? "bg-gray-800/80 border-gray-700 text-amber-300 hover:bg-gray-700"
                  : "bg-white/80 border-slate-300 text-[#0d5c75] hover:bg-slate-100"
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs rounded-xl h-8 sm:h-9 px-2 sm:px-2.5">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 24-HOUR REMINDERS BANNER */}
      {reminders.length > 0 && (
        <div className="container mx-auto px-4 pt-4">
          {reminders.map((rem, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 flex items-center justify-between gap-4 mb-2 shadow-xs">
              <div className="flex items-center gap-3">
                <BellRing className="h-6 w-6 text-teal-600 dark:text-teal-400 animate-bounce flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-[#0d5c75] dark:text-teal-100">Reminder: Adjustment Visit ({rem.isTomorrow ? "Tomorrow" : "Today"})</h4>
                  <p className="text-xs text-gray-600 dark:text-teal-200/80">{rem.message}</p>
                </div>
              </div>
              <Button onClick={() => setIsBookModalOpen(true)} size="sm" className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white font-bold text-xs rounded-xl">
                View
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* QUICK STATS CARDS */}
      <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-2 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#0d5c75]/10 text-[#0d5c75] dark:text-[#2a9d8f] shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"} font-medium truncate`}>Next Adjustment</p>
              <p className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${isDarkMode ? "text-slate-100" : "text-[#0d5c75]"}`}>
                {upcomingAppointment ? `${upcomingAppointment.appointment_date}` : "No Visit"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"} font-medium truncate`}>Completed</p>
              <p className={`text-sm sm:text-xl font-bold mt-0.5 truncate ${isDarkMode ? "text-slate-100" : "text-[#0d5c75]"}`}>
                {completedCount} <span className="text-[11px] sm:text-xs font-normal">Visits</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"} font-medium truncate`}>Prescriptions</p>
              <p className={`text-sm sm:text-xl font-bold mt-0.5 truncate ${isDarkMode ? "text-purple-300" : "text-purple-700"}`}>
                {prescriptions.length} <span className="text-[11px] sm:text-xs font-normal">Records</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"} font-medium truncate`}>Lead Specialist</p>
              <p className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${isDarkMode ? "text-slate-100" : "text-[#0d5c75]"}`}>Dr. Bashir Khan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-6">
        <Tabs defaultValue="appointments" className="space-y-4 sm:space-y-6">
          <div className="w-full overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className={`inline-flex min-w-full sm:min-w-0 sm:w-full h-11 sm:h-12 border p-1 rounded-2xl gap-1 justify-start sm:justify-center overflow-x-auto no-scrollbar ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#0d5c75]/20 shadow-md"
            }`}>
              <TabsTrigger value="appointments" className="shrink-0 h-9 sm:h-10 data-[state=active]:bg-[#0d5c75] data-[state=active]:text-white text-xs px-3 sm:px-4 rounded-xl font-medium">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Visits
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="shrink-0 h-9 sm:h-10 data-[state=active]:bg-[#0d5c75] data-[state=active]:text-white text-xs px-3 sm:px-4 rounded-xl font-medium">
                <Pill className="h-3.5 w-3.5 mr-1.5" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger value="rehab" className="shrink-0 h-9 sm:h-10 data-[state=active]:bg-[#0d5c75] data-[state=active]:text-white text-xs px-3 sm:px-4 rounded-xl font-medium">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                Rehab & Care
              </TabsTrigger>
              <TabsTrigger value="symptoms" className="shrink-0 h-9 sm:h-10 data-[state=active]:bg-[#0d5c75] data-[state=active]:text-white text-xs px-3 sm:px-4 rounded-xl font-medium">
                <Thermometer className="h-3.5 w-3.5 mr-1.5" />
                Pre-Visit Note
              </TabsTrigger>
              <TabsTrigger value="records" className="shrink-0 h-9 sm:h-10 data-[state=active]:bg-[#0d5c75] data-[state=active]:text-white text-xs px-3 sm:px-4 rounded-xl font-medium">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Clinical Notes
              </TabsTrigger>
              <TabsTrigger value="profile" className="shrink-0 h-9 sm:h-10 data-[state=active]:bg-[#0d5c75] data-[state=active]:text-white text-xs px-3 sm:px-4 rounded-xl font-medium">
                <User className="h-3.5 w-3.5 mr-1.5" />
                My Profile
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: APPOINTMENTS */}
          <TabsContent value="appointments">
            <Card className={`border shadow-md rounded-2xl overflow-hidden transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
              <CardHeader className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 pb-4 border-b ${isDarkMode ? "bg-gray-850 border-gray-700" : "bg-slate-50/60 border-gray-100"}`}>
                <div>
                  <CardTitle className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                    <Calendar className="h-5 w-5 text-[#2a9d8f]" />
                    Appointment History & Self-Service
                  </CardTitle>
                  <CardDescription className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Reschedule, cancel, or print official clinic appointment slips.</CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar">
                  <div className={`flex p-1 rounded-xl border text-xs shrink-0 ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-slate-100/80 border-slate-200"}`}>
                    {["all", "scheduled", "completed", "cancelled"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-lg capitalize text-xs transition-all ${
                          filterStatus === st ? "bg-[#0d5c75] text-white font-semibold shadow-xs" : (isDarkMode ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-[#0d5c75]")
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <Button onClick={() => loadData()} size="sm" className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white border-0 text-xs rounded-xl h-8 w-8 sm:h-9 sm:w-9 p-0 shrink-0">
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#2a9d8f]" />
                    <p className="text-xs">Fetching your Firestore appointments...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#0d5c75]/20 rounded-2xl p-6 bg-slate-50/30">
                    <Calendar className="h-8 w-8 text-[#0d5c75]/40 mx-auto mb-2" />
                    <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-300" : "text-[#0d5c75]"}`}>No matching appointments found</p>
                    <Button onClick={() => setIsBookModalOpen(true)} className="mt-3 bg-[#0d5c75] hover:bg-[#0a4a5c] text-white text-xs rounded-xl shadow-xs">
                      <PlusCircle className="h-4 w-4 mr-1.5" /> Book Adjustment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAppointments.map((apt) => {
                      const st = apt.status?.toLowerCase() || "scheduled"
                      const badgeVariant =
                        st === "completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : st === "confirmed" || st === "scheduled"
                          ? "bg-teal-100 text-[#0d5c75] border-teal-200"
                          : st === "cancelled"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"

                      return (
                        <div key={apt.id} className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 transition-all shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15 hover:border-[#0d5c75]/30"}`}>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs capitalize font-semibold rounded-lg ${badgeVariant}`}>{st}</Badge>
                              <span className="text-[11px] font-mono text-gray-400">Ref: #{apt.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <p className={`text-sm font-bold capitalize ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                              {apt.session_type === "video" ? "Video Consultation" : "In-Clinic Gonstead Adjustment"}
                            </p>
                            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"} mt-1`}>
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#2a9d8f]" /> {apt.appointment_date}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#2a9d8f]" /> {apt.appointment_time || "10:00 AM"}</span>
                              <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5 text-[#2a9d8f]" /> Dr. Bashir Khan</span>
                            </div>
                            {apt.chief_complaint && <p className={`text-xs italic mt-1 line-clamp-2 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>"{apt.chief_complaint}"</p>}
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-gray-800 shrink-0">
                            <Button size="sm" variant="outline" className="flex-1 sm:flex-none border-[#0d5c75]/30 text-[#0d5c75] bg-white hover:bg-slate-50 text-xs rounded-xl h-8 sm:h-9" onClick={() => setPrintSlipApt(apt)}>
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              <span>Slip</span>
                            </Button>
                            {st === "scheduled" || st === "confirmed" ? (
                              <>
                                <Button
                                  size="sm"
                                  className="flex-1 sm:flex-none bg-[#0d5c75] hover:bg-[#0a4a5c] text-white border-0 text-xs rounded-xl h-8 sm:h-9"
                                  onClick={() => {
                                    setRescheduleApt(apt)
                                    setRescheduleDate(apt.appointment_date)
                                    setRescheduleTime(apt.appointment_time || "10:00 AM")
                                  }}
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                                  <span>Reschedule</span>
                                </Button>
                                <Button size="sm" className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs rounded-xl h-8 sm:h-9" onClick={() => handleCancelAppointment(apt.id)}>
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  <span>Cancel</span>
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: DIGITAL PRESCRIPTIONS */}
          <TabsContent value="prescriptions">
            <Card className={`border shadow-sm transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 pb-4">
                <div>
                  <CardTitle className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                    <Pill className="h-5 w-5 text-purple-400" />
                    My Digital Prescriptions & Clinical Records
                  </CardTitle>
                  <CardDescription className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Official Gonstead prescriptions & treatment protocols created by Dr. Bashir Khan.</CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={prescriptionSearch}
                    onChange={(e) => setPrescriptionSearch(e.target.value)}
                    placeholder="Search prescription..."
                    className={`pl-9 text-xs border rounded-xl h-9 ${isDarkMode ? "bg-gray-900 border-gray-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-6">
                {isLoadingPrescriptions ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-400" />
                    <p className="text-xs">Loading digital prescriptions from Firestore...</p>
                  </div>
                ) : filteredPrescriptions.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#0d5c75]/20 rounded-2xl p-6 bg-slate-50/30">
                    <FileCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-300" : "text-[#0d5c75]"}`}>No prescriptions on record</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}>Prescriptions issued by Dr. Bashir Khan during clinic visits will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {filteredPrescriptions.map((rx) => (
                      <div key={rx.id} className={`p-4 rounded-2xl border space-y-3 shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-semibold">Rx #{rx.id}</Badge>
                            <span className="text-[11px] text-slate-400">{rx.visit_date ? new Date(rx.visit_date).toLocaleDateString() : rx.created_at?.split("T")[0]}</span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{rx.payment_status || "Completed"}</span>
                        </div>

                        <div>
                          <h4 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Diagnosis / Protocol</h4>
                          <p className={`text-xs mt-0.5 line-clamp-2 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>{rx.treatment_plan || "Gonstead Spinal Adjustment Routine"}</p>
                        </div>

                        {rx.prescribed_medicine && (
                          <div>
                            <h4 className={`text-xs font-semibold ${isDarkMode ? "text-purple-300" : "text-purple-700"}`}>Prescribed Medicine / Supplements:</h4>
                            <p className={`text-xs mt-0.5 italic ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>{rx.prescribed_medicine}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-800 text-xs">
                          <span className={isDarkMode ? "text-slate-400" : "text-gray-500"}>Total Sessions: <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{rx.total_sessions || "1"}</strong></span>
                          <Button size="sm" onClick={() => setSelectedPrescription(rx)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl h-8">
                            <Printer className="h-3.5 w-3.5 mr-1" /> View & Print Rx
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: REHAB & CARE TRACKER */}
          <TabsContent value="rehab">
            <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-gray-800">
                <div>
                  <CardTitle className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                    <Activity className="h-5 w-5 text-[#2a9d8f]" />
                    Daily Gonstead Spine Rehab & Home Exercises
                  </CardTitle>
                  <CardDescription className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Post-adjustment exercise library & hydrative disc management.</CardDescription>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round((completedRehabCount / rehabTasks.length) * 100)}%</span>
                  <p className="text-[10px] text-slate-400">Daily Goal</p>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-2.5 sm:space-y-3">
                {rehabTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleRehabTask(t.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 sm:gap-3 ${
                      t.done
                        ? (isDarkMode ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200" : "bg-emerald-50/80 border-emerald-200 text-emerald-800")
                        : (isDarkMode ? "bg-gray-900 border-gray-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#2a9d8f]/40")
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      {t.done ? <CheckSquare className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" /> : <Square className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block ${t.done ? "line-through opacity-70" : isDarkMode ? "text-white" : "text-slate-900"}`}>{t.title}</span>
                        <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{t.desc}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 border ${isDarkMode ? "border-gray-700 text-slate-400" : "border-slate-300 text-slate-600 bg-white"}`}>{t.region}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: PRE-VISIT SYMPTOM INTAKE */}
          <TabsContent value="symptoms">
            <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-gray-800">
                <CardTitle className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                  <Thermometer className="h-5 w-5 text-[#2a9d8f]" />
                  Pre-Visit Pain Rating & Symptom Intake
                </CardTitle>
                <CardDescription className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Log pain scale so Dr. Bashir Khan can prepare your spinal adjustment before arrival.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <form onSubmit={handleLogSymptomSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-[#0d5c75]"}`}>Pain Scale Rating (1 to 10)</Label>
                      <Badge className="bg-[#2a9d8f] text-white text-xs font-bold">{painLevel} / 10</Badge>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPainLevel(num)}
                          className={`py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all h-9 sm:h-8 flex items-center justify-center ${
                            painLevel === num
                              ? num > 7
                                ? "bg-rose-600 text-white shadow-xs"
                                : num > 4
                                ? "bg-amber-500 text-white shadow-xs"
                                : "bg-emerald-500 text-white shadow-xs"
                              : (isDarkMode ? "bg-gray-900 border border-gray-700 text-slate-400 hover:text-white" : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900")
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-[#0d5c75]"}`}>Primary Affected Spine Region</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Lumbar Spine (L4-L5 Lower Back)", "Cervical Spine (Neck & Shoulders)", "Thoracic Spine (Mid Back)", "Sciatica & SI Joint"].map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setAffectedRegion(reg)}
                          className={`p-2.5 text-left text-xs rounded-xl border transition-all ${
                            affectedRegion === reg
                              ? "bg-[#2a9d8f]/15 border-[#2a9d8f] text-[#0d5c75] dark:text-teal-200 font-semibold shadow-xs"
                              : (isDarkMode ? "bg-gray-900 border-gray-700 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#2a9d8f]/40")
                          }`}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-[#0d5c75]"}`}>Aggravating Factors & Notes</Label>
                    <Input
                      value={symptomDescription}
                      onChange={(e) => setSymptomDescription(e.target.value)}
                      placeholder="e.g., stiffness in morning, pain radiates down leg..."
                      className={`text-xs border rounded-xl h-9 ${isDarkMode ? "bg-gray-900 border-gray-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
                    />
                  </div>

                  <Button type="submit" disabled={isLoggingSymptom} className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white text-xs font-semibold py-2.5 rounded-xl h-10 shadow-sm">
                    {isLoggingSymptom ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                    <span>Forward Pre-Visit Note to Dr. Bashir Khan</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: CLINICAL NOTES & SPINE RECORDS */}
          <TabsContent value="records">
            <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-gray-800">
                <CardTitle className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                  <FileText className="h-5 w-5 text-[#2a9d8f]" />
                  Spinal Subluxation & Evaluation History
                </CardTitle>
                <CardDescription className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Recorded clinical assessments from your Gonstead spinal examinations.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-3">
                {appointments.length > 0 && appointments[0].notes ? (
                  <div className={`p-4 rounded-2xl border space-y-2 shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">Active Clinical Record</Badge>
                      <span className="text-xs text-slate-400">Dr. Bashir Khan</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>{appointments[0].notes}</p>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border space-y-2 shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">Active Gonstead Care</Badge>
                      <span className="text-xs text-slate-400">Dr. Bashir Khan</span>
                    </div>
                    <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Full-Spine Gonstead Analysis</h3>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                      Precision examination of temperature differentials, instrumentation, static palpation, motion palpation, and full-spine X-rays to locate primary vertebral subluxations.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: MY PROFILE MANAGEMENT */}
          <TabsContent value="profile">
            <Card className={`border shadow-sm sm:shadow-md rounded-2xl transition-all ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-[#0d5c75]/15 text-[#0d5c75]"}`}>
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-gray-800">
                <div>
                  <CardTitle className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                    <User className="h-5 w-5 text-[#2a9d8f]" />
                    Patient Account & Profile Management
                  </CardTitle>
                  <CardDescription className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Manage your patient credentials and contact information in Firestore.</CardDescription>
                </div>
                <Button onClick={() => setIsEditProfileOpen(true)} size="sm" className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white text-xs rounded-xl h-8 sm:h-9 shrink-0">
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Profile
                </Button>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`p-3.5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                  <span className="text-slate-400">Full Name</span>
                  <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{patientName}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                  <span className="text-slate-400">Registered Email</span>
                  <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{patientEmail || "Not Provided"}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                  <span className="text-slate-400">Phone Number</span>
                  <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{patientPhone || "Not Provided"}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                  <span className="text-slate-400">Date of Birth / Gender</span>
                  <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{editDob || "N/A"} ({editGender})</p>
                </div>
                <div className={`p-3.5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                  <span className="text-slate-400">Emergency Contact</span>
                  <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{editEmergency || "Not Provided"}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-[#0d5c75]/15"}`}>
                  <span className="text-slate-400">Clinic Address / City</span>
                  <p className={`text-sm font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{editAddress || "Nowshera, KPK"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className={`max-w-md w-[95vw] sm:w-full p-4 sm:p-6 rounded-2xl ${isDarkMode ? "bg-gray-900 border-gray-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader>
            <DialogTitle className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
              <User className="h-5 w-5 text-[#2a9d8f]" /> Update Patient Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs pt-2">
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Full Name *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Phone Number *</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Email Address *</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Date of Birth</Label>
                <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
              </div>
              <div>
                <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Gender</Label>
                <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className={`w-full h-9 border rounded-xl text-xs px-2 mt-1 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Emergency Contact Phone</Label>
              <Input value={editEmergency} onChange={(e) => setEditEmergency(e.target.value)} placeholder="+923001234567" className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Address / City</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Tehsil Road, Nowshera" className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>

            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white font-semibold py-2 rounded-xl h-10 mt-2">
              {isSavingProfile ? "Saving to Firestore..." : "Save Profile Updates"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW & PRINT DIGITAL PRESCRIPTION MODAL */}
      <Dialog open={!!selectedPrescription} onOpenChange={(open) => !open && setSelectedPrescription(null)}>
        <DialogContent className="bg-white text-slate-900 max-w-lg w-[95vw] sm:w-full p-4 sm:p-6 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-lg text-[#173e4d] flex items-center justify-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#2a9d8f]" />
              Gonstead Chiropractic Clinic
            </DialogTitle>
            <p className="text-center text-xs text-slate-500">Official Digital Prescription & Care Plan</p>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-3 my-2 text-xs border-y py-4 border-slate-200">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Prescription ID:</span>
                <span className="font-mono text-slate-900 font-bold">#{selectedPrescription.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Patient Name:</span>
                <span className="font-bold text-slate-900">{selectedPrescription.patient_name || patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Visit Date:</span>
                <span className="font-bold text-[#2a9d8f]">
                  {selectedPrescription.visit_date ? new Date(selectedPrescription.visit_date).toLocaleDateString() : "Recent"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Attending Specialist:</span>
                <span className="font-bold text-slate-900">{selectedPrescription.doctor_name || "Dr. Bashir Khan"}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-800">Treatment Plan / Protocol:</p>
                <p className="text-slate-700">{selectedPrescription.treatment_plan || "Full-spine Gonstead adjusting protocol"}</p>
              </div>

              {selectedPrescription.prescribed_medicine && (
                <div className="p-3 bg-purple-50 rounded-xl space-y-1">
                  <p className="font-bold text-purple-900">Prescribed Medicine / Supplements:</p>
                  <p className="text-purple-800">{selectedPrescription.prescribed_medicine}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white rounded-xl h-10">
              <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
            </Button>
            <Button onClick={() => setSelectedPrescription(null)} variant="outline" className="border-slate-300 text-slate-700 rounded-xl h-10">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESCHEDULE DIALOG */}
      <Dialog open={!!rescheduleApt} onOpenChange={(open) => !open && setRescheduleApt(null)}>
        <DialogContent className={`max-w-md w-[95vw] sm:w-full p-4 sm:p-6 rounded-2xl ${isDarkMode ? "bg-gray-900 border-gray-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader>
            <DialogTitle className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
              <Calendar className="h-5 w-5 text-[#2a9d8f]" /> Reschedule Adjustment Visit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs pt-2">
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Select New Date *</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>
            <div>
              <Label className={isDarkMode ? "text-slate-300" : "text-slate-700 font-medium"}>Select Preferred Time *</Label>
              <Input type="text" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} placeholder="10:00 AM" className={`text-xs mt-1 border rounded-xl h-9 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            </div>
            <Button onClick={handleSaveReschedule} disabled={isUpdatingApt} className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white font-semibold rounded-xl h-10 mt-2">
              {isUpdatingApt ? "Updating Date..." : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FULL APPOINTMENT CONFIRMATION SLIP & PDF DOWNLOAD DIALOG */}
      <Dialog open={!!printSlipApt || !!viewConfirmationApt} onOpenChange={(open) => {
        if (!open) {
          setPrintSlipApt(null)
          setViewConfirmationApt(null)
        }
      }}>
        <DialogContent className={`max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto border-2 p-3 sm:p-6 pb-24 shadow-2xl rounded-2xl ${
          isDarkMode ? "bg-gray-900 border-gray-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}>
          <DialogHeader className="sr-only">
            <DialogTitle>Appointment Confirmation Slip & PDF Download</DialogTitle>
          </DialogHeader>
          {(viewConfirmationApt || printSlipApt) && (
            <AppointmentConfirmation
              appointmentData={{
                name: patientName,
                phone: patientPhone,
                sessionType: (viewConfirmationApt || printSlipApt)?.session_type || "in_clinic",
                preferredTime: (viewConfirmationApt || printSlipApt)?.appointment_date || new Date().toISOString(),
                profession: (viewConfirmationApt || printSlipApt)?.demographics?.occupation || "",
                appointmentId: (viewConfirmationApt || printSlipApt)?.id
              }}
              onBackToHome={() => {
                setPrintSlipApt(null)
                setViewConfirmationApt(null)
              }}
              onNewAppointment={() => {
                setPrintSlipApt(null)
                setViewConfirmationApt(null)
                setIsBookModalOpen(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QUICK BOOKING DIALOG */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className={`max-w-3xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto border p-3 sm:p-6 shadow-2xl rounded-2xl ${
          isDarkMode ? "bg-gray-900 border-gray-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
              <Stethoscope className="h-5 w-5 text-[#2a9d8f]" /> Schedule Gonstead Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <EnhancedAppointmentBooking />
          </div>
        </DialogContent>
      </Dialog>

      {/* REAL-TIME 1-ON-1 PATIENT-DOCTOR CHAT WIDGET (RIGHT SIDE) */}
      <PatientChatWidget
        patientId={patientUid || patientEmail || patientPhone || "patient_guest"}
        patientName={patientName}
        patientEmail={patientEmail}
        patientPhone={patientPhone}
      />

      {/* SMART AI VOICE & PROMPT BOOKING ASSISTANT (LEFT SIDE - OPPOSITE) */}
      <PatientPortalAiBooking
        patientName={patientName}
        patientPhone={patientPhone}
        patientEmail={patientEmail}
        onAppointmentBooked={() => loadData()}
      />
    </div>
  )
}

