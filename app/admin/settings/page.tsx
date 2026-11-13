"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, MapPin, Clock, Bell, Palette, Save, ArrowLeft, List, Shield, Key, Eye, EyeOff, Copy, ExternalLink, SlidersHorizontal, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettings() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [clinicSettings, setClinicSettings] = useState({
    clinicName: "Gonstead Chiropractic Clinic - Dr. Bashir",
    address: "Near Peshawar Model School, Tehsil Road, Nowshera, Pakistan",
    phone: "+92 304 6996267",
    whatsapp: "+92 304 6996267",
    email: "Bashirahmad123.org@gmail.com",
    emergencyPhone: "+92 304 6996267",
    city: "Nowshera",
    state: "Khyber Pakhtunkhwa",
    country: "Pakistan",
    postalCode: "24110",
    website: "https://gonsteadchiropractic.vercel.app",
    coordinates: { lat: 34.01533, lng: 71.97788 },
    mapUrl: "https://maps.app.goo.gl/8pJ9o2hCPtGY3XtD9",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.4614046736474!2d71.97788!3d34.01533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d917b90f9b6ce9%3A0x93c2e9e4a56d3a0d!2sGonstead%20Chiropractic%20Clinic%20-%20Dr.%20Bashir!5e0!3m2!1sen!2s!4v1717687854793!5m2!1sen!2s",
  })

  const [operatingHours, setOperatingHours] = useState({
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "15:00", closed: false },
    sunday: { open: "10:00", close: "14:00", closed: true },
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    emergencyAlerts: true,
    dailyReports: false,
  })

  const [appearance, setAppearance] = useState({
    theme: "light",
    primaryColor: "#0d5c75",
    secondaryColor: "#2a9d8f",
    accentColor: "#2a9d8f",
  })

  // Pagination Settings State
  const [paginationSettings, setPaginationSettings] = useState({
    recordsPerPage: 150,
    enablePagination: true,
    showPageNumbers: true,
    showRecordCount: true,
    showJumpToPage: true,
    maxVisiblePages: 5,
    paginationStyle: "professional",
    autoRefresh: false,
    autoRefreshInterval: 30
  })

  // Staff Credentials State
  const [staffCredentials, setStaffCredentials] = useState({
    username: 'staff',
    password: '',
    confirmPassword: '',
    lastUpdated: '',
    updatedBy: ''
  })
  const [showStaffPassword, setShowStaffPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Combined auth and settings loader to prevent race conditions and flashing
  useEffect(() => {
    const checkAuthAndLoadSettings = () => {
      // Check admin authentication
      const isAuth = localStorage.getItem("admin_authenticated") === "true"
      
      if (!isAuth) {
        setIsAuthenticated(false)
        setAuthChecked(true)
        router.replace("/admin/auth")
        return
      }

      setIsAuthenticated(true)
      setAuthChecked(true)

      // Load saved settings
      const savedClinicSettings = localStorage.getItem("clinic_settings")
      const savedOperatingHours = localStorage.getItem("operating_hours")
      const savedNotifications = localStorage.getItem("notification_settings")
      const savedAppearance = localStorage.getItem("appearance_settings")
      const savedPagination = localStorage.getItem("patient_tracking_pagination_settings")
      const savedStaffCredentials = localStorage.getItem("staff_credentials")

      if (savedClinicSettings) {
        try {
          setClinicSettings(JSON.parse(savedClinicSettings))
        } catch (e) {
          console.error("Failed to parse clinic settings", e)
        }
      }
      if (savedOperatingHours) {
        try {
          setOperatingHours(JSON.parse(savedOperatingHours))
        } catch (e) {
          console.error("Failed to parse operating hours", e)
        }
      }
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications))
        } catch (e) {
          console.error("Failed to parse notification settings", e)
        }
      }
      if (savedAppearance) {
        try {
          setAppearance(JSON.parse(savedAppearance))
        } catch (e) {
          console.error("Failed to parse appearance settings", e)
        }
      }
      if (savedPagination) {
        try {
          setPaginationSettings(JSON.parse(savedPagination))
        } catch (e) {
          console.error("Failed to parse pagination settings", e)
        }
      }
      if (savedStaffCredentials) {
        try {
          const creds = JSON.parse(savedStaffCredentials)
          setStaffCredentials(prev => ({
            ...prev,
            username: creds.username || 'staff',
            lastUpdated: creds.lastUpdated || '',
            updatedBy: creds.updatedBy || 'System'
          }))
        } catch (e) {
          console.error("Failed to parse staff credentials", e)
        }
      }
    }

    checkAuthAndLoadSettings()
  }, [router])

  const saveSettings = () => {
    try {
      localStorage.setItem("clinic_settings", JSON.stringify(clinicSettings))
      localStorage.setItem("operating_hours", JSON.stringify(operatingHours))
      localStorage.setItem("notification_settings", JSON.stringify(notifications))
      localStorage.setItem("appearance_settings", JSON.stringify(appearance))
      localStorage.setItem("patient_tracking_pagination_settings", JSON.stringify(paginationSettings))

      toast({
        title: "Settings Saved",
        description: "Clinic configuration and preferences updated successfully.",
      })
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save settings to browser storage.",
        variant: "destructive"
      })
    }
  }

  const updateOperatingHours = (day: string, field: "open" | "close" | "closed", value: any) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[rgb(220,230,229)] flex items-center justify-center p-4">
        <div className="text-center bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-[#0d5c75]/15 shadow-md">
          <div className="w-8 h-8 border-3 border-[#0d5c75]/20 border-t-[#0d5c75] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#0d5c75] font-semibold text-sm">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)] p-2 sm:p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Unified Glass Style Matching Dashboard */}
        <div className="relative bg-white/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.08)] border border-[#0d5c75]/15 p-3 sm:p-4 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/20 to-[#2a9d8f]/5 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-0.5 text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0d5c75] font-poppins tracking-tight">
                Admin Settings
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#2a9d8f] leading-none">
                Configure clinic profile, operating schedule & security preferences
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                Clinic profile, GPS maps, business hours, notifications & system options
              </p>
            </div>

            <Button
              onClick={saveSettings}
              className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white shadow-md rounded-xl h-10 px-5 text-sm font-semibold flex items-center gap-2 self-end md:self-auto"
            >
              <Save className="h-4 w-4" />
              Save All Settings
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Clinic Information */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <Settings className="h-5 w-5 text-[#2a9d8f]" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <Label htmlFor="clinicName" className="text-xs font-semibold text-slate-700">Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={clinicSettings.clinicName}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, clinicName: e.target.value }))}
                  className="rounded-xl mt-1 border-slate-200 focus:border-[#0d5c75]"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-xs font-semibold text-slate-700">Address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={clinicSettings.address}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, address: e.target.value }))}
                  className="rounded-xl mt-1 border-slate-200 focus:border-[#0d5c75]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">Phone</Label>
                  <Input
                    id="phone"
                    value={clinicSettings.phone}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, phone: e.target.value }))}
                    className="rounded-xl mt-1 border-slate-200 focus:border-[#0d5c75]"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinicSettings.email}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, email: e.target.value }))}
                    className="rounded-xl mt-1 border-slate-200 focus:border-[#0d5c75]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website" className="text-xs font-semibold text-slate-700">Website URL</Label>
                <Input
                  id="website"
                  value={clinicSettings.website}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, website: e.target.value }))}
                  className="rounded-xl mt-1 border-slate-200 focus:border-[#0d5c75]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Clinic Location & Google Maps */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <MapPin className="h-5 w-5 text-[#2a9d8f]" />
                Location & Google Maps
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(clinicSettings.mapUrl, "_blank")}
                className="border-[#0d5c75]/20 text-[#0d5c75] hover:bg-[#0d5c75]/10 text-xs rounded-xl h-8 px-2.5"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Preview Maps
              </Button>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-700">City</Label>
                  <Input
                    id="city"
                    value={clinicSettings.city}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, city: e.target.value }))}
                    className="rounded-xl mt-1 border-slate-200"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-xs font-semibold text-slate-700">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={clinicSettings.postalCode}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, postalCode: e.target.value }))}
                    className="rounded-xl mt-1 border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat" className="text-xs font-semibold text-slate-700">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={clinicSettings.coordinates.lat}
                    onChange={(e) =>
                      setClinicSettings((prev) => ({
                        ...prev,
                        coordinates: { ...prev.coordinates, lat: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="rounded-xl mt-1 border-slate-200"
                  />
                </div>
                <div>
                  <Label htmlFor="lng" className="text-xs font-semibold text-slate-700">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={clinicSettings.coordinates.lng}
                    onChange={(e) =>
                      setClinicSettings((prev) => ({
                        ...prev,
                        coordinates: { ...prev.coordinates, lng: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="rounded-xl mt-1 border-slate-200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mapUrl" className="text-xs font-semibold text-slate-700">Google Maps Share Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="mapUrl"
                    value={clinicSettings.mapUrl}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, mapUrl: e.target.value }))}
                    className="rounded-xl border-slate-200 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(clinicSettings.mapUrl)
                      toast({ title: "Copied Link", description: "Google Maps URL copied to clipboard" })
                    }}
                    className="border-[#0d5c75]/20 text-[#0d5c75] hover:bg-[#0d5c75]/10 rounded-xl"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-teal-50/70 border border-teal-200/60 p-3.5 rounded-xl">
                <p className="text-[11px] font-bold text-[#0d5c75] uppercase tracking-wider mb-0.5">Active Clinic Coordinates</p>
                <p className="text-xs text-slate-700 font-medium">{clinicSettings.address}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  GPS: {clinicSettings.coordinates.lat}, {clinicSettings.coordinates.lng} ({clinicSettings.city}, {clinicSettings.country})
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Operating Hours */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <Clock className="h-5 w-5 text-[#2a9d8f]" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-3">
              {Object.entries(operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-24 text-sm font-semibold capitalize text-slate-700">{day}</div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => updateOperatingHours(day, "closed", !checked)}
                    />
                    {!hours.closed ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOperatingHours(day, "open", e.target.value)}
                          className="w-28 h-9 text-xs rounded-lg border-slate-200"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOperatingHours(day, "close", e.target.value)}
                          className="w-28 h-9 text-xs rounded-lg border-slate-200"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 4. Notification Settings */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <Bell className="h-5 w-5 text-[#2a9d8f]" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="pr-4">
                    <Label className="text-sm font-semibold text-slate-800">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {key === "emailNotifications" && "Receive notifications via email"}
                      {key === "smsNotifications" && "Receive notifications via SMS"}
                      {key === "appointmentReminders" && "Send appointment reminders to patients"}
                      {key === "emergencyAlerts" && "Receive alerts for emergency appointments"}
                      {key === "dailyReports" && "Receive daily summary reports"}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 5. Appearance & Branding */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden lg:col-span-2">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <Palette className="h-5 w-5 text-[#2a9d8f]" />
                Appearance & Brand Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme" className="text-xs font-semibold text-slate-700">Theme Mode</Label>
                    <Select
                      value={appearance.theme}
                      onValueChange={(value) => setAppearance((prev) => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger className="rounded-xl mt-1 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light Mode (Official Clinic Theme)</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                        <SelectItem value="auto">System Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="primaryColor" className="text-xs font-semibold text-slate-700">Primary Color (Deep Teal)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={appearance.primaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-14 h-10 p-1 rounded-xl cursor-pointer"
                      />
                      <Input
                        value={appearance.primaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor" className="text-xs font-semibold text-slate-700">Secondary Color (Mint Teal)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={appearance.secondaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-14 h-10 p-1 rounded-xl cursor-pointer"
                      />
                      <Input
                        value={appearance.secondaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Live Color Palette Preview</h4>
                    <div className="space-y-2.5">
                      <div
                        className="h-10 rounded-xl flex items-center px-4 text-white text-xs font-semibold shadow-sm"
                        style={{ backgroundColor: appearance.primaryColor }}
                      >
                        Primary Color: {appearance.primaryColor}
                      </div>
                      <div
                        className="h-10 rounded-xl flex items-center px-4 text-white text-xs font-semibold shadow-sm"
                        style={{ backgroundColor: appearance.secondaryColor }}
                      >
                        Secondary Color: {appearance.secondaryColor}
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                        Default Gonstead palette: Deep Teal (<span className="font-mono font-bold text-[#0d5c75]">#0d5c75</span>) and Mint Teal (<span className="font-mono font-bold text-[#2a9d8f]">#2a9d8f</span>).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Patient Records Management & Pagination */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden lg:col-span-2">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <List className="h-5 w-5 text-[#2a9d8f]" />
                Patient Records Management & Pagination
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recordsPerPage" className="text-xs font-semibold text-[#0d5c75]">Records Per Page</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="recordsPerPage"
                        type="number"
                        min="10"
                        max="1000"
                        value={paginationSettings.recordsPerPage}
                        onChange={(e) => setPaginationSettings((prev) => ({ ...prev, recordsPerPage: parseInt(e.target.value) || 150 }))}
                        className="w-24 rounded-xl border-slate-200"
                      />
                      <span className="text-xs text-slate-600">patients per page</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Set to 150 for your preferred limit, or adjust as needed</p>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                    <div>
                      <Label className="text-xs font-semibold text-[#0d5c75]">Enable Pagination</Label>
                      <p className="text-[11px] text-slate-400">Turn off for unlimited scrolling (not recommended for large datasets)</p>
                    </div>
                    <Switch
                      checked={paginationSettings.enablePagination}
                      onCheckedChange={(checked) => setPaginationSettings((prev) => ({ ...prev, enablePagination: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                    <div>
                      <Label className="text-xs font-semibold text-[#0d5c75]">Show Page Numbers</Label>
                      <p className="text-[11px] text-slate-400">Display clickable page numbers in navigation</p>
                    </div>
                    <Switch
                      checked={paginationSettings.showPageNumbers}
                      onCheckedChange={(checked) => setPaginationSettings((prev) => ({ ...prev, showPageNumbers: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                    <div>
                      <Label className="text-xs font-semibold text-[#0d5c75]">Show Record Count</Label>
                      <p className="text-[11px] text-slate-400">Display &ldquo;Showing X of Y records&rdquo; indicator</p>
                    </div>
                    <Switch
                      checked={paginationSettings.showRecordCount}
                      onCheckedChange={(checked) => setPaginationSettings((prev) => ({ ...prev, showRecordCount: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxVisiblePages" className="text-xs font-semibold text-[#0d5c75]">Max Visible Page Numbers</Label>
                    <Select
                      value={paginationSettings.maxVisiblePages.toString()}
                      onValueChange={(value) => setPaginationSettings((prev) => ({ ...prev, maxVisiblePages: parseInt(value) }))}
                    >
                      <SelectTrigger className="rounded-xl mt-1 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 pages</SelectItem>
                        <SelectItem value="5">5 pages</SelectItem>
                        <SelectItem value="7">7 pages</SelectItem>
                        <SelectItem value="10">10 pages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paginationStyle" className="text-xs font-semibold text-[#0d5c75]">Pagination Style</Label>
                    <Select
                      value={paginationSettings.paginationStyle}
                      onValueChange={(value) => setPaginationSettings((prev) => ({ ...prev, paginationStyle: value }))}
                    >
                      <SelectTrigger className="rounded-xl mt-1 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-teal-50/70 border border-teal-200/60 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-[#0d5c75] uppercase tracking-wider mb-2">Smart Pagination Features</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Automatic page generation when limit is exceeded</li>
                      <li>• Intelligent memory management for large datasets</li>
                      <li>• Quick navigation with keyboard shortcuts</li>
                      <li>• Real-time search across all patient records</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7. Staff Credentials & Security */}
          <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden lg:col-span-2">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                <Shield className="h-5 w-5 text-[#2a9d8f]" />
                Staff Portal Access & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-teal-50/80 p-3.5 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 text-[#0d5c75]" />
                      <h4 className="text-xs font-bold text-[#0d5c75]">Security Notice</h4>
                    </div>
                    <p className="text-xs text-slate-700">
                      Changing staff credentials will update staff portal login details for all staff users.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="staffUsername" className="text-xs font-semibold text-[#0d5c75]">Staff Username</Label>
                    <Input
                      id="staffUsername"
                      value={staffCredentials.username}
                      onChange={(e) => setStaffCredentials(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter staff username"
                      className="rounded-xl mt-1 border-slate-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="staffPassword" className="text-xs font-semibold text-[#0d5c75]">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="staffPassword"
                        type={showStaffPassword ? "text" : "password"}
                        value={staffCredentials.password}
                        onChange={(e) => setStaffCredentials(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter new password"
                        className="rounded-xl border-slate-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmStaffPassword" className="text-xs font-semibold text-[#0d5c75]">Confirm Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmStaffPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={staffCredentials.confirmPassword}
                        onChange={(e) => setStaffCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="rounded-xl border-slate-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {staffCredentials.password && staffCredentials.confirmPassword && 
                     staffCredentials.password !== staffCredentials.confirmPassword && (
                      <p className="text-xs text-rose-600 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <h4 className="text-xs font-bold text-[#0d5c75] uppercase tracking-wider mb-2">Current Staff Access Info</h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p><span className="font-semibold text-slate-800">Username:</span> {staffCredentials.username || 'staff'}</p>
                      <p><span className="font-semibold text-slate-800">Last Updated:</span> {staffCredentials.lastUpdated ? new Date(staffCredentials.lastUpdated).toLocaleString() : 'Never'}</p>
                      <p><span className="font-semibold text-slate-800">Updated By:</span> {staffCredentials.updatedBy || 'System'}</p>
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
                      if (!staffCredentials.username.trim()) {
                        toast({ title: "Error", description: "Username cannot be empty", variant: "destructive" })
                        return
                      }
                      if (staffCredentials.password && staffCredentials.password !== staffCredentials.confirmPassword) {
                        toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
                        return
                      }

                      const currentCredentials = JSON.parse(localStorage.getItem('staff_credentials') || '{}')
                      const newCredentials = {
                        username: staffCredentials.username,
                        password: staffCredentials.password || currentCredentials.password || 'staff123',
                        lastUpdated: new Date().toISOString(),
                        updatedBy: 'admin'
                      }
                      
                      localStorage.setItem('staff_credentials', JSON.stringify(newCredentials))
                      
                      setStaffCredentials(prev => ({
                        ...prev,
                        password: '',
                        confirmPassword: '',
                        lastUpdated: newCredentials.lastUpdated,
                        updatedBy: newCredentials.updatedBy
                      }))
                      
                      toast({
                        title: "✅ Staff Credentials Updated",
                        description: "Staff portal login credentials have been updated successfully.",
                      })
                    }}
                    className="w-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white rounded-xl shadow-md h-10 text-xs sm:text-sm font-semibold"
                    disabled={!staffCredentials.username.trim()}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Update Staff Credentials
                  </Button>

                  <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200/60">
                    <h4 className="text-xs font-bold text-[#0d5c75] uppercase tracking-wider mb-2">Staff Portal Features</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Read-only access to patient data</li>
                      <li>• Real-time patient information updates</li>
                      <li>• Secure session authentication</li>
                      <li>• Dedicated staff workspace</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
