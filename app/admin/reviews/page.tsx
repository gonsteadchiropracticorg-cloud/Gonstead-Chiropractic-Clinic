"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Star, 
  Eye, 
  EyeOff,
  MessageSquare, 
  ThumbsUp, 
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Award,
  BarChart3,
  Settings,
  RefreshCw,
  Send,
  Edit3,
  Trash2,
  Flag,
  Heart,
  Reply
} from "lucide-react"

interface Review {
  id: string
  patient_id?: string
  rating: number
  title: string
  content: string
  full_content?: string
  category: string
  author_name: string
  author_initials?: string
  author_location: string
  author_email?: string
  is_verified: boolean
  is_approved: boolean
  is_featured: boolean
  is_recommended: boolean
  helpful_count: number
  response_from_doctor?: string
  response_date?: string
  moderation_notes?: string
  source: string
  treatment_type?: string
  visit_date?: string
  created_at: string
  updated_at: string
}

interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_breakdown: { [key: string]: number }
  category_breakdown: { [key: string]: number }
  pending_moderation: number
  featured_count: number
  response_rate: number
}

export default function AdminReviewsPage() {
  // State management
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    total_reviews: 0,
    average_rating: 0,
    rating_breakdown: {},
    category_breakdown: {},
    pending_moderation: 0,
    featured_count: 0,
    response_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterRating, setFilterRating] = useState("all")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState("")
  const [moderationNotes, setModerationNotes] = useState("")

  // Mock data for demonstration (in real app, fetch from Supabase)
  const mockReviews: Review[] = [
    {
      id: "1",
      patient_id: "p1",
      rating: 5,
      title: "Exceptional Gonstead Treatment - Life Changing Results",
      content: "Dr. Bashir Khan's expertise in Gonstead technique is truly remarkable. After suffering from chronic lower back pain for months, I found complete relief after just 3 sessions.",
      full_content: "Dr. Bashir Khan's expertise in Gonstead technique is truly remarkable. After suffering from chronic lower back pain for months, I found complete relief after just 3 sessions. His precise diagnosis and gentle adjustments have transformed my quality of life. The clinic is state-of-the-art, staff is professional, and the personalized care approach is outstanding. I highly recommend Dr. Bashir to anyone seeking effective chiropractic treatment.",
      category: "Treatment",
      author_name: "Sarah Ahmed",
      author_initials: "SA",
      author_location: "Nowshera, Pakistan",
      author_email: "sarah.ahmed@email.com",
      is_verified: true,
      is_approved: false,
      is_featured: false,
      is_recommended: true,
      helpful_count: 12,
      response_from_doctor: "",
      source: "website",
      treatment_type: "Lower Back Pain",
      visit_date: "2024-01-10",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z"
    },
    {
      id: "2",
      rating: 4,
      title: "Professional Excellence in Spinal Care",
      content: "Outstanding service from Dr. Bashir Khan! His Gonstead approach is methodical and effective. My neck pain completely disappeared after 4 visits.",
      category: "Service",
      author_name: "Muhammad Khan",
      author_initials: "MK",
      author_location: "Peshawar, Pakistan",
      is_verified: true,
      is_approved: true,
      is_featured: true,
      is_recommended: true,
      helpful_count: 8,
      response_from_doctor: "Thank you Muhammad for your kind words! It's our pleasure to help you achieve pain-free living. Wishing you continued health and wellness.",
      response_date: "2024-01-12T14:30:00Z",
      source: "website",
      treatment_type: "Neck Pain",
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-12T14:30:00Z"
    },
    {
      id: "3",
      rating: 2,
      title: "Disappointed with Wait Time",
      content: "Treatment was okay but had to wait 45 minutes past my appointment time. Not acceptable for busy professionals.",
      category: "Service",
      author_name: "Anonymous",
      author_location: "Nowshera, Pakistan",
      is_verified: false,
      is_approved: false,
      is_featured: false,
      is_recommended: false,
      helpful_count: 2,
      moderation_notes: "Review pending - need to address service timing concerns",
      source: "website",
      created_at: "2024-01-08T16:00:00Z",
      updated_at: "2024-01-08T16:00:00Z"
    }
  ]

  const mockStats: ReviewStats = {
    total_reviews: 45,
    average_rating: 4.7,
    rating_breakdown: { "5": 32, "4": 8, "3": 3, "2": 1, "1": 1 },
    category_breakdown: { "Treatment": 25, "Service": 12, "Support": 5, "Quality": 3 },
    pending_moderation: 5,
    featured_count: 12,
    response_rate: 78
  }

  // Load data
  useEffect(() => {
    // In real app, fetch from Supabase
    setLoading(true)
    setTimeout(() => {
      setReviews(mockReviews)
      setFilteredReviews(mockReviews)
      setReviewStats(mockStats)
      setLoading(false)
    }, 1000)
  }, [])

  // Filter reviews
  useEffect(() => {
    let filtered = reviews

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(review => 
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.author_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "approved":
          filtered = filtered.filter(r => r.is_approved)
          break
        case "pending":
          filtered = filtered.filter(r => !r.is_approved)
          break
        case "featured":
          filtered = filtered.filter(r => r.is_featured)
          break
        case "responded":
          filtered = filtered.filter(r => r.response_from_doctor)
          break
      }
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(r => r.category.toLowerCase() === filterCategory.toLowerCase())
    }

    // Rating filter
    if (filterRating !== "all") {
      filtered = filtered.filter(r => r.rating === parseInt(filterRating))
    }

    setFilteredReviews(filtered)
  }, [reviews, searchQuery, filterStatus, filterCategory, filterRating])

  const handleApproveReview = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId ? { ...review, is_approved: true, updated_at: new Date().toISOString() } : review
    ))
  }

  const handleRejectReview = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId ? { ...review, is_approved: false, updated_at: new Date().toISOString() } : review
    ))
  }

  const handleToggleFeatured = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId ? { ...review, is_featured: !review.is_featured, updated_at: new Date().toISOString() } : review
    ))
  }

  const handleSubmitResponse = () => {
    if (selectedReview && responseText.trim()) {
      setReviews(prev => prev.map(review => 
        review.id === selectedReview.id 
          ? { 
              ...review, 
              response_from_doctor: responseText.trim(),
              response_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : review
      ))
      setResponseText("")
      setSelectedReview(null)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const getStatusBadge = (review: Review) => {
    if (!review.is_approved) {
      return <Badge variant="destructive">Pending Approval</Badge>
    }
    if (review.is_featured) {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Featured</Badge>
    }
    return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0d5c75]" />
            <span className="text-lg text-[#0d5c75]">Loading reviews...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-poppins">Reviews & Ratings Management</h1>
              <p className="text-gray-600 font-open-sans">Monitor, moderate, and respond to patient reviews</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{reviewStats.average_rating}</h3>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{reviewStats.total_reviews}</h3>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{reviewStats.pending_moderation}</h3>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{reviewStats.response_rate}%</h3>
                  <p className="text-sm text-gray-600">Response Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reviews by title, content, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="responded">With Response</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setFilterStatus("all")
                  setFilterCategory("all")
                  setFilterRating("all")
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Found</h3>
                <p className="text-gray-500">No reviews match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#0d5c75] rounded-full flex items-center justify-center text-white font-semibold">
                        {review.author_initials || review.author_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{review.author_name}</h4>
                          {review.is_verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MapPin className="h-3 w-3" />
                          {review.author_location}
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm font-medium">{review.rating}/5</span>
                          <Badge variant="outline" className="text-xs">{review.category}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(review)}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                    <p className="text-gray-600 mb-3">{review.content}</p>
                  </div>

                  {/* Doctor Response */}
                  {review.response_from_doctor && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-blue-900">Dr. Bashir Ahmad Khan</span>
                            <span className="text-xs text-blue-600">
                              {new Date(review.response_date!).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-blue-800">{review.response_from_doctor}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{review.helpful_count} helpful</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!review.is_approved && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveReview(review.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectReview(review.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFeatured(review.id)}
                        className={review.is_featured ? "bg-purple-50 border-purple-200 text-purple-700" : ""}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        {review.is_featured ? "Unfeature" : "Feature"}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(review)
                              setResponseText(review.response_from_doctor || "")
                            }}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            {review.response_from_doctor ? "Edit Response" : "Respond"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Reply className="h-5 w-5" />
                              {review.response_from_doctor ? "Edit Response" : "Respond to Review"}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {/* Review Summary */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">{renderStars(review.rating)}</div>
                              <span className="font-medium">{review.author_name}</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
                            <p className="text-gray-600 text-sm">{review.content}</p>
                          </div>

                          {/* Response Form */}
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="response">Your Response</Label>
                              <Textarea
                                id="response"
                                placeholder="Thank you for your feedback..."
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={4}
                                className="mt-2"
                              />
                              <div className="text-right text-xs text-gray-500 mt-1">
                                {responseText.length}/500 characters
                              </div>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedReview(null)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSubmitResponse}
                              disabled={!responseText.trim()}
                              className="bg-[#0d5c75] hover:bg-[#0a4a5c]"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {review.response_from_doctor ? "Update Response" : "Send Response"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
