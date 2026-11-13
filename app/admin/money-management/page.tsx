"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import FloatingCalculator, { useFloatingCalculator } from "@/components/FloatingCalculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/data-service"
import {
  DollarSign,
  Calculator,
  Plus,
  Edit3,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Lock,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  Calendar,
  Search,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react"

interface PaymentRecord {
  id: string
  date: string
  patientName: string
  phone: string
  sessionType: "in_clinic" | "video"
  amount: number
  paymentMethod: "cash" | "jazzcash" | "easypaisa" | "card"
  description: string
  category: "consultation" | "treatment" | "medication" | "other"
  status: "completed" | "pending" | "refunded"
  createdBy: string
}

function MoneyManagementContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [isAddRecordDialogOpen, setIsAddRecordDialogOpen] = useState(false)
  const [isEditRecordDialogOpen, setIsEditRecordDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterMethod, setFilterMethod] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [customDateStart, setCustomDateStart] = useState("")
  const [customDateEnd, setCustomDateEnd] = useState("")
  const [sortField, setSortField] = useState<"date" | "amount" | "patientName" | "status">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PaymentRecord | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const calculator = useFloatingCalculator()

  const [newRecord, setNewRecord] = useState({
    patientName: "",
    phone: "",
    sessionType: "in_clinic" as "in_clinic" | "video",
    amount: "",
    paymentMethod: "cash" as "cash" | "jazzcash" | "easypaisa" | "card",
    description: "",
    category: "consultation" as "consultation" | "treatment" | "medication" | "other",
    status: "completed" as "completed" | "pending" | "refunded"
  })

  const { toast } = useToast()

  // Check admin authentication (mirror admin dashboard/settings pattern)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1) Check localStorage flags first (set by admin auth flow)
        const isAuthenticatedLocal = typeof window !== 'undefined' ? localStorage.getItem("admin_authenticated") : null
        const storedEmail = typeof window !== 'undefined' ? localStorage.getItem("admin_email") : null

        if (isAuthenticatedLocal === "true" && storedEmail) {
          setIsAuthenticated(true)
          setIsCheckingAuth(false)
          return
        }

        // 2) Fallback to Supabase current user
        const { user } = await getCurrentUser()
        const adminEmails = [
          "bashirahmad123.org@gmail.com",
          "bashirahmad123.org@gmail.com", // ensure lowercase match
          "admin@gonsteadchiropractic.com",
          "dr.bashir@gonsteadchiropractic.com",
        ]

        const email = (user?.email || "").toLowerCase()
        if (!user || !adminEmails.includes(email)) {
          console.warn("MoneyManagement: unauthorized access, redirecting to /admin/auth")
          setIsAuthenticated(false)
          setIsCheckingAuth(false)
          router.replace("/admin/auth")
          return
        }

        // Store auth flags for future navigations (same as other admin pages)
        if (typeof window !== 'undefined') {
          localStorage.setItem("admin_authenticated", "true")
          localStorage.setItem("admin_email", user.email || "")
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("MoneyManagement: auth check failed", error)
        setIsAuthenticated(false)
        router.replace("/admin/auth")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // Load records from Supabase payment_records as primary source (with localStorage fallback + backfill)
  useEffect(() => {
    if (!isAuthenticated) return

    const loadRecords = async () => {
      setIsLoadingRecords(true)
      try {
        // 1) Read any existing local records for fallback and migration
        let localRecords: PaymentRecord[] = []
        try {
          const savedRecords = localStorage.getItem("money_records")
          if (savedRecords) {
            localRecords = JSON.parse(savedRecords)
          }
        } catch (error) {
          console.error("MoneyManagement: failed to read money_records from localStorage", error)
        }

        // 2) Try to load from Supabase payment_records
        // Load from backend API
        const res = await fetch('/api/payments', { method: 'GET' })
        if (!res.ok) {
          console.error("MoneyManagement: failed to load payment records via API", await res.text())
          if (localRecords.length > 0) setRecords(localRecords)
        } else {
          const payload = await res.json()
          const items = Array.isArray(payload.items) ? payload.items : []
          const apiRecords: PaymentRecord[] = items.map((row: any) => {
            const metadata = row.metadata || {}
            const paymentDate: string = row.paymentDate
              ? new Date(row.paymentDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
            return {
              id: row.transactionId || row.id,
              date: paymentDate,
              patientName: metadata.patient_name || "",
              phone: metadata.phone || "",
              sessionType: metadata.session_type === "video" ? "video" : "in_clinic",
              amount: typeof row.amount === "number" ? row.amount : Number(row.amount) || 0,
              paymentMethod: (row.paymentMethod as any) || "cash",
              description: row.notes || "",
              category: (row.serviceType as any) || "consultation",
              status: (row.status as any) || "completed",
              createdBy: metadata.created_by || "System",
            }
          })
          setRecords(apiRecords)
          saveRecords(apiRecords)

          // Backfill local-only records to API
          if (localRecords.length > 0) {
            const existingIds = new Set(items.map((row: any) => row.transactionId).filter((id: string) => !!id))
            const localOnly = localRecords.filter(record => !existingIds.has(record.id))
            if (localOnly.length > 0) {
              Promise.all(
                localOnly.map(record => fetch('/api/payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    transactionId: record.id,
                    paymentDate: record.date,
                    amount: record.amount,
                    paymentMethod: record.paymentMethod,
                    status: record.status,
                    serviceType: record.category,
                    notes: record.description,
                    metadata: {
                      patient_name: record.patientName,
                      phone: record.phone,
                      session_type: record.sessionType,
                      category: record.category,
                      created_by: record.createdBy,
                    }
                  })
                }))
              ).catch(err => console.error('MoneyManagement: backfill failed', err))
            }
          }
        }

        // 4) Handle pre-filled patient data from URL params (same as before)
        const patientData = searchParams.get("patient")
        if (patientData) {
          try {
            const patient = JSON.parse(decodeURIComponent(patientData))
            setNewRecord({
              patientName: patient.name || "",
              phone: patient.phone || "",
              sessionType: patient.sessionType || "in_clinic",
              amount: "",
              paymentMethod: "cash",
              description: `${patient.sessionType === "in_clinic" ? "In-Clinic" : "Video"} consultation for ${patient.name}`,
              category: "consultation",
              status: "pending",
            })
            setIsAddRecordDialogOpen(true)
            toast({
              title: "📋 Patient Data Pre-filled",
              description: `Payment form pre-filled with ${patient.name}'s details. Please add the payment amount.`,
            })
          } catch (error) {
            console.error("MoneyManagement: error parsing patient data from URL", error)
          }
        }
      } catch (error) {
        console.error("MoneyManagement: unexpected error while loading records", error)
      } finally {
        setIsLoadingRecords(false)
      }
    }

    loadRecords()
  }, [isAuthenticated, searchParams])

  // Persist records to localStorage (primary source for UI today)
  const saveRecords = (newRecords: PaymentRecord[]) => {
    setRecords(newRecords)
    try {
      localStorage.setItem("money_records", JSON.stringify(newRecords))
    } catch (error) {
      console.error("MoneyManagement: failed to persist money_records to localStorage", error)
    }
  }

  // Map UI payment record to Supabase payment_records row
  const mapToPaymentRecordRow = (record: PaymentRecord) => {
    // Map our simplified status to Supabase status enum
    const statusMap: Record<string, string> = {
      completed: 'completed',
      pending: 'pending',
      refunded: 'refunded',
    }

    const supabaseStatus = statusMap[record.status] || 'completed'

    return {
      // id is auto-generated UUID by Supabase; we use our MR-* id as business transaction_id
      patient_id: null,
      appointment_id: null,
      transaction_type: 'payment' as const,
      payment_method: record.paymentMethod,
      amount: record.amount,
      currency: 'PKR',
      status: supabaseStatus,
      transaction_id: record.id,
      reference_number: null,
      payment_date: record.date ? new Date(record.date) : new Date(),
      due_date: null,
      service_type: record.category,
      session_count: 1,
      discount_applied: 0,
      tax_amount: 0,
      notes: record.description,
      payment_proof_url: null,
      receipt_number: null,
      recorded_by: null,
      approved_by: null,
      approval_date: null,
      metadata: {
        patient_name: record.patientName,
        phone: record.phone,
        session_type: record.sessionType,
        category: record.category,
        created_by: record.createdBy,
      },
    }
  }

  // Server-backed sync helpers (use API; do not block UI)
  const syncCreateToAPI = async (record: PaymentRecord) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: record.id,
          paymentDate: record.date,
          amount: record.amount,
          paymentMethod: record.paymentMethod,
          status: record.status,
          serviceType: record.category,
          notes: record.description,
          metadata: {
            patient_name: record.patientName,
            phone: record.phone,
            session_type: record.sessionType,
            category: record.category,
            created_by: record.createdBy,
          }
        })
      })
      if (!res.ok) console.error('MoneyManagement: create API failed', await res.text())
    } catch (error) {
      console.error('MoneyManagement: unexpected error during create API sync', error)
    }
  }

  const syncUpdateToAPI = async (record: PaymentRecord) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: record.id,
          amount: record.amount,
          paymentMethod: record.paymentMethod,
          status: record.status,
          serviceType: record.category,
          notes: record.description,
          metadata: {
            patient_name: record.patientName,
            phone: record.phone,
            session_type: record.sessionType,
            category: record.category,
            created_by: record.createdBy,
          }
        })
      })
      if (!res.ok) console.error('MoneyManagement: update API failed', await res.text())
    } catch (error) {
      console.error('MoneyManagement: unexpected error during update API sync', error)
    }
  }

  const syncDeleteToAPI = async (record: PaymentRecord) => {
    try {
      const res = await fetch(`/api/payments?transactionId=${encodeURIComponent(record.id)}`, { method: 'DELETE' })
      if (!res.ok) console.error('MoneyManagement: delete API failed', await res.text())
    } catch (error) {
      console.error('MoneyManagement: unexpected error during delete API sync', error)
    }
  }

  const handleAddRecord = () => {
    if (!newRecord.patientName || !newRecord.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(newRecord.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      })
      return
    }

    const record: PaymentRecord = {
      id: `MR-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      patientName: newRecord.patientName,
      phone: newRecord.phone,
      sessionType: newRecord.sessionType,
      amount: amount,
      paymentMethod: newRecord.paymentMethod,
      description: newRecord.description,
      category: newRecord.category,
      status: newRecord.status,
      createdBy: "Dr. Bashir Khan"
    }

    const updatedRecords = [record, ...records]
    saveRecords(updatedRecords)

    // Fire-and-forget sync to API
    syncCreateToAPI(record)

    setIsAddRecordDialogOpen(false)
    setNewRecord({
      patientName: "",
      phone: "",
      sessionType: "in_clinic",
      amount: "",
      paymentMethod: "cash",
      description: "",
      category: "consultation",
      status: "completed"
    })

    toast({
      title: "✅ Record Added",
      description: `Payment record for ${record.patientName} has been added successfully`,
    })
  }

  const handleEditRecord = (record: PaymentRecord) => {
    setEditingRecord(record)
    setIsEditRecordDialogOpen(true)
  }

  const handleUpdateRecord = () => {
    if (!editingRecord) return

    if (isNaN(editingRecord.amount) || editingRecord.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      })
      return
    }

    const updatedRecords = records.map(record =>
      record.id === editingRecord.id ? editingRecord : record
    )
    saveRecords(updatedRecords)

    // Fire-and-forget sync to API
    syncUpdateToAPI(editingRecord)

    setIsEditRecordDialogOpen(false)
    setEditingRecord(null)

    toast({
      title: "✅ Record Updated",
      description: "Payment record has been updated successfully",
    })
  }

  const handleDeleteRecord = () => {
    if (!deleteConfirmRecord) return

    const updatedRecords = records.filter(record => record.id !== deleteConfirmRecord.id)
    saveRecords(updatedRecords)

    // Fire-and-forget sync to API
    syncDeleteToAPI(deleteConfirmRecord)

    setIsDeleteDialogOpen(false)
    setDeleteConfirmRecord(null)

    toast({
      title: "🗑️ Record Deleted",
      description: "Payment record has been removed successfully",
    })
  }

  const openDeleteConfirmation = (record: PaymentRecord) => {
    setDeleteConfirmRecord(record)
    setIsDeleteDialogOpen(true)
  }


  // Statistics
  const totalRevenue = records
    .filter(r => r.status === "completed")
    .reduce((sum, r) => sum + r.amount, 0)

  const monthlyRevenue = records
    .filter(r => {
      const recordDate = new Date(r.date)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      return recordDate.getMonth() === currentMonth && 
             recordDate.getFullYear() === currentYear &&
             r.status === "completed"
    })
    .reduce((sum, r) => sum + r.amount, 0)

  const pendingPayments = records
    .filter(r => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0)

  // Quick View base (respects all filters except category)
  const quickViewBase = records.filter(record => {
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phone.includes(searchTerm) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMethod = filterMethod === "all" || record.paymentMethod === filterMethod
    const matchesStatus = filterStatus === "all" || record.status === filterStatus

    let matchesDate = true
    if (dateFilter !== "all") {
      const recordDate = new Date(record.date)
      const today = new Date()

      switch (dateFilter) {
        case "today":
          matchesDate = recordDate.toDateString() === today.toDateString()
          break
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = recordDate >= weekAgo
          break
        case "month":
          matchesDate = recordDate.getMonth() === today.getMonth() && 
                       recordDate.getFullYear() === today.getFullYear()
          break
        case "custom":
          if (customDateStart && customDateEnd) {
            const start = new Date(customDateStart)
            const end = new Date(customDateEnd)
            matchesDate = recordDate >= start && recordDate <= end
          }
          break
      }
    }

    return matchesSearch && matchesMethod && matchesStatus && matchesDate
  })

  const categorySummary = {
    all: {
      count: quickViewBase.length,
      amount: quickViewBase.reduce((sum, r) => sum + r.amount, 0)
    },
    consultation: {
      count: quickViewBase.filter(r => r.category === "consultation").length,
      amount: quickViewBase.filter(r => r.category === "consultation").reduce((s, r) => s + r.amount, 0)
    },
    treatment: {
      count: quickViewBase.filter(r => r.category === "treatment").length,
      amount: quickViewBase.filter(r => r.category === "treatment").reduce((s, r) => s + r.amount, 0)
    },
    medication: {
      count: quickViewBase.filter(r => r.category === "medication").length,
      amount: quickViewBase.filter(r => r.category === "medication").reduce((s, r) => s + r.amount, 0)
    },
    other: {
      count: quickViewBase.filter(r => r.category === "other").length,
      amount: quickViewBase.filter(r => r.category === "other").reduce((s, r) => s + r.amount, 0)
    }
  } as const

  // Sorting function
  const handleSort = (field: "date" | "amount" | "patientName" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  // Filtered and sorted records
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phone.includes(searchTerm) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === "all" || record.category === filterCategory
    const matchesMethod = filterMethod === "all" || record.paymentMethod === filterMethod
    const matchesStatus = filterStatus === "all" || record.status === filterStatus
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const recordDate = new Date(record.date)
      const today = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = recordDate.toDateString() === today.toDateString()
          break
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = recordDate >= weekAgo
          break
        case "month":
          matchesDate = recordDate.getMonth() === today.getMonth() && 
                       recordDate.getFullYear() === today.getFullYear()
          break
        case "custom":
          if (customDateStart && customDateEnd) {
            const start = new Date(customDateStart)
            const end = new Date(customDateEnd)
            matchesDate = recordDate >= start && recordDate <= end
          }
          break
      }
    }

    return matchesSearch && matchesCategory && matchesMethod && matchesStatus && matchesDate
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case "amount":
        comparison = a.amount - b.amount
        break
      case "patientName":
        comparison = a.patientName.localeCompare(b.patientName)
        break
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterMethod, filterStatus, dateFilter, customDateStart, customDateEnd])

  // Export functionality
  const exportRecords = () => {
    const csvContent = [
      ["ID", "Date", "Patient Name", "Phone", "Session Type", "Amount", "Payment Method", "Category", "Status", "Description"].join(","),
      ...filteredRecords.map(record => [
        record.id,
        record.date,
        record.patientName,
        record.phone,
        record.sessionType,
        record.amount,
        record.paymentMethod,
        record.category,
        record.status,
        `"${record.description}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `money_records_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "📊 Export Successful",
      description: "Money records have been exported to CSV file",
    })
  }

  // Show lightweight loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-lg text-[#0d5c75]">Checking admin access...</div>
      </div>
    )
  }

  // If not authenticated (and already redirected), render nothing
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)] p-2 sm:p-4 md:p-6 space-y-6">
      {/* Header matching Admin Dashboard */}
      <header className="relative bg-white/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.08)] border border-[#0d5c75]/15 p-3 sm:p-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/20 to-[#2a9d8f]/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5 text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0d5c75] font-poppins tracking-tight flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-[#2a9d8f]" />
              Money Management System
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#2a9d8f] leading-none">
              Comprehensive Financial & Payment Tracking
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Monitor clinic revenue, consultations, treatments & pending balances
            </p>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Badge variant="outline" className="border-[#0d5c75]/30 bg-white/80 text-[#0d5c75] font-semibold text-xs px-3 py-1 rounded-xl shadow-xs">
              Admin Access
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 border-red-300/60 bg-white/80 hover:bg-red-50 rounded-xl h-9 text-xs sm:text-sm font-medium shadow-xs"
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">PKR {totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">All completed payments</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Revenue</p>
                  <p className="text-xl sm:text-2xl font-black text-[#0d5c75] mt-0.5">PKR {monthlyRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">This month's earnings</p>
                </div>
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#0d5c75]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payments</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5">PKR {pendingPayments.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Awaiting collection</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Records</p>
                  <p className="text-xl sm:text-2xl font-black text-[#2a9d8f] mt-0.5">{records.length}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">All transactions logged</p>
                </div>
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-[#2a9d8f]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick View Filters */}
        <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white px-5 py-3 rounded-t-2xl">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Quick Financial Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {([
                { key: "all", label: "All Records" },
                { key: "consultation", label: "Consultation" },
                { key: "treatment", label: "Treatment" },
                { key: "medication", label: "Medication" },
                { key: "other", label: "Other" },
              ] as const).map((item) => {
                const active = filterCategory === item.key
                const stats = categorySummary[item.key as keyof typeof categorySummary]
                return (
                  <button
                    key={item.key}
                    onClick={() => setFilterCategory(active ? "all" : item.key)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? "bg-teal-50 border-[#0d5c75] ring-2 ring-[#0d5c75]/30 shadow-xs"
                        : "bg-slate-50/70 border-gray-200/80 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.label}</div>
                    <div className="text-sm font-bold text-[#0d5c75] mt-0.5">{stats.count} records</div>
                    <div className="text-xs font-black text-[#2a9d8f] mt-1">PKR {stats.amount.toLocaleString()}</div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Controls Search & Filter */}
        <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white px-5 py-3 rounded-t-2xl">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0d5c75]/50" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-slate-50/70 border border-[#0d5c75]/20 text-[#0d5c75] placeholder:text-gray-400 focus:bg-white rounded-xl text-xs sm:text-sm"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                )}
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 bg-slate-50/70 border border-[#0d5c75]/20 text-gray-700 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="h-10 bg-slate-50/70 border border-[#0d5c75]/20 text-gray-700 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 bg-slate-50/70 border border-[#0d5c75]/20 text-gray-700 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 bg-slate-50/70 border border-[#0d5c75]/20 text-gray-700 rounded-xl text-xs sm:text-sm">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <Label htmlFor="startDate" className="text-xs mb-1 block font-semibold text-gray-600">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs mb-1 block font-semibold text-gray-600">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
              {/* Add Record Dialog */}
              <Dialog open={isAddRecordDialogOpen} onOpenChange={setIsAddRecordDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white rounded-xl h-9 text-xs sm:text-sm font-medium shadow-xs">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Payment Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-2xl bg-white border border-[#0d5c75]/20 shadow-2xl p-6 text-slate-800">
                  <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-[#0d5c75] font-bold text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d5c75] flex items-center justify-center border border-[#0d5c75]/15">
                        <Receipt className="h-4 w-4" />
                      </div>
                      Add New Payment Record
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="patientName" className="text-xs font-semibold text-slate-700">Patient Name *</Label>
                    <Input
                      id="patientName"
                      value={newRecord.patientName}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="Enter patient name"
                      className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">Phone</Label>
                    <Input
                      id="phone"
                      value={newRecord.phone}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionType" className="text-xs font-semibold text-slate-700">Session Type</Label>
                    <Select 
                      value={newRecord.sessionType}
                      onValueChange={(value: "in_clinic" | "video") => 
                        setNewRecord(prev => ({ ...prev, sessionType: value }))
                      }
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="in_clinic">In-Clinic</SelectItem>
                        <SelectItem value="video">Video Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">Amount (PKR) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                      className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod" className="text-xs font-semibold text-slate-700">Payment Method</Label>
                    <Select 
                      value={newRecord.paymentMethod}
                      onValueChange={(value: "cash" | "jazzcash" | "easypaisa" | "card") => 
                        setNewRecord(prev => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="jazzcash">JazzCash</SelectItem>
                        <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-xs font-semibold text-slate-700">Category</Label>
                    <Select 
                      value={newRecord.category}
                      onValueChange={(value: "consultation" | "treatment" | "medication" | "other") => 
                        setNewRecord(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="treatment">Treatment</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs font-semibold text-slate-700">Status</Label>
                    <Select 
                      value={newRecord.status}
                      onValueChange={(value: "completed" | "pending" | "refunded") => 
                        setNewRecord(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description" className="text-xs font-semibold text-slate-700">Description</Label>
                    <Textarea
                      id="description"
                      value={newRecord.description}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter payment description or notes"
                      className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75] min-h-[70px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsAddRecordDialogOpen(false)} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium h-9">
                    Cancel
                  </Button>
                  <Button onClick={handleAddRecord} className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white rounded-xl text-xs font-semibold shadow-md h-9 px-5">
                    Add Record
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={exportRecords} className="border-[#0d5c75]/30 text-[#0d5c75] bg-white hover:bg-[#0d5c75]/5 rounded-xl h-9 text-xs sm:text-sm font-medium shadow-xs">
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/60 border-b border-gray-100 py-4 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base font-bold text-[#0d5c75] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#2a9d8f]" />
              Payment Records
            </span>
            <Badge variant="outline" className="border-[#0d5c75]/20 bg-white text-[#0d5c75] text-xs font-semibold px-2.5 py-0.5 rounded-lg">
              {filteredRecords.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          {isLoadingRecords ? (
            <div className="text-center py-12">
              <div className="text-lg font-medium text-[#0d5c75]">Loading payment records from Supabase...</div>
              <p className="text-gray-500 mt-2">Please wait a moment.</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Records Found</h3>
              <p className="text-gray-500">
                {records.length === 0 
                  ? "Start by adding your first payment record." 
                  : "No records match your current filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-b border-gray-100">
                    <TableHead className="text-[#0d5c75] font-semibold text-xs sm:text-sm">ID</TableHead>
                    <TableHead 
                      className="text-[#0d5c75] font-semibold text-xs sm:text-sm cursor-pointer hover:bg-gray-100/70 transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === "date" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-40" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[#0d5c75] font-semibold text-xs sm:text-sm cursor-pointer hover:bg-gray-100/70 transition-colors"
                      onClick={() => handleSort("patientName")}
                    >
                      <div className="flex items-center gap-1">
                        Patient
                        {sortField === "patientName" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-40" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[#0d5c75] font-semibold text-xs sm:text-sm cursor-pointer hover:bg-gray-100/70 transition-colors"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        {sortField === "amount" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-40" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-[#0d5c75] font-semibold text-xs sm:text-sm">Payment</TableHead>
                    <TableHead className="text-[#0d5c75] font-semibold text-xs sm:text-sm">Category</TableHead>
                    <TableHead 
                      className="text-[#0d5c75] font-semibold text-xs sm:text-sm cursor-pointer hover:bg-gray-100/70 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortField === "status" ? (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-40" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-[#0d5c75] font-semibold text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/70 transition-colors border-b border-gray-100/80">
                      <TableCell className="font-mono text-xs text-gray-500">{record.id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-700 font-medium">{record.date}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-gray-900">{record.patientName}</div>
                          {record.phone && (
                            <div className="text-[11px] text-gray-500">{record.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs sm:text-sm text-emerald-600">
                          PKR {record.amount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {record.sessionType === "in_clinic" ? "In-Clinic" : "Video"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-700">
                          {record.paymentMethod === "cash" && <Banknote className="h-3.5 w-3.5 text-emerald-600" />}
                          {record.paymentMethod === "card" && <CreditCard className="h-3.5 w-3.5 text-blue-600" />}
                          {(record.paymentMethod === "jazzcash" || record.paymentMethod === "easypaisa") && <Wallet className="h-3.5 w-3.5 text-amber-600" />}
                          <span className="capitalize">{record.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[11px] border-[#0d5c75]/20 text-[#0d5c75] bg-teal-50/50">
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "completed"
                              ? "default"
                              : record.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className={`capitalize text-[11px] ${
                            record.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : record.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                          }`}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRecord(record)}
                            className="h-8 w-8 p-0 rounded-lg border-[#2a9d8f]/40 text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteConfirmation(record)}
                            className="h-8 w-8 p-0 rounded-lg border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {filteredRecords.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-slate-50/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Items per page:</span>
                    <Select 
                      value={itemsPerPage.toString()} 
                      onValueChange={(value) => {
                        setItemsPerPage(parseInt(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-18 h-8 rounded-lg text-xs border-[#0d5c75]/20 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="border-[#0d5c75]/30 text-[#0d5c75] bg-white rounded-lg h-8 px-2.5 text-xs font-medium"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-[#0d5c75]/30 text-[#0d5c75] bg-white rounded-lg h-8 px-2 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold px-2 text-[#0d5c75]">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-[#0d5c75]/30 text-[#0d5c75] bg-white rounded-lg h-8 px-2 text-xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="border-[#0d5c75]/30 text-[#0d5c75] bg-white rounded-lg h-8 px-2.5 text-xs font-medium"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </main>

      {/* Edit Record Dialog */}
      <Dialog open={isEditRecordDialogOpen} onOpenChange={setIsEditRecordDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-[#0d5c75]/20 shadow-2xl p-6 text-slate-800">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-[#0d5c75] font-bold text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d5c75] flex items-center justify-center border border-[#0d5c75]/15">
                <Edit3 className="h-4 w-4" />
              </div>
              Edit Payment Record
            </DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="editPatientName" className="text-xs font-semibold text-slate-700">Patient Name *</Label>
                <Input
                  id="editPatientName"
                  value={editingRecord.patientName}
                  onChange={(e) => setEditingRecord(prev => prev ? ({ ...prev, patientName: e.target.value }) : null)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75]"
                />
              </div>
              <div>
                <Label htmlFor="editPhone" className="text-xs font-semibold text-slate-700">Phone</Label>
                <Input
                  id="editPhone"
                  value={editingRecord.phone}
                  onChange={(e) => setEditingRecord(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75]"
                />
              </div>
              <div>
                <Label htmlFor="editAmount" className="text-xs font-semibold text-slate-700">Amount (PKR) *</Label>
                <Input
                  id="editAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editingRecord.amount}
                  onChange={(e) => setEditingRecord(prev => prev ? ({ ...prev, amount: parseFloat(e.target.value) }) : null)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75]"
                />
              </div>
              <div>
                <Label htmlFor="editPaymentMethod" className="text-xs font-semibold text-slate-700">Payment Method</Label>
                <Select 
                  value={editingRecord.paymentMethod}
                  onValueChange={(value: "cash" | "jazzcash" | "easypaisa" | "card") => 
                    setEditingRecord(prev => (prev ? { ...prev, paymentMethod: value } : null))
                  }
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                    <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCategory" className="text-xs font-semibold text-slate-700">Category</Label>
                <Select 
                  value={editingRecord.category}
                  onValueChange={(value: "consultation" | "treatment" | "medication" | "other") => 
                    setEditingRecord(prev => (prev ? { ...prev, category: value } : null))
                  }
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editStatus" className="text-xs font-semibold text-slate-700">Status</Label>
                <Select 
                  value={editingRecord.status}
                  onValueChange={(value: "completed" | "pending" | "refunded") => 
                    setEditingRecord(prev => (prev ? { ...prev, status: value } : null))
                  }
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="editDescription" className="text-xs font-semibold text-slate-700">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingRecord.description}
                  onChange={(e) => setEditingRecord(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl mt-1 text-xs focus:border-[#0d5c75] focus:ring-1 focus:ring-[#0d5c75] min-h-[70px]"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsEditRecordDialogOpen(false)} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium h-9">
              Cancel
            </Button>
            <Button onClick={handleUpdateRecord} className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white rounded-xl text-xs font-semibold shadow-md h-9 px-5">
              Update Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          {deleteConfirmRecord && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this payment record? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">ID:</span>
                  <span className="text-sm font-mono">{deleteConfirmRecord.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Patient:</span>
                  <span className="text-sm font-semibold">{deleteConfirmRecord.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Amount:</span>
                  <span className="text-sm font-bold text-green-600">PKR {deleteConfirmRecord.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Date:</span>
                  <span className="text-sm">{deleteConfirmRecord.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Status:</span>
                  <Badge
                    variant={
                      deleteConfirmRecord.status === "completed"
                        ? "default"
                        : deleteConfirmRecord.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {deleteConfirmRecord.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteConfirmRecord(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteRecord}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Money Record Floating Button */}
      {isAuthenticated && (
        <div className="fixed bottom-6 left-20 sm:left-24 z-40">
          <Button
            onClick={() => setIsAddRecordDialogOpen(true)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#2a9d8f] to-[#0d5c75] hover:from-[#238a7a] hover:to-[#0a4a5c] shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-4 border-white/30"
            title="Quick Add Payment Record"
          >
            <Plus className="h-6 w-6 text-white" />
          </Button>
          <div className="absolute -top-2.5 -right-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Enhanced Calculator Toggle Button */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={calculator.toggleCalculator}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-4 border-white/30"
            title="Advanced Professional Calculator"
          >
            <Calculator className="h-6 w-6 text-white" />
          </Button>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Advanced Floating Calculator */}
      <FloatingCalculator 
        isOpen={calculator.isOpen}
        onClose={calculator.closeCalculator}
        onToggle={calculator.toggleCalculator}
      />
    </div>
  )
}

export default function MoneyManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <MoneyManagementContent />
    </Suspense>
  )
}
