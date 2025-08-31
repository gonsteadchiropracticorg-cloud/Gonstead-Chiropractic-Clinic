"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Search,
  Filter,
  FileText,
  User,
  Phone,
  Activity,
  Stethoscope,
  Printer,
  Eye,
  Edit,
  Plus,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  ClipboardList,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Mock medical records data
const mockMedicalRecords = [
  {
    id: "MR001",
    patientName: "Ahmed Hassan",
    age: 35,
    gender: "Male",
    phone: "+92 300 1234567",
    email: "ahmed.hassan@email.com",
    lastVisit: "2024-01-15",
    diagnosis: "Lower Back Pain - L4-L5 Disc Herniation",
    treatmentType: "Gonstead Adjustment",
    status: "Ongoing",
    sessionsCompleted: 8,
    totalSessions: 12,
    nextAppointment: "2024-01-22",
    chiefComplaint: "Severe lower back pain radiating to left leg",
    medicalHistory: "No previous spinal surgeries. History of desk work for 10+ years.",
    currentMedications: "Ibuprofen 400mg as needed",
    treatmentPlan: "Gonstead adjustments, postural exercises, ergonomic education",
    progress: "70% improvement in pain levels, increased mobility",
    doctorNotes: "Patient responding well to treatment. Continue current protocol.",
  },
  {
    id: "MR002",
    patientName: "Fatima Khan",
    age: 28,
    gender: "Female",
    phone: "+92 301 2345678",
    email: "fatima.khan@email.com",
    lastVisit: "2024-01-10",
    diagnosis: "Cervical Spine Misalignment",
    treatmentType: "Gonstead Technique",
    status: "Completed",
    sessionsCompleted: 6,
    totalSessions: 6,
    nextAppointment: "Follow-up in 3 months",
    chiefComplaint: "Neck pain and headaches",
    medicalHistory: "Recent car accident 3 months ago",
    currentMedications: "None",
    treatmentPlan: "Cervical adjustments, neck strengthening exercises",
    progress: "Complete resolution of symptoms",
    doctorNotes: "Treatment completed successfully. Patient educated on prevention.",
  },
  {
    id: "MR003",
    patientName: "Muhammad Ali",
    age: 42,
    gender: "Male",
    phone: "+92 302 3456789",
    email: "m.ali@email.com",
    lastVisit: "2024-01-18",
    diagnosis: "Thoracic Kyphosis",
    treatmentType: "Postural Correction",
    status: "Follow-up",
    sessionsCompleted: 10,
    totalSessions: 10,
    nextAppointment: "2024-02-15",
    chiefComplaint: "Upper back pain and poor posture",
    medicalHistory: "Long-term computer work, no previous treatment",
    currentMedications: "Vitamin D supplements",
    treatmentPlan: "Spinal adjustments, postural exercises, workplace ergonomics",
    progress: "Significant improvement in posture and pain reduction",
    doctorNotes: "Excellent progress. Schedule follow-up to monitor long-term results.",
  },
]

