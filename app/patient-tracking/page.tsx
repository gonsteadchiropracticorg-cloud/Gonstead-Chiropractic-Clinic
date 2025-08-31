"use client"

import { useSearchParams } from 'next/navigation'
import { PatientTrackingDashboard } from '@/components/patient-tracking-dashboard'

export default function PatientTrackingPage() {
  const searchParams = useSearchParams()
  const prescriptionId = searchParams.get('id')

  return <PatientTrackingDashboard initialPrescriptionId={prescriptionId || undefined} />
}
