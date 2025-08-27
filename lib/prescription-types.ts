export interface PrescriptionData {
  id: string
  patient_id: string
  appointment_id: string
  patient_name: string
  patient_age?: string
  patient_gender?: string
  patient_phone?: string
  patient_email?: string
  patient_address?: string
  visit_date: string
  birth_date?: string
  joining_date?: string
  treatment_plan: string
  prescribed_medicine?: string
  total_sessions?: string
  session_fee?: string
  payment_method?: string
  payment_status?: string
  conditions?: string[]
  custom_fields?: { [key: string]: string }
  doctor_name: string
  doctor_signature?: string
  patient_signature?: string
  clinic_name: string
  clinic_address: string
  clinic_phone: string
  created_at: string
  updated_at: string
  qr_code?: string
  digital_url?: string
}

export interface QRCodeData {
  patient_id: string
  appointment_id: string
  prescription_id: string
  digital_url: string
  timestamp: string
  clinic_id?: string
}

export interface DigitalPrescriptionProps {
  prescription: PrescriptionData
  isPublicView?: boolean
  showActions?: boolean
}

export interface PrescriptionSecurity {
  access_token: string
  expires_at: string
  allowed_ips?: string[]
  access_count: number
  last_accessed: string
}
