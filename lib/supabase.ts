import { createClient } from "@supabase/supabase-js"

// Get environment variables - fail early if not set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Info": "gonstead-chiropractic-admin",
    },
  },
})

// SECURITY: Use only Supabase authentication - no hardcoded credentials
// For initial setup, create admin user through Supabase dashboard or signUpAdmin()

// Admin authentication function with user registration support
export async function signInAdmin(email: string, password: string) {
  try {
    console.log("Attempting to sign in with:", email)

    // Try Supabase authentication first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (!error && data.user) {
        console.log("Supabase auth successful:", data.user.email)
        // Audit: sign in
        try { await addAuditLog({ action: 'sign_in', entity_type: 'auth', actor_email: data.user.email || email, source: 'admin_dashboard', reversible: false }) } catch {}
        return { user: data.user, error: null }
      }

      if (error) {
        console.log("Supabase auth failed:", error.message)
        // If user not found, we'll try fallback credentials
        if (error.message.includes("Invalid login credentials")) {
          console.log("User might not exist, checking fallback credentials...")
        }
      }
    } catch (supabaseError) {
      console.log("Supabase connection failed:", supabaseError)
    }

    // If authentication fails, return the error
    throw new Error("Invalid credentials. Please check your email and password.")
  } catch (error: any) {
    console.error("Sign in error:", error)
    return { user: null, error }
  }
}

// Function to register a new admin user
export async function signUpAdmin(email: string, password: string) {
  try {
    console.log("Attempting to register new user:", email)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          role: 'admin',
          clinic_name: 'Gonstead Chiropractic Clinic'
        }
      }
    })

    if (error) {
      console.error("Registration error:", error.message)
      throw error
    }

    if (data.user) {
      console.log("User registered successfully:", data.user.email)
      return { user: data.user, error: null }
    }

    throw new Error("Registration failed - no user data returned")
  } catch (error: any) {
    console.error("Sign up error:", error)
    return { user: null, error }
  }
}

// Get current user with fallback
export async function getCurrentUser() {
  try {
    // Check localStorage first
    const isAuthenticated = localStorage.getItem("admin_authenticated")
    const storedEmail = localStorage.getItem("admin_email")

    if (isAuthenticated === "true" && storedEmail) {
      return {
        user: {
          id: "admin-user",
          email: storedEmail,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    // Try Supabase as secondary
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (!error && user) {
        return { user, error: null }
      }
    } catch (supabaseError) {
      console.log("Supabase get user failed:", supabaseError)
    }

    return { user: null, error: null }
  } catch (error: any) {
    console.error("Get current user error:", error)
    return { user: null, error }
  }
}

// Sign out function
export async function signOutAdmin() {
  try {
    // Clear localStorage
    const actor = localStorage.getItem("admin_email") || undefined
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_email")

    // Try Supabase sign out
    try {
      await supabase.auth.signOut()
    } catch (supabaseError) {
      console.log("Supabase sign out failed:", supabaseError)
    }

    // Audit: sign out (best effort)
    try { await addAuditLog({ action: 'sign_out', entity_type: 'auth', actor_email: actor, source: 'admin_dashboard', reversible: false }) } catch {}

    return { error: null }
  } catch (error: any) {
    console.error("Sign out error:", error)
    return { error }
  }
}

// Staff authentication functions for secure reset portal
export async function signInStaff(email: string, password: string) {
  try {
    console.log("Staff attempting to sign in:", email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      console.error("Staff sign in error:", error.message)
      throw error
    }

    if (data.user) {
      console.log("Staff sign in successful:", data.user.email)
      return { user: data.user, error: null }
    }

    throw new Error("Sign in failed - no user data returned")
  } catch (error: any) {
    console.error("Staff sign in error:", error)
    return { user: null, error }
  }
}

export async function createStaffUser(email: string, password: string, role: string = 'staff') {
  try {
    console.log("Creating new staff user:", email)
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          role: role,
          clinic_name: 'Gonstead Chiropractic Clinic',
          created_by: 'admin_portal'
        }
      }
    })

    if (error) {
      console.error("Staff creation error:", error.message)
      throw error
    }

    if (data.user) {
      console.log("Staff user created successfully:", data.user.email)
      return { user: data.user, error: null }
    }

    throw new Error("User creation failed - no user data returned")
  } catch (error: any) {
    console.error("Create staff user error:", error)
    return { user: null, error }
  }
}

export async function resetStaffPassword(email: string) {
  try {
    console.log("Sending password reset email to:", email)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      console.error("Password reset error:", error.message)
      throw error
    }

    console.log("Password reset email sent successfully")
    return { error: null }
  } catch (error: any) {
    console.error("Reset password error:", error)
    return { error }
  }
}

