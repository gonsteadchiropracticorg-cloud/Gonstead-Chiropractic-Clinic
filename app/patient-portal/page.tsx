"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Shield,
  Home,
  Stethoscope,
  Download,
  LogOut,
  PlusCircle,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  RefreshCw,
  Search,
  ChevronRight,
  HeartPulse,
  Printer,
  XCircle,
  Edit3,
  Flame,
  CheckSquare,
  Square,
  Thermometer,
  Smartphone,
  BellRing,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { logoutPatient, getPatientAppointmentsFromFirestore } from "@/lib/patient-auth"
import { updatePatientFirestore } from "@/lib/firebase-db"
import type { Patient } from "@/lib/firebase-db"
import { EnhancedAppointmentBooking } from "@/components/enhanced-appointment-booking"
import { checkUpcomingPreAppointmentReminders, type AppointmentReminder } from "@/lib/patient-reminder-service"
import { registerPatientServiceWorker, sendBackgroundScreenNotification } from "@/lib/pwa-service-worker"
import { PatientChatWidget } from "@/components/PatientChatWidget"

export default function PatientPortalPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [patientName, setPatientName] = useState("Patient")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientUid, setPatientUid] = useState("")

  const [appointments, setAppointments] = useState<Patient[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)

  // Reschedule state
  const [rescheduleApt, setRescheduleApt] = useState<Patient | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState<string>("")
  const [rescheduleTime, setRescheduleTime] = useState<string>("10:00 AM")
  const [isUpdatingApt, setIsUpdatingApt] = useState(false)

  // Printable slip state
  const [printSlipApt, setPrintSlipApt] = useState<Patient | null>(null)

  // Symptom logger state
  const [painLevel, setPainLevel] = useState<number>(5)
  const [affectedRegion, setAffectedRegion] = useState<string>("Lumbar Spine (L4-L5)")
  const [symptomDescription, setSymptomDescription] = useState<string>("")
  const [isLoggingSymptom, setIsLoggingSymptom] = useState(false)

  // Daily Rehab Checklist state
  const [rehabTasks, setRehabTasks] = useState([
    { id: 1, title: "Morning Cat-Cow Spinal Decompression (10 mins)", done: false },
    { id: 2, title: "15-Min Cold Ice Compression Therapy on Lumbar Region", done: false },
    { id: 3, title: "Ergonomic Lumbar Support & Posture Break (Walk 30 mins)", done: false },
    { id: 4, title: "Hydration Goal: 2.5 Liters Water for Intervertebral Discs", done: false },
  ])

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  // 24h Pre-Appointment Reminders state
  const [reminders, setReminders] = useState<AppointmentReminder[]>([])

  // PWA beforeinstallprompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
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
        title: "Install Mobile App",
        description: "To install: Tap your browser menu (⋮ or Share) and select 'Add to Home Screen'.",
      })
      return
    }

    deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice
    if (choiceResult.outcome === "accepted") {
      toast({
        title: "App Installed!",
        description: "The Gonstead Patient App has been installed on your home screen.",
      })
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  // Auth check & load appointments from Firestore
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

      setPatientName(uName)
      setPatientEmail(uEmail)
      setPatientPhone(uPhone)
      setPatientUid(uUid)

      loadAppointments(uEmail, uPhone, uUid, uName)
    }
  }, [router])

  const loadAppointments = async (email?: string, phone?: string, uid?: string, name?: string) => {
    setIsLoading(true)
    const list = await getPatientAppointmentsFromFirestore(
      email || patientEmail,
      phone || patientPhone,
      uid || patientUid,
      name || patientName
    )
    setAppointments(list)

    // Check for 24h pre-appointment reminders
    const rems = checkUpcomingPreAppointmentReminders(list, name || patientName)
    setReminders(rems)

    setIsLoading(false)
  }

  const handleLogout = async () => {
    await logoutPatient()
    toast({
      title: "Signed Out",
      description: "You have been signed out of your patient portal.",
    })
    router.replace("/patient/auth")
  }

  const handleCancelAppointment = async (aptId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    setIsUpdatingApt(true)
    const res = await updatePatientFirestore(aptId, { status: "cancelled" })
    setIsUpdatingApt(false)

    if (res) {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment status has been updated to cancelled.",
      })
      loadAppointments()
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update appointment status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate) {
      toast({
        title: "Date Required",
        description: "Please select a valid new appointment date.",
        variant: "destructive",
      })
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
      toast({
        title: "Rescheduled Successfully!",
        description: `Appointment updated to ${rescheduleDate} at ${rescheduleTime}.`,
      })
      setRescheduleApt(null)
      loadAppointments()
    } else {
      toast({
        title: "Reschedule Failed",
        description: "Could not update appointment date.",
        variant: "destructive",
      })
    }
  }

  const handleLogSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (appointments.length === 0) {
      toast({
        title: "No Active Booking",
        description: "Please book an appointment first to attach pre-visit symptom logs.",
        variant: "destructive",
      })
      return
    }

    const latestApt = appointments[0]
    setIsLoggingSymptom(true)
    const res = await updatePatientFirestore(latestApt.id, {
      chief_complaint: `[Pre-Visit Log] Pain Level ${painLevel}/10 in ${affectedRegion}: ${symptomDescription || "No additional notes"}`,
    })
    setIsLoggingSymptom(false)

    if (res) {
      toast({
        title: "Symptom Notes Saved!",
        description: "Dr. Bashir Khan has received your pre-visit spinal complaint update.",
      })
      setSymptomDescription("")
      loadAppointments()
    } else {
      toast({
        title: "Logging Failed",
        description: "Could not save symptom log. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleRehabTask = (id: number) => {
    setRehabTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  const completedRehabCount = rehabTasks.filter((t) => t.done).length

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus =
      filterStatus === "all" || apt.status?.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointment_date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.session_type?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const upcomingAppointment = appointments.find(
    (a) => a.status?.toLowerCase() === "confirmed" || a.status?.toLowerCase() === "scheduled"
  )

  const completedCount = appointments.filter((a) => a.status?.toLowerCase() === "completed").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col">
      {/* HEADER BAR */}
      <header className="bg-gradient-to-r from-[#173e4d] via-[#245064] to-[#1a4454] border-b border-white/10 text-white shadow-xl sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#2a9d8f] to-[#38b2a0] flex items-center justify-center shadow-lg font-bold text-lg text-white">
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{patientName}</h1>
                <Badge className="bg-[#2a9d8f] text-white hover:bg-[#238a7a] text-xs">Patient Portal</Badge>
              </div>
              <p className="text-xs text-white/70">{patientEmail || "Gonstead Chiropractic Patient"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={handleInstallPwa}
              variant="outline"
              size="sm"
              className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold shadow-sm"
              title="Install Patient App to Home Screen"
            >
              <Smartphone className="h-4 w-4 mr-1 text-emerald-400" />
              <span>Install App</span>
            </Button>

            <Button
              onClick={() => setIsBookModalOpen(true)}
              className="bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] hover:from-[#238a7a] hover:to-[#1d7366] text-white font-medium text-xs sm:text-sm shadow-md"
            >
              <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
              Book Appointment
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 hidden sm:flex"
            >
              <Home className="h-4 w-4 mr-1" />
              Site Home
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-red-300 hover:text-red-100 hover:bg-red-500/20"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 24-HOUR PRE-APPOINTMENT REMINDER BANNER */}
      {reminders.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 pt-4">
          <div className="space-y-2">
            {reminders.map((rem, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-amber-400/40 text-amber-200 shadow-xl flex items-center justify-between gap-4 backdrop-blur-md animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/30 text-amber-300">
                    <BellRing className="h-6 w-6 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-100 flex items-center gap-2">
                      Upcoming Appointment Alert ({rem.isTomorrow ? "Tomorrow" : "Today"})
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">{rem.message}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsBookModalOpen(true)}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs"
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* QUICK STATS CARDS BAR */}
      <section className="container mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Next Appointment */}
          <Card className="bg-slate-800/80 border-slate-700 text-slate-100 shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Next Appointment</p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">
                  {upcomingAppointment
                    ? `${upcomingAppointment.appointment_date} (${upcomingAppointment.appointment_time || "10:00 AM"})`
                    : "No Upcoming Visit"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stat 2: Completed Sessions */}
          <Card className="bg-slate-800/80 border-slate-700 text-slate-100 shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Completed Adjustments</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{completedCount} Sessions</p>
              </div>
            </CardContent>
          </Card>

          {/* Stat 3: Spine Health Score */}
          <Card className="bg-slate-800/80 border-slate-700 text-slate-100 shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Spine Alignment Index</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xl font-bold text-emerald-400">92%</p>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                    Optimal
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stat 4: Primary Specialist */}
          <Card className="bg-slate-800/80 border-slate-700 text-slate-100 shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Gonstead Specialist</p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">Dr. Bashir Khan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="container mx-auto px-4 sm:px-6 py-6 flex-1">
        <Tabs defaultValue="appointments" className="w-full space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-5 max-w-4xl">
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm"
            >
              <Calendar className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Appointments
            </TabsTrigger>
            <TabsTrigger
              value="rehab"
              className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm"
            >
              <Activity className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Daily Care
            </TabsTrigger>
            <TabsTrigger
              value="symptoms"
              className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm"
            >
              <Thermometer className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Pre-Visit Intake
            </TabsTrigger>
            <TabsTrigger
              value="records"
              className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Spine Records
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white text-slate-300 font-medium text-xs sm:text-sm"
            >
              <User className="h-4 w-4 mr-1.5 hidden sm:inline" />
              My Profile
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: APPOINTMENTS & SELF-SERVICE */}
          <TabsContent value="appointments" className="space-y-4">
            <Card className="bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#2a9d8f]" />
                    Personal Appointment History & Actions
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    Manage your visits, reschedule dates, cancel appointments, or print confirmation slips.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Status Filter Buttons */}
                  <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-700 text-xs">
                    {["all", "scheduled", "completed", "cancelled"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                          filterStatus === st
                            ? "bg-[#2a9d8f] text-white font-semibold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => loadAppointments()}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs"
                    title="Refresh List"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#2a9d8f]" />
                    <p className="text-sm">Loading your Firestore appointment history...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-700 rounded-xl p-6">
                    <Calendar className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-base font-semibold text-slate-300">No appointments found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      You haven't scheduled any appointments matching this filter yet. Click below to book your first Gonstead adjustment.
                    </p>
                    <Button
                      onClick={() => setIsBookModalOpen(true)}
                      className="mt-4 bg-[#2a9d8f] hover:bg-[#238a7a] text-white text-xs"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Book New Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredAppointments.map((apt) => {
                      const st = apt.status?.toLowerCase() || "scheduled"
                      const badgeVariant =
                        st === "completed"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : st === "confirmed" || st === "scheduled"
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                          : st === "cancelled"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"

                      return (
                        <div
                          key={apt.id}
                          className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs capitalize ${badgeVariant}`}>{st}</Badge>
                              <span className="text-xs font-mono text-slate-400">Ref: #{apt.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <p className="text-base font-bold text-white capitalize">
                              {apt.session_type === "video" ? "Video Consultation" : "In-Clinic Gonstead Adjustment"}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-[#2a9d8f]" />
                                {apt.appointment_date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-[#2a9d8f]" />
                                {apt.appointment_time || "10:00 AM"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5 text-[#2a9d8f]" />
                                Dr. Bashir Khan
                              </span>
                            </div>
                            {apt.chief_complaint && (
                              <p className="text-xs text-slate-300 mt-1 italic">
                                "{apt.chief_complaint}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs"
                              onClick={() => setPrintSlipApt(apt)}
                              title="Print Appointment Slip"
                            >
                              <Printer className="h-3.5 w-3.5 sm:mr-1" />
                              <span className="hidden sm:inline">Slip</span>
                            </Button>

                            {st === "scheduled" || st === "confirmed" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"
                                  onClick={() => {
                                    setRescheduleApt(apt)
                                    setRescheduleDate(apt.appointment_date)
                                    setRescheduleTime(apt.appointment_time || "10:00 AM")
                                  }}
                                >
                                  <Edit3 className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Reschedule</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 text-xs"
                                  onClick={() => handleCancelAppointment(apt.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Cancel</span>
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

          {/* TAB 2: DAILY REHAB & CARE TRACKER */}
          <TabsContent value="rehab" className="space-y-4">
            <Card className="bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#2a9d8f]" />
                    Daily Spine Rehab & Hydration Tracker
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    Track your daily post-adjustment care exercises prescribed by Dr. Bashir Khan.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-400">
                    {Math.round((completedRehabCount / rehabTasks.length) * 100)}%
                  </span>
                  <p className="text-[10px] text-slate-400">Daily Goal</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {rehabTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => toggleRehabTask(t.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        t.done
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                          : "bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {t.done ? (
                        <CheckSquare className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${t.done ? "line-through opacity-80" : ""}`}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PRE-VISIT SYMPTOM & PAIN INTAKE */}
          <TabsContent value="symptoms" className="space-y-4">
            <Card className="bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-[#2a9d8f]" />
                  Pre-Visit Symptom & Pain Level Intake
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">
                  Log your current spinal pain rating so Dr. Bashir Khan can prepare your adjustment plan before your visit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogSymptomSubmit} className="space-y-5">
                  {/* Pain Level Rating */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white text-sm font-semibold">Current Pain Level (1 to 10)</Label>
                      <Badge className="bg-[#2a9d8f] text-white text-sm font-bold">{painLevel} / 10</Badge>
                    </div>
                    <div className="grid grid-cols-10 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPainLevel(num)}
                          className={`py-2 rounded-lg font-bold text-xs transition-all ${
                            painLevel === num
                              ? num > 7
                                ? "bg-rose-600 text-white shadow-lg"
                                : num > 4
                                ? "bg-amber-500 text-white shadow-lg"
                                : "bg-emerald-500 text-white shadow-lg"
                              : "bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Affected Spine Region */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-semibold">Primary Affected Spine Region</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Lumbar Spine (L4-L5 Lower Back)",
                        "Cervical Spine (Neck & Shoulders)",
                        "Thoracic Spine (Mid Back)",
                        "Sciatica & Sacroiliac Joint",
                      ].map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setAffectedRegion(reg)}
                          className={`p-3 text-left text-xs font-semibold rounded-xl border transition-all ${
                            affectedRegion === reg
                              ? "bg-[#2a9d8f]/20 border-[#2a9d8f] text-white"
                              : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Description */}
                  <div className="space-y-2">
                    <Label htmlFor="symptom-notes" className="text-white text-sm font-semibold">
                      Symptom Details / Aggravating Movements
                    </Label>
                    <Input
                      id="symptom-notes"
                      value={symptomDescription}
                      onChange={(e) => setSymptomDescription(e.target.value)}
                      placeholder="e.g., Pain worsens when sitting for long periods, stiffness in morning..."
                      className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoggingSymptom}
                    className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white font-semibold py-3 rounded-xl shadow-lg"
                  >
                    {isLoggingSymptom ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending to Doctor...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Send Pre-Visit Symptom Note to Dr. Bashir Khan</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: SPINE RECORDS */}
          <TabsContent value="records" className="space-y-4">
            <Card className="bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#2a9d8f]" />
                  Spinal Evaluation & Gonstead Subluxation Analysis
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">
                  Clinical spinal evaluation notes recorded by Dr. Bashir Khan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      Active Treatment Plan
                    </Badge>
                    <span className="text-xs text-slate-400">Dr. Bashir Khan</span>
                  </div>
                  <h3 className="font-bold text-white text-base">Gonstead Full-Spine Analysis & Subluxation Report</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Patient presents with mild L4-L5 lumbar spinal subluxation and cervical curvature imbalance. Recommended 6 to 8 precision Gonstead adjustments, ergonomic lumbar support, and daily neck extension stretches.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: MY PROFILE */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-[#2a9d8f]" />
                  Patient Profile Credentials
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">
                  Your registered patient details stored securely in Firestore.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-medium">Full Name</span>
                  <p className="text-sm font-bold text-white mt-1">{patientName}</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-medium">Registered Email</span>
                  <p className="text-sm font-bold text-white mt-1">{patientEmail || "Not Provided"}</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-medium">Phone Number</span>
                  <p className="text-sm font-bold text-white mt-1">{patientPhone || "Not Provided"}</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-medium">Firebase Auth ID</span>
                  <p className="text-xs font-mono text-slate-300 mt-1 truncate">{patientUid || "Logged In"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* RESCHEDULE DIALOG MODAL */}
      <Dialog open={!!rescheduleApt} onOpenChange={(open) => !open && setRescheduleApt(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2a9d8f]" />
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-slate-300 font-medium">Select New Date *</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-300 font-medium">Select Preferred Time *</Label>
              <Input
                type="text"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                placeholder="e.g. 11:30 AM"
                className="bg-slate-800 border-slate-700 text-white text-xs"
              />
            </div>

            <Button
              onClick={handleSaveReschedule}
              disabled={isUpdatingApt}
              className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white font-semibold"
            >
              {isUpdatingApt ? "Updating Date..." : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PRINTABLE APPOINTMENT SLIP MODAL */}
      <Dialog open={!!printSlipApt} onOpenChange={(open) => !open && setPrintSlipApt(null)}>
        <DialogContent className="bg-white text-slate-900 max-w-lg p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-xl text-[#173e4d] flex items-center justify-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#2a9d8f]" />
              Gonstead Chiropractic Clinic
            </DialogTitle>
            <p className="text-center text-xs text-slate-500">Official Patient Appointment Slip</p>
          </DialogHeader>

          {printSlipApt && (
            <div className="space-y-4 my-3 text-xs border-y py-4 border-slate-200">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Patient Name:</span>
                <span className="font-bold text-slate-900">{patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Reference ID:</span>
                <span className="font-mono text-slate-900">#{printSlipApt.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Date & Time:</span>
                <span className="font-bold text-[#2a9d8f]">
                  {printSlipApt.appointment_date} at {printSlipApt.appointment_time || "10:00 AM"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Specialist:</span>
                <span className="font-bold text-slate-900">Dr. Bashir Khan</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Session Type:</span>
                <span className="capitalize text-slate-900">
                  {printSlipApt.session_type === "video" ? "Video Consultation" : "In-Clinic Gonstead Adjustment"}
                </span>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800">Clinic Guidelines:</p>
                <p>• Please arrive 10 minutes prior to your scheduled adjustment time.</p>
                <p>• Bring previous spine X-rays or MRI reports if available.</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => window.print()}
              className="w-full bg-[#2a9d8f] hover:bg-[#238a7a] text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
            <Button
              onClick={() => setPrintSlipApt(null)}
              variant="outline"
              className="border-slate-300 text-slate-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QUICK BOOKING DIALOG MODAL */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-100 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#2a9d8f]" />
              Schedule Gonstead Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <EnhancedAppointmentBooking />
          </div>
        </DialogContent>
      </Dialog>

      {/* REAL-TIME 1-ON-1 PATIENT-DOCTOR CHAT WIDGET */}
      <PatientChatWidget
        patientId={patientUid || patientEmail || patientPhone || "patient_guest"}
        patientName={patientName}
        patientEmail={patientEmail}
        patientPhone={patientPhone}
      />
    </div>
  )
}
