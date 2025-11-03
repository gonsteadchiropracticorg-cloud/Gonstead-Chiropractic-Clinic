"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Users,
  FileText,
  Eye,
  Phone,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Menu,
  Home,
  CalendarIcon,
  FileUp,
  FileDown,
  Database,
  Settings,
  BarChart3,
  X,
  Bell,
  Volume2,
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
  TrendingUp,
  Stethoscope,
  PlusCircle,
  Edit,
  LogOut,
  Star,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Archive,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Target,
  Award,
  Briefcase,
  MapPin,
  DollarSign,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import VoiceSettingsComponent from "@/components/voice-settings"
import { updatePatient } from "@/lib/supabase"
import { usePagination, usePaginationKeyboard } from "@/hooks/use-pagination"
import { PaginationNavigation } from "@/components/ui/pagination-navigation"
import { useSeamlessData } from "@/hooks/use-silent-sync"
import { SeamlessUpdateIndicator } from "@/components/ui/seamless-update-indicator"
import ExcelJS from "exceljs"
import { z } from "zod"
import { Checkbox } from "@/components/ui/checkbox"

interface PatientRecord {
  id: string
  name: string
  phone: string
  email?: string
  sessionType: "in_clinic" | "video"
  appointmentDate: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  urgency: "normal" | "urgent" | "emergency"
  paymentMethod: "cash" | "jazzcash" | "easypaisa"
  notes?: string
  medicalHistory?: string
  sessions: number
  lastVisit?: string
  createdAt: string
  demographics: {
    age?: number
    gender?: string
    occupation?: string
    emergencyContact?: string
  }
  treatmentPlan?: {
    diagnosis?: string
    goals?: string[]
    progress?: string
  }
}

interface ImportedPatient extends PatientRecord {
  importStatus?: 'success' | 'error' | 'pending'
  importError?: string
}

interface ImportExportRecord {
  id: string
  type: 'import' | 'export'
  date: string
  time: string
  filename: string
  recordCount: number
  status: 'success' | 'error' | 'partial'
  patients: ImportedPatient[]
  errorMessage?: string
}

// Zod validation schema for patient data
const patientSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, "Invalid phone format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  sessionType: z.enum(["in_clinic", "video"]),
  appointmentDate: z.string(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  urgency: z.enum(["normal", "urgent", "emergency"]),
  paymentMethod: z.enum(["cash", "jazzcash", "easypaisa"]),
})

