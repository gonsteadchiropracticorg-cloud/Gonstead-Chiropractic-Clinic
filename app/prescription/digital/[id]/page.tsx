"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { DigitalPrescription } from '@/components/digital-prescription'
import { QRCodeGenerator } from '@/lib/qr-code-utils'
import { PrescriptionData } from '@/lib/prescription-types'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Loader2, ShieldX } from 'lucide-react'

export default function DigitalPrescriptionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const prescriptionId = params.id as string
  const token = searchParams.get('token')

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isValidAccess, setIsValidAccess] = useState(false)

  useEffect(() => {
    validateAndLoadPrescription()
  }, [prescriptionId, token])

  const validateAndLoadPrescription = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate security token if provided
      if (token) {
        const validation = QRCodeGenerator.validateSecureToken(token)
        if (!validation.isValid) {
          setError('Invalid or expired access token. Please scan the QR code again.')
          setLoading(false)
          return
        }
        
        if (validation.prescriptionId !== prescriptionId) {
          setError('Token does not match the requested prescription.')
          setLoading(false)
          return
        }
        
        setIsValidAccess(true)
      }

      // Load prescription data
      // In a real application, this would fetch from a database
      // For demo, we'll use sample data or localStorage
      const prescriptionData = await loadPrescriptionData(prescriptionId)
      
      if (!prescriptionData) {
        setError('Prescription not found.')
        setLoading(false)
        return
      }

      setPrescription(prescriptionData)
      setLoading(false)

    } catch (err) {
      console.error('Error loading prescription:', err)
      setError('Failed to load prescription. Please try again.')
      setLoading(false)
    }
  }

  const loadPrescriptionData = async (id: string): Promise<PrescriptionData | null> => {
    // Check localStorage first (for demo purposes)
    const storedPrescriptions = localStorage.getItem('stored_prescriptions')
    if (storedPrescriptions) {
      const prescriptions: PrescriptionData[] = JSON.parse(storedPrescriptions)
      const found = prescriptions.find(p => p.id === id)
      if (found) return found
    }

    // If not found in localStorage, generate sample data for demo
    if (id.startsWith('PRESC-')) {
      const samplePrescription = QRCodeGenerator.generateSamplePrescription()
      samplePrescription.id = id
      return samplePrescription
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#245064] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Digital Prescription</h2>
            <p className="text-gray-600">Validating access and retrieving prescription data...</p>
            <div className="mt-4 bg-gradient-to-r from-[#245064] to-[#2e6478] h-2 rounded-full animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-red-300">
          <CardContent className="p-8 text-center">
            {error.includes('Invalid') || error.includes('expired') ? (
              <ShieldX className="h-12 w-12 text-red-600 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="bg-red-100 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                <strong>Security Note:</strong> Digital prescriptions require valid authentication tokens. 
                Please ensure you're accessing this prescription through the secure QR code provided 
                by Gonstead Chiropractic Clinic.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Prescription Not Found</h2>
            <p className="text-gray-600">The requested prescription could not be located.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DigitalPrescription 
      prescription={prescription} 
      isPublicView={true}
      showActions={true}
    />
  )
}
