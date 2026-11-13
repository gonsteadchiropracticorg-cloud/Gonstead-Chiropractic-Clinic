"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type StaffAccount } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { 
  UserPlus, 
  Shield, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  Link2, 
  Search, 
  Users, 
  SlidersHorizontal, 
  Activity, 
  Loader2,
  UserCheck,
  UserX,
  ShieldCheck
} from "lucide-react"
import StaffSecurityMonitor from "@/components/StaffSecurityMonitor"

export default function StaffAccessPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<StaffAccount[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<StaffAccount | null>(null)
  const [roleFilter, setRoleFilter] = useState<'all' | 'staff' | 'assistant'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    phone: "",
    role: "staff" as "staff" | "assistant",
    password: "",
  })
  const [selectedStaffForSecurity, setSelectedStaffForSecurity] = useState<StaffAccount | null>(null)
  const [showSecurityMonitor, setShowSecurityMonitor] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/staff')
      const result = await response.json()
      setAccounts(result.data || [])
    } catch (error) {
      console.error('Failed to load staff accounts:', error)
      toast({ title: 'Error', description: 'Failed to load staff accounts', variant: 'destructive' })
      setAccounts([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return accounts.filter(acc => {
      if (roleFilter !== 'all' && (acc.role || 'staff') !== roleFilter) return false
      if (statusFilter === 'active' && !acc.active) return false
      if (statusFilter === 'disabled' && acc.active) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const un = acc.username.toLowerCase()
        const dn = (acc.display_name || '').toLowerCase()
        const em = (acc.email || '').toLowerCase()
        const ph = (acc.phone || '').toLowerCase()
        if (!un.includes(q) && !dn.includes(q) && !em.includes(q) && !ph.includes(q)) return false
      }
      return true
    })
  }, [accounts, search, roleFilter, statusFilter])

  const resetForm = () => {
    setForm({ username: "", display_name: "", email: "", phone: "", role: "staff", password: "" })
  }

  const onCreate = async () => {
    if (!form.username || !form.password) {
      toast({ title: 'Validation Error', description: 'Username and password are required', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          display_name: form.display_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          password: form.password.trim(),
        })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create staff account')
      }
      toast({
        title: '✅ Staff Account Created',
        description: `Staff member "${form.display_name || form.username}" (${form.role}) added successfully!`,
      })
      setOpenDialog(false)
      resetForm()
      await load()
    } catch (error: any) {
      toast({ title: 'Error Creating Staff', description: error.message || 'Failed to create account', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdate = async () => {
    if (!editing) return
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          username: form.username.trim(),
          display_name: form.display_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          password: form.password.trim() || undefined,
        })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update staff account')
      }
      toast({
        title: '✅ Staff Account Updated',
        description: `Staff member "${form.display_name || form.username}" updated successfully!`,
      })
      setOpenDialog(false)
      setEditing(null)
      resetForm()
      await load()
    } catch (error: any) {
      toast({ title: 'Error Updating Staff', description: error.message || 'Failed to update account', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDelete = async (acc: StaffAccount) => {
    try {
      const response = await fetch(`/api/staff?id=${acc.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete staff account')
      }
      toast({ title: 'Deleted', description: 'Staff account deleted' })
      await load()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const toggleActive = async (acc: StaffAccount) => {
    try {
      const response = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, active: !acc.active }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle account status')
      }
      toast({
        title: acc.active ? 'Account Disabled' : 'Account Enabled',
        description: `${acc.display_name || acc.username} is now ${acc.active ? 'disabled' : 'active'}`
      })
      await load()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const openEdit = (acc: StaffAccount) => {
    setEditing(acc)
    setForm({ username: acc.username, display_name: acc.display_name || '', email: acc.email || '', phone: acc.phone || '', role: acc.role || 'staff', password: acc.password || '' })
    setOpenDialog(true)
  }

  const toStaffLink = () => `${window.location.origin}/staff-dashboard`

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)] p-2 sm:p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Unified Glass Style Matching Dashboard */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.08)] border border-[#0d5c75]/15 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0d5c75] font-poppins">
                Staff Access Management
              </h1>
              <p className="text-xs sm:text-sm text-[#2a9d8f] font-medium">
                Create, manage, and audit clinic team credentials securely
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Button
              onClick={() => { resetForm(); setEditing(null); setOpenDialog(true) }}
              className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white shadow-md text-xs sm:text-sm rounded-xl h-9 sm:h-10 px-4"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Staff
            </Button>
            <Button
              variant="outline"
              onClick={load}
              className="border-[#0d5c75]/30 text-[#0d5c75] hover:bg-[#0d5c75]/10 text-xs sm:text-sm rounded-xl h-9 sm:h-10 px-3 bg-white/70"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[#0d5c75]/15 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Staff</span>
              <Users className="h-4 w-4 text-[#0d5c75]" />
            </div>
            <div className="text-2xl font-bold text-[#0d5c75] mt-1 font-poppins">{accounts.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered accounts</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[#0d5c75]/15 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Active</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-poppins">{accounts.filter(a => a.active).length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Currently enabled</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[#0d5c75]/15 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Disabled</span>
              <UserX className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1 font-poppins">{accounts.filter(a => !a.active).length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Access suspended</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[#0d5c75]/15 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Assistants</span>
              <Shield className="h-4 w-4 text-[#2a9d8f]" />
            </div>
            <div className="text-2xl font-bold text-[#2a9d8f] mt-1 font-poppins">{accounts.filter(a => a.role === 'assistant').length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Clinic assistants</p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search staff by name, username, email or phone..."
                  className="pl-9 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl h-10 text-xs sm:text-sm focus:border-[#0d5c75] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-[#0d5c75] font-semibold shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters:</span>
                </div>
                <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                  <SelectTrigger className="w-full sm:w-36 bg-white border-slate-200 rounded-xl h-10 text-xs sm:text-sm text-slate-700">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-full sm:w-36 bg-white border-slate-200 rounded-xl h-10 text-xs sm:text-sm text-slate-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden lg:flex items-center text-xs font-semibold text-[#0d5c75] bg-teal-50 px-3 py-2 rounded-xl border border-teal-200 shrink-0">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                <span>{filtered.length} Staff Member{filtered.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table Card */}
        <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#0d5c75]">
                Clinic Staff Accounts
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage roles, toggle access, and monitor team activities
              </p>
            </div>
            <Badge className="bg-[#0d5c75]/10 text-[#0d5c75] border border-[#0d5c75]/20 font-semibold px-2.5 py-1 rounded-lg">
              {filtered.length} Listed
            </Badge>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-100">
                  <TableHead className="font-semibold text-[#0d5c75] text-xs py-3 px-4">Staff Member</TableHead>
                  <TableHead className="font-semibold text-[#0d5c75] text-xs py-3 px-4">Contact</TableHead>
                  <TableHead className="font-semibold text-[#0d5c75] text-xs py-3 px-4">Role</TableHead>
                  <TableHead className="font-semibold text-[#0d5c75] text-xs py-3 px-4">Status</TableHead>
                  <TableHead className="font-semibold text-[#0d5c75] text-xs py-3 px-4">Last Login</TableHead>
                  <TableHead className="font-semibold text-[#0d5c75] text-xs py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0d5c75]" />
                        <span className="text-sm font-medium">Loading staff accounts...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-slate-300" />
                        <span className="text-sm font-medium">No staff accounts found</span>
                        <p className="text-xs text-slate-400">Click &ldquo;New Staff&rdquo; above to register team credentials</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(acc => (
                    <TableRow key={acc.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0d5c75]/15 to-[#2a9d8f]/20 text-[#0d5c75] flex items-center justify-center text-xs font-bold border border-[#0d5c75]/20 shrink-0">
                            {(acc.display_name || acc.username || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                              {acc.display_name || acc.username}
                              {acc.role === 'assistant' && (
                                <Badge className="bg-teal-50 text-[#0d5c75] border border-teal-200 text-[10px] px-1.5 py-0">
                                  Assistant
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">@{acc.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="space-y-1">
                          {acc.email ? (
                            <div className="text-xs flex items-center gap-1.5 text-slate-600">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{acc.email}</span>
                            </div>
                          ) : null}
                          {acc.phone ? (
                            <div className="text-xs flex items-center gap-1.5 text-slate-600">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{acc.phone}</span>
                            </div>
                          ) : null}
                          {!acc.email && !acc.phone && (
                            <span className="text-xs text-slate-400 italic">No contact details</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 capitalize">
                        <Badge className={acc.role === 'assistant' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-teal-50 text-[#0d5c75] border-teal-200'}>
                          {acc.role || 'staff'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        {acc.active ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-semibold">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-slate-500">
                        {acc.last_login_at ? (
                          <span>
                            {new Date(acc.last_login_at as any).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Never logged in</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(acc)}
                            className="h-8 w-8 p-0 text-[#0d5c75] hover:bg-[#0d5c75]/10 rounded-lg"
                            title="Edit Staff Member"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (acc.active && !confirm('Disable this staff account?')) return
                              toggleActive(acc)
                            }}
                            className={`h-8 w-8 p-0 rounded-lg ${acc.active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                            title={acc.active ? "Disable Account" : "Enable Account"}
                          >
                            {acc.active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm('Permanently delete this staff account?')) onDelete(acc) }}
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaffForSecurity(acc)
                              setShowSecurityMonitor(true)
                            }}
                            className="h-8 w-8 p-0 text-sky-600 hover:bg-sky-50 rounded-lg"
                            title="Security Monitor"
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(toStaffLink())
                              toast({ title: 'Link Copied', description: 'Staff login link copied to clipboard' })
                            }}
                            className="h-8 text-xs border-[#0d5c75]/30 text-[#0d5c75] hover:bg-[#0d5c75]/10 rounded-lg px-2"
                          >
                            <Link2 className="h-3.5 w-3.5 mr-1" />
                            Copy Link
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Security Monitor Dialog */}
        <Dialog open={showSecurityMonitor} onOpenChange={setShowSecurityMonitor}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0d5c75]">
                <Shield className="h-5 w-5" />
                Security Monitor &ndash; {selectedStaffForSecurity?.display_name || selectedStaffForSecurity?.username}
              </DialogTitle>
            </DialogHeader>
            {selectedStaffForSecurity && (
              <StaffSecurityMonitor 
                staffId={selectedStaffForSecurity.id} 
                staffName={selectedStaffForSecurity.display_name || selectedStaffForSecurity.username} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0d5c75]">
              {editing ? 'Edit Staff Member' : 'Register New Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Username *</label>
                <Input
                  value={form.username}
                  onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g. aisha"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Display Name</label>
                <Input
                  value={form.display_name}
                  onChange={e => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Aisha Malik"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email (Optional)</label>
                <Input
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="staff@example.com"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Phone (Optional)</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0300xxxxxxx"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm(prev => ({ ...prev, role: v as any }))}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Password {editing ? '(Leave blank to keep)' : '*'}
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => { setOpenDialog(false); setEditing(null) }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={editing ? onUpdate : onCreate}
                className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white min-w-[110px] rounded-xl shadow-md"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Saving...</>
                ) : editing ? (
                  <><Pencil className="h-4 w-4 mr-2"/>Update</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2"/>Create</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
