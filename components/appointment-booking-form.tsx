'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, User, Phone, Mail, MapPin, Stethoscope, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface AppointmentData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  appointmentType: string
  preferredDate: Date | undefined
  preferredTime: string
  symptoms: string
  previousTreatment: string
  emergencyContact: string
  emergencyPhone: string
  insurance: string
  notes: string
}

interface AppointmentBookingFormProps {
  onSubmit: (data: AppointmentData) => void
  onClose: () => void
  prefilledData?: Partial<AppointmentData>
}

const appointmentTypes = [
  { value: 'consultation', label: 'Initial Consultation' },
  { value: 'follow-up', label: 'Follow-up Visit' },
  { value: 'adjustment', label: 'Chiropractic Adjustment' },
  { value: 'therapy', label: 'Physical Therapy' },
  { value: 'massage', label: 'Massage Therapy' },
  { value: 'x-ray', label: 'X-Ray Examination' },
  { value: 'emergency', label: 'Emergency Visit' }
]

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM'
]

export default function AppointmentBookingForm({ onSubmit, onClose, prefilledData }: AppointmentBookingFormProps) {
  const [formData, setFormData] = useState<AppointmentData>({
    firstName: prefilledData?.firstName || '',
    lastName: prefilledData?.lastName || '',
    email: prefilledData?.email || '',
    phone: prefilledData?.phone || '',
    dateOfBirth: prefilledData?.dateOfBirth || '',
    address: prefilledData?.address || '',
    city: prefilledData?.city || '',
    state: prefilledData?.state || '',
    zipCode: prefilledData?.zipCode || '',
    appointmentType: prefilledData?.appointmentType || '',
    preferredDate: prefilledData?.preferredDate,
    preferredTime: prefilledData?.preferredTime || '',
    symptoms: prefilledData?.symptoms || '',
    previousTreatment: prefilledData?.previousTreatment || '',
    emergencyContact: prefilledData?.emergencyContact || '',
    emergencyPhone: prefilledData?.emergencyPhone || '',
    insurance: prefilledData?.insurance || '',
    notes: prefilledData?.notes || ''
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof AppointmentData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'appointmentType']
      const missingFields = requiredFields.filter(field => !formData[field as keyof AppointmentData])
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`)
        setIsSubmitting(false)
        return
      }

      if (!formData.preferredDate) {
        toast.error('Please select a preferred date')
        setIsSubmitting(false)
        return
      }

      // Submit the appointment
      await onSubmit(formData)
      toast.success('Appointment booked successfully!')
      onClose()
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Failed to book appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          Book Your Appointment
        </CardTitle>
        <CardDescription>
          Step {currentStep} of 3 - Please fill in your information to schedule your appointment
        </CardDescription>
        
        {/* Clinic Schedule Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>CLINIC SCHEDULE NOTICE</strong>
            <p className="mt-1">Please note: Our clinic is closed on Sundays. Kindly schedule your appointments for Monday through Saturday.</p>
            <p className="mt-1"><strong>Operating Hours:</strong> Monday - Saturday | <strong>Closed:</strong> Sundays & Public Holidays</p>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Appointment Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Appointment Details</h3>
              </div>

              <div>
                <Label htmlFor="appointmentType">Appointment Type *</Label>
                <Select 
                  value={formData.appointmentType} 
                  onValueChange={(value) => handleInputChange('appointmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preferred Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.preferredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.preferredDate ? format(formData.preferredDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.preferredDate}
                      onSelect={(date) => handleInputChange('preferredDate', date)}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Select 
                  value={formData.preferredTime} 
                  onValueChange={(value) => handleInputChange('preferredTime', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="symptoms">Current Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  placeholder="Please describe your current symptoms or concerns"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="previousTreatment">Previous Treatment</Label>
                <Textarea
                  id="previousTreatment"
                  value={formData.previousTreatment}
                  onChange={(e) => handleInputChange('previousTreatment', e.target.value)}
                  placeholder="Any previous treatments or therapies you've had"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Additional Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="insurance">Insurance Provider</Label>
                <Input
                  id="insurance"
                  value={formData.insurance}
                  onChange={(e) => handleInputChange('insurance', e.target.value)}
                  placeholder="Your insurance provider"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information you'd like to share"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
          
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Booking...' : 'Book Appointment'}
              </Button>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
