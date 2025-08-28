import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { QRCodeData, PrescriptionData } from './prescription-types'

export class QRCodeGenerator {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gonstead-clinic.vercel.app'
  private static readonly FALLBACK_URL = 'https://gonstead-clinic.github.io/prescription-viewer'
  
  /**
   * Generate a secure QR code for a prescription with multiple format support
   */
  static async generatePrescriptionQR(prescriptionData: PrescriptionData): Promise<string> {
    try {
      // Create secure token
      const secureToken = QRCodeGenerator.generateSecureToken()
      
      // Create comprehensive prescription data for QR code
      const compactPrescriptionData = {
        // Essential identification
        id: prescriptionData.id,
        pat: prescriptionData.patient_id,
        pat_name: prescriptionData.patient_name,
        apt: prescriptionData.appointment_id,
        
        // Medical details
        dr: prescriptionData.doctor_name,
        clinic: prescriptionData.clinic_name,
        visit: prescriptionData.visit_date,
        age: prescriptionData.patient_age,
        gender: prescriptionData.patient_gender,
        phone: prescriptionData.patient_phone,
        email: prescriptionData.patient_email,
        
        // Treatment information
        treatment: prescriptionData.treatment_plan,
        medicine: prescriptionData.prescribed_medicine,
        sessions: prescriptionData.total_sessions,
        fee: prescriptionData.session_fee,
        payment_method: prescriptionData.payment_method,
        payment_status: prescriptionData.payment_status,
        conditions: prescriptionData.conditions,
        
        // Security and metadata
        token: secureToken,
        ts: new Date().getTime(),
        version: '2.0'
      }
      
      // Create multiple viewer URLs for maximum compatibility
      const encoded = encodeURIComponent(JSON.stringify(compactPrescriptionData))
      
      // Primary URL (works with or without server)
      const universalViewerUrl = `${QRCodeGenerator.BASE_URL}/prescription-viewer.html?data=${encoded}`
      
      // Fallback URLs for different environments
      const fallbackUrls = [
        `${QRCodeGenerator.FALLBACK_URL}?data=${encoded}`,
        `${QRCodeGenerator.BASE_URL}/qr-scan?data=${encoded}`
      ]

      const qrData: QRCodeData = {
        patient_id: prescriptionData.patient_id,
        appointment_id: prescriptionData.appointment_id,
        prescription_id: prescriptionData.id,
        // Use universal viewer URL for maximum compatibility
        digital_url: universalViewerUrl,
        timestamp: new Date().toISOString(),
        clinic_id: 'gonstead-clinic-001'
      }

      // Store the complete prescription data with the token
      await QRCodeGenerator.storeSecureToken(secureToken, prescriptionData.id, prescriptionData)

      // Generate QR code as data URL with optimized settings
      const qrCodeDataURL = await QRCode.toDataURL(qrData.digital_url, {
        errorCorrectionLevel: 'H', // High error correction for better scanning
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
          dark: '#245064', // Clinic brand color
          light: '#FFFFFF'
        },
        width: 256 // Optimal size for scanning
      })

      return qrCodeDataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate prescription QR code')
    }
  }

  /**
   * Extract prescription data from encoded QR URL
   */
  static extractPrescriptionFromQRData(qrDataUrl: string): PrescriptionData | null {
    try {
      if (qrDataUrl.startsWith('prescription-data:')) {
        const encodedData = qrDataUrl.replace('prescription-data:', '')
        const decodedData = JSON.parse(decodeURIComponent(encodedData))
        
        // Try to get full data from token storage
        if (decodedData.token) {
          const validation = QRCodeGenerator.validateSecureToken(decodedData.token)
          if (validation.isValid && validation.prescriptionData) {
            return validation.prescriptionData
          }
        }
        
        // If we don't have the full data, create a minimal version from the QR data
        return {
          id: decodedData.id || 'PRESC-UNKNOWN',
          patient_id: decodedData.pat || 'PAT-UNKNOWN',
          appointment_id: decodedData.apt || 'APT-UNKNOWN',
          patient_name: decodedData.pat_name || 'Unknown Patient',
          doctor_name: decodedData.dr || 'Dr. Bashir Khan',
          clinic_name: decodedData.clinic || 'GONSTEAD CHIROPRACTIC CLINIC',
          visit_date: decodedData.visit || new Date().toISOString().split('T')[0],
          clinic_address: 'Near Peshawar Model School, Tehsil Road Nowshera, KPK',
          clinic_phone: '+923046996267',
          created_at: new Date(decodedData.ts || Date.now()).toISOString(),
          updated_at: new Date(decodedData.ts || Date.now()).toISOString()
        }
      }
      return null
    } catch (error) {
      console.error('Error extracting prescription data from QR:', error)
      return null
    }
  }

  /**
   * Generate QR code in different formats (PNG, JPG, SVG)
   */
  static async generateQRInFormat(url: string, format: 'png' | 'jpg' | 'jpeg' | 'svg' = 'png', size: number = 256): Promise<string> {
    try {
      const options = {
        errorCorrectionLevel: 'H' as const,
        type: format === 'svg' ? 'svg' as const : 'image/png' as const,
        quality: format === 'jpg' || format === 'jpeg' ? 0.9 : 0.95,
        margin: 2,
        color: {
          dark: '#245064',
          light: '#FFFFFF'
        },
        width: size
      }
      
      if (format === 'svg') {
        return await QRCode.toString(url, { ...options, type: 'svg' })
      } else {
        return await QRCode.toDataURL(url, options)
      }
    } catch (error) {
      console.error(`Error generating QR code in ${format} format:`, error)
      throw new Error(`Failed to generate QR code in ${format} format`)
    }
  }
  
  /**
   * Generate QR code for canvas/image rendering (backward compatibility)
   */
  static async generateQRForCanvas(url: string): Promise<string> {
    return await QRCodeGenerator.generateQRInFormat(url, 'png', 200)
  }
  
  /**
   * Download QR code in specified format
   */
  static async downloadQRCode(url: string, filename: string, format: 'png' | 'jpg' | 'svg' = 'png'): Promise<void> {
    try {
      const qrDataUrl = await QRCodeGenerator.generateQRInFormat(url, format, 512)
      
      const link = document.createElement('a')
      link.download = `${filename}-qr-code.${format}`
      link.href = qrDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      throw new Error('Failed to download QR code')
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
  private static async storeSecureToken(token: string, prescriptionId: string, prescriptionData?: PrescriptionData): Promise<void> {
    // In a real application, this would store in a database with expiration
    // For demo purposes, we'll use localStorage with a time limit
    if (typeof window !== 'undefined') {
      const tokenData = {
        prescriptionId,
        prescriptionData: prescriptionData || null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
      localStorage.setItem(`qr_token_${token}`, JSON.stringify(tokenData))
    }
  }

  /**
   * Validate secure token
   */
  static validateSecureToken(token: string): { isValid: boolean; prescriptionId?: string; prescriptionData?: PrescriptionData } {
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

      return { 
        isValid: true, 
        prescriptionId: tokenData.prescriptionId,
        prescriptionData: tokenData.prescriptionData || null
      }
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
