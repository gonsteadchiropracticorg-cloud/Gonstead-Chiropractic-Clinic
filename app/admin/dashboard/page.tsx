"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Users,
  FileText,
  Download,
  Eye,
  Phone,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  LogOut,
  Search,
  Moon,
  Sun,
  Video,
  MapPin,
  PillIcon as Prescription,
  Timer,
  UserPlus,
  Edit3,
  Plus,
  Minus,
  Cloud,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getPatients,
  updatePatient,
  deletePatient,
  createPatient,
  signOutAdmin,
  getCurrentUser,
  type Patient,
} from "@/lib/supabase"
import Image from "next/image"
import { WeatherWidget } from "@/components/weather-widget"
import { EnhancedLoadingPage } from "@/components/loading-spinner"
import AdminSidebar from "@/components/AdminSidebar"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false)
  const [isVideoCallDialogOpen, setIsVideoCallDialogOpen] = useState(false)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterUrgency, setFilterUrgency] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [patientCount, setPatientCount] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  const [clinicLocation, setClinicLocation] = useState({
    address: "Near Police Station, Tehsil Road, Nowshera",
    coordinates: { lat: 34.0153, lng: 71.9804 },
    mapUrl: "https://maps.app.goo.gl/8pJ9o2hCPtGY3XtD9",
  })
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedSessions: 0,
    emergencyPatients: 0,
  })
  const [viewedPatients, setViewedPatients] = useState<Set<string>>(new Set())
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    email: "",
    session_type: "in_clinic" as "in_clinic" | "video",
    appointment_date: "",
    urgency: "normal" as "normal" | "urgent" | "emergency",
    payment_method: "cash" as "cash" | "jazzcash" | "easypaisa",
    notes: "",
  })
  
  // Prescription dialog state variables
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false)
  const [prescriptionNotes, setPrescriptionNotes] = useState("")
  const [prescriptionMedicine, setPrescriptionMedicine] = useState("")
  const [chiropracticSuggestions, setChiropracticSuggestions] = useState<string[]>([
    "Apply ice for 15-20 minutes, 3 times daily",
    "Gentle neck stretches as demonstrated",
    "Maintain proper posture while sitting",
    "Sleep with proper pillow support",
  ])
  const [newSuggestion, setNewSuggestion] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)


  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Update current time every second with 12-hour format (client-side only)
  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])


  // Helper function to format time in 12-hour format
  const formatTime12Hour = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Update patient count
  useEffect(() => {
    setPatientCount(patients.length)
  }, [patients])

  // Load viewed patients from localStorage on component mount
  useEffect(() => {
    const savedViewedPatients = localStorage.getItem('viewedPatients')
    console.log('Loading viewed patients from localStorage:', savedViewedPatients)
    if (savedViewedPatients) {
      try {
        const parsedViewed = JSON.parse(savedViewedPatients)
        console.log('Parsed viewed patients:', parsedViewed)
        setViewedPatients(new Set(parsedViewed))
      } catch (error) {
        console.error('Error parsing viewed patients from localStorage:', error)
      }
    }
  }, [])

  // Save viewed patients to localStorage whenever it changes (skip initial empty set)
  useEffect(() => {
    if (viewedPatients.size > 0) {
      const viewedArray = [...viewedPatients]
      console.log('Saving viewed patients to localStorage:', viewedArray)
      localStorage.setItem('viewedPatients', JSON.stringify(viewedArray))
    }
  }, [viewedPatients])

  useEffect(() => {
    checkAuthAndLoadData()
    
    // Listen for new appointments from the booking form
    const handleNewAppointment = (event: CustomEvent) => {
      const newPatient = event.detail
      setPatients(prev => [newPatient, ...prev])
      // Update stats
      const today = new Date().toDateString()
      setStats(prev => ({
        ...prev,
        totalPatients: prev.totalPatients + 1,
        todayAppointments: new Date(newPatient.appointment_date).toDateString() === today 
          ? prev.todayAppointments + 1 
          : prev.todayAppointments,
        pendingAppointments: newPatient.status === 'pending' 
          ? prev.pendingAppointments + 1 
          : prev.pendingAppointments,
        emergencyPatients: newPatient.urgency === 'emergency' 
          ? prev.emergencyPatients + 1 
          : prev.emergencyPatients
      }))
      toast({
        title: "📋 New Patient Registration",
        description: `${newPatient.name} has successfully scheduled an appointment for ${new Date(newPatient.appointment_date).toLocaleDateString()}`,
      })
    }

    // Add event listener for real-time appointment updates
    window.addEventListener('newAppointment', handleNewAppointment as EventListener)
    
    // Cleanup
    return () => {
      window.removeEventListener('newAppointment', handleNewAppointment as EventListener)
    }
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      console.log("Dashboard: Checking authentication...")

      // Check localStorage first to prevent loops
      const isAuthenticated = localStorage.getItem("admin_authenticated")
      const storedEmail = localStorage.getItem("admin_email")

      if (isAuthenticated === "true" && storedEmail) {
        console.log("Dashboard: Found localStorage auth, proceeding...")
        setAuthChecked(true)
        await loadPatients()
        return
      }

      // If no localStorage, check Supabase auth
      const { user, error } = await getCurrentUser()

      if (error) {
        console.error("Dashboard: Auth error:", error)
        throw error
      }

      if (!user) {
        console.log("Dashboard: No user found, redirecting to auth")
        router.replace("/admin/auth")
        return
      }

      console.log("Dashboard: User authenticated:", user.email)

      // Store auth in localStorage to prevent future loops
      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_email", user.email || "")

      setAuthChecked(true)
      await loadPatients()
    } catch (error) {
      console.error("Dashboard: Auth check failed:", error)
      // Clear localStorage on auth failure
      localStorage.removeItem("admin_authenticated")
      localStorage.removeItem("admin_email")
      router.replace("/admin/auth")
    }
  }

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      console.log("Dashboard: Loading patients...")
      const { data, error } = await getPatients()

      if (error) {
        console.error("Dashboard: Error loading patients:", error)
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        })
        return
      }

      const patientsData = data || []
      console.log("Dashboard: Loaded patients:", patientsData.length)
      setPatients(patientsData)

      // Calculate stats
      const today = new Date().toDateString()
      const newStats = {
        totalPatients: patientsData.length,
        todayAppointments: patientsData.filter((p) => new Date(p.appointment_date).toDateString() === today).length,
        pendingAppointments: patientsData.filter((p) => p.status === "pending").length,
        completedSessions: patientsData.reduce((sum, p) => sum + (p.sessions_completed || 0), 0),
        emergencyPatients: patientsData.filter((p) => p.urgency === "emergency").length,
      }
      setStats(newStats)
    } catch (error) {
      console.error("Dashboard: Error loading patients:", error)
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePatient = async (patientId: string) => {
    try {
      await deletePatient(patientId)
      await loadPatients()
      toast({
        title: "Patient Deleted",
        description: "Patient record has been permanently removed",
      })
    } catch (error) {
      console.error("Error deleting patient:", error)
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePatientStatus = async (patientId: string, newStatus: Patient["status"]) => {
    try {
      const updateData: any = {
        status: newStatus,
      }

      // If status is completed, update sessions and last visit
      if (newStatus === "completed") {
        const patient = patients.find((p) => p.id === patientId)
        updateData.sessions_completed = (patient?.sessions_completed || 0) + 1
        updateData.last_visit = new Date().toISOString()
      }

      await updatePatient(patientId, updateData)
      await loadPatients()
      toast({
        title: "✅ Status Successfully Updated",
        description: `Patient status has been changed to ${newStatus.toUpperCase()} and records updated`,
      })
    } catch (error) {
      console.error("Error updating patient:", error)
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      })
    }
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const patientData = {
        ...newPatient,
        status: "pending",
        sessions_completed: 0,
        booking_source: "admin_dashboard", // Mark as admin-created
      }
      const newPatientRecord = await createPatient(patientData)
      
      // Mark admin-created patients as viewed immediately (no red dot needed)
      if (newPatientRecord?.id) {
        setViewedPatients(prev => new Set([...prev, newPatientRecord.id]))
      }
      
      await loadPatients()
      setIsAddPatientDialogOpen(false)
      setNewPatient({
        name: "",
        phone: "",
        email: "",
        session_type: "in_clinic",
        appointment_date: "",
        urgency: "normal",
        payment_method: "cash",
        notes: "",
      })
      toast({
        title: "✅ Patient Successfully Added",
        description: `${newPatient.name} has been registered and added to the system`,
      })
    } catch (error) {
      console.error("Error adding patient:", error)
      toast({
        title: "Error",
        description: "Failed to add patient",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("admin_authenticated")
      localStorage.removeItem("admin_email")

      await signOutAdmin()
      router.replace("/admin/auth")
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const generatePrescription = (patient: Patient) => {
    // Check if patient has an existing prescription
    const hasExistingPrescription = patient.prescription_generated || (patient.prescription_count ?? 0) > 0
    
    if (hasExistingPrescription) {
      // Show existing prescription with option to generate new one
      showExistingPrescription(patient)
    } else {
      // Generate new prescription
      createNewPrescription(patient)
    }
  }
  
  const showExistingPrescription = (patient: Patient) => {
    // Load existing prescription data
    setPrescriptionNotes(patient.notes || "")
    setPrescriptionMedicine("")
    setChiropracticSuggestions([
      "Apply ice for 15-20 minutes, 3 times daily",
      "Gentle neck stretches as demonstrated",
      "Maintain proper posture while sitting",
      "Sleep with proper pillow support",
    ])
    setSelectedPatient(patient)
    setIsPrescriptionDialogOpen(true)
  }
  
  const createNewPrescription = (patient: Patient) => {
    // Reset prescription data for new prescription
    setPrescriptionNotes(patient.notes || "")
    setPrescriptionMedicine("")
    setChiropracticSuggestions([
      "Apply ice for 15-20 minutes, 3 times daily",
      "Gentle neck stretches as demonstrated",
      "Maintain proper posture while sitting",
      "Sleep with proper pillow support",
    ])
    setSelectedPatient(patient)
    setIsPrescriptionDialogOpen(true)
  }
  
  const generateNewPrescription = () => {
    if (selectedPatient) {
      // Clear existing prescription data and create new one
      setPrescriptionNotes(selectedPatient.notes || "")
      setPrescriptionMedicine("")
      setChiropracticSuggestions([
        "Apply ice for 15-20 minutes, 3 times daily",
        "Gentle neck stretches as demonstrated",
        "Maintain proper posture while sitting",
        "Sleep with proper pillow support",
      ])
      toast({
        title: "New Prescription Started",
        description: "You can now create a new prescription for this patient",
      })
    }
  }

  const addChiropracticSuggestion = () => {
    if (newSuggestion.trim()) {
      setChiropracticSuggestions([...chiropracticSuggestions, newSuggestion.trim()])
      setNewSuggestion("")
    }
  }

  const removeChiropracticSuggestion = (index: number) => {
    setChiropracticSuggestions(chiropracticSuggestions.filter((_, i) => i !== index))
  }

  const downloadPrescriptionPDF = async () => {
    const element = document.getElementById("prescription-content")
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(
        `${selectedPatient?.name.replace(/\s+/g, "_")}_prescription_${new Date().toISOString().split("T")[0]}.pdf`,
      )

      // Update patient record to mark prescription as generated
      if (selectedPatient) {
        await updatePatient(selectedPatient.id, {
          prescription_generated: true,
          prescription_count: (selectedPatient.prescription_count || 0) + 1,
          last_prescription_date: new Date().toISOString()
        })
        await loadPatients() // Refresh the patient list
      }

      toast({
        title: "PDF Downloaded",
        description: "Prescription has been saved as PDF",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  const printPrescription = () => {
    const element = document.getElementById("prescription-content")
    if (!element) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
    <html>
      <head>
        <title>Prescription - ${selectedPatient?.name}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #000;
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const startVideoCall = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsVideoCallDialogOpen(true)
  }

  const generateDetailedReport = (patient: Patient) => {
    const report = `
GONSTEAD CHIROPRACTIC CLINIC
COMPREHENSIVE PATIENT REPORT
═══════════════════════════════════════════════════════════

PATIENT INFORMATION
──────────────────────────────────────────────────────────
Name: ${patient.name}
Phone: ${patient.phone}
Email: ${patient.email || "Not provided"}
Age: ${patient.demographics?.age || "Not specified"}
Gender: ${patient.demographics?.gender || "Not specified"}
Occupation: ${patient.demographics?.occupation || "Not specified"}
Emergency Contact: ${patient.demographics?.emergency_contact || "Not provided"}

APPOINTMENT DETAILS
──────────────────────────────────────────────────────────
Appointment Date: ${new Date(patient.appointment_date).toLocaleString()}
Session Type: ${patient.session_type === "in_clinic" ? "In-Clinic Gonstead Adjustment" : "Video Consultation"}
Status: ${patient.status.toUpperCase()}
Urgency Level: ${patient.urgency.toUpperCase()}
Payment Method: ${patient.payment_method.toUpperCase()}
Sessions Completed: ${patient.sessions_completed}
Last Visit: ${patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : "N/A"}

CLINICAL NOTES
──────────────────────────────────────────────────────────
Chief Complaint: ${patient.notes || "No specific complaints noted"}

Medical History: ${patient.medical_history || "No significant medical history recorded"}

TREATMENT PLAN
──────────────────────────────────────────────────────────
Diagnosis: ${patient.treatment_plan?.diagnosis || "Pending evaluation"}
Treatment Goals: ${patient.treatment_plan?.goals?.join(", ") || "To be determined"}
Progress Notes: ${patient.treatment_plan?.progress || "Initial assessment pending"}

═══════════════════════════════════════════════════════════
Report Generated: ${new Date().toLocaleString()}
Generated by: Dr. Bashir Khan - Gonstead Chiropractic Specialist
Clinic: Gonstead Chiropractic Clinic, ${clinicLocation.address}
Phone: +92 304 699 6267
═══════════════════════════════════════════════════════════
    `

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${patient.name.replace(/\s+/g, "_")}_report_${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateClinicLocation = (newLocation: any) => {
    setClinicLocation(newLocation)
    toast({
      title: "Location Updated",
      description: "Clinic location has been updated successfully",
    })
  }

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient)
    setIsEditPatientDialogOpen(true)
  }

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPatient) return

    try {
      await updatePatient(editingPatient.id, editingPatient)
      await loadPatients()
      setIsEditPatientDialogOpen(false)
      setEditingPatient(null)
      toast({
        title: "Patient Updated",
        description: "Patient information has been successfully updated",
      })
    } catch (error) {
      console.error("Error updating patient:", error)
      toast({
        title: "Error",
        description: "Failed to update patient information",
        variant: "destructive",
      })
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || patient.status === filterStatus
    const matchesUrgency = filterUrgency === "all" || patient.urgency === filterUrgency
    return matchesSearch && matchesStatus && matchesUrgency
  })

  // Show loading screen while checking auth
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(174,193,192)] flex items-center justify-center overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-gradient-to-r from-[#0d5c75]/20 to-[#2a9d8f]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-[60%] right-[15%] w-24 h-24 bg-gradient-to-r from-[rgb(227,252,236)]/20 to-[#0d5c75]/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-[20%] left-[20%] w-20 h-20 bg-gradient-to-r from-[#2a9d8f]/20 to-[rgb(227,252,236)]/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Main Loading Card */}
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 text-center">
            {/* Logo Section */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] rounded-full flex items-center justify-center shadow-xl">
                  <Image
                    src="/images/gonstead-chiropractic-logo-new.png"
                    alt="Gonstead Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[rgb(227,252,236)] rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Clinic Information */}
              <h1 className="text-lg font-bold text-[#0d5c75] mb-2 font-poppins">Gonstead Chiropractic</h1>
              <p className="text-sm font-semibold text-[#2a9d8f] mb-1">Dr. Bashir Khan</p>
              <p className={`text-xs text-gray-600 mb-1`}>Gonstead Certified Specialist</p>
              <p className={`text-xs text-[#0d5c75] mb-1`}>Excellence in Chiropractic Care</p>
              <p className={`text-xs text-[#0d5c75] font-semibold`}>+92 304 699 6267</p>
            </div>
            
            {/* Loading Animation */}
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-[#0d5c75]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#0d5c75] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-[#2a9d8f]/30 rounded-full"></div>
                <div className="absolute inset-2 border-2 border-[#2a9d8f] border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-[#0d5c75] font-bold text-sm">
                {!authChecked ? "🔐 Verifying Credentials" : "📊 Loading Dashboard"}
              </p>
              <p className="text-gray-600 text-[10px] mt-2">
                {!authChecked
                  ? "Securing your admin access..."
                  : "Preparing patient management system..."}
              </p>
            </div>
            
            {/* Professional Badge */}
            <div className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">
              ADMIN PORTAL
            </div>
          </div>
        </div>
        
        {/* Bottom Info */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
            <p className="text-xs text-gray-600 font-medium">Powered by Gonstead Management System</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <React.Fragment>

      <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-[rgb(220,230,229)]"}`}>
      {/* Compact Professional Header */}
      <header className="relative bg-white/20 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.10)] border-0 p-3 overflow-hidden mt-1 mx-4 rounded-xl">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/10 to-[#2a9d8f]/5 animate-pulse"></div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto flex justify-between items-center">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Compact Logo - Clickable for Sidebar */}
            <div className="relative group cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
              <div className="w-14 h-14 relative transition-transform duration-300 hover:scale-110">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d5c75]/10 to-[#2a9d8f]/10 rounded-full blur-lg group-hover:blur-md transition-all duration-300"></div>
                <Image
                  src="/images/gonstead-chiropractic-logo-new.png"
                  alt="Gonstead Chiropractic Logo"
                  fill
                  className="object-contain relative z-10 drop-shadow-lg"
                />
              </div>
              {/* Professional Badge */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-[rgb(227,252,236)] to-green-400 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Compact Title Section */}
            <div className="space-y-0.5">
              <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-poppins tracking-wide drop-shadow-sm`}>
                Dr. Bashir Khan
              </h1>
              <p className={`text-base font-semibold ${isDarkMode ? "text-gray-300" : "text-[#2a9d8f]"} drop-shadow-sm`}>
                Gonstead Chiropractic Specialist
              </p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[rgb(227,252,236)] rounded-full animate-pulse"></div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} font-medium tracking-wider`}>
                  PROFESSIONAL MANAGEMENT PORTAL
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Combined Time & Weather */}
          <div className="flex items-center gap-3">
            {/* Combined Time and Weather Display */}
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
              {/* Weather Section */}
              <div className="flex items-center gap-2 border-r border-white/20 pr-3">
                <Cloud className="h-4 w-4 text-gray-500" />
                <div>
                  <div className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                    28°C
                  </div>
                  <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Nowshera</div>
                </div>
              </div>
              
              {/* Time Section */}
              <div className="text-center">
                <div className="text-sm font-bold font-mono tracking-wider">
                  {typeof window !== 'undefined' ? formatTime12Hour(currentTime) : '--:--:-- --'}
                </div>
                <div className="text-xs opacity-80 font-medium">
                  {typeof window !== 'undefined' ? formatDate(currentTime) : '-- -- --'}
                </div>
              </div>
            </div>
            
            {/* Compact Theme Toggle */}
            <div className="flex items-center gap-1.5 p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-600" : "bg-[rgb(227,252,236)]"} transition-all duration-300`}>
                <Sun className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-green-500"}`} />
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="data-[state=checked]:bg-gray-600 scale-75"
              />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-100" : "bg-gray-200"} transition-all duration-300`}>
                <Moon className={`h-4 w-4 ${isDarkMode ? "text-blue-400" : "text-gray-400"}`} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* Quick Add Patient */}
            <Dialog open={isAddPatientDialogOpen} onOpenChange={setIsAddPatientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Quick Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add New Patient (Phone Call)
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="session_type">Session Type</Label>
                      <Select
                        value={newPatient.session_type}
                        onValueChange={(value: "in_clinic" | "video") =>
                          setNewPatient((prev) => ({ ...prev, session_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_clinic">In-Clinic</SelectItem>
                          <SelectItem value="video">Video Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select
                        value={newPatient.urgency}
                        onValueChange={(value: "normal" | "urgent" | "emergency") =>
                          setNewPatient((prev) => ({ ...prev, urgency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="appointment_date">Appointment Date & Time *</Label>
                    <Input
                      id="appointment_date"
                      type="datetime-local"
                      value={newPatient.appointment_date}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, appointment_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newPatient.notes}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Chief complaint, symptoms, etc."
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsAddPatientDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0d5c75] hover:bg-[#0a4a5c]">
                      Add Patient
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Location Settings */}
            <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white bg-transparent"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Clinic Location Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Clinic Address</Label>
                    <Input
                      id="address"
                      value={clinicLocation.address}
                      onChange={(e) => setClinicLocation((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={clinicLocation.coordinates.lat}
                        onChange={(e) =>
                          setClinicLocation((prev) => ({
                            ...prev,
                            coordinates: { ...prev.coordinates, lat: Number.parseFloat(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={clinicLocation.coordinates.lng}
                        onChange={(e) =>
                          setClinicLocation((prev) => ({
                            ...prev,
                            coordinates: { ...prev.coordinates, lng: Number.parseFloat(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mapUrl">Google Maps URL</Label>
                    <Input
                      id="mapUrl"
                      value={clinicLocation.mapUrl}
                      onChange={(e) => setClinicLocation((prev) => ({ ...prev, mapUrl: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        updateClinicLocation(clinicLocation)
                        setIsLocationDialogOpen(false)
                      }}
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c]"
                    >
                      Update Location
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-500 text-red-600 hover:bg-red-50 bg-transparent shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        {/* Enhanced Bottom Shadow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0d5c75]/20 via-[#2a9d8f]/30 to-[#0d5c75]/20 shadow-2xl"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0d5c75]/50 to-transparent"></div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card
            className={`border-[#0d5c75]/20 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gradient-to-br from-blue-50 to-blue-100"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                Total Patients
              </CardTitle>
              <Users className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                {stats.totalPatients}
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-blue-600"} mt-1`}>
                All registered patients
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-green-400/20 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gradient-to-br from-green-50 to-green-100"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-green-600"}`}>
                Today's Appointments
              </CardTitle>
              <Calendar className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-green-600"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-green-600"}`}>
                {stats.todayAppointments}
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-green-500"} mt-1`}>Scheduled for today</p>
            </CardContent>
          </Card>

          <Card
            className={`border-orange-500/20 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gradient-to-br from-orange-50 to-orange-100"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-orange-600"}`}>
                Pending
              </CardTitle>
              <Clock className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-orange-600"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-orange-600"}`}>
                {stats.pendingAppointments}
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-orange-500"} mt-1`}>
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-green-500/20 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gradient-to-br from-green-50 to-green-100"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-green-600"}`}>
                Completed Sessions
              </CardTitle>
              <CheckCircle className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-green-600"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-green-600"}`}>
                {stats.completedSessions}
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-green-500"} mt-1`}>Total treatments</p>
            </CardContent>
          </Card>

          <Card
            className={`border-red-500/20 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gradient-to-br from-red-50 to-red-100"}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-red-600"}`}>
                Emergency
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-red-600"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-red-600"}`}>
                {stats.emergencyPatients}
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-red-500"} mt-1`}>Urgent cases</p>
            </CardContent>
          </Card>
        </div>

        {/* Patient Management */}
        <Card className={`border-[#0d5c75]/20 shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
            <CardTitle className="flex items-center gap-2 font-poppins">
              <FileText className="h-5 w-5" />
              Patient Records Management
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                <Input
                  placeholder="Search patients by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>
                  No Patient Records Found
                </h3>
                <p className={`${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                  {patients.length === 0
                    ? "Patient appointments will appear here when booked through the website."
                    : "No patients match your current search criteria."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={`${isDarkMode ? "bg-gray-700" : "bg-[#F8F5F0]"}`}>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Patient Info
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Contact
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Appointment
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Status
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Type & Urgency
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Sessions
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-semibold`}>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className={`${isDarkMode ? "hover:bg-gray-700 border-gray-600" : "hover:bg-[#F8F5F0]/50"}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className={`font-semibold ${isDarkMode ? "text-white" : "text-[#0d5c75]"} flex items-center gap-2`}>
                                {patient.name}
                                {!viewedPatients.has(patient.id) && patient.booking_source !== 'admin_dashboard' && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="New patient booking from website" />
                                )}
                              </div>
                              <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                ID: {patient.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <a
                              href={`tel:${patient.phone}`}
                              className={`flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-[#0d5c75]"} hover:underline text-sm`}
                            >
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </a>
                            {patient.email && (
                              <a
                                href={`mailto:${patient.email}`}
                                className={`flex items-center gap-1 ${isDarkMode ? "text-blue-400" : "text-[#0d5c75]"} hover:underline text-sm`}
                              >
                                <Mail className="h-3 w-3" />
                                {patient.email}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {new Date(patient.appointment_date).toLocaleDateString()}
                            </div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {new Date(patient.appointment_date).toLocaleTimeString()}
                            </div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Payment: {patient.payment_method.toUpperCase()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge
                              variant={
                                patient.status === "completed"
                                  ? "default"
                                  : patient.status === "confirmed"
                                    ? "secondary"
                                    : patient.status === "cancelled"
                                      ? "destructive"
                                      : "outline"
                              }
                              className="text-xs"
                            >
                              {patient.status}
                            </Badge>
                            <Select
                              value={patient.status}
                              onValueChange={(value: Patient["status"]) => handleUpdatePatientStatus(patient.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant={patient.session_type === "in_clinic" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {patient.session_type === "in_clinic" ? "Clinic" : "Video"}
                            </Badge>
                            <Badge
                              variant={
                                patient.urgency === "emergency"
                                  ? "destructive"
                                  : patient.urgency === "urgent"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs ml-1"
                            >
                              {patient.urgency}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                              {patient.sessions_completed || 0}
                            </div>
                            {patient.last_visit && (
                              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Last: {new Date(patient.last_visit).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPatient(patient)
                                    // Mark patient as viewed
                                    setViewedPatients(prev => new Set([...prev, patient.id]))
                                  }}
                                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-[#0d5c75] font-poppins">
                                    Patient Record - {patient.name}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedPatient && (
                                  <div className="space-y-6">
                                    {/* Patient Information Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <Card>
                                        <CardHeader className="bg-[#0d5c75] text-white py-3">
                                        <CardTitle className="text-lg text-white">Contact Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-2">
                                          <div>
                                            <Label className="text-sm font-semibold">Name</Label>
                                            <p className="text-sm">{selectedPatient.name}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Phone</Label>
                                            <p className="text-sm">{selectedPatient.phone}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Email</Label>
                                            <p className="text-sm">{selectedPatient.email || "Not provided"}</p>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader className="bg-[#f3a800] text-white py-3">
                                        <CardTitle className="text-lg text-white">Appointment Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-2">
                                          <div>
                                            <Label className="text-sm font-semibold">Appointment ID</Label>
                                            <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded border">
                                              {selectedPatient.id}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Date & Time</Label>
                                            <p className="text-sm">
                                              {new Date(selectedPatient.appointment_date).toLocaleString()}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Type</Label>
                                            <p className="text-sm">
                                              {selectedPatient.session_type === "in_clinic"
                                                ? "In-Clinic Treatment"
                                                : "Video Consultation"}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Status</Label>
                                            <p className="text-sm capitalize">{selectedPatient.status}</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>

                                    <Card>
                                      <CardHeader className="bg-green-600 text-white py-3">
                                        <CardTitle className="text-lg text-white">Clinical Notes</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4">
                                        <div>
                                          <Label className="text-sm font-semibold">Chief Complaint</Label>
                                          <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                                            {selectedPatient.notes || "No complaints noted"}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Prescription Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Store patient data for prescription page
                                localStorage.setItem('prescriptionPatient', JSON.stringify(patient))
                                // Navigate to prescription page
                                router.push('/admin/prescription')
                              }}
                              className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
                              title="Generate Prescription"
                            >
                              <Prescription className="h-3 w-3" />
                            </Button>

                            {/* Video Call Button */}
                            {patient.session_type === "video" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startVideoCall(patient)}
                                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                title="Start Video Call"
                              >
                                <Video className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPatient(patient)}
                              className="border-[#f3a800] text-[#f3a800] hover:bg-[#f3a800] hover:text-white"
                              title="Edit Patient"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePatient(patient.id)}
                              className="bg-red-600 hover:bg-red-700"
                              title="Delete Patient"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      </div>

      {/* AdminSidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPath={pathname}
      />

      <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2">
              <div className="w-16 h-16 relative bg-transparent">
                <Image
                  src="/images/gonstead-logo-new.png"
                  alt="Gonstead Logo"
                  fill
                  className="object-contain"
                />
              </div>
              Gonstead Chiropractic Prescription - {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Editable Prescription Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="bg-[#4c9d90] text-white py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Treatment Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Enter treatment plan and diagnosis..."
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-[#2a9d8f] text-white py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Prescribed Medicine
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea
                  value={prescriptionMedicine}
                  onChange={(e) => setPrescriptionMedicine(e.target.value)}
                  placeholder="Enter prescribed medications..."
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Chiropractic Suggestions */}
          <Card className="mb-6">
            <CardHeader className="bg-green-600 text-white py-3">
              <CardTitle className="text-lg">Chiropractic Care Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {chiropracticSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{suggestion}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChiropracticSuggestion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newSuggestion}
                    onChange={(e) => setNewSuggestion(e.target.value)}
                    placeholder="Add new recommendation..."
                    className="flex-1"
                  />
                  <Button onClick={addChiropracticSuggestion} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Preview */}
          {selectedPatient && (
            <div
              id="prescription-content"
              style={{
                width: "210mm",
                minHeight: "297mm",
                margin: "0 auto",
                padding: "20mm",
                backgroundColor: "white",
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                lineHeight: "1.4",
                color: "#000",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              {/* Enhanced Professional Header */}
              <div
                style={{
                  padding: "20px 25px",
                  background: "linear-gradient(135deg, #0d5c75 0%, #2a9d8f 100%)",
                  borderRadius: "12px",
                  color: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 8px 32px rgba(13, 92, 117, 0.3)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Background pattern */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><defs><pattern id=%22grain%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><circle cx=%2250%22 cy=%2250%22 r=%221%22 fill=%22%23ffffff%22 fill-opacity=%220.1%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grain)%22/></svg>')",
                  opacity: 0.3
                }}></div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "20px", zIndex: 10, position: "relative" }}>
                  {/* Enhanced Logo */}
                  <div style={{
                    width: "70px",
                    height: "70px",
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
                  }}>
                    <img
                      src="/images/gonstead-logo-new.png"
                      alt="Gonstead Chiropractic Logo"
                      style={{ width: "50px", height: "50px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
                    />
                  </div>
                  
                  {/* Clinic Information */}
                  <div>
                    <h1 style={{ 
                      fontSize: "28px", 
                      margin: "0", 
                      fontWeight: "bold",
                      letterSpacing: "0.5px",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                    }}>
                      GONSTEAD CHIROPRACTIC CLINIC
                    </h1>
                    <p style={{ 
                      fontSize: "16px", 
                      margin: "2px 0 0 0", 
                      fontWeight: "600",
                      opacity: 0.95
                    }}>
                      Dr. Bashir Khan - Gonstead Certified Specialist
                    </p>
                    <p style={{ 
                      fontSize: "14px", 
                      margin: "2px 0 0 0", 
                      opacity: 0.9
                    }}>
                      Near Peshawar Model School, Tehsil Road, Nowshera
                    </p>
                  </div>
                </div>
                
                
                {/* Decorative elements */}
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  width: "40px",
                  height: "40px",
                  background: "radial-gradient(circle, rgba(243, 168, 0, 0.3) 0%, transparent 70%)",
                  borderRadius: "50%"
                }}></div>
                <div style={{
                  position: "absolute",
                  bottom: "-5px",
                  left: "-5px",
                  width: "30px",
                  height: "30px",
                  background: "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)",
                  borderRadius: "50%"
                }}></div>
              </div>

              {/* Rest of the prescription content with improved print styling */}
              {/* Patient Information */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div>
                  <h3 style={{ color: "#245064", fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
                    PATIENT INFORMATION
                  </h3>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                    <strong>Name:</strong> {selectedPatient.name}
                  </p>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                    <strong>Phone:</strong> {selectedPatient.phone}
                  </p>
                  <p style={{ margin: "0", fontSize: "13px" }}>
                    <strong>Email:</strong> {selectedPatient.email || "Not provided"}
                  </p>
                </div>
                <div>
                  <h3 style={{ color: "#245064", fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
                    PRESCRIPTION DETAILS
                  </h3>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                    <strong>Date:</strong> {typeof window !== 'undefined' ? new Date().toLocaleDateString() : '--/--/----'}
                  </p>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                    <strong>Time:</strong> {typeof window !== 'undefined' ? new Date().toLocaleTimeString() : '--:--:-- --'}
                  </p>
                  <p style={{ margin: "0", fontSize: "13px" }}>
                    <strong>Session:</strong>{" "}
                    {selectedPatient.session_type === "in_clinic" ? "In-Clinic" : "Video Consultation"}
                  </p>
                </div>
              </div>

              {/* Treatment Plan */}
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#245064",
                    margin: "0 0 10px 0",
                    padding: "8px 12px",
                    backgroundColor: "rgba(36,80,100,0.1)",
                    borderRadius: "5px",
                  }}
                >
                  TREATMENT PLAN & DIAGNOSIS
                </h3>
                <div
                  style={{
                    padding: "15px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    minHeight: "80px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    backgroundColor: "white",
                  }}
                >
                  {prescriptionNotes || selectedPatient.notes || "No specific treatment plan noted."}
                </div>
              </div>

              {/* Prescribed Medicine */}
              {prescriptionMedicine && (
                <div style={{ marginBottom: "20px" }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#2e9d8f",
                      margin: "0 0 10px 0",
                      padding: "8px 12px",
                      backgroundColor: "rgba(46,157,143,0.1)",
                      borderRadius: "5px",
                    }}
                  >
                    PRESCRIBED MEDICINE
                  </h3>
                  <div
                    style={{
                      padding: "15px",
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                      minHeight: "60px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      backgroundColor: "white",
                    }}
                  >
                    {prescriptionMedicine}
                  </div>
                </div>
              )}

              {/* Chiropractic Recommendations */}
              <div style={{ marginBottom: "30px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#228b22",
                    margin: "0 0 10px 0",
                    padding: "8px 12px",
                    backgroundColor: "rgba(34,139,34,0.1)",
                    borderRadius: "5px",
                  }}
                >
                  CHIROPRACTIC CARE RECOMMENDATIONS
                </h3>
                <div
                  style={{
                    padding: "15px",
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    backgroundColor: "white",
                  }}
                >
                  {chiropracticSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                      }}
                    >
                      <span
                        style={{
                          color: "#228b22",
                          fontWeight: "bold",
                          marginRight: "8px",
                          minWidth: "20px",
                        }}
                      >
                        {index + 1}.
                      </span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Section */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "30px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "2px solid #245064", marginBottom: "8px", height: "40px" }}></div>
                  <p style={{ fontWeight: "bold", color: "#245064", fontSize: "12px", margin: "0" }}>
                    Patient Signature
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "2px solid #245064", marginBottom: "8px", height: "40px" }}></div>
                  <p style={{ fontWeight: "bold", color: "#245064", fontSize: "12px", margin: "0" }}>
                    Doctor Signature
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  textAlign: "center",
                  background: "linear-gradient(135deg, #0d5c75 0%, #2a9d8f 100%)",
                  color: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  marginTop: "20px",
                }}
              >
                <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                  Bashir Khan Chiropractic - Licensed Gonstead Practitioner
                </p>
                <p style={{ margin: "0 0 5px 0" }}>
                  Specializing in Gonstead Chiropractic Technique | Spinal Analysis & Correction
                </p>
                <p style={{ margin: "0" }}>
                  Near Peshawar Model School, Tehsil Road, Nowshera | +92 304 699 6267 | Emergency consultations available
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6">
            {/* Smart Prescription Logic Display */}
            {selectedPatient && selectedPatient.prescription_generated && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Prescription previously generated on {selectedPatient.last_prescription_date ? new Date(selectedPatient.last_prescription_date).toLocaleDateString() : 'N/A'}</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsPrescriptionDialogOpen(false)}>
                Close
              </Button>
              
              {/* Generate New Prescription Button - Only show if patient has existing prescription */}
              {selectedPatient && (selectedPatient.prescription_generated || (selectedPatient.prescription_count ?? 0) > 0) && (
                <Button 
                  onClick={generateNewPrescription} 
                  className="bg-[#f3a800] hover:bg-[#e07c1c] text-white"
                  title="Generate a new prescription for this patient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Prescription
                </Button>
              )}
              
              <Button onClick={downloadPrescriptionPDF} className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={printPrescription} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white">
                <FileText className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditPatientDialogOpen} onOpenChange={setIsEditPatientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Patient Information
            </DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <form onSubmit={handleUpdatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingPatient.name}
                    onChange={(e) => setEditingPatient(prev => prev ? { ...prev, name: e.target.value } : null)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingPatient.email || ''}
                  onChange={(e) => setEditingPatient(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-session-type">Session Type</Label>
                  <Select
                    value={editingPatient.session_type}
                    onValueChange={(value: "in_clinic" | "video") =>
                      setEditingPatient(prev => prev ? { ...prev, session_type: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_clinic">In-Clinic</SelectItem>
                      <SelectItem value="video">Video Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-urgency">Urgency</Label>
                  <Select
                    value={editingPatient.urgency}
                    onValueChange={(value: "normal" | "urgent" | "emergency") =>
                      setEditingPatient(prev => prev ? { ...prev, urgency: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-appointment-date">Appointment Date & Time *</Label>
                <Input
                  id="edit-appointment-date"
                  type="datetime-local"
                  value={editingPatient.appointment_date}
                  onChange={(e) => setEditingPatient(prev => prev ? { ...prev, appointment_date: e.target.value } : null)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingPatient.notes || ''}
                  onChange={(e) => setEditingPatient(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Chief complaint, symptoms, etc."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditPatientDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0d5c75] hover:bg-[#0a4a5c]">
                  Update Patient
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Call Dialog */}
      <Dialog open={isVideoCallDialogOpen} onOpenChange={setIsVideoCallDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Consultation - {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">Video Call Interface</p>
                <p className="text-sm opacity-75">Integration with your preferred video platform</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Phone className="h-4 w-4 mr-2" />
                Accept Call
              </Button>
              <Button variant="destructive">
                <Phone className="h-4 w-4 mr-2" />
                Decline Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}
