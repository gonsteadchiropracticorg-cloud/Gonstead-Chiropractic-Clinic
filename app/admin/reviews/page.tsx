"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Edit3, ShieldCheck, Star, Trash2, MessageSquare } from "lucide-react"
import { getCurrentUser } from "@/lib/supabase"
import {
  listReviews,
  updateReview,
  deleteReview,
  setApproved,
  setFeatured,
  listResponses,
  addResponse,
  deleteResponse,
  type Review,
  type ReviewResponse,
} from "@/lib/reviews"
import { useToast } from "@/hooks/use-toast"

export default function ReviewsAdminPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all")
  const [reviews, setReviews] = useState<Review[]>([])
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Review | null>(null)
  const [responses, setResponses] = useState<Record<string, ReviewResponse[]>>({})
  const [responseDraft, setResponseDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    (async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.replace("/admin/auth")
        return
      }
      await load()
    })()
  }, [statusFilter])

  async function load() {
    try {
      setLoading(true)
      const data = await listReviews({ status: statusFilter })
      setReviews(data)
    } catch (e: any) {
      toast({ title: "Failed to load reviews", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.content?.toLowerCase().includes(q) ||
      r.author_name?.toLowerCase().includes(q) ||
      r.treatment_type?.toLowerCase().includes(q)
    )
  })

  async function toggleApproved(r: Review) {
    const next = !r.is_approved
    await setApproved(r.id, next)
    setReviews(prev => prev.map(x => (x.id === r.id ? { ...x, is_approved: next } : x)))
  }

  async function toggleFeatured(r: Review) {
    const next = !r.is_featured
    await setFeatured(r.id, next)
    setReviews(prev => prev.map(x => (x.id === r.id ? { ...x, is_featured: next } : x)))
  }

  async function commitEdit() {
    if (!editing) return
    const { id, title, content, rating, treatment_type } = editing
    const updated = await updateReview(id, { title, content, rating, treatment_type })
    setReviews(prev => prev.map(x => (x.id === id ? updated : x)))
    setEditing(null)
    toast({ title: "Review updated" })
  }

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return
    await deleteReview(id)
    setReviews(prev => prev.filter(x => x.id !== id))
    toast({ title: "Review deleted" })
  }

  async function loadResponses(reviewId: string) {
    if (responses[reviewId]) return
    const data = await listResponses(reviewId)
    setResponses(prev => ({ ...prev, [reviewId]: data }))
  }

  async function addReply(reviewId: string) {
    if (!responseDraft.trim()) return
    const resp = await addResponse(reviewId, responseDraft.trim())
    setResponses(prev => ({ ...prev, [reviewId]: [resp, ...(prev[reviewId] || [])] }))
    setResponseDraft("")
    toast({ title: "Response added" })
  }

  async function removeReply(reviewId: string, responseId: string) {
    await deleteResponse(responseId)
    setResponses(prev => ({ ...prev, [reviewId]: (prev[reviewId] || []).filter(r => r.id !== responseId) }))
    toast({ title: "Response deleted" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" /> Reviews & Ratings Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <Input placeholder="Search by title, content, author, or treatment" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-semibold text-[#0d5c75]">{r.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2 max-w-xl">{r.content}</div>
                      {r.treatment_type && (
                        <Badge variant="outline" className="mt-1">{r.treatment_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{r.author_name}</div>
                      <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{r.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={r.is_approved ? "default" : "outline"} onClick={() => toggleApproved(r)}>
                          <ShieldCheck className="h-4 w-4 mr-1" /> {r.is_approved ? "Approved" : "Approve"}
                        </Button>
                        <Button size="sm" variant={r.is_featured ? "default" : "outline"} onClick={() => toggleFeatured(r)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> {r.is_featured ? "Featured" : "Feature"}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                              <Edit3 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          </DialogTrigger>
                          {editing && editing.id === r.id && (
                            <DialogContent className="max-w-xl">
                              <DialogHeader>
                                <DialogTitle>Edit Review</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <div>
                                  <Label>Title</Label>
                                  <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                                </div>
                                <div>
                                  <Label>Content</Label>
                                  <Textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} className="min-h-[120px]" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>Rating</Label>
                                    <Input type="number" min={1} max={5} value={editing.rating} onChange={e => setEditing({ ...editing, rating: Number(e.target.value) })} />
                                  </div>
                                  <div>
                                    <Label>Treatment Type</Label>
                                    <Input value={editing.treatment_type || ""} onChange={e => setEditing({ ...editing, treatment_type: e.target.value })} />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                                  <Button onClick={commitEdit}>Save</Button>
                                </div>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                        <Dialog onOpenChange={open => { if (open) loadResponses(r.id) }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" /> Reply
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Responses</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input placeholder="Write a public response" value={responseDraft} onChange={e => setResponseDraft(e.target.value)} />
                                <Button onClick={() => addReply(r.id)}>Add</Button>
                              </div>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(responses[r.id] || []).map(resp => (
                                  <div key={resp.id} className="border rounded p-2">
                                    <div className="text-sm">{resp.response_text}</div>
                                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                                      <span>{new Date(resp.created_at).toLocaleString()}</span>
                                      <Button size="sm" variant="ghost" onClick={() => removeReply(r.id, resp.id)} className="h-6 px-2 text-red-600">
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No reviews found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
