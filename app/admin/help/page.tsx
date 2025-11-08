"use client"

import React, { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  HelpCircle, BookOpen, LayoutDashboard, Users, Calendar as CalendarIcon, PillIcon as Prescription,
  DollarSign, Star, TrendingUp, Globe, Settings, Database, Search, ChevronRight, Shield, Keyboard,
  Video, FileText, Zap, AlertCircle, CheckCircle2, XCircle, Info, ExternalLink, Download, PlayCircle,
  BookMarked, Clock, BarChart3, UserCheck, MessageSquare, Phone, Mail, Lightbulb, Target, Rocket,
  AlertTriangle, RefreshCw, HardDrive, Wifi, WifiOff, Lock, FileQuestion, Boxes, Copy, Share2
} from "lucide-react"

export default function AdminHelpPageEnhanced() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState("getting-started")

  const sections = useMemo(() => ([
    { id: "overview", title: "Quick Start", icon: Rocket },
    { id: "patients", title: "Patient Records", icon: Users },
    { id: "calendar", title: "Appointments", icon: CalendarIcon },
    { id: "prescriptions", title: "Prescriptions", icon: Prescription },
    { id: "finance", title: "Money", icon: DollarSign },
    { id: "reviews", title: "Reviews", icon: Star },
    { id: "analytics", title: "Clinic KPIs", icon: TrendingUp },
    { id: "web", title: "Website Analytics", icon: Globe },
    { id: "settings", title: "Settings", icon: Settings },
    { id: "import", title: "Import / Export", icon: Database },
    { id: "troubleshooting", title: "Troubleshooting", icon: AlertTriangle },
    { id: "faq", title: "FAQ", icon: HelpCircle },
    { id: "shortcuts", title: "Shortcuts", icon: Keyboard },
    { id: "glossary", title: "Glossary", icon: BookOpen },
  ]), [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return sections
    return sections.filter(s => s.title.toLowerCase().includes(q) || s.id.includes(q))
  }, [query, sections])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d5c75]/5 via-[rgb(66,139,124)]/5 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with enhanced styling */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d5c75] to-[rgb(66,139,124)] p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm p-2">
                  <Image src="/images/gonstead-logo-new.png" alt="Logo" fill className="object-contain p-1" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Help Center</h1>
                  <p className="text-white/90 text-lg">Your complete guide to mastering the admin dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => router.replace('/admin/dashboard')} className="bg-white hover:bg-white/90">
                  <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative mt-6 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search documentation (e.g., patient, calendar, troubleshooting)" 
                className="pl-12 h-12 bg-white/95 backdrop-blur-sm border-0 text-gray-900 placeholder:text-gray-500 text-base" 
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: "Guides", value: "14+", icon: BookOpen },
                { label: "Videos", value: "6", icon: Video },
                { label: "FAQs", value: "25+", icon: HelpCircle },
                { label: "Shortcuts", value: "10+", icon: Keyboard }
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <stat.icon className="h-5 w-5 mb-2 text-white/80" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Enhanced Sidebar Navigation */}
          <Card className="lg:col-span-1 h-fit sticky top-6 shadow-lg">
            <CardHeader className="bg-gradient-to-br from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
              <CardTitle className="text-base flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-[#0d5c75]" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[520px] pr-2">
                <div className="space-y-1">
                  {filtered.map(s => (
                    <Button 
                      key={s.id} 
                      variant="ghost" 
                      className="justify-start w-full hover:bg-[#0d5c75]/10 hover:text-[#0d5c75] transition-all" 
                      onClick={() => go(s.id)}
                    >
                      <s.icon className="h-4 w-4 mr-2" />
                      {s.title}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs for Different Content Types */}
            <Card className="shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-3 bg-gradient-to-r from-[#0d5c75]/5 to-[rgb(66,139,124)]/5">
                  <TabsList className="grid w-full grid-cols-4 bg-white">
                    <TabsTrigger value="getting-started"><Rocket className="h-4 w-4 mr-2" />Get Started</TabsTrigger>
                    <TabsTrigger value="guides"><BookOpen className="h-4 w-4 mr-2" />Guides</TabsTrigger>
                    <TabsTrigger value="videos"><Video className="h-4 w-4 mr-2" />Videos</TabsTrigger>
                    <TabsTrigger value="support"><MessageSquare className="h-4 w-4 mr-2" />Support</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {/* Getting Started Tab */}
                  <TabsContent value="getting-started" className="space-y-6 mt-0">
                    <div>
                      <h3 className="text-2xl font-bold text-[#0d5c75] mb-4">Welcome to Your Admin Dashboard</h3>
                      <p className="text-gray-600 mb-6">Follow this quick checklist to get started with your clinic management system:</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { title: "1. Complete Profile Setup", desc: "Update clinic info, hours, and contact details", icon: Settings, status: "complete" },
                          { title: "2. Add First Patient", desc: "Create your first patient record", icon: Users, status: "pending" },
                          { title: "3. Book Appointment", desc: "Schedule your first appointment", icon: CalendarIcon, status: "pending" },
                          { title: "4. Generate Prescription", desc: "Create and print a prescription", icon: Prescription, status: "pending" },
                          { title: "5. Record Payment", desc: "Log your first payment transaction", icon: DollarSign, status: "pending" },
                          { title: "6. Review Analytics", desc: "Check your clinic KPIs", icon: BarChart3, status: "pending" },
                        ].map((step, i) => (
                          <div key={i} className="relative p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer bg-white group">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${step.status === 'complete' ? 'bg-green-100' : 'bg-[#0d5c75]/10'}`}>
                                <step.icon className={`h-5 w-5 ${step.status === 'complete' ? 'text-green-600' : 'text-[#0d5c75]'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold group-hover:text-[#0d5c75] transition-colors">{step.title}</p>
                                  {step.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <Card className="bg-gradient-to-br from-[#0d5c75]/5 to-[rgb(66,139,124)]/5 border-[#0d5c75]/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Zap className="h-5 w-5 text-[#0d5c75]" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Add Patient", icon: Users, action: () => router.push('/admin/patient-tracking') },
                            { label: "Book Appointment", icon: CalendarIcon, action: () => router.push('/admin/calendar') },
                            { label: "New Prescription", icon: Prescription, action: () => router.push('/admin/prescription') },
                            { label: "View Analytics", icon: BarChart3, action: () => router.push('/admin/dashboard') },
                          ].map((action, i) => (
                            <Button 
                              key={i} 
                              variant="outline" 
                              className="h-auto flex-col gap-2 py-4 hover:bg-white hover:shadow-md transition-all"
                              onClick={action.action}
                            >
                              <action.icon className="h-6 w-6 text-[#0d5c75]" />
                              <span className="text-xs font-medium">{action.label}</span>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Guides Tab */}
                  <TabsContent value="guides" className="space-y-6 mt-0">
                    <GuidesContent go={go} />
                  </TabsContent>

                  {/* Videos Tab */}
                  <TabsContent value="videos" className="space-y-6 mt-0">
                    <VideosContent />
                  </TabsContent>

                  {/* Support Tab */}
                  <TabsContent value="support" className="space-y-6 mt-0">
                    <SupportContent />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Detailed Feature Guides */}
            <div id="guides-section" className="space-y-6">
              {/* Patient Records */}
              <EnhancedFeature 
                id="patients" 
                Icon={Users} 
                title="Patient Records" 
                purpose="Register patients, update details, and track session progress."
                videoId="patient-management"
              >
                <StepByStep steps={[
                  { title: "Navigate to Patient Tracking", desc: "Click on 'Patient Tracking' in the sidebar" },
                  { title: "Add New Patient", desc: "Click 'Add Patient' button and fill in Name, Phone, Email" },
                  { title: "Add Medical History", desc: "Enter patient's medical history and current complaints" },
                  { title: "Save & Schedule", desc: "Save the patient record and book their first appointment" },
                ]} />
                
                <TipBox type="info">
                  Use a consistent phone format (e.g., +92 3xx xxxxxxx) to avoid creating duplicate patient records.
                </TipBox>

                <CommonIssues issues={[
                  { problem: "Duplicate patients created", solution: "Always search by phone number first before adding new patients" },
                  { problem: "Status not updating", solution: "Manually update patient status after each visit - set to 'Completed'" },
                  { problem: "Can't find patient", solution: "Try searching by phone instead of name - it's more accurate" },
                ]} />

                <ProTips tips={[
                  "Search by phone for fastest matching",
                  "Update status immediately after each visit",
                  "Add follow-up date before patient leaves",
                  "Use tags to categorize patients (e.g., 'chronic pain', 'new patient')"
                ]} />
              </EnhancedFeature>

              {/* Appointments */}
              <EnhancedFeature 
                id="calendar" 
                Icon={CalendarIcon} 
                title="Appointments" 
                purpose="Book visits without conflicts and within clinic hours."
                videoId="appointment-booking"
              >
                <StepByStep steps={[
                  { title: "Open Calendar", desc: "Navigate to Calendar view from sidebar" },
                  { title: "Select Time Slot", desc: "Click on an available time slot (avoid lunch & Sundays)" },
                  { title: "Choose Patient", desc: "Select existing patient or add new one" },
                  { title: "Confirm Booking", desc: "Verify time, duration, and patient contact" },
                ]} />

                <TipBox type="warning">
                  Always leave a 10-15 minute buffer between sessions to avoid running late. Mark emergency appointments with high priority.
                </TipBox>

                <CommonIssues issues={[
                  { problem: "Double booking", solution: "Refresh calendar before booking new appointments" },
                  { problem: "Booking outside hours", solution: "System blocks lunch (1-2 PM) and Sundays automatically" },
                  { problem: "Patient no-show", solution: "Send reminder SMS/email 24 hours before appointment" },
                ]} />

                <ProTips tips={[
                  "Use week view to plan your workload efficiently",
                  "Color-code appointments by urgency level",
                  "Export calendar to sync with Google Calendar",
                  "Set up automated reminders for patients"
                ]} />
              </EnhancedFeature>

              {/* Prescriptions */}
              <EnhancedFeature 
                id="prescriptions" 
                Icon={Prescription} 
                title="Prescriptions" 
                purpose="Create, print, and save professional prescriptions with QR verification."
                videoId="prescription-generation"
              >
                <StepByStep steps={[
                  { title: "Select Patient", desc: "Choose the patient from your records" },
                  { title: "Choose Template", desc: "Pick from pre-made templates or start blank" },
                  { title: "Add Medications", desc: "List medications with dosage and duration" },
                  { title: "Print/Download", desc: "Generate PDF and print or save digitally" },
                ]} />

                <TipBox type="success">
                  All prescriptions include a QR code for verification. Patients can scan it to verify authenticity.
                </TipBox>

                <ProTips tips={[
                  "Create templates for common conditions",
                  "Always include follow-up instructions",
                  "Save a digital copy before printing",
                  "Use the prescription history to track patient progress"
                ]} />
              </EnhancedFeature>

              {/* Troubleshooting Section */}
              <Card id="troubleshooting" className="shadow-lg border-2 border-orange-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <AlertTriangle className="h-5 w-5" />
                    Troubleshooting Guide
                  </CardTitle>
                  <CardDescription>Quick solutions to common problems</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {[
                      {
                        q: "Data not saving / Changes not appearing",
                        a: "Check your internet connection. The system saves locally first, then syncs to cloud. Look for the sync icon in the top-right. If offline, data will sync when connection is restored.",
                        icon: WifiOff
                      },
                      {
                        q: "Can't login / Forgot password",
                        a: "Use the 'Forgot Password' link on the login page. If that doesn't work, contact your clinic administrator or email support@gonsteadchiropractic.com",
                        icon: Lock
                      },
                      {
                        q: "Page loading slowly / Freezing",
                        a: "Clear your browser cache (Ctrl+Shift+Delete). Close unnecessary tabs. Check if your internet speed is sufficient (minimum 2 Mbps recommended). Try using Chrome or Edge browsers.",
                        icon: RefreshCw
                      },
                      {
                        q: "Patient data missing / Not showing",
                        a: "Use the search function to find the patient. Check if you're using the correct filter (All/Active/Pending). If still missing, check the 'Archived' section or contact support.",
                        icon: FileQuestion
                      },
                      {
                        q: "Print not working / PDF not generating",
                        a: "Enable pop-ups for this site in your browser settings. Check if you have a PDF viewer installed. Try downloading instead of printing directly. Clear browser cache and try again.",
                        icon: AlertCircle
                      },
                      {
                        q: "Supabase sync failing",
                        a: "Verify your .env.local file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Check Supabase dashboard for table schema. Ensure RLS policies allow inserts. Data is saved locally so nothing is lost.",
                        icon: Database
                      },
                    ].map((item, i) => (
                      <AccordionItem key={i} value={`trouble-${i}`}>
                        <AccordionTrigger className="text-left hover:text-[#0d5c75]">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">{item.q}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-700 pl-7">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Enhanced FAQ */}
              <Card id="faq" className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-[#0d5c75]" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="multiple" className="w-full">
                    {[
                      { q: "What are the clinic operating hours?", a: "Monday-Saturday: 9:00 AM - 6:00 PM. Lunch break: 1:00 PM - 2:00 PM. Closed on Sundays except emergencies." },
                      { q: "How do I export patient data?", a: "Go to Import/Export page. Click 'Export' and select data type (Patients/Appointments/Prescriptions). Download as CSV or PDF." },
                      { q: "Can I access the dashboard on mobile?", a: "Yes! The dashboard is fully responsive. For best experience, install it as a PWA (click the install button when prompted)." },
                      { q: "How do I backup my data?", a: "Data is automatically synced to Supabase cloud. For manual backup, go to Import/Export → Export All Data. Store the CSV files safely." },
                      { q: "What payment methods can I track?", a: "Cash, JazzCash, and Easypaisa. You can add notes for other methods like bank transfers." },
                      { q: "How do I handle refunds?", a: "Go to Money Management → Refunds. Enter amount, select original payment, and add reason for refund." },
                      { q: "Can multiple staff use the system?", a: "Yes, create staff accounts in Settings → Staff Access. Assign appropriate roles and permissions." },
                      { q: "How long is data stored?", a: "Forever, unless you manually delete it. Supabase provides unlimited storage for your subscription tier." },
                    ].map((item, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left hover:text-[#0d5c75]">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-700">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Enhanced Keyboard Shortcuts */}
              <Card id="shortcuts" className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-[#0d5c75]" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <CardDescription>Work faster with these keyboard shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { keys: ["Ctrl", "K"], desc: "Global search" },
                      { keys: ["G", "D"], desc: "Go to Dashboard" },
                      { keys: ["G", "C"], desc: "Go to Calendar" },
                      { keys: ["G", "P"], desc: "Go to Patients" },
                      { keys: ["Ctrl", "N"], desc: "Add new patient" },
                      { keys: ["Ctrl", "S"], desc: "Save current form" },
                      { keys: ["Esc"], desc: "Close modal/dialog" },
                      { keys: ["Ctrl", "P"], desc: "Print/Export" },
                    ].map((shortcut, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-2">
                          {shortcut.keys.map((key, j) => (
                            <React.Fragment key={j}>
                              <kbd className="px-3 py-1.5 rounded-md border bg-gradient-to-b from-gray-50 to-gray-100 shadow-sm font-mono text-sm font-semibold text-gray-700">
                                {key}
                              </kbd>
                              {j < shortcut.keys.length - 1 && <span className="text-gray-400">+</span>}
                            </React.Fragment>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">{shortcut.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Glossary */}
              <Card id="glossary" className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#0d5c75]" />
                    Glossary
                  </CardTitle>
                  <CardDescription>Common terms and definitions</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { term: "Patient Record", def: "Complete profile with contact, medical history, and visit tracking" },
                      { term: "Appointment", def: "Scheduled visit with specific date, time, and duration" },
                      { term: "Prescription", def: "Digital or printed treatment instructions with medications" },
                      { term: "KPI", def: "Key Performance Indicator - metrics to measure clinic success" },
                      { term: "Review", def: "Patient feedback/testimonial for approval and display" },
                      { term: "Import/Export", def: "Bulk data transfer using CSV files" },
                      { term: "Sync", def: "Process of uploading local data to cloud storage" },
                      { term: "RLS", def: "Row Level Security - database access control policy" },
                      { term: "Supabase", def: "Cloud database service for storing clinic data" },
                      { term: "PWA", def: "Progressive Web App - installable web application" },
                      { term: "QR Code", def: "Scannable code on prescriptions for verification" },
                      { term: "Buffer Time", def: "Gap between appointments to prevent delays" },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-white hover:shadow-md transition-all">
                        <h4 className="font-semibold text-[#0d5c75] mb-1">{item.term}</h4>
                        <p className="text-sm text-gray-600">{item.def}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => router.replace('/admin/dashboard')} className="bg-[#0d5c75] hover:bg-[#0d5c75]/90">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Return to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <ChevronRight className="h-4 w-4 mr-2 rotate-[-90deg]" /> Back to Top
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last updated: Nov 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Feature Component
function EnhancedFeature({ id, Icon, title, purpose, videoId, children }: any) {
  return (
    <Card id={id} className="shadow-lg">
      <CardHeader className="space-y-2 bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 mb-2">
              <Icon className="h-6 w-6 text-[#0d5c75]" /> 
              {title}
            </CardTitle>
            <CardDescription className="text-base"><strong>Purpose:</strong> {purpose}</CardDescription>
          </div>
          {videoId && (
            <Button variant="outline" size="sm" className="ml-4">
              <PlayCircle className="h-4 w-4 mr-2" />
              Watch Tutorial
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {children}
      </CardContent>
    </Card>
  )
}

// Step by Step Guide Component
function StepByStep({ steps }: { steps: Array<{ title: string; desc: string }> }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 mb-3">Step-by-Step Guide</h4>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0d5c75] text-white flex items-center justify-center font-bold text-sm">
            {i + 1}
          </div>
          <div className="flex-1 pt-0.5">
            <h5 className="font-semibold text-gray-900">{step.title}</h5>
            <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Tip Box Component
function TipBox({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
  const config = {
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', iconColor: 'text-blue-600' },
    warning: { icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', iconColor: 'text-orange-600' },
    success: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', iconColor: 'text-green-600' },
  }[type]

  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <config.icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
      <p className={`text-sm ${config.text}`}>{children}</p>
    </div>
  )
}

// Common Issues Component
function CommonIssues({ issues }: { issues: Array<{ problem: string; solution: string }> }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-red-600" />
        Common Issues & Solutions
      </h4>
      <div className="space-y-3">
        {issues.map((issue, i) => (
          <div key={i} className="p-4 rounded-lg border bg-red-50 border-red-200">
            <p className="font-medium text-red-900 mb-1">❌ {issue.problem}</p>
            <p className="text-sm text-red-800">✅ <strong>Solution:</strong> {issue.solution}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pro Tips Component
function ProTips({ tips }: { tips: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-600" />
        Pro Tips
      </h4>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <Target className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Guides Content Component
function GuidesContent({ go }: { go: (id: string) => void }) {
  const guides = [
    { id: "patients", title: "Patient Records", icon: Users, desc: "Learn how to manage patient records effectively" },
    { id: "calendar", title: "Appointments", icon: CalendarIcon, desc: "Master appointment scheduling and management" },
    { id: "prescriptions", title: "Prescriptions", icon: Prescription, desc: "Create and manage digital prescriptions" },
    { id: "finance", title: "Financial Management", icon: DollarSign, desc: "Track payments, refunds, and revenue" },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {guides.map((guide) => (
        <div 
          key={guide.id}
          className="p-6 rounded-xl border bg-white hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => go(guide.id)}
        >
          <guide.icon className="h-8 w-8 text-[#0d5c75] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-2 group-hover:text-[#0d5c75] transition-colors">{guide.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{guide.desc}</p>
          <Button variant="ghost" size="sm" className="group-hover:bg-[#0d5c75]/10">
            Read Guide <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ))}
    </div>
  )
}

// Videos Content Component
function VideosContent() {
  const videos = [
    { title: "Getting Started with Admin Dashboard", duration: "5:30", thumbnail: "dashboard-intro" },
    { title: "Managing Patient Records", duration: "8:45", thumbnail: "patient-management" },
    { title: "Booking and Managing Appointments", duration: "6:20", thumbnail: "appointments" },
    { title: "Creating Digital Prescriptions", duration: "7:15", thumbnail: "prescriptions" },
    { title: "Financial Tracking and Reports", duration: "9:00", thumbnail: "finance" },
    { title: "Understanding Analytics and KPIs", duration: "10:30", thumbnail: "analytics" },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {videos.map((video, i) => (
        <div key={i} className="rounded-xl border bg-white overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
          <div className="relative h-40 bg-gradient-to-br from-[#0d5c75] to-[rgb(66,139,124)] flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold group-hover:text-[#0d5c75] transition-colors">{video.title}</h3>
            <p className="text-xs text-gray-500 mt-1">Click to watch tutorial</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Support Content Component
function SupportContent() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Mail, title: "Email Support", value: "support@gonsteadchiropractic.com", action: "mailto:support@gonsteadchiropractic.com" },
          { icon: Phone, title: "Phone Support", value: "+92 304 699 6267", action: "tel:+923046996267" },
          { icon: MessageSquare, title: "Live Chat", value: "Available 9 AM - 6 PM", action: "#" },
        ].map((contact, i) => (
          <a 
            key={i} 
            href={contact.action}
            className="p-6 rounded-xl border bg-white hover:shadow-lg transition-all text-center group"
          >
            <contact.icon className="h-8 w-8 text-[#0d5c75] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">{contact.title}</h3>
            <p className="text-sm text-gray-600">{contact.value}</p>
          </a>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submit a Support Ticket</CardTitle>
          <CardDescription>Our team will respond within 24 hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Your Name" />
          <Input placeholder="Email Address" type="email" />
          <Input placeholder="Subject" />
          <textarea 
            className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background resize-none" 
            placeholder="Describe your issue..."
          />
          <Button className="w-full bg-[#0d5c75] hover:bg-[#0d5c75]/90">
            <MessageSquare className="h-4 w-4 mr-2" />
            Submit Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

