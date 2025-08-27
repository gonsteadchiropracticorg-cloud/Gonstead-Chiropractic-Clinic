"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  Shield,
  Home,
  Stethoscope,
  Download
} from 'lucide-react'

export default function PatientPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const sampleAppointments = [
    {
      id: 'APT-001',
      date: '2024-08-30',
      time: '10:00 AM',
      type: 'In-clinic Gonstead Adjustment',
      status: 'Confirmed',
      doctor: 'Dr. Bashir Khan'
    },
    {
      id: 'APT-002',
      date: '2024-09-05',
      time: '2:30 PM',
      type: 'Follow-up Video Consultation',
      status: 'Pending',
      doctor: 'Dr. Bashir Khan'
    }
  ]

  const samplePrescriptions = [
    {
      id: 'PRESC-001',
      date: '2024-08-25',
      diagnosis: 'Lower Back Pain, Spinal Misalignment',
      treatment: 'Gonstead spinal adjustment, Ice therapy',
      sessions: '8 sessions recommended',
      status: 'Active'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#245064] to-[#2e6478] text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/images/gonstead-chiropractic-logo-new.png" 
                alt="Gonstead Logo" 
                className="h-12 w-12 rounded-full bg-white/10 p-1"
              />
              <div>
                <h1 className="text-2xl font-bold">Patient Portal</h1>
                <p className="text-white/80">Gonstead Chiropractic Clinic</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="ghost" 
              className="text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-md">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: User },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
              { id: 'book', label: 'Book Appointment', icon: Stethoscope }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-[#245064] text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-[#245064]" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Ahmad Hassan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">+92 300 1234567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">ahmad.hassan@email.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#245064]" />
                  Next Appointment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">August 30, 2024 at 10:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">In-clinic Gonstead Adjustment</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 mt-2">
                    Confirmed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#245064]" />
                  Treatment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Current Condition:</p>
                    <p className="text-sm text-gray-600">Lower Back Pain</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Progress:</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-[#245064] h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">5 of 8 sessions completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#245064]" />
                  Your Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{appointment.type}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {appointment.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {appointment.doctor}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={appointment.status === 'Confirmed' ? 'secondary' : 'outline'}
                          className={appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#245064]" />
                  Your Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {samplePrescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Prescription #{prescription.id}</h3>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {prescription.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Date:</span>
                              <span className="ml-2 text-gray-600">{prescription.date}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Diagnosis:</span>
                              <span className="ml-2 text-gray-600">{prescription.diagnosis}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Treatment:</span>
                              <span className="ml-2 text-gray-600">{prescription.treatment}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Sessions:</span>
                              <span className="ml-2 text-gray-600">{prescription.sessions}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            View Digital
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Book Appointment Tab */}
        {activeTab === 'book' && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#245064]" />
                Book New Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Appointment Type</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>In-clinic Gonstead Adjustment</option>
                    <option>Video Consultation</option>
                    <option>Follow-up Session</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Date</label>
                    <input type="date" className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Time</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>09:00 AM</option>
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>02:00 PM</option>
                      <option>03:00 PM</option>
                      <option>04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason for Visit</label>
                  <textarea 
                    className="w-full p-2 border rounded-md" 
                    rows={3}
                    placeholder="Please describe your symptoms or reason for the appointment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Urgency Level</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Normal</option>
                    <option>Urgent</option>
                    <option>Emergency</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-[#245064] hover:bg-[#1d4052]">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Clinic
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-12 mb-8">
        <Card className="max-w-4xl mx-auto border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-medium">Secure Patient Portal</p>
                <p className="text-xs text-green-700">
                  Your medical information is protected with end-to-end encryption and HIPAA compliance.
                  All prescriptions accessed through QR codes are validated and secure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
