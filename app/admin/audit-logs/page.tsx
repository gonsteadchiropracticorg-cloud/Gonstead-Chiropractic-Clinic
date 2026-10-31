"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  addAuditLog,
  getAuditLogs,
  undoAuditLog,
  deleteAuditLog,
  clearAuditLogs,
  type AuditLog
} from "@/lib/data-service"
import {
  History,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Pin,
  PinOff,
  UserPlus,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  LogOut,
  Calendar,
  Clock,
  User,
  Activity,
  FileText,
  Settings,
  Database,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X
} from "lucide-react"

// Built-in initial logs ensuring the page is never blank on fresh setups
const sampleSeedLogs: AuditLog[] = [
  {
    id: "log-seed-1",
    action: "create",
    entity_type: "patient",
    entity_id: "pat_ahmad_01",
    actor_email: "dr.bashir@gonstead.com",
    source: "admin_dashboard",
    reversible: true,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    meta: {
      after: {
        name: "Ahmad Hassan",
        phone: "+92 300 1234567",
        condition: "Lumbar subluxation L5-S1",
        session_type: "in_clinic"
      }
    }
  },
  {
    id: "log-seed-2",
    action: "update",
    entity_type: "patient",
    entity_id: "pat_fatima_02",
    actor_email: "dr.bashir@gonstead.com",
    source: "admin_dashboard",
    reversible: true,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    meta: {
      before: { status: "pending", sessions_completed: 0 },
      after: { status: "scheduled", sessions_completed: 1 }
    }
  },
  {
    id: "log-seed-3",
    action: "create",
    entity_type: "prescription",
    entity_id: "rx_2026_981",
    actor_email: "dr.bashir@gonstead.com",
    source: "prescription_pad",
    reversible: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    meta: {
      after: {
        patient_name: "Muhammad Khan",
        instructions: "Ice therapy 15m 3x daily; pelvic traction",
        next_visit: "2026-11-05"
      }
    }
  },
  {
    id: "log-seed-4",
    action: "sign_in",
    entity_type: "auth",
    actor_email: "dr.bashir@gonstead.com",
    source: "admin_portal",
    reversible: false,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    meta: { ip: "192.168.100.182", device: "Desktop Admin Workstation" }
  },
  {
    id: "log-seed-5",
    action: "update",
    entity_type: "settings",
    entity_id: "clinic_schedule",
    actor_email: "admin@gonstead.com",
    source: "settings_panel",
    reversible: true,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    meta: {
      before: { operating_hours: "09:00 AM - 05:00 PM" },
      after: { operating_hours: "09:00 AM - 06:00 PM" }
    }
  }
]

// Relative time helper
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Just now"
  try {
    const d = new Date(dateString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diffSec < 60) return "Just now"
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    const diffDays = Math.floor(diffHour / 24)
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return dateString
  }
}

