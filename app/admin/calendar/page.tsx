"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppointmentCalendar from '@/components/appointment-calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Home,
  ChevronLeft,
  Info
} from 'lucide-react'
import { 
  getPatients, 
  updatePatient, 
  deletePatient, 
  getCurrentUser,
  type Patient 
} from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export default function CalendarPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check authentication
  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Check localStorage first
      const isAuthenticated = localStorage.getItem("admin_authenticated")
      const storedEmail = localStorage.getItem("admin_email")

      if (isAuthenticated === "true" && storedEmail) {
        setAuthChecked(true)
        await loadPatients()
        return
      }

      // Check Supabase auth
      const { user, error } = await getCurrentUser()

      if (error || !user) {
        router.replace("/admin/auth")
        return
      }

      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_email", user.email || "")
      
      setAuthChecked(true)
      await loadPatients()
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("admin_authenticated")
      localStorage.removeItem("admin_email")
      router.replace("/admin/auth")
    }
  }

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await getPatients()

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        })
        return
      }

      setPatients(data || [])
    } catch (error) {
      console.error("Error loading patients:", error)
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppointmentClick = (appointment: any) => {
    // Handle appointment click
    console.log('Appointment clicked:', appointment)
  }

  const handleAppointmentUpdate = async (appointment: any) => {
    try {
      const patient = patients.find(p => p.id === appointment.id)
      if (patient) {
        await updatePatient(appointment.id, { status: appointment.status })
        await loadPatients()
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      })
    }
  }

  const handleAppointmentDelete = async (id: string) => {
    try {
      await deletePatient(id)
      await loadPatients()
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      })
    }
  }

  // Sunday closure logic
  const isSunday = (date: Date) => {
    return date.getDay() === 0 // Sunday = 0
  }

  const getSundayNotice = () => {
    const today = new Date()
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7)
    
    if (isSunday(today)) {
      return {
        isToday: true,
        message: "Our clinic is closed today (Sunday). Please select another day for your appointment booking."
      }
    }
    
    return {
      isToday: false,
      message: `Please note: Our clinic is closed on Sundays. Kindly schedule your appointments for Monday through Saturday.`
    }
  }

  const sundayNotice = getSundayNotice()

  // Loading screen
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-[#0d5c75]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#0d5c75] border-r-[#2a9d8f] rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-[#0d5c75] mb-2">Loading Calendar</h2>
          <p className="text-gray-600">Please wait while we load your appointment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)] to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0d5c75] via-[#1a6b7a] to-[#2a9d8f] text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/dashboard')}
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              
              <div className="h-8 w-px bg-white/30"></div>
              
              {/* Professional Logo Section */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Image
                    src="/images/gonstead-chiropractic-logo-new.png"
                    alt="Gonstead Chiropractic Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse"></div>
                    <CalendarIcon className="h-8 w-8 relative z-10" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-poppins">
                      Gonstead Appointment Calendar
                    </h1>
                    <p className="text-white/80 text-sm">
                      Dr. Bashir Khan - Professional Chiropractic Scheduling
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                <Clock className="h-3 w-3 mr-1" />
                {patients.length} Total Appointments
              </Badge>
              <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                <Shield className="h-3 w-3 mr-1" />
                Professional View
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">


        {/* Main Calendar Component */}
        <AppointmentCalendar
          appointments={patients.map(patient => ({
            id: patient.id,
            name: patient.name,
            phone: patient.phone,
            email: patient.email || undefined,
            appointment_date: patient.appointment_date,
            session_type: patient.session_type,
            status: patient.status,
            urgency: patient.urgency,
            notes: patient.notes || undefined,
            doctor: 'Dr. Bashir Khan',
            treatment_type: patient.session_type === 'in_clinic' ? 'Gonstead Adjustment' : 'Video Consultation',
            duration: patient.session_type === 'in_clinic' ? 60 : 30
          }))}
          onAppointmentClick={handleAppointmentClick}
          onAppointmentUpdate={handleAppointmentUpdate}
          onAppointmentDelete={handleAppointmentDelete}
        />

      </main>
    </div>
  )
}
