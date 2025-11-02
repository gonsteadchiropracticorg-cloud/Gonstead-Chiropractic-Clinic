"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { addReview, getReviews, type Review } from "@/lib/supabase"
import { Star } from "lucide-react"

export default function TrustReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await getReviews(60)
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    if (typeof window !== 'undefined') {
      window.addEventListener('reviewsUpdated', onUpdate as EventListener)
      return () => window.removeEventListener('reviewsUpdated', onUpdate as EventListener)
    }
  }, [])

  const avg = useMemo(() => {
    if (!reviews.length) return 0
    return Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10) / 10
  }, [reviews])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    setSubmitting(true)
    try {
      await addReview({ name: name.trim(), title: title.trim(), text: text.trim(), rating, source: 'website', verified: false })
      setName(""); setTitle(""); setText(""); setRating(5)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header like Trustpilot */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-6 w-6 ${i < Math.round(avg) ? 'text-green-500 fill-green-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <div className="text-2xl font-bold text-gray-800">{avg || 0}</div>
          <Badge className="bg-green-100 text-green-700">Excellent</Badge>
          <div className="text-sm text-gray-500">{reviews.length} reviews</div>
        </div>
        <a href="#write-review" className="text-green-700 hover:underline font-medium">Write a review</a>
      </div>

      {/* Submission form */}
      <Card id="write-review" className="bg-white border-green-100">
        <CardContent className="p-4">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Your name</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Rating</label>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={()=>setRating(n)} className="p-1">
                    <Star className={`h-6 w-6 cursor-pointer ${n <= rating ? 'text-green-500 fill-green-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Title (optional)</label>
              <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Summarize your experience" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Your review</label>
              <Textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Share details about your experience" required className="min-h-[100px]" />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                {submitting ? 'Submitting...' : 'Submit review'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reviews list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">No reviews yet. Be the first to review.</div>
        ) : (
          reviews.map((r) => (
            <Card key={r.id} className="bg-white border-green-100">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">{r.name}</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < (r.rating||0) ? 'text-green-500 fill-green-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                {r.title && <div className="text-sm font-medium text-gray-700">{r.title}</div>}
                <div className="text-gray-600 text-sm leading-relaxed">{r.text}</div>
                <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