export async function updateStaffEmail(newEmail: string) {
  try {
    console.log("Updating staff email to:", newEmail)
    
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail.trim()
    })

    if (error) {
      console.error("Email update error:", error.message)
      throw error
    }

    if (data.user) {
      console.log("Email updated successfully:", data.user.email)
      return { user: data.user, error: null }
    }

    throw new Error("Email update failed - no user data returned")
  } catch (error: any) {
    console.error("Update email error:", error)
    return { user: null, error }
  }
}

export async function deleteStaffAccount() {
  try {
    console.log("Signing out staff user (account deletion requires admin action)")
    
    // Note: Actual user deletion requires admin/service role
    // For now, we'll sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error.message)
      throw error
    }

    console.log("User signed out successfully")
    return { error: null }
  } catch (error: any) {
    console.error("Delete account error:", error)
    return { error }
  }
}

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("patients").select("count", { count: "exact", head: true })
    if (error) {
      console.error("Database connection test failed:", error)
      return false
    }
    console.log("Database connection successful")
    return true
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Database Types
export interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  profession?: string // Main profession/occupation field from booking form
  session_type: "in_clinic" | "video"
  appointment_date: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  urgency: "normal" | "urgent" | "emergency"
  payment_method: "cash" | "jazzcash" | "easypaisa"
  notes?: string
  medical_history?: string
  sessions_completed: number
  total_sessions?: number // Total sessions prescribed by doctor
  last_visit?: string
  created_at: string
  updated_at: string
  prescription_generated?: boolean
  prescription_count?: number
  last_prescription_date?: string
  booking_source?: "main_page" | "admin_dashboard"
  demographics?: {
    age?: number
    gender?: string
    occupation?: string // Detailed occupation info for admin use
    profession?: string // Synonym for occupation
    emergency_contact?: string
  }
  treatment_plan?: {
    diagnosis?: string
    goals?: string[]
    progress?: string
  }
  prescription?: {
    medications?: string[]
    instructions?: string
    follow_up_date?: string
  }
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
  last_login?: string
  role: "admin" | "doctor"
}

export interface ClinicSettings {
  id: string
  clinic_name: string
  address: string
  phone: string
  email: string
  website?: string
  coordinates: { lat: number; lng: number }
  map_url: string
  operating_hours: any
  created_at: string
  updated_at: string
}

// Staff Accounts (admin-managed)
export interface StaffAccount {
  id: string
  username: string
  display_name?: string
  email?: string
  phone?: string
  role: 'staff' | 'assistant'
  active: boolean
  password?: string // stored only in local fallback; do NOT store in DB plaintext
  last_login_at?: string
  created_at: string
  updated_at: string
}


// Database Functions with fallback data
export const createPatient = async (patientData: Omit<Patient, "id" | "created_at" | "updated_at">) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        ...patientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Create patient error:", error)
    // Return mock data for development
    return {
      id: `patient-${Date.now()}`,
      ...patientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export const getPatients = async () => {
  try {
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Get patients error:", error)
    // Do not return mock demo patients in production/staging; return empty list to avoid fake names
    return {
      data: [],
      error: null,
    }
  }
}

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Update patient error:", error)
    return null
  }
}

export const deletePatient = async (id: string) => {
  try {
    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Delete patient error:", error)
  }
}

export const getPatientByPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase.from("patients").select("*").eq("phone", phone).single()
    return { data, error }
  } catch (error) {
    console.error("Get patient by phone error:", error)
    return { data: null, error }
  }
}

// Clinic Settings Functions
export const getClinicSettings = async () => {
  try {
    const { data, error } = await supabase.from("clinic_settings").select("*").single()
    return { data, error }
  } catch (error) {
    console.error("Get clinic settings error:", error)
    return {
      data: {
        id: "1",
        clinic_name: "Gonstead Chiropractic Clinic",
        address: "Near Police Station, Tehsil Road, Nowshera",
        phone: "+92 304 699 6267",
        email: "info@gonsteadchiropractic.com",
        coordinates: { lat: 34.01, lng: 71.9809 },
        map_url: "https://maps.google.com",
        operating_hours: {
          monday: "9:00 AM - 6:00 PM",
          tuesday: "9:00 AM - 6:00 PM",
          wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "9:00 AM - 6:00 PM",
          sunday: "Emergency only",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    }
  }
}

export const updateClinicSettings = async (settings: Partial<ClinicSettings>) => {
  try {
    const { data, error } = await supabase
      .from("clinic_settings")
      .upsert({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Update clinic settings error:", error)
    return null
  }
}

// Prescription Functions
export const savePrescription = async (patientId: string, prescriptionData: any) => {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        patient_id: patientId,
        ...prescriptionData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Save prescription error:", error)
    return null
  }
}

export const getPrescriptions = async (patientId: string) => {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    return { data, error }
  } catch (error) {
    console.error("Get prescriptions error:", error)
    return { data: [], error }
  }
}

// Staff Accounts CRUD with localStorage fallback
const STAFF_ACCOUNTS_KEY = 'staff_accounts'

export const getStaffAccounts = async (): Promise<{ data: StaffAccount[]; error: any }> => {
  try {
    const { data, error } = await supabase.from('staff_accounts').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return { data: (data || []) as StaffAccount[], error: null }
  } catch (e) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY) || '[]'
        const parsed = JSON.parse(raw)
        return { data: parsed, error: null }
      } catch (err) {
        return { data: [], error: err }
      }
    }
    return { data: [], error: e }
  }
}

