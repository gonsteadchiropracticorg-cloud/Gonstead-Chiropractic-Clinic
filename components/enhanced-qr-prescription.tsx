"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, QrCode, Copy, Download, Eye, CheckCircle2 } from 'lucide-react'
import { PrescriptionData } from '@/lib/prescription-types'

interface EnhancedQRPrescriptionProps {
  prescription: PrescriptionData
  showActions?: boolean
  className?: string
}

export function EnhancedQRPrescription({ prescription, showActions = true, className = "" }: EnhancedQRPrescriptionProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [textData, setTextData] = useState<string>('')
  const [qrError, setQrError] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('qr')
  
  useEffect(() => {
    generateEnhancedQR()
  }, [prescription])

  const generateEnhancedQR = async () => {
    try {
      // Create comprehensive prescription data that includes all required fields
      const prescriptionQRData = {
        prescription_id: prescription.id,
        patient_id: prescription.patient_id,
        patient_name: prescription.patient_name,
        phone_number: prescription.patient_phone,
        appointment_id: prescription.appointment_id,
        doctor_name: prescription.doctor_name,
        clinic_name: prescription.clinic_name,
        visit_date: prescription.visit_date,
        treatment_plan: prescription.treatment_plan,
        prescribed_medicine: prescription.prescribed_medicine,
        generated_at: new Date().toISOString(),
        type: 'prescription_qr',
        version: '3.0'
      }

      const jsonData = JSON.stringify(prescriptionQRData, null, 2)
      setTextData(jsonData)

      // Try to generate QR code using multiple approaches
      await generateQRCode(jsonData)
      
    } catch (error) {
      console.error('Error generating QR code:', error)
      setQrError('QR code generation failed. Using text format instead.')
      setActiveTab('text')
    }
  }

  const generateQRCode = async (data: string) => {
    try {
      // Method 1: Try using qrcode library if available
      if (typeof window !== 'undefined' && (window as any).QRCode) {
        const qrCodeLib = (window as any).QRCode
        const canvas = document.createElement('canvas')
        await qrCodeLib.toCanvas(canvas, data, {
          errorCorrectionLevel: 'M',
          width: 300,
          margin: 2,
          color: {
            dark: '#245064',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(canvas.toDataURL())
        return
      }

      // Method 2: Use online QR API as fallback
      const encodedData = encodeURIComponent(data)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&color=245064&bgcolor=FFFFFF`
      
      // Test if the image loads
      const img = new Image()
      img.onload = () => {
        setQrCodeDataUrl(qrUrl)
      }
      img.onerror = () => {
        throw new Error('Failed to load QR code from API')
      }
      img.src = qrUrl

    } catch (error) {
      console.error('QR generation failed:', error)
      setQrError('Could not generate QR code image')
      setActiveTab('text')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      // Fallback for older browsers
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
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `prescription-${prescription.id}-qr.png`
      link.href = qrCodeDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getFormattedTextData = () => {
    return `
PRESCRIPTION DETAILS
====================
Prescription ID: ${prescription.id}
Patient ID: ${prescription.patient_id}
Patient Name: ${prescription.patient_name}
Phone Number: ${prescription.patient_phone}
Appointment ID: ${prescription.appointment_id}
Doctor: ${prescription.doctor_name}
Clinic: ${prescription.clinic_name}
Visit Date: ${prescription.visit_date}
Generated: ${new Date().toLocaleString()}
====================

Treatment Plan:
${prescription.treatment_plan || 'Not specified'}

Prescribed Medicine:
${prescription.prescribed_medicine || 'Not specified'}

====================
GONSTEAD CHIROPRACTIC CLINIC
Near Peshawar Model School, Tehsil Road Nowshera, KPK
Phone: +923046996267
====================
    `.trim()
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#245064] to-[#2e6478] text-white">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Prescription QR Code - Enhanced
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Text Format
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qr" className="space-y-4">
              <div className="text-center">
                {qrError ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-800 text-sm mb-2">{qrError}</p>
                    <Button 
                      onClick={() => setActiveTab('text')} 
                      variant="outline" 
                      size="sm"
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      View Text Format Instead
                    </Button>
                  </div>
                ) : qrCodeDataUrl ? (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Prescription QR Code" 
                        className="mx-auto block"
                        style={{ maxWidth: '300px', height: 'auto' }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 max-w-md mx-auto">
                      <p><strong>✅ QR Code Generated Successfully!</strong></p>
                      <p>Scan with any QR code reader to view prescription details including:</p>
                      <ul className="text-left mt-2 space-y-1">
                        <li>• Prescription ID: {prescription.id}</li>
                        <li>• Patient ID: {prescription.patient_id}</li>
                        <li>• Patient Name: {prescription.patient_name}</li>
                        <li>• Phone: {prescription.patient_phone}</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="animate-pulse">
                      <div className="bg-blue-200 h-64 w-64 mx-auto rounded-lg mb-4"></div>
                      <p className="text-blue-700">Generating QR code...</p>
                    </div>
                  </div>
                )}
              </div>

              {showActions && qrCodeDataUrl && (
                <div className="flex justify-center gap-2">
                  <Button onClick={downloadQR} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                  <Button 
                    onClick={() => copyToClipboard(textData)} 
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
              )}
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Prescription Details (Text Format)
                </h3>
                <div className="bg-white border border-gray-300 rounded p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {getFormattedTextData()}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Raw JSON Data (for QR scanning):</h4>
                <div className="bg-white border border-blue-300 rounded p-3 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-blue-900 whitespace-pre-wrap">
                    {textData}
                  </pre>
                </div>
              </div>

              {showActions && (
                <div className="flex justify-center gap-2">
                  <Button 
                    onClick={() => copyToClipboard(getFormattedTextData())} 
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
                        Copy Text
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => copyToClipboard(textData)} 
                    variant="outline" 
                    size="sm"
                  >
                    Copy JSON Data
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 text-sm mb-2">✅ Key Features:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Always works:</strong> Text format available if QR fails</li>
              <li>• <strong>Complete data:</strong> Includes prescription ID, patient ID, name, phone</li>
              <li>• <strong>Multiple formats:</strong> QR code and readable text</li>
              <li>• <strong>Easy sharing:</strong> Copy and download options</li>
              <li>• <strong>Scanner compatible:</strong> Works with any QR scanner app</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
