"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addAuditLog, getAuditLogs, undoAuditLog, type AuditLog } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Activity, History, Filter, RotateCcw, RefreshCw, Search, ShieldAlert, UserCheck, Settings, Database } from "lucide-react"
import AdminSidebar from "@/components/AdminSidebar"

export default function AuditLogsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    load()
    // realtime via custom event + storage fallback
    const onNew = (e: any) => {
      const entry: AuditLog = e.detail
      setLogs(prev => [entry, ...prev])
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'audit_logs') load()
    }
    window.addEventListener('auditLogCreated', onNew as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('auditLogCreated', onNew as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const load = async () => {
    setIsLoading(true)
    const { data } = await getAuditLogs()
    setLogs((data || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
    setIsLoading(false)
  }

  const filtered = useMemo(() => {
    let arr = logs
    if (actionFilter !== 'all') arr = arr.filter(l => l.action === actionFilter)
    if (entityFilter !== 'all') arr = arr.filter(l => (l.entity_type || 'unknown') === entityFilter)
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(l =>
        (l.actor_email || '').toLowerCase().includes(q) ||
        (l.entity_id || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        JSON.stringify(l.meta || {}).toLowerCase().includes(q)
      )
    }
    return arr
  }, [logs, actionFilter, entityFilter, search])

  const quickViews = [
    { id: 'today', title: 'Today', icon: RefreshCw, filter: { action: 'all', entity: 'all' }, count: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length },
    { id: 'auth', title: 'Auth Events', icon: UserCheck, filter: { action: 'all', entity: 'auth' }, count: logs.filter(l => l.entity_type === 'auth').length },
    { id: 'created', title: 'Patient Created', icon: Activity, filter: { action: 'create', entity: 'patient' }, count: logs.filter(l => l.action === 'create' && l.entity_type === 'patient').length },
    { id: 'updated', title: 'Patient Updated', icon: Settings, filter: { action: 'update', entity: 'patient' }, count: logs.filter(l => l.action === 'update' && l.entity_type === 'patient').length },
    { id: 'deleted', title: 'Patient Deleted', icon: ShieldAlert, filter: { action: 'delete', entity: 'patient' }, count: logs.filter(l => l.action === 'delete' && l.entity_type === 'patient').length },
    { id: 'data', title: 'Data Ops', icon: Database, filter: { action: 'all', entity: 'system' }, count: logs.filter(l => l.entity_type === 'system').length },
  ]

  const handleUndo = async (log: AuditLog) => {
    const res = await undoAuditLog(log)
    if (res.ok) {
      toast({ title: 'Undo complete', description: 'Change has been reversed.' })
      await addAuditLog({ action: 'update', entity_type: 'system', actor_email: localStorage.getItem('admin_email') || undefined, source: 'admin_dashboard', reversible: false, meta: { reason: 'undo', target: log.id } })
      await load()
    } else {
      toast({ title: 'Undo failed', description: String(res.error || 'Not supported'), variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold">Audit Logs</h1>
              <p className="text-xs text-gray-500">Real-time system activity with undo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={load} className="text-gray-600 hover:text-emerald-700">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9 w-64" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Views */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickViews.map(q => {
            const Icon = q.icon
            return (
              <button key={q.id} onClick={() => { setActionFilter(q.filter.action); setEntityFilter(q.filter.entity) }} className="bg-white rounded-xl shadow hover:shadow-md transition p-4 text-left group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                    <div>
                      <div className="font-semibold text-gray-800">{q.title}</div>
                      <div className="text-xs text-gray-500">Click to filter</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">{q.count}</Badge>
                </div>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">Filters</span>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="rename">Rename</SelectItem>
                <SelectItem value="sign_in">Sign In</SelectItem>
                <SelectItem value="sign_out">Sign Out</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-white">
          <CardHeader className="py-4"><CardTitle className="text-base">Logs</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[100px]">Undo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No logs found</TableCell></TableRow>
                ) : (
                  filtered.map(log => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-800 capitalize">{log.action.replace(/_/g,' ')}</Badge></TableCell>
                      <TableCell className="capitalize">{log.entity_type || '-'}</TableCell>
                      <TableCell className="text-sm">{log.actor_email || '-'}</TableCell>
                      <TableCell className="text-xs text-gray-500">{log.entity_id || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} className="text-emerald-700">View</Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled={!log.reversible} onClick={() => handleUndo(log)} className="text-red-600 disabled:text-gray-300">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">ID:</span> {selectedLog.id}</div>
              <div><span className="font-medium">Time:</span> {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div><span className="font-medium">Action:</span> {selectedLog.action}</div>
              <div><span className="font-medium">Entity:</span> {selectedLog.entity_type} ({selectedLog.entity_id})</div>
              <div><span className="font-medium">Actor:</span> {selectedLog.actor_email || '-'}</div>
              <div className="mt-2">
                <div className="font-medium mb-1">Meta</div>
                <pre className="bg-gray-50 rounded p-3 overflow-auto text-xs whitespace-pre-wrap">{JSON.stringify(selectedLog.meta || {}, null, 2)}</pre>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => handleUndo(selectedLog)} disabled={!selectedLog.reversible}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Undo this change
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
