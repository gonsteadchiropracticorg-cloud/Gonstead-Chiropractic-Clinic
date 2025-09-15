"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Download,
  FileSpreadsheet,
  Database,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  ArrowLeft,
  FileDown,
  FileUp,
  Search,
  X,
  Clock,
  Phone,
  Mail
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  session_type: "in_clinic" | "video"
  appointment_date: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  urgency: "normal" | "urgent" | "emergency"
  payment_method?: "cash" | "jazzcash" | "easypaisa"
  sessions_completed?: number
  notes?: string
  created_at?: string
  updated_at?: string
  last_visit?: string
}

interface ImportedPatient extends Patient {
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

export default function ImportExportPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [importExportHistory, setImportExportHistory] = useState<ImportExportRecord[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedData, setImportedData] = useState<ImportedPatient[]>([])
  const [importStats, setImportStats] = useState({ total: 0, success: 0, errors: 0, pending: 0 })
  const [selectedPatient, setSelectedPatient] = useState<ImportedPatient | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadPatientData()
    loadImportExportHistory()
  }, [])

  const loadPatientData = () => {
    try {
      const savedPatients = localStorage.getItem("gonstead_patients")
      if (savedPatients) {
        setPatients(JSON.parse(savedPatients))
      }
    } catch (error) {
      console.error("Error loading patients:", error)
    }
  }

  const loadImportExportHistory = () => {
    try {
      const savedHistory = localStorage.getItem("import_export_history")
      if (savedHistory) {
        setImportExportHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  const saveImportExportHistory = (history: ImportExportRecord[]) => {
    try {
      localStorage.setItem("import_export_history", JSON.stringify(history))
    } catch (error) {
      console.error("Error saving history:", error)
    }
  }

  const exportToCsv = async () => {
    setIsExporting(true)
    try {
      const csvHeaders = [
        "ID", "Name", "Phone", "Email", "Session Type", "Appointment Date", 
        "Status", "Urgency", "Payment Method", "Sessions Completed", "Notes", 
        "Created At", "Last Visit"
      ]

      const csvData = patients.map(patient => [
        patient.id,
        patient.name,
        patient.phone,
        patient.email || "",
        patient.session_type,
        patient.appointment_date,
        patient.status,
        patient.urgency,
        patient.payment_method || "",
        patient.sessions_completed || 0,
        (patient.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
        patient.created_at || "",
        patient.last_visit || ""
      ])

      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      
      const filename = `gonstead_patients_${new Date().toISOString().split('T')[0]}.csv`
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Add to history
      const newRecord: ImportExportRecord = {
        id: `export_${Date.now()}`,
        type: 'export',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        filename: filename,
        recordCount: patients.length,
        status: 'success',
        patients: patients.map(p => ({ ...p, importStatus: 'success' as const })),
      }
      
      const updatedHistory = [newRecord, ...importExportHistory]
      setImportExportHistory(updatedHistory)
      saveImportExportHistory(updatedHistory)
      
      toast({
        title: "Export Successful! 🎉",
        description: `Successfully exported ${patients.length} patient records to CSV`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive",
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
      parseCsvData(data)
    }
    reader.readAsText(file)
  }

  const parseCsvData = (csv: string) => {
    try {
      const lines = csv.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      
      const expectedHeaders = ["ID", "Name", "Phone", "Email", "Session Type", "Appointment Date", "Status", "Urgency"]
      const missingHeaders = expectedHeaders.filter(h => !headers.some(header => header.toLowerCase().includes(h.toLowerCase())))
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        })
        return
      }

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
            session_type: (values[4] as "in_clinic" | "video") || "in_clinic",
            appointment_date: values[5] || new Date().toISOString(),
            status: (values[6] as "pending" | "confirmed" | "completed" | "cancelled") || "pending",
            urgency: (values[7] as "normal" | "urgent" | "emergency") || "normal",
            payment_method: (values[8] as "cash" | "jazzcash" | "easypaisa") || "cash",
            sessions_completed: parseInt(values[9]) || 0,
            notes: values[10] || undefined,
            created_at: values[11] || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_visit: values[12] || undefined,
            importStatus: 'pending'
          }

          // Validation
          if (!patient.name || !patient.phone) {
            patient.importStatus = 'error'
            patient.importError = 'Missing required fields (Name or Phone)'
          } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(patient.phone)) {
            patient.importStatus = 'error'
            patient.importError = 'Invalid phone number format'
          } else {
            patient.importStatus = 'success'
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

    // Add to history
    const newRecord: ImportExportRecord = {
      id: `import_${Date.now()}`,
      type: 'import',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      filename: fileInputRef.current?.files?.[0]?.name || 'imported_file',
      recordCount: data.length,
      status: stats.errors > 0 ? (stats.success > 0 ? 'partial' : 'error') : 'success',
      patients: data,
      errorMessage: stats.errors > 0 ? `${stats.errors} records failed validation` : undefined
    }
    
    const updatedHistory = [newRecord, ...importExportHistory]
    setImportExportHistory(updatedHistory)
    saveImportExportHistory(updatedHistory)
    setImportedData(data)

    toast({
      title: "File Parsed Successfully! 📊",
      description: `Loaded ${data.length} records. ${stats.success} valid, ${stats.errors} errors`,
    })
  }

  const importToDatabase = async () => {
    setIsImporting(true)
    const validRecords = importedData.filter(p => p.importStatus === 'success')
    
    try {
      // Add valid records to existing patients
      const updatedPatients = [...patients, ...validRecords.map(({ importStatus, importError, ...patient }) => patient)]
      setPatients(updatedPatients)
      
      // Save to localStorage
      localStorage.setItem("gonstead_patients", JSON.stringify(updatedPatients))
      
      toast({
        title: "Import Completed! 🎉",
        description: `Successfully imported ${validRecords.length} patients to dashboard.`,
      })

      // Clear import data
      setImportedData([])
      setImportStats({ total: 0, success: 0, errors: 0, pending: 0 })
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

  const clearImportData = () => {
    setImportedData([])
    setImportStats({ total: 0, success: 0, errors: 0, pending: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filteredImportedData = importedData.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm) ||
                         (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "all" || patient.importStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-white relative">
      {/* Professional Header */}
      <header className="bg-gradient-to-r from-[#0d5c75] via-[#2a9d8f] to-[#0d5c75] text-white p-6 shadow-2xl relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="ghost"
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-poppins">Import & Export Center</h1>
                <p className="text-white/80">Streamlined Patient Data Management</p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-300" />
                <div>
                  <p className="text-white/80 text-sm">Total Patients</p>
                  <p className="text-2xl font-bold text-blue-300">{patients.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <FileUp className="h-8 w-8 text-green-300" />
                <div>
                  <p className="text-white/80 text-sm">Import Ready</p>
                  <p className="text-2xl font-bold text-green-300">{importStats.success}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-300" />
                <div>
                  <p className="text-white/80 text-sm">Import Errors</p>
                  <p className="text-2xl font-bold text-red-300">{importStats.errors}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Export Card */}
          <Card className="border-[#0d5c75]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FileDown className="h-5 w-5" />
                </div>
                Export Patient Data
              </CardTitle>
              <p className="text-white/80">Download all patient records in CSV format</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Available for export:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Patient contact information</li>
                    <li>Appointment details and status</li>
                    <li>Session history and notes</li>
                    <li>Payment and urgency information</li>
                  </ul>
                </div>
                <Button
                  onClick={exportToCsv}
                  disabled={isExporting || patients.length === 0}
                  className="w-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] text-white shadow-lg"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export {patients.length} Records
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Card */}
          <Card className="border-[#2a9d8f]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FileUp className="h-5 w-5" />
                </div>
                Import Patient Data
              </CardTitle>
              <p className="text-white/80">Upload CSV file to import patient records</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Required CSV format:</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                    ID,Name,Phone,Email,Session Type,Appointment Date,Status,Urgency
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-[#2a9d8f] to-[#238a7a] hover:from-[#238a7a] hover:to-[#1e7a6b] text-white shadow-lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
                {importedData.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={importToDatabase}
                      disabled={isImporting || importStats.success === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Import {importStats.success} Records
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={clearImportData}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Preview Table */}
        {importedData.length > 0 && (
          <Card className="border-[#f3a800]/20 shadow-xl mb-8">
            <CardHeader className="bg-gradient-to-r from-[#f3a800] to-[#e09700] text-white">
              <CardTitle className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5" />
                Import Preview ({importedData.length} records)
              </CardTitle>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    placeholder="Search imported records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  <option value="all">All Status</option>
                  <option value="success">Valid</option>
                  <option value="error">Errors</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F5F0]">
                      <TableHead className="text-[#0d5c75] font-semibold">Status</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Patient</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Contact</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Appointment</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Type</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Error</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImportedData.map((patient, index) => (
                      <TableRow key={index} className="hover:bg-[#F8F5F0]/50">
                        <TableCell>
                          <Badge
                            variant={
                              patient.importStatus === "success"
                                ? "default"
                                : patient.importStatus === "error"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {patient.importStatus === "success" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : patient.importStatus === "error" ? (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            {patient.importStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{patient.name}</div>
                            <div className="text-xs text-gray-600">ID: {patient.id.slice(0, 8)}...</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </div>
                            {patient.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {patient.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(patient.appointment_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-600">
                              {patient.status} • {patient.urgency}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={patient.session_type === "in_clinic" ? "default" : "secondary"} className="text-xs">
                            {patient.session_type === "in_clinic" ? "Clinic" : "Video"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {patient.importError && (
                            <div className="text-xs text-red-600 bg-red-50 p-1 rounded">
                              {patient.importError}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPatient(patient)}
                                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white h-6 w-6 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-[#0d5c75] font-poppins">
                                    Import Preview - {patient.name}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedPatient && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
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
                                      <div>
                                        <Label className="text-sm font-semibold">Session Type</Label>
                                        <p className="text-sm">{selectedPatient.session_type}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Status</Label>
                                        <p className="text-sm">{selectedPatient.status}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Urgency</Label>
                                        <p className="text-sm">{selectedPatient.urgency}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold">Appointment Date</Label>
                                      <p className="text-sm">{new Date(selectedPatient.appointment_date).toLocaleString()}</p>
                                    </div>
                                    {selectedPatient.notes && (
                                      <div>
                                        <Label className="text-sm font-semibold">Notes</Label>
                                        <p className="text-sm bg-gray-50 p-3 rounded">{selectedPatient.notes}</p>
                                      </div>
                                    )}
                                    {selectedPatient.importError && (
                                      <div className="bg-red-50 p-3 rounded border border-red-200">
                                        <Label className="text-sm font-semibold text-red-800">Import Error</Label>
                                        <p className="text-sm text-red-600">{selectedPatient.importError}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import/Export History */}
        {importExportHistory.length > 0 && (
          <Card className="border-[#f3a800]/20 shadow-xl mb-8">
            <CardHeader className="bg-gradient-to-r from-[#f3a800] to-[#e09700] text-white">
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                Import/Export History ({importExportHistory.length} records)
              </CardTitle>
              <p className="text-white/80 text-sm">Manage and view your import/export activity</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {importExportHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center">
                        {record.type === 'import' ? (
                          <FileUp className={`h-6 w-6 ${record.status === 'success' ? 'text-green-600' : record.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
                        ) : (
                          <FileDown className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={record.type === 'import' ? 'default' : 'secondary'}>
                            {record.type === 'import' ? 'Import' : 'Export'}
                          </Badge>
                          <Badge
                            variant={
                              record.status === 'success' ? 'default' : record.status === 'error' ? 'destructive' : 'secondary'
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{record.filename}</h4>
                        <p className="text-sm text-gray-600">
                          {record.recordCount} records • {record.date} at {record.time}
                        </p>
                        {record.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">{record.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[#0d5c75]">{record.recordCount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const updatedHistory = importExportHistory.filter(h => h.id !== record.id)
                          setImportExportHistory(updatedHistory)
                          saveImportExportHistory(updatedHistory)
                          toast({
                            title: "Record Deleted",
                            description: "History record has been removed",
                          })
                        }}
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Database Summary */}
        <Card className="border-[#0d5c75]/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
            <CardTitle className="flex items-center gap-3">
              <Database className="h-5 w-5" />
              Current Patient Database ({patients.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {patients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Patients Found</h3>
                <p className="text-gray-500">Import patient data to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#0d5c75] mb-2">{patients.length}</div>
                  <div className="text-sm text-gray-600">Total Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {patients.filter(p => p.status === 'confirmed' || p.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Records</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {patients.filter(p => p.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            )}
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
              >
                View Full Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
