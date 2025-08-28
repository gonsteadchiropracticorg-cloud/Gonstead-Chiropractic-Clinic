"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QrCode, Copy, Download, AlertTriangle, CheckCircle2, Eye } from 'lucide-react'

export default function QRGeneratorPage() {
  const [formData, setFormData] = useState({
    prescription_id: '',
    patient_id: '',
    patient_name: '',
    phone_number: '',
    appointment_id: '',
    doctor_name: 'Dr. Bashir Khan',
    clinic_name: 'GONSTEAD CHIROPRACTIC CLINIC',
    visit_date: new Date().toISOString().split('T')[0],
    treatment_plan: '',
    prescribed_medicine: ''
  })
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [jsonData, setJsonData] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const [generating, setGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('form')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateQRCode = async () => {
    // Validate required fields
    if (!formData.prescription_id || !formData.patient_id || !formData.patient_name || !formData.phone_number) {
      setError('Please fill in all required fields (Prescription ID, Patient ID, Name, and Phone)')
      return
    }

    setGenerating(true)
    setError('')

    try {
      // Create the prescription data
      const prescriptionData = {
        ...formData,
        generated_at: new Date().toISOString(),
        type: 'prescription_qr',
        version: '3.0'
      }

      const jsonString = JSON.stringify(prescriptionData, null, 2)
      setJsonData(jsonString)

      // Generate QR code using online API
      const encodedData = encodeURIComponent(jsonString)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedData}&color=245064&bgcolor=FFFFFF&margin=10`
      
      // Test if the QR code loads
      const img = new Image()
      img.onload = () => {
        setQrCodeUrl(qrUrl)
        setActiveTab('result')
        setGenerating(false)
      }
      img.onerror = () => {
        setError('Failed to generate QR code. Please try again or use the text format.')
        setActiveTab('result')
        setGenerating(false)
      }
      img.src = qrUrl

    } catch (err) {
      console.error('QR generation error:', err)
      setError('Failed to generate QR code. Data is still available in text format.')
      setActiveTab('result')
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `prescription-${formData.prescription_id}-qr.png`
      link.href = qrCodeUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const loadSampleData = () => {
    setFormData({
      prescription_id: `PRESC-${Date.now()}`,
      patient_id: `PAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      patient_name: 'Ahmad Hassan',
      phone_number: '+92 300 1234567',
      appointment_id: `APT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      doctor_name: 'Dr. Bashir Khan',
      clinic_name: 'GONSTEAD CHIROPRACTIC CLINIC',
      visit_date: new Date().toISOString().split('T')[0],
      treatment_plan: 'Gonstead spinal adjustment for lower back pain. Apply ice therapy for 15 minutes twice daily.',
      prescribed_medicine: 'Ibuprofen 400mg - Take twice daily after meals for 5 days.'
    })
  }

  const getFormattedText = () => {
    return `
PRESCRIPTION DETAILS
====================
Prescription ID: ${formData.prescription_id}
Patient ID: ${formData.patient_id}
Patient Name: ${formData.patient_name}
Phone Number: ${formData.phone_number}
Appointment ID: ${formData.appointment_id}
Doctor: ${formData.doctor_name}
Clinic: ${formData.clinic_name}
Visit Date: ${formData.visit_date}
Generated: ${new Date().toLocaleString()}
====================

Treatment Plan:
${formData.treatment_plan}

Prescribed Medicine:
${formData.prescribed_medicine}

====================
GONSTEAD CHIROPRACTIC CLINIC
Near Peshawar Model School, Tehsil Road Nowshera, KPK
Phone: +923046996267
====================
    `.trim()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <QrCode className="h-8 w-8 text-[#245064]" />
            Prescription QR Code Generator
          </h1>
          <p className="text-gray-600">Generate QR codes for prescription data - Simple & Reliable</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="form">Enter Prescription Data</TabsTrigger>
            <TabsTrigger value="result">QR Code Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>Prescription Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prescription_id">Prescription ID *</Label>
                    <Input
                      id="prescription_id"
                      name="prescription_id"
                      placeholder="e.g., PRESC-001234"
                      value={formData.prescription_id}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">Patient ID *</Label>
                    <Input
                      id="patient_id"
                      name="patient_id"
                      placeholder="e.g., PAT-5678"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patient_name">Patient Name *</Label>
                    <Input
                      id="patient_name"
                      name="patient_name"
                      placeholder="e.g., Ahmad Hassan"
                      value={formData.patient_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      placeholder="e.g., +92 300 1234567"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appointment_id">Appointment ID</Label>
                    <Input
                      id="appointment_id"
                      name="appointment_id"
                      placeholder="e.g., APT-9999"
                      value={formData.appointment_id}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="visit_date">Visit Date</Label>
                    <Input
                      id="visit_date"
                      name="visit_date"
                      type="date"
                      value={formData.visit_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doctor_name">Doctor Name</Label>
                    <Input
                      id="doctor_name"
                      name="doctor_name"
                      value={formData.doctor_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Clinic Name</Label>
                    <Input
                      id="clinic_name"
                      name="clinic_name"
                      value={formData.clinic_name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="treatment_plan">Treatment Plan</Label>
                  <Textarea
                    id="treatment_plan"
                    name="treatment_plan"
                    placeholder="Describe the treatment plan..."
                    rows={3}
                    value={formData.treatment_plan}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prescribed_medicine">Prescribed Medicine</Label>
                  <Textarea
                    id="prescribed_medicine"
                    name="prescribed_medicine"
                    placeholder="List prescribed medications and instructions..."
                    rows={3}
                    value={formData.prescribed_medicine}
                    onChange={handleInputChange}
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={generateQRCode} 
                    disabled={generating}
                    className="bg-[#245064] hover:bg-[#1e3f4f]"
                  >
                    {generating ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                  <Button onClick={loadSampleData} variant="outline">
                    Load Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="result">
            <Card>
              <CardHeader>
                <CardTitle>Generated QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                {!jsonData ? (
                  <div className="text-center py-8 text-gray-500">
                    <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No QR code generated yet. Go to the form tab to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* QR Code Display */}
                    {qrCodeUrl ? (
                      <div className="text-center">
                        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                          <img 
                            src={qrCodeUrl} 
                            alt="Prescription QR Code" 
                            className="mx-auto"
                            style={{ maxWidth: '400px', height: 'auto' }}
                          />
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                          <p className="font-semibold text-green-700">✅ QR Code Generated Successfully!</p>
                          <p>Contains: Prescription ID, Patient ID, Name, Phone & more</p>
                        </div>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button onClick={downloadQR} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PNG
                          </Button>
                          <Button 
                            onClick={() => copyToClipboard(jsonData)} 
                            variant="outline" 
                            size="sm"
                          >
                            {copySuccess ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Data
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-700 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          QR Code Display Failed
                        </div>
                        <p className="text-yellow-600 text-sm">The QR code image couldn't be generated, but your data is available below in text format.</p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <div className="animate-pulse">
                          <div className="bg-blue-200 h-64 w-64 mx-auto rounded-lg mb-4"></div>
                          <p className="text-blue-700">Generating QR code...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Text Format Display */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Prescription Details (Text Format)
                      </h3>
                      <div className="bg-white border border-gray-300 rounded p-4 mb-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {getFormattedText()}
                        </pre>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(getFormattedText())} 
                        variant="outline" 
                        size="sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text Format
                      </Button>
                    </div>
                    
                    {/* JSON Data Display */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Raw JSON Data (what's in the QR code):</h4>
                      <div className="bg-white border border-blue-300 rounded p-3 max-h-48 overflow-y-auto">
                        <pre className="text-xs text-blue-900 whitespace-pre-wrap">
                          {jsonData}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
