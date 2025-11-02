"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getStaffAccounts, createStaffAccount, updateStaffAccount, removeStaffAccount, type StaffAccount, addAuditLog } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Shield, UserCheck, Pencil, Trash2, RefreshCw, Eye, Lock, Unlock, Mail, Phone, Link2, KeyRound, Search, Users, Anchor } from "lucide-react"
import Link from "next/link"

export default function StaffAccessPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<StaffAccount[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<StaffAccount | null>(null)
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    phone: "",
    role: "staff" as "staff" | "assistant",
    password: "",
  })

  const load = async () => {
    setLoading(true)
    const { data } = await getStaffAccounts()
    setAccounts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    if (typeof window !== 'undefined') {
      window.addEventListener('staffAccountsUpdated', onUpdate as EventListener)
      return () => window.removeEventListener('staffAccountsUpdated', onUpdate as EventListener)
    }
  }, [])

  const filtered = useMemo(() => {
    if (!search) return accounts
    const q = search.toLowerCase()
    return accounts.filter(a => (a.username||'').toLowerCase().includes(q) || (a.display_name||'').toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q) || (a.phone||'').toLowerCase().includes(q))
  }, [accounts, search])

  const resetForm = () => setForm({ username: "", display_name: "", email: "", phone: "", role: "staff", password: "" })

  const onCreate = async () => {
    if (!form.username || !form.password) {
      toast({ title: 'Missing fields', description: 'Username and password are required', variant: 'destructive' })
      return
    }
    const record = await createStaffAccount({
      username: form.username,
      display_name: form.display_name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      active: true,
      password: form.password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    await addAuditLog({ action: 'create', entity_type: 'staff', entity_id: (record as any).id, source: 'admin_dashboard', reversible: true, meta: { after: record } })
    toast({ title: 'Staff created', description: `Account ${form.username} ready to use` })
    setOpenDialog(false)
    resetForm()
    await load()
  }

  const onUpdate = async () => {
    if (!editing) return
    const updated = await updateStaffAccount(editing.id, { ...editing, ...form })
    await addAuditLog({ action: 'update', entity_type: 'staff', entity_id: editing.id, source: 'admin_dashboard', reversible: true, meta: { after: updated } })
    toast({ title: 'Updated', description: `Account ${editing.username} updated` })
    setOpenDialog(false)
    setEditing(null)
    resetForm()
    await load()
  }

  const onDelete = async (acc: StaffAccount) => {
await removeStaffAccount(acc.id)
    await addAuditLog({ action: 'delete', entity_type: 'staff', entity_id: acc.id, source: 'admin_dashboard', reversible: true, meta: { before: acc } })
    toast({ title: 'Deleted', description: `Account ${acc.username} removed` })
    await load()
  }

  const toggleActive = async (acc: StaffAccount) => {
    const updated = await updateStaffAccount(acc.id, { active: !acc.active })
    await addAuditLog({ action: 'update', entity_type: 'staff', entity_id: acc.id, source: 'admin_dashboard', reversible: true, meta: { before: acc, after: updated } })
    toast({ title: updated?.active ? 'Enabled' : 'Disabled', description: `Account ${acc.username} ${updated?.active ? 'enabled' : 'disabled'}` })
    await load()
  }

  const openEdit = (acc: StaffAccount) => {
    setEditing(acc)
    setForm({ username: acc.username, display_name: acc.display_name || '', email: acc.email || '', phone: acc.phone || '', role: acc.role || 'staff', password: acc.password || '' })
    setOpenDialog(true)
  }

  const toStaffLink = () => `${window.location.origin}/staff-dashboard`

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-emerald-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Staff Access Management</h1>
              <p className="text-sm text-gray-600">Create, edit, and revoke staff access credentials</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff..." className="pl-9 w-64" />
            </div>
            <Button onClick={()=>{ resetForm(); setEditing(null); setOpenDialog(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" /> New Staff
            </Button>
            <Button variant="outline" onClick={load} className="text-gray-700"><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader className="py-4 flex items-center justify-between">
            <CardTitle className="text-base">Accounts</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-800"><Users className="h-3 w-3 mr-1"/>{accounts.length}</Badge>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No staff accounts</TableCell></TableRow>
                ) : (
                  filtered.map(acc => (
                    <TableRow key={acc.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-semibold text-gray-800">{acc.display_name || acc.username}</div>
                        <div className="text-xs text-gray-500">{acc.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-2 text-gray-700">
                          {acc.email && <><Mail className="h-3.5 w-3.5" />{acc.email}</>}
                        </div>
                        <div className="text-sm flex items-center gap-2 text-gray-700">
                          {acc.phone && <><Phone className="h-3.5 w-3.5" />{acc.phone}</>}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{acc.role || 'staff'}</TableCell>
                      <TableCell>
                        {acc.active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{acc.last_login_at || localStorage.getItem(`staff_last_login_${acc.username}`) || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" size="sm" onClick={()=>openEdit(acc)} className="text-gray-700"><Pencil className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="sm" onClick={()=>toggleActive(acc)} className={acc.active?"text-red-600":"text-green-600"}>{acc.active ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4"/>}</Button>
                          <Button variant="ghost" size="sm" onClick={()=>onDelete(acc)} className="text-red-600"><Trash2 className="h-4 w-4"/></Button>
                          <Button variant="outline" size="sm" onClick={()=>{ navigator.clipboard.writeText(toStaffLink()); toast({ title: 'Link copied', description: 'Staff login link copied' }) }} className="text-gray-700"><Link2 className="h-4 w-4 mr-1"/>Copy Staff Link</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Staff' : 'New Staff'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Username</label>
                <Input value={form.username} onChange={e=>setForm(prev=>({ ...prev, username: e.target.value }))} placeholder="e.g. aisha" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Display Name</label>
                <Input value={form.display_name} onChange={e=>setForm(prev=>({ ...prev, display_name: e.target.value }))} placeholder="Aisha Malik" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email (optional)</label>
                <Input value={form.email} onChange={e=>setForm(prev=>({ ...prev, email: e.target.value }))} placeholder="staff@example.com" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone (optional)</label>
                <Input value={form.phone} onChange={e=>setForm(prev=>({ ...prev, phone: e.target.value }))} placeholder="0300xxxxxxx" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Role</label>
                <Select value={form.role} onValueChange={(v)=>setForm(prev=>({ ...prev, role: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Password</label>
                <Input type="password" value={form.password} onChange={e=>setForm(prev=>({ ...prev, password: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>{ setOpenDialog(false); setEditing(null) }}>Cancel</Button>
              <Button onClick={editing ? onUpdate : onCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editing ? <><Pencil className="h-4 w-4 mr-2"/>Update</> : <><UserPlus className="h-4 w-4 mr-2"/>Create</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
