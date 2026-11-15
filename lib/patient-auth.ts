/**
 * Patient Authentication & Firestore Account Manager
 * Handled via Firebase Auth + Firestore `patient_accounts` & `patients` collections.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore"
import { auth, db } from "./firebase"
import type { Patient } from "./firebase-db"
import { normalizeFirestorePatient } from "./firebase-db"

export interface PatientAccount {
  uid: string
  name: string
  email: string
  phone: string
  created_at: string
  last_login_at: string
  role: "patient"
  patient_id?: string
  dob?: string
  gender?: string
  address?: string
  emergency_contact?: string
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

const PATIENT_ACCOUNTS = "patient_accounts"
const PATIENTS = "patients"

/**
 * Register a new Patient account in Firebase Auth AND save credentials/profile in Firestore.
 */
export async function registerPatient(params: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<{ user: User | null; account: PatientAccount | null; error: string | null }> {
  if (!auth || !db) {
    return { user: null, account: null, error: "Firebase services not initialized." }
  }

  const cleanEmail = params.email.trim().toLowerCase()
  const cleanPhone = params.phone.trim()
  const cleanName = params.name.trim()

  try {
    // 1. Create Firebase Auth user (or sign in if already created from a previous attempt)
    let user: User | null = null
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password)
      user = cred.user
    } catch (authErr: any) {
      if (authErr.code === "auth/email-already-in-use") {
        try {
          const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, params.password)
          user = signInCred.user
        } catch {
          throw authErr
        }
      } else {
        throw authErr
      }
    }

    if (!user) {
      return { user: null, account: null, error: "Failed to authenticate account." }
    }

    const now = new Date().toISOString()

    // 2. Build Patient document & Account record
    const patientDocRef = doc(collection(db, PATIENTS))
    const patientData = {
      id: patientDocRef.id,
      auth_uid: user.uid,
      name: cleanName,
      patient_name: cleanName,
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      status: "scheduled",
      session_type: "in_clinic",
      created_at: now,
      updated_at: now,
      sessions_completed: 0,
      payment_method: "cash",
      booking_source: "patient_portal",
    }

    const accountDocRef = doc(db, PATIENT_ACCOUNTS, user.uid)
    const accountPayload: PatientAccount = {
      uid: user.uid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      created_at: now,
      last_login_at: now,
      role: "patient",
      patient_id: patientDocRef.id,
    }

    // 3. Immediately persist session in localStorage so the user is authenticated instantly
    if (typeof window !== "undefined") {
      localStorage.setItem("patient_authenticated", "true")
      localStorage.setItem("patient_uid", user.uid)
      localStorage.setItem("patient_email", cleanEmail)
      localStorage.setItem("patient_name", cleanName)
      localStorage.setItem("patient_phone", cleanPhone)
      localStorage.setItem("patient_id", patientDocRef.id)

      try {
        const localPatients: any[] = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
        localStorage.setItem("gonstead_patients", JSON.stringify([patientData, ...localPatients]))
      } catch {}
    }

    // 4. Save to Firestore with a 3.5s timeout guard so network/rules latency never hangs the UI
    try {
      await withTimeout(
        Promise.all([
          setDoc(patientDocRef, patientData),
          setDoc(accountDocRef, accountPayload),
        ]),
        3500,
        null
      )
    } catch (fsErr) {
      console.warn("[Firestore] Non-blocking registration sync note:", fsErr)
    }

    return { user, account: accountPayload, error: null }
  } catch (err: any) {
    console.error("registerPatient error:", err)
    let msg = err.message || "Failed to create patient account."
    if (err.code === "auth/email-already-in-use") {
      msg = "An account with this email address already exists. Please log in."
    } else if (err.code === "auth/weak-password") {
      msg = "Password should be at least 6 characters long."
    } else if (err.code === "auth/invalid-email") {
      msg = "Please enter a valid email address."
    } else if (err.code === "auth/unauthorized-domain") {
      msg = "Domain not authorized in Firebase. Please add your Vercel domain to Firebase Console -> Authentication -> Settings -> Authorized Domains."
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "Email/Password sign-in is not enabled in Firebase Console -> Authentication -> Sign-in method."
    } else if (err.code === "permission-denied" || err.message?.includes("insufficient permissions")) {
      msg = "Firestore permission denied. Please check Firestore Database -> Rules in Firebase Console."
    }
    return { user: null, account: null, error: msg }
  }
}

/**
 * Sign in existing patient with email & password.
 */
