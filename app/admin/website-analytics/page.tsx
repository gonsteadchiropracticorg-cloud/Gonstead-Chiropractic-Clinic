"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  Users, 
  Clock, 
  MousePointer, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  FileText
} from "lucide-react"
import { LineChart as RechartsLineChart, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, Pie } from 'recharts'

interface AnalyticsData {
  activeVisitors: number
  totalPageViews: number
  uniqueVisitors: number
  avgSessionDuration: number
  bounceRate: number
  topPages: Array<{ page: string; views: number }>
  trafficSources: Array<{ source: string; visitors: number }>
  deviceStats: Array<{ type: string; count: number; percentage: number }>
  browserStats: Array<{ browser: string; count: number; percentage: number }>
  hourlyData: Array<{ hour: number; time: string; pageViews: number; uniqueVisitors: number }>
  recentActivity: Array<{ timestamp: string; page: string; title: string; referrer: string; device: any; visitorId: string }>
  totalSessions: number
  newVisitors: number
  returningVisitors: number
}

export default function WebsiteAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('24h')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/stats?timeframe=${timeframe}`)
      const data = await response.json()
      setAnalyticsData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize and set up real-time updates
  useEffect(() => {
    fetchAnalytics()
    
    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(fetchAnalytics, 30000)
    
    return () => clearInterval(interval)
  }, [timeframe])

  // Colors for charts
  const chartColors = ['#0d5c75', '#2a9d8f', '#e76f51', '#f4a261', '#e9c46a', '#264653']

  // Export functionality
  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeframe=${timeframe}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `website-analytics-${timeframe}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-[#FEFCF8] p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-[#0d5c75]" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-[#FEFCF8] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0d5c75] font-poppins flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Website Visitor Analytics
              <Badge variant="secondary" className="bg-green-100 text-green-700 px-2 py-1">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </h1>
            <p className="text-gray-600 mt-2 font-open-sans">
              Real-time website performance and visitor tracking dashboard
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={fetchAnalytics}
              disabled={loading}
              className="bg-[#0d5c75] hover:bg-[#0d5c75]/90"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Visitors</CardTitle>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-[#0d5c75]">
                {analyticsData?.activeVisitors || 0}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Live
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently browsing</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Page Views</CardTitle>
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-[#0d5c75]">
                {analyticsData?.totalPageViews?.toLocaleString() || 0}
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">In selected timeframe</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Unique Visitors</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-[#0d5c75]">
                {analyticsData?.uniqueVisitors || 0}
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Individual users</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Session</CardTitle>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-[#0d5c75]">
                {Math.floor((analyticsData?.avgSessionDuration || 0) / 60)}:{((analyticsData?.avgSessionDuration || 0) % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minutes:seconds</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#0d5c75]">
                {analyticsData?.bounceRate?.toFixed(1) || 0}%
              </span>
              <div className={`flex items-center gap-1 ${(analyticsData?.bounceRate || 0) < 50 ? 'text-green-500' : 'text-red-500'}`}>
                {(analyticsData?.bounceRate || 0) < 50 ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {(analyticsData?.bounceRate || 0) < 50 ? 'Good' : 'High'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              New vs Returning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Visitors</span>
                <span className="font-semibold">{analyticsData?.newVisitors || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Returning</span>
                <span className="font-semibold">{analyticsData?.returningVisitors || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-[#0d5c75]">
              {analyticsData?.totalSessions || 0}
            </span>
            <p className="text-xs text-gray-500 mt-1">User sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Traffic
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Page Views Trend */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Page Views Trend
                </CardTitle>
                <CardDescription>Hourly breakdown of page views and unique visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analyticsData?.hourlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#666"
                        fontSize={12}
                        tickFormatter={(hour) => `${hour}:00`}
                      />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(hour) => `${hour}:00`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pageViews" 
                        stroke="#0d5c75" 
                        strokeWidth={3}
                        name="Page Views"
                        dot={{ fill: '#0d5c75', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uniqueVisitors" 
                        stroke="#2a9d8f" 
                        strokeWidth={3}
                        name="Unique Visitors"
                        dot={{ fill: '#2a9d8f', strokeWidth: 2, r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Traffic Sources
                </CardTitle>
                <CardDescription>Where your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData?.trafficSources || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="visitors"
                        nameKey="source"
                      >
                        {(analyticsData?.trafficSources || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources List */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Traffic Sources Breakdown</CardTitle>
                <CardDescription>Detailed visitor sources with metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analyticsData?.trafficSources || []).map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{source.visitors} visitors</span>
                        <Badge variant="outline">
                          {analyticsData && analyticsData.uniqueVisitors > 0 
                            ? ((source.visitors / analyticsData.uniqueVisitors) * 100).toFixed(1)
                            : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!analyticsData?.trafficSources || analyticsData.trafficSources.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No traffic data available yet</p>
                      <p className="text-sm">Data will appear as visitors browse your website</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visitor Flow */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most viewed pages on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analyticsData?.topPages || []).slice(0, 8).map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white bg-[#0d5c75] rounded-full w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium text-sm truncate max-w-40">{page.page}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{page.views}</span>
                        <span className="text-xs text-gray-500">views</span>
                      </div>
                    </div>
                  ))}
                  {(!analyticsData?.topPages || analyticsData.topPages.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No page data available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Types */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device Types
                </CardTitle>
                <CardDescription>Breakdown of visitor devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analyticsData?.deviceStats || []).map((device, index) => {
                    const icons = {
                      desktop: Monitor,
                      mobile: Smartphone,
                      tablet: Tablet
                    }
                    const Icon = icons[device.type as keyof typeof icons] || Monitor

                    return (
                      <div key={device.type} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0d5c75]/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-[#0d5c75]" />
                          </div>
                          <div>
                            <span className="font-medium capitalize">{device.type}</span>
                            <p className="text-xs text-gray-500">{device.count} visitors</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-semibold">
                          {device.percentage}%
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Browser Statistics */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
                <CardDescription>Visitor browser preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analyticsData?.browserStats || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#666" fontSize={12} />
                      <YAxis dataKey="browser" type="category" stroke="#666" fontSize={12} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="count" fill="#0d5c75" radius={[0, 4, 4, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Page Performance Analytics</CardTitle>
              <CardDescription>Detailed breakdown of page visits and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-semibold text-gray-600">Page</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-600">Views</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-600">% of Total</th>
                      <th className="text-right p-3 text-sm font-semibold text-gray-600">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData?.topPages || []).map((page, index) => (
                      <tr key={page.page} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white bg-[#0d5c75] rounded-full w-5 h-5 flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-medium">{page.page}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold">{page.views.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <Badge variant="outline">
                            {analyticsData && analyticsData.totalPageViews > 0 
                              ? ((page.views / analyticsData.totalPageViews) * 100).toFixed(1)
                              : 0}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <TrendingUp className="h-4 w-4 text-green-500 inline" />
                        </td>
                      </tr>
                    ))}
                    {(!analyticsData?.topPages || analyticsData.topPages.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No page data available yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Activity Feed */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Live Activity Feed
                    </CardTitle>
                    <CardDescription>Real-time visitor activity on your website</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">LIVE</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(analyticsData?.recentActivity || []).slice(0, 20).map((activity, index) => (
                    <div key={`${activity.visitorId}-${activity.timestamp}`} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.page}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                          <span>•</span>
                          <span>{activity.device?.type || 'Unknown'} {activity.device?.browser || ''}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.referrer || 'Direct'}
                      </Badge>
                    </div>
                  ))}
                  {(!analyticsData?.recentActivity || analyticsData.recentActivity.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Activity will appear here as visitors browse your website</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Metrics */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Live Metrics Dashboard</CardTitle>
                <CardDescription>Current website performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <div className="text-2xl font-bold text-green-700 mb-1">
                      {analyticsData?.activeVisitors || 0}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Active Now</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700 mb-1">
                      {analyticsData?.totalPageViews || 0}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Total Views</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium">Session Duration</span>
                    <span className="font-bold text-[#0d5c75]">
                      {Math.floor((analyticsData?.avgSessionDuration || 0) / 60)}m {((analyticsData?.avgSessionDuration || 0) % 60).toFixed(0)}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <span className={`font-bold ${(analyticsData?.bounceRate || 0) < 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {analyticsData?.bounceRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium">Total Sessions</span>
                    <span className="font-bold text-[#0d5c75]">{analyticsData?.totalSessions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Additional tabs content would continue here... */}
      </Tabs>

      {/* Export and Actions */}
      <Card className="bg-white shadow-lg border-0 mt-8">
        <CardHeader>
          <CardTitle>Data Export & Management</CardTitle>
          <CardDescription>Export your analytics data for further analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => exportData('csv')} className="bg-[#0d5c75] hover:bg-[#0d5c75]/90">
              <Download className="h-4 w-4 mr-2" />
              Export CSV Report
            </Button>
            <Button onClick={() => exportData('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF Report
            </Button>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
