import { supabase } from "@/lib/supabase"

export type Review = {
  id: string
  rating: number
  title: string
  content: string
  author_name: string
  author_initials?: string
  author_location?: string
  treatment_type?: string
  is_approved: boolean
  is_verified?: boolean
  is_featured: boolean
  would_recommend?: boolean
  helpful_count?: number
  created_at: string
  updated_at?: string
}

export type ReviewUpdate = Partial<Pick<Review,
  | "rating"
  | "title"
  | "content"
  | "treatment_type"
  | "is_approved"
  | "is_featured"
>>

export type ReviewResponse = {
  id: string
  review_id: string
  response_text: string
  responder_name?: string
  responder_title?: string
  is_public: boolean
  is_pinned: boolean
  created_at: string
  updated_at?: string
}

export async function listReviews(filter: { status?: "all" | "approved" | "pending" } = {}) {
  let query = supabase.from("patient_reviews").select("*", { count: "exact" }).order("created_at", { ascending: false })

  if (filter.status === "approved") {
    query = query.eq("is_approved", true)
  } else if (filter.status === "pending") {
    query = query.eq("is_approved", false)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Review[]
}

export async function updateReview(id: string, patch: ReviewUpdate) {
  const { data, error } = await supabase
    .from("patient_reviews")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Review
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("patient_reviews").delete().eq("id", id)
  if (error) throw error
}

export async function setApproved(id: string, approved: boolean) {
  return updateReview(id, { is_approved: approved })
}

export async function setFeatured(id: string, featured: boolean) {
  return updateReview(id, { is_featured: featured })
}

export async function listResponses(reviewId: string) {
  const { data, error } = await supabase
    .from("review_responses")
    .select("*")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as ReviewResponse[]
}

export async function addResponse(reviewId: string, responseText: string, opts?: Partial<Pick<ReviewResponse, "is_public" | "is_pinned" | "responder_name" | "responder_title">>) {
  const payload = {
    review_id: reviewId,
    response_text: responseText,
    is_public: opts?.is_public ?? true,
    is_pinned: opts?.is_pinned ?? false,
    responder_name: opts?.responder_name,
    responder_title: opts?.responder_title,
  }

  const { data, error } = await supabase
    .from("review_responses")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ReviewResponse
}

export async function deleteResponse(responseId: string) {
  const { error } = await supabase.from("review_responses").delete().eq("id", responseId)
  if (error) throw error
}
