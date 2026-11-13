"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  HelpCircle, BookOpen, LayoutDashboard, Users, Calendar as CalendarIcon, PillIcon as Prescription,
  DollarSign, Star, TrendingUp, Globe, Settings, Database, Search, ChevronRight, Keyboard,
  Video, Zap, AlertCircle, CheckCircle2, XCircle, Info, PlayCircle,
  BookMarked, MessageSquare, Phone, Mail, Lightbulb, Target, Rocket,
  AlertTriangle, RefreshCw, WifiOff, Lock, FileQuestion
} from "lucide-react"

export default function AdminHelpPageEnhanced() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState("getting-started")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const sections = useMemo(() => ([
    { id: "overview", title: "Quick Start", icon: Rocket },
    { id: "patients", title: "Patient Records", icon: Users },
    { id: "calendar", title: "Appointments", icon: CalendarIcon },
    { id: "prescriptions", title: "Prescriptions", icon: Prescription },
    { id: "finance", title: "Money Management", icon: DollarSign },
    { id: "reviews", title: "Patient Reviews", icon: Star },
    { id: "analytics", title: "Clinic KPIs", icon: TrendingUp },
    { id: "web", title: "Website Analytics", icon: Globe },
    { id: "settings", title: "Admin Settings", icon: Settings },
    { id: "import", title: "Import / Export", icon: Database },
    { id: "troubleshooting", title: "Troubleshooting", icon: AlertTriangle },
    { id: "faq", title: "FAQs", icon: HelpCircle },
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
    <div className="min-h-screen bg-[rgb(220,230,229)] p-2 sm:p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Glass Style Harmonized with Admin Dashboard */}
        <div className="relative bg-white/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(13,92,117,0.08)] border border-[#0d5c75]/15 p-3 sm:p-4 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d5c75]/5 via-white/20 to-[#2a9d8f]/5 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-0.5 text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0d5c75] font-poppins tracking-tight">
                Admin Help Center
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#2a9d8f] leading-none">
                Your complete guide to mastering the admin clinic dashboard
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                Step-by-step guides, shortcuts, video tutorials & troubleshooting
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden border-[#0d5c75]/30 text-[#0d5c75] bg-white/70 rounded-xl h-9"
              >
                <BookMarked className="h-4 w-4 mr-1.5" />
                Navigation
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Search & Metric Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Guides Available", value: "14+", icon: BookOpen },
            { label: "Video Tutorials", value: "6", icon: Video },
            { label: "Answered FAQs", value: "25+", icon: HelpCircle },
            { label: "Fast Shortcuts", value: "10+", icon: Keyboard }
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[#0d5c75]/15 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{stat.label}</span>
                <stat.icon className="h-4 w-4 text-[#0d5c75]" />
              </div>
              <div className="text-2xl font-bold text-[#0d5c75] mt-1 font-poppins">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search Bar Card */}
        <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl">
          <CardContent className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search documentation, guides, shortcuts and troubleshooting..." 
                className="pl-10 h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl focus:border-[#0d5c75] focus:bg-white" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Navigation Sidebar */}
          <Card className={`lg:col-span-1 h-fit border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl transition-all duration-300 ${isSidebarOpen ? 'fixed inset-4 z-50 overflow-auto' : 'hidden lg:block'}`}>
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex-row justify-between items-center bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-[#0d5c75] flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-[#2a9d8f]" />
                <span>Quick Navigation</span>
              </CardTitle>
              {isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1.5 h-7 w-7 text-slate-400"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[60vh] lg:h-[500px] pr-2">
                <div className="space-y-1">
                  {filtered.map(s => (
                    <Button 
                      key={s.id} 
                      variant="ghost" 
                      className="justify-start w-full hover:bg-teal-50 hover:text-[#0d5c75] transition-all h-9 px-3 text-xs font-medium rounded-xl text-slate-700" 
                      onClick={() => {
                        go(s.id)
                        setIsSidebarOpen(false)
                      }}
                    >
                      <s.icon className="h-3.5 w-3.5 mr-2 text-[#0d5c75]" />
                      <span className="truncate">{s.title}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Overlay for mobile sidebar */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs for Different Content Types */}
            <Card className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-slate-100/80 p-1 rounded-xl h-auto">
                    <TabsTrigger value="getting-started" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0d5c75] data-[state=active]:shadow-sm">
                      <Rocket className="h-3.5 w-3.5 text-[#0d5c75]" />
                      <span>Get Started</span>
                    </TabsTrigger>
                    <TabsTrigger value="guides" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0d5c75] data-[state=active]:shadow-sm">
                      <BookOpen className="h-3.5 w-3.5 text-[#0d5c75]" />
                      <span>Guides</span>
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0d5c75] data-[state=active]:shadow-sm">
                      <Video className="h-3.5 w-3.5 text-[#0d5c75]" />
                      <span>Videos</span>
                    </TabsTrigger>
                    <TabsTrigger value="support" className="flex items-center gap-1.5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0d5c75] data-[state=active]:shadow-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-[#0d5c75]" />
                      <span>Support</span>
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="p-5 sm:p-6">
                  {/* Getting Started Tab */}
                  <TabsContent value="getting-started" className="space-y-6 mt-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#0d5c75] mb-2 font-poppins">
                        Welcome to Your Clinic Admin Workspace
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mb-5">
                        Follow this quick onboarding checklist to master your clinic management system:
                      </p>
                      
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { title: "1. Complete Profile Setup", desc: "Update clinic info, hours, and contact details", icon: Settings, status: "complete" },
                          { title: "2. Add First Patient", desc: "Create your first patient record and medical history", icon: Users, status: "pending" },
                          { title: "3. Book Appointment", desc: "Schedule consultations and adjustments on the calendar", icon: CalendarIcon, status: "pending" },
                          { title: "4. Generate Prescription", desc: "Create and print professional digital prescriptions", icon: Prescription, status: "pending" },
                          { title: "5. Record Payment", desc: "Log consultation and adjustment fees in Money Management", icon: DollarSign, status: "pending" },
                          { title: "6. Review Analytics", desc: "Monitor clinic volume, retention, and website visitors", icon: TrendingUp, status: "pending" },
                        ].map((step, i) => (
                          <div key={i} className="p-3.5 border border-slate-200/80 rounded-xl hover:shadow-sm transition-all bg-white group">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl ${step.status === 'complete' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-teal-50 text-[#0d5c75] border border-teal-200'} shrink-0`}>
                                <step.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-[#0d5c75] transition-colors truncate">{step.title}</p>
                                  {step.status === 'complete' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border border-[#0d5c75]/15 bg-slate-50/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-[#0d5c75]" />
                        <h4 className="text-xs font-bold text-[#0d5c75] uppercase tracking-wider">Quick Jump Actions</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[
                          { label: "Add Patient", icon: Users, action: () => router.push('/admin/patient-tracking') },
                          { label: "Book Appointment", icon: CalendarIcon, action: () => router.push('/admin/calendar') },
                          { label: "New Prescription", icon: Prescription, action: () => router.push('/admin/prescription') },
                          { label: "View Analytics", icon: TrendingUp, action: () => router.push('/admin/dashboard') },
                        ].map((action, i) => (
                          <Button 
                            key={i} 
                            variant="outline" 
                            className="h-auto flex-col gap-1.5 py-3 px-2 bg-white hover:bg-teal-50 hover:text-[#0d5c75] border-slate-200 rounded-xl transition-all"
                            onClick={action.action}
                          >
                            <action.icon className="h-5 w-5 text-[#0d5c75]" />
                            <span className="text-xs font-semibold text-center">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
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
                  { title: "Navigate to Patient Tracking", desc: "Click on 'Patient Tracking' in the sidebar navigation" },
                  { title: "Add New Patient", desc: "Click the 'Add Patient' button and enter Name, Phone, and Email" },
                  { title: "Add Medical History", desc: "Enter current spinal complaints, diagnosis, and adjustment notes" },
                  { title: "Save & Schedule", desc: "Save the patient record and schedule their first visit on the calendar" },
                ]} />
                
                <TipBox type="info">
                  Use a consistent phone format (e.g., +92 3xx xxxxxxx) to avoid creating duplicate patient records.
                </TipBox>

                <CommonIssues issues={[
                  { problem: "Duplicate patients created", solution: "Always search by phone number first before registering a new profile" },
                  { problem: "Status not updating", solution: "Manually update patient status after each adjustment visit - mark as 'Completed'" },
                  { problem: "Can't find patient", solution: "Search by phone number instead of first name for the most accurate results" },
                ]} />
              </EnhancedFeature>

              {/* Troubleshooting Section */}
              <Card id="troubleshooting" className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                    <AlertTriangle className="h-5 w-5 text-[#2a9d8f]" />
                    Troubleshooting Guide
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">Quick solutions to common operational challenges</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
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
                    ].map((item, i) => (
                      <AccordionItem key={i} value={`trouble-${i}`}>
                        <AccordionTrigger className="text-left text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#0d5c75]">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-xs text-slate-600 leading-relaxed">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card id="faq" className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                    <HelpCircle className="h-5 w-5 text-[#2a9d8f]" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <Accordion type="multiple" className="w-full">
                    {[
                      { q: "What are the clinic operating hours?", a: "Monday-Saturday: 9:00 AM - 6:00 PM. Lunch break: 1:00 PM - 2:00 PM. Closed on Sundays except emergencies." },
                      { q: "How do I export patient data?", a: "Go to Import/Export page. Click 'Export' and select data type (Patients/Appointments/Prescriptions). Download as CSV or PDF." },
                      { q: "Can I access the dashboard on mobile?", a: "Yes! The dashboard is fully responsive. For best experience, install it as a PWA (click the install button when prompted)." },
                      { q: "How do I backup my data?", a: "Data is automatically synced to Supabase cloud. For manual backup, go to Import/Export → Export All Data. Store the CSV files safely." },
                      { q: "What payment methods can I track?", a: "Cash, JazzCash, and Easypaisa. You can add notes for other methods like bank transfers." },
                      { q: "Can multiple staff use the system?", a: "Yes, create staff accounts in Staff Access. Assign appropriate roles and permissions." },
                    ].map((item, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#0d5c75]">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-xs text-slate-600 leading-relaxed">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card id="shortcuts" className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0d5c75]">
                    <Keyboard className="h-5 w-5 text-[#2a9d8f]" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">Navigate faster across the dashboard</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <div className="grid sm:grid-cols-2 gap-3">
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
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-1.5">
                          {shortcut.keys.map((key, j) => (
                            <React.Fragment key={j}>
                              <kbd className="px-2 py-1 rounded-md border border-slate-300 bg-slate-100 shadow-sm font-mono text-xs font-bold text-slate-700">
                                {key}
                              </kbd>
                              {j < shortcut.keys.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                            </React.Fragment>
                          ))}
                        </div>
                        <span className="text-xs text-slate-600">{shortcut.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
    <Card id={id} className="border border-[#0d5c75]/15 bg-white shadow-md rounded-2xl overflow-hidden">
      <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 mb-1 text-base font-bold text-[#0d5c75]">
              <Icon className="h-5 w-5 text-[#2a9d8f]" /> 
              {title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500"><strong>Purpose:</strong> {purpose}</CardDescription>
          </div>
          {videoId && (
            <Button
              variant="outline"
              size="sm"
              className="ml-4 border-[#0d5c75]/25 bg-white hover:bg-teal-50 text-[#0d5c75] text-xs h-8 px-3 rounded-xl shadow-xs transition-colors"
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1.5 text-[#2a9d8f]" />
              <span className="font-semibold">Tutorial</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6 space-y-5">
        {children}
      </CardContent>
    </Card>
  )
}

// Step by Step Guide Component
function StepByStep({ steps }: { steps: Array<{ title: string; desc: string }> }) {
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-xs uppercase tracking-wider text-[#0d5c75] mb-2">Step-by-Step Guide</h4>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="shrink-0 w-6 h-6 rounded-full bg-[#0d5c75] text-white flex items-center justify-center font-bold text-xs">
            {i + 1}
          </div>
          <div className="flex-1 pt-0.5">
            <h5 className="font-semibold text-xs sm:text-sm text-slate-800">{step.title}</h5>
            <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Tip Box Component
function TipBox({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
  const config = {
    info: { icon: Info, bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', iconColor: 'text-teal-600' },
    warning: { icon: AlertTriangle, bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-slate-800', iconColor: 'text-[#2a9d8f]' },
    success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', iconColor: 'text-emerald-600' },
  }[type]

  return (
    <div className={`flex gap-2.5 p-3.5 rounded-xl border ${config.bg} ${config.border}`}>
      <config.icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`text-xs ${config.text}`}>{children}</p>
    </div>
  )
}

// Common Issues Component
function CommonIssues({ issues }: { issues: Array<{ problem: string; solution: string }> }) {
  return (
    <div className="space-y-2.5">
      <h4 className="font-bold text-xs uppercase tracking-wider text-[#0d5c75] flex items-center gap-1.5">
        <XCircle className="h-4 w-4 text-rose-500" />
        Common Issues & Solutions
      </h4>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div key={i} className="p-3 rounded-xl border bg-slate-50 border-slate-200">
            <p className="font-semibold text-xs text-slate-800 mb-0.5">&bull; {issue.problem}</p>
            <p className="text-xs text-slate-600"><strong>Solution:</strong> {issue.solution}</p>
          </div>
        ))}
      </div>
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
    <div className="grid sm:grid-cols-2 gap-3">
      {guides.map((guide) => (
        <div 
          key={guide.id}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all cursor-pointer group"
          onClick={() => go(guide.id)}
        >
          <guide.icon className="h-6 w-6 text-[#0d5c75] mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm mb-1 group-hover:text-[#0d5c75] transition-colors">{guide.title}</h3>
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{guide.desc}</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-[#0d5c75] p-0 group-hover:underline">
            Read Guide <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      ))}
    </div>
  )
}

// Videos Content Component
function VideosContent() {
  const videos = [
    { title: "Getting Started with Admin Dashboard", duration: "5:30" },
    { title: "Managing Patient Records", duration: "8:45" },
    { title: "Booking and Managing Appointments", duration: "6:20" },
    { title: "Creating Digital Prescriptions", duration: "7:15" },
    { title: "Financial Tracking and Reports", duration: "9:00" },
    { title: "Understanding Analytics and KPIs", duration: "10:30" },
  ]

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {videos.map((video, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all group cursor-pointer">
          <div className="relative h-28 bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] flex items-center justify-center">
            <PlayCircle className="h-10 w-10 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {video.duration}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-xs group-hover:text-[#0d5c75] transition-colors line-clamp-1">{video.title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Click to watch tutorial</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Support Content Component
function SupportContent() {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Mail, title: "Email Support", value: "support@gonstead...", action: "mailto:support@gonsteadchiropractic.com" },
          { icon: Phone, title: "Phone Support", value: "+92 304 699...", action: "tel:+923046996267" },
          { icon: MessageSquare, title: "Live Chat", value: "9 AM - 6 PM", action: "#" },
        ].map((contact, i) => (
          <a 
            key={i} 
            href={contact.action}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all text-center group"
          >
            <contact.icon className="h-6 w-6 text-[#0d5c75] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xs text-slate-800 mb-0.5">{contact.title}</h3>
            <p className="text-[11px] text-slate-500">{contact.value}</p>
          </a>
        ))}
      </div>

      <div className="border border-[#0d5c75]/15 bg-slate-50/50 p-4 rounded-xl">
        <h3 className="text-sm font-bold text-[#0d5c75] mb-1">Submit a Support Ticket</h3>
        <p className="text-xs text-slate-500 mb-3">Our clinic technical team will respond within 24 hours</p>
        <div className="space-y-3">
          <Input placeholder="Your Name" className="h-9 text-xs rounded-xl bg-white border-slate-200" />
          <Input placeholder="Email Address" type="email" className="h-9 text-xs rounded-xl bg-white border-slate-200" />
          <Input placeholder="Subject" className="h-9 text-xs rounded-xl bg-white border-slate-200" />
          <textarea 
            className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-white resize-none text-xs text-slate-800 focus:outline-none focus:border-[#0d5c75]" 
            placeholder="Describe your issue..."
          />
          <Button className="w-full bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] hover:from-[#094254] hover:to-[#207a6f] text-white h-9 rounded-xl text-xs font-semibold shadow-md">
            <MessageSquare className="h-3.5 w-3.5 mr-2" />
            <span>Submit Ticket</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
