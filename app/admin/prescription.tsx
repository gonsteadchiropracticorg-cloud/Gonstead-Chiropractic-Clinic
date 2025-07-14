"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Download, 
  Printer, 
  Edit, 
  Save, 
  ArrowLeft, 
  Plus,
  Trash2,
  FileText,
  Stethoscope,
  Calendar
} from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Image from "next/image"

interface PrescriptionMedication {
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface FeeDetail {
  service: string
  description: string
  amount: number
  quantity: number
  total: number
}

interface PrescriptionPatient {
  id: string
  name: string
  age?: number
  gender?: string
  phone: string
  email?: string
  address?: string
  diagnosis: string
  symptoms: string
  medications: PrescriptionMedication[]
  advice: string
  followUp: string
  prescriptionDate: string
  feeDetails: FeeDetail[]
  totalFee: number
  paymentStatus: 'pending' | 'partial' | 'paid'
}

const initialPatient: PrescriptionPatient = {
  id: "",
  name: "",
  phone: "",
  diagnosis: "",
  symptoms: "",
  medications: [{ medication: "", dosage: "", frequency: "", duration: "", instructions: "" }],
  advice: "",
  followUp: "",
  prescriptionDate: new Date().toISOString().split('T')[0],
  feeDetails: [{ service: "Consultation", description: "Initial Gonstead Assessment", amount: 3000, quantity: 1, total: 3000 }],
  totalFee: 3000,
  paymentStatus: 'pending'
}

export default function PrescriptionPage() {
  const [patient, setPatient] = useState<PrescriptionPatient>(initialPatient)
  const [isEditing, setIsEditing] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const prescriptionRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const patientData = localStorage.getItem('prescriptionPatient')
    if (patientData) {
      const parsedData = JSON.parse(patientData)
      setPatient({
        ...initialPatient,
        ...parsedData,
        medications: parsedData.medications || initialPatient.medications,
        prescriptionDate: new Date().toISOString().split('T')[0]
      })
    }
  }, [])

  const handleDownloadPDF = async () => {
    if (!prescriptionRef.current) return
    
    setIsGeneratingPDF(true)
    try {
      // Hide editing controls for PDF
      const editingElements = document.querySelectorAll('.editing-controls')
      editingElements.forEach(el => (el as HTMLElement).style.display = 'none')
      
      // Wait for element to be hidden
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(prescriptionRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: prescriptionRef.current.scrollWidth,
        height: prescriptionRef.current.scrollHeight
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const fileName = `Prescription_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      // Show editing controls again
      editingElements.forEach(el => (el as HTMLElement).style.display = '')
      
      // Show success message
      alert('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrint = () => {
    // Hide editing controls for print
    const editingElements = document.querySelectorAll('.editing-controls')
    editingElements.forEach(el => (el as HTMLElement).style.display = 'none')
    
    window.print()
    
    // Show editing controls again after print
    setTimeout(() => {
      editingElements.forEach(el => (el as HTMLElement).style.display = '')
    }, 1000)
  }

  const handleInputChange = (field: keyof PrescriptionPatient, value: string | number) => {
    setPatient({ ...patient, [field]: value })
  }

  const handleMedicationChange = (index: number, field: keyof PrescriptionMedication, value: string) => {
    const medications = [...patient.medications]
    medications[index] = { ...medications[index], [field]: value }
    setPatient({ ...patient, medications })
  }

  const handleFeeChange = (index: number, field: keyof FeeDetail, value: string | number) => {
    const feeDetails = [...patient.feeDetails]
    feeDetails[index] = { ...feeDetails[index], [field]: value }
    
    // Recalculate total for this fee item
    if (field === 'amount' || field === 'quantity') {
      feeDetails[index].total = feeDetails[index].amount * feeDetails[index].quantity
    }
    
    // Recalculate total fee
    const totalFee = feeDetails.reduce((sum, fee) => sum + fee.total, 0)
    
    setPatient({ ...patient, feeDetails, totalFee })
  }

  const addMedication = () => {
    setPatient({ 
      ...patient, 
      medications: [...patient.medications, { medication: "", dosage: "", frequency: "", duration: "", instructions: "" }]
    })
  }

  const removeMedication = (index: number) => {
    const medications = patient.medications.filter((_, i) => i !== index)
    setPatient({ ...patient, medications })
  }

  const addFeeDetail = () => {
    const newFee: FeeDetail = { service: "", description: "", amount: 0, quantity: 1, total: 0 }
    setPatient({ 
      ...patient, 
      feeDetails: [...patient.feeDetails, newFee]
    })
  }

  const removeFeeDetail = (index: number) => {
    const feeDetails = patient.feeDetails.filter((_, i) => i !== index)
    const totalFee = feeDetails.reduce((sum, fee) => sum + fee.total, 0)
    setPatient({ ...patient, feeDetails, totalFee })
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)]">
      {/* Header */}
      <header className="bg-[rgb(58,121,130)] text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              
              <div className="h-8 w-px bg-white/30"></div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 relative">
                    <Image
                      src="/images/gonstead-chiropractic-logo-new.png"
                      alt="Gonstead Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-poppins">
                    Digital Prescription
                  </h1>
                  <p className="text-white/80 text-sm">
                    Professional Medical Prescription System
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 editing-controls">
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {isGeneratingPDF ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {isEditing ? (
                  <><Save className="h-4 w-4 mr-2" />Save</>
                ) : (
                  <><Edit className="h-4 w-4 mr-2" />Edit</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Editing Form */}
        {isEditing && (
          <Card className="mb-8 border-[#0d5c75]/20 shadow-xl editing-controls">
            <CardHeader className="bg-gradient-to-r from-[#f3a800] to-[#e07c1c] text-white">
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Patient Name *</Label>
                  <Input
                    value={patient.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Age</Label>
                  <Input
                    type="number"
                    value={patient.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || undefined)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Gender</Label>
                  <select
                    value={patient.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#0d5c75]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Phone *</Label>
                  <Input
                    value={patient.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Email</Label>
                  <Input
                    type="email"
                    value={patient.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Prescription Date</Label>
                  <Input
                    type="date"
                    value={patient.prescriptionDate}
                    onChange={(e) => handleInputChange('prescriptionDate', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Diagnosis *</Label>
                  <Textarea
                    value={patient.diagnosis}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[80px]"
                    placeholder="Enter diagnosis"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Symptoms</Label>
                  <Textarea
                    value={patient.symptoms}
                    onChange={(e) => handleInputChange('symptoms', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[80px]"
                    placeholder="Enter symptoms"
                  />
                </div>
              </div>

              {/* Medications */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold text-[#0d5c75]">Medications</Label>
                  <Button
                    onClick={addMedication}
                    className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
                
                {patient.medications.map((medication, index) => (
                  <Card key={index} className="mb-4 border-[#0d5c75]/20">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Medication *</Label>
                          <Input
                            value={medication.medication}
                            onChange={(e) => handleMedicationChange(index, 'medication', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="e.g., Ibuprofen"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Dosage *</Label>
                          <Input
                            value={medication.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="e.g., 400mg"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Frequency *</Label>
                          <Input
                            value={medication.frequency}
                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="e.g., 3 times daily"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Duration</Label>
                          <Input
                            value={medication.duration}
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => removeMedication(index)}
                            variant="destructive"
                            className="w-full"
                            disabled={patient.medications.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-sm font-semibold text-[#0d5c75]">Special Instructions</Label>
                        <Textarea
                          value={medication.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[60px]"
                          placeholder="e.g., Take with food, avoid alcohol"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Fee Details */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold text-[#0d5c75]">Fee Details</Label>
                  <Button
                    onClick={addFeeDetail}
                    className="bg-[#f3a800] hover:bg-[#e07c1c] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
                
                {patient.feeDetails.map((fee, index) => (
                  <Card key={index} className="mb-4 border-[#0d5c75]/20">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Service *</Label>
                          <Input
                            value={fee.service}
                            onChange={(e) => handleFeeChange(index, 'service', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="e.g., Consultation"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Description</Label>
                          <Input
                            value={fee.description}
                            onChange={(e) => handleFeeChange(index, 'description', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="Service description"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Amount (PKR) *</Label>
                          <Input
                            type="number"
                            value={fee.amount}
                            onChange={(e) => handleFeeChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={fee.quantity}
                            onChange={(e) => handleFeeChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Total (PKR)</Label>
                          <Input
                            value={`₨ ${fee.total.toLocaleString()}`}
                            readOnly
                            className="mt-1 bg-gray-100 font-bold text-[#0d5c75]"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => removeFeeDetail(index)}
                            variant="destructive"
                            className="w-full"
                            disabled={patient.feeDetails.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Total Fee Summary */}
                <Card className="border-[#f3a800]/30 bg-[#f3a800]/5">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-lg font-bold text-[#0d5c75]">Total Fee:</Label>
                      <span className="text-2xl font-bold text-[#f3a800]">₨ {patient.totalFee.toLocaleString()}</span>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-[#0d5c75]">Payment Status</Label>
                      <select
                        value={patient.paymentStatus}
                        onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-[#0d5c75]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d5c75] focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="partial">Partial Payment</option>
                        <option value="paid">Fully Paid</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Medical Advice</Label>
                  <Textarea
                    value={patient.advice}
                    onChange={(e) => handleInputChange('advice', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[100px]"
                    placeholder="Enter medical advice and recommendations"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#0d5c75]">Follow-up Instructions</Label>
                  <Textarea
                    value={patient.followUp}
                    onChange={(e) => handleInputChange('followUp', e.target.value)}
                    className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[100px]"
                    placeholder="Enter follow-up instructions"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prescription Display */}
        <div ref={prescriptionRef} className="bg-white shadow-2xl border border-[#0d5c75]/20 rounded-lg overflow-hidden">
          {/* Professional Prescription Header */}
          <div className="bg-[rgb(58,121,130)] px-8 py-6 relative">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                {/* Professional Logo Section */}
                <div className="relative">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl border-2 border-white/30">
                    <Image
                      src="/images/gonstead-chiropractic-logo-new.png"
                      alt="Gonstead Chiropractic Logo"
                      width={70}
                      height={70}
                      className="object-contain filter drop-shadow-lg"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#f3a800] rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Doctor Information */}
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold font-poppins text-white tracking-wide">
                    Bashir Khan Chiropractic
                  </h1>
                  <p className="text-white/90 text-lg font-semibold">
                    Gonstead Certified Specialist
                  </p>
                  <p className="text-white/80 text-sm font-medium">
                    MBBS, DC (Chiropractic) • Licensed Practitioner
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-[#f3a800] rounded-full"></div>
                    <p className="text-xs text-white/70">Board Certified • Professional Excellence</p>
                  </div>
                </div>
              </div>
              
              {/* Clinic Information */}
              <div className="text-right space-y-2">
                <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-white/30">
                  <p className="text-sm font-bold tracking-wide">GONSTEAD CHIROPRACTIC CLINIC</p>
                </div>
                <div className="space-y-1 text-white/90">
                  <p className="text-sm font-medium flex items-center justify-end gap-2">
                    <span className="w-2 h-2 bg-white/60 rounded-full"></span>
                    Near Peshawar Model School, Tehsil Road
                  </p>
                  <p className="text-sm font-medium flex items-center justify-end gap-2">
                    <span className="w-2 h-2 bg-[#f3a800] rounded-full"></span>
                    Nowshera, Khyber Pakhtunkhwa
                  </p>
                  <p className="text-sm font-medium flex items-center justify-end gap-2">
                    <span className="w-2 h-2 bg-white/60 rounded-full"></span>
                    Phone: +92 304 699 6267
                  </p>
                  <p className="text-sm font-medium flex items-center justify-end gap-2">
                    <span className="w-2 h-2 bg-white/60 rounded-full"></span>
                    Email: gonsteadchiropractic.org@gmail.com
                  </p>
                </div>
                
                {/* Professional Badge */}
                <div className="mt-3 inline-block">
                  <div className="bg-[#f3a800] border-2 border-white/30 px-3 py-1 rounded-full shadow-md">
                    <p className="text-xs font-bold text-white tracking-wide">DIGITAL PRESCRIPTION</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Prescription ID and Date */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                <p className="text-sm font-medium text-white/80">
                  Prescription ID: RX-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(new Date().getDate()).padStart(2, '0')}-{String(Math.floor(Math.random() * 1000)).padStart(3, '0')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#f3a800] rounded-full"></div>
                <p className="text-sm font-medium text-white/80">
                  Issue Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Prescription Content */}
          <div className="p-8">
            {/* Patient Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-[#0d5c75]/10">
              <h2 className="text-lg font-bold text-[#0d5c75] mb-3 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-[#0d5c75]">Name:</span> {patient.name || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-[#0d5c75]">Age:</span> {patient.age || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-[#0d5c75]">Gender:</span> {patient.gender || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-[#0d5c75]">Phone:</span> {patient.phone || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-[#0d5c75]">Email:</span> {patient.email || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-[#0d5c75]">Date:</span> {new Date(patient.prescriptionDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Diagnosis & Symptoms */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Diagnosis</h3>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-800">{patient.diagnosis || 'No diagnosis specified'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Symptoms</h3>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-800">{patient.symptoms || 'No symptoms specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#0d5c75] mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prescribed Medications
              </h3>
              <div className="space-y-4">
                {patient.medications.filter(med => med.medication).map((medication, index) => (
                  <div key={index} className="p-4 border border-[#0d5c75]/20 rounded-lg bg-green-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-[#0d5c75] text-lg">{index + 1}. {medication.medication}</h4>
                      <div className="text-right text-sm text-gray-600">
                        <p><span className="font-semibold">Dosage:</span> {medication.dosage}</p>
                        <p><span className="font-semibold">Frequency:</span> {medication.frequency}</p>
                        {medication.duration && <p><span className="font-semibold">Duration:</span> {medication.duration}</p>}
                      </div>
                    </div>
                    {medication.instructions && (
                      <div className="mt-2 p-2 bg-white rounded border border-[#0d5c75]/10">
                        <p className="text-sm text-gray-700"><span className="font-semibold">Instructions:</span> {medication.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Advice & Follow-up */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {patient.advice && (
                  <div>
                    <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Medical Advice</h3>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-800">{patient.advice}</p>
                    </div>
                  </div>
                )}
                {patient.followUp && (
                  <div>
                    <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Follow-up Instructions</h3>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-800">{patient.followUp}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#0d5c75] mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fee Details & Payment Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-[#0d5c75]/20">
                <div className="space-y-3">
                  {patient.feeDetails.filter(fee => fee.service).map((fee, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#0d5c75]">{fee.service}</h4>
                        {fee.description && <p className="text-sm text-gray-600">{fee.description}</p>}
                        <p className="text-xs text-gray-500">Quantity: {fee.quantity} × ₨ {fee.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0d5c75]">₨ {fee.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t-2 border-[#0d5c75]/30">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-[#0d5c75]">Total Amount:</h4>
                      <span className="text-xl font-bold text-[#f3a800]">₨ {patient.totalFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-semibold text-[#0d5c75]">Payment Status:</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        patient.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        patient.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {patient.paymentStatus === 'paid' ? 'Fully Paid' :
                         patient.paymentStatus === 'partial' ? 'Partial Payment' : 'Payment Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#0d5c75]/20">
              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-[#0d5c75]">Important Notes:</p>
                  <p>• Take medications as prescribed</p>
                  <p>• Complete the full course of treatment</p>
                  <p>• Contact clinic if any adverse reactions occur</p>
                  <p>• Emergency: +92 304 699 6267</p>
                  <p>• Payment due: As per clinic policy</p>
                </div>
                <div className="text-right">
                  <div className="mb-8">
                    <p className="text-xs text-gray-500">Doctor's Signature</p>
                    <div className="w-32 h-12 border-b border-[#0d5c75]/30 mt-2"></div>
                  </div>
                  <p className="font-bold text-[#0d5c75]">Dr. Bashir Khan</p>
                  <p className="text-sm text-gray-600">Gonstead Certified Specialist</p>
                  <p className="text-xs text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          .editing-controls {
            display: none !important;
          }
          header {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
