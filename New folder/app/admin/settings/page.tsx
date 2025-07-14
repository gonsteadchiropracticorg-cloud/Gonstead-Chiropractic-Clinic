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
import { Settings, MapPin, Clock, Bell, Palette, Save, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/supabase"
import Image from "next/image"

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [clinicSettings, setClinicSettings] = useState({
    clinicName: "Gonstead Chiropractic Clinic",
    address: "Near Police Station, Tehsil Road, Nowshera",
    phone: "+92 304 699 6267",
    email: "info@gonsteadchiropractic.com",
    website: "https://gonsteadchiropractic.vercel.app",
    coordinates: { lat: 34.0153, lng: 71.9804 },
    mapUrl: "https://maps.app.goo.gl/8pJ9o2hCPtGY3XtD9",
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
    accentColor: "#f3a800",
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndLoadSettings()
  }, [])

  const checkAuthAndLoadSettings = async () => {
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

      // Load settings from localStorage or API
      loadSettings()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/admin/auth")
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = () => {
    // Load settings from localStorage
    const savedClinicSettings = localStorage.getItem("clinic_settings")
    const savedOperatingHours = localStorage.getItem("operating_hours")
    const savedNotifications = localStorage.getItem("notification_settings")
    const savedAppearance = localStorage.getItem("appearance_settings")

    if (savedClinicSettings) {
      setClinicSettings(JSON.parse(savedClinicSettings))
    }
    if (savedOperatingHours) {
      setOperatingHours(JSON.parse(savedOperatingHours))
    }
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedAppearance) {
      setAppearance(JSON.parse(savedAppearance))
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem("clinic_settings", JSON.stringify(clinicSettings))
      localStorage.setItem("operating_hours", JSON.stringify(operatingHours))
      localStorage.setItem("notification_settings", JSON.stringify(notifications))
      localStorage.setItem("appearance_settings", JSON.stringify(appearance))

      toast({
        title: "Settings Saved",
        description: "All settings have been saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const updateOperatingHours = (day: string, field: string, value: string | boolean) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0d5c75] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#0d5c75] font-semibold">Loading Settings...</p>
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
              <h1 className="text-2xl font-bold text-[#0d5c75] font-poppins">Admin Settings</h1>
              <p className="text-sm text-gray-600">Configure clinic settings and preferences</p>
            </div>
          </div>
          <Button onClick={saveSettings} className="bg-[#0d5c75] hover:bg-[#0a4a5c] text-white">
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Clinic Information */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={clinicSettings.clinicName}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, clinicName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={clinicSettings.address}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={clinicSettings.phone}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinicSettings.email}
                    onChange={(e) => setClinicSettings((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={clinicSettings.website}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader className="bg-gradient-to-r from-[#f3a800] to-[#e67e22] text-white">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Maps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={clinicSettings.coordinates.lat}
                    onChange={(e) =>
                      setClinicSettings((prev) => ({
                        ...prev,
                        coordinates: { ...prev.coordinates, lat: Number.parseFloat(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={clinicSettings.coordinates.lng}
                    onChange={(e) =>
                      setClinicSettings((prev) => ({
                        ...prev,
                        coordinates: { ...prev.coordinates, lng: Number.parseFloat(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mapUrl">Google Maps URL</Label>
                <Input
                  id="mapUrl"
                  value={clinicSettings.mapUrl}
                  onChange={(e) => setClinicSettings((prev) => ({ ...prev, mapUrl: e.target.value }))}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Current Location:</p>
                <p className="text-sm font-medium">{clinicSettings.address}</p>
                <p className="text-xs text-gray-500">
                  Coordinates: {clinicSettings.coordinates.lat}, {clinicSettings.coordinates.lng}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {Object.entries(operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium capitalize">{day}</div>
                  <Switch
                    checked={!hours.closed}
                    onCheckedChange={(checked) => updateOperatingHours(day, "closed", !checked)}
                  />
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateOperatingHours(day, "open", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateOperatingHours(day, "close", e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                  {hours.closed && <span className="text-sm text-gray-500 italic">Closed</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-[#0d5c75]/20">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                    <p className="text-xs text-gray-500">
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

          {/* Appearance Settings */}
          <Card className="border-[#0d5c75]/20 lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={appearance.theme}
                      onValueChange={(value) => setAppearance((prev) => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={appearance.primaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={appearance.primaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={appearance.secondaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={appearance.secondaryColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={appearance.accentColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, accentColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={appearance.accentColor}
                        onChange={(e) => setAppearance((prev) => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">Color Preview</h4>
                    <div className="space-y-2">
                      <div
                        className="h-8 rounded flex items-center px-3 text-white text-sm"
                        style={{ backgroundColor: appearance.primaryColor }}
                      >
                        Primary Color
                      </div>
                      <div
                        className="h-8 rounded flex items-center px-3 text-white text-sm"
                        style={{ backgroundColor: appearance.secondaryColor }}
                      >
                        Secondary Color
                      </div>
                      <div
                        className="h-8 rounded flex items-center px-3 text-white text-sm"
                        style={{ backgroundColor: appearance.accentColor }}
                      >
                        Accent Color
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
