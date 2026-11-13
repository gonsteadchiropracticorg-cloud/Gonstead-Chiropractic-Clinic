"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  ArrowLeft,
  Pill,
  DollarSign,
  Stethoscope,
  Timer,
  Save,
  FileJson,
  FileDown,
  CheckCheck,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPatients, type Patient } from "@/lib/data-service"
import Image from "next/image"

interface PrescriptionRecord {
  id: string
  patientName: string
  phone: string
  email: string
  prescriptionDate: string
  medications: string
  notes: string
  patientId?: string
  chiropracticSuggestions?: string[]
  status?: 'saved' | 'draft' | 'active'
  generatedBy?: string
  savedAt?: string
  isSynced?: boolean
}

export default function PatientTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [prescriptionRecords, setPrescriptionRecords] = useState<PrescriptionRecord[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Load prescription records and patients on component mount
  useEffect(() => {
    loadPrescriptionRecords()
    loadPatients()
  }, [])

  const loadPrescriptionRecords = () => {
    // Load prescription records from localStorage (generated from prescription page)
    // Also check for medical_records and extract prescriptions from patients with prescription_generated flag
    const prescriptionRecords = JSON.parse(localStorage.getItem("prescription_records") || "[]")
    
    // Load patients and create prescription records for those with prescriptions generated
    const patients = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
    const additionalRecords: PrescriptionRecord[] = []
    
    patients.forEach((patient: Patient) => {
      if (patient.prescription_generated && patient.last_prescription_date) {
        // Check if we already have a record for this prescription
        const existingRecord = prescriptionRecords.find((record: PrescriptionRecord) => 
          record.patientName === patient.name && record.phone === patient.phone
        )
        
        if (!existingRecord) {
          // Create a prescription record from patient data
          const prescriptionId = `RX${String(prescriptionRecords.length + additionalRecords.length + 1).padStart(3, '0')}`
          additionalRecords.push({
            id: prescriptionId,
            patientName: patient.name,
            phone: patient.phone,
            email: patient.email || '',
            prescriptionDate: patient.last_prescription_date,
            medications: 'Generated via prescription system',
            notes: patient.notes || 'Prescription generated from admin dashboard',
            patientId: patient.id
          })
        }
      }
    })
    
    const allRecords = [...prescriptionRecords, ...additionalRecords]
    setPrescriptionRecords(allRecords)
    
    // Save back to localStorage if we added new records
    if (additionalRecords.length > 0) {
      localStorage.setItem("prescription_records", JSON.stringify(allRecords))
    }
  }

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await getPatients()
      
      if (error) {
        console.error("Error loading patients:", error)
        return
      }

      const supabasePatients = data || []
      const localStoragePatients = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
      
      // Merge patients with proper deduplication
      const mergedPatients = [...supabasePatients]
      const existingIds = new Set(supabasePatients.map(p => p.id))
      
      localStoragePatients.forEach((localPatient: Patient) => {
        if (!existingIds.has(localPatient.id)) {
          mergedPatients.push(localPatient)
          existingIds.add(localPatient.id)
        }
      })

      // Sync merged records to localStorage
      try {
        localStorage.setItem("gonstead_patients", JSON.stringify(mergedPatients))
      } catch (e) {}
    } catch (error) {
      console.error("Error loading patients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a prescription ID to search",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      // Search by prescription ID first
      const prescriptionMatch = prescriptionRecords.find(record => 
        record.id.toLowerCase().includes(searchQuery.toLowerCase())
      )

      if (prescriptionMatch) {
        // Find the corresponding patient in appointments
        const { data, error } = await getPatients()
        if (error) throw error

        const supabasePatients = data || []
        const localStoragePatients = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
        
        // Merge with deduplication
        const allPatients = [...supabasePatients]
        const existingIds = new Set(supabasePatients.map(p => p.id))
        
        localStoragePatients.forEach((localPatient: Patient) => {
          if (!existingIds.has(localPatient.id)) {
            allPatients.push(localPatient)
            existingIds.add(localPatient.id)
          }
        })

        const matchedPatients = allPatients.filter(patient => 
          patient.name.toLowerCase() === prescriptionMatch.patientName.toLowerCase() ||
          patient.phone === prescriptionMatch.phone ||
          patient.email?.toLowerCase() === prescriptionMatch.email?.toLowerCase()
        )

        if (matchedPatients.length > 0) {
          setSearchResults(matchedPatients)
          setSelectedPatient(matchedPatients[0])
          toast({
            title: "✅ Patient Found",
            description: `Found ${matchedPatients.length} patient record(s) matching prescription ID: ${searchQuery}`,
          })
        } else {
          toast({
            title: "⚠️ Patient Not Found in Appointments",
            description: "Prescription record found, but patient is not in current appointment list.",
            variant: "destructive",
          })
        }
      } else {
        // Also search directly in patient records by various fields
        const { data, error } = await getPatients()
        if (error) throw error

        const supabasePatients = data || []
        const localStoragePatients = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
        
        // Merge with deduplication
        const allPatients = [...supabasePatients]
        const existingIds = new Set(supabasePatients.map(p => p.id))
        
        localStoragePatients.forEach((localPatient: Patient) => {
          if (!existingIds.has(localPatient.id)) {
            allPatients.push(localPatient)
            existingIds.add(localPatient.id)
          }
        })

        const directMatches = allPatients.filter(patient => 
          patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone.includes(searchQuery) ||
          patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )

        if (directMatches.length > 0) {
          setSearchResults(directMatches)
          setSelectedPatient(directMatches[0])
          toast({
            title: "✅ Patient Found",
            description: `Found ${directMatches.length} patient record(s) matching: ${searchQuery}`,
          })
        } else {
          setSearchResults([])
          setSelectedPatient(null)
          toast({
            title: "❌ No Results Found",
            description: "No patients found matching your search criteria.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const getPatientPrescriptions = (patient: Patient) => {
    return prescriptionRecords.filter(record => 
      record.patientName.toLowerCase() === patient.name.toLowerCase() &&
      record.phone === patient.phone
    )
  }

  const getStatusColor = (status?: string) => {
    switch ((status || 'pending').toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'confirmed': return 'bg-teal-50 text-[#0d5c75] border border-teal-200'
      case 'pending': return 'bg-amber-50 text-amber-800 border border-amber-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200'
      default: return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const getUrgencyColor = (urgency?: string) => {
    switch ((urgency || 'normal').toLowerCase()) {
      case 'emergency': return 'bg-red-50 text-red-700 border border-red-200 font-semibold'
      case 'urgent': return 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
      case 'normal': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      default: return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const getPrescriptionStatus = (prescription: PrescriptionRecord): { label: string; color: string; icon: any } => {
    const hasBeenSaved = prescription.status === 'saved' && prescription.savedAt
    const isSynced = prescription.isSynced === true
    const isActive = prescription.status === 'active'
    
    if (hasBeenSaved && isSynced) {
      return { label: 'Saved & Synced', color: 'bg-emerald-50 text-emerald-700 border border-emerald-300', icon: CheckCheck }
    } else if (hasBeenSaved) {
      return { label: 'Saved Locally', color: 'bg-teal-50 text-[#0d5c75] border border-teal-300', icon: Save }
    } else if (isActive) {
      return { label: 'Generated', color: 'bg-teal-50/70 text-[#0d5c75] border border-teal-200', icon: AlertTriangle }
    } else {
      return { label: 'Not Saved', color: 'bg-gray-100 text-gray-700 border border-gray-300', icon: AlertTriangle }
    }
  }

  const handleSavePrescription = (prescription: PrescriptionRecord) => {
    try {
      // Update prescription status to saved
      const updatedPrescription = {
        ...prescription,
        status: 'saved' as const,
        savedAt: new Date().toISOString(),
        isSynced: true
      }

      // Update in prescriptionRecords state
      const updatedRecords = prescriptionRecords.map(p => 
        p.id === prescription.id ? updatedPrescription : p
      )
      setPrescriptionRecords(updatedRecords)

      // Save to localStorage
      localStorage.setItem("prescription_records", JSON.stringify(updatedRecords))

      toast({
        title: "✅ Prescription Saved",
        description: `Prescription ${prescription.id} has been saved successfully`,
      })
    } catch (error) {
      console.error("Error saving prescription:", error)
      toast({
        title: "Error",
        description: "Failed to save prescription",
        variant: "destructive",
      })
    }
  }

  const handleExportPrescriptionTXT = (prescription: PrescriptionRecord, patient: Patient) => {
    try {
      const txtContent = `
╔══════════════════════════════════════════════════════════════════╗
║                 GONSTEAD CHIROPRACTIC CLINIC                     ║
║                   PRESCRIPTION EXPORT DOCUMENT                   ║
║                  Dr. Bashir Khan - Gonstead Certified            ║
╚══════════════════════════════════════════════════════════════════╝

PRESCRIPTION ID: ${prescription.id}
EXPORT DATE: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${prescription.patientName}
Phone: ${prescription.phone}
Email: ${prescription.email || 'Not provided'}
Patient ID: ${prescription.patientId || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRESCRIPTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prescription Date: ${new Date(prescription.prescriptionDate).toLocaleString()}
Status: ${prescription.status || 'Active'}
Generated By: ${prescription.generatedBy || 'Admin Dashboard'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDICATIONS & TREATMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${prescription.medications || 'No medications specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${prescription.notes || 'No additional notes'}

${prescription.chiropracticSuggestions && prescription.chiropracticSuggestions.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIROPRACTIC CARE RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${prescription.chiropracticSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPOINTMENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Appointment Date: ${new Date(patient.appointment_date).toLocaleDateString()}
Appointment Time: ${new Date(patient.appointment_date).toLocaleTimeString()}
Session Type: ${patient.session_type === 'in_clinic' ? 'In-Clinic Treatment' : 'Video Consultation'}
Sessions Completed: ${patient.sessions_completed || 0}
Payment Method: ${patient.payment_method.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINIC INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dr. Bashir Khan, DCP
Gonstead Certified Chiropractic Specialist
Near Peshawar Model School, Tehsil Road, Nowshera
Phone: +92 304 699 6267

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Document Generated: ${new Date().toLocaleString()}
Exported from Gonstead Chiropractic Patient Tracking System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `

      const blob = new Blob([txtContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Prescription_${prescription.id}_${prescription.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "📄 Prescription Exported",
        description: `Prescription ${prescription.id} exported as TXT file`,
      })
    } catch (error) {
      console.error("Error exporting prescription:", error)
      toast({
        title: "Error",
        description: "Failed to export prescription",
        variant: "destructive",
      })
    }
  }

  const handleExportPrescriptionJSON = (prescription: PrescriptionRecord, patient: Patient) => {
    try {
      const jsonData = {
        prescriptionId: prescription.id,
        exportDate: new Date().toISOString(),
        patient: {
          name: prescription.patientName,
          phone: prescription.phone,
          email: prescription.email,
          patientId: prescription.patientId
        },
        prescription: {
          date: prescription.prescriptionDate,
          medications: prescription.medications,
          notes: prescription.notes,
          chiropracticSuggestions: prescription.chiropracticSuggestions,
          status: prescription.status,
          generatedBy: prescription.generatedBy,
          savedAt: prescription.savedAt
        },
        appointment: {
          appointmentDate: patient.appointment_date,
          sessionType: patient.session_type,
          sessionsCompleted: patient.sessions_completed,
          paymentMethod: patient.payment_method,
          status: patient.status,
          urgency: patient.urgency
        },
        clinic: {
          name: 'Gonstead Chiropractic Clinic',
          doctor: 'Dr. Bashir Khan',
          address: 'Near Peshawar Model School, Tehsil Road, Nowshera',
          phone: '+92 304 699 6267'
        }
      }

      const jsonString = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Prescription_${prescription.id}_${prescription.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "📋 Prescription Exported",
        description: `Prescription ${prescription.id} exported as JSON file`,
      })
    } catch (error) {
      console.error("Error exporting prescription:", error)
      toast({
        title: "Error",
        description: "Failed to export prescription",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)] p-2 sm:p-4 md:p-6 space-y-6">
      {/* Professional Admin Header matching Main Dashboard */}
      <header className="relative bg-white/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.08)] border border-[#0d5c75]/15 p-3 sm:p-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/20 to-[#2a9d8f]/5 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Section - Title perfectly aligned left without Back to Dashboard button */}
          <div className="space-y-0.5 text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0d5c75] font-poppins tracking-tight">
              Patient Tracking System
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#2a9d8f] leading-none">
              Track & Monitor Clinical Records
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Search by Prescription ID, Name, Phone, or Email
            </p>
          </div>

          {/* Right Section - Glass Stat Pill */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-xl px-3.5 py-2 border border-[#0d5c75]/15 shadow-xs flex items-center gap-3">
              <div>
                <p className="text-xs font-bold text-[#0d5c75] flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-[#2a9d8f]" />
                  Prescriptions: <span className="text-sm font-black text-[#2a9d8f]">{prescriptionRecords.length}</span>
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        {/* Search Section Card */}
        <Card className="shadow-lg border border-[#0d5c75]/15 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white px-5 py-3.5">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 font-poppins">
              <Search className="h-5 w-5" />
              Patient Search & Record Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="search" className="text-xs font-semibold text-[#0d5c75] uppercase tracking-wider">
                  Search by Prescription ID, Name, Phone, or Email
                </Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0d5c75]/50" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter prescription ID (e.g., RX001) or patient details..."
                    className="pl-10 h-11 bg-slate-50/70 border border-[#0d5c75]/20 text-[#0d5c75] placeholder:text-gray-400 focus:bg-white focus:border-[#0d5c75] rounded-xl text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white h-11 px-6 rounded-xl font-medium shadow-sm transition-all"
              >
                {isSearching ? (
                  <Timer className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {isSearching ? "Searching..." : "Search Patient"}
              </Button>
            </div>

            {/* Clean Information & Quick Stats Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-teal-50/70 rounded-xl border border-[#0d5c75]/15">
                <p className="text-xs font-bold text-[#0d5c75] flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-[#2a9d8f]" />
                  Search Guidelines:
                </p>
                <ul className="text-xs text-gray-600 space-y-0.5 leading-relaxed">
                  <li>• Use prescription ID (e.g. RX001) for direct prescription retrieval</li>
                  <li>• Search by patient full name, phone number, or email address</li>
                  <li>• Partial keywords are supported for fast instant matching</li>
                </ul>
              </div>
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200/80 flex items-center justify-around">
                <div className="text-center">
                  <p className="text-2xl font-black text-[#0d5c75] leading-none">{prescriptionRecords.length}</p>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Total Prescriptions</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-black text-[#2a9d8f] leading-none">{searchResults.length}</p>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Search Results</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Results List */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border border-[#0d5c75]/15 bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] text-white px-5 py-3.5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Search Results ({searchResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-3.5 cursor-pointer transition-colors hover:bg-slate-50 ${
                          selectedPatient?.id === patient.id ? 'bg-teal-50/70 border-l-4 border-l-[#0d5c75]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-sm text-[#0d5c75]">{patient.name}</h3>
                            <p className="text-xs text-gray-600 mt-0.5">{patient.phone}</p>
                            <p className="text-[11px] text-gray-400">{patient.email || "No email"}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={`text-[10px] ${getStatusColor(patient.status)}`}>
                              {patient.status}
                            </Badge>
                            <Badge className={`text-[10px] ${getUrgencyColor(patient.urgency)}`}>
                              {patient.urgency}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient Details */}
            <div className="lg:col-span-2">
              {selectedPatient && (
                <div className="space-y-6">
                  {/* Patient Information Card */}
                  <Card className="shadow-lg border border-[#0d5c75]/15 bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white px-5 py-3.5">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Patient Details - {selectedPatient.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Personal Information */}
                        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-gray-100">
                          <div>
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</Label>
                            <p className="text-base font-bold text-[#0d5c75]">{selectedPatient.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[#2a9d8f]" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</Label>
                              <p className="text-sm font-medium text-gray-800">{selectedPatient.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-[#2a9d8f]" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</Label>
                              <p className="text-sm font-medium text-gray-800">{selectedPatient.email || "Not provided"}</p>
                            </div>
                          </div>
                          {selectedPatient.profession && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profession</Label>
                              <p className="text-sm font-medium text-gray-800">{selectedPatient.profession.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            </div>
                          )}
                        </div>

                        {/* Appointment Information */}
                        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#2a9d8f]" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointment Date</Label>
                              <p className="text-sm font-medium text-gray-800">{new Date(selectedPatient.appointment_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#2a9d8f]" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointment Time</Label>
                              <p className="text-sm font-medium text-gray-800">{new Date(selectedPatient.appointment_date).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#2a9d8f]" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Session Type</Label>
                              <p className="text-sm font-medium text-gray-800">{selectedPatient.session_type === 'in_clinic' ? 'In-Clinic Treatment' : 'Video Consultation'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[#2a9d8f]" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</Label>
                              <p className="text-sm font-medium text-gray-800">{selectedPatient.payment_method.toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and Progress */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center p-3 bg-slate-50 rounded-xl border border-gray-100">
                            <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Status</Label>
                            <Badge className={`mt-1.5 ${getStatusColor(selectedPatient.status)}`}>
                              {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-xl border border-gray-100">
                            <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Urgency</Label>
                            <Badge className={`mt-1.5 ${getUrgencyColor(selectedPatient.urgency)}`}>
                              {selectedPatient.urgency.charAt(0).toUpperCase() + selectedPatient.urgency.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-xl border border-gray-100">
                            <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Sessions</Label>
                            <p className="text-lg font-black text-[#0d5c75] mt-0.5">{selectedPatient.sessions_completed || 0}</p>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-xl border border-gray-100">
                            <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Last Visit</Label>
                            <p className="text-xs font-semibold text-gray-700 mt-1">
                              {selectedPatient.last_visit 
                                ? new Date(selectedPatient.last_visit).toLocaleDateString()
                                : "First visit"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Clinical Notes */}
                  {selectedPatient.notes && (
                    <Card className="shadow-lg border border-[#0d5c75]/15 bg-white rounded-2xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-emerald-600 to-[#2a9d8f] text-white px-5 py-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Clinical Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5">
                        <p className="text-sm text-gray-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-gray-100">
                          {selectedPatient.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Prescription History */}
                  <Card className="shadow-lg border border-[#0d5c75]/15 bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#0d5c75] text-white px-5 py-3.5">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Prescription History ({getPatientPrescriptions(selectedPatient).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6">
                      {getPatientPrescriptions(selectedPatient).length > 0 ? (
                        <div className="space-y-3">
                          {getPatientPrescriptions(selectedPatient).map((prescription) => {
                            const status = getPrescriptionStatus(prescription)
                            const StatusIcon = status.icon
                            
                            return (
                              <div key={prescription.id} className="border border-teal-100 rounded-xl p-4 bg-teal-50/40">
                                <div className="flex justify-between items-start mb-2.5">
                                  <div>
                                    <h4 className="font-bold text-sm text-[#0d5c75] flex items-center gap-2">
                                      <Pill className="h-4 w-4 text-[#2a9d8f]" />
                                      Prescription ID: {prescription.id}
                                    </h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="h-3 w-3" />
                                      Date: {new Date(prescription.prescriptionDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">Active</Badge>
                                    <Badge className={`text-[10px] flex items-center gap-1 ${status.color}`}>
                                      <StatusIcon className="h-3 w-3" />
                                      {status.label}
                                    </Badge>
                                  </div>
                                </div>
                                {prescription.medications && (
                                  <div className="mb-2">
                                    <Label className="text-xs font-semibold text-gray-600">Medications:</Label>
                                    <p className="text-xs text-gray-700 mt-0.5">{prescription.medications}</p>
                                  </div>
                                )}
                                {prescription.notes && (
                                  <div className="mb-2">
                                    <Label className="text-xs font-semibold text-gray-600">Notes:</Label>
                                    <p className="text-xs text-gray-700 mt-0.5">{prescription.notes}</p>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-teal-100">
                                  {(status.label === 'Generated' || status.label === 'Not Saved') && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleSavePrescription(prescription)}
                                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white text-xs h-7 px-3 rounded-lg"
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save to Storage
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExportPrescriptionTXT(prescription, selectedPatient)}
                                    className="border-[#2a9d8f]/30 text-[#0d5c75] hover:bg-teal-50 text-xs h-7 px-3 rounded-lg bg-white"
                                  >
                                    <FileDown className="h-3 w-3 mr-1 text-[#2a9d8f]" />
                                    Export TXT
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExportPrescriptionJSON(prescription, selectedPatient)}
                                    className="border-[#0d5c75]/20 text-[#0d5c75] hover:bg-teal-50 text-xs h-7 px-3 rounded-lg bg-white"
                                  >
                                    <FileJson className="h-3 w-3 mr-1 text-[#0d5c75]" />
                                    Export JSON
                                  </Button>
                                </div>
                                
                                {prescription.savedAt && (
                                  <p className="text-[10px] text-gray-400 mt-2">
                                    💾 Saved: {new Date(prescription.savedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Pill className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 font-medium">No prescription records found for this patient</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Prescriptions will appear here once created
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      onClick={() => router.push('/admin/dashboard')}
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white rounded-xl h-10 px-5 text-sm font-medium shadow-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View in Dashboard
                    </Button>
                    <Button
                      onClick={() => router.push('/medical-history')}
                      variant="outline"
                      className="border-[#0d5c75]/30 text-[#0d5c75] bg-white hover:bg-teal-50 rounded-xl h-10 px-5 text-sm font-medium"
                    >
                      <FileText className="h-4 w-4 mr-2 text-[#2a9d8f]" />
                      Medical Records
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && searchResults.length === 0 && searchQuery === "" && (
          <Card className="shadow-lg border border-[#0d5c75]/15 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] rounded-2xl flex items-center justify-center mb-4 shadow-md">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#0d5c75] mb-2 font-poppins">
                Patient Tracking System Ready
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                Search patients by prescription ID, name, phone, or email to track treatment histories, upcoming appointments, and generated prescriptions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-xl mx-auto">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-100">
                  <Activity className="h-6 w-6 text-[#0d5c75] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#0d5c75]">Real-time Tracking</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Live appointment updates</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-100">
                  <CheckCircle className="h-6 w-6 text-[#2a9d8f] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#2a9d8f]">Complete Records</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Synced clinical history</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-100">
                  <FileText className="h-6 w-6 text-[#0d5c75] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#0d5c75]">Prescription Sync</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Export TXT & JSON format</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
