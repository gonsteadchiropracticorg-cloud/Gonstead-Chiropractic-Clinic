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
  DollarSign,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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
import ScrollToTopButton from "@/components/ScrollToTopButton"
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Patient[]>([])
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Patient | null>(null)
  const [isPatientHistoryDialogOpen, setIsPatientHistoryDialogOpen] = useState(false)
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string>('')

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
      
      // Load from Supabase
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

      const supabasePatients = data || []
      console.log("Dashboard: Loaded Supabase patients:", supabasePatients.length)
      
      // Load from localStorage (for appointment bookings from the form)
      const localStoragePatients = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
      console.log("Dashboard: Loaded localStorage patients:", localStoragePatients.length)
      
      // Merge patients with proper deduplication - prioritize Supabase data
      const mergedPatients = [...supabasePatients]
      const existingIds = new Set(supabasePatients.map(p => p.id))
      
      // Add localStorage patients that aren't already in Supabase (by ID)
      localStoragePatients.forEach((localPatient: Patient) => {
        if (!existingIds.has(localPatient.id)) {
          mergedPatients.push(localPatient)
          existingIds.add(localPatient.id)
        }
      })
      
      console.log("Dashboard: Total merged patients:", mergedPatients.length)
      setPatients(mergedPatients)

      // Calculate stats from merged data
      const today = new Date().toDateString()
      const newStats = {
        totalPatients: mergedPatients.length,
        todayAppointments: mergedPatients.filter((p) => new Date(p.appointment_date).toDateString() === today).length,
        pendingAppointments: mergedPatients.filter((p) => p.status === "pending").length,
        completedSessions: mergedPatients.reduce((sum, p) => sum + (p.sessions_completed || 0), 0),
        emergencyPatients: mergedPatients.filter((p) => p.urgency === "emergency").length,
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
        status: "pending" as const,
        sessions_completed: 0,
        booking_source: "admin_dashboard", // Mark as admin-created
      }
      const newPatientRecord = await createPatient(patientData)
      
      // Mark admin-created patients as viewed immediately (no red dot needed)
      if (newPatientRecord?.id) {
        setViewedPatients(prev => new Set([...prev, newPatientRecord.id]))
        
        // Sync with localStorage for consistency across all components
        const existingPatients = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
        const updatedPatients = [newPatientRecord, ...existingPatients]
        localStorage.setItem("gonstead_patients", JSON.stringify(updatedPatients))
        
        // DO NOT automatically create medical records - only patient records
        // Medical records should be created separately via Medical History page
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
        description: `${newPatient.name} has been registered to patient records. Create medical record separately if needed.`,
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

    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "No patient selected for prescription",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate unique prescription ID
      const existingRecords = JSON.parse(localStorage.getItem("prescription_records") || "[]")
      const prescriptionId = `RX${String(existingRecords.length + 1).padStart(3, '0')}`
      
      // Set the prescription ID in state and make it available globally
      setCurrentPrescriptionId(prescriptionId)
      window.prescriptionId = prescriptionId
      
      // Force re-render of prescription content with ID
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
        `${selectedPatient.name.replace(/\s+/g, "_")}_prescription_${prescriptionId}_${new Date().toISOString().split("T")[0]}.pdf`,
      )

      // Create prescription record for tracking
      const prescriptionRecord = {
        id: prescriptionId,
        patientName: selectedPatient.name,
        phone: selectedPatient.phone,
        email: selectedPatient.email || '',
        prescriptionDate: new Date().toISOString(),
        medications: prescriptionMedicine || 'Chiropractic care recommendations',
        notes: prescriptionNotes || selectedPatient.notes || 'Generated from admin dashboard',
        patientId: selectedPatient.id,
        chiropracticSuggestions: chiropracticSuggestions,
        status: 'active',
        generatedBy: 'admin_dashboard'
      }

      // Save prescription record to localStorage
      const updatedRecords = [...existingRecords, prescriptionRecord]
      localStorage.setItem("prescription_records", JSON.stringify(updatedRecords))

      // Update patient record to mark prescription as generated
      await updatePatient(selectedPatient.id, {
        prescription_generated: true,
        prescription_count: (selectedPatient.prescription_count || 0) + 1,
        last_prescription_date: new Date().toISOString(),
        last_prescription_id: prescriptionId
      })
      await loadPatients() // Refresh the patient list

      toast({
        title: "✅ PDF Downloaded & Prescription Tracked",
        description: `Prescription ${prescriptionId} has been saved and is now trackable in Patient Tracking system`,
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

  const printPrescription = async () => {
    const element = document.getElementById("prescription-content")
    if (!element) return

    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "No patient selected for prescription",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate unique prescription ID
      const existingRecords = JSON.parse(localStorage.getItem("prescription_records") || "[]")
      const prescriptionId = `RX${String(existingRecords.length + 1).padStart(3, '0')}`
      
      // Set the prescription ID in state and make it available globally
      setCurrentPrescriptionId(prescriptionId)
      window.prescriptionId = prescriptionId
      
      // Force re-render of prescription content with ID
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Create prescription record for tracking
      const prescriptionRecord = {
        id: prescriptionId,
        patientName: selectedPatient.name,
        phone: selectedPatient.phone,
        email: selectedPatient.email || '',
        prescriptionDate: new Date().toISOString(),
        medications: prescriptionMedicine || 'Chiropractic care recommendations',
        notes: prescriptionNotes || selectedPatient.notes || 'Generated from admin dashboard',
        patientId: selectedPatient.id,
        chiropracticSuggestions: chiropracticSuggestions,
        status: 'active',
        generatedBy: 'admin_dashboard'
      }

      // Save prescription record to localStorage
      const updatedRecords = [...existingRecords, prescriptionRecord]
      localStorage.setItem("prescription_records", JSON.stringify(updatedRecords))

      // Update patient record to mark prescription as generated
      await updatePatient(selectedPatient.id, {
        prescription_generated: true,
        prescription_count: (selectedPatient.prescription_count || 0) + 1,
        last_prescription_date: new Date().toISOString(),
        last_prescription_id: prescriptionId
      })
      await loadPatients() // Refresh the patient list

      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      printWindow.document.write(`
      <html>
        <head>
          <title>Prescription ${prescriptionId} - ${selectedPatient.name}</title>
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

      toast({
        title: "✅ Prescription Printed & Tracked",
        description: `Prescription ${prescriptionId} has been printed and is now trackable in Patient Tracking system`,
      })
    } catch (error) {
      console.error("Error printing prescription:", error)
      toast({
        title: "Error",
        description: "Failed to print prescription",
        variant: "destructive",
      })
    }
  }

  const startVideoCall = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsVideoCallDialogOpen(true)
  }

  const generateDetailedReport = (patient: Patient) => {
    const currentDate = new Date().toLocaleDateString('en-GB')
    const reportTime = new Date().toLocaleTimeString('en-US', { hour12: true })
    
    const report = `
╔══════════════════════════════════════════════════════════════════╗
║                    GONSTEAD CHIROPRACTIC CLINIC                     ║
║                   SPINAL HEALTH ASSESSMENT REPORT                   ║
║                    Dr. Bashir Khan - DCP, Gonstead Certified        ║
║              Near Police Station, Tehsil Road, Nowshera, KPK        ║
║                         Pakistan | +92 304 699 6267                 ║
╚══════════════════════════════════════════════════════════════════╝

📋 PATIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient Name      : ${patient.name}
Contact Number    : ${patient.phone}
Email Address     : ${patient.email || "Not provided"}
Age / Gender      : ${patient.demographics?.age || "--"} years / ${patient.demographics?.gender || "Not specified"}
Profession        : ${patient.profession ? patient.profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Not specified"}
Occupation        : ${patient.demographics?.occupation || "Not specified"}
Report Date       : ${currentDate} at ${reportTime}

🏥 CLINICAL ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Appointment Date  : ${new Date(patient.appointment_date).toLocaleDateString('en-GB')} at ${new Date(patient.appointment_date).toLocaleTimeString('en-US', { hour12: true })}
Session Type      : ${patient.session_type === "in_clinic" ? "In-Clinic Gonstead Analysis & Adjustment" : "Video Consultation & Assessment"}
Treatment Status  : ${patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
Priority Level    : ${patient.urgency.charAt(0).toUpperCase() + patient.urgency.slice(1)}
Sessions Count    : ${patient.sessions_completed || 0} completed
Last Visit        : ${patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('en-GB') : "First consultation"}

📝 CHIEF COMPLAINT & CLINICAL FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${patient.notes || "Patient reports general spinal discomfort. Detailed assessment pending."}

🔬 GONSTEAD ANALYSIS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Diagnosis         : ${patient.treatment_plan?.diagnosis || "Initial spinal assessment pending"}
Treatment Plan    : ${patient.treatment_plan?.goals?.join(", ") || "Comprehensive Gonstead chiropractic care plan"}
Progress Status   : ${patient.treatment_plan?.progress || "Patient scheduled for detailed spinal analysis"}
Medical History   : ${patient.medical_history || "Medical history to be obtained during consultation"}

💊 PAYMENT & BILLING INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment Method    : ${patient.payment_method ? patient.payment_method.charAt(0).toUpperCase() + patient.payment_method.slice(1) : "Cash"}
Session Fee       : ${patient.session_type === "in_clinic" ? "PKR 1,500 (In-Clinic)" : "PKR 1,000 (Video)"}
Treatment Package : Available upon request


═══════════════════════════════════════════════════════════════════
                              PAGE 1 OF 2
═══════════════════════════════════════════════════════════════════


╔══════════════════════════════════════════════════════════════════╗
║                    GONSTEAD CHIROPRACTIC CLINIC                     ║
║                  TREATMENT RECOMMENDATIONS & PLAN                   ║
║                         Continued from Page 1                       ║
╚══════════════════════════════════════════════════════════════════╝

🎯 GONSTEAD TECHNIQUE APPROACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Comprehensive spinal analysis using Gonstead methodology
✓ Precise adjustment techniques for optimal spinal alignment
✓ Focus on root cause identification and correction
✓ Patient education on spinal health and posture

📊 RECOMMENDED TREATMENT SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1 (Relief)  : 2-3 sessions per week (Weeks 1-4)
Phase 2 (Correct) : 1-2 sessions per week (Weeks 5-8)
Phase 3 (Maintain): 1 session per week (Weeks 9-12)
Follow-up Care    : Monthly maintenance (as needed)

🏠 HOME CARE INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Apply ice for 15-20 minutes, 2-3 times daily (acute phase)
• Maintain proper posture during sitting and standing
• Perform gentle stretching exercises as demonstrated
• Sleep with proper spinal alignment (suitable pillow/mattress)
• Avoid prolonged static positions
• Stay adequately hydrated

⚠️  IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Follow prescribed treatment schedule for optimal results
• Report any unusual symptoms or concerns immediately
• Attend all scheduled appointments for best outcomes
• Emergency contact available 24/7 for urgent spinal issues

📞 CLINIC CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dr. Bashir Khan, DCP (Gonstead Certified)
Gonstead Chiropractic Clinic
Near Police Station, Tehsil Road
Nowshera, Khyber Pakhtunkhwa, Pakistan
Phone: +92 304 699 6267
Email: Available upon request

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report Generated: ${currentDate} at ${reportTime}
Doctor Signature: Dr. Bashir Khan, DCP
"Excellence in Gonstead Chiropractic Care - Your Spine, Our Priority"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              PAGE 2 OF 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // Helper function to get appointments for a specific date
  const getAppointmentsForDate = (date: string) => {
    const targetDate = new Date(date).toDateString()
    return patients.filter((p) => new Date(p.appointment_date).toDateString() === targetDate)
  }

  // Handle date selection from date picker
  const handleDateSelection = (date: string) => {
    setSelectedDate(date)
    const appointmentsForDate = getAppointmentsForDate(date)
    setSelectedDateAppointments(appointmentsForDate)
    
    // Apply filter to main patient list - use custom date filter
    setFilterStatus("custom_date")
    setFilterUrgency("all")
    setSearchTerm("")
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    toast({
      title: "📅 Date Filter Applied",
      description: `Showing appointments for ${formattedDate} (${appointmentsForDate.length} found)`,
    })
  }

  // Generate quick date options (Today, Tomorrow, etc.)
  const getQuickDateOptions = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    return [
      { label: "Today", date: today.toISOString().split('T')[0], count: getAppointmentsForDate(today.toISOString().split('T')[0]).length },
      { label: "Tomorrow", date: tomorrow.toISOString().split('T')[0], count: getAppointmentsForDate(tomorrow.toISOString().split('T')[0]).length },
      { label: "Day After Tomorrow", date: dayAfterTomorrow.toISOString().split('T')[0], count: getAppointmentsForDate(dayAfterTomorrow.toISOString().split('T')[0]).length },
      { label: "Next Week", date: nextWeek.toISOString().split('T')[0], count: getAppointmentsForDate(nextWeek.toISOString().split('T')[0]).length },
    ]
  }

  // Toggle function for expanding/collapsing action buttons with auto-close
  const toggleActionsExpanded = (patientId: string) => {
    setExpandedActions(prev => {
      const newExpanded = new Set()
      
      // If the clicked patient's menu is already open, close it
      // If it's closed, open only this one (auto-close all others)
      if (!prev.has(patientId)) {
        newExpanded.add(patientId)
      }
      // If patientId is already in prev, newExpanded remains empty (closes all)
      
      return newExpanded
    })
  }

  // Sort patients to show ALL new appointments at the top (both admin and website bookings)
  const sortedPatients = [...patients].sort((a, b) => {
    // First, prioritize ALL new appointments (those not viewed, regardless of booking source)
    const aIsNew = !viewedPatients.has(a.id)
    const bIsNew = !viewedPatients.has(b.id)
    
    if (aIsNew && !bIsNew) return -1
    if (!aIsNew && bIsNew) return 1
    
    // If both are new or both are viewed, sort by appointment date (newest first)
    return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
  })

  const filteredPatients = sortedPatients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Handle status filters
    let matchesStatus = true
    if (filterStatus === "today") {
      const today = new Date().toDateString()
      matchesStatus = new Date(patient.appointment_date).toDateString() === today
    } else if (filterStatus === "custom_date") {
      // Handle custom date filtering from date picker
      const targetDate = new Date(selectedDate).toDateString()
      matchesStatus = new Date(patient.appointment_date).toDateString() === targetDate
    } else if (filterStatus === "completed_sessions") {
      matchesStatus = (patient.sessions_completed || 0) > 0
    } else if (filterStatus !== "all") {
      matchesStatus = patient.status === filterStatus
    }
    
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
      {/* Mobile-Responsive Professional Header */}
      <header className="relative bg-white/20 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.10)] border-0 p-2 sm:p-3 overflow-hidden mt-1 mx-2 sm:mx-4 rounded-xl">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/10 to-[#2a9d8f]/5 animate-pulse"></div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto">
          {/* Mobile Layout - Stack on small screens */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            
            {/* Top Row: Logo and Title - Mobile Optimized */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Enhanced Clinical Logo - Clickable for Sidebar */}
              <div className="relative group cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                <div className="w-12 h-12 sm:w-16 sm:h-16 relative transition-transform duration-300 hover:scale-110">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0d5c75]/15 to-[#2a9d8f]/15 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-lg transition-all duration-300"></div>
                  {/* Enhanced Clinical Logo with Professional Frame */}
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-white/30 shadow-2xl flex items-center justify-center">
                    <Image
                      src="/images/gonstead-chiropractic-logo-new.png"
                      alt="Gonstead Chiropractic Clinical Logo"
                      width={32}
                      height={32}
                      className="sm:w-11 sm:h-11 object-contain relative z-10 drop-shadow-2xl"
                    />
                    {/* Clinical Badge */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                    {/* Professional Ring */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-[#0d5c75]/30 animate-pulse" style={{ animationDuration: '3s' }}></div>
                  </div>
                </div>
                {/* Professional Clinical Badge */}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white text-[8px] sm:text-xs font-bold rounded-full shadow-lg border border-white/50">
                  CLINIC
                </div>
              </div>
              
              {/* Compact Title Section - Mobile Optimized */}
              <div className="space-y-0.5 flex-1">
                <h1 className={`text-base sm:text-xl font-bold ${isDarkMode ? "text-white" : "text-[#0d5c75]"} font-poppins tracking-wide drop-shadow-sm`}>
                  Dr. Bashir Khan
                </h1>
                <p className={`text-sm sm:text-base font-semibold ${isDarkMode ? "text-gray-300" : "text-[#2a9d8f]"} drop-shadow-sm hidden xs:block`}>
                  Gonstead Chiropractic Specialist
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[rgb(227,252,236)] rounded-full animate-pulse"></div>
                  <p className={`text-[8px] sm:text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"} font-medium tracking-wider`}>
                    ADMIN PORTAL
                  </p>
                </div>
              </div>
              
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSidebarOpen(true)}
                className="sm:hidden p-2 hover:bg-white/10"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Row: Controls and Action Buttons - Mobile Responsive */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Combined Time and Weather Display - Mobile Optimized */}
              <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg ${isDarkMode ? "text-white" : "text-[#0d5c75]"} flex-1 sm:flex-none`}>
                {/* Weather Section - Hidden on very small screens */}
                <div className="hidden xs:flex items-center gap-1 sm:gap-2 border-r border-white/20 pr-2 sm:pr-3">
                  <Cloud className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <div>
                    <div className={`text-xs sm:text-sm font-bold ${isDarkMode ? "text-white" : "text-[#0d5c75]"}`}>
                      28°C
                    </div>
                    <div className={`text-[8px] sm:text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Nowshera</div>
                  </div>
                </div>
                
                {/* Time Section - Always visible */}
                <div className="text-center flex-1">
                  <div className="text-xs sm:text-sm font-bold font-mono tracking-wider">
                    {typeof window !== 'undefined' ? formatTime12Hour(currentTime) : '--:--:-- --'}
                  </div>
                  <div className="text-[8px] sm:text-xs opacity-80 font-medium">
                    {typeof window !== 'undefined' ? formatDate(currentTime).split(',')[0] : '-- --'}
                  </div>
                </div>
              </div>

              {/* Header Action Buttons - Restored to Top Right */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Add Patient Button */}
                <Dialog open={isAddPatientDialogOpen} onOpenChange={setIsAddPatientDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
                    >
                      <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Add Patient</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2 text-sm sm:text-base">
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        Add New Patient (Phone Call)
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPatient} className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm">Full Name *</Label>
                          <Input
                            id="name"
                            value={newPatient.name}
                            onChange={(e) => setNewPatient((prev) => ({ ...prev, name: e.target.value }))}
                            required
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm">Phone *</Label>
                          <Input
                            id="phone"
                            value={newPatient.phone}
                            onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
                            required
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newPatient.email}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="session_type" className="text-sm">Session Type</Label>
                          <Select
                            value={newPatient.session_type}
                            onValueChange={(value: "in_clinic" | "video") =>
                              setNewPatient((prev) => ({ ...prev, session_type: value }))
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_clinic">In-Clinic</SelectItem>
                              <SelectItem value="video">Video Consultation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="urgency" className="text-sm">Urgency</Label>
                          <Select
                            value={newPatient.urgency}
                            onValueChange={(value: "normal" | "urgent" | "emergency") =>
                              setNewPatient((prev) => ({ ...prev, urgency: value }))
                            }
                          >
                            <SelectTrigger className="text-sm">
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
                        <Label htmlFor="appointment_date" className="text-sm">Appointment Date & Time *</Label>
                        <Input
                          id="appointment_date"
                          type="datetime-local"
                          value={newPatient.appointment_date}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, appointment_date: e.target.value }))}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes" className="text-sm">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newPatient.notes}
                          onChange={(e) => setNewPatient((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Chief complaint, symptoms, etc."
                          className="text-sm min-h-[80px]"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsAddPatientDialogOpen(false)} className="text-sm">
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-sm">
                          Add Patient
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Location Settings Button */}
                <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
                    >
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Location</span>
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

                {/* Exit/Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-red-500 text-red-600 hover:bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Exit</span>
                </Button>
              </div>
              
              {/* Compact Theme Toggle - Mobile Optimized */}
              <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-600" : "bg-[rgb(227,252,236)]"} transition-all duration-300`}>
                  <Sun className={`h-3 w-3 sm:h-4 sm:w-4 ${isDarkMode ? "text-gray-400" : "text-green-500"}`} />
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                  className="data-[state=checked]:bg-gray-600 scale-75 sm:scale-100"
                />
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-100" : "bg-gray-200"} transition-all duration-300`}>
                  <Moon className={`h-3 w-3 sm:h-4 sm:w-4 ${isDarkMode ? "text-blue-400" : "text-gray-400"}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      

      <main className="container mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card
            className={`border-[#0d5c75]/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? "bg-gray-800 text-white hover:bg-gray-750" : "bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150"}`}
            onClick={() => {
              setFilterStatus("all")
              setFilterUrgency("all")
              setSearchTerm("")
              toast({
                title: "📊 Filter Applied",
                description: "Showing all registered patients",
              })
            }}
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
                All registered patients • Click to view
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-green-400/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 relative ${isDarkMode ? "bg-gray-800 text-white hover:bg-gray-750" : "bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-150"}`}
            onClick={() => {
              setFilterStatus("today")
              setFilterUrgency("all")
              setSearchTerm("")
              toast({
                title: "📅 Today's Filter Applied",
                description: "Showing today's appointments only",
              })
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-green-600"}`}>
                Today's Appointments
              </CardTitle>
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-green-600"}`} />
                {/* Date Picker Toggle Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent card click
                    setIsDatePickerOpen(!isDatePickerOpen)
                  }}
                  className={`h-6 w-6 p-0 rounded-full hover:bg-green-200/50 ${isDarkMode ? "hover:bg-gray-600" : ""}`}
                  title="Select different date"
                >
                  <Timer className={`h-3 w-3 ${isDarkMode ? "text-white" : "text-green-600"}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-green-600"}`}>
                {stats.todayAppointments}
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-green-500"} mt-1`}>Scheduled for today • Click to view</p>
            </CardContent>
            
            {/* Date Picker Section */}
            {isDatePickerOpen && (
              <div 
                className={`absolute top-full left-0 right-0 z-50 mt-2 p-4 rounded-lg shadow-2xl border border-green-200 ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white"}`}
                onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with date picker
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      📅 Select Appointment Date
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                  
                  {/* Date Input */}
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateSelection(e.target.value)}
                      className={`text-sm ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                    />
                  </div>
                  
                  {/* Quick Date Options */}
                  <div className="space-y-1">
                    <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Quick Options:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {getQuickDateOptions().map((option) => (
                        <Button
                          key={option.label}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleDateSelection(option.date)
                            setIsDatePickerOpen(false)
                          }}
                          className={`text-xs h-8 ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}`}
                        >
                          {option.label} ({option.count})
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Selected Date Info */}
                  {selectedDate !== new Date().toISOString().split('T')[0] && (
                    <div className={`p-2 rounded text-xs ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-green-50 text-green-800"}`}>
                      <p className="font-medium">
                        Selected: {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p>Appointments found: {selectedDateAppointments.length}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card
            className={`border-orange-500/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? "bg-gray-800 text-white hover:bg-gray-750" : "bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150"}`}
            onClick={() => {
              setFilterStatus("pending")
              setFilterUrgency("all")
              setSearchTerm("")
              toast({
                title: "⏳ Pending Filter Applied",
                description: "Showing pending appointments only",
              })
            }}
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
                Awaiting confirmation • Click to view
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-green-500/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? "bg-gray-800 text-white hover:bg-gray-750" : "bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-150"}`}
            onClick={() => {
              setFilterStatus("completed_sessions")
              setFilterUrgency("all")
              setSearchTerm("")
              toast({
                title: "✅ Completed Sessions Filter Applied",
                description: "Showing patients with completed sessions",
              })
            }}
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
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-green-500"} mt-1`}>Total treatments • Click to view</p>
            </CardContent>
          </Card>

          <Card
            className={`border-red-500/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? "bg-gray-800 text-white hover:bg-gray-750" : "bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150"}`}
            onClick={() => {
              setFilterStatus("all")
              setFilterUrgency("emergency")
              setSearchTerm("")
              toast({
                title: "🚨 Emergency Filter Applied",
                description: "Showing emergency cases only",
              })
            }}
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
              <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-red-500"} mt-1`}>Urgent cases • Click to view</p>
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
                        Profession
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
                                {!viewedPatients.has(patient.id) && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="New appointment - not yet viewed" />
                                )}
                              </div>
                              <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                ID: {patient.id.slice(0, 8)}...
                              </div>
                              {patient.profession && (
                                <div className={`text-xs ${isDarkMode ? "text-blue-300" : "text-blue-600"} bg-blue-50 px-2 py-1 rounded-full`}>
                                  {patient.profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                              )}
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
                          <div className="space-y-1">
                            <div className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {patient.profession ? patient.profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Not specified"}
                            </div>
                            {patient.demographics?.occupation && (
                              <div className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {patient.demographics.occupation}
                              </div>
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
                          <div className="relative">
                            {/* Smart Parent Action Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleActionsExpanded(patient.id)}
                              className={`${expandedActions.has(patient.id) 
                                ? "bg-[#0d5c75] text-white border-[#0d5c75]" 
                                : "border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
                              } font-medium shadow-sm transition-all duration-200`}
                              title={expandedActions.has(patient.id) ? "Hide actions" : "Show all actions"}
                            >
                              <MoreVertical className="h-3 w-3 mr-1" />
                              Actions
                              {expandedActions.has(patient.id) ? (
                                <ChevronUp className="h-3 w-3 ml-1" />
                              ) : (
                                <ChevronDown className="h-3 w-3 ml-1" />
                              )}
                            </Button>

                            {/* Collapsible Action Buttons */}
                            {expandedActions.has(patient.id) && (
                              <div className="absolute top-full left-1/3 transform -translate-x-2/3 mt-2 z-50 w-80 bg-white shadow-2xl border border-gray-200 rounded-lg p-3 space-y-2 transition-all duration-300 ease-in-out">
                                {/* Professional Action Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  {/* View Details Button */}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // Get fresh patient data
                                          const currentPatientData = patients.find(p => p.id === patient.id) || patient
                                          setSelectedPatient(currentPatientData)
                                          
                                          // Mark patient as viewed
                                          setViewedPatients(prev => new Set([...prev, patient.id]))
                                          
                                          // Close the action menu after selection
                                          setExpandedActions(new Set())
                                        }}
                                        className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white text-xs w-full"
                                        title="View Details"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
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
                                              <CardTitle className="text-lg text-white">
                                                Contact Information
                                              </CardTitle>
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
                                                {selectedPatient.profession && (
                                                  <div>
                                                    <Label className="text-sm font-semibold">Profession</Label>
                                                    <p className="text-sm">
                                                      {selectedPatient.profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </p>
                                                  </div>
                                                )}
                                                {selectedPatient.demographics?.occupation && (
                                                  <div>
                                                    <Label className="text-sm font-semibold">Occupation</Label>
                                                    <p className="text-sm">{selectedPatient.demographics.occupation}</p>
                                                  </div>
                                                )}
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

                                  {/* Real-time Smart Patient History Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Get fresh patient data to ensure accuracy
                                      const currentPatientData = patients.find(p => p.id === patient.id) || patient
                                      
                                      // Show patient history
                                      setSelectedPatientHistory(currentPatientData)
                                      setIsPatientHistoryDialogOpen(true)
                                      
                                      // Close the action menu after selection
                                      setExpandedActions(new Set())
                                    }}
                                    className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white text-xs w-full"
                                    title="View Complete Patient History & Sessions"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    History
                                  </Button>

                                  {/* Medical Record Management Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Get fresh patient data to ensure accuracy
                                      const currentPatientData = patients.find(p => p.id === patient.id) || patient
                                      
                                      // Check if medical record already exists
                                      const medicalRecords = JSON.parse(localStorage.getItem("medical_records") || "[]")
                                      let medicalRecord = medicalRecords.find((record: any) => 
                                        record.patientName === currentPatientData.name && record.phone === currentPatientData.phone
                                      )
                                      
                                      if (!medicalRecord) {
                                        // Create a new medical record from current patient data
                                        medicalRecord = {
                                          id: `MR${String(medicalRecords.length + 1).padStart(3, '0')}`,
                                          patientName: currentPatientData.name,
                                          age: currentPatientData.demographics?.age || 0,
                                          gender: currentPatientData.demographics?.gender || 'Not specified',
                                          phone: currentPatientData.phone,
                                          email: currentPatientData.email || 'Not provided',
                                          lastVisit: currentPatientData.last_visit || new Date().toISOString().split('T')[0],
                                          diagnosis: 'Initial consultation pending',
                                          treatmentType: currentPatientData.session_type === 'in_clinic' ? 'Gonstead Adjustment' : 'Video Consultation',
                                          status: currentPatientData.status === 'completed' ? 'Completed' : currentPatientData.status === 'pending' ? 'Ongoing' : 'Follow-up',
                                          sessionsCompleted: currentPatientData.sessions_completed || 0,
                                          totalSessions: 8,
                                          nextAppointment: currentPatientData.appointment_date ? new Date(currentPatientData.appointment_date).toLocaleDateString() : 'To be scheduled',
                                          chiefComplaint: currentPatientData.notes || 'General consultation',
                                          medicalHistory: currentPatientData.medical_history || 'Medical history to be collected during consultation',
                                          currentMedications: 'To be determined during consultation',
                                          treatmentPlan: currentPatientData.treatment_plan?.goals || 'Gonstead chiropractic assessment and treatment plan',
                                          progress: currentPatientData.treatment_plan?.progress || 'Initial assessment pending',
                                          doctorNotes: currentPatientData.booking_source === 'admin_dashboard' 
                                            ? 'Patient added via admin dashboard. Assessment in progress.'
                                            : 'Patient booked online. Initial consultation scheduled.'
                                        }
                                        
                                        // Add to medical records
                                        medicalRecords.push(medicalRecord)
                                        localStorage.setItem("medical_records", JSON.stringify(medicalRecords))
                                        
                                        toast({
                                          title: "✅ Medical Record Created",
                                          description: `Medical record for ${currentPatientData.name} has been created and you'll be redirected to edit it.`,
                                        })
                                      }
                                      
                                      // Store the medical record ID for the medical history page
                                      localStorage.setItem('editMedicalRecordId', medicalRecord.id)
                                      
                                      // Close the action menu before navigation
                                      setExpandedActions(new Set())
                                      
                                      // Redirect to medical history page
                                      router.push('/medical-history')
                                    }}
                                    className="border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white text-xs w-full"
                                    title="Create/Edit Medical Record"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Medical
                                  </Button>

                                  {/* Prescription Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Get fresh patient data and store for prescription page
                                      const currentPatientData = patients.find(p => p.id === patient.id) || patient
                                      localStorage.setItem('prescriptionPatient', JSON.stringify(currentPatientData))
                                      
                                      // Close the action menu before navigation
                                      setExpandedActions(new Set())
                                      
                                      // Navigate to prescription page
                                      router.push('/admin/prescription')
                                    }}
                                    className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white text-xs w-full"
                                    title="Generate Prescription"
                                  >
                                    <Prescription className="h-3 w-3 mr-1" />
                                    Rx
                                  </Button>

                                  {/* Video Call Button */}
                                  {patient.session_type === "video" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startVideoCall(patient)}
                                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-xs w-full"
                                      title="Start Video Call"
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Call
                                    </Button>
                                  )}

                                  {/* Money Management Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Prepare patient data for money management
                                      const patientData = {
                                        patientName: patient.name,
                                        phone: patient.phone,
                                        email: patient.email || '',
                                        sessionType: patient.session_type === 'in_clinic' ? 'In-Clinic Treatment' : 'Video Consultation',
                                        amount: patient.session_type === 'in_clinic' ? 1500 : 1000, // Default amounts
                                        paymentMethod: patient.payment_method || 'cash',
                                        description: `Payment for ${patient.session_type === 'in_clinic' ? 'In-Clinic Treatment' : 'Video Consultation'} - ${new Date().toLocaleDateString()}`,
                                        date: new Date().toISOString().split('T')[0],
                                        patientId: patient.id
                                      }
                                      
                                      // Add to money management records in localStorage
                                      const existingRecords = JSON.parse(localStorage.getItem('payment_records') || '[]')
                                      const newRecord = {
                                        id: `PM${String(existingRecords.length + 1).padStart(3, '0')}`,
                                        ...patientData,
                                        createdAt: new Date().toISOString()
                                      }
                                      
                                      existingRecords.push(newRecord)
                                      localStorage.setItem('payment_records', JSON.stringify(existingRecords))
                                      
                                      toast({
                                        title: "✅ Payment Record Added",
                                        description: `Payment record for ${patient.name} has been added to money management. You can manually navigate to the money management page to view and edit it.`,
                                      })
                                    }}
                                    className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white text-xs w-full"
                                    title="Add Patient to Money Management"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Payment
                                  </Button>

                                  {/* Spinal Health Assessment Report Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateDetailedReport(patient)}
                                    className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white text-xs w-full"
                                    title="Generate Spinal Health Assessment Report"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Report
                                  </Button>

                                  {/* Edit Patient Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Get fresh patient data and edit
                                      const currentPatientData = patients.find(p => p.id === patient.id) || patient
                                      handleEditPatient(currentPatientData)
                                      
                                      // Close the action menu after selection
                                      setExpandedActions(new Set())
                                    }}
                                    className="border-[#f3a800] text-[#f3a800] hover:bg-[#f3a800] hover:text-white text-xs w-full"
                                    title="Edit Patient"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>

                                  {/* Delete Patient Button */}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      // Close the action menu before deletion
                                      setExpandedActions(new Set())
                                      
                                      // Delete patient
                                      handleDeletePatient(patient.id)
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-xs w-full"
                                    title="Delete Patient"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>

                                {/* Professional Footer */}
                                <div className="border-t pt-2 mt-3">
                                  <p className="text-xs text-gray-500 text-center font-medium">
                                    {expandedActions.has(patient.id) ? "Patient Management Tools" : ""}
                                  </p>
                                </div>
                              </div>
                            )}
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
      
      {/* Scroll to Top Navigation Button */}
      <ScrollToTopButton showAfter={300} />

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
              {/* Prescription ID Header - Prominent Display */}
              <div
                style={{
                  textAlign: "center",
                  padding: "15px",
                  backgroundColor: "#0d5c75",
                  color: "white",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "3px solid #2a9d8f",
                  boxShadow: "0 4px 12px rgba(13, 92, 117, 0.3)",
                }}
              >
                <h2 style={{ 
                  margin: "0", 
                  fontSize: "24px", 
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }}>
                  PRESCRIPTION ID: {currentPrescriptionId || window?.prescriptionId || 'RX000'}
                </h2>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                  Official Gonstead Chiropractic Prescription
                </p>
              </div>

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
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                    <strong>Email:</strong> {selectedPatient.email || "Not provided"}
                  </p>
                  <p style={{ margin: "0", fontSize: "13px" }}>
                    <strong>Patient ID:</strong> {selectedPatient.id.slice(0, 8)}...
                  </p>
                </div>
                <div>
                  <h3 style={{ color: "#245064", fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
                    PRESCRIPTION DETAILS
                  </h3>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px" }}>
                    <strong>Prescription ID:</strong> <span style={{ 
                      backgroundColor: "#0d5c75", 
                      color: "white", 
                      padding: "2px 8px", 
                      borderRadius: "4px",
                      fontWeight: "bold",
                      letterSpacing: "1px"
                    }}>
                      {currentPrescriptionId || window?.prescriptionId || 'RX000'}
                    </span>
                  </p>
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

      {/* Patient History Dialog */}
      <Dialog open={isPatientHistoryDialogOpen} onOpenChange={setIsPatientHistoryDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span>Complete Patient History - {selectedPatientHistory?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatientHistory && (
            <div className="space-y-8">

              {/* Enhanced Patient Overview Card */}
              <Card className="border-l-4 border-l-[#8b5cf6] shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Patient Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#0d5c75] flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Name:</span> {selectedPatientHistory.name}</p>
                        <p><span className="font-medium">Phone:</span> {selectedPatientHistory.phone}</p>
                        <p><span className="font-medium">Email:</span> {selectedPatientHistory.email || 'Not provided'}</p>
                        <p><span className="font-medium">Patient ID:</span> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedPatientHistory.id}</code></p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#0d5c75] flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Treatment Statistics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Total Sessions:</span> 
                          <Badge variant="secondary" className="ml-2">
                            {selectedPatientHistory.sessions_completed || 0}
                          </Badge>
                        </p>
                        <p><span className="font-medium">First Visit:</span> {new Date(selectedPatientHistory.appointment_date).toLocaleDateString()}</p>
                        <p><span className="font-medium">Last Visit:</span> {selectedPatientHistory.last_visit ? new Date(selectedPatientHistory.last_visit).toLocaleDateString() : 'No visits yet'}</p>
                        <p><span className="font-medium">Status:</span> 
                          <Badge 
                            variant={selectedPatientHistory.status === 'completed' ? 'default' : selectedPatientHistory.status === 'pending' ? 'secondary' : 'outline'}
                            className="ml-2"
                          >
                            {selectedPatientHistory.status.toUpperCase()}
                          </Badge>
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#0d5c75] flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Treatment Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Session Type:</span> 
                          <Badge variant={selectedPatientHistory.session_type === 'in_clinic' ? 'default' : 'secondary'} className="ml-2">
                            {selectedPatientHistory.session_type === 'in_clinic' ? 'In-Clinic' : 'Video'}
                          </Badge>
                        </p>
                        <p><span className="font-medium">Urgency:</span> 
                          <Badge 
                            variant={selectedPatientHistory.urgency === 'emergency' ? 'destructive' : selectedPatientHistory.urgency === 'urgent' ? 'secondary' : 'outline'}
                            className="ml-2"
                          >
                            {selectedPatientHistory.urgency.toUpperCase()}
                          </Badge>
                        </p>
                        <p><span className="font-medium">Payment:</span> {selectedPatientHistory.payment_method.toUpperCase()}</p>
                        <p><span className="font-medium">Prescription Generated:</span> 
                          {selectedPatientHistory.prescription_generated ? 
                            <Badge variant="default" className="ml-2">✓ Yes ({selectedPatientHistory.prescription_count || 0})</Badge> : 
                            <Badge variant="outline" className="ml-2">✗ No</Badge>
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Session History Timeline */}
              <Card className="border-l-4 border-l-[#2a9d8f] shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] text-white">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Session Timeline & History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Generate session history based on patient data */}
                    {(() => {
                      const sessions = []
                      const sessionsCount = selectedPatientHistory.sessions_completed || 0
                      const startDate = new Date(selectedPatientHistory.appointment_date)
                      
                      // Create session entries
                      for (let i = 0; i <= Math.max(sessionsCount, 0); i++) {
                        const sessionDate = new Date(startDate)
                        sessionDate.setDate(sessionDate.getDate() + (i * 7)) // Weekly sessions
                        
                        const isCompleted = i < sessionsCount
                        const isUpcoming = i === sessionsCount && selectedPatientHistory.status === 'confirmed'
                        const isCurrent = i === 0
                        
                        sessions.push({
                          sessionNumber: i + 1,
                          date: sessionDate,
                          status: isCompleted ? 'completed' : isUpcoming ? 'upcoming' : isCurrent ? 'current' : 'scheduled',
                          type: selectedPatientHistory.session_type,
                          notes: isCurrent ? (selectedPatientHistory.notes || 'Initial consultation') : 
                                isCompleted ? 'Gonstead adjustment completed successfully' :
                                'Session pending',
                          prescription: i === 0 && selectedPatientHistory.prescription_generated ? `RX${String(selectedPatientHistory.prescription_count || 1).padStart(3, '0')}` : null
                        })
                      }
                      
                      return sessions.slice(0, 10).map((session, index) => (
                        <div key={index} className="flex items-start space-x-4 relative">
                          {/* Timeline Line */}
                          {index < sessions.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-[#2a9d8f] to-gray-300"></div>
                          )}
                          
                          {/* Session Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            session.status === 'completed' ? 'bg-green-500' :
                            session.status === 'current' ? 'bg-[#2a9d8f]' :
                            session.status === 'upcoming' ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`}>
                            {session.status === 'completed' ? (
                              <CheckCircle className="h-6 w-6 text-white" />
                            ) : session.status === 'current' ? (
                              <Clock className="h-6 w-6 text-white" />
                            ) : session.status === 'upcoming' ? (
                              <AlertTriangle className="h-6 w-6 text-white" />
                            ) : (
                              <Calendar className="h-6 w-6 text-white" />
                            )}
                          </div>
                          
                          {/* Session Details */}
                          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-[#0d5c75]">Session #{session.sessionNumber}</h4>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={session.status === 'completed' ? 'default' : session.status === 'current' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {session.status.toUpperCase()}
                                </Badge>
                                {session.prescription && (
                                  <Badge variant="secondary" className="text-xs bg-[#8b5cf6] text-white">
                                    {session.prescription}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-600">Date & Time</p>
                                <p className="text-[#0d5c75]">
                                  {session.date.toLocaleDateString()} at {session.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-600">Session Type</p>
                                <p className="text-[#0d5c75]">
                                  {session.type === 'in_clinic' ? 'In-Clinic Gonstead Adjustment' : 'Video Consultation'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-600">Duration</p>
                                <p className="text-[#0d5c75]">
                                  {session.type === 'in_clinic' ? '45-60 minutes' : '30-45 minutes'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <p className="font-medium text-gray-600 text-sm">Session Notes</p>
                              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded mt-1">
                                {session.notes}
                              </p>
                            </div>
                            
                            {session.prescription && (
                              <div className="mt-3 p-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded">
                                <p className="text-sm font-medium text-[#8b5cf6] flex items-center gap-2">
                                  <Prescription className="h-4 w-4" />
                                  Prescription Generated: {session.prescription}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Chiropractic care plan and recommendations provided</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>
              
              {/* Treatment Progress & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-[#f3a800] shadow-lg">
                  <CardHeader className="bg-[#f3a800] text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Clinical Notes & Chief Complaint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-[#0d5c75] mb-2">Chief Complaint</h4>
                        <p className="text-sm bg-gray-50 p-3 rounded border">
                          {selectedPatientHistory.notes || 'No specific complaints noted. General chiropractic consultation requested.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-[#0d5c75] mb-2">Medical History</h4>
                        <p className="text-sm bg-gray-50 p-3 rounded border">
                          {selectedPatientHistory.medical_history || 'Medical history to be collected during consultation. Standard Gonstead assessment protocols to be followed.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-[#0d5c75] mb-2">Booking Source</h4>
                        <Badge variant="outline" className="text-xs">
                          {selectedPatientHistory.booking_source === 'admin_dashboard' ? '📞 Admin Dashboard' : '🌐 Online Booking'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-[#22c55e] shadow-lg">
                  <CardHeader className="bg-[#22c55e] text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Treatment Plan & Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-[#0d5c75] mb-2">Treatment Goals</h4>
                        <div className="text-sm space-y-1">
                          {selectedPatientHistory.treatment_plan?.goals ? (
                            selectedPatientHistory.treatment_plan.goals.map((goal: string, index: number) => (
                              <p key={index} className="flex items-start gap-2">
                                <span className="text-[#22c55e] font-bold">•</span>
                                {goal}
                              </p>
                            ))
                          ) : (
                            <div className="space-y-1">
                              <p className="flex items-start gap-2"><span className="text-[#22c55e] font-bold">•</span>Spinal alignment assessment</p>
                              <p className="flex items-start gap-2"><span className="text-[#22c55e] font-bold">•</span>Pain relief and mobility improvement</p>
                              <p className="flex items-start gap-2"><span className="text-[#22c55e] font-bold">•</span>Gonstead chiropractic adjustment</p>
                              <p className="flex items-start gap-2"><span className="text-[#22c55e] font-bold">•</span>Postural correction guidance</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-[#0d5c75] mb-2">Current Progress</h4>
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Treatment Progress</span>
                            <span className="text-sm text-[#22c55e] font-semibold">
                              {Math.round(((selectedPatientHistory.sessions_completed || 0) / 8) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round(((selectedPatientHistory.sessions_completed || 0) / 8) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {selectedPatientHistory.treatment_plan?.progress || 'Patient responding well to Gonstead chiropractic treatment. Continue with scheduled sessions.'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-[#0d5c75] mb-2">Next Steps</h4>
                        <div className="text-xs space-y-1 text-gray-700">
                          {selectedPatientHistory.status === 'completed' ? (
                            <p className="text-[#22c55e] font-medium">✓ Treatment plan completed successfully</p>
                          ) : (
                            <>
                              <p>• Continue with weekly Gonstead adjustments</p>
                              <p>• Monitor progress and adjust treatment as needed</p>
                              <p>• Follow up on home care recommendations</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPatientHistoryDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                  onClick={() => {
                    // Generate and download detailed patient history report
                    const historyReport = `
╔══════════════════════════════════════════════════════════════════╗
║                 GONSTEAD CHIROPRACTIC CLINIC                        ║
║                COMPREHENSIVE PATIENT HISTORY REPORT                 ║
║                  Dr. Bashir Khan - Gonstead Certified               ║
╚══════════════════════════════════════════════════════════════════╝

PATIENT: ${selectedPatientHistory.name}
PATIENT ID: ${selectedPatientHistory.id}
GENERATED: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${selectedPatientHistory.name}
Phone: ${selectedPatientHistory.phone}
Email: ${selectedPatientHistory.email || 'Not provided'}
Patient ID: ${selectedPatientHistory.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TREATMENT STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Sessions Completed: ${selectedPatientHistory.sessions_completed || 0}
First Visit: ${new Date(selectedPatientHistory.appointment_date).toLocaleDateString()}
Last Visit: ${selectedPatientHistory.last_visit ? new Date(selectedPatientHistory.last_visit).toLocaleDateString() : 'No visits yet'}
Current Status: ${selectedPatientHistory.status.toUpperCase()}
Session Type: ${selectedPatientHistory.session_type === 'in_clinic' ? 'In-Clinic Gonstead Adjustment' : 'Video Consultation'}
Urgency Level: ${selectedPatientHistory.urgency.toUpperCase()}
Payment Method: ${selectedPatientHistory.payment_method.toUpperCase()}
Prescription Generated: ${selectedPatientHistory.prescription_generated ? 'Yes (' + (selectedPatientHistory.prescription_count || 0) + ')' : 'No'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIEF COMPLAINT & CLINICAL NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${selectedPatientHistory.notes || 'No specific complaints noted. General chiropractic consultation requested.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TREATMENT PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Progress: ${Math.round(((selectedPatientHistory.sessions_completed || 0) / 8) * 100)}% Complete
Treatment Plan: ${selectedPatientHistory.treatment_plan?.progress || 'Patient responding well to Gonstead chiropractic treatment.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCTOR SIGNATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dr. Bashir Khan, DCP
Gonstead Certified Chiropractic Specialist
Near Police Station, Tehsil Road, Nowshera
+92 304 699 6267

Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    END OF PATIENT HISTORY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    `
                    
                    const blob = new Blob([historyReport], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${selectedPatientHistory.name.replace(/\s+/g, '_')}_complete_history_${new Date().toISOString().split('T')[0]}.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                    
                    toast({
                      title: '📄 History Report Downloaded',
                      description: `Complete patient history for ${selectedPatientHistory.name} has been saved.`
                    })
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download History Report
                </Button>
              </div>
            </div>
          )}
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