export const createStaffAccount = async (account: Omit<StaffAccount, 'id' | 'created_at' | 'updated_at'>) => {
  const record: StaffAccount = {
    id: `staff_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    active: true,
    role: account.role || 'staff',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...account,
  }
  try {
    // Do not send plaintext password to DB
    const { password, ...dbPayload } = record
    const { data, error } = await supabase.from('staff_accounts').insert(dbPayload as any).select('*').single()
    if (error) throw error
    return data as StaffAccount
  } catch (e) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY) || '[]'
      const arr = JSON.parse(raw)
      arr.unshift(record)
      localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(arr))
      window.dispatchEvent(new CustomEvent('staffAccountsUpdated'))
      return record
    }
    throw e
  }
}

export const updateStaffAccount = async (id: string, updates: Partial<StaffAccount>) => {
  try {
    const { password, ...dbUpdates } = updates
    const { data, error } = await supabase.from('staff_accounts').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) throw error
    return data as StaffAccount
  } catch (e) {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY) || '[]'
      const arr = JSON.parse(raw) as StaffAccount[]
      const updated = arr.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a)
      localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('staffAccountsUpdated'))
      return updated.find(a => a.id === id)
    }
    return null
  }
}

export const removeStaffAccount = async (id: string) => {
  try {
    const { error } = await supabase.from('staff_accounts').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY) || '[]'
      const arr = JSON.parse(raw) as StaffAccount[]
      const filtered = arr.filter(a => a.id !== id)
      localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(filtered))
      window.dispatchEvent(new CustomEvent('staffAccountsUpdated'))
      return true
    }
    return false
  }
}

// =========================
// Audit Log (with fallback)
// =========================
export interface AuditLog {
  id: string
  timestamp: string
  action: string // create | update | delete | rename | sign_in | sign_out | import | export | settings_update | error
  entity_type?: string // patient | prescription | settings | auth | system
  entity_id?: string
  actor_id?: string
  actor_email?: string
  source?: string // admin_dashboard | main_page | api | system
  reversible?: boolean
  meta?: any // { before?: any, after?: any, reason?: string }
}

export const addAuditLog = async (log: Omit<AuditLog, "id" | "timestamp">) => {
  const entry: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...log,
  }

  try {
    const { error } = await supabase.from("audit_logs").insert(entry as any)
    if (error) throw error
  } catch (e) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('audit_logs') || '[]'
        const parsed = JSON.parse(raw)
        parsed.unshift(entry)
        localStorage.setItem('audit_logs', JSON.stringify(parsed))
        // Notify listeners
        window.dispatchEvent(new CustomEvent('auditLogCreated', { detail: entry }))
      } catch {}
    }
  }
  return entry
}

export const getAuditLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
    if (error) throw error
    return { data: (data || []) as AuditLog[], error: null }
  } catch (e) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('audit_logs') || '[]'
        const parsed: AuditLog[] = JSON.parse(raw)
        return { data: parsed, error: null }
      } catch (err) {
        return { data: [], error: err as any }
      }
    }
    return { data: [], error: e as any }
  }
}


// Best-effort undo for common actions
export const undoAuditLog = async (log: AuditLog) => {
  if (!log.reversible) return { ok: false, error: 'Not reversible' }
  try {
    if (log.entity_type === 'patient') {
      if (log.action === 'create' && log.entity_id) {
        await deletePatient(log.entity_id)
        return { ok: true }
      }
      if (log.action === 'delete' && log.meta?.before) {
        await createPatient({ ...(log.meta.before as any) })
        return { ok: true }
      }
      if (log.action === 'update' && log.entity_id && log.meta?.before) {
        await updatePatient(log.entity_id, { ...(log.meta.before as any) })
        return { ok: true }
      }
    }
    // Extend for other entity types as needed
    return { ok: false, error: 'Undo not implemented for this action' }
  } catch (error) {
    console.error('Undo error:', error)
    return { ok: false, error }
  }
}