export default function MedicalHistoryPage() {
  const [records, setRecords] = useState(mockMedicalRecords)
  const [filteredRecords, setFilteredRecords] = useState(mockMedicalRecords)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [treatmentFilter, setTreatmentFilter] = useState("all")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    let filtered = records

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Treatment filter
    if (treatmentFilter !== "all") {
      filtered = filtered.filter((record) => record.treatmentType.toLowerCase().includes(treatmentFilter.toLowerCase()))
    }

    setFilteredRecords(filtered)
  }, [searchTerm, statusFilter, treatmentFilter, records])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "follow-up":
        return "text-[rgb(70,100,70)] dark:text-[rgb(150,200,150)]" 
      // Custom inline styling for follow-up status with light green background
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record)
    setIsDetailModalOpen(true)
  }

  const handlePrintRecord = (record: any) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medical Record - ${record.patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #0d5c75; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 60px; height: 60px; margin: 0 auto 10px; }
            .clinic-name { color: #0d5c75; font-size: 24px; font-weight: bold; margin: 0; }
            .doctor-name { color: #666; font-size: 14px; margin: 5px 0; }
            .record-id { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 20px 0; }
            .section { margin: 20px 0; }
            .section-title { color: #0d5c75; font-size: 18px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
            .info-item { margin: 10px 0; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">Gonstead Chiropractic Clinic</div>
            <div class="doctor-name">Dr. Bashir Khan - Gonstead Specialist</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
              Near Police Station, Tehsil Road, Nowshera | +92 304 699 6267
            </div>
          </div>
          
          <div class="record-id">
            <strong>Medical Record ID:</strong> ${record.id} | <strong>Date:</strong> ${new Date().toLocaleDateString()}
          </div>

          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="label">Name:</span> <span class="value">${record.patientName}</span></div>
              <div class="info-item"><span class="label">Age:</span> <span class="value">${record.age} years</span></div>
              <div class="info-item"><span class="label">Gender:</span> <span class="value">${record.gender}</span></div>
              <div class="info-item"><span class="label">Phone:</span> <span class="value">${record.phone}</span></div>
              <div class="info-item"><span class="label">Email:</span> <span class="value">${record.email}</span></div>
              <div class="info-item"><span class="label">Last Visit:</span> <span class="value">${record.lastVisit}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Clinical Information</div>
            <div class="info-item"><span class="label">Chief Complaint:</span> <span class="value">${record.chiefComplaint}</span></div>
            <div class="info-item"><span class="label">Diagnosis:</span> <span class="value">${record.diagnosis}</span></div>
            <div class="info-item"><span class="label">Treatment Type:</span> <span class="value">${record.treatmentType}</span></div>
            <div class="info-item"><span class="label">Status:</span> <span class="value">${record.status}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Treatment Progress</div>
            <div class="info-item"><span class="label">Sessions Completed:</span> <span class="value">${record.sessionsCompleted} of ${record.totalSessions}</span></div>
            <div class="info-item"><span class="label">Progress:</span> <span class="value">${record.progress}</span></div>
            <div class="info-item"><span class="label">Next Appointment:</span> <span class="value">${record.nextAppointment}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Medical History</div>
            <div class="info-item"><span class="label">Medical History:</span> <span class="value">${record.medicalHistory}</span></div>
            <div class="info-item"><span class="label">Current Medications:</span> <span class="value">${record.currentMedications}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Treatment Plan</div>
            <div class="info-item"><span class="value">${record.treatmentPlan}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Doctor's Notes</div>
            <div class="info-item"><span class="value">${record.doctorNotes}</span></div>
          </div>

          <div class="footer">
            <p>This is a confidential medical record. Unauthorized disclosure is prohibited.</p>
            <p>© 2024 Gonstead Chiropractic Clinic - Dr. Bashir Khan</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Statistics
  const totalRecords = records.length
  const completedRecords = records.filter((r) => r.status === "Completed").length
  const ongoingRecords = records.filter((r) => r.status === "Ongoing").length
  const followUpRecords = records.filter((r) => r.status === "Follow-up").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative">
            <Image
              src="/images/gonstead-chiropractic-logo-new.png"
                    alt="Gonstead Chiropractic Logo"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/gonstead-logo-new.png";
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0d5c75] dark:text-white font-poppins">Medical History</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Patient Records Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-[#0d5c75]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Records</p>
                  <p className="text-2xl font-bold text-[#0d5c75] dark:text-white">{totalRecords}</p>
                </div>
                <div className="w-12 h-12 bg-[#0d5c75]/10 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#0d5c75] dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedRecords}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ongoing</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ongoingRecords}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[rgb(200,230,200)] dark:border-[rgb(100,150,100)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Follow-up</p>
                  <p className="text-2xl font-bold" style={{ color: 'rgb(70,100,70)' }}>{followUpRecords}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(227,252,236,0.3)' }}>
                  <ClipboardList className="h-6 w-6" style={{ color: 'rgb(70,100,70)' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-[#0d5c75]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0d5c75] dark:text-white">
              <Search className="h-5 w-5" />
              Search & Filter Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, diagnosis, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-[#0d5c75]/30 focus:border-[#0d5c75]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>

              <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
                <SelectTrigger className="border-[#0d5c75]/30 focus:border-[#0d5c75]">
                  <SelectValue placeholder="Filter by treatment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Treatments</SelectItem>
                  <SelectItem value="gonstead">Gonstead Technique</SelectItem>
                  <SelectItem value="postural">Postural Correction</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTreatmentFilter("all")
                }}
                className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="border-[#0d5c75]/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Patient Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#0d5c75] dark:text-blue-400" />
                      <h3 className="font-semibold text-[#0d5c75] dark:text-white">{record.patientName}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {record.age} years • {record.gender}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {record.phone}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {record.id}</p>
                  </div>

                  {/* Medical Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-[#2a9d8f] dark:text-green-400" />
                      <h4 className="font-medium text-[#0d5c75] dark:text-white">Diagnosis</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{record.diagnosis}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{record.treatmentType}</p>
                    <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                  </div>

                  {/* Progress Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#2a9d8f] dark:text-green-400" />
                      <h4 className="font-medium text-[#0d5c75] dark:text-white">Progress</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {record.sessionsCompleted} of {record.totalSessions} sessions
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#2a9d8f] h-2 rounded-full"
                        style={{ width: `${(record.sessionsCompleted / record.totalSessions) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last visit: {record.lastVisit}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleViewDetails(record)}
                      className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => handlePrintRecord(record)}
                      variant="outline"
                      className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
                      size="sm"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white bg-transparent"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <Card className="border-[#0d5c75]/20">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Records Found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                No medical records match your current search criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0d5c75] dark:text-white">
              <FileText className="h-5 w-5" />
              Medical Record Details - {selectedRecord?.patientName}
            </DialogTitle>
            <DialogDescription>Complete medical record for patient ID: {selectedRecord?.id}</DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="medical">Medical Info</TabsTrigger>
                  <TabsTrigger value="treatment">Treatment</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[#0d5c75] dark:text-white">Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.patientName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Age & Gender</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">
                          {selectedRecord.age} years • {selectedRecord.gender}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Phone</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Visit</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.lastVisit}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Status</Label>
                        <Badge className={getStatusColor(selectedRecord.status)}>{selectedRecord.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[#0d5c75] dark:text-white">Medical Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Chief Complaint</Label>
                        <p className="text-[#0d5c75] dark:text-white">{selectedRecord.chiefComplaint}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Diagnosis</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.diagnosis}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Medical History</Label>
                        <p className="text-gray-700 dark:text-gray-300">{selectedRecord.medicalHistory}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Current Medications
                        </Label>
                        <p className="text-gray-700 dark:text-gray-300">{selectedRecord.currentMedications}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="treatment" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[#0d5c75] dark:text-white">Treatment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Treatment Type</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.treatmentType}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Treatment Plan</Label>
                        <p className="text-gray-700 dark:text-gray-300">{selectedRecord.treatmentPlan}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Doctor's Notes</Label>
                        <p className="text-gray-700 dark:text-gray-300">{selectedRecord.doctorNotes}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Next Appointment</Label>
                        <p className="text-[#0d5c75] dark:text-white font-semibold">{selectedRecord.nextAppointment}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[#0d5c75] dark:text-white">Treatment Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Sessions Progress
                        </Label>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-[#2a9d8f] h-3 rounded-full"
                                style={{
                                  width: `${(selectedRecord.sessionsCompleted / selectedRecord.totalSessions) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-[#0d5c75] dark:text-white font-semibold">
                            {selectedRecord.sessionsCompleted} / {selectedRecord.totalSessions}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Progress Summary</Label>
                        <p className="text-gray-700 dark:text-gray-300">{selectedRecord.progress}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => handlePrintRecord(selectedRecord)}
                  variant="outline"
                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Record
                </Button>
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
