"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "recharts"
import { TrendingUp, Users, DollarSign, Download, ArrowLeft, Activity, Target, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, getPatients } from "@/lib/supabase"
import Image from "next/image"
import VisitorAnalytics from "@/components/visitor-analytics"

export default function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(true)
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

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { user } = await getCurrentUser()
      const adminEmails = [
        "bashirahmad123.org@gmail.com",
        "Bashirahmad123.org@gmail.com",
        "admin@gonsteadchiropractic.com",
        "dr.bashir@gonsteadchiropractic.com",
      ]

      if (!user || !adminEmails.includes(user.email?.toLowerCase() || "")) {
        router.push("/admin/auth")
        return
      }

      await loadAnalyticsData()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/admin/auth")
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      const { data, error } = await getPatients()
      if (error) throw error

      const patientsData = data || []
      setPatients(patientsData)

      // Calculate analytics
      const totalPatients = patientsData.length
      const totalSessions = patientsData.reduce((sum, p) => sum + (p.sessions_completed || 0), 0)
      const completedPatients = patientsData.filter((p) => p.status === "completed").length
      const emergencyPatients = patientsData.filter((p) => p.urgency === "emergency").length

      setAnalytics({
        totalPatients,
        totalRevenue: totalSessions * 2000, // Assuming 2000 PKR per session
        averageSessionsPerPatient: totalPatients > 0 ? totalSessions / totalPatients : 0,
        completionRate: totalPatients > 0 ? (completedPatients / totalPatients) * 100 : 0,
        monthlyGrowth: 15.2, // Mock data
        emergencyRate: totalPatients > 0 ? (emergencyPatients / totalPatients) * 100 : 0,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    }
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0d5c75] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#0d5c75] font-semibold">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-[#0d5c75] p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="border-[#0d5c75] text-[#0d5c75] hover:bg-[#0d5c75] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="w-12 h-12 relative">
              <Image
                src="/images/gonstead-chiropractic-logo.png"
                alt="Gonstead Chiropractic Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0d5c75] font-poppins">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Comprehensive clinic performance insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportData} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="border-[#0d5c75]/20 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#0d5c75]">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-[#0d5c75]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0d5c75]">{analytics.totalPatients}</div>
              <p className="text-xs text-blue-600 mt-1">+{analytics.monthlyGrowth}% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">PKR {analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-green-500 mt-1">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Avg Sessions</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{analytics.averageSessionsPerPatient.toFixed(1)}</div>
              <p className="text-xs text-purple-500 mt-1">Per patient</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analytics.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-orange-500 mt-1">Treatment completion</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Emergency Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.emergencyRate.toFixed(1)}%</div>
              <p className="text-xs text-red-500 mt-1">Emergency cases</p>
            </CardContent>
          </Card>

          <Card className="border-[#f3a800]/20 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#f3a800]">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#f3a800]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f3a800]">+{analytics.monthlyGrowth}%</div>
              <p className="text-xs text-yellow-600 mt-1">Monthly growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader>
              <CardTitle className="text-[#0d5c75] font-poppins">Monthly Patient Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="patients" stroke="#0d5c75" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader>
              <CardTitle className="text-[#0d5c75] font-poppins">Monthly Revenue (PKR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`PKR ${value.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#2a9d8f" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Session Types */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader>
              <CardTitle className="text-[#0d5c75] font-poppins">Session Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Urgency Levels */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader>
              <CardTitle className="text-[#0d5c75] font-poppins">Patient Urgency Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Analytics Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0d5c75] font-poppins mb-2">Website Visitor Analytics</h2>
            <p className="text-gray-600">Track website performance and visitor engagement metrics</p>
          </div>
          <VisitorAnalytics />
        </div>
      </main>
    </div>
  )
}
