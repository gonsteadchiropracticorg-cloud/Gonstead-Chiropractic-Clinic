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
  const [expandedForm, setExpandedForm] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 6
  const [sort, setSort] = useState<'new'|'high'|'low'>('new')

  const load = async (count = page * pageSize) => {
    setLoading(true)
    const { data } = await getReviews(count)
    let arr = data || []
    if (sort === 'high') arr = [...arr].sort((a,b)=> (b.rating||0)-(a.rating||0))
    if (sort === 'low') arr = [...arr].sort((a,b)=> (a.rating||0)-(b.rating||0))
    setReviews(arr)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    if (typeof window !== 'undefined') {
      window.addEventListener('reviewsUpdated', onUpdate as EventListener)
      return () => window.removeEventListener('reviewsUpdated', onUpdate as EventListener)
    }
  }, [page, sort])

  const avg = useMemo(() => {
    if (!reviews.length) return 0
    return Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10) / 10
  }, [reviews])

  const distribution = useMemo(()=>{
    const counts = [0,0,0,0,0]
    reviews.forEach(r=>{ counts[(r.rating||0)-1] = (counts[(r.rating||0)-1]||0)+1 })
    const total = Math.max(reviews.length,1)
    return counts.map(c=> Math.round((c/total)*100))
  },[reviews])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    setSubmitting(true)
    try {
      await addReview({ name: name.trim(), title: title.trim(), text: text.trim(), rating, source: 'website', verified: false })
      setName(""); setTitle(""); setText(""); setRating(5)
      await load()
      setExpandedForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < Math.round(avg) ? 'text-green-500 fill-green-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <div className="text-xl font-bold text-gray-800">{avg || 0}</div>
          <Badge className="bg-green-100 text-green-700">Excellent</Badge>
          <div className="text-sm text-gray-500">{reviews.length} reviews</div>
          {/* Sort */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span>Sort:</span>
            <button onClick={()=>setSort('new')} className={`px-2 py-1 rounded ${sort==='new'?'bg-gray-200':''}`}>Newest</button>
            <button onClick={()=>setSort('high')} className={`px-2 py-1 rounded ${sort==='high'?'bg-gray-200':''}`}>Highest</button>
            <button onClick={()=>setSort('low')} className={`px-2 py-1 rounded ${sort==='low'?'bg-gray-200':''}`}>Lowest</button>
          </div>
        </div>
        <button onClick={()=>setExpandedForm(v=>!v)} className="text-green-700 hover:underline font-medium self-start md:self-auto">
          {expandedForm ? 'Close' : 'Write a review'}
        </button>
      </div>

      {/* Distribution bars (compact) */}
      <div className="grid grid-cols-5 gap-2 text-xs text-gray-600">
        {[5,4,3,2,1].map((s, idx)=> (
          <div key={s} className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(s)].map((_,i)=>(<Star key={i} className="h-3 w-3 text-green-500 fill-green-400" />))}
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded">
              <div className="h-1.5 bg-green-500 rounded" style={{width: `${distribution[5-s]}%`}}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Submission form (collapsed) */}
      {expandedForm && (
        <Card id="write-review" className="bg-white border-green-100">
          <CardContent className="p-3">
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-600">Your name</label>
                <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your full name" required className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-gray-600">Rating</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={()=>setRating(n)} className="p-0.5">
                      <Star className={`h-5 w-5 cursor-pointer ${n <= rating ? 'text-green-500 fill-green-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-gray-600">Title (optional)</label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Summarize your experience" className="h-9 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-gray-600">Your review</label>
                <Textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Share details about your experience" required className="min-h-[80px] text-sm" />
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-sm">
                  {submitting ? 'Submitting...' : 'Submit review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews list (limited) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-6 text-sm">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-6 text-sm">No reviews yet. Be the first to review.</div>
        ) : (
          reviews.slice(0, page*pageSize).map((r) => (
            <Card key={r.id} className="bg-white border-green-100">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800 text-sm truncate max-w-[60%]">{r.name}</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating||0) ? 'text-green-500 fill-green-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                {r.title && <div className="text-xs font-medium text-gray-700 truncate">{r.title}</div>}
                <ReviewText text={r.text} />
                <div className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load more */}
      {reviews.length > page*pageSize && (
        <div className="text-center">
          <Button onClick={()=>setPage(p=>p+1)} variant="outline" className="h-9 text-sm">Load more</Button>
        </div>
      )}
    </div>
  )
}

function ReviewText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const short = text.length > 160 ? text.slice(0,160) + '…' : text
  return (
    <div className="text-gray-600 text-xs leading-relaxed">
      {expanded ? text : short} {text.length > 160 && (
        <button onClick={()=>setExpanded(v=>!v)} className="text-green-700 ml-1">{expanded?'Show less':'Read more'}</button>
      )}
    </div>
  )
}
