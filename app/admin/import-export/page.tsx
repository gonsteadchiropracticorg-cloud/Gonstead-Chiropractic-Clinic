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
import { Checkbox } from "@/components/ui/checkbox"
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
  Mail,
  FileJson,
  FileText,
  Settings2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ExcelJS from "exceljs"
import { z } from "zod"

// Zod validation schema for patient data
const patientSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, "Invalid phone format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  session_type: z.enum(["in_clinic", "video"]),
  appointment_date: z.string().datetime(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  urgency: z.enum(["normal", "urgent", "emergency"]),
  payment_method: z.enum(["cash", "jazzcash", "easypaisa"]).optional(),
  sessions_completed: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  last_visit: z.string().optional(),
})

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
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<Patient | null>(null)
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<ImportedPatient | Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'id', 'name', 'phone', 'email', 'session_type', 'appointment_date', 
    'status', 'urgency', 'payment_method', 'sessions_completed', 'notes'
  ])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  // Available fields for export
  const availableFields = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Name' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'session_type', label: 'Session Type' },
    { id: 'appointment_date', label: 'Appointment Date' },
    { id: 'status', label: 'Status' },
    { id: 'urgency', label: 'Urgency' },
    { id: 'payment_method', label: 'Payment Method' },
    { id: 'sessions_completed', label: 'Sessions Completed' },
    { id: 'notes', label: 'Notes' },
    { id: 'created_at', label: 'Created At' },
    { id: 'last_visit', label: 'Last Visit' },
  ]

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
                return `"${value.replace(/"/g, '""').replace(/,/g, ';').replace(/\n/g, ' ')}"`
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
          
          // Add headers with styling
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
          
          // Add data rows
          filteredData.forEach(patient => {
            const row = selectedFields.map(field => patient[field] || '')
            worksheet.addRow(row)
          })
          
          // Auto-fit columns
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

      // Download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
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
        title: `Export Successful! 🎉`,
        description: `Exported ${patients.length} records to ${exportFormat.toUpperCase()} with ${selectedFields.length} fields`,
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

          // Enhanced Zod validation
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

  const movePatientToDashboard = (patient: ImportedPatient | Patient) => {
    try {
      // Strip import metadata if present
      const { importStatus, importError, ...cleanPatient } = patient as any
      // Deduplicate by ID
      const exists = patients.some(p => p.id === cleanPatient.id)
      if (exists) {
        toast({
          title: "Already in Dashboard",
          description: `${cleanPatient.name} is already present. Skipped adding duplicate.`,
        })
        return false
      }
      const updatedPatients = [...patients, cleanPatient as Patient]
      setPatients(updatedPatients)
      localStorage.setItem("gonstead_patients", JSON.stringify(updatedPatients))
      toast({
        title: "Moved to Dashboard",
        description: `${cleanPatient.name} has been added to the dashboard.`,
      })
      return true
    } catch (error) {
      console.error("Error moving patient:", error)
      toast({
        title: "Error",
        description: "Failed to move patient to dashboard",
        variant: "destructive",
      })
      return false
    }
  }

  const acceptImportedRecord = async (patient: ImportedPatient) => {
    try {
      const { importStatus, importError, ...cleanPatient } = patient
      // Try to move; if duplicate, we still remove from import list
      const added = movePatientToDashboard(patient)

      // Remove from imported data and update stats
      setImportedData(prev => prev.filter(p => p.id !== patient.id))
      setImportStats(prev => ({
        total: Math.max(prev.total - 1, 0),
        success: Math.max(prev.success - 1, 0),
        errors: prev.errors,
        pending: prev.pending
      }))

      if (added) {
        // Success toast already shown inside movePatientToDashboard
      } else {
        toast({
          title: "Skipped Adding",
          description: `${cleanPatient.name} already exists. Removed from import list.`,
        })
      }
    } catch (error) {
      console.error("Error accepting record:", error)
      toast({
        title: "Error",
        description: "Failed to accept record",
        variant: "destructive",
      })
    }
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
              <p className="text-white/80">Download patient records in multiple formats</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2 font-semibold">Supported Formats:</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium">CSV</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium">XLSX</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileJson className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium">JSON</span>
                    </div>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Choose format and fields</li>
                    <li>Export with custom selection</li>
                    <li>Professional formatting</li>
                  </ul>
                </div>
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={patients.length === 0}
                      className="w-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] text-white shadow-lg"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configure Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-[#0d5c75] font-poppins flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Configure Export Settings
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Format Selection */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block">Export Format</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setExportFormat('csv')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              exportFormat === 'csv'
                                ? 'border-[#0d5c75] bg-[#0d5c75]/10'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <FileText className={`h-8 w-8 mx-auto mb-2 ${
                              exportFormat === 'csv' ? 'text-[#0d5c75]' : 'text-gray-400'
                            }`} />
                            <div className="text-sm font-semibold">CSV</div>
                            <div className="text-xs text-gray-500">Universal</div>
                          </button>
                          <button
                            onClick={() => setExportFormat('xlsx')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              exportFormat === 'xlsx'
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <FileSpreadsheet className={`h-8 w-8 mx-auto mb-2 ${
                              exportFormat === 'xlsx' ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <div className="text-sm font-semibold">XLSX</div>
                            <div className="text-xs text-gray-500">Excel</div>
                          </button>
                          <button
                            onClick={() => setExportFormat('json')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              exportFormat === 'json'
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <FileJson className={`h-8 w-8 mx-auto mb-2 ${
                              exportFormat === 'json' ? 'text-purple-600' : 'text-gray-400'
                            }`} />
                            <div className="text-sm font-semibold">JSON</div>
                            <div className="text-xs text-gray-500">Structured</div>
                          </button>
                        </div>
                      </div>

                      {/* Field Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold">Select Fields to Export</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedFields(availableFields.map(f => f.id))}
                              className="h-7 text-xs"
                            >
                              Select All
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedFields([])}
                              className="h-7 text-xs"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                          {availableFields.map(field => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={field.id}
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                              />
                              <label
                                htmlFor={field.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {field.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {selectedFields.length} of {availableFields.length} fields
                        </p>
                      </div>

                      {/* Export Preview */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Export Preview</h4>
                        <div className="space-y-1 text-xs text-blue-700">
                          <p>📊 <strong>{patients.length}</strong> patient records</p>
                          <p>📋 <strong>{selectedFields.length}</strong> fields selected</p>
                          <p>📁 Format: <strong>{exportFormat.toUpperCase()}</strong></p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={exportData}
                          disabled={isExporting || selectedFields.length === 0}
                          className="flex-1 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] text-white"
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
                        <Button
                          variant="outline"
                          onClick={() => setIsExportDialogOpen(false)}
                          disabled={isExporting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
              <p className="text-white/80">Upload CSV file with enhanced validation</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2 font-semibold">CSV Format (with Zod validation):</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                    ID,Name,Phone,Email,Session Type,Appointment Date,Status,Urgency
                  </p>
                  <div className="mt-2 text-xs space-y-1">
                    <p>✅ Email format validated</p>
                    <p>✅ Phone number format checked</p>
                    <p>✅ Detailed error reporting</p>
                  </div>
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
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPatient(patient)}
                                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white h-8 px-2"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
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
                                    <div className="flex justify-end gap-2 pt-2">
                                      {selectedPatient.importStatus === 'success' && (
                                        <Button
                                          onClick={() => acceptImportedRecord(selectedPatient)}
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Accept & Move to Dashboard
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {/* Accept Single Record Button */}
                            {patient.importStatus === 'success' && (
                              <Button
                                size="sm"
                                onClick={() => acceptImportedRecord(patient)}
                                className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                                title="Accept and move to dashboard"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                            )}
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
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
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

                    {/* Patients in this history record */}
                    <div className="mt-3 overflow-x-auto border rounded-md bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#F8F5F0]">
                            <TableHead className="text-[#0d5c75] font-semibold">Patient</TableHead>
                            <TableHead className="text-[#0d5c75] font-semibold">Contact</TableHead>
                            <TableHead className="text-[#0d5c75] font-semibold">Appointment</TableHead>
                            <TableHead className="text-[#0d5c75] font-semibold">Status</TableHead>
                            <TableHead className="text-[#0d5c75] font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {record.patients.map((p, idx) => (
                            <TableRow key={`${record.id}_${p.id || idx}`} className="hover:bg-[#F8F5F0]/40">
                              <TableCell>
                                <div className="font-semibold">{p.name}</div>
                                <div className="text-xs text-gray-600">ID: {p.id?.slice(0,8)}...</div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</div>
                                  {p.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{new Date(p.appointment_date).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-600">{p.session_type === 'in_clinic' ? 'Clinic' : 'Video'}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={(record.type === 'import' ? (p as ImportedPatient).importStatus === 'error' ? 'destructive' : 'default' : 'secondary')} className="text-xs">
                                  {record.type === 'import' ? (p as ImportedPatient).importStatus || 'unknown' : 'exported'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedHistoryPatient(p)}
                                        className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white h-8 px-2"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle className="text-[#0d5c75] font-poppins">Patient Details - {selectedHistoryPatient?.name}</DialogTitle>
                                      </DialogHeader>
                                      {selectedHistoryPatient && (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-semibold">Name</Label>
                                              <p className="text-sm">{selectedHistoryPatient.name}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-semibold">Phone</Label>
                                              <p className="text-sm">{selectedHistoryPatient.phone}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-semibold">Email</Label>
                                              <p className="text-sm">{(selectedHistoryPatient as any).email || 'Not provided'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-semibold">Session Type</Label>
                                              <p className="text-sm">{selectedHistoryPatient.session_type}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-semibold">Status</Label>
                                              <p className="text-sm">{(selectedHistoryPatient as any).status}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-semibold">Urgency</Label>
                                              <p className="text-sm">{(selectedHistoryPatient as any).urgency}</p>
                                            </div>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Appointment Date</Label>
                                            <p className="text-sm">{new Date(selectedHistoryPatient.appointment_date).toLocaleString()}</p>
                                          </div>
                                          {(selectedHistoryPatient as any).notes && (
                                            <div>
                                              <Label className="text-sm font-semibold">Notes</Label>
                                              <p className="text-sm bg-gray-50 p-3 rounded">{(selectedHistoryPatient as any).notes}</p>
                                            </div>
                                          )}
                                          <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                              onClick={() => movePatientToDashboard(selectedHistoryPatient)}
                                              className="bg-green-600 hover:bg-green-700 text-white"
                                              disabled={record.type === 'import' && (selectedHistoryPatient as ImportedPatient).importStatus !== 'success'}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Move to Dashboard
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    onClick={() => movePatientToDashboard(p)}
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                                    title="Move to dashboard"
                                    disabled={record.type === 'import' && (p as ImportedPatient).importStatus !== 'success'}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Move
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
            <div className="mt-6">
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F5F0]">
                      <TableHead className="text-[#0d5c75] font-semibold">Patient</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Contact</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Appointment</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Status</TableHead>
                      <TableHead className="text-[#0d5c75] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.slice(0, 10).map((p, idx) => (
                      <TableRow key={p.id || idx} className="hover:bg-[#F8F5F0]/50">
                        <TableCell>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-gray-600">ID: {p.id?.slice(0,8)}...</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</div>
                            {p.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{new Date(p.appointment_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-600">{p.session_type === 'in_clinic' ? 'Clinic' : 'Video'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'completed' ? 'default' : p.status === 'confirmed' ? 'secondary' : p.status === 'cancelled' ? 'destructive' : 'outline'} className="text-xs">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedExistingPatient(p)}
                                  className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white h-8 px-2"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-[#0d5c75] font-poppins">Patient Details - {selectedExistingPatient?.name}</DialogTitle>
                                </DialogHeader>
                                {selectedExistingPatient && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-semibold">Name</Label>
                                        <p className="text-sm">{selectedExistingPatient.name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Phone</Label>
                                        <p className="text-sm">{selectedExistingPatient.phone}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Email</Label>
                                        <p className="text-sm">{selectedExistingPatient.email || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Session Type</Label>
                                        <p className="text-sm">{selectedExistingPatient.session_type}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Status</Label>
                                        <p className="text-sm">{selectedExistingPatient.status}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-semibold">Urgency</Label>
                                        <p className="text-sm">{selectedExistingPatient.urgency}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold">Appointment Date</Label>
                                      <p className="text-sm">{new Date(selectedExistingPatient.appointment_date).toLocaleString()}</p>
                                    </div>
                                    {selectedExistingPatient.notes && (
                                      <div>
                                        <Label className="text-sm font-semibold">Notes</Label>
                                        <p className="text-sm bg-gray-50 p-3 rounded">{selectedExistingPatient.notes}</p>
                                      </div>
                                    )}
                                    <div className="flex justify-end gap-2 pt-2">
                                      <Button onClick={() => router.push('/admin/dashboard')} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white">
                                        Open in Dashboard
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" onClick={() => router.push('/admin/dashboard')} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white h-8 px-2">
                              Go to Dashboard
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/admin/dashboard')}
                  className="w-full bg-[#0d5c75] hover:bg-[#0a4a5c] text-white"
                >
                  View Full Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
