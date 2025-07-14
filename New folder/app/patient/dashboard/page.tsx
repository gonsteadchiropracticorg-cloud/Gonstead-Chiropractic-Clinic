"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Activity,
  BookOpen,
  Video,
  Phone,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Download,
} from "lucide-react"
import { SpineTimeline } from "@/components/dashboard/spine-timeline"
import { SymptomTracker } from "@/components/dashboard/symptom-tracker"
import { ExerciseLibrary } from "@/components/dashboard/exercise-library"
import type { Patient, Appointment } from "@/lib/dashboard-types"

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null)
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null)

  // Mock patient data
  useEffect(() => {
    setCurrentPatient({
      id: "P001",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+92 300 1234567",
      dateOfBirth: "1985-03-15",
      emergencyContact: {
        name: "John Johnson",
        phone: "+92 300 1234568",
        relationship: "Spouse",
      },
      medicalHistory: {
        chiefComplaint: "Lower back pain with radiating symptoms",
        onsetDate: "2024-05-15",
        previousTreatments: ["Physical Therapy", "Massage Therapy"],
        medications: ["Ibuprofen 400mg"],
        allergies: ["None known"],
      },
      riskFlags: [],
      createdAt: "2024-05-20",
      lastVisit: "2024-06-08",
      nextAppointment: "2024-06-12",
      treatmentPlan: {
        id: "TP001",
        patientId: "P001",
        diagnosis: "Lumbar facet syndrome with L2-L3 restriction",
        treatmentGoals: [
          "Reduce pain from 7/10 to 2/10",
          "Improve lumbar flexion by 30 degrees",
          "Return to normal daily activities",
          "Prevent future episodes",
        ],
        estimatedSessions: 8,
        completedSessions: 5,
        frequency: "2x per week",
        homeExercises: [],
        restrictions: ["No heavy lifting >20lbs", "Avoid prolonged sitting"],
        nextReEvaluation: "2024-06-15",
        createdAt: "2024-05-20",
        updatedAt: "2024-06-08",
      },
      progressNotes: [],
      spinalAssessment: {
        id: "SA001",
        patientId: "P001",
        cervical: [],
        thoracic: [],
        lumbar: [
          {
            segment: "L2",
            mobility: "hypomobile",
            pain: 6,
            inflammation: true,
            adjustmentHistory: [
              { date: "2024-06-08", technique: "Gonstead", response: "Good improvement" },
              { date: "2024-06-05", technique: "Gonstead", response: "Moderate improvement" },
            ],
            notes: "Primary restriction site",
          },
          {
            segment: "L3",
            mobility: "hypomobile",
            pain: 4,
            inflammation: false,
            adjustmentHistory: [{ date: "2024-06-08", technique: "Gonstead", response: "Good improvement" }],
            notes: "Secondary compensation",
          },
        ],
        sacral: [],
        lastUpdated: "2024-06-08",
      },
    })

    setUpcomingAppointment({
      id: "A001",
      patientId: "P001",
      doctorId: "DR001",
      date: "2024-06-12",
      time: "10:00",
      duration: 30,
      type: "follow-up",
      status: "confirmed",
      chiefComplaint: "Follow-up for lower back pain",
      preVisitForms: {
        painScale: 4,
        functionalRating: 7,
        symptoms: ["mild lower back stiffness", "occasional muscle tension"],
        newSymptoms: [],
      },
    })
  }, [])

  const progressPercentage = currentPatient
    ? (currentPatient.treatmentPlan.completedSessions / currentPatient.treatmentPlan.estimatedSessions) * 100
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-[#FEFCF8] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0d5c75] font-poppins">
              Welcome back, {currentPatient?.name || "Patient"}
            </h1>
            <p className="text-[#0A3A47] font-open-sans">
              Your healing journey with Dr. Bashir - Gonstead Chiropractic
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
            <Button variant="outline" className="border-[#0d5c75] text-[#0d5c75]">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Dr. Bashir
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-[#0d5c75]/20 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#0A3A47] font-open-sans">Treatment Progress</p>
                <p className="text-2xl font-bold text-[#0d5c75] font-poppins">{Math.round(progressPercentage)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#2a9d8f]" />
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-[#0d5c75]/20 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#0A3A47] font-open-sans">Sessions Completed</p>
                <p className="text-2xl font-bold text-[#0d5c75] font-poppins">
                  {currentPatient?.treatmentPlan.completedSessions || 0}/
                  {currentPatient?.treatmentPlan.estimatedSessions || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-[#2a9d8f]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#0d5c75]/20 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#0A3A47] font-open-sans">Current Pain Level</p>
                <p className="text-2xl font-bold text-[#f3a800] font-poppins">
                  {upcomingAppointment?.preVisitForms.painScale || 0}/10
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-[#f3a800]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#0d5c75]/20 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#0A3A47] font-open-sans">Next Appointment</p>
                <p className="text-lg font-bold text-[#0d5c75] font-poppins">
                  {upcomingAppointment ? new Date(upcomingAppointment.date).toLocaleDateString() : "Not scheduled"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-[#2a9d8f]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Appointment & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming Appointment */}
          {upcomingAppointment && (
            <Card className="border-[#0d5c75]/20 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
                <CardTitle className="flex items-center gap-2 font-poppins">
                  <Clock className="h-5 w-5" />
                  Next Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0A3A47] font-open-sans">Date & Time</span>
                    <span className="font-semibold text-[#0d5c75] font-poppins">
                      {new Date(upcomingAppointment.date).toLocaleDateString()} at {upcomingAppointment.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#0A3A47] font-open-sans">Type</span>
                    <Badge className="bg-[#2a9d8f] text-white">{upcomingAppointment.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#0A3A47] font-open-sans">Duration</span>
                    <span className="text-[#0A3A47] font-open-sans">{upcomingAppointment.duration} minutes</span>
                  </div>

                  {/* Pre-visit Checklist */}
                  <div className="mt-4 p-4 bg-[#F8F5F0] rounded-lg">
                    <h4 className="font-semibold text-[#0A3A47] mb-3 font-poppins">Pre-visit Checklist</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-[#0A3A47] font-open-sans">Pain assessment completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-[#0A3A47] font-open-sans">Home exercises logged</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[#f3a800]" />
                        <span className="text-sm text-[#0A3A47] font-open-sans">Bring insurance card</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#2a9d8f] hover:bg-[#238a7a] text-white">
                      <Calendar className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button variant="outline" className="flex-1 border-[#0d5c75] text-[#0d5c75]">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Clinic
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-[#0d5c75]/20 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0d5c75] font-poppins">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white h-20 flex-col gap-2">
                  <Video className="h-6 w-6" />
                  <span className="text-xs">Emergency Video</span>
                </Button>
                <Button variant="outline" className="border-[#0d5c75] text-[#0d5c75] h-20 flex-col gap-2">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-xs">Exercise Library</span>
                </Button>
                <Button variant="outline" className="border-[#f3a800] text-[#f3a800] h-20 flex-col gap-2">
                  <Activity className="h-6 w-6" />
                  <span className="text-xs">Log Symptoms</span>
                </Button>
                <Button variant="outline" className="border-[#0d5c75] text-[#0d5c75] h-20 flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span className="text-xs">Download Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Goals */}
          <Card className="border-[#0d5c75]/20 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0d5c75] font-poppins">Treatment Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentPatient?.treatmentPlan.treatmentGoals.map((goal, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#F8F5F0] rounded-lg">
                    <CheckCircle className="h-5 w-5 text-[#2a9d8f] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#0A3A47] font-open-sans">{goal}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Main Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-[#0d5c75]/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white">
                Journey
              </TabsTrigger>
              <TabsTrigger value="symptoms" className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white">
                Symptoms
              </TabsTrigger>
              <TabsTrigger
                value="exercises"
                className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white"
              >
                Exercises
              </TabsTrigger>
              <TabsTrigger
                value="education"
                className="data-[state=active]:bg-[#2a9d8f] data-[state=active]:text-white"
              >
                Education
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <SpineTimeline patient={currentPatient} />
            </TabsContent>

            <TabsContent value="symptoms" className="space-y-4">
              <SymptomTracker patient={currentPatient} />
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4">
              <ExerciseLibrary patient={currentPatient} />
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              {/* Educational Content */}
              <Card className="border-[#0d5c75]/20 bg-white shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#0d5c75] to-[#2a9d8f] text-white">
                  <CardTitle className="font-poppins">Educational Resources</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "Understanding Your Spine",
                        description: "Learn about spinal anatomy and how the Gonstead technique works",
                        duration: "5 min read",
                        type: "article",
                      },
                      {
                        title: "Proper Posture at Work",
                        description: "Video guide on maintaining good posture during daily activities",
                        duration: "8 min video",
                        type: "video",
                      },
                      {
                        title: "Home Care Instructions",
                        description: "Post-treatment care and what to expect after adjustments",
                        duration: "3 min read",
                        type: "article",
                      },
                      {
                        title: "Exercise Progression",
                        description: "How to safely advance your home exercise program",
                        duration: "6 min video",
                        type: "video",
                      },
                    ].map((resource, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-[#F8F5F0] transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${resource.type === "video" ? "bg-red-100" : "bg-blue-100"}`}
                          >
                            {resource.type === "video" ? (
                              <Play className="h-5 w-5 text-red-600" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#0A3A47] font-poppins mb-1">{resource.title}</h4>
                            <p className="text-sm text-gray-600 font-open-sans mb-2">{resource.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#2a9d8f] font-semibold">{resource.duration}</span>
                              <Button size="sm" variant="outline" className="border-[#0d5c75] text-[#0d5c75]">
                                {resource.type === "video" ? "Watch" : "Read"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
