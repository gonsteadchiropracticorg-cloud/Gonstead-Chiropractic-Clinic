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

interface ChiropracticRecommendation {
  id: string
  title: string
  description: string
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
  chiropracticRecommendations: ChiropracticRecommendation[]
  postureProblems: string
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
  paymentStatus: 'pending',
  chiropracticRecommendations: [{ id: '1', title: 'Spinal Adjustment', description: 'Regular chiropractic adjustments as needed' }],
  postureProblems: ""
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
        prescriptionDate: new Date().toISOString().split('T')[0],
        chiropracticRecommendations: parsedData.chiropracticRecommendations || initialPatient.chiropracticRecommendations,
        postureProblems: parsedData.postureProblems || ""
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
      
      // Apply single-page fitting styles
      const prescriptionElement = prescriptionRef.current
      const originalStyles = {
        fontSize: prescriptionElement.style.fontSize,
        lineHeight: prescriptionElement.style.lineHeight,
        padding: prescriptionElement.style.padding
      }
      
      // Enhanced single-page layout logic with improved scaling
      const contentHeight = prescriptionElement.scrollHeight
      const maxHeight = 1120 // Slightly increased A4 height in pixels at 96 DPI for better fit
      
      if (contentHeight > maxHeight) {
        const scaleFactor = Math.max(Math.min(maxHeight / contentHeight, 0.92), 0.72) // Improved scaling range
        
        // Apply comprehensive scaling to all elements
        prescriptionElement.style.fontSize = `${scaleFactor * 100}%`
        prescriptionElement.style.lineHeight = `${scaleFactor * 1.4}`
        prescriptionElement.style.padding = `${scaleFactor * 32}px`
        
        // Scale section spacing dynamically
        const sections = prescriptionElement.querySelectorAll('.mb-6')
        sections.forEach(section => {
          (section as HTMLElement).style.marginBottom = `${scaleFactor * 24}px`
        })
        
        // Scale padding and gaps for better fit
        const contentDivs = prescriptionElement.querySelectorAll('.p-8, .p-6, .p-4, .p-3')
        contentDivs.forEach(div => {
          const currentPadding = parseFloat(window.getComputedStyle(div).padding)
          ;(div as HTMLElement).style.padding = `${currentPadding * scaleFactor}px`
        })
        
        // Scale margins for better spacing
        const marginElements = prescriptionElement.querySelectorAll('.mt-6, .mt-4, .mt-3, .mt-2')
        marginElements.forEach(element => {
          const currentMargin = parseFloat(window.getComputedStyle(element).marginTop)
          ;(element as HTMLElement).style.marginTop = `${currentMargin * scaleFactor}px`
        })
        
        // Scale gaps in grid layouts
        const gridElements = prescriptionElement.querySelectorAll('.gap-6, .gap-4, .gap-3, .gap-2')
        gridElements.forEach(grid => {
          const currentGap = parseFloat(window.getComputedStyle(grid).gap)
          ;(grid as HTMLElement).style.gap = `${currentGap * scaleFactor}px`
        })
        
        // Don't scale footer - keep it fixed at bottom
        const footerElements = prescriptionElement.querySelectorAll('.mt-auto, .footer-fixed')
        footerElements.forEach(footer => {
          (footer as HTMLElement).style.transform = 'none';
          (footer as HTMLElement).style.fontSize = 'inherit';
          (footer as HTMLElement).style.padding = '24px 0';
          (footer as HTMLElement).style.marginTop = 'auto';
        })
        
        // Don't scale professional footer section
        const professionalFooter = prescriptionElement.querySelectorAll('.professional-footer')
        professionalFooter.forEach(footer => {
          (footer as HTMLElement).style.transform = 'none';
          (footer as HTMLElement).style.fontSize = 'inherit';
          (footer as HTMLElement).style.padding = '24px 32px';
          (footer as HTMLElement).style.marginTop = '24px';
        })
      }
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 200))
      
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
      
      // Try to fit on single page, if not, use original multi-page logic
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
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
      }
      
      const fileName = `Prescription_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      // Restore original styles
      prescriptionElement.style.fontSize = originalStyles.fontSize
      prescriptionElement.style.lineHeight = originalStyles.lineHeight
      prescriptionElement.style.padding = originalStyles.padding
      
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
    try {
      // Hide editing controls for print
      const editingElements = document.querySelectorAll('.editing-controls')
      editingElements.forEach(el => (el as HTMLElement).style.display = 'none')
      
      // Add print-specific styles
      const printStyles = document.createElement('style')
      printStyles.innerHTML = `
        @media print {
          @page { margin: 0.5in; size: A4; }
          .editing-controls { display: none !important; }
          header { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `
      document.head.appendChild(printStyles)
      
      // Wait for styles to apply and ensure DOM is ready
      setTimeout(() => {
        try {
          window.print()
        } catch (printError) {
          console.error('Print execution error:', printError)
          alert('Print failed. Please try the PDF download option instead.')
        }
        
        // Clean up after print with error handling
        setTimeout(() => {
          try {
            editingElements.forEach(el => (el as HTMLElement).style.display = '')
            if (document.head.contains(printStyles)) {
              document.head.removeChild(printStyles)
            }
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError)
          }
        }, 1000)
      }, 200)
    } catch (error) {
      console.error('Print error:', error)
      alert('Print failed. Please try the PDF download option instead.')
    }
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

  const handleChiropracticRecommendationChange = (index: number, field: 'title' | 'description', value: string) => {
    const recommendations = [...patient.chiropracticRecommendations]
    recommendations[index] = { ...recommendations[index], [field]: value }
    setPatient({ ...patient, chiropracticRecommendations: recommendations })
  }

  const addChiropracticRecommendation = () => {
    const newRecommendation: ChiropracticRecommendation = {
      id: Date.now().toString(),
      title: '',
      description: ''
    }
    setPatient({ 
      ...patient, 
      chiropracticRecommendations: [...patient.chiropracticRecommendations, newRecommendation]
    })
  }

  const removeChiropracticRecommendation = (index: number) => {
    const recommendations = patient.chiropracticRecommendations.filter((_, i) => i !== index)
    setPatient({ ...patient, chiropracticRecommendations: recommendations })
  }

  return (
    <div className="min-h-screen bg-[rgb(220,230,229)]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] text-white shadow-2xl">
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
                  <div className="w-16 h-16 relative">
                    <Image
                      src="/images/gonstead-logo-new.png"
                      alt="Gonstead Chiropractic Logo"
                      fill
                      className="object-contain"
                      priority
                      onError={(e) => {
                        console.error('Logo failed to load:', e);
                        // Try fallback logo
                        e.currentTarget.src = '/images/gonstead-chiropractic-logo-new.png';
                      }}
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
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : '')}
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

              {/* Chiropractic Care Recommendations */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold text-[#0d5c75]">Chiropractic Care Recommendations</Label>
                  <Button
                    onClick={addChiropracticRecommendation}
                    className="bg-[#2a9d8f] hover:bg-[#238a7a] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recommendation
                  </Button>
                </div>
                
                {patient.chiropracticRecommendations.map((recommendation, index) => (
                  <Card key={recommendation.id} className="mb-4 border-[#0d5c75]/20">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-[#0d5c75]">Title *</Label>
                          <Input
                            value={recommendation.title}
                            onChange={(e) => handleChiropracticRecommendationChange(index, 'title', e.target.value)}
                            className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75]"
                            placeholder="e.g., Spinal Adjustment"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => removeChiropracticRecommendation(index)}
                            variant="destructive"
                            className="w-full"
                            disabled={patient.chiropracticRecommendations.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-sm font-semibold text-[#0d5c75]">Description</Label>
                        <Textarea
                          value={recommendation.description}
                          onChange={(e) => handleChiropracticRecommendationChange(index, 'description', e.target.value)}
                          className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[80px]"
                          placeholder="e.g., Regular chiropractic adjustments as needed for spinal alignment"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Posture Problems */}
              <div className="mt-6">
                <Label className="text-sm font-semibold text-[#0d5c75]">Posture Problems (Optional)</Label>
                <Textarea
                  value={patient.postureProblems}
                  onChange={(e) => handleInputChange('postureProblems', e.target.value)}
                  className="mt-1 border-[#0d5c75]/30 focus:border-[#0d5c75] min-h-[100px]"
                  placeholder="Enter any posture-related problems or observations"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prescription Display */}
        <div ref={prescriptionRef} className="bg-white shadow-2xl border border-[#0d5c75]/20 rounded-lg overflow-hidden min-h-[297mm] flex flex-col">
          {/* Professional Prescription Header - Outstanding & Eye-Catching */}
          <div className="relative bg-gradient-to-br from-[#0d5c75] via-[#1a6b7a] to-[#2a9d8f] px-0 py-0 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full animate-pulse"></div>
                <div className="absolute top-20 right-20 w-16 h-16 border-2 border-[#f3a800]/30 rounded-full animate-pulse delay-1000"></div>
                <div className="absolute bottom-10 left-1/3 w-12 h-12 border-2 border-white/15 rounded-full animate-pulse delay-2000"></div>
                <div className="absolute bottom-20 right-1/4 w-14 h-14 border-2 border-[#f3a800]/20 rounded-full animate-pulse delay-3000"></div>
              </div>
            </div>
            
            {/* Premium Top Border */}
            <div className="h-2 bg-gradient-to-r from-[#f3a800] via-[#ffd700] to-[#f3a800] shadow-lg"></div>
            
            {/* Main Header Content */}
            <div className="relative z-10 px-8 py-8">
              {/* Top Section - Clinic Branding */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-8">
                  {/* Premium Logo Section - Maximum Enlarged */}
                  <div className="relative">
                    <div className="w-80 h-80 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
                      <div className="w-76 h-76 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Image
                          src="/images/gonstead-logo-new.png"
                          alt="Gonstead Chiropractic Logo"
                          width={350}
                          height={350}
                          className="object-contain filter drop-shadow-2xl"
                          priority
                          onError={(e) => {
                            console.error('Logo failed to load:', e);
                            e.currentTarget.src = '/images/gonstead-chiropractic-logo-new.png';
                          }}
                        />
                      </div>
                    </div>
                    {/* Logo Glow Effect */}
                    <div className="absolute inset-0 w-80 h-80 bg-[#f3a800]/20 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Main Title & Branding */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-12 bg-gradient-to-b from-[#f3a800] to-[#ffd700] rounded-full shadow-lg"></div>
                      <div>
                        <h1 className="text-4xl font-black font-poppins text-white tracking-wide drop-shadow-2xl">
                          GONSTEAD CHIROPRACTIC
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-8 h-0.5 bg-gradient-to-r from-[#f3a800] to-transparent"></div>
                          <p className="text-lg font-bold text-[#f3a800] tracking-widest drop-shadow-lg">
                            PROFESSIONAL CLINIC
                          </p>
                          <div className="w-8 h-0.5 bg-gradient-to-l from-[#f3a800] to-transparent"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Specialty Badge */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="bg-gradient-to-r from-[#f3a800] to-[#ffd700] px-4 py-1 rounded-full shadow-lg border border-white/30">
                        <p className="text-xs font-bold text-white tracking-wide">CERTIFIED SPECIALIST</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                        <p className="text-xs font-semibold text-white tracking-wide">LICENSED PRACTITIONER</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Digital Badge & QR Code Area */}
                <div className="text-right space-y-3">
                  <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-4 shadow-2xl">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-sm font-bold text-white tracking-wide">DIGITAL PRESCRIPTION</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/80 font-medium">Secure • Verified • Professional</p>
                    </div>
                  </div>
                  
                  {/* Premium Status Indicator */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-[#f3a800] to-[#ffd700] px-4 py-2 rounded-full shadow-lg border-2 border-white/30">
                      <p className="text-xs font-black text-white tracking-widest">PREMIUM HEALTHCARE</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Doctor Information Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/30 p-6 shadow-2xl mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Doctor Avatar/Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-[#f3a800] to-[#ffd700] rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Doctor Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold font-poppins text-white tracking-wide drop-shadow-lg">
                          Bashir Khan Chiropractic
                        </h2>
                        <div className="bg-green-500 px-2 py-1 rounded-full">
                          <p className="text-xs font-bold text-white">VERIFIED</p>
                        </div>
                      </div>
                      <p className="text-white/90 text-lg font-semibold tracking-wide">
                        Gonstead Certified Specialist
                      </p>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span className="bg-white/20 px-2 py-1 rounded-full font-medium">MBBS</span>
                        <span className="bg-white/20 px-2 py-1 rounded-full font-medium">DC (Chiropractic)</span>
                        <span className="bg-white/20 px-2 py-1 rounded-full font-medium">Board Certified</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Professional Certifications */}
                  <div className="text-right space-y-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-sm font-semibold text-white">Active License</p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-3 h-3 bg-[#f3a800] rounded-full animate-pulse delay-500"></div>
                      <p className="text-sm font-semibold text-white">Professional Excellence</p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
                      <p className="text-sm font-semibold text-white">Continuing Education</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Clinic Contact Information */}
              <div className="bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-sm rounded-xl border border-white/30 p-6 shadow-2xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#f3a800] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      Clinic Address
                    </h3>
                    <div className="space-y-2 text-white/90">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#f3a800] rounded-full"></span>
                        Near Peshawar Model School, Tehsil Road
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-white/60 rounded-full"></span>
                        Nowshera, Khyber Pakhtunkhwa
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#f3a800] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-white/90">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Phone: +92 304 699 6267
                      </p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        Email: gonsteadchiropractic.org@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Prescription Details Bar */}
              <div className="bg-gradient-to-r from-[#f3a800] to-[#ffd700] rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">MEDICAL PRESCRIPTION</h3>
                      <p className="text-sm text-white/80 font-medium">Professional Healthcare Document</p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <p className="text-sm font-bold text-white">
                        Prescription ID: RX-{String(Math.floor(Math.random() * 100000)).padStart(5, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Premium Bottom Border */}
            <div className="h-2 bg-gradient-to-r from-[#f3a800] via-[#ffd700] to-[#f3a800] shadow-lg"></div>
          </div>

          {/* Prescription Content */}
          <div className="p-8 flex-1 flex flex-col">
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
              </div>
            </div>

            {/* Diagnosis & Symptoms - Strict Conditional Rendering */}
            {(patient.diagnosis?.trim() || patient.symptoms?.trim()) && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {patient.diagnosis?.trim() && (
                    <div>
                      <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Diagnosis</h3>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-800">{patient.diagnosis.trim()}</p>
                      </div>
                    </div>
                  )}
                  {patient.symptoms?.trim() && (
                    <div>
                      <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Symptoms</h3>
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-gray-800">{patient.symptoms.trim()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medications - Strict Conditional Rendering */}
            {patient.medications.filter(med => 
              med.medication?.trim() && 
              (med.dosage?.trim() || med.frequency?.trim() || med.duration?.trim() || med.instructions?.trim())
            ).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0d5c75] mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescribed Medications
                </h3>
                <div className="space-y-4">
                  {patient.medications.filter(med => 
                    med.medication?.trim() && 
                    (med.dosage?.trim() || med.frequency?.trim() || med.duration?.trim() || med.instructions?.trim())
                  ).map((medication, index) => (
                    <div key={index} className="p-4 border border-[#0d5c75]/20 rounded-lg bg-green-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#0d5c75] text-lg">{index + 1}. {medication.medication}</h4>
                        <div className="text-right text-sm text-gray-600">
                          {medication.dosage?.trim() && <p><span className="font-semibold">Dosage:</span> {medication.dosage}</p>}
                          {medication.frequency?.trim() && <p><span className="font-semibold">Frequency:</span> {medication.frequency}</p>}
                          {medication.duration?.trim() && <p><span className="font-semibold">Duration:</span> {medication.duration}</p>}
                        </div>
                      </div>
                      {medication.instructions?.trim() && (
                        <div className="mt-2 p-2 bg-white rounded border border-[#0d5c75]/10">
                          <p className="text-sm text-gray-700"><span className="font-semibold">Instructions:</span> {medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chiropractic Care Recommendations - Strict Conditional Rendering */}
            {patient.chiropracticRecommendations.filter(rec => 
              rec.title?.trim() && rec.description?.trim()
            ).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0d5c75] mb-4 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Chiropractic Care Recommendations
                </h3>
                <div className="space-y-4">
                  {patient.chiropracticRecommendations.filter(rec => 
                    rec.title?.trim() && rec.description?.trim()
                  ).map((recommendation, index) => (
                    <div key={recommendation.id} className="p-4 border border-[#0d5c75]/20 rounded-lg bg-blue-50">
                      <h4 className="font-bold text-[#0d5c75] text-lg mb-2">{index + 1}. {recommendation.title}</h4>
                      <p className="text-sm text-gray-700">{recommendation.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posture Problems Section - Strict Conditional Rendering */}
            {patient.postureProblems?.trim() && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0d5c75] mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Posture Problems
                </h3>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-800">{patient.postureProblems.trim()}</p>
                </div>
              </div>
            )}

            {/* Medical Advice & Follow-up - Strict Conditional Rendering */}
            {(patient.advice?.trim() || patient.followUp?.trim()) && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {patient.advice?.trim() && (
                    <div>
                      <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Medical Advice</h3>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-800">{patient.advice.trim()}</p>
                      </div>
                    </div>
                  )}
                  {patient.followUp?.trim() && (
                    <div>
                      <h3 className="text-lg font-bold text-[#0d5c75] mb-2">Follow-up Instructions</h3>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-800">{patient.followUp.trim()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fee Summary - Strict Conditional Rendering */}
            {patient.feeDetails.filter(fee => 
              fee.service?.trim() && fee.amount > 0
            ).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#0d5c75] mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fee Details & Payment Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-[#0d5c75]/20">
                  <div className="space-y-3">
                    {patient.feeDetails.filter(fee => 
                      fee.service?.trim() && fee.amount > 0
                    ).map((fee, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#0d5c75]">{fee.service}</h4>
                          {fee.description?.trim() && <p className="text-sm text-gray-600">{fee.description}</p>}
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
            )}

            {/* Footer - Fixed Position */}
            <div className="mt-auto pt-6 border-t border-[#0d5c75]/20 footer-fixed">
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
                  <p className="font-bold text-[#0d5c75]">Bashir Khan Chiropractic</p>
                  <p className="text-sm text-gray-600">Gonstead Certified Specialist</p>
                </div>
              </div>
            </div>
            
            {/* Professional Footer Section matching Header */}
            <div className="mt-6 bg-gradient-to-br from-[#0d5c75] to-[#2a9d8f] px-8 py-6 rounded-lg professional-footer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Professional Logo Section */}
                  <div className="relative">
                    <div className="w-16 h-16 flex items-center justify-center">
                      <Image
                        src="/images/gonstead-logo-new.png"
                        alt="Gonstead Chiropractic Logo"
                        width={55}
                        height={55}
                        className="object-contain filter drop-shadow-lg"
                        priority
                        onError={(e) => {
                          console.error('Logo failed to load:', e);
                          // Try fallback logo
                          e.currentTarget.src = '/images/gonstead-chiropractic-logo-new.png';
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Footer Clinic Information */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold font-poppins text-white tracking-wide">
                      GONSTEAD CHIROPRACTIC CLINIC
                    </h2>
                    <p className="text-white/90 text-base font-semibold">
                      Bashir Khan Chiropractic - Gonstead Technique Specialist
                    </p>
                    <p className="text-white/80 text-sm font-medium">
                      Near Peshawar Model School, Tehsil Road, Nowshera
                    </p>
                    <p className="text-white/80 text-sm font-medium">
                      Phone: +92 304 699 6267
                    </p>
                  </div>
                </div>
                
                {/* Professional Badge */}
                <div className="text-right">
                  <div className="bg-[#f3a800] border-2 border-white/30 px-4 py-2 rounded-full shadow-md">
                    <p className="text-sm font-bold text-white tracking-wide">PROFESSIONAL HEALTHCARE</p>
                  </div>
                  <div className="mt-2 text-white/70 text-xs">
                    <p>Licensed • Certified • Trusted</p>
                  </div>
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