export async function loginPatient(
  email: string,
  pass: string
): Promise<{ user: User | null; account: PatientAccount | null; error: string | null }> {
  if (!auth || !db) {
    return { user: null, account: null, error: "Firebase services not initialized." }
  }

  const cleanEmail = email.trim().toLowerCase()

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass)
    const user = cred.user

    const fallbackName = user.displayName || user.email?.split("@")[0] || "Patient"

    // Set authenticated session immediately
    if (typeof window !== "undefined") {
      localStorage.setItem("patient_authenticated", "true")
      localStorage.setItem("patient_uid", user.uid)
      localStorage.setItem("patient_email", cleanEmail)
      localStorage.setItem("patient_name", fallbackName)
    }

    // Fetch account details from Firestore with a 3-second timeout guard
    const accountRef = doc(db, PATIENT_ACCOUNTS, user.uid)
    let account: PatientAccount | null = null

    try {
      const accountSnap = await withTimeout(getDoc(accountRef), 3000, null)

      if (accountSnap && accountSnap.exists()) {
        account = accountSnap.data() as PatientAccount
        if (typeof window !== "undefined") {
          localStorage.setItem("patient_name", account.name)
          if (account.phone) localStorage.setItem("patient_phone", account.phone)
          if (account.patient_id) localStorage.setItem("patient_id", account.patient_id)
        }
        updateDoc(accountRef, { last_login_at: new Date().toISOString() }).catch(() => {})
      }
    } catch (fsErr) {
      console.warn("[Firestore] Non-blocking account fetch note:", fsErr)
    }

    if (!account) {
      account = {
        uid: user.uid,
        name: fallbackName,
        email: cleanEmail,
        phone: user.phoneNumber || "",
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        role: "patient",
      }
    }

    return { user, account, error: null }
  } catch (err: any) {
    console.error("loginPatient error:", err)
    let msg = err.message || "Failed to sign in."
    if (
      err.code === "auth/wrong-password" ||
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential"
    ) {
      msg = "Invalid email or password. Please check your credentials."
    } else if (err.code === "auth/unauthorized-domain") {
      msg = "Domain not authorized in Firebase. Please add your Vercel domain to Firebase Console -> Authentication -> Settings -> Authorized Domains."
    } else if (err.code === "permission-denied" || err.message?.includes("insufficient permissions")) {
      msg = "Firestore permission denied. Please check Firestore Database -> Rules in Firebase Console."
    }
    return { user: null, account: null, error: msg }
  }
}

/**
 * Sign out current patient.
 */
export async function logoutPatient(): Promise<{ error: string | null }> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("patient_authenticated")
    localStorage.removeItem("patient_uid")
    localStorage.removeItem("patient_email")
    localStorage.removeItem("patient_name")
    localStorage.removeItem("patient_id")
  }

  if (auth) {
    try {
      await signOut(auth)
    } catch (err: any) {
      console.warn("logoutPatient error:", err)
    }
  }

  return { error: null }
}

/**
 * Fetch all appointments / patient records matching patient email, phone, name, or auth UID from Firestore.
 * Supports smart matching for doctor-booked appointments from the Admin Dashboard.
 */
export async function getPatientAppointmentsFromFirestore(
  email?: string,
  phone?: string,
  uid?: string,
  patientName?: string
): Promise<Patient[]> {
  if (!db) return []

  try {
    const resultsMap = new Map<string, Patient>()
    const cleanEmail = email?.trim().toLowerCase() || ""
    const cleanPhone = phone?.replace(/\D/g, "") || ""
    const cleanName = patientName?.trim().toLowerCase() || (typeof window !== "undefined" ? localStorage.getItem("patient_name")?.toLowerCase() || "" : "")

    // 1. Direct Queries by UID, Email, and Phone
    const queries = []
    if (uid) queries.push(query(collection(db, PATIENTS), where("auth_uid", "==", uid)))
    if (cleanEmail) {
      queries.push(query(collection(db, PATIENTS), where("email", "==", cleanEmail)))
    }
    if (cleanPhone) {
      queries.push(query(collection(db, PATIENTS), where("phone", "==", cleanPhone)))
    }

    for (const q of queries) {
      try {
        const snap = await withTimeout(getDocs(q), 3000, null)
        if (snap) {
          snap.docs.forEach((d) => {
            if (!resultsMap.has(d.id)) {
              const data = d.data()
              // Do not show placeholder registration records that have no scheduled appointment date
              if (data.appointment_date || data.booking_source === "admin_dashboard" || data.status === "completed") {
                resultsMap.set(d.id, normalizeFirestorePatient(d.id, data))
              }
            }
          })
        }
      } catch (e) {
        // Skip query failure
      }
    }

    // 2. Queue Queries
    if (cleanPhone) {
      try {
        const qQueue = query(collection(db, "appointment_queue"), where("patient_phone", "==", cleanPhone))
        const snapQueue = await withTimeout(getDocs(qQueue), 3000, null)
        if (snapQueue) {
          snapQueue.docs.forEach((d) => {
            if (!resultsMap.has(d.id)) {
              resultsMap.set(d.id, normalizeFirestorePatient(d.id, d.data()))
            }
          })
        }
      } catch (e) {}
    }

    // 3. Fallback to localStorage cache if resultsMap is empty
    if (resultsMap.size === 0 && typeof window !== "undefined") {
      try {
        const localList: any[] = JSON.parse(localStorage.getItem("gonstead_patients") || "[]")
        localList.forEach((p) => {
          const pEmail = (p.email || p.patient_email || "").toString().toLowerCase()
          const pPhone = (p.phone || p.patient_phone || "").toString().replace(/\D/g, "")
          if (
            (cleanEmail && pEmail === cleanEmail) ||
            (cleanPhone && pPhone && (cleanPhone.includes(pPhone) || pPhone.includes(cleanPhone)))
          ) {
            const pid = p.id || String(Math.random())
            if (!resultsMap.has(pid)) {
              resultsMap.set(pid, normalizeFirestorePatient(pid, p))
            }
          }
        })
      } catch {}
    }

    const list = Array.from(resultsMap.values())
    list.sort((a, b) => new Date(b.created_at || b.appointment_date).getTime() - new Date(a.created_at || a.appointment_date).getTime())
    return list
  } catch (err) {
    console.error("getPatientAppointmentsFromFirestore error:", err)
    return []
  }
}
