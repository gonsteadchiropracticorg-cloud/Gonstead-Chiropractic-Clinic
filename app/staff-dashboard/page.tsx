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
  Users,
  Shield,
  Lock,
  EyeOff
} from 'lucide-react'
import { getPatients, type Patient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const statusColors = {
  pending: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusIcons = {
  pending: Clock3,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle
}

export default function StaffDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Dashboard states
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [staffUsername, setStaffUsername] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null)

  // Update current time every second
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check authentication on page load and setup real-time sync
  useEffect(() => {
    const checkAuth = () => {
      const staffAuth = localStorage.getItem('staff_authenticated')
      const staffUser = localStorage.getItem('staff_username')
      
      if (staffAuth === 'true' && staffUser) {
        setIsAuthenticated(true)
        setStaffUsername(staffUser)
        loadPatientData()
        setupSessionTimeout()
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  // Real-time data synchronization with admin dashboard
  useEffect(() => {
    if (!isAuthenticated) return

    // Listen for new appointments from the booking form and admin dashboard
    const handleNewAppointment = (event: CustomEvent) => {
      console.log('Staff Dashboard: Received new appointment event:', event.detail)
      const newPatient = event.detail
      
      // Update patient list with new appointment
      setPatients(prev => {
        const existingPatient = prev.find(p => p.id === newPatient.id)
        if (existingPatient) {
          // Update existing patient
          return prev.map(p => p.id === newPatient.id ? newPatient : p)
        } else {
          // Add new patient
          return [newPatient, ...prev]
        }
      })
      
      toast({
        title: '📋 New Patient Update',
        description: `${newPatient.name} appointment data has been synchronized`,
      })
    }

    const handlePatientUpdate = (event: CustomEvent) => {
      console.log('Staff Dashboard: Received patient update event:', event.detail)
      const updatedPatient = event.detail
      
      setPatients(prev => 
        prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
      )
      
      toast({
        title: '🔄 Patient Updated',
        description: `${updatedPatient.name} information has been updated`,
      })
    }

    // Add event listeners for real-time updates
    window.addEventListener('newAppointment', handleNewAppointment as EventListener)
    window.addEventListener('patientUpdated', handlePatientUpdate as EventListener)
    
    // Setup periodic data refresh (every 2 minutes)
    const refreshInterval = setInterval(async () => {
      console.log('Staff Dashboard: Performing periodic data refresh...')
      await loadPatientData()
    }, 2 * 60 * 1000) // 2 minutes
    
    // Cleanup
    return () => {
      window.removeEventListener('newAppointment', handleNewAppointment as EventListener)
      window.removeEventListener('patientUpdated', handlePatientUpdate as EventListener)
      clearInterval(refreshInterval)
    }
  }, [isAuthenticated])

  // Helper functions
  const formatTime12Hour = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Setup session timeout (30 minutes)
  const setupSessionTimeout = () => {
    if (sessionTimeout) clearTimeout(sessionTimeout)
    
    const timeout = setTimeout(() => {
      handleStaffLogout()
      toast({
        title: '⏰ Session Expired',
        description: 'Your session has expired. Please log in again.',
        variant: 'destructive'
      })
    }, 30 * 60 * 1000) // 30 minutes
    
    setSessionTimeout(timeout)
  }

  // Load patient data with proper synchronization from admin dashboard
  const loadPatientData = async () => {
    try {
      console.log('Staff Dashboard: Loading patient data...')
      
      // Load from Supabase (real data)
      const { data: supabasePatients, error } = await getPatients()
      if (error) {
        console.error('Staff Dashboard: Error loading Supabase patients:', error)
      }
      const realPatients = supabasePatients || []
      console.log('Staff Dashboard: Loaded Supabase patients:', realPatients.length)
      
      // Load from localStorage (appointments from booking form and admin dashboard)
      const localStoragePatients = JSON.parse(localStorage.getItem('gonstead_patients') || '[]')
      console.log('Staff Dashboard: Loaded localStorage patients:', localStoragePatients.length)
      
      // Create dummy patients for demonstration
      const dummyPatients: Patient[] = [
        {
          id: 'staff-p1',
          name: 'Ahmed Hassan',
          phone: '+92 301 234 5678',
          email: 'ahmed.hassan@email.com',
          session_type: 'in_clinic',
          appointment_date: new Date().toISOString(),
          urgency: 'normal',
          payment_method: 'cash',
          status: 'confirmed',
          notes: 'Lower back pain, chronic issue for 3 months',
          sessions_completed: 2,
          last_visit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'staff-p2',
          name: 'Fatima Khan',
          phone: '+92 302 345 6789',
          email: 'fatima.khan@email.com',
          session_type: 'video',
          appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          urgency: 'urgent',
          payment_method: 'jazzcash',
          status: 'pending',
          notes: 'Neck stiffness after car accident',
          sessions_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'staff-p3',
          name: 'Muhammad Ali',
          phone: '+92 303 456 7890',
          email: 'muhammad.ali@email.com',
          session_type: 'in_clinic',
          appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          urgency: 'emergency',
          payment_method: 'easypaisa',
          status: 'completed',
          notes: 'Severe back spasm, requiring immediate attention',
          sessions_completed: 5,
          last_visit: new Date().toISOString(),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'staff-p4',
          name: 'Aisha Malik',
          phone: '+92 304 567 8901',
          email: 'aisha.malik@email.com',
          session_type: 'in_clinic',
          appointment_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          urgency: 'normal',
          payment_method: 'cash',
          status: 'confirmed',
          notes: 'Regular maintenance adjustment, office worker',
          sessions_completed: 8,
          last_visit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'staff-p5',
          name: 'Omar Sheikh',
          phone: '+92 305 678 9012',
          email: 'omar.sheikh@email.com',
          session_type: 'video',
          appointment_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          urgency: 'normal',
          payment_method: 'jazzcash',
          status: 'cancelled',
          notes: 'Shoulder pain from sports injury, rescheduled',
          sessions_completed: 1,
          last_visit: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      // Merge patients with proper deduplication - prioritize Supabase data
      const mergedPatients = [...realPatients]
      const existingIds = new Set(realPatients.map(p => p.id))
      
      // Add localStorage patients that aren't already in Supabase (by ID)
      localStoragePatients.forEach((localPatient: Patient) => {
        if (!existingIds.has(localPatient.id)) {
          mergedPatients.push(localPatient)
          existingIds.add(localPatient.id)
        }
      })
      
      // Add dummy patients for demonstration (always include these for staff to see)
      dummyPatients.forEach((dummyPatient) => {
        if (!existingIds.has(dummyPatient.id)) {
          mergedPatients.push(dummyPatient)
          existingIds.add(dummyPatient.id)
        }
      })
      
      console.log('Staff Dashboard: Total merged patients:', mergedPatients.length)
      
      // Sort by appointment date (most recent first)
      const sortedPatients = mergedPatients.sort((a, b) => 
        new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      )
      
      setPatients(sortedPatients)
      setFilteredPatients(sortedPatients)
      
    } catch (error) {
      console.error('Staff Dashboard: Error loading patient data:', error)
      setError('Failed to load patient data')
    }
  }

  // Staff authentication
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    
    try {
      // Get staff credentials from localStorage (set by admin)
      let storedCredentials = localStorage.getItem('staff_credentials')
      
      if (!storedCredentials) {
        // Set default credentials if none exist
        const defaultCredentials = {
          username: 'staff',
          password: 'staff123',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }
        localStorage.setItem('staff_credentials', JSON.stringify(defaultCredentials))
        storedCredentials = JSON.stringify(defaultCredentials)
      }
      
      const savedCredentials = JSON.parse(storedCredentials)
      
      // Validate credentials
      if (credentials.username === savedCredentials.username && 
          credentials.password === savedCredentials.password) {
        
        // Set authentication
        localStorage.setItem('staff_authenticated', 'true')
        localStorage.setItem('staff_login_time', new Date().toISOString())
        localStorage.setItem('staff_username', credentials.username)
        
        setIsAuthenticated(true)
        setStaffUsername(credentials.username)
        
        // Load patient data and setup session timeout
        await loadPatientData()
        setupSessionTimeout()
        
        toast({
          title: '✅ Authentication Successful',
          description: 'Welcome to Staff Dashboard. You have read-only access to patient data.',
        })
      } else {
        toast({
          title: '❌ Authentication Failed',
          description: 'Invalid username or password. Please contact the doctor for correct credentials.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Authentication error:', error)
      toast({
        title: 'Error',
        description: 'Authentication system error. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setAuthLoading(false)
    }
  }

  // Staff logout
  const handleStaffLogout = () => {
    localStorage.removeItem('staff_authenticated')
    localStorage.removeItem('staff_login_time')
    localStorage.removeItem('staff_username')
    
    if (sessionTimeout) clearTimeout(sessionTimeout)
    
    setIsAuthenticated(false)
    setCredentials({ username: '', password: '' })
    setStaffUsername('')
    setPatients([])
    setFilteredPatients([])
    
    toast({
      title: '👋 Logged Out',
      description: 'You have been successfully logged out.',
    })
  }

  // Filter patients based on search and filters
  useEffect(() => {
    let filtered = patients

    if (searchTerm) {
      filtered = filtered.filter(
        patient => 
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm) ||
          (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(patient => patient.status === statusFilter)
    }

    if (urgencyFilter) {
      filtered = filtered.filter(patient => patient.urgency === urgencyFilter)
    }

    setFilteredPatients(filtered)
  }, [patients, searchTerm, statusFilter, urgencyFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setupSessionTimeout() // Reset session timeout on activity
    await loadPatientData()
    setIsRefreshing(false)
  }

  // Get urgency color for badges
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800'
      case 'urgent': return 'bg-orange-100 text-orange-800' 
      case 'normal': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(174,193,192)] via-[rgb(220,230,229)] to-[rgb(174,193,192)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0d5c75] mx-auto mb-4" />
          <p className="text-[#0d5c75]">Loading staff dashboard...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[rgb(174,193,192)] via-[rgb(220,230,229)] to-[rgb(174,193,192)] flex items-center justify-center p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[10%] left-[15%] w-32 h-32 bg-gradient-to-r from-[#0d5c75]/30 to-[#2a9d8f]/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-[60%] right-[10%] w-24 h-24 bg-gradient-to-r from-[rgb(227,252,236)]/30 to-[#0d5c75]/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-[20%] left-[20%] w-20 h-20 bg-gradient-to-r from-[#2a9d8f]/30 to-[rgb(227,252,236)]/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Main Authentication Card */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 rounded-2xl overflow-hidden">
            {/* Header with Logo */}
            <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white p-8 text-center relative">
              <div className="relative z-10">
                {/* Logo */}
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                    <Image
                      src="/images/gonstead-chiropractic-logo-new.png"
                      alt="Gonstead Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  {/* Staff Badge */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-[rgb(227,252,236)] to-white rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="h-4 w-4 text-[#0d5c75]" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold mb-2">Staff Portal</CardTitle>
                <p className="text-white/90 text-sm">Gonstead Chiropractic Clinic</p>
                <p className="text-white/80 text-xs mt-1">Dr. Bashir Khan - Staff Access System</p>
                
                {/* Live Time Display */}
                <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-sm font-semibold">{formatTime12Hour(currentTime)}</div>
                  <div className="text-xs opacity-90">{formatDate(currentTime)}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleStaffLogin} className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-[#0d5c75] mb-2">Staff Authentication</h3>
                  <p className="text-sm text-gray-600">Enter your credentials to access patient data</p>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#0d5c75] font-medium">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="pl-10 border-2 border-gray-200 focus:border-[#0d5c75] rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0d5c75] font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10 border-2 border-gray-200 focus:border-[#0d5c75] rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#0a4a5c] hover:to-[#238a7a] text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {authLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Access Staff Dashboard</span>
                    </div>
                  )}
                </Button>

                {/* Info Section */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Staff Access Information:</p>
                      <ul className="text-xs space-y-1 text-blue-700">
                        <li>• Read-only access to patient data</li>
                        <li>• Real-time appointment updates</li>
                        <li>• Contact admin for password changes</li>
                        <li>• Session expires after inactivity</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 text-center">
              <p className="text-xs text-gray-600">Gonstead Chiropractic Clinic Staff Portal</p>
              <p className="text-xs text-gray-500 mt-1">For assistance, contact Dr. Bashir Khan</p>
              <p className="text-xs text-gray-400 mt-2">Default: Username: staff, Password: staff123</p>
            </div>
          </Card>
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
                title="Refresh patient data"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {staffUsername || 'Staff User'}
                </p>
                <p className="text-xs text-gray-500">Staff Portal - Read Only</p>
              </div>

              <button
                onClick={handleStaffLogout}
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
                  placeholder="Search patients by name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="">All Urgency</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{filteredPatients.length}</div>
              <div className="text-sm text-gray-500">Total Patients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredPatients.filter(patient => patient.status === 'confirmed' || patient.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredPatients.filter(patient => patient.urgency === 'urgent' || patient.urgency === 'emergency').length}
              </div>
              <div className="text-sm text-gray-500">Urgent Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredPatients.filter(patient => patient.status === 'completed').length}
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

        {/* Patient List - Read Only */}
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter || urgencyFilter
                  ? 'Try adjusting your search or filters'
                  : 'No patients available'}
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const StatusIcon = statusIcons[patient.status] || Clock3
              return (
                <div key={patient.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-l-emerald-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        <span>{patient.name}</span>
                        <Badge variant="outline" className="text-xs">
                          READ-only
                        </Badge>
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 flex-shrink-0 text-blue-500" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 flex-shrink-0 text-blue-500" />
                          <span>{patient.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-purple-500" />
                          <span className="text-xs">ID: {patient.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">
                          {new Date(patient.appointment_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">
                          {new Date(patient.appointment_date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">
                          {patient.session_type === 'in_clinic' ? 'In-Clinic Treatment' : 'Video Consultation'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sessions: {patient.sessions_completed || 0} completed
                      </p>
                      <p className="text-sm text-gray-600">
                        Payment: {patient.payment_method.toUpperCase()}
                      </p>
                    </div>

                    {/* Status and Notes */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-5 w-5" />
                        <Badge className={statusColors[patient.status]}>
                          {patient.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4" />
                        <Badge className={getUrgencyColor(patient.urgency)}>
                          {patient.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      {patient.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes: </span>
                            {patient.notes}
                          </p>
                        </div>
                      )}
                      {patient.last_visit && (
                        <div className="text-xs text-gray-500">
                          Last visit: {new Date(patient.last_visit).toLocaleDateString()}
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
            <p className="mt-1">Staff Portal - Read-only Patient Data Access</p>
            <p className="mt-2 text-xs text-gray-400">Real-time updates • Session expires in 30 minutes of inactivity</p>
          </div>
        </div>
      </div>
    </div>
  )
}