export default function AdminDashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginCode, setLoginCode] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterUrgency, setFilterUrgency] = useState<string>("all")
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [newAppointmentAlert, setNewAppointmentAlert] = useState<PatientRecord | null>(null)
  const [notifications, setNotifications] = useState<PatientRecord[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedData, setImportedData] = useState<ImportedPatient[]>([])
  const [importStats, setImportStats] = useState({ total: 0, success: 0, errors: 0, pending: 0 })
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'id', 'name', 'phone', 'email', 'sessionType', 'appointmentDate', 
    'status', 'urgency', 'paymentMethod', 'notes'
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Seamless data loading without loading states
  const loadPatientsData = async () => {
    const savedPatients = localStorage.getItem("gonstead_patients")
    return savedPatients ? JSON.parse(savedPatients) : []
  }

  const { data: seamlessPatients, setData: setSeamlessPatients, syncState } = useSeamlessData<PatientRecord[]>(
    [],
    loadPatientsData,
    {
      syncInterval: 15000, // 15 seconds
      enableRealTimeSync: true,
      enableVisibilitySync: true,
      enableNetworkSync: true
    }
  )

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin/auth")
    }
  }, [isAuthenticated, router])

  // Sync seamless data with local state
  useEffect(() => {
    if (seamlessPatients.length > 0) {
      setPatients(seamlessPatients)
    }
  }, [seamlessPatients])

  // Initial load without loading state - data loads seamlessly in background
  useEffect(() => {
    const savedPatients = localStorage.getItem("gonstead_patients")
    if (savedPatients) {
      const initialData = JSON.parse(savedPatients)
      setPatients(initialData)
      setSeamlessPatients(initialData) // Initialize seamless data
    }
  }, [])

  // Save patients to localStorage and sync with seamless data
  useEffect(() => {
    if (patients.length > 0) {
      localStorage.setItem("gonstead_patients", JSON.stringify(patients))
      // Update seamless data without triggering re-sync
      if (JSON.stringify(patients) !== JSON.stringify(seamlessPatients)) {
        setSeamlessPatients(patients)
      }
    }
  }, [patients, seamlessPatients, setSeamlessPatients])

  // Listen for new appointments in real-time
  useEffect(() => {
    const handleNewAppointment = (event: any) => {
      const newPatient = event.detail as PatientRecord
      
      // Add new patient to the list
      setPatients(prev => {
        const exists = prev.some(p => p.id === newPatient.id)
        if (!exists) {
          return [...prev, newPatient]
        }
        return prev
      })
      
      // Show new appointment alert
      setNewAppointmentAlert(newPatient)
      
      // Add to notifications list
      setNotifications(prev => [newPatient, ...prev])
      
      // Show toast notification
      toast({
        title: "🎉 New Appointment Booked!",
        description: `${newPatient.name} has booked an appointment`,
        duration: 5000,
      })
      
      // Auto-dismiss alert after 10 seconds
      setTimeout(() => {
        setNewAppointmentAlert(null)
      }, 10000)
    }
    
    window.addEventListener('newAppointment', handleNewAppointment)
    
    return () => {
      window.removeEventListener('newAppointment', handleNewAppointment)
    }
  }, [])

  const handleLogin = () => {
    // Simple access code login has been disabled for security.
    // All admin access must go through proper authentication via /admin/auth
    toast({
      title: "Authentication Required",
      description: "Please use the secure admin authentication portal",
      variant: "destructive",
    })
    router.replace("/admin/auth")
  }

  const deletePatient = (patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId))
    toast({
      title: "Patient Deleted",
      description: "Patient record has been permanently removed",
    })
  }

  const resetAllData = () => {
    setPatients([])
    localStorage.removeItem("gonstead_patients")
    toast({
      title: "All Data Reset",
      description: "All patient records have been cleared",
    })
  }

  const updatePatientStatus = async (patientId: string, newStatus: PatientRecord["status"]) => {
    try {
      // Find the current patient to get session count
      const currentPatient = patients.find(p => p.id === patientId)
      if (!currentPatient) {
        throw new Error("Patient not found")
      }

      // Prepare update data for Supabase
      const updateData: any = {
        status: newStatus,
      }

      // If marking as completed, increment sessions and update last visit
      if (newStatus === "completed") {
        updateData.sessions = (currentPatient.sessions || 0) + 1
        updateData.last_visit = new Date().toISOString()
      }

      // Update in Supabase database
      const updatedPatient = await updatePatient(patientId, updateData)
      
      if (!updatedPatient) {
        throw new Error("Failed to update patient in database")
      }

      // Create updated patient list
      const updatedPatients = patients.map((p) =>
        p.id === patientId
          ? { 
              ...p, 
              status: newStatus, 
              sessions: newStatus === "completed" ? (p.sessions || 0) + 1 : p.sessions,
              lastVisit: newStatus === "completed" ? new Date().toISOString() : p.lastVisit 
            }
          : p,
      )

      // Update local state to reflect changes
      setPatients(updatedPatients)

      // Update localStorage with the same updated data
      localStorage.setItem("gonstead_patients", JSON.stringify(updatedPatients))

      toast({
        title: "Status Updated Successfully",
        description: `Patient status changed to ${newStatus}${newStatus === "completed" ? " and session count updated" : ""}`,
      })
    } catch (error) {
      console.error("Error updating patient status:", error)
      const errorMessage = error instanceof Error ? error.message : "Please try again."
      toast({
        title: "Update Failed",
        description: `Failed to update patient status: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const updatePatientDetails = (updatedPatient: PatientRecord) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === updatedPatient.id ? updatedPatient : p
      )
    )
    toast({
      title: "Patient Updated",
      description: "Patient details have been successfully updated",
    })
    setIsEditDialogOpen(false)
    setEditingPatient(null)
  }

  const openPrescription = (patient: PatientRecord) => {
    // Navigate to new prescription page with patient data
    localStorage.setItem('prescriptionPatient', JSON.stringify(patient))
    router.push('/admin/prescription')
  }

  const createPaymentRecord = (patient: PatientRecord) => {
    // Determine default amount based on session type
    const defaultAmount = patient.sessionType === "in_clinic" ? 1500 : 800;
    
    // Create payment record object
    const paymentRecord = {
      id: `MR-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      patientName: patient.name,
      phone: patient.phone,
      sessionType: patient.sessionType,
      amount: defaultAmount,
      paymentMethod: patient.paymentMethod || "cash",
      description: `${patient.sessionType === 'in_clinic' ? 'In-Clinic Gonstead Adjustment' : 'Video Consultation'} for ${patient.name}`,
      category: "consultation",
      status: "pending",
      createdBy: "Dr. Bashir Khan"
    }
    
    // Get existing money records from localStorage
    const existingRecords = JSON.parse(localStorage.getItem("money_records") || "[]")
    
    // Check if record already exists for this patient (to avoid duplicates)
    const existingRecord = existingRecords.find((record: any) => 
      record.patientName === patient.name && 
      record.phone === patient.phone &&
      record.date === paymentRecord.date
    )
    
    if (existingRecord) {
      toast({
        title: "⚠️ Record Already Exists",
        description: `Payment record for ${patient.name} already exists for today`,
        variant: "destructive",
      })
      return
    }
    
    // Add the new record to the beginning of the array
    const updatedRecords = [paymentRecord, ...existingRecords]
    
    // Save back to localStorage
    localStorage.setItem("money_records", JSON.stringify(updatedRecords))
    
    toast({
      title: "💰 Payment Record Added",
      description: `Payment record for ${patient.name} (PKR ${defaultAmount}) added successfully. Records can be viewed in Money Management.`,
      duration: 5000,
    })
  }

  const generateDetailedReport = (patient: PatientRecord) => {
    const report = `
GONSTEAD CHIROPRACTIC CLINIC
COMPREHENSIVE PATIENT REPORT
═══════════════════════════════════════════════════════════

PATIENT INFORMATION
──────────────────────────────────────────────────────────
Name: ${patient.name}
Phone: ${patient.phone}
Email: ${patient.email || "Not provided"}
Age: ${patient.demographics.age || "Not specified"}
Gender: ${patient.demographics.gender || "Not specified"}
Occupation: ${patient.demographics.occupation || "Not specified"}
Emergency Contact: ${patient.demographics.emergencyContact || "Not provided"}

APPOINTMENT DETAILS
──────────────────────────────────────────────────────────
Appointment Date: ${new Date(patient.appointmentDate).toLocaleString()}
Session Type: ${patient.sessionType === "in_clinic" ? "In-Clinic Gonstead Adjustment" : "Video Consultation"}
Status: ${patient.status.toUpperCase()}
Urgency Level: ${patient.urgency.toUpperCase()}
Payment Method: ${patient.paymentMethod.toUpperCase()}
Sessions Completed: ${patient.sessions}
Last Visit: ${patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "N/A"}

CLINICAL NOTES
──────────────────────────────────────────────────────────
Chief Complaint: ${patient.notes || "No specific complaints noted"}

Medical History: ${patient.medicalHistory || "No significant medical history recorded"}

TREATMENT PLAN
──────────────────────────────────────────────────────────
Diagnosis: ${patient.treatmentPlan?.diagnosis || "Pending evaluation"}
Treatment Goals: ${patient.treatmentPlan?.goals?.join(", ") || "To be determined"}
Progress Notes: ${patient.treatmentPlan?.progress || "Initial assessment pending"}

GONSTEAD ANALYSIS
──────────────────────────────────────────────────────────
• Spinal alignment assessment: Pending
• Neurological function: To be evaluated
• Postural analysis: Scheduled
• X-ray findings: Not yet available

RECOMMENDATIONS
──────────────────────────────────────────────────────────
• Continue with scheduled Gonstead adjustments
• Follow prescribed home exercise program
• Maintain proper posture awareness
• Schedule follow-up as recommended

NEXT STEPS
──────────────────────────────────────────────────────────
• Complete initial assessment
• Develop comprehensive treatment plan
• Schedule regular follow-up appointments
• Monitor progress and adjust treatment as needed

═══════════════════════════════════════════════════════════
Report Generated: ${new Date().toLocaleString()}
Generated by: Dr. Bashir - Gonstead Chiropractic Specialist
Clinic: Gonstead Chiropractic Clinic, Tehsil Road, Nowshera
Phone: +92 304 699 6267
═══════════════════════════════════════════════════════════
    `

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${patient.name.replace(/\s+/g, "_")}_detailed_report_${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Initialize pagination with smart filtering
  const pagination = usePagination({
    data: patients,
    searchTerm,
    filters: {
      status: filterStatus,
      urgency: filterUrgency
    }
  })

  // Enable keyboard navigation for pagination
  usePaginationKeyboard(pagination)

  // Auto-refresh functionality
  useEffect(() => {
    if (pagination.settings.autoRefresh) {
      const interval = setInterval(() => {
        // Refresh patient data
        const savedPatients = localStorage.getItem("gonstead_patients")
        if (savedPatients) {
          setPatients(JSON.parse(savedPatients))
        }
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [pagination.settings.autoRefresh])

  // Scroll-to-top button functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 300
      setShowScrollToTop(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const stats = {
    totalPatients: patients.length,
    todayAppointments: patients.filter((p) => new Date(p.appointmentDate).toDateString() === new Date().toDateString())
      .length,
    pendingAppointments: patients.filter((p) => p.status === "pending").length,
    completedSessions: patients.reduce((sum, p) => sum + p.sessions, 0),
    emergencyPatients: patients.filter((p) => p.urgency === "emergency").length,
    currentPagePatients: pagination.currentData.length,
    totalFilteredPatients: pagination.totalRecords,
    currentPageNumber: pagination.currentPage,
    totalPages: pagination.totalPages,
  }

  // Export functionality for filtered results
  const exportFilteredResults = () => {
    const dataToExport = pagination.settings.enablePagination ? pagination.currentData : patients
    const csvContent = generateCSVContent(dataToExport)
    downloadCSV(csvContent, `patient-records-page-${pagination.currentPage}.csv`)
  }

  const generateCSVContent = (data: PatientRecord[]) => {
    const headers = ['Name', 'Phone', 'Email', 'Appointment Date', 'Status', 'Urgency', 'Session Type', 'Sessions', 'Payment Method']
    const csvRows = [
      headers.join(','),
      ...data.map(patient => [
        `"${patient.name}"`,
        `"${patient.phone}"`,
        `"${patient.email || ''}"`,
        `"${new Date(patient.appointmentDate).toLocaleString()}"`,
        `"${patient.status}"`,
        `"${patient.urgency}"`,
        `"${patient.sessionType}"`,
        patient.sessions.toString(),
        `"${patient.paymentMethod}"`
      ].join(','))
    ]
    return csvRows.join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Available fields for export
  const availableFields = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Name' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'sessionType', label: 'Session Type' },
    { id: 'appointmentDate', label: 'Appointment Date' },
    { id: 'status', label: 'Status' },
    { id: 'urgency', label: 'Urgency' },
    { id: 'paymentMethod', label: 'Payment Method' },
    { id: 'sessions', label: 'Sessions Completed' },
    { id: 'notes', label: 'Notes' },
    { id: 'createdAt', label: 'Created At' },
    { id: 'lastVisit', label: 'Last Visit' },
  ]

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  const exportData = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "No Fields Selected",
        description: "Please select at least one field to export",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    setIsExportDialogOpen(false)
    
    try {
      const dateStr = new Date().toISOString().split('T')[0]
      let filename = ''
      let blob: Blob

      // Filter patients data to only selected fields
      const filteredData = patients.map(patient => {
        const filtered: any = {}
        selectedFields.forEach(field => {
          filtered[field] = (patient as any)[field] || ''
        })
        return filtered
      })

      switch (exportFormat) {
        case 'csv':
          filename = `gonstead_patients_${dateStr}.csv`
          const csvHeaders = selectedFields.map(field => 
            availableFields.find(f => f.id === field)?.label || field
          )
          const csvData = filteredData.map(patient => 
            selectedFields.map(field => {
              const value = patient[field]
              if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`
              }
              return `"${value || ''}"`
            })
          )
          const csvContent = [
            csvHeaders.join(','),
            ...csvData.map(row => row.join(','))
          ].join('\n')
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          break

        case 'xlsx':
          filename = `gonstead_patients_${dateStr}.xlsx`
          const workbook = new ExcelJS.Workbook()
          const worksheet = workbook.addWorksheet('Patients')
          
          const headers = selectedFields.map(field => 
            availableFields.find(f => f.id === field)?.label || field
          )
          worksheet.addRow(headers)
          worksheet.getRow(1).font = { bold: true, size: 12 }
          worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0d5c75' }
          }
          worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
          
          filteredData.forEach(patient => {
            const row = selectedFields.map(field => patient[field] || '')
            worksheet.addRow(row)
          })
          
          worksheet.columns.forEach((column, index) => {
            let maxLength = headers[index].length
            column.eachCell?.({ includeEmpty: false }, (cell) => {
              const cellLength = cell.value ? cell.value.toString().length : 0
              maxLength = Math.max(maxLength, cellLength)
            })
            column.width = Math.min(maxLength + 2, 50)
          })
          
          const buffer = await workbook.xlsx.writeBuffer()
          blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          break

        case 'json':
          filename = `gonstead_patients_${dateStr}.json`
          const jsonContent = JSON.stringify(filteredData, null, 2)
          blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
          break

        default:
          throw new Error('Invalid export format')
      }

      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: `Export Successful! 🎉`,
        description: `Exported ${patients.length} records to ${exportFormat.toUpperCase()}`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'There was an error exporting the data',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !['csv'].includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result as string
      parseCsvData(data, file.name)
    }
    reader.readAsText(file)
  }

  const parseCsvData = (csv: string, filename: string) => {
    try {
      const lines = csv.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      
      const data: ImportedPatient[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        
        if (values.length < 8) continue

        try {
          const patient: ImportedPatient = {
            id: values[0] || `import_${Date.now()}_${i}`,
            name: values[1] || "",
            phone: values[2] || "",
            email: values[3] || undefined,
            sessionType: (values[4] as "in_clinic" | "video") || "in_clinic",
            appointmentDate: values[5] || new Date().toISOString(),
            status: (values[6] as "pending" | "confirmed" | "completed" | "cancelled") || "pending",
            urgency: (values[7] as "normal" | "urgent" | "emergency") || "normal",
            paymentMethod: (values[8] as "cash" | "jazzcash" | "easypaisa") || "cash",
            sessions: parseInt(values[9]) || 0,
            notes: values[10] || undefined,
            createdAt: values[11] || new Date().toISOString(),
            lastVisit: values[12] || undefined,
            demographics: {},
            importStatus: 'pending'
          }

          try {
            patientSchema.parse(patient)
            patient.importStatus = 'success'
          } catch (error) {
            patient.importStatus = 'error'
            if (error instanceof z.ZodError) {
              const firstError = error.errors[0]
              patient.importError = `${firstError.path.join('.')}: ${firstError.message}`
            } else {
              patient.importError = 'Validation failed'
            }
          }

          data.push(patient)
        } catch (error) {
          console.error('Error parsing row:', error)
        }
      }

      processImportData(data)
    } catch (error) {
      console.error("CSV parsing error:", error)
      toast({
        title: "Parse Error",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      })
    }
  }

  const processImportData = (data: ImportedPatient[]) => {
    const stats = {
      total: data.length,
      success: data.filter(p => p.importStatus === 'success').length,
      errors: data.filter(p => p.importStatus === 'error').length,
      pending: data.filter(p => p.importStatus === 'pending').length
    }
    setImportStats(stats)
    setImportedData(data)

    toast({
      title: "File Parsed Successfully! 📊",
      description: `Loaded ${data.length} records. ${stats.success} valid, ${stats.errors} errors`,
    })
  }

  const confirmImport = async () => {
    setIsImporting(true)
    const validRecords = importedData.filter(p => p.importStatus === 'success')
    
    try {
      const updatedPatients = [...patients, ...validRecords.map(({ importStatus, importError, ...patient }) => patient)]
      setPatients(updatedPatients)
      localStorage.setItem("gonstead_patients", JSON.stringify(updatedPatients))
      
      toast({
        title: "Import Completed! 🎉",
        description: `Successfully imported ${validRecords.length} patients.`,
      })

      setImportedData([])
      setImportStats({ total: 0, success: 0, errors: 0, pending: 0 })
      setIsImportDialogOpen(false)
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import Failed",
        description: "There was an error importing the data",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (!isAuthenticated) {
    // Immediate redirect without loading screen
    router.replace("/admin/auth")
    return null
  }

  return (
    <div className="admin-compact min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-[rgb(190,205,203)]">
      {/* Seamless Update Indicator */}
      <SeamlessUpdateIndicator
        isUpdating={syncState.isUpdating}
        lastSyncTime={syncState.lastSyncTime}
        errorCount={syncState.errorCount}
        isOnline={syncState.isOnline}
        updateAvailable={syncState.updateAvailable}
        isHealthy={syncState.isHealthy}
        position="top-right"
        className="mt-20" // Below the header
      />
      {/* Professional Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-80 bg-gradient-to-b from-[#0d5c75] via-[#1a6b7a] to-[#2a9d8f] transition-transform duration-300 ease-in-out z-[100] shadow-2xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-xl">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-poppins">Admin Panel</h2>
              <p className="text-white/80 text-sm">Gonstead Clinic Management</p>
            </div>
          </div>
          <Button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 p-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Dashboard */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'dashboard' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('dashboard'); router.push('/admin/dashboard'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Dashboard</p>
                <p className="text-white/70 text-xs">Main overview panel</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Patient Management */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'patients' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('patients'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Patient Records</p>
                <p className="text-white/70 text-xs">Manage patient data</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Appointments */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'appointments' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('appointments'); router.push('/admin/calendar'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Appointments</p>
                <p className="text-white/70 text-xs">Schedule & calendar</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Prescriptions */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'prescriptions' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('prescriptions'); router.push('/admin/prescription'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Prescriptions</p>
                <p className="text-white/70 text-xs">Digital prescriptions</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Analytics */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'analytics' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('analytics'); router.push('/admin/analytics'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Analytics</p>
                <p className="text-white/70 text-xs">Reports & insights</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Data Management */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'data' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('data'); setIsExportDialogOpen(true); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Data Management</p>
                <p className="text-white/70 text-xs">Import & export</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Money Management */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'money' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('money'); router.push('/admin/money-management'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Money Management</p>
                <p className="text-white/70 text-xs">Payment tracking</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Settings */}
          <div className={`p-3 rounded-xl transition-all duration-200 cursor-pointer group ${activeMenu === 'settings' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}
               onClick={() => { setActiveMenu('settings'); router.push('/admin/settings'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Settings</p>
                <p className="text-white/70 text-xs">System configuration</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-white/60 text-xs font-semibold mb-3 tracking-wider uppercase">Quick Actions</p>
            
            <div className="space-y-2">
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 justify-start">
                <PlusCircle className="h-4 w-4 mr-3" />
                Add New Patient
              </Button>
              
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 justify-start">
                <FileText className="h-4 w-4 mr-3" />
                New Prescription
              </Button>
              
              <Button 
                onClick={resetAllData}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-white border border-red-400/30 justify-start"
              >
                <RotateCcw className="h-4 w-4 mr-3" />
                Reset All Data
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20 border-t border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Dr. Bashir Khan</p>
              <p className="text-white/70 text-xs">Administrator</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-white border border-red-400/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90]" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Header */}
      <header className="bg-white/15 backdrop-blur-xl border-b border-white/20 p-2 relative overflow-hidden z-[80] h-16">
        {/* Enhanced Glass effect background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d5c75]/10 via-transparent to-[#2a9d8f]/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent"></div>
        <div className="container mx-auto flex justify-between items-center relative z-10 h-full">
          {/* Menu Bar Icon - Left Side */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#1e7a6b] text-white w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Menu className="h-6 w-6" />
              </Button>
              {isMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white border-2 border-[#0d5c75]/20 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-3">
                    <h3 className="font-bold text-sm">Quick Navigation</h3>
                  </div>
                  <div className="py-2">
                    <div onClick={() => { setIsMenuOpen(false); router.push('/admin/dashboard'); }} className="px-4 py-3 text-sm hover:bg-[#0d5c75]/10 cursor-pointer border-b border-gray-100 flex items-center gap-3 transition-colors">
                      <Home className="h-4 w-4 text-[#0d5c75]" />
                      <span className="font-medium">Main Dashboard</span>
                    </div>
                    <div onClick={() => { setIsMenuOpen(false); router.push('/admin/calendar'); }} className="px-4 py-3 text-sm hover:bg-[#2a9d8f]/10 cursor-pointer border-b border-gray-100 flex items-center gap-3 transition-colors">
                      <CalendarIcon className="h-4 w-4 text-[#2a9d8f]" />
                      <span className="font-medium">Appointment Calendar</span>
                    </div>
                    <div onClick={() => { setIsMenuOpen(false); setIsExportDialogOpen(true); }} className="px-4 py-3 text-sm hover:bg-[#f3a800]/10 cursor-pointer border-b border-gray-100 flex items-center gap-3 transition-colors">
                      <Database className="h-4 w-4 text-[#f3a800]" />
                      <span className="font-medium">Import / Export Data</span>
                    </div>
                    <div onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm hover:bg-[#0d5c75]/10 cursor-pointer border-b border-gray-100 flex items-center gap-3 transition-colors">
                      <Bell className="h-4 w-4 text-[#0d5c75]" />
                      <span className="font-medium">Notifications</span>
                    </div>
                    <div onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm hover:bg-[#dc2626]/10 cursor-pointer border-b border-gray-100 flex items-center gap-3 transition-colors">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Cancelled Records</span>
                    </div>
                    <div onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm hover:bg-[#16a34a]/10 cursor-pointer flex items-center gap-3 transition-colors">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Completed Records</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div 
              className="flex items-center gap-3 cursor-pointer transition-all duration-300 hover:scale-105" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 relative bg-white/10 rounded-full p-2 backdrop-blur-sm border border-white/20 shadow-xl">
                <Image
                  src="/images/gonstead-chiropractic-logo-new.png"
                  alt="Gonstead Chiropractic Logo"
                  fill
                  className="object-contain rounded-full"
                />
              </div>
              <div>
              <h1 className="text-lg font-bold text-[#0d5c75] font-poppins drop-shadow-sm">Gonstead Chiropractic Clinic</h1>
              <p className="text-xs text-gray-700 drop-shadow-sm">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Voice Settings
            </Button>
            <Button variant="destructive" size="sm" onClick={resetAllData} className="bg-red-600 hover:bg-red-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
            {/* Notification Icon */}
            <div className="w-12 h-12 relative">
              <Button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-lg border-2 border-[#0d5c75]/30 rounded-xl shadow-2xl z-[9999] max-h-96 overflow-y-auto">
                  <div className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-4 rounded-t-xl">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      New Appointments ({notifications.length})
                    </h3>
                  </div>
                  <div className="py-2">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((patient, index) => (
                        <div key={index} className="px-4 py-3 border-b border-[#0d5c75]/10 hover:bg-[#0d5c75]/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] rounded-full flex items-center justify-center shadow-sm">
                              <Bell className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-800 truncate">{patient.name}</p>
                              <p className="text-xs text-gray-600 mb-1 truncate">
                                {new Date(patient.appointmentDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {patient.sessionType === 'in_clinic' ? 'In-Clinic' : 'Video'} • {patient.urgency}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* New Appointment Alert */}
      {newAppointmentAlert && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right-full">
          <div className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-6 rounded-lg shadow-2xl border-l-4 border-yellow-400 min-w-[300px]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Bell className="h-5 w-5 text-[#0d5c75]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">🎉 New Appointment!</h3>
                <p className="text-sm opacity-90 mb-2">
                  {newAppointmentAlert.name} has booked a new appointment
                </p>
                <div className="text-xs space-y-1 opacity-80">
                  <p>📅 {new Date(newAppointmentAlert.appointmentDate).toLocaleDateString()}</p>
                  <p>⏰ {new Date(newAppointmentAlert.appointmentDate).toLocaleTimeString()}</p>
                  <p>🏥 {newAppointmentAlert.sessionType === 'in_clinic' ? 'In-Clinic' : 'Video Call'}</p>
                  <p>📞 {newAppointmentAlert.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setNewAppointmentAlert(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="mb-8">
            <VoiceSettingsComponent 
              userType="doctor" 
              className="mb-4"
            />
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-[#0d5c75]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#0d5c75]">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-[#0d5c75]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0d5c75]">{stats.totalPatients}</div>
            </CardContent>
          </Card>

          <Card className="border-[#f3a800]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#f3a800]">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-[#f3a800]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f3a800]">{stats.todayAppointments}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingAppointments}</div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completed Sessions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Emergency</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.emergencyPatients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Import & Export (Inline) */}
        <Card className="mb-8 border-[#0d5c75]/20">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Import & Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setIsExportDialogOpen(true)}
                className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
          </CardContent>
        </Card>

        {/* Export Dialog */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#0d5c75]">Configure Export</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-[#0d5c75] mb-2 block">Format</Label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx' | 'json')}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold text-[#0d5c75] mb-2 block">Fields</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableFields.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedFields.includes(f.id)}
                        onCheckedChange={() => toggleField(f.id)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                <Button onClick={exportData} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white" disabled={isExporting}>
                  {isExporting ? 'Exporting…' : 'Export'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-[#0d5c75]">Import Patients (CSV)</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" /> Choose CSV File
                </Button>
                <span className="text-sm text-gray-600">Expected columns: id, name, phone, email, sessionType, appointmentDate, status, urgency, paymentMethod, sessions, notes, createdAt, lastVisit</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded bg-gray-50">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-xl font-semibold">{importStats.total}</div>
                </div>
                <div className="p-3 rounded bg-green-50">
                  <div className="text-xs text-green-700">Valid</div>
                  <div className="text-xl font-semibold text-green-700">{importStats.success}</div>
                </div>
                <div className="p-3 rounded bg-yellow-50">
                  <div className="text-xs text-yellow-700">Pending</div>
                  <div className="text-xl font-semibold text-yellow-700">{importStats.pending}</div>
                </div>
                <div className="p-3 rounded bg-red-50">
                  <div className="text-xs text-red-700">Errors</div>
                  <div className="text-xl font-semibold text-red-700">{importStats.errors}</div>
                </div>
              </div>

              {importedData.length > 0 && (
                <div className="max-h-64 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedData.slice(0, 25).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{p.name}</TableCell>
                          <TableCell className="text-sm">{p.phone}</TableCell>
                          <TableCell className="text-sm">{p.status}</TableCell>
                          <TableCell className="text-sm">
                            {p.importStatus === 'success' ? (
                              <Badge>OK</Badge>
                            ) : p.importStatus === 'error' ? (
                              <Badge variant="destructive">{p.importError || 'Error'}</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {importedData.length > 25 && (
                    <div className="text-xs text-gray-500 p-2">Showing first 25 of {importedData.length} rows…</div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Close</Button>
                <Button onClick={confirmImport} disabled={isImporting || importStats.success === 0} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white">
                  {isImporting ? 'Importing…' : `Import ${importStats.success} records`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Patient Management */}
        <Card className="border-[#0d5c75]/20">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#0a4a5c] text-white">
            <CardTitle className="flex items-center gap-2 font-poppins">
              <FileText className="h-5 w-5" />
              Comprehensive Patient Records
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="flex-1">
                <Input
                  placeholder="Search patients by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                <option value="all">All Urgency</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pagination.totalRecords === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Patient Records Found</h3>
                <p className="text-gray-500">Patient appointments will appear here when booked through the website.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F5F0]">
                      <TableHead className="text-[#0d5c75] font-semibold text-center w-12">#</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Patient Info</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Contact</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Appointment</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Status</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Type & Urgency</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Sessions</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.currentData.map((patient, index) => {
                      // Calculate the actual serial number based on current page and position
                      const serialNumber = pagination.settings.enablePagination 
                        ? (pagination.currentPage - 1) * pagination.recordsPerPage + index + 1
                        : index + 1;
                      
                      return (
                      <TableRow key={patient.id} className="hover:bg-[#F8F5F0]/50">
                        <TableCell className="text-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <span className="text-white text-sm font-bold">{serialNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold text-[#0d5c75]">{patient.name}</div>
                            <div className="text-sm text-gray-600">
                              {patient.demographics.age && `Age: ${patient.demographics.age}`}
                              {patient.demographics.gender && ` • ${patient.demographics.gender}`}
                            </div>
                            {patient.demographics.occupation && (
                              <div className="text-xs text-gray-500">{patient.demographics.occupation}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <a
                              href={`tel:${patient.phone}`}
                              className="flex items-center gap-1 text-[#0d5c75] hover:underline text-sm"
                            >
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </a>
                            {patient.email && (
                              <a
                                href={`mailto:${patient.email}`}
                                className="flex items-center gap-1 text-[#0d5c75] hover:underline text-sm"
                              >
                                <Mail className="h-3 w-3" />
                                {patient.email}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {new Date(patient.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(patient.appointmentDate).toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-gray-500">Payment: {patient.paymentMethod.toUpperCase()}</div>
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
                            <select
                              value={patient.status}
                              onChange={(e) =>
                                updatePatientStatus(patient.id, e.target.value as PatientRecord["status"])
                              }
                              className="text-xs border rounded px-2 py-1 w-full"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant={patient.sessionType === "in_clinic" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {patient.sessionType === "in_clinic" ? "Clinic" : "Video"}
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
                                <div className="text-lg font-bold text-[#0d5c75]">{patient.sessions}</div>
                                {patient.lastVisit && (
                                    <div className="text-xs text-gray-500">
                                        Last: {new Date(patient.lastVisit).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </TableCell>
                		<TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPatient(patient)}
                                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-[#0d5c75] font-poppins">
                                    Comprehensive Patient Record - {patient.name}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedPatient && (
                                  <div className="space-y-6">
                                    {/* Patient Demographics */}
                                    <Card>
                                      <CardHeader className="bg-[#0d5c75] text-white">
                                        <CardTitle className="text-lg">Patient Demographics</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Full Name</Label>
                                            <p className="text-sm">{selectedPatient.name}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Age</Label>
                                            <p className="text-sm">
                                              {selectedPatient.demographics.age || "Not specified"}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Gender</Label>
                                            <p className="text-sm">
                                              {selectedPatient.demographics.gender || "Not specified"}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Occupation</Label>
                                            <p className="text-sm">
                                              {selectedPatient.demographics.occupation || "Not specified"}
                                            </p>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold text-[#0d5c75]">
                                            Emergency Contact
                                          </Label>
                                          <p className="text-sm">
                                            {selectedPatient.demographics.emergencyContact || "Not provided"}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Contact Information */}
                                    <Card>
                                      <CardHeader className="bg-[#f3a800] text-white">
                                        <CardTitle className="text-lg">Contact Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Phone</Label>
                                            <p className="text-sm">{selectedPatient.phone}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Email</Label>
                                            <p className="text-sm">{selectedPatient.email || "Not provided"}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Appointment Details */}
                                    <Card>
                                      <CardHeader className="bg-green-600 text-white">
                                        <CardTitle className="text-lg">Appointment Details</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Date & Time</Label>
                                            <p className="text-sm">
                                              {new Date(selectedPatient.appointmentDate).toLocaleString()}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Session Type</Label>
                                            <p className="text-sm">
                                              {selectedPatient.sessionType === "in_clinic"
                                                ? "In-Clinic Gonstead Adjustment"
                                                : "Video Consultation"}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">
                                              Urgency Level
                                            </Label>
                                            <p className="text-sm capitalize">{selectedPatient.urgency}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">
                                              Payment Method
                                            </Label>
                                            <p className="text-sm capitalize">{selectedPatient.paymentMethod}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Clinical Notes */}
                                    <Card>
                                      <CardHeader className="bg-purple-600 text-white">
                                        <CardTitle className="text-lg">Clinical Notes & History</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div>
                                          <Label className="text-sm font-semibold text-[#0d5c75]">
                                            Chief Complaint
                                          </Label>
                                          <p className="text-sm bg-gray-50 p-3 rounded">
                                            {selectedPatient.notes || "No specific complaints noted"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold text-[#0d5c75]">
                                            Medical History
                                          </Label>
                                          <p className="text-sm bg-gray-50 p-3 rounded">
                                            {selectedPatient.medicalHistory ||
                                              "No significant medical history recorded"}
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Treatment Information */}
                                    <Card>
                                      <CardHeader className="bg-indigo-600 text-white">
                                        <CardTitle className="text-lg">Treatment Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">
                                              Sessions Completed
                                            </Label>
                                            <p className="text-sm">{selectedPatient.sessions}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">Last Visit</Label>
                                            <p className="text-sm">
                                              {selectedPatient.lastVisit
                                                ? new Date(selectedPatient.lastVisit).toLocaleDateString()
                                                : "No previous visits"}
                                            </p>
                                          </div>
                                        </div>
                                        {selectedPatient.treatmentPlan && (
                                          <div>
                                            <Label className="text-sm font-semibold text-[#0d5c75]">
                                              Treatment Plan
                                            </Label>
                                            <div className="bg-gray-50 p-3 rounded space-y-2">
                                              <p>
                                                <strong>Diagnosis:</strong>{" "}
                                                {selectedPatient.treatmentPlan.diagnosis || "Pending evaluation"}
                                              </p>
                                              <p>
                                                <strong>Goals:</strong>{" "}
                                                {selectedPatient.treatmentPlan.goals?.join(", ") || "To be determined"}
                                              </p>
                                              <p>
                                                <strong>Progress:</strong>{" "}
                                                {selectedPatient.treatmentPlan.progress || "Initial assessment pending"}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPatient(patient)
                                setIsEditDialogOpen(true)
                              }}
                              className="border-[#f3a800] text-[#f3a800] hover:bg-[#f3a800] hover:text-white"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPrescription(patient)}
                              className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
                              title="Generate Prescription"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createPaymentRecord(patient)}
                              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              title="Create Payment Record"
                            >
                              <DollarSign className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePatient(patient.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Professional Pagination Navigation */}
            {pagination.settings.enablePagination && pagination.totalPages > 1 && (
              <PaginationNavigation
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalRecords={pagination.totalRecords}
                recordsPerPage={pagination.recordsPerPage}
                startRecord={pagination.startRecord}
                endRecord={pagination.endRecord}
                pageNumbers={pagination.pageNumbers}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
                isFirstPage={pagination.isFirstPage}
                isLastPage={pagination.isLastPage}
                showPageNumbers={pagination.settings.showPageNumbers}
                showRecordCount={pagination.settings.showRecordCount}
                showJumpToPage={pagination.settings.showJumpToPage}
                paginationStyle={pagination.settings.paginationStyle as 'professional' | 'simple' | 'compact'}
                onPageChange={pagination.setCurrentPage}
                onPageSizeChange={pagination.setRecordsPerPage}
                onGoToPage={pagination.goToPage}
                onRefresh={() => {
                  const savedPatients = localStorage.getItem("gonstead_patients")
                  if (savedPatients) {
                    setPatients(JSON.parse(savedPatients))
                  }
                  toast({
                    title: "Data Refreshed",
                    description: "Patient records have been refreshed",
                  })
                }}
                onExport={exportFilteredResults}
                className="border-t-0 rounded-b-lg"
              />
            )}
          </CardContent>
        </Card>
        
        {/* Pagination Status Card */}
        {pagination.settings.enablePagination && (
          <Card className="mt-4 border-[#0d5c75]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0d5c75] rounded-full"></div>
                    <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#2a9d8f] rounded-full"></div>
                    <span>Showing {pagination.currentData.length} patients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#f3a800] rounded-full"></div>
                    <span>{pagination.totalRecords} total (filtered)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>🔧 Press ← → for navigation</span>
                  {pagination.settings.autoRefresh && (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Auto-refresh enabled
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0d5c75] font-poppins">
              Edit Patient Details - {editingPatient?.name}
            </DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Full Name</Label>
                  <Input
                    value={editingPatient.name}
                    onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Phone</Label>
                  <Input
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Email</Label>
                  <Input
                    value={editingPatient.email || ''}
                    onChange={(e) => setEditingPatient({...editingPatient, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Age</Label>
                  <Input
                    type="number"
                    value={editingPatient.demographics.age || ''}
                    onChange={(e) => setEditingPatient({...editingPatient, demographics: {...editingPatient.demographics, age: parseInt(e.target.value) || undefined}})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Gender</Label>
                  <select
                    value={editingPatient.demographics.gender || ''}
                    onChange={(e) => setEditingPatient({...editingPatient, demographics: {...editingPatient.demographics, gender: e.target.value}})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Occupation</Label>
                  <Input
                    value={editingPatient.demographics.occupation || ''}
                    onChange={(e) => setEditingPatient({...editingPatient, demographics: {...editingPatient.demographics, occupation: e.target.value}})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Sessions Completed</Label>
                  <Input
                    type="number"
                    value={editingPatient.sessions}
                    onChange={(e) => setEditingPatient({...editingPatient, sessions: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Urgency Level</Label>
                  <select
                    value={editingPatient.urgency}
                    onChange={(e) => setEditingPatient({...editingPatient, urgency: e.target.value as PatientRecord['urgency']})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-[#0d5c75]">Emergency Contact</Label>
                <Input
                  value={editingPatient.demographics.emergencyContact || ''}
                  onChange={(e) => setEditingPatient({...editingPatient, demographics: {...editingPatient.demographics, emergencyContact: e.target.value}})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-[#0d5c75]">Clinical Notes</Label>
                <textarea
                  value={editingPatient.notes || ''}
                  onChange={(e) => setEditingPatient({...editingPatient, notes: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-transparent min-h-[100px]"
                  placeholder="Enter clinical notes, symptoms, or patient complaints..."
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-[#0d5c75]">Medical History</Label>
                <textarea
                  value={editingPatient.medicalHistory || ''}
                  onChange={(e) => setEditingPatient({...editingPatient, medicalHistory: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-transparent min-h-[100px]"
                  placeholder="Enter medical history, previous treatments, medications..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updatePatientDetails(editingPatient)}
                  className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scroll to Top Navigation Button */}
      {showScrollToTop && (
        <div 
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 z-50 cursor-pointer transition-all duration-500 transform ${
            showScrollToTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-0'
          }`}
          style={{
            background: 'rgba(40, 147, 135, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(40, 147, 135, 1)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(40, 147, 135, 0.9)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
        >
          <ChevronUp 
            size={24} 
            style={{ 
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
            }}
          />
        </div>
      )}
    </div>
  )
}
