'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  User, 
  UserCheck, 
  Search, 
  Filter, 
  LogOut, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock3,
  Stethoscope,
  RefreshCw,
  Eye,
  Users
} from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/supabase'

interface Appointment {
  id: string
  patient_name: string
  patient_email: string
  patient_phone: string
  appointment_date: string
  appointment_time: string
  doctor_name: string
  appointment_type: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  created_at: string
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800'
}

const statusIcons = {
  scheduled: Clock3,
  confirmed: CheckCircle,
  in_progress: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  no_show: AlertCircle
}

export default function StaffDashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [staffUser, setStaffUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check authentication and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const { user } = await getCurrentUser()
        if (!user) {
          router.push('/staff-login')
          return
        }

        setStaffUser(user)
        await loadAppointments()
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/staff-login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

  // Mock function to load appointments - replace with actual Supabase query
  const loadAppointments = async () => {
    try {
      // This should be replaced with actual Supabase query respecting RLS
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          patient_name: 'John Smith',
          patient_email: 'john.smith@email.com',
          patient_phone: '(555) 123-4567',
          appointment_date: '2024-01-15',
          appointment_time: '09:00',
          doctor_name: 'Dr. Sarah Johnson',
          appointment_type: 'Initial Consultation',
          status: 'confirmed',
          notes: 'Lower back pain, referred by Dr. Wilson',
          created_at: '2024-01-10T10:30:00Z'
        },
        {
          id: '2',
          patient_name: 'Emily Davis',
          patient_email: 'emily.davis@email.com',
          patient_phone: '(555) 987-6543',
          appointment_date: '2024-01-15',
          appointment_time: '10:30',
          doctor_name: 'Dr. Michael Chen',
          appointment_type: 'Follow-up',
          status: 'scheduled',
          notes: 'Neck adjustment follow-up',
          created_at: '2024-01-12T14:15:00Z'
        },
        {
          id: '3',
          patient_name: 'Robert Wilson',
          patient_email: 'robert.wilson@email.com',
          patient_phone: '(555) 456-7890',
          appointment_date: '2024-01-15',
          appointment_time: '14:00',
          doctor_name: 'Dr. Sarah Johnson',
          appointment_type: 'Treatment',
          status: 'in_progress',
          notes: 'Spinal adjustment therapy',
          created_at: '2024-01-13T09:20:00Z'
        },
        {
          id: '4',
          patient_name: 'Lisa Anderson',
          patient_email: 'lisa.anderson@email.com',
          patient_phone: '(555) 321-0987',
          appointment_date: '2024-01-14',
          appointment_time: '11:00',
          doctor_name: 'Dr. Michael Chen',
          appointment_type: 'Consultation',
          status: 'completed',
          notes: 'Postural assessment completed',
          created_at: '2024-01-11T16:45:00Z'
        },
        {
          id: '5',
          patient_name: 'David Brown',
          patient_email: 'david.brown@email.com',
          patient_phone: '(555) 654-3210',
          appointment_date: '2024-01-16',
          appointment_time: '15:30',
          doctor_name: 'Dr. Sarah Johnson',
          appointment_type: 'Treatment',
          status: 'scheduled',
          notes: 'Chronic lower back pain treatment',
          created_at: '2024-01-14T11:30:00Z'
        }
      ]

      setAppointments(mockAppointments)
      setFilteredAppointments(mockAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setError('Failed to load appointments')
    }
  }

  // Filter appointments based on search and filters
  useEffect(() => {
    let filtered = appointments

    if (searchTerm) {
      filtered = filtered.filter(
        apt => 
          apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateFilter) {
      filtered = filtered.filter(apt => apt.appointment_date === dateFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    if (doctorFilter) {
      filtered = filtered.filter(apt => apt.doctor_name === doctorFilter)
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, dateFilter, statusFilter, doctorFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAppointments()
    setIsRefreshing(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      localStorage.removeItem('staff_authenticated')
      localStorage.removeItem('staff_email')
      localStorage.removeItem('staff_user_id')
      router.push('/staff-login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getUniqueValues = (key: keyof Appointment) => {
    return [...new Set(appointments.map(apt => apt[key]))]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-700">Loading staff dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-600">Gonstead Chiropractic Clinic</p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-emerald-600 transition-colors"
                title="Refresh appointments"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {staffUser?.email || 'Staff User'}
                </p>
                <p className="text-xs text-gray-500">Staff Portal</p>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients, doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="">All dates</option>
                {getUniqueValues('appointment_date').map(date => (
                  <option key={date} value={date}>{formatDate(date)}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="">All statuses</option>
                {getUniqueValues('status').map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>

              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="">All doctors</option>
                {getUniqueValues('doctor_name').map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{filteredAppointments.length}</div>
              <div className="text-sm text-gray-500">Total Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAppointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-500">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredAppointments.filter(apt => apt.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredAppointments.filter(apt => apt.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">
                {searchTerm || dateFilter || statusFilter || doctorFilter
                  ? 'Try adjusting your search or filters'
                  : 'No appointments scheduled'}
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const StatusIcon = statusIcons[appointment.status]
              return (
                <div key={appointment.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <span>{appointment.patient_name}</span>
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span>{appointment.patient_email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{appointment.patient_phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{formatTime(appointment.appointment_time)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{appointment.doctor_name}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Type: {appointment.appointment_type}
                      </p>
                    </div>

                    {/* Status and Notes */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-5 w-5" />
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      {appointment.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes: </span>
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-emerald-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Gonstead Chiropractic Clinic. All rights reserved.</p>
            <p className="mt-1">Staff portal - Read-only appointment access</p>
          </div>
        </div>
      </div>
    </div>
  )
}
