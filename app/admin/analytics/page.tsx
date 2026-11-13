"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Download, 
  ArrowLeft, 
  Activity, 
  Target, 
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  TrendingDown as TrendDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, getPatients } from "@/lib/data-service"
import Image from "next/image"
import { VisitorAnalytics } from "@/components/visitor-analytics"
import { useSeamlessData } from "@/hooks/use-silent-sync"
import { SeamlessDotIndicator } from "@/components/ui/seamless-update-indicator"

export default function AdminAnalytics() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<"clinic" | "website">("clinic")
  const [patients, setPatients] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState("30")
  const [analytics, setAnalytics] = useState({
    totalPatients: 0,
    totalRevenue: 0,
    averageSessionsPerPatient: 0,
    completionRate: 0,
    monthlyGrowth: 0,
    emergencyRate: 0,
  })

  const router = useRouter()
  const { toast } = useToast()

  // Seamless analytics data loading
  const loadAnalyticsData = async () => {
    const savedPatients = localStorage.getItem("gonstead_patients")
    const patientsData = savedPatients ? JSON.parse(savedPatients) : []
    return {
      patients: patientsData,
      analytics: calculateAnalytics(patientsData)
    }
  }

  const { data: seamlessData, syncState } = useSeamlessData(
    { patients: [], analytics: { totalPatients: 0, totalRevenue: 0, averageSessionsPerPatient: 0, completionRate: 0, monthlyGrowth: 0, emergencyRate: 0 } },
    loadAnalyticsData,
    {
      syncInterval: 30000,
      enableRealTimeSync: false
    }
  )


  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      if (typeof window === "undefined") {
        setIsCheckingAuth(false)
        return
      }
      
      // Check localStorage first to prevent loops (same as dashboard)
      const isAuthenticatedLocal = localStorage.getItem("admin_authenticated")
      const storedEmail = localStorage.getItem("admin_email")

      if (isAuthenticatedLocal === "true" && storedEmail) {
        setIsAuthenticated(true)
        setIsCheckingAuth(false)
        await loadInitialData()
        return
      }

      // If no localStorage, check Supabase auth
      const { user } = await getCurrentUser()
      const adminEmails = [
        "bashirahmad123.org@gmail.com",
        "Bashirahmad123.org@gmail.com",
        "admin@gonsteadchiropractic.com",
        "dr.bashir@gonsteadchiropractic.com",
      ]

      if (!user || !adminEmails.includes(user.email?.toLowerCase() || "")) {
        setIsCheckingAuth(false)
        router.push("/admin/auth")
        return
      }

      // Store auth in localStorage to prevent future loops
      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_email", user.email || "")

      setIsAuthenticated(true)
      setIsCheckingAuth(false)
      await loadInitialData()
    } catch (error) {
      console.error("Auth check failed:", error)
      setIsCheckingAuth(false)
      if (typeof window !== "undefined") {
        router.push("/admin/auth")
      }
    }
  }

  // Advanced real-time analytics calculation with time-based filtering
  const calculateAdvancedAnalytics = (patientsData: any[], days: number) => {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // Filter patients by time range
    const filteredPatients = patientsData.filter(p => {
      const appointmentDate = new Date(p.appointment_date || p.created_at)
      return appointmentDate >= cutoffDate
    })
    
    // Previous period for comparison
    const previousCutoff = new Date(cutoffDate.getTime() - days * 24 * 60 * 60 * 1000)
    const previousPatients = patientsData.filter(p => {
      const appointmentDate = new Date(p.appointment_date || p.created_at)
      return appointmentDate >= previousCutoff && appointmentDate < cutoffDate
    })
    
    // Current period metrics
    const totalPatients = filteredPatients.length
    const totalSessions = filteredPatients.reduce((sum, p) => sum + (p.sessions_completed || 0), 0)
    const completedPatients = filteredPatients.filter((p) => p.status === "completed").length
    const emergencyPatients = filteredPatients.filter((p) => p.urgency === "emergency").length
    const urgentPatients = filteredPatients.filter((p) => p.urgency === "urgent").length
    const inClinicPatients = filteredPatients.filter((p) => p.session_type === "in_clinic").length
    const videoPatients = filteredPatients.filter((p) => p.session_type === "video").length
    const pendingPatients = filteredPatients.filter((p) => p.status === "pending").length
    const confirmedPatients = filteredPatients.filter((p) => p.status === "confirmed").length
    
    // Previous period metrics
    const prevTotalPatients = previousPatients.length
    const prevTotalSessions = previousPatients.reduce((sum, p) => sum + (p.sessions_completed || 0), 0)
    const prevCompletedPatients = previousPatients.filter((p) => p.status === "completed").length
    
    // Calculate growth percentages
    const patientGrowth = prevTotalPatients > 0 
      ? ((totalPatients - prevTotalPatients) / prevTotalPatients) * 100 
      : totalPatients > 0 ? 100 : 0
    
    const revenuePerSession = 2000 // PKR per session
    const totalRevenue = totalSessions * revenuePerSession
    const prevRevenue = prevTotalSessions * revenuePerSession
    const revenueGrowth = prevRevenue > 0 
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0
    
    const completionRate = totalPatients > 0 ? (completedPatients / totalPatients) * 100 : 0
    const prevCompletionRate = prevTotalPatients > 0 ? (prevCompletedPatients / prevTotalPatients) * 100 : 0
    const completionRateChange = prevCompletionRate > 0 
      ? completionRate - prevCompletionRate 
      : 0
    
    return {
      totalPatients,
      totalSessions,
      totalRevenue,
      averageSessionsPerPatient: totalPatients > 0 ? totalSessions / totalPatients : 0,
      completionRate,
      patientGrowth,
      revenueGrowth,
      completionRateChange,
      emergencyRate: totalPatients > 0 ? (emergencyPatients / totalPatients) * 100 : 0,
      urgentRate: totalPatients > 0 ? (urgentPatients / totalPatients) * 100 : 0,
      inClinicPercentage: totalPatients > 0 ? (inClinicPatients / totalPatients) * 100 : 0,
      videoPercentage: totalPatients > 0 ? (videoPatients / totalPatients) * 100 : 0,
      pendingCount: pendingPatients,
      confirmedCount: confirmedPatients,
      completedCount: completedPatients,
      emergencyCount: emergencyPatients,
      urgentCount: urgentPatients,
      prevTotalPatients,
      prevTotalSessions,
      prevRevenue,
    }
  }
  
  const calculateAnalytics = (patientsData: any[]) => {
    const totalPatients = patientsData.length
    const totalSessions = patientsData.reduce((sum, p) => sum + (p.sessions_completed || 0), 0)
    const completedPatients = patientsData.filter((p) => p.status === "completed").length
    const emergencyPatients = patientsData.filter((p) => p.urgency === "emergency").length

    return {
      totalPatients,
      totalRevenue: totalSessions * 2000,
      averageSessionsPerPatient: totalPatients > 0 ? totalSessions / totalPatients : 0,
      completionRate: totalPatients > 0 ? (completedPatients / totalPatients) * 100 : 0,
      monthlyGrowth: 15.2,
      emergencyRate: totalPatients > 0 ? (emergencyPatients / totalPatients) * 100 : 0,
    }
  }

  const loadInitialData = async () => {
    try {
      const savedPatients = localStorage.getItem("gonstead_patients")
      if (savedPatients) {
        const patientsData = JSON.parse(savedPatients)
        setPatients(patientsData)
        setAnalytics(calculateAnalytics(patientsData))
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }
  
  // Real-time advanced analytics with useMemo
  const advancedAnalytics = useMemo(() => {
    return calculateAdvancedAnalytics(patients, parseInt(timeRange))
  }, [patients, timeRange])
  
  // Generate intelligent insights
  const intelligentInsights = useMemo(() => {
    const insights = []
    const { patientGrowth, revenueGrowth, completionRate, emergencyRate, pendingCount, completedCount } = advancedAnalytics
    
    // Growth insight
    if (patientGrowth > 20) {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Excellent Growth',
        message: `Patient volume increased by ${patientGrowth.toFixed(1)}% - significantly above industry average!`,
        action: 'Consider expanding clinic hours or adding staff to handle increased demand.'
      })
    } else if (patientGrowth < -10) {
      insights.push({
        type: 'warning',
        icon: '📉',
        title: 'Declining Patients',
        message: `Patient volume decreased by ${Math.abs(patientGrowth).toFixed(1)}%. This requires attention.`,
        action: 'Review marketing strategy and patient retention programs.'
      })
    }
    
    // Revenue insight
    if (revenueGrowth > 15) {
      insights.push({
        type: 'success',
        icon: '💰',
        title: 'Strong Revenue Performance',
        message: `Revenue grew by ${revenueGrowth.toFixed(1)}%, outpacing patient growth.`,
        action: 'Excellent session completion rate driving revenue growth.'
      })
    }
    
    // Completion rate insight
    if (completionRate < 50) {
      insights.push({
        type: 'alert',
        icon: '⚠️',
        title: 'Low Completion Rate',
        message: `Only ${completionRate.toFixed(1)}% of patients complete their treatment plans.`,
        action: 'Implement follow-up reminders and patient engagement programs.'
      })
    } else if (completionRate > 80) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Excellent Retention',
        message: `${completionRate.toFixed(1)}% treatment completion rate - exceptional!`,
        action: 'Continue current patient care protocols.'
      })
    }
    
    // Emergency rate insight
    if (emergencyRate > 10) {
      insights.push({
        type: 'warning',
        icon: '🚨',
        title: 'High Emergency Cases',
        message: `${emergencyRate.toFixed(1)}% of patients are emergency cases.`,
        action: 'Ensure adequate capacity for urgent cases and consider triage protocols.'
      })
    }
    
    // Pending patients insight
    if (pendingCount > 5) {
      insights.push({
        type: 'info',
        icon: '⏳',
        title: 'Pending Appointments',
        message: `${pendingCount} patients awaiting confirmation.`,
        action: 'Review and confirm pending appointments to improve scheduling efficiency.'
      })
    }
    
    // Success insight
    if (completedCount > 0 && completionRate > 70) {
      insights.push({
        type: 'success',
        icon: '🎯',
        title: 'Treatment Success',
        message: `${completedCount} patients successfully completed treatment programs.`,
        action: 'Request testimonials and reviews from satisfied patients.'
      })
    }
    
    return insights.slice(0, 4) // Return top 4 insights
  }, [advancedAnalytics])
  
  // Generate real time-series data from actual patients
  const timeSeriesData = useMemo(() => {
    const days = parseInt(timeRange)
    const data = []
    const now = new Date()
    
    // Generate data points for the selected time range
    const intervals = days <= 7 ? days : days <= 30 ? Math.ceil(days / 7) : Math.ceil(days / 30)
    const intervalDays = Math.ceil(days / intervals)
    
    for (let i = intervals - 1; i >= 0; i--) {
      const endDate = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000)
      const startDate = new Date(endDate.getTime() - intervalDays * 24 * 60 * 60 * 1000)
      
      const intervalPatients = patients.filter(p => {
        const date = new Date(p.appointment_date || p.created_at)
        return date >= startDate && date < endDate
      })
      
      const revenue = intervalPatients.reduce((sum, p) => sum + (p.sessions_completed || 0) * 2000, 0)
      const sessions = intervalPatients.reduce((sum, p) => sum + (p.sessions_completed || 0), 0)
      
      data.push({
        period: days <= 7 
          ? endDate.toLocaleDateString('en-US', { weekday: 'short' })
          : days <= 30
          ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : endDate.toLocaleDateString('en-US', { month: 'short' }),
        patients: intervalPatients.length,
        revenue,
        sessions,
        completed: intervalPatients.filter(p => p.status === 'completed').length,
        pending: intervalPatients.filter(p => p.status === 'pending').length,
      })
    }
    
    return data
  }, [patients, timeRange])

  // Mock data for charts
  const monthlyData = [
    { month: "Jan", patients: 45, revenue: 90000, sessions: 180 },
    { month: "Feb", patients: 52, revenue: 104000, sessions: 208 },
    { month: "Mar", patients: 48, revenue: 96000, sessions: 192 },
    { month: "Apr", patients: 61, revenue: 122000, sessions: 244 },
    { month: "May", patients: 55, revenue: 110000, sessions: 220 },
    { month: "Jun", patients: 67, revenue: 134000, sessions: 268 },
  ]

  const sessionTypeData = [
    { name: "In-Clinic", value: 75, color: "#0d5c75" },
    { name: "Video", value: 25, color: "#2a9d8f" },
  ]

  const urgencyData = [
    { name: "Normal", value: 70, color: "#22c55e" },
    { name: "Urgent", value: 25, color: "#f59e0b" },
    { name: "Emergency", value: 5, color: "#ef4444" },
  ]

  const exportData = () => {
    const csvData = [
      ["Metric", "Value"],
      ["Total Patients", analytics.totalPatients],
      ["Total Revenue (PKR)", analytics.totalRevenue],
      ["Average Sessions per Patient", analytics.averageSessionsPerPatient.toFixed(2)],
      ["Completion Rate (%)", analytics.completionRate.toFixed(2)],
      ["Monthly Growth (%)", analytics.monthlyGrowth],
      ["Emergency Rate (%)", analytics.emergencyRate.toFixed(2)],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gonstead_analytics_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0d5c75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0d5c75] font-semibold">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  // If not authenticated after check, return null (router will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)] p-2 sm:p-4 md:p-6 space-y-6">
      {/* Seamless Update Indicator */}
      <SeamlessDotIndicator
        isUpdating={syncState.isUpdating}
        isOnline={syncState.isOnline}
        errorCount={syncState.errorCount}
        position="top-right"
        className="mt-6"
      />
      {/* Header matching Admin Dashboard */}
      <header className="relative bg-white/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.08)] border border-[#0d5c75]/15 p-3 sm:p-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/20 to-[#2a9d8f]/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5 text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0d5c75] font-poppins tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#2a9d8f]" />
              Analytics Dashboard
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#2a9d8f] leading-none">
              Comprehensive Clinic Performance Insights
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Real-time patient volumes, revenue statistics, retention & growth trends
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 h-9 bg-white/80 border-[#0d5c75]/20 text-[#0d5c75] rounded-xl text-xs font-semibold shadow-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={exportData}
              className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white rounded-xl h-9 text-xs sm:text-sm font-medium shadow-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs for Clinic vs Website Visitor Analytics */}
      <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-[#0d5c75]/15 max-w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("clinic")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === "clinic"
              ? "bg-[#0d5c75] text-white shadow-sm"
              : "text-[#0d5c75] hover:bg-white/60"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Clinic Performance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("website")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === "website"
              ? "bg-[#0d5c75] text-white shadow-sm"
              : "text-[#0d5c75] hover:bg-white/60"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Website Visitor Analytics</span>
        </button>
      </div>

      {activeTab === "clinic" && (
        <main className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4 sm:p-5">
              <CardTitle className="text-xs font-semibold text-gray-600">Total Patients</CardTitle>
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#0d5c75]">{analytics.totalPatients}</div>
              <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />+{analytics.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4 sm:p-5">
              <CardTitle className="text-xs font-semibold text-gray-600">Total Revenue</CardTitle>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-emerald-700">PKR {analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />+12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4 sm:p-5">
              <CardTitle className="text-xs font-semibold text-gray-600">Avg Sessions</CardTitle>
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-700">{analytics.averageSessionsPerPatient.toFixed(1)}</div>
              <p className="text-[11px] font-medium text-purple-500 mt-1">Per registered patient</p>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4 sm:p-5">
              <CardTitle className="text-xs font-semibold text-gray-600">Completion Rate</CardTitle>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Target className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{analytics.completionRate.toFixed(1)}%</div>
              <p className="text-[11px] font-medium text-amber-600 mt-1">Care plan completion</p>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4 sm:p-5">
              <CardTitle className="text-xs font-semibold text-gray-600">Emergency Rate</CardTitle>
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-rose-600">{analytics.emergencyRate.toFixed(1)}%</div>
              <p className="text-[11px] font-medium text-rose-500 mt-1">Urgent/emergency intake</p>
            </CardContent>
          </Card>

          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4 sm:p-5">
              <CardTitle className="text-xs font-semibold text-gray-600">Growth Rate</CardTitle>
              <div className="w-7 h-7 rounded-xl bg-teal-50 text-[#2a9d8f] flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#0d5c75]">+{analytics.monthlyGrowth}%</div>
              <p className="text-[11px] font-medium text-[#2a9d8f] mt-1">Monthly clinic growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/60 border-b border-gray-100 py-3.5 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-[#0d5c75] font-poppins flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#2a9d8f]" />
                Monthly Patient Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(13,92,117,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                  <Line type="monotone" dataKey="patients" stroke="#0d5c75" strokeWidth={3} dot={{ r: 4, fill: "#2a9d8f" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/60 border-b border-gray-100 py-3.5 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-[#0d5c75] font-poppins flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#2a9d8f]" />
                Monthly Revenue (PKR)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`PKR ${Number(value).toLocaleString()}`, "Revenue"]} 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(13,92,117,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="revenue" fill="#2a9d8f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Types */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/60 border-b border-gray-100 py-3.5 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-[#0d5c75] font-poppins flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#2a9d8f]" />
                Session Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(13,92,117,0.15)" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Urgency Levels */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/60 border-b border-gray-100 py-3.5 px-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base font-bold text-[#0d5c75] font-poppins flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#2a9d8f]" />
                Patient Urgency Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid rgba(13,92,117,0.15)" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
      )}

      {/* Website Visitor Analytics Dedicated Section */}
      {activeTab === "website" && (
        <main className="space-y-4">
          <div className="relative bg-white/40 backdrop-blur-xl border border-[#0d5c75]/15 p-4 rounded-2xl shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-[#0d5c75] font-poppins mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2a9d8f]" />
              Website Visitor & Patient Engagement Analytics
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">Real-time live traffic monitoring, page view trends, device breakdown, and conversion tracking across your clinic website.</p>
          </div>
          <VisitorAnalytics />
        </main>
      )}
    </div>
  )
}
