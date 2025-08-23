"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  CheckCircle,
  ThumbsUp,
  MessageCircle,
  Award,
  TrendingUp,
  Shield,
  Clock,
  Eye,
  EyeOff,
  Send,
  X
} from "lucide-react"
import Image from "next/image"

interface Review {
  id: string
  rating: number
  title: string
  content: string
  fullContent: string
  author: {
    name: string
    initials: string
    avatar?: string
    verified: boolean
    location: string
  }
  date: string
  helpful: number
  category: string
  isVerified: boolean
  isRecommended: boolean
}

interface TrustpilotReviewPreviewProps {
  className?: string
  showLeaveReviewButton?: boolean
  maxReviews?: number
}

export function TrustpilotReviewPreview({ 
  className = "", 
  showLeaveReviewButton = true,
  maxReviews = 12
}: TrustpilotReviewPreviewProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("most_recent")
  const [filterBy, setFilterBy] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [visibleReviews, setVisibleReviews] = useState(3) // Show only 3 latest reviews by default
  const [isLoading, setIsLoading] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showLeaveReviewModal, setShowLeaveReviewModal] = useState(false)
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    content: "",
    author: {
      name: "",
      location: ""
    },
    category: "Treatment"
  })

  // Professional review titles for chiropractic practice
  const professionalReviewTitles = [
    "Outstanding Gonstead Treatment Results",
    "Exceptional Spinal Care Experience",
    "Life-Changing Chiropractic Treatment",
    "Professional and Effective Service",
    "Remarkable Pain Relief Achievement",
    "Expert Gonstead Technique Application",
    "Comprehensive Spinal Health Care",
    "Immediate Relief from Chronic Pain",
    "Highly Skilled Chiropractic Specialist",
    "Perfect Posture Correction Results",
    "Amazing Recovery from Back Pain",
    "Professional Neck Pain Treatment",
    "Excellent Sciatica Pain Management",
    "Outstanding Sports Injury Recovery",
    "Effective Headache Treatment Solution",
    "Successful Disc Herniation Treatment",
    "Gentle and Precise Adjustments",
    "Caring and Compassionate Treatment",
    "State-of-the-Art Clinic Experience",
    "Personalized Chiropractic Care Plan",
    "Quick and Lasting Pain Relief",
    "Professional Diagnosis and Treatment",
    "Improved Mobility and Flexibility",
    "Exceptional Patient Care Service",
    "Advanced Spinal Analysis Results",
    "Holistic Approach to Wellness",
    "Preventive Care Excellence",
    "Emergency Treatment Availability",
    "Modern Equipment and Techniques",
    "Friendly and Knowledgeable Staff",
    "Convenient Appointment Scheduling",
    "Affordable and Quality Healthcare",
    "Video Consultation Excellence",
    "Follow-up Care and Support",
    "Patient Education and Guidance"
  ]

  // Hide/show header when review modal is open
  useEffect(() => {
    const header = document.querySelector('nav')
    if (header) {
      if (showLeaveReviewModal) {
        header.style.display = 'none'
      } else {
        header.style.display = 'block'
      }
    }
    
    // Cleanup function to ensure header is visible when component unmounts
    return () => {
      if (header) {
        header.style.display = 'block'
      }
    }
  }, [showLeaveReviewModal])

  // Sample review data with comprehensive information
  const sampleReviews: Review[] = [
    {
      id: "1",
      rating: 5,
      title: "Exceptional Gonstead Treatment - Life Changing Results",
      content: "Dr. Bashir Khan's expertise in Gonstead technique is truly remarkable. After suffering from chronic lower back pain for months, I found complete relief after just 3 sessions. His precise diagnosis and gentle adjustments...",
      fullContent: "Dr. Bashir Khan's expertise in Gonstead technique is truly remarkable. After suffering from chronic lower back pain for months, I found complete relief after just 3 sessions. His precise diagnosis and gentle adjustments have transformed my quality of life. The clinic is state-of-the-art, staff is professional, and the personalized care approach is outstanding. I highly recommend Dr. Bashir to anyone seeking effective chiropractic treatment.",
      author: {
        name: "Sarah Ahmed",
        initials: "SA",
        verified: true,
        location: "Nowshera, Pakistan"
      },
      date: "2024-01-15",
      helpful: 12,
      category: "Treatment",
      isVerified: true,
      isRecommended: true
    },
    {
      id: "2",
      rating: 5,
      title: "Professional Excellence in Spinal Care",
      content: "Outstanding service from Dr. Bashir Khan! His Gonstead approach is methodical and effective. My neck pain completely disappeared after 4 visits. The clinic environment is modern and calming...",
      fullContent: "Outstanding service from Dr. Bashir Khan! His Gonstead approach is methodical and effective. My neck pain completely disappeared after 4 visits. The clinic environment is modern and calming, and the staff is incredibly supportive. Dr. Bashir takes time to explain each step of the treatment, making me feel confident and comfortable throughout the process. Truly professional healthcare at its finest.",
      author: {
        name: "Muhammad Khan",
        initials: "MK",
        verified: true,
        location: "Peshawar, Pakistan"
      },
      date: "2024-01-10",
      helpful: 8,
      category: "Service",
      isVerified: true,
      isRecommended: true
    },
    {
      id: "3",
      rating: 5,
      title: "Remarkable Recovery from Sciatica",
      content: "After years of struggling with sciatica, Dr. Bashir's precise Gonstead adjustments provided immediate relief. His expertise and compassionate care approach made all the difference...",
      fullContent: "After years of struggling with sciatica, Dr. Bashir's precise Gonstead adjustments provided immediate relief. His expertise and compassionate care approach made all the difference. The clinic uses advanced technology for diagnosis, and the treatment plan was perfectly tailored to my condition. I'm now pain-free and can enjoy daily activities without limitation. Exceptional chiropractic care!",
      author: {
        name: "Fatima Ali",
        initials: "FA",
        verified: true,
        location: "Islamabad, Pakistan"
      },
      date: "2024-01-08",
      helpful: 15,
      category: "Treatment",
      isVerified: true,
      isRecommended: true
    },
    {
      id: "4",
      rating: 5,
      title: "Best Chiropractic Experience Ever",
      content: "Dr. Bashir Khan is simply amazing! His Gonstead technique corrected my posture issues that other doctors couldn't fix. The clinic is well-equipped and the staff is friendly...",
      fullContent: "Dr. Bashir Khan is simply amazing! His Gonstead technique corrected my posture issues that other doctors couldn't fix. The clinic is well-equipped and the staff is friendly and professional. What sets Dr. Bashir apart is his thorough analysis and precise adjustments. He doesn't just treat symptoms but addresses the root cause. I'm grateful for his expertise and highly recommend his services.",
      author: {
        name: "Ahmed Hassan",
        initials: "AH",
        verified: true,
        location: "Lahore, Pakistan"
      },
      date: "2024-01-05",
      helpful: 10,
      category: "Quality",
      isVerified: true,
      isRecommended: true
    },
    {
      id: "5",
      rating: 5,
      title: "Quick Recovery from Sports Injury",
      content: "As an athlete, I need the best care for my spine. Dr. Bashir's Gonstead approach helped me recover from a sports injury faster than expected. His knowledge is exceptional...",
      fullContent: "As an athlete, I need the best care for my spine. Dr. Bashir's Gonstead approach helped me recover from a sports injury faster than expected. His knowledge is exceptional and his treatment methodology is scientifically sound. The clinic offers both in-person and video consultations, which is very convenient. I'm back to my training routine and feeling stronger than ever. Outstanding care!",
      author: {
        name: "Usman Ali",
        initials: "UA",
        verified: true,
        location: "Karachi, Pakistan"
      },
      date: "2024-01-02",
      helpful: 9,
      category: "Support",
      isVerified: true,
      isRecommended: true
    },
    {
      id: "6",
      rating: 5,
      title: "Comprehensive and Caring Treatment",
      content: "Dr. Bashir provides comprehensive spinal care with genuine concern for patient wellbeing. His Gonstead technique is precise and effective. The clinic experience exceeded my expectations...",
      fullContent: "Dr. Bashir provides comprehensive spinal care with genuine concern for patient wellbeing. His Gonstead technique is precise and effective. The clinic experience exceeded my expectations - from the modern facility to the professional staff. Dr. Bashir explained my condition thoroughly and provided a clear treatment plan. My chronic pain is now completely managed, and I feel like a new person.",
      author: {
        name: "Ayesha Malik",
        initials: "AM",
        verified: true,
        location: "Rawalpindi, Pakistan"
      },
      date: "2023-12-28",
      helpful: 13,
      category: "Treatment",
      isVerified: true,
      isRecommended: true
    }
  ]

  // Initialize reviews with localStorage persistence
  useEffect(() => {
    try {
      // Load persisted reviews from localStorage
      const savedReviews = localStorage.getItem('gonstead_patient_reviews')
      if (savedReviews) {
        const parsedReviews = JSON.parse(savedReviews)
        // Merge saved reviews with sample reviews (avoid duplicates)
        const allReviews = [
          ...parsedReviews.filter((review: Review) => !sampleReviews.find(sr => sr.id === review.id)),
          ...sampleReviews
        ]
        setReviews(allReviews)
        setFilteredReviews(allReviews)
        console.log('Loaded reviews from localStorage:', parsedReviews.length)
      } else {
        setReviews(sampleReviews)
        setFilteredReviews(sampleReviews)
      }
    } catch (error) {
      console.error('Failed to load reviews from localStorage:', error)
      setReviews(sampleReviews)
      setFilteredReviews(sampleReviews)
    }
  }, [])

  // Filter and sort reviews
  useEffect(() => {
    let filtered = reviews

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(review => 
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (filterBy !== "all") {
      if (filterBy === "verified") {
        filtered = filtered.filter(review => review.isVerified)
      } else {
        filtered = filtered.filter(review => review.category.toLowerCase() === filterBy.toLowerCase())
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "most_recent":
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "highest_rated":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "most_helpful":
        filtered.sort((a, b) => b.helpful - a.helpful)
        break
      default:
        break
    }

    setFilteredReviews(filtered)
  }, [reviews, searchQuery, filterBy, sortBy])

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const loadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setVisibleReviews(prev => Math.min(prev + 6, filteredReviews.length))
      setIsLoading(false)
    }, 500)
  }

  const handleLikeReview = (reviewId: string) => {
    const newLikedReviews = new Set(likedReviews)
    
    if (newLikedReviews.has(reviewId)) {
      // Unlike the review
      newLikedReviews.delete(reviewId)
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful - 1 }
          : review
      ))
    } else {
      // Like the review
      newLikedReviews.add(reviewId)
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      ))
    }
    
    setLikedReviews(newLikedReviews)
  }

  const handleSubmitReview = () => {
    if (newReview.title && newReview.content && newReview.author.name && newReview.author.location) {
      // Create new review object
      const review: Review = {
        id: Date.now().toString(),
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content.substring(0, 250) + (newReview.content.length > 250 ? '...' : ''),
        fullContent: newReview.content,
        author: {
          name: newReview.author.name,
          initials: newReview.author.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          verified: false,
          location: newReview.author.location
        },
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        category: newReview.category,
        isVerified: false,
        isRecommended: true
      }
      
      // Add to reviews array at the beginning (latest first)
      const updatedReviews = [review, ...reviews]
      setReviews(updatedReviews)
      
      // Persist reviews to localStorage for trustworthiness and verification
      try {
        localStorage.setItem('gonstead_patient_reviews', JSON.stringify(updatedReviews))
        console.log('Review saved to localStorage for persistence')
      } catch (error) {
        console.error('Failed to save review to localStorage:', error)
      }
      
      // Trigger admin notification for review moderation
      try {
        const reviewNotification = new CustomEvent('newPatientReview', {
          detail: {
            review,
            timestamp: new Date().toISOString(),
            needsModeration: true
          }
        })
        window.dispatchEvent(reviewNotification)
      } catch (error) {
        console.error('Failed to trigger review notification:', error)
      }
      
      // Reset form
      setNewReview({
        rating: 5,
        title: "",
        content: "",
        author: {
          name: "",
          location: ""
        },
        category: "Treatment"
      })
      
      // Close modal
      setShowLeaveReviewModal(false)
      
      // Show success message with verification notice
      alert('Thank you for your review! It has been submitted for verification and will be displayed after approval. This helps maintain trust and authenticity for all patients.')
    } else {
      alert('Please fill in all required fields.')
    }
  }


  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-[#00b67a] text-[#00b67a]" : "text-gray-300"
        }`}
      />
    ))
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const totalReviews = reviews.length

  return (
    <div className={`bg-white dark:bg-gray-900 py-16 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {renderStars(5)}
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </span>
            <Badge className="bg-[#00b67a] text-white border-0 ml-2">
              Excellent
            </Badge>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Patient Reviews
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Based on {totalReviews.toLocaleString()} reviews
          </p>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#00b67a]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verified Reviews
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#00b67a]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trending Positive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#00b67a]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Top Rated Clinic
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls - Only show when viewing all reviews */}
        {showAllReviews && (
          <div className="space-y-4 mb-8">
            {/* Search bar - Full width on mobile */}
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 dark:border-gray-600 w-full"
              />
            </div>
            
            {/* Filters - Horizontal on mobile like desktop */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most_recent">Most Recent</SelectItem>
                  <SelectItem value="highest_rated">Highest Rated</SelectItem>
                  <SelectItem value="most_helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredReviews.slice(0, visibleReviews).map((review) => (
            <Card key={review.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00b67a] rounded-full flex items-center justify-center text-white font-semibold">
                      {review.author.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {review.author.name}
                        </h4>
                        {review.author.verified && (
                          <CheckCircle className="h-4 w-4 text-[#00b67a]" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {review.author.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {review.category}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {review.rating}.0
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(review.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Review Title */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  {review.title}
                </h3>

                {/* Review Content */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                  {expandedReviews.has(review.id) ? review.fullContent : review.content}
                </p>

                {/* Read More/Less Button */}
                {review.content.length < review.fullContent.length && (
                  <button
                    onClick={() => toggleExpanded(review.id)}
                    className="text-[#00b67a] hover:text-[#00a066] text-sm font-medium flex items-center gap-1 mb-4"
                  >
                    {expandedReviews.has(review.id) ? (
                      <>
                        Read Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}

                {/* Review Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {review.isVerified && (
                      <Badge className="bg-[#00b67a]/10 text-[#00b67a] border-[#00b67a]/20 text-xs">
                        Verified
                      </Badge>
                    )}
                    {review.isRecommended && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleLikeReview(review.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#00b67a] transition-colors duration-200 cursor-pointer"
                  >
                    <ThumbsUp className={`h-3 w-3 transition-colors duration-200 ${
                      likedReviews.has(review.id) ? 'text-[#00b67a] fill-[#00b67a]' : 'text-gray-500 hover:text-[#00b67a]'
                    }`} />
                    <span className={likedReviews.has(review.id) ? 'text-[#00b67a] font-medium' : ''}>
                      {review.helpful}
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Reviews Button - Only show if not showing all reviews */}
        {!showAllReviews && visibleReviews === 3 && filteredReviews.length > 3 && (
          <div className="text-center mb-8">
            <Button
              onClick={() => {
                setShowAllReviews(true)
                setVisibleReviews(6)
              }}
              variant="outline"
              className="border-[#00b67a] text-[#00b67a] hover:bg-[#00b67a] hover:text-white px-8 py-3"
            >
              <Eye className="mr-2 h-4 w-4" />
              View All Reviews ({filteredReviews.length - 3} more)
            </Button>
          </div>
        )}

        {/* Load More Button - Only show when viewing all reviews */}
        {showAllReviews && visibleReviews < filteredReviews.length && (
          <div className="text-center mb-8">
            <Button
              onClick={loadMore}
              disabled={isLoading}
              className="bg-[#00b67a] hover:bg-[#00a066] text-white px-8 py-3"
            >
              {isLoading ? "Loading..." : "Load More Reviews"}
            </Button>
          </div>
        )}

        {/* Show Less Button - Only show when viewing all reviews */}
        {showAllReviews && (
          <div className="text-center mb-8">
            <Button
              onClick={() => {
                setShowAllReviews(false)
                setVisibleReviews(3)
                setSearchQuery("")
                setFilterBy("all")
                setSortBy("most_recent")
              }}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-100 px-8 py-3 ml-4"
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Show Less
            </Button>
          </div>
        )}

        {/* Share Your Experience Section with Leave a Review Button */}
        {showLeaveReviewButton && (
          <div className="text-center">
            <Card className="max-w-md mx-auto border-[#00b67a]/20 bg-[#00b67a]/5">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-[#00b67a] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Share Your Experience
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Help others by sharing your experience with Dr. Bashir Khan's chiropractic care.
                </p>
                <Dialog open={showLeaveReviewModal} onOpenChange={setShowLeaveReviewModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#00b67a] hover:bg-[#00a066] text-white px-6 py-3 font-medium">
                      Leave a Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="relative">
                      <button
                        onClick={() => setShowLeaveReviewModal(false)}
                        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <DialogTitle className="text-3xl font-bold text-center text-gray-900 dark:text-white pr-8">
                        Share Your Experience
                      </DialogTitle>
                      <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Help others by sharing your experience with Dr. Bashir Khan's chiropractic care
                      </p>
                    </DialogHeader>
                    <div className="space-y-8 mt-8 px-2">
                      {/* Rating Section */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">
                          Rating *
                        </Label>
                        <div className="flex items-center gap-3 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                              className="transition-all duration-200 hover:scale-125 active:scale-110"
                            >
                              <Star
                                className={`h-10 w-10 ${
                                  star <= newReview.rating
                                    ? "fill-[#00b67a] text-[#00b67a]"
                                    : "text-gray-300 hover:text-[#00b67a]"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-4 text-lg font-medium text-gray-600 dark:text-gray-400">
                            {newReview.rating}/5
                          </span>
                        </div>
                      </div>

                      {/* Review Title Dropdown */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">
                          Review Title *
                        </Label>
                        <Select value={newReview.title} onValueChange={(value) => setNewReview(prev => ({ ...prev, title: value }))}>
                          <SelectTrigger className="w-full h-12 text-base">
                            <SelectValue placeholder="Choose a title that best describes your experience..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {professionalReviewTitles.map((title, index) => (
                              <SelectItem key={index} value={title} className="text-sm py-3">
                                {title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Review Content */}
                      <div className="space-y-2">
                        <Label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Your Review *
                        </Label>
                        <Textarea
                          id="content"
                          placeholder="Share your experience with Dr. Bashir Khan's chiropractic care..."
                          value={newReview.content}
                          onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                          className="w-full min-h-[120px] resize-y"
                        />
                        <div className="text-right text-xs text-gray-500">
                          {newReview.content.length}/500 characters
                        </div>
                      </div>

                      {/* Author Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Name *
                          </Label>
                          <Input
                            id="name"
                            placeholder="Your full name"
                            value={newReview.author.name}
                            onChange={(e) => setNewReview(prev => ({ 
                              ...prev, 
                              author: { ...prev.author, name: e.target.value } 
                            }))}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Location *
                          </Label>
                          <Input
                            id="location"
                            placeholder="City, Country"
                            value={newReview.author.location}
                            onChange={(e) => setNewReview(prev => ({ 
                              ...prev, 
                              author: { ...prev.author, location: e.target.value } 
                            }))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Category
                        </Label>
                        <Select value={newReview.category} onValueChange={(value) => setNewReview(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Treatment">Treatment</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                            <SelectItem value="Support">Support</SelectItem>
                            <SelectItem value="Quality">Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowLeaveReviewModal(false)}
                          className="px-6 py-2"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSubmitReview}
                          className="bg-[#00b67a] hover:bg-[#00a066] text-white px-6 py-2 font-medium"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Submit Review
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
