"use client"

import React, { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  HelpCircle, BookOpen, LayoutDashboard, Users, Calendar as CalendarIcon, PillIcon as Prescription,
  DollarSign, Star, TrendingUp, Globe, MapPin, Settings, Database, Search, ChevronRight, Shield, Keyboard
} from "lucide-react"

export default function AdminHelpPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const sections = useMemo(() => ([
    { id: "overview", title: "Quick Start" },
    { id: "patients", title: "Patient Records" },
    { id: "calendar", title: "Appointments" },
    { id: "prescriptions", title: "Prescriptions" },
    { id: "finance", title: "Money" },
    { id: "reviews", title: "Reviews" },
    { id: "analytics", title: "Clinic KPIs" },
    { id: "web", title: "Website Analytics" },
    { id: "settings", title: "Settings" },
    { id: "import", title: "Import / Export" },
    { id: "workflows", title: "Workflows" },
    { id: "faq", title: "FAQ" },
    { id: "shortcuts", title: "Shortcuts" },
    { id: "glossary", title: "Glossary" },
    { id: "scenarios", title: "Scenarios" },
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
    <div className="min-h-screen bg-gradient-to-br from-[rgb(190,205,203)]/30 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10 p-4 rounded-xl border border-[#0d5c75]/10">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14">
              <Image src="/images/gonstead-logo-new.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0d5c75]">Admin Help Center</h1>
              <p className="text-gray-600">Clear, step‑by‑step guidance for every feature</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics (e.g. patient, calendar, money)" className="pl-9" />
            </div>
            <Button variant="outline" onClick={() => router.replace('/admin/dashboard')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Quick Nav */}
          <Card className="lg:col-span-1 h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ScrollArea className="h-[420px] pr-2">
                {filtered.map(s => (
                  <Button key={s.id} variant="ghost" className="justify-start w-full" onClick={() => go(s.id)}>
                    {s.title}
                  </Button>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Sections */}
          <div className="lg:col-span-3 space-y-8">
            {/* Section Tabs */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <CardTitle className="text-sm">Guide Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  {sections.map(s => (
                    <Button key={s.id} variant="outline" size="sm" onClick={() => go(s.id)} className="rounded-full">
                      {s.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card id="overview">
              <CardHeader className="space-y-1 bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Start Here</Badge>
                  <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-[#0d5c75]" /> Quick Start</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Follow these in order for a smooth workflow</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Users, title: "1. Add or Find Patient", desc: "Create a new patient or search existing" },
                    { icon: CalendarIcon, title: "2. Book Appointment", desc: "Pick time within clinic hours" },
                    { icon: Prescription, title: "3. Create Prescription", desc: "Use template, print or download" },
                    { icon: DollarSign, title: "4. Record Payment", desc: "Save method and issue receipt" },
                    { icon: Star, title: "5. Manage Reviews", desc: "Approve and feature testimonials" },
                    { icon: TrendingUp, title: "6. Monitor KPIs", desc: "Track visits, sessions, ratings" },
                  ].map((s, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-white">
                      <s.icon className="h-5 w-5 text-[#0d5c75] mb-2" />
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm text-gray-600">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patient Records */}
            <Feature id="patients" Icon={Users} title="Patient Records" purpose="Register patients, update details, and track session progress.">
              <List title="How to use" items={[
                "Open Patient Tracking",
                "Click Add Patient and fill Name, Phone, Email (optional)",
                "Add notes after visits and update status",
                "Use search (name/phone/email) to find quickly",
              ]} />
              <Tip>Use a consistent phone format (e.g., +92 3xx xxxxxxx) to avoid duplicates.</Tip>
              <Knowledge title="Common mistakes" items={[
                "Different phone formats create duplicates",
                "Status left as 'pending' after a completed visit",
                "No notes recorded—hard to recall details later",
                "Follow‑up not scheduled",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Search by phone for fastest matching",
                "Update status right after each visit",
                "Keep notes short and consistent",
                "Schedule follow‑up before the patient leaves",
              ]} />
            </Feature>

            {/* Appointments */}
            <Feature id="calendar" Icon={CalendarIcon} title="Appointments" purpose="Book visits without conflicts and within clinic hours.">
              <List title="How to use" items={[
                "Open Calendar",
                "Select a free time slot",
                "Confirm time and duration",
                "Avoid lunch (1–2 PM) and Sundays",
              ]} />
              <Flow items={["Patient", "Appointment", "Reminder", "Visit", "Payment"]} />
              <Knowledge title="Common mistakes" items={[
                "Booking on Sunday or during lunch (1–2 PM)",
                "Overlapping appointments",
                "Not confirming the contact number",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Leave a 10–15 minute buffer between sessions",
                "Mark emergencies with high priority",
                "Use day/week filters to plan workload",
              ]} />
            </Feature>

            {/* Prescriptions */}
            <Feature id="prescriptions" Icon={Prescription} title="Prescriptions" purpose="Create, print, and save professional prescriptions.">
              <List title="How to use" items={[
                "Open Prescriptions",
                "Select the patient",
                "Choose a template",
                "Print or download the PDF",
              ]} />
              <Tip>Printing or saving keeps a record for tracking later.</Tip>
              <Knowledge title="Common mistakes" items={[
                "Forgetting follow‑up instructions",
                "Unclear dosage or timing",
                "Not saving the record after printing",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Use templates for common cases",
                "Include QR for fast verify",
                "Print a test copy for first‑time setups",
              ]} />
            </Feature>

            {/* Money */}
            <Feature id="finance" Icon={DollarSign} title="Money" purpose="Record payments and refunds clearly.">
              <List title="How to use" items={[
                "Open Money Management",
                "Choose payment or refund",
                "Enter amount and method",
                "Save and issue receipt",
              ]} />
              <Knowledge title="Common mistakes" items={[
                "Wrong payment method selected",
                "Missing reason on refunds",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Add a short note to each payment for clarity",
                "Reconcile totals at the end of day",
              ]} />
            </Feature>

            {/* Reviews */}
            <Feature id="reviews" Icon={Star} title="Reviews" purpose="Approve, respond and feature real patient feedback.">
              <List title="How to use" items={[
                "Open Reviews",
                "Approve verified feedback",
                "Feature top testimonials",
                "Respond politely if needed",
              ]} />
              <Knowledge title="Common mistakes" items={[
                "Approving unverified or spam content",
                "Ignoring reviews instead of responding",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Feature 3–5 strong testimonials on the site",
                "Use initials if full names aren’t allowed",
              ]} />
            </Feature>

            {/* KPIs */}
            <Feature id="analytics" Icon={TrendingUp} title="Clinic KPIs" purpose="See trends for visits, sessions, and satisfaction.">
              <List title="How to use" items={[
                "Open Analytics",
                "Pick the date range",
                "Review cards and charts",
                "Adjust operations accordingly",
              ]} />
              <Knowledge title="Common mistakes" items={[
                "Looking at totals only without trends",
                "Ignoring date ranges",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Review KPIs weekly",
                "Set targets for sessions and satisfaction",
              ]} />
            </Feature>

            {/* Website Analytics */}
            <Feature id="web" Icon={Globe} title="Website Analytics" purpose="Understand visitors and what leads to bookings.">
              <List title="How to use" items={[
                "Open Website Analytics",
                "Check visitors by device and country",
                "See popular pages",
                "Track conversion to bookings",
              ]} />
              <Knowledge title="Common mistakes" items={[
                "Not tracking conversions to bookings",
                "Focusing only on total visits",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Check top pages and their booking rates",
                "Link popular pages to the booking modal",
              ]} />
            </Feature>

            {/* Settings */}
            <Feature id="settings" Icon={Settings} title="Settings" purpose="Keep clinic info, hours, and notifications up to date.">
              <List title="How to use" items={[
                "Open Settings",
                "Update address and contact",
                "Set hours and maps",
                "Review notification options",
              ]} />
              <Knowledge title="Common mistakes" items={[
                "Outdated business hours or map",
                "Old contact details",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Tap the map link on your phone to test directions",
                "Review contacts after any SIM/email change",
              ]} />
            </Feature>

            {/* Import / Export */}
            <Feature id="import" Icon={Database} title="Import / Export" purpose="Move data in or out safely.">
              <List title="How to use" items={[
                "Open Import/Export",
                "Download a sample CSV",
                "Import with validation",
                "Export for backup or reports",
              ]} />
              <Knowledge title="Common mistakes" items={[
                "CSV headers don’t match the sample",
                "Importing a large file without backup",
              ]} />
              <Knowledge title="Pro tips" items={[
                "Use the sample CSV first",
                "Import in small batches",
              ]} />
            </Feature>

            {/* Visual Workflows */}
            <Card id="workflows">
              <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#0d5c75]" /> Visual Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <Flow title="Patient Journey" items={["Register", "History", "Book", "Visit", "Treat", "Follow‑up"]} />
                  <Flow title="Admin Routine" items={["Sign in", "Dashboard", "Manage", "Analyze", "Decide"]} />
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card id="faq">
              <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-[#0d5c75]" /> FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="f1">
                    <AccordionTrigger>Why doesn’t a new booking appear instantly?</AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-700">Refresh the dashboard after booking. If internet is slow, the list updates when the page reloads.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="f2">
                    <AccordionTrigger>Clinic hours?</AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-700">Monday–Saturday: 9:00–18:00. Lunch 13:00–14:00. Sunday closed.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="f3">
                    <AccordionTrigger>How to find a patient quickly?</AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-700">Use the search bar in Patient Tracking; search by name, phone, or email.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Shortcuts */}
            <Card id="shortcuts">
              <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <CardTitle className="flex items-center gap-2"><Keyboard className="h-5 w-5 text-[#0d5c75]" /> Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <kbd className="px-2 py-1 rounded-md border bg-white shadow-sm">Ctrl + K</kbd> <span>Global Search</span>
                  <kbd className="px-2 py-1 rounded-md border bg-white shadow-sm">G then D</kbd> <span>Go to Dashboard</span>
                  <kbd className="px-2 py-1 rounded-md border bg-white shadow-sm">G then C</kbd> <span>Go to Calendar</span>
                  <kbd className="px-2 py-1 rounded-md border bg-white shadow-sm">G then P</kbd> <span>Go to Patients</span>
                </div>
              </CardContent>
            </Card>

            {/* Glossary */}
            <Card id="glossary">
              <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <CardTitle><BookOpen className="h-5 w-5 inline mr-2 text-[#0d5c75]" /> Glossary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Patient record:</strong> The main profile with contact and visit info.</p>
                  <p><strong>Appointment:</strong> Scheduled visit with date and time.</p>
                  <p><strong>Prescription:</strong> Printed or PDF instructions for the patient.</p>
                </div>
                <div>
                  <p><strong>KPI:</strong> Key numbers to monitor clinic performance.</p>
                  <p><strong>Review:</strong> Patient feedback to approve/feature.</p>
                  <p><strong>Import/Export:</strong> Bulk data in/out using CSV files.</p>
                </div>
              </CardContent>
            </Card>

            {/* Scenarios */}
            <Card id="scenarios">
              <CardHeader className="bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
                <CardTitle><Shield className="h-5 w-5 inline mr-2 text-[#0d5c75]" /> Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-3">
                <div>
                  <p className="font-semibold">A patient calls for an urgent visit</p>
                  <ul className="list-disc ml-5">
                    <li>Add the patient or find existing via phone</li>
                    <li>Book a nearby slot and mark urgency</li>
                    <li>Record notes after visit; schedule follow‑up</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">You need today’s summary</p>
                  <ul className="list-disc ml-5">
                    <li>Open Analytics → set range to Today</li>
                    <li>Review appointments, sessions, and payments</li>
                    <li>Note any items requiring attention tomorrow</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => router.replace('/admin/dashboard')}>
                <LayoutDashboard className="h-4 w-4 mr-2" /> Return to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <ChevronRight className="h-4 w-4 mr-2 rotate-[-90deg]" /> Back to Top
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ id, Icon, title, purpose, children }: { id: string; Icon: any; title: string; purpose: string; children: React.ReactNode }) {
  return (
    <Card id={id}>
      <CardHeader className="space-y-1 bg-gradient-to-r from-[#0d5c75]/10 to-[rgb(66,139,124)]/10">
        <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#0d5c75]" /> {title}</CardTitle>
        <p className="text-sm text-gray-600"><strong>Purpose:</strong> {purpose}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 text-sm text-gray-700">
      <p className="font-semibold mb-2">{title}</p>
      <ul className="list-disc ml-5 space-y-1">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-3 rounded-lg border bg-white text-sm text-gray-700">
      <strong>Tip:</strong> {children}
    </div>
  )
}

function Flow({ title, items }: { title?: string; items: string[] }) {
  return (
    <div className="mt-4 p-3 rounded-lg border bg-white">
      {title && <p className="text-sm font-semibold mb-2">{title}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {items.map((n, i) => (
          <React.Fragment key={`${n}-${i}`}>
            <span className="px-3 py-1.5 rounded-full bg-[#0d5c75]/10 text-[#0d5c75] text-sm font-medium">{n}</span>
            {i < items.length - 1 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function Knowledge({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 p-3 rounded-lg border bg-white text-sm text-gray-700">
      <p className="font-semibold mb-2">{title}</p>
      <ul className="list-disc ml-5 space-y-1">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  )
}
