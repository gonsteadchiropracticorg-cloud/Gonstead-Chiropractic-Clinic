"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  FileCheck,
  FileX,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Import,
  FileDown,
  FileUp,
  Filter,
  Search,
  X,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getPatients,
  createPatient,
  deletePatient,
  getCurrentUser,
  type Patient,
} from "@/lib/supabase"
import Image from "next/image"
import * as XLSX from 'xlsx'

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
  const [selectedRecord, setSelectedRecord] = useState<ImportExportRecord | null>(null)
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importedData, setImportedData] = useState<ImportedPatient[]>([])
  const [importStats, setImportStats] = useState({ total: 0, success: 0, errors: 0, pending: 0 })
  const [selectedPatient, setSelectedPatient] = useState<ImportedPatient | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const deleteRecord = (recordId: string) => {
    setImportExportHistory(prev => prev.filter(record => record.id !== recordId))
    toast({
      title: "Record Deleted",
      description: "Import/Export record has been removed from history",
    })
  }
  
  const deleteImportedRecord = (index: number) => {
    setImportedData(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Record Removed",
      description: "Imported record has been removed from preview",
    })
  }

  const deleteExportRecord = (recordId: string) => {
    setImportExportHistory(prev => prev.filter(record => record.id !== recordId))
    toast({
      title: "Export Record Deleted",
      description: "Export record has been removed from history",
    })
  }

  const addToDashboard = async (recordId: string) => {
    const record = importExportHistory.find(r => r.id === recordId)
    if (!record) return

    try {
      // Add patients to main dashboard
      const validPatients = record.patients.filter(p => p.importStatus === 'success')
      setPatients(prev => [...prev, ...validPatients])
      
      toast({
        title: "Added to Dashboard! 🎉",
        description: `Successfully added ${validPatients.length} patients to the main dashboard`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add records to dashboard",
        variant: "destructive",
      })
    }
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const isAuthenticated = localStorage.getItem("admin_authenticated")
      const storedEmail = localStorage.getItem("admin_email")

      if (isAuthenticated === "true" && storedEmail) {
        setAuthChecked(true)
        await loadPatients()
        return
      }

      const { user, error } = await getCurrentUser()

      if (error || !user) {
        router.replace("/admin/auth")
        return
      }

      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_email", user.email || "")

      setAuthChecked(true)
      await loadPatients()
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("admin_authenticated")
      localStorage.removeItem("admin_email")
      router.replace("/admin/auth")
    }
  }

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await getPatients()

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        })
        return
      }

      setPatients(data || [])
    } catch (error) {
      console.error("Error loading patients:", error)
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const headers = [
        "ID",
        "Name",
        "Phone",
        "Email",
        "Session Type",
        "Appointment Date",
        "Status",
        "Urgency",
        "Payment Method",
        "Sessions Completed",
        "Notes",
        "Created At",
        "Last Visit"
      ]

      const data = patients.map(patient => [
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
        patient.notes || "",
        patient.created_at || "",
        patient.last_visit || ""
      ])

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients")
      
      const filename = `gonstead_patients_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, filename)
      
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
      
      setImportExportHistory(prev => [newRecord, ...prev])
      
      toast({
        title: "Export Successful! 🎉",
        description: `Successfully exported ${patients.length} patient records to Excel`,
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

  const exportToCsv = async () => {
    setIsExporting(true)
    try {
      const csvHeaders = [
        "ID",
        "Name",
        "Phone",
        "Email",
        "Session Type",
        "Appointment Date",
        "Status",
        "Urgency",
        "Payment Method",
        "Sessions Completed",
        "Notes",
        "Created At",
        "Last Visit"
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
      
      setImportExportHistory(prev => [newRecord, ...prev])
      
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
    if (!fileExtension || !['csv', 'xlsx'].includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV or Excel (.xlsx) file",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (fileExtension === 'csv') {
        parseCsvData(data as string)
      } else {
        parseExcelData(data as ArrayBuffer)
      }
    }
    
    if (fileExtension === 'csv') {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }

  const parseExcelData = (arrayBuffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      
      if (jsonData.length === 0) {
        toast({
          title: "Empty File",
          description: "The Excel file appears to be empty",
          variant: "destructive",
        })
        return
      }

      const headers = jsonData[0].map(h => String(h).trim())
      const expectedHeaders = ["ID", "Name", "Phone", "Email", "Session Type", "Appointment Date", "Status", "Urgency"]
      const missingHeaders = expectedHeaders.filter(h => !headers.some(header => header.toLowerCase().includes(h.toLowerCase())))
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid Excel Format",
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        })
        return
      }

      const data: ImportedPatient[] = []
      
      for (let i = 1; i < jsonData.length; i++) {
        const values = jsonData[i].map(v => String(v || '').trim())
        
        if (values.length < headers.length) continue

        try {
          const patient: ImportedPatient = {
            id: values[0] || `import_${Date.now()}_${i}`,
            name: values[1] || "",
            phone: values[2] || "",
            email: values[3] || null,
            session_type: (values[4] as "in_clinic" | "video") || "in_clinic",
            appointment_date: values[5] || new Date().toISOString(),
            status: (values[6] as "pending" | "confirmed" | "completed" | "cancelled") || "pending",
            urgency: (values[7] as "normal" | "urgent" | "emergency") || "normal",
            payment_method: (values[8] as "cash" | "jazzcash" | "easypaisa") || "cash",
            sessions_completed: parseInt(values[9]) || 0,
            notes: values[10] || null,
            created_at: values[11] || new Date().toISOString(),
            last_visit: values[12] || null,
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
      console.error("Excel parsing error:", error)
      toast({
        title: "Parse Error",
        description: "Failed to parse Excel file. Please check the format.",
        variant: "destructive",
      })
    }
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
        
        if (values.length < headers.length) continue

        try {
          const patient: ImportedPatient = {
            id: values[0] || `import_${Date.now()}_${i}`,
            name: values[1] || "",
            phone: values[2] || "",
            email: values[3] || null,
            session_type: (values[4] as "in_clinic" | "video") || "in_clinic",
            appointment_date: values[5] || new Date().toISOString(),
            status: (values[6] as "pending" | "confirmed" | "completed" | "cancelled") || "pending",
            urgency: (values[7] as "normal" | "urgent" | "emergency") || "normal",
            payment_method: (values[8] as "cash" | "jazzcash" | "easypaisa") || "cash",
            sessions_completed: parseInt(values[9]) || 0,
            notes: values[10] || null,
            created_at: values[11] || new Date().toISOString(),
            last_visit: values[12] || null,
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
    
    setImportExportHistory(prev => [newRecord, ...prev])
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
      let successCount = 0
      let errorCount = 0

      for (const patient of validRecords) {
        try {
          const { id, importStatus, importError, ...patientData } = patient
          await createPatient(patientData)
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Failed to import patient ${patient.name}:`, error)
        }
      }

      toast({
        title: "Import Completed! 🎉",
        description: `Successfully imported ${successCount} patients. ${errorCount} failed.`,
      })

      if (successCount > 0) {
        await loadPatients()
        setImportedData([])
        setImportStats({ total: 0, success: 0, errors: 0, pending: 0 })
      }
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
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || patient.importStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredPatients = patients.filter((patient) => {
    return patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patient.phone.includes(searchTerm) ||
           patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0d5c75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0d5c75] text-lg font-semibold">Loading Import/Export Panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-[rgb(190,205,203)] to-white"} relative`}>
      {/* Professional Header */}
      <header className="bg-gradient-to-r from-[#0d5c75] via-[#2a9d8f] to-[#0d5c75] text-white p-6 shadow-2xl relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-4 right-1/4 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        </div>
        
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
              <div className="w-12 h-12 bg-white/20 rounded-xl border border-white/30 flex items-center justify-center">
                <Image
                  src="/images/gonstead-logo-new.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-poppins">Import & Export Center</h1>
                  <p className="text-white/80">Streamlined Patient Data Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="data-[state=checked]:bg-white/20"
              />
              <span className="text-sm">Dark Mode</span>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Card className="border-[#0d5c75]/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
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
          <Card className="border-[#2a9d8f]/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
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
                              {new Date(patient.appointment_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={patient.session_type === "in_clinic" ? "default" : "secondary"} className="text-xs">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteImportedRecord(index)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-6 w-6 p-0"
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
            </CardContent>
          </Card>
        )}

        {/* Current Database Table */}
        <Card className="border-[#0d5c75]/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
            <CardTitle className="flex items-center gap-3">
              <Database className="h-5 w-5" />
              Current Patient Database ({patients.length} records)
            </CardTitle>
            <div className="flex-1 relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                placeholder="Search current patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Patients Found</h3>
                <p className="text-gray-500">
                  {patients.length === 0
                    ? "Import patient data to get started"
                    : "No patients match your search criteria"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F5F0]">
                      <TableHead className="text-[#0d5c75] font-semibold">Patient</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Contact</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Appointment</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Status</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Type</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Sessions</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-[#F8F5F0]/50">
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
                              {new Date(patient.appointment_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={patient.session_type === "in_clinic" ? "default" : "secondary"} className="text-xs">
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
                            <div className="text-sm font-bold">{patient.sessions_completed || 0}</div>
                            {patient.last_visit && (
                              <div className="text-xs text-gray-600">
                                {new Date(patient.last_visit).toLocaleDateString()}
                              </div>
                            )}
                          </div>
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
                                    Patient Record - {patient.name}
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
                                      <div>
                                        <Label className="text-sm font-semibold">Sessions Completed</Label>
                                        <p className="text-sm">{selectedPatient.sessions_completed || 0}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Last Visit</Label>
                                        <p className="text-sm">
                                          {selectedPatient.last_visit 
                                            ? new Date(selectedPatient.last_visit).toLocaleDateString()
                                            : "No previous visits"
                                          }
                                        </p>
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
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPatients(prev => prev.filter(p => p.id !== patient.id))
                                toast({
                                  title: "Success!",
                                  description: "Patient record has been removed from the database",
                                })
                              }}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-6 w-6 p-0"
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
