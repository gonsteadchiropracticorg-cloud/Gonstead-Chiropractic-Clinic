"use client"

import { useState, useEffect } from "react"
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
  Download,
  Eye,
  Phone,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function AdminDashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginCode, setLoginCode] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterUrgency, setFilterUrgency] = useState<string>("all")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin/auth")
    }
  }, [isAuthenticated, router])

  // Load patients from localStorage on component mount
  useEffect(() => {
    const savedPatients = localStorage.getItem("gonstead_patients")
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients))
    }
  }, [])

  // Save patients to localStorage whenever patients state changes
  useEffect(() => {
    if (patients.length > 0) {
      localStorage.setItem("gonstead_patients", JSON.stringify(patients))
    }
  }, [patients])

  const handleLogin = () => {
    if (loginCode === "123456") {
      setIsAuthenticated(true)
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      })
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter the correct access code",
        variant: "destructive",
      })
    }
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

  const updatePatientStatus = (patientId: string, newStatus: PatientRecord["status"]) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, status: newStatus, lastVisit: newStatus === "completed" ? new Date().toISOString() : p.lastVisit }
          : p,
      ),
    )
    toast({
      title: "Status Updated",
      description: `Patient status changed to ${newStatus}`,
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

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || patient.status === filterStatus
    const matchesUrgency = filterUrgency === "all" || patient.urgency === filterUrgency
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const stats = {
    totalPatients: patients.length,
    todayAppointments: patients.filter((p) => new Date(p.appointmentDate).toDateString() === new Date().toDateString())
      .length,
    pendingAppointments: patients.filter((p) => p.status === "pending").length,
    completedSessions: patients.reduce((sum, p) => sum + p.sessions, 0),
    emergencyPatients: patients.filter((p) => p.urgency === "emergency").length,
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] via-[#1a7a8a] to-[#2a9d8f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting to Admin Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-[#0d5c75] p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-[#0d5c75] to-[#f3a800] rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0d5c75] font-poppins">Dr. Bashir - Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Gonstead Chiropractic Patient Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="destructive" size="sm" onClick={resetAllData} className="bg-red-600 hover:bg-red-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
            {filteredPatients.length === 0 ? (
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
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-[#F8F5F0]/50">
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
                              onClick={() => generateDetailedReport(patient)}
                              className="border-[#f3a800] text-[#f3a800] hover:bg-[#f3a800] hover:text-white"
                            >
                              <Download className="h-3 w-3" />
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
