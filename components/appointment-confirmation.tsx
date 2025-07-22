"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  FileText,
  Heart,
  Star,
  Stethoscope,
  ArrowRight,
  Camera,
  Download,
  FileDown
} from "lucide-react"
import { useLanguage } from "./language-provider"

interface AppointmentConfirmationProps {
  appointmentData: {
    name: string
    phone: string
    sessionType: string
    preferredTime: string
    appointmentId?: string
  }
  onBackToHome?: () => void
  onNewAppointment?: () => void
}

export function AppointmentConfirmation({ 
  appointmentData, 
  onBackToHome, 
  onNewAppointment 
}: AppointmentConfirmationProps) {
  const { language } = useLanguage()

  const isUrdu = language === "ur"

  const downloadPDF = async () => {
    try {
      const element = document.getElementById('appointment-confirmation-content')
      if (!element) return

      // Clone the element to avoid modifying the original
      const elementClone = element.cloneNode(true) as HTMLElement
      
      // Find and mask doctor's phone number in the clone
      const doctorPhoneElements = elementClone.querySelectorAll('[data-doctor-phone]')
      doctorPhoneElements.forEach(phoneEl => {
        if (phoneEl.textContent) {
          phoneEl.textContent = '+92 30X XXXX XXX'
        }
      })
      
      // Remove action buttons from clone for PDF
      const actionButtons = elementClone.querySelector('.flex.flex-col.sm\\:flex-row')
      if (actionButtons && actionButtons.parentNode) {
        actionButtons.parentNode.removeChild(actionButtons)
      }
      
      // Style the clone for better PDF rendering
      elementClone.style.position = 'absolute'
      elementClone.style.left = '-9999px'
      elementClone.style.top = '0'
      elementClone.style.width = '800px' // Fixed width for consistent rendering
      elementClone.style.padding = '20px'
      elementClone.style.backgroundColor = '#ffffff'
      elementClone.style.fontFamily = 'Arial, sans-serif'
      
      // Temporarily add the clone to the document for html2canvas
      document.body.appendChild(elementClone)

      const canvas = await html2canvas(elementClone, {
        scale: 1.5, // Reduced scale for better fit
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: elementClone.scrollHeight,
        logging: false,
        removeContainer: false
      })

      // Remove the cloned element
      document.body.removeChild(elementClone)

      const imgData = canvas.toDataURL('image/png', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgAspectRatio = canvas.height / canvas.width
      
      // Calculate dimensions to fit on single page with margins
      const maxWidth = pdfWidth - 20 // 10mm margins on each side
      const maxHeight = pdfHeight - 20 // 10mm margins on top and bottom
      
      let finalWidth = maxWidth
      let finalHeight = maxWidth * imgAspectRatio
      
      // If height exceeds page, scale down to fit
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight
        finalWidth = finalHeight / imgAspectRatio
      }
      
      // Center the content on the page
      const xOffset = (pdfWidth - finalWidth) / 2
      const yOffset = (pdfHeight - finalHeight) / 2
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)
      
      const fileName = `appointment-confirmation-${appointmentData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(isUrdu ? 'PDF بناتے وقت خرابی ہوئی' : 'Error generating PDF')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return ""
    const date = new Date(dateTime)
    return date.toLocaleString(isUrdu ? 'ur-PK' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const sessionTypeDisplay = {
    clinic: {
      en: "In-clinic Gonstead Adjustment",
      ur: "کلینک میں گونسٹیڈ ایڈجسٹمنٹ"
    },
    in_clinic: {
      en: "In-clinic Gonstead Adjustment",
      ur: "کلینک میں گونسٹیڈ ایڈجسٹمنٹ"
    },
    video: {
      en: "Emergency Video Consultation",
      ur: "ایمرجنسی ویڈیو مشاورت"
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 -mt-8">
      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.3;
          }
          
          #appointment-confirmation-content {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            transform: scale(0.75);
            transform-origin: top center;
            width: 100% !important;
            position: relative !important;
          }
          
          .appointment-card-hover {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          
          .grid {
            gap: 0.75rem !important;
          }
          
          .space-y-4 > * + * {
            margin-top: 0.75rem !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          
          .p-6 {
            padding: 1rem !important;
          }
          
          .p-8 {
            padding: 1.25rem !important;
          }
          
          .text-3xl {
            font-size: 1.5rem !important;
          }
          
          .text-xl {
            font-size: 1.125rem !important;
          }
          
          .text-lg {
            font-size: 1rem !important;
          }
          
          .flex.flex-col.sm\\:flex-row {
            display: none !important;
          }
          
          .h-20.w-20 {
            height: 3rem !important;
            width: 3rem !important;
          }
          
          .animate-pulse-glow,
          .animate-ping {
            animation: none !important;
          }
          
          @page {
            size: A4;
            margin: 0.5in;
          }
        }
      `}</style>
      <div id="appointment-confirmation-content">
      {/* Unified Success Header with Appointment Details */}
      <Card className="border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg appointment-success-glow appointment-card-hover">
        <CardContent className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src="/images/gonstead-logo-new.png" 
                alt="Gonstead Chiropractic Center Logo" 
                className="h-20 w-20 object-contain drop-shadow-lg animate-pulse-glow" 
              />
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-400 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-green-700 mb-2 font-poppins">
            {isUrdu ? "آپ کی ملاقات کی بکنگ مکمل ہو گئی!" : "Your Appointment Reservation Confirmed"}
          </h1>
          
          <p className="text-green-600 text-lg mb-4">
            {isUrdu 
              ? "گونستیڈ کائروپریکٹک سینٹر میں آپ کے پیشہ ورانہ علاج کی بکنگ کے لیے آپ کا بہت شکریہ"
              : "We extend our sincere appreciation for scheduling your professional treatment session at Gonstead Chiropractic Center"
            }
          </p>

          <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2 mb-6">
            <Star className="h-4 w-4 mr-2" />
            {isUrdu ? `آپ کا اپائنٹمنٹ نمبر: #${appointmentData.appointmentId || `APT${Date.now().toString().slice(-6)}`}` : `Your Appointment ID: #${appointmentData.appointmentId || `APT${Date.now().toString().slice(-6)}`}`}
          </Badge>
          
          {/* Appointment Details Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 mt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-700">
                {isUrdu ? "ملاقات کی تفصیلات اور قبل از آمد کی ہدایات" : "Appointment Information & Pre-Visit Guidelines"}
              </h2>
            </div>
            {/* Patient Details - integrated directly into the green background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 bg-white/30 rounded-lg border border-green-200">
                <User className="h-5 w-5 text-green-700" />
                <div>
                  <p className="text-sm text-green-600">{isUrdu ? "مریض کا نام" : "Patient Name"}</p>
                  <p className="font-semibold text-green-800">{appointmentData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/30 rounded-lg border border-green-200">
                <Phone className="h-5 w-5 text-green-700" />
                <div>
                  <p className="text-sm text-green-600">{isUrdu ? "فون نمبر" : "Phone Number"}</p>
                  <p className="font-semibold text-green-800">{appointmentData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/30 rounded-lg border border-green-200">
                <Stethoscope className="h-5 w-5 text-green-700" />
                <div>
                  <p className="text-sm text-green-600">{isUrdu ? "سیشن کی قسم" : "Session Type"}</p>
                  <p className="font-semibold text-green-800">
                    {sessionTypeDisplay[appointmentData.sessionType as keyof typeof sessionTypeDisplay][isUrdu ? 'ur' : 'en']}
                  </p>
                </div>
              </div>
              {appointmentData.preferredTime && (
                <div className="flex items-center gap-3 p-4 bg-white/30 rounded-lg border border-green-200">
                  <Clock className="h-5 w-5 text-green-700" />
                  <div>
                    <p className="text-sm text-green-600">{isUrdu ? "ترجیحی وقت" : "Preferred Time"}</p>
                    <p className="font-semibold text-green-800">{formatDateTime(appointmentData.preferredTime)}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6 bg-green-300" />

            {/* Pre-Visit Instructions - integrated into green theme */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-5 rounded-lg border border-green-300">
              <div className="mb-4">
                <p className="text-green-800 font-semibold text-lg mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isUrdu ? "اہم ہدایات" : "Important Instructions"}
                </p>
                <p className="text-green-700">
                  {isUrdu
                    ? "آپ کی میڈیکل تشخیص کے لیے براہ کرم متعلقہ تمام دستاویزات اور رپورٹس کو اپنے ساتھ لے کر تشریف لائیں۔ یہ ہمارے ماہر گونستیڈ کائروپریکٹک ڈاکٹر کو آپ کی بیماری کا بہترین علاج فراہم کرنے میں معاون ثابت ہوگا۔"
                    : "To ensure comprehensive medical assessment, please bring all pertinent documents and reports with you. This will assist our specialized Gonstead Chiropractic physician in delivering optimal therapeutic care for your condition."
                  }
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-green-200">
                  <Camera className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">
                      {isUrdu ? "حالیہ ایکس رے | Recent X-rays" : "Recent X-rays | حالیہ ایکس رے"}
                    </p>
                    <p className="text-sm text-green-600">
                      {isUrdu
                        ? "حالیہ ایکس رے، ایم آر آئی یا سی ٹی اسکین اگر دستیاب ہوں"
                        : "Any recent X-rays, MRI or CT scans if available"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-green-200">
                  <FileText className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">
                      {isUrdu ? "میڈیکل رپورٹس | Medical Reports" : "Medical Reports | میڈیکل رپورٹس"}
                    </p>
                    <p className="text-sm text-green-600">
                      {isUrdu
                        ? "کوئی بھی میڈیکل رپورٹس یا تشخیص کی دستاویزات"
                        : "Any medical reports or diagnosis documents"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-green-200">
                  <Stethoscope className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">
                      {isUrdu ? "پچھلے علاج کی تاریخ | Treatment History" : "Treatment History | پچھلے علاج کی تاریخ"}
                    </p>
                    <p className="text-sm text-green-600">
                      {isUrdu
                        ? "آپ کے پچھلے علاج کی تاریخ اور ادویات کی تفصیلات"
                        : "Your previous treatment history and medication details"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onBackToHome}
          variant="outline" 
          className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
        >
          <Heart className="h-4 w-4 mr-2" />
          {isUrdu ? "ہوم پیج پر واپس" : "Back to Home"}
        </Button>
        
        <Button 
          onClick={onNewAppointment}
          className="bg-[#2a9d8f] hover:bg-[#238a7a]"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {isUrdu ? "نئی اپائنٹمنٹ" : "Book New Appointment"}
        </Button>

        <Button 
          onClick={handlePrint}
          variant="outline"
          className="border-amber-400 text-amber-600 hover:bg-amber-400 hover:text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {isUrdu ? "پرنٹ کریں" : "Print Details"}
        </Button>

        <Button 
          onClick={downloadPDF}
          variant="outline"
          className="border-blue-400 text-blue-600 hover:bg-blue-400 hover:text-white"
        >
          <FileDown className="h-4 w-4 mr-2" />
          {isUrdu ? "PDF ڈاؤن لوڈ کریں" : "Download PDF"}
        </Button>
      </div>

      {/* Footer Message */}
      <Card className="confirmation-gradient-bg border-[#2a9d8f]/20">
        <CardContent className="text-center p-6">
          <p className="text-gray-600 mb-2">
            {isUrdu 
              ? "آپ کی ملاقات کی تصدیق کے لیے ہمارا عملہ جلد ہی آپ سے رابطہ کرے گا۔ آپ کی صحت اور بہبودی ہمارے لیے انتہائی اہم ہے۔"
              : "Our dedicated team will contact you promptly for appointment confirmation. Your health and well-being remain our paramount concern."
            }
          </p>
          <p className="text-sm text-gray-500">
            {isUrdu
              ? "گونستیڈ کائروپریکٹک سینٹر - ریڑھ کی ہڈی کی دیکھ بھال کے مختص ماہرین"
              : "Gonstead Chiropractic Center - Dedicated Specialists in Spinal Care Excellence"
            }
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
