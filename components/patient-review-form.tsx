"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, Send, CheckCircle, User, Mail, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createReview } from "@/lib/supabase"

interface PatientReviewFormProps {
  patientName?: string
  onSubmit?: (reviewData: any) => void
  className?: string
}

export function PatientReviewForm({ patientName, onSubmit, className = "" }: PatientReviewFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [name, setName] = useState(patientName || "")
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  const handleStarClick = (starIndex: number) => {
    setRating(starIndex)
  }

  const handleStarHover = (starIndex: number) => {
    setHoveredRating(starIndex)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a star rating before submitting.",
        variant: "destructive"
      })
      return
    }

    if (feedback.trim().length < 10) {
      toast({
        title: "Feedback Too Short",
        description: "Please provide at least 10 characters of feedback.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Transform data to match PatientReview database schema
      const reviewData = {
        rating,
        title: feedback.length > 50 ? feedback.substring(0, 50) + "..." : feedback.substring(0, 30) + "...",
        content: feedback.trim().substring(0, 200) + (feedback.trim().length > 200 ? "..." : ""),
        full_content: feedback.trim(),
        author: {
          name: name.trim() || "Anonymous Patient",
          initials: (name.trim() || "AP").split(" ").map(n => n.charAt(0)).join("").toUpperCase().substring(0, 2),
          verified: email.trim() ? true : false,
          location: "Nowshera, Pakistan"
        },
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        helpful: 0,
        category: "Treatment",
        is_verified: email.trim() ? true : false,
        is_recommended: rating >= 4 ? true : false
      }

      // Save to database
      const { data: savedReview, error: saveError } = await createReview(reviewData)
      
      if (saveError) {
        console.error('Failed to save review:', saveError)
        throw new Error('Failed to save review to database')
      }

      console.log('Review saved successfully:', savedReview)

      // Call parent onSubmit if provided
      if (onSubmit) {
        onSubmit({ ...reviewData, id: savedReview?.id })
      }

      setIsSubmitted(true)
      
      toast({
        title: "Review Submitted Successfully!",
        description: "Thank you for your valuable feedback. Your review will be published after approval.",
      })

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact our support team.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingText = (currentRating: number) => {
    switch (currentRating) {
      case 1: return "Poor"
      case 2: return "Fair"
      case 3: return "Good"
      case 4: return "Very Good"
      case 5: return "Excellent"
      default: return "Rate your experience"
    }
  }

  if (isSubmitted) {
    return (
      <Card className={`border-[rgb(64,133,133)]/30 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg transition-all duration-500 ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="animate-bounce mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-[rgb(64,133,133)] mb-3 font-poppins">
            Thank You!
          </h3>
          <p className="text-gray-600 mb-4 font-open-sans">
            Your valuable feedback has been received. Dr. Bashir and our team appreciate your time and trust.
          </p>
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Heart className="h-3 w-3 mr-1" />
            Review Submitted Successfully
          </Badge>
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitted(false)}
              className="border-[rgb(64,133,133)] text-[rgb(64,133,133)] hover:bg-[rgb(64,133,133)] hover:text-white"
            >
              Submit Another Review
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-blue-200/30 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-blue-900 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm ${className}`}>
      <CardHeader className="bg-gradient-to-r from-[rgb(60,125,131)] to-[rgb(50,115,121)] dark:from-[rgb(49,83,113)] dark:to-[rgb(39,73,103)] text-white relative overflow-hidden">
        {/* Unique Share Your Experience Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[rgb(49,83,113)]/5 dark:bg-white/5 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[rgb(49,83,113)]/10 dark:bg-white/10 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(49,83,113)]/3 dark:from-white/3 via-transparent to-[rgb(49,83,113)]/3 dark:to-white/3"></div>
        </div>
        <CardTitle className="flex items-center gap-3 font-poppins relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">Share Your Experience</div>
            <div className="text-sm opacity-90 font-normal">Your feedback helps us improve our care</div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thank You Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-[rgb(64,133,133)] mb-2 font-poppins">
              Thank you for your session – we value your feedback
            </h3>
            <p className="text-gray-600 text-sm font-open-sans">
              Help us continue providing exceptional chiropractic care
            </p>
          </div>

          {/* Star Rating System */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 font-poppins">
              Rate Your Experience
            </label>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    className="focus:outline-none focus:ring-2 focus:ring-[rgb(64,133,133)] focus:ring-offset-2 rounded-full p-1 transition-all duration-200 transform hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-8 w-8 transition-all duration-200 ${
                        star <= (hoveredRating || rating)
                          ? "drop-shadow-sm"
                          : "text-gray-300 hover:text-gray-400"
                      }`}
                      style={star <= (hoveredRating || rating) 
                        ? { fill: 'rgb(227,252,236)', color: 'rgb(227,252,236)' }
                        : hoveredRating > 0 
                          ? { color: 'rgba(227,252,236,0.7)' }
                          : {}
                      }
                    />
                  </button>
                ))}
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-[rgb(64,133,133)] font-poppins">
                  {getRatingText(hoveredRating || rating)}
                </span>
                {(hoveredRating || rating) > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {hoveredRating || rating} of 5 stars
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Text Area */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 font-poppins">
              Your Feedback
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts about today's session... How did you feel? What worked well? Any suggestions for improvement?"
              className="min-h-[120px] resize-y border-[rgb(64,133,133)]/30 focus:border-[rgb(64,133,133)] focus:ring-[rgb(64,133,133)] font-open-sans transition-all duration-200 bg-[rgb(221,230,229)]"
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Minimum 10 characters</span>
              <span>{feedback.length}/1000</span>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-[rgb(64,133,133)]" />
              <span className="text-sm font-semibold text-gray-700 font-poppins">
                Optional Information
              </span>
              <Badge variant="outline" className="text-xs">
                Not Required
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 font-open-sans">
                  <User className="h-3 w-3 inline mr-1" />
                  Name (Optional)
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name..."
                  className="border-gray-300 focus:border-[rgb(64,133,133)] focus:ring-[rgb(64,133,133)] font-open-sans bg-[rgb(221,230,229)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600 font-open-sans">
                  <Mail className="h-3 w-3 inline mr-1" />
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="border-gray-300 focus:border-[rgb(64,133,133)] focus:ring-[rgb(64,133,133)] font-open-sans bg-[rgb(221,230,229)]"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-start gap-2 mt-2">
              <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="font-open-sans">
                Your privacy is important to us. Optional information is used only to personalize your care experience and will never be shared with third parties.
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full bg-gradient-to-r from-[rgb(64,133,133)] to-[rgb(54,123,123)] hover:from-[rgb(54,123,123)] hover:to-[rgb(44,113,113)] text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-poppins"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Review...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>

          {/* Post-submission hint */}
          <div className="text-center">
            <p className="text-xs text-gray-500 font-open-sans">
              After submission, you'll see a confirmation message
            </p>
          </div>
        </form>
      </CardContent>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-gentle-pulse {
          animation: gentle-pulse 2s ease-in-out infinite;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </Card>
  )
}