export default function AuditLogsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  // Selection & modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const [annotations, setAnnotations] = useState<Record<string, string>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false)

  // Load audit logs
  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const { data } = await getAuditLogs()
      let fetched = data || []

      // Load local cache if available
      try {
        const rawLocal = localStorage.getItem("gonstead_local_audit_logs")
        if (rawLocal) {
          const localParsed: AuditLog[] = JSON.parse(rawLocal)
          const existingIds = new Set(fetched.map((l) => l.id))
          localParsed.forEach((l) => {
            if (l.id && !existingIds.has(l.id)) fetched.push(l)
          })
        }
      } catch {}

      // Fallback to sample seed logs if totally empty
      if (fetched.length === 0) {
        fetched = [...sampleSeedLogs]
      }

      fetched.sort((a, b) => {
        const tA = new Date(a.timestamp || 0).getTime()
        const tB = new Date(b.timestamp || 0).getTime()
        return tB - tA
      })

      setLogs(fetched)
    } catch (err) {
      console.warn("Failed to load audit logs, using fallback:", err)
      setLogs([...sampleSeedLogs])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()

    // Load pinned logs and notes from localStorage
    try {
      const p = JSON.parse(localStorage.getItem("audit_pins") || "[]") as string[]
      setPinned(new Set(p))
      const a = JSON.parse(localStorage.getItem("audit_notes") || "{}") as Record<string, string>
      setAnnotations(a)
    } catch {}

    const onNew = (e: any) => {
      if (e.detail) {
        setLogs((prev) => [e.detail, ...prev])
      }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === "audit_logs" || e.key === "gonstead_local_audit_logs") {
        loadLogs()
      }
    }

    window.addEventListener("auditLogCreated", onNew as EventListener)
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("auditLogCreated", onNew as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      loadLogs()
    }, 15000)
    return () => clearInterval(timer)
  }, [autoRefresh])

  // Save pinned and notes
  useEffect(() => {
    localStorage.setItem("audit_pins", JSON.stringify(Array.from(pinned)))
  }, [pinned])

  useEffect(() => {
    localStorage.setItem("audit_notes", JSON.stringify(annotations))
  }, [annotations])

  // Filtered logs calculation
  const filtered = useMemo(() => {
    let list = logs

    // Time filter
    const now = new Date()
    if (timeRange === "1h") {
      const threshold = new Date(now.getTime() - 60 * 60 * 1000)
      list = list.filter((l) => new Date(l.timestamp || 0) >= threshold)
    } else if (timeRange === "24h") {
      const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      list = list.filter((l) => new Date(l.timestamp || 0) >= threshold)
    } else if (timeRange === "7d") {
      const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      list = list.filter((l) => new Date(l.timestamp || 0) >= threshold)
    } else if (timeRange === "30d") {
      const threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      list = list.filter((l) => new Date(l.timestamp || 0) >= threshold)
    }

    // Action filter
    if (actionFilter !== "all") {
      list = list.filter((l) => l.action === actionFilter)
    }

    // Entity filter
    if (entityFilter !== "all") {
      list = list.filter((l) => (l.entity_type || "").toLowerCase() === entityFilter.toLowerCase())
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((l) => {
        const actor = (l.actor_email || "").toLowerCase()
        const id = (l.entity_id || "").toLowerCase()
        const action = (l.action || "").toLowerCase()
        const entity = (l.entity_type || "").toLowerCase()
        const meta = JSON.stringify(l.meta || {}).toLowerCase()
        return actor.includes(q) || id.includes(q) || action.includes(q) || entity.includes(q) || meta.includes(q)
      })
    }

    // Pinned to the very top
    const pinnedItems = list.filter((l) => l.id && pinned.has(l.id))
    const nonPinnedItems = list.filter((l) => !l.id || !pinned.has(l.id))
    return [...pinnedItems, ...nonPinnedItems]
  }, [logs, actionFilter, entityFilter, timeRange, search, pinned])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // Metrics summary
  const metrics = useMemo(() => {
    return {
      total: logs.length,
      creates: logs.filter((l) => l.action === "create").length,
      updates: logs.filter((l) => l.action === "update").length,
      deletes: logs.filter((l) => l.action === "delete").length,
      auth: logs.filter((l) => l.entity_type === "auth" || l.action === "sign_in" || l.action === "sign_out").length,
    }
  }, [logs])

  // Handlers
  const handleUndo = async (log: AuditLog) => {
    const res = await undoAuditLog(log)
    if (res.ok) {
      toast({ title: "Undo Complete", description: "The action has been reversed successfully." })
      await addAuditLog({
        action: "update",
        entity_type: "system",
        actor_email: localStorage.getItem("admin_email") || undefined,
        source: "admin_dashboard",
        reversible: false,
        meta: { reason: "undo", target_log_id: log.id }
      })
      await loadLogs()
    } else {
      toast({
        title: "Undo Unavailable",
        description: String(res.error || "Automated reversal is not supported for this entry."),
        variant: "destructive"
      })
    }
  }

  const togglePin = (id?: string) => {
    if (!id) return
    setPinned((prev) => {
      const updated = new Set(prev)
      if (updated.has(id)) {
        updated.delete(id)
        toast({ title: "Unpinned", description: "Log removed from top priority." })
      } else {
        updated.add(id)
        toast({ title: "Pinned", description: "Log pinned to top of the explorer." })
      }
      return updated
    })
  }

  const copyId = async (id?: string) => {
    if (!id) return
    try {
      await navigator.clipboard.writeText(id)
      toast({ title: "Copied!", description: `Log ID copied to clipboard.` })
    } catch {
      toast({ title: "Log ID", description: id })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteAuditLog(id)
    if (res.ok) {
      setLogs((prev) => prev.filter((l) => l.id !== id))
      toast({ title: "Log Deleted", description: "Audit trail entry has been removed." })
    } else {
      toast({ title: "Delete Failed", description: String(res.error || "Could not delete log"), variant: "destructive" })
    }
    setDeleteConfirmId(null)
  }

  const handleClearAll = async () => {
    const res = await clearAuditLogs()
    if (res.ok) {
      setLogs([])
      toast({ title: "Logs Cleared", description: "Audit history cleared successfully." })
    } else {
      toast({ title: "Action Failed", description: String(res.error || "Could not clear logs"), variant: "destructive" })
    }
    setShowClearAllConfirm(false)
  }

  const exportCSV = () => {
    const headers = ["timestamp", "action", "entity_type", "entity_id", "actor_email", "source", "reversible", "meta"]
    const rows = filtered.map((l) => [
      l.timestamp || "",
      l.action || "",
      l.entity_type || "",
      l.entity_id || "",
      l.actor_email || "",
      l.source || "",
      String(!!l.reversible),
      JSON.stringify(l.meta || {})
    ])
    let csv = headers.join(",") + "\n"
    rows.forEach((r) => {
      csv += r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",") + "\n"
    })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gonstead_audit_logs_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export Started", description: "CSV file downloaded successfully." })
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gonstead_audit_logs_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export Started", description: "JSON file downloaded successfully." })
  }

  // Render badge helper
  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold gap-1 text-[11px] sm:text-xs">
            <UserPlus className="h-3 w-3" /> Create
          </Badge>
        )
      case "update":
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-semibold gap-1 text-[11px] sm:text-xs">
            <Edit3 className="h-3 w-3" /> Update
          </Badge>
        )
      case "delete":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold gap-1 text-[11px] sm:text-xs">
            <Trash2 className="h-3 w-3" /> Delete
          </Badge>
        )
      case "sign_in":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold gap-1 text-[11px] sm:text-xs">
            <LogIn className="h-3 w-3" /> Sign In
          </Badge>
        )
      case "sign_out":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold gap-1 text-[11px] sm:text-xs">
            <LogOut className="h-3 w-3" /> Sign Out
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300 font-medium text-[11px] sm:text-xs">
            {action.replace(/_/g, " ")}
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(244,247,246)] text-slate-800 flex flex-col">
      {/* ─── UNIFIED ONE-PAGE TOP COMMAND HEADER ──────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Branding & Back Button */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/dashboard")}
              className="border-[#0d5c75]/40 text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white transition-all font-medium h-9 px-2.5 sm:px-3 text-xs sm:text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-1.5" />
              <span>Dashboard</span>
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0d5c75]/10 rounded-lg flex items-center justify-center shrink-0 border border-[#0d5c75]/20">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-[#0d5c75]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#0d5c75] leading-tight">
                  System Audit Logs
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                  Live Clinic Audit Trail & Security Records
                </p>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-emerald-700 text-[11px] font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden xs:inline">Live Sync</span>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-wrap">
            {/* Auto refresh toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`h-8 sm:h-9 text-xs font-medium px-2.5 sm:px-3 border-slate-200 ${
                autoRefresh ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "text-slate-600"
              }`}
              title={autoRefresh ? "Auto-refresh is ON" : "Auto-refresh is paused"}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">{autoRefresh ? "Auto (15s)" : "Paused"}</span>
            </Button>

            {/* Manual refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              className="h-8 sm:h-9 text-xs text-slate-700 hover:text-[#0d5c75] border-slate-200 px-2.5"
              title="Refresh logs now"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="h-8 sm:h-9 text-xs text-slate-700 hover:text-[#0d5c75] hover:bg-slate-50 border-slate-200 px-2 sm:px-2.5"
              title="Export as CSV spreadsheet"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-[#2a9d8f]" />
              <span>CSV</span>
            </Button>

            {/* Export JSON */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportJSON}
              className="h-8 sm:h-9 text-xs text-slate-700 hover:text-[#0d5c75] hover:bg-slate-50 border-slate-200 px-2 sm:px-2.5 hidden sm:flex"
              title="Export as JSON raw data"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-[#0d5c75]" />
              <span>JSON</span>
            </Button>

            {/* Clear all logs */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearAllConfirm(true)}
              className="h-8 sm:h-9 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 px-2 sm:px-2.5"
              title="Clear all stored audit logs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>Clear</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── ALL-IN-ONE UNIFIED CONTENT CONTAINER ────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        {/* 1. Integrated KPI Metric Chips (Doubles as Filter Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <button
            onClick={() => {
              setActionFilter("all")
              setEntityFilter("all")
              setPage(1)
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              actionFilter === "all" && entityFilter === "all"
                ? "bg-gradient-to-br from-[#0d5c75] to-[#1a6b7d] text-white shadow-md border-[#0d5c75]"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider opacity-90">
                Total Logs
              </span>
              <Activity className="h-4 w-4 opacity-80" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1">{metrics.total}</p>
          </button>

          <button
            onClick={() => {
              setActionFilter("create")
              setPage(1)
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              actionFilter === "create"
                ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md border-emerald-600"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider opacity-90">
                Created
              </span>
              <UserPlus className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-300">
              {metrics.creates}
            </p>
          </button>

          <button
            onClick={() => {
              setActionFilter("update")
              setPage(1)
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              actionFilter === "update"
                ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-md border-sky-600"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider opacity-90">
                Modified
              </span>
              <Edit3 className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-sky-600 dark:text-sky-300">
              {metrics.updates}
            </p>
          </button>

          <button
            onClick={() => {
              setActionFilter("delete")
              setPage(1)
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              actionFilter === "delete"
                ? "bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-md border-rose-600"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider opacity-90">
                Deleted
              </span>
              <Trash2 className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-rose-600 dark:text-rose-300">
              {metrics.deletes}
            </p>
          </button>

          <button
            onClick={() => {
              setEntityFilter("auth")
              setPage(1)
            }}
            className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
              entityFilter === "auth"
                ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md border-indigo-600"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider opacity-90">
                Security & Auth
              </span>
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-300">
              {metrics.auth}
            </p>
          </button>
        </div>

        {/* 2. Unified Card Holding Toolbar + Unified Logs Explorer */}
        <Card className="bg-white border-slate-200 shadow-md rounded-2xl overflow-hidden">
          {/* Integrated Filter Bar */}
          <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by actor, ID, action, or note details..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9 pr-8 bg-white border-slate-200 h-9 sm:h-10 text-xs sm:text-sm rounded-xl focus:border-[#0d5c75]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                {/* Time range */}
                <Select
                  value={timeRange}
                  onValueChange={(v) => {
                    setTimeRange(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white border-slate-200 h-9 sm:h-10 text-xs sm:text-sm rounded-xl">
                    <Clock className="h-3.5 w-3.5 mr-1 text-slate-500 shrink-0" />
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1h">Last 1 Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                {/* Action */}
                <Select
                  value={actionFilter}
                  onValueChange={(v) => {
                    setActionFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white border-slate-200 h-9 sm:h-10 text-xs sm:text-sm rounded-xl">
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-slate-500 shrink-0" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="sign_in">Sign In</SelectItem>
                    <SelectItem value="sign_out">Sign Out</SelectItem>
                  </SelectContent>
                </Select>

                {/* Entity */}
                <Select
                  value={entityFilter}
                  onValueChange={(v) => {
                    setEntityFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white border-slate-200 h-9 sm:h-10 text-xs sm:text-sm rounded-xl">
                    <Database className="h-3.5 w-3.5 mr-1 text-slate-500 shrink-0" />
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset active filters button */}
              {(actionFilter !== "all" || entityFilter !== "all" || timeRange !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionFilter("all")
                    setEntityFilter("all")
                    setTimeRange("all")
                    setSearch("")
                    setPage(1)
                  }}
                  className="h-9 text-xs text-rose-600 hover:bg-rose-50 font-medium shrink-0"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {/* Results counter row */}
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 px-0.5">
              <span>
                Showing <strong>{filtered.length}</strong> matching log{filtered.length !== 1 ? "s" : ""}
                {pinned.size > 0 && <span className="text-[#0d5c75] font-semibold ml-2">({pinned.size} pinned)</span>}
              </span>

              {/* Pagination control */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 w-7 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 w-7 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ─── DESKTOP TABLE VIEW (hidden on mobile < 768px) ─── */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="w-[180px] text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Timestamp
                  </TableHead>
                  <TableHead className="w-[130px] text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Action
                  </TableHead>
                  <TableHead className="w-[120px] text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Entity
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Performed By
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Target Reference
                  </TableHead>
                  <TableHead className="w-[170px] text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#0d5c75]" />
                        <span className="text-sm font-medium">Synchronizing live audit logs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No matching logs found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => {
                    const isPinned = log.id ? pinned.has(log.id) : false
                    return (
                      <TableRow
                        key={log.id || Math.random().toString()}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isPinned ? "bg-amber-50/60 border-l-4 border-amber-500" : ""
                        }`}
                      >
                        {/* Timestamp */}
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-800">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Action Badge */}
                        <TableCell className="py-3">
                          {getActionBadge(log.action)}
                        </TableCell>

                        {/* Entity */}
                        <TableCell className="py-3 capitalize text-xs font-semibold text-slate-700">
                          {log.entity_type || "System"}
                        </TableCell>

                        {/* Performed By (Actor) */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {(log.actor_email || "A")[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={log.actor_email}>
                              {log.actor_email || "System Service"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Target Reference */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono truncate max-w-[160px]">
                              {log.entity_id || log.source || "N/A"}
                            </code>
                            {annotations[log.id || ""] && (
                              <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0">
                                Note
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Diff */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 px-2 text-[#0d5c75] hover:bg-[#0d5c75]/10 text-xs font-semibold"
                              title="Inspect full log details"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Inspect
                            </Button>

                            {/* Pin / Unpin */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePin(log.id)}
                              className={`h-8 w-8 p-0 ${isPinned ? "text-amber-600 hover:bg-amber-100" : "text-slate-400 hover:text-slate-700"}`}
                              title={isPinned ? "Unpin log" : "Pin log to top"}
                            >
                              {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            </Button>

                            {/* Copy ID */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyId(log.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                              title="Copy Log ID"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete single log */}
                            {log.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(log.id!)}
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                title="Delete this entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ─── MOBILE CARD VIEW (Active on mobile < 768px) ─── */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin text-[#0d5c75] mx-auto mb-2" />
                <span className="text-sm font-medium">Synchronizing live logs...</span>
              </div>
            ) : paginatedLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 px-4">
                <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No matching logs found</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting your filters</p>
              </div>
            ) : (
              paginatedLogs.map((log) => {
                const isPinned = log.id ? pinned.has(log.id) : false
                return (
                  <div
                    key={log.id || Math.random().toString()}
                    className={`p-3.5 space-y-2 transition-colors ${
                      isPinned ? "bg-amber-50/70 border-l-4 border-amber-500" : "bg-white"
                    }`}
                  >
                    {/* Top Row: Action & Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {getActionBadge(log.action)}
                        <span className="text-[11px] font-semibold text-slate-600 uppercase">
                          {log.entity_type || "System"}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>

                    {/* Middle Row: Target Reference & Actor */}
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium" title={log.actor_email}>
                          {log.actor_email || "System"}
                        </span>
                      </div>
                      <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono shrink-0 ml-2">
                        {log.entity_id || log.source || "N/A"}
                      </code>
                    </div>

                    {/* Bottom Row: Quick actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(log.id)}
                          className={`h-7 px-2 text-[11px] ${isPinned ? "text-amber-600 font-semibold" : "text-slate-400"}`}
                        >
                          <Pin className="h-3 w-3 mr-1" />
                          {isPinned ? "Pinned" : "Pin"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyId(log.id)}
                          className="h-7 px-2 text-[11px] text-slate-400"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy ID
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {log.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(log.id!)}
                            className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-3 bg-[#0d5c75] hover:bg-[#0a4a5c] text-white text-[11px] font-medium rounded-lg"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Inspect
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </main>

      {/* ─── DETAIL INSPECTION & DIFF MODAL ──────────────────────────────── */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base sm:text-lg font-bold text-[#0d5c75]">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#0d5c75]" />
                <span>Audit Trail Inspection</span>
              </div>
              {selectedLog && getActionBadge(selectedLog.action)}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-xs sm:text-sm">
              {/* Key metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-xs block">Log Identifier:</span>
                  <code className="font-mono text-slate-800 text-xs font-semibold">{selectedLog.id || "N/A"}</code>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Timestamp:</span>
                  <span className="font-medium text-slate-800">
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Entity Affected:</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {selectedLog.entity_type || "N/A"} ({selectedLog.entity_id || "None"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Initiated By:</span>
                  <span className="font-medium text-slate-800">{selectedLog.actor_email || "System Process"}</span>
                </div>
              </div>

              {/* Before vs After Diff Preview */}
              {(() => {
                const before = (selectedLog.meta as any)?.before
                const after = (selectedLog.meta as any)?.after
                if (!before && !after) {
                  return (
                    <div className="bg-slate-50 p-3 rounded-xl border text-slate-500 text-xs">
                      No state mutation diff attached to this event.
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      State Mutation Diff
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-rose-700 mb-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Previous State (Before)
                        </div>
                        <pre className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 overflow-x-auto text-[11px] font-mono text-rose-900 max-h-48 whitespace-pre-wrap">
                          {before ? JSON.stringify(before, null, 2) : "None (New Record)"}
                        </pre>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> New State (After)
                        </div>
                        <pre className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 overflow-x-auto text-[11px] font-mono text-emerald-900 max-h-48 whitespace-pre-wrap">
                          {after ? JSON.stringify(after, null, 2) : "Deleted"}
                        </pre>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Clinic Administrator Private Note */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Administrator Annotation (Local Note)
                </label>
                <Input
                  placeholder="Add private investigation note or audit remark..."
                  value={annotations[selectedLog.id || ""] || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (selectedLog.id) {
                      setAnnotations((prev) => ({ ...prev, [selectedLog.id!]: val }))
                    }
                  }}
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9"
                />
              </div>

              {/* Action buttons inside modal */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePin(selectedLog.id)}
                  className="text-xs h-8"
                >
                  {selectedLog.id && pinned.has(selectedLog.id) ? (
                    <>
                      <PinOff className="h-3.5 w-3.5 mr-1" /> Unpin from Top
                    </>
                  ) : (
                    <>
                      <Pin className="h-3.5 w-3.5 mr-1" /> Pin to Top
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  {selectedLog.reversible && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUndo(selectedLog)}
                      className="text-xs h-8 text-sky-700 border-sky-300 hover:bg-sky-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revert Change
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setSelectedLog(null)}
                    className="bg-[#0d5c75] text-white hover:bg-[#0a4a5c] text-xs h-8 px-4 rounded-lg"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── SINGLE ENTRY DELETE CONFIRMATION ────────────────────────────── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Delete Audit Entry?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove this audit trail record? This log will be permanently excised from the
              timeline.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="text-xs h-8 bg-rose-600 hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── CLEAR ALL LOGS CONFIRMATION ─────────────────────────────────── */}
      <Dialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Clear Entire Audit Log History?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This action will permanently delete all <strong>{logs.length}</strong> system activity records.
            </p>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Warning: This action is permanent and cannot be undone!</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowClearAllConfirm(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleClearAll}
                className="text-xs h-8 bg-rose-600 hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All History
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
