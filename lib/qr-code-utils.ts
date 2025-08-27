import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { QRCodeData, PrescriptionData } from './prescription-types'

export class QRCodeGenerator {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  /**
   * Generate a secure QR code for a prescription
   */
  static async generatePrescriptionQR(prescriptionData: PrescriptionData): Promise<string> {
    try {
      // Create secure URL with encoded parameters
      const secureToken = QRCodeGenerator.generateSecureToken()
      const qrData: QRCodeData = {
        patient_id: prescriptionData.patient_id,
        appointment_id: prescriptionData.appointment_id,
        prescription_id: prescriptionData.id,
        digital_url: `${QRCodeGenerator.BASE_URL}/prescription/digital/${prescriptionData.id}?token=${secureToken}`,
        timestamp: new Date().toISOString(),
        clinic_id: 'gonstead-clinic-001'
      }

      // Store the secure token mapping (in real app, this would be in database)
      await QRCodeGenerator.storeSecureToken(secureToken, prescriptionData.id)

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData.digital_url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#245064', // Clinic brand color
          light: '#FFFFFF'
        },
        width: 200
      })

      return qrCodeDataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate prescription QR code')
    }
  }

  /**
   * Generate QR code for canvas/image rendering
   */
  static async generateQRForCanvas(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#245064',
          light: '#FFFFFF'
        },
        width: 150
      })
    } catch (error) {
      console.error('Error generating QR code for canvas:', error)
      throw new Error('Failed to generate QR code for canvas')
    }
  }

  /**
   * Generate secure access token
   */
  private static generateSecureToken(): string {
    return `${uuidv4()}-${Date.now()}-${Math.random().toString(36).substring(2)}`
  }

  /**
   * Store secure token mapping (localStorage for demo, database in production)
   */
  private static async storeSecureToken(token: string, prescriptionId: string): Promise<void> {
    // In a real application, this would store in a database with expiration
    // For demo purposes, we'll use localStorage with a time limit
    if (typeof window !== 'undefined') {
      const tokenData = {
        prescriptionId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
      localStorage.setItem(`qr_token_${token}`, JSON.stringify(tokenData))
    }
  }

  /**
   * Validate secure token
   */
  static validateSecureToken(token: string): { isValid: boolean; prescriptionId?: string } {
    try {
      if (typeof window === 'undefined') return { isValid: false }
      
      const tokenDataStr = localStorage.getItem(`qr_token_${token}`)
      if (!tokenDataStr) return { isValid: false }

      const tokenData = JSON.parse(tokenDataStr)
      const now = new Date()
      const expiresAt = new Date(tokenData.expiresAt)

      if (now > expiresAt) {
        // Token expired, clean up
        localStorage.removeItem(`qr_token_${token}`)
        return { isValid: false }
      }

      return { isValid: true, prescriptionId: tokenData.prescriptionId }
    } catch (error) {
      console.error('Error validating secure token:', error)
      return { isValid: false }
    }
  }

  /**
   * Generate sample prescription data for testing
   */
  static generateSamplePrescription(): PrescriptionData {
    const prescriptionId = `PRESC-${Date.now()}`
    const patientId = `PAT-${Math.random().toString(36).substring(2)}`
    const appointmentId = `APT-${Math.random().toString(36).substring(2)}`
    
    return {
      id: prescriptionId,
      patient_id: patientId,
      appointment_id: appointmentId,
      patient_name: "Ahmad Hassan",
      patient_age: "35",
      patient_gender: "male",
      patient_phone: "+92 300 1234567",
      patient_email: "ahmad.hassan@email.com",
      visit_date: new Date().toISOString().split('T')[0],
      treatment_plan: "Gonstead spinal adjustment for lower back pain. Apply ice therapy for 15 minutes twice daily. Avoid heavy lifting for 2 weeks.",
      prescribed_medicine: "Ibuprofen 400mg - Take twice daily after meals for 5 days. Apply topical anti-inflammatory gel as needed.",
      total_sessions: "8",
      session_fee: "3000",
      payment_method: "Cash",
      payment_status: "Paid",
      conditions: ["Lower Back Pain", "Spinal Misalignment", "Muscle Tension"],
      doctor_name: "Dr. Bashir Khan",
      clinic_name: "GONSTEAD CHIROPRACTIC CLINIC",
      clinic_address: "Near Peshawar Model School, Tehsil Road Nowshera, KPK",
      clinic_phone: "+923046996267",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}
